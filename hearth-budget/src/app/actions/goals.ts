'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function getHouseholdId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single()

  if (!member) redirect('/onboarding')

  return { supabase, user, householdId: member.household_id }
}

export type GoalTemplate = {
  id: string
  name: string
  description: string
  category: string
  target_formula: string
  default_priority: number
  source_citations: Array<{ name: string; year: number | null; url: string | null; note?: string }>
}

export type GoalWithLinks = {
  id: string
  household_id: string
  name: string
  target_amount: number
  target_date: string | null
  template_id: string | null
  computed_target: boolean
  priority: number
  created_at: string
  linked_account_id: string | null
  goal_account_links: Array<{
    account_id: string
    include_balance: boolean
    accounts: {
      id: string
      name: string
      type: string
      starting_balance: number
      contribution_status: string
    }
  }>
}

export async function getGoalTemplates(): Promise<{
  data: GoalTemplate[]
  error?: string
}> {
  const { supabase } = await getHouseholdId()

  const { data, error } = await supabase
    .from('goal_templates')
    .select('*')
    .order('default_priority')

  if (error) return { data: [], error: error.message }
  return {
    data: (data ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category ?? 'other',
      target_formula: t.target_formula ?? '',
      default_priority: t.default_priority ?? 0,
      source_citations: (t.source_citations ?? []) as GoalTemplate['source_citations'],
    })),
  }
}

export async function getGoals(): Promise<{
  data: GoalWithLinks[]
  error?: string
}> {
  const { supabase, householdId } = await getHouseholdId()

  const { data, error } = await supabase
    .from('savings_goals')
    .select('*, goal_account_links(account_id, include_balance, accounts(id, name, type, starting_balance, contribution_status))')
    .eq('household_id', householdId)
    .order('priority')
    .order('created_at')

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as GoalWithLinks[] }
}

export async function createGoal(input: {
  name: string
  target_amount: number
  target_date?: string | null
  template_id?: string | null
  computed_target?: boolean
  priority?: number
  linked_account_ids?: string[]
}): Promise<{ data?: { id: string }; error?: string }> {
  const { supabase, householdId } = await getHouseholdId()

  const { data: goal, error } = await supabase
    .from('savings_goals')
    .insert({
      household_id: householdId,
      name: input.name,
      target_amount: input.target_amount,
      target_date: input.target_date ?? null,
      template_id: input.template_id ?? null,
      computed_target: input.computed_target ?? false,
      priority: input.priority ?? 0,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  if (input.linked_account_ids?.length) {
    const links = input.linked_account_ids.map((account_id) => ({
      goal_id: goal.id,
      account_id,
      include_balance: true,
    }))
    const { error: linkError } = await supabase
      .from('goal_account_links')
      .insert(links)
    if (linkError) return { error: linkError.message }
  }

  revalidatePath('/app/goals')
  return { data: { id: goal.id } }
}

export async function updateGoal(
  goalId: string,
  input: {
    name?: string
    target_amount?: number
    target_date?: string | null
    computed_target?: boolean
    priority?: number
  }
): Promise<{ error?: string }> {
  const { supabase, householdId } = await getHouseholdId()

  const { error } = await supabase
    .from('savings_goals')
    .update(input)
    .eq('id', goalId)
    .eq('household_id', householdId)

  if (error) return { error: error.message }

  revalidatePath('/app/goals')
  return {}
}

export async function deleteGoal(goalId: string): Promise<{ error?: string }> {
  const { supabase, householdId } = await getHouseholdId()

  const { error } = await supabase
    .from('savings_goals')
    .delete()
    .eq('id', goalId)
    .eq('household_id', householdId)

  if (error) return { error: error.message }

  revalidatePath('/app/goals')
  return {}
}

export async function linkAccountsToGoal(
  goalId: string,
  accountIds: string[]
): Promise<{ error?: string }> {
  const { supabase } = await getHouseholdId()

  // Remove existing links
  await supabase
    .from('goal_account_links')
    .delete()
    .eq('goal_id', goalId)

  if (accountIds.length === 0) {
    revalidatePath('/app/goals')
    return {}
  }

  const links = accountIds.map((account_id) => ({
    goal_id: goalId,
    account_id,
    include_balance: true,
  }))

  const { error } = await supabase
    .from('goal_account_links')
    .insert(links)

  if (error) return { error: error.message }

  revalidatePath('/app/goals')
  return {}
}

export async function getMonthlyEssentialExpenses(): Promise<{
  data: { monthly_average: number; months_of_data: number; total_days: number }
  error?: string
}> {
  const { supabase, householdId } = await getHouseholdId()

  // Get essential categories
  const { data: essentialCats } = await supabase
    .from('categories')
    .select('id')
    .eq('household_id', householdId)
    .eq('is_essential', true)

  if (!essentialCats?.length) {
    return { data: { monthly_average: 0, months_of_data: 0, total_days: 0 } }
  }

  const catIds = essentialCats.map((c) => c.id)

  // Get transactions from last 3 complete months
  const now = new Date()
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const { data: txns, error } = await supabase
    .from('transactions')
    .select('amount, occurred_on')
    .eq('household_id', householdId)
    .in('category_id', catIds)
    .gte('occurred_on', threeMonthsAgo.toISOString().split('T')[0])
    .lte('occurred_on', endOfLastMonth.toISOString().split('T')[0])
    .lt('amount', 0) // expenses are negative

  if (error) return { data: { monthly_average: 0, months_of_data: 0, total_days: 0 }, error: error.message }

  const totalSpent = (txns ?? []).reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

  // Calculate actual days covered
  const dates = (txns ?? []).map((t) => new Date(t.occurred_on))
  let totalDays = 0
  let monthsOfData = 0

  if (dates.length > 0) {
    const earliest = new Date(Math.min(...dates.map((d) => d.getTime())))
    const latest = endOfLastMonth
    totalDays = Math.max(1, Math.round((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24)))
    monthsOfData = Math.min(3, totalDays / 30)
  }

  const monthlyAverage = monthsOfData > 0 ? totalSpent / monthsOfData : 0

  return {
    data: {
      monthly_average: Math.round(monthlyAverage * 100) / 100,
      months_of_data: Math.round(monthsOfData * 10) / 10,
      total_days: totalDays,
    },
  }
}

export async function getHouseholdProfile(): Promise<{
  data: {
    annual_gross_income: number | null
    primary_age: number | null
    partner_age: number | null
  }
  error?: string
}> {
  const { supabase, householdId } = await getHouseholdId()

  const { data, error } = await supabase
    .from('households')
    .select('annual_gross_income, primary_age, partner_age')
    .eq('id', householdId)
    .single()

  if (error) return { data: { annual_gross_income: null, primary_age: null, partner_age: null }, error: error.message }

  return { data }
}

export async function updateHouseholdProfile(input: {
  annual_gross_income?: number | null
  primary_age?: number | null
  partner_age?: number | null
}): Promise<{ error?: string }> {
  const { supabase, householdId } = await getHouseholdId()

  const { error } = await supabase
    .from('households')
    .update(input)
    .eq('id', householdId)

  if (error) return { error: error.message }

  revalidatePath('/app/goals')
  return {}
}

export async function getFinancialReferences(): Promise<{
  data: Array<{
    id: string
    category: string
    name: string
    summary: string
    pros: string[] | null
    cons: string[] | null
    source_name: string
    source_url: string
    source_date: string | null
    updated_at: string
  }>
  error?: string
}> {
  const { supabase } = await getHouseholdId()

  const { data, error } = await supabase
    .from('financial_reference')
    .select('*')
    .order('category')
    .order('name')

  if (error) return { data: [], error: error.message }
  return {
    data: (data ?? []).map((r) => ({
      id: r.id,
      category: r.category ?? 'other',
      name: r.name ?? '',
      summary: r.summary ?? '',
      pros: (r.pros ?? null) as string[] | null,
      cons: (r.cons ?? null) as string[] | null,
      source_name: r.source_name ?? '',
      source_url: r.source_url ?? '',
      source_date: r.source_date,
      updated_at: r.updated_at ?? '',
    })),
  }
}

export async function getAccountBalances(accountIds: string[]): Promise<{
  data: Record<string, number>
  error?: string
}> {
  if (accountIds.length === 0) return { data: {} }

  const { supabase, householdId } = await getHouseholdId()

  // Get starting balances
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, starting_balance')
    .eq('household_id', householdId)
    .in('id', accountIds)

  if (!accounts) return { data: {} }

  // Get transaction sums per account
  const balances: Record<string, number> = {}

  for (const acct of accounts) {
    const { data: txnSum } = await supabase
      .from('transactions')
      .select('amount')
      .eq('account_id', acct.id)
      .eq('household_id', householdId)

    const txTotal = (txnSum ?? []).reduce((sum, t) => sum + Number(t.amount), 0)
    balances[acct.id] = Number(acct.starting_balance) + txTotal
  }

  return { data: balances }
}

export async function getYtdContributions(accountId: string): Promise<{
  data: { ytd_amount: number; year: number }
  error?: string
}> {
  const { supabase, householdId } = await getHouseholdId()

  const year = new Date().getFullYear()
  const startOfYear = `${year}-01-01`
  const endOfYear = `${year}-12-31`

  // Sum positive transactions (contributions/transfers in) for this account this year
  const { data: txns, error } = await supabase
    .from('transactions')
    .select('amount')
    .eq('account_id', accountId)
    .eq('household_id', householdId)
    .gte('occurred_on', startOfYear)
    .lte('occurred_on', endOfYear)
    .gt('amount', 0) // positive = money in

  if (error) return { data: { ytd_amount: 0, year }, error: error.message }

  const total = (txns ?? []).reduce((sum, t) => sum + Number(t.amount), 0)
  return { data: { ytd_amount: Math.round(total * 100) / 100, year } }
}

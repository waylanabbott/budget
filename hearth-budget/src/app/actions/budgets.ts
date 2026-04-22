'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
} from 'date-fns'

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

export type BudgetWithSpent = {
  id: string
  category_id: string
  category_name: string
  category_icon: string | null
  category_color: string | null
  amount: number
  spent: number
  spentByPerson: Record<string, number>
}

export async function getBudgetsWithSpending(month?: string): Promise<{
  data: BudgetWithSpent[]
  month: string
  error?: string
}> {
  const { supabase, householdId } = await getHouseholdId()

  const targetDate = month ? new Date(month + '-01') : new Date()
  const monthStart = format(startOfMonth(targetDate), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(targetDate), 'yyyy-MM-dd')
  const monthStr = format(targetDate, 'yyyy-MM')

  const { data: budgets, error: budgetError } = await supabase
    .from('budgets')
    .select('id, category_id, amount, categories(name, icon, color)')
    .eq('household_id', householdId)
    .eq('period', 'monthly')
    .lte('effective_from', monthEnd)
    .or(`effective_to.is.null,effective_to.gte.${monthStart}`)
    .order('amount', { ascending: false })

  if (budgetError) return { data: [], month: monthStr, error: budgetError.message }
  if (!budgets || budgets.length === 0) return { data: [], month: monthStr }

  const categoryIds = budgets.map((b) => b.category_id)

  const { data: spendRows, error: spendError } = await supabase
    .from('transactions')
    .select('category_id, amount, entered_by')
    .eq('household_id', householdId)
    .in('category_id', categoryIds)
    .gte('occurred_on', monthStart)
    .lte('occurred_on', monthEnd)

  if (spendError) return { data: [], month: monthStr, error: spendError.message }

  const spentByCategory = new Map<string, number>()
  const spentByCategoryPerson = new Map<string, Record<string, number>>()
  for (const row of spendRows ?? []) {
    if (!row.category_id) continue
    const amt = Math.abs(row.amount)
    spentByCategory.set(row.category_id, (spentByCategory.get(row.category_id) ?? 0) + amt)
    const personMap = spentByCategoryPerson.get(row.category_id) ?? {}
    personMap[row.entered_by] = (personMap[row.entered_by] ?? 0) + amt
    spentByCategoryPerson.set(row.category_id, personMap)
  }

  const result: BudgetWithSpent[] = budgets.map((b) => {
    const cat = b.categories as unknown as { name: string; icon: string | null; color: string | null } | null
    return {
      id: b.id,
      category_id: b.category_id,
      category_name: cat?.name ?? 'Unknown',
      category_icon: cat?.icon ?? null,
      category_color: cat?.color ?? null,
      amount: b.amount,
      spent: spentByCategory.get(b.category_id) ?? 0,
      spentByPerson: spentByCategoryPerson.get(b.category_id) ?? {},
    }
  })

  return { data: result, month: monthStr }
}

export async function upsertBudget(input: {
  category_id: string
  amount: number
  month: string
}): Promise<{ error?: string }> {
  if (input.amount < 0) return { error: 'Amount must be non-negative.' }

  const { supabase, householdId } = await getHouseholdId()

  const effectiveFrom = input.month + '-01'

  const { data: existing } = await supabase
    .from('budgets')
    .select('id')
    .eq('household_id', householdId)
    .eq('category_id', input.category_id)
    .eq('period', 'monthly')
    .eq('effective_from', effectiveFrom)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('budgets')
      .update({ amount: input.amount })
      .eq('id', existing.id)

    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('budgets')
      .insert({
        household_id: householdId,
        category_id: input.category_id,
        period: 'monthly',
        amount: input.amount,
        effective_from: effectiveFrom,
      })

    if (error) return { error: error.message }
  }

  revalidatePath('/app/budgets')
  revalidatePath('/app/dashboard')
  return {}
}

export async function deleteBudget(budgetId: string): Promise<{ error?: string }> {
  const { supabase, householdId } = await getHouseholdId()

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', budgetId)
    .eq('household_id', householdId)

  if (error) return { error: error.message }

  revalidatePath('/app/budgets')
  revalidatePath('/app/dashboard')
  return {}
}

export async function copyLastMonthBudgets(targetMonth: string): Promise<{
  copied: number
  error?: string
}> {
  const { supabase, householdId } = await getHouseholdId()

  const targetDate = new Date(targetMonth + '-01')
  const prevDate = subMonths(targetDate, 1)
  const prevStart = format(startOfMonth(prevDate), 'yyyy-MM-dd')
  const prevEnd = format(endOfMonth(prevDate), 'yyyy-MM-dd')
  const targetStart = format(startOfMonth(targetDate), 'yyyy-MM-dd')

  const { data: prevBudgets, error: fetchError } = await supabase
    .from('budgets')
    .select('category_id, amount')
    .eq('household_id', householdId)
    .eq('period', 'monthly')
    .lte('effective_from', prevEnd)
    .or(`effective_to.is.null,effective_to.gte.${prevStart}`)

  if (fetchError) return { copied: 0, error: fetchError.message }
  if (!prevBudgets || prevBudgets.length === 0) {
    return { copied: 0, error: 'No budgets found for last month.' }
  }

  const { data: existingTarget } = await supabase
    .from('budgets')
    .select('category_id')
    .eq('household_id', householdId)
    .eq('period', 'monthly')
    .eq('effective_from', targetStart)

  const existingCategoryIds = new Set(
    (existingTarget ?? []).map((b) => b.category_id)
  )

  const toInsert = prevBudgets
    .filter((b) => !existingCategoryIds.has(b.category_id))
    .map((b) => ({
      household_id: householdId,
      category_id: b.category_id,
      period: 'monthly' as const,
      amount: b.amount,
      effective_from: targetStart,
    }))

  if (toInsert.length === 0) {
    return { copied: 0, error: 'All categories already have budgets for this month.' }
  }

  const { error: insertError } = await supabase
    .from('budgets')
    .insert(toInsert)

  if (insertError) return { copied: 0, error: insertError.message }

  revalidatePath('/app/budgets')
  revalidatePath('/app/dashboard')
  return { copied: toInsert.length }
}

export async function getUnbudgetedCategories(month: string): Promise<{
  data: Array<{ id: string; name: string; icon: string | null; color: string | null }>
  error?: string
}> {
  const { supabase, householdId } = await getHouseholdId()

  const monthStart = month + '-01'
  const targetDate = new Date(monthStart)
  const monthEnd = format(endOfMonth(targetDate), 'yyyy-MM-dd')

  const [catResult, budgetResult] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, icon, color')
      .eq('household_id', householdId)
      .eq('is_income', false)
      .is('archived_at', null)
      .order('sort_order'),
    supabase
      .from('budgets')
      .select('category_id')
      .eq('household_id', householdId)
      .eq('period', 'monthly')
      .lte('effective_from', monthEnd)
      .or(`effective_to.is.null,effective_to.gte.${monthStart}`),
  ])

  if (catResult.error) return { data: [], error: catResult.error.message }

  const budgetedIds = new Set(
    (budgetResult.data ?? []).map((b) => b.category_id)
  )

  const unbudgeted = (catResult.data ?? []).filter(
    (c) => !budgetedIds.has(c.id)
  )

  return { data: unbudgeted }
}

export type PersonSpending = {
  userId: string
  displayName: string
  spent: number
  transactionCount: number
}

export async function getSpendingByPerson(month?: string): Promise<{
  data: PersonSpending[]
  currentUserId: string
  error?: string
}> {
  const { supabase, user, householdId } = await getHouseholdId()

  const targetDate = month ? new Date(month + '-01') : new Date()
  const monthStart = format(startOfMonth(targetDate), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(targetDate), 'yyyy-MM-dd')

  const [txResult, membersResult] = await Promise.all([
    supabase
      .from('transactions')
      .select('entered_by, amount, categories(is_income)')
      .eq('household_id', householdId)
      .gte('occurred_on', monthStart)
      .lte('occurred_on', monthEnd),
    supabase
      .from('household_members')
      .select('user_id, display_name')
      .eq('household_id', householdId),
  ])

  if (txResult.error) return { data: [], currentUserId: user.id, error: txResult.error.message }

  const nameMap: Record<string, string> = {}
  for (const m of membersResult.data ?? []) {
    nameMap[m.user_id] = m.display_name ?? 'Unknown'
  }

  const personMap: Record<string, { spent: number; count: number }> = {}
  for (const m of membersResult.data ?? []) {
    personMap[m.user_id] = { spent: 0, count: 0 }
  }

  for (const tx of txResult.data ?? []) {
    const cat = tx.categories as { is_income: boolean } | null
    if (cat?.is_income) continue
    const entry = personMap[tx.entered_by]
    if (entry) {
      entry.spent += Math.abs(Number(tx.amount))
      entry.count += 1
    }
  }

  const result: PersonSpending[] = Object.entries(personMap).map(([userId, data]) => ({
    userId,
    displayName: nameMap[userId] ?? 'Unknown',
    spent: Math.round(data.spent * 100) / 100,
    transactionCount: data.count,
  }))

  result.sort((a, b) => b.spent - a.spent)

  return { data: result, currentUserId: user.id }
}

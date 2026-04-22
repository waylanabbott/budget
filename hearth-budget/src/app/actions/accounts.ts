'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { accountSchema, type AccountInput } from '@/lib/schemas/accounts'

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

export async function getAccounts(): Promise<{
  data: Array<{
    id: string
    household_id: string
    name: string
    type: string
    starting_balance: number
    is_archived: boolean
    contribution_status: string | null
    created_at: string
  }>
  error?: string
}> {
  const { supabase, householdId } = await getHouseholdId()

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('household_id', householdId)
    .order('is_archived')
    .order('name')

  if (error) return { data: [], error: error.message }

  return { data: data ?? [] }
}

export async function createAccount(
  input: AccountInput
): Promise<{ error?: string }> {
  const result = accountSchema.safeParse(input)
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const { supabase, householdId } = await getHouseholdId()

  const { error } = await supabase.from('accounts').insert({
    household_id: householdId,
    name: result.data.name,
    type: result.data.type,
    starting_balance: result.data.starting_balance,
  })

  if (error) return { error: error.message }

  revalidatePath('/app/accounts')
  return {}
}

export async function updateAccount(
  id: string,
  input: AccountInput
): Promise<{ error?: string }> {
  const result = accountSchema.safeParse(input)
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const { supabase, householdId } = await getHouseholdId()

  const { error } = await supabase
    .from('accounts')
    .update({
      name: result.data.name,
      type: result.data.type,
      starting_balance: result.data.starting_balance,
    })
    .eq('id', id)
    .eq('household_id', householdId)

  if (error) return { error: error.message }

  revalidatePath('/app/accounts')
  return {}
}

export async function getAccountCurrentBalances(): Promise<{
  data: Record<string, number>
  error?: string
}> {
  const { supabase, householdId } = await getHouseholdId()

  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, starting_balance')
    .eq('household_id', householdId)

  if (!accounts) return { data: {} }

  const { data: txns } = await supabase
    .from('transactions')
    .select('account_id, amount')
    .eq('household_id', householdId)

  const balances: Record<string, number> = {}
  for (const acct of accounts) {
    balances[acct.id] = Number(acct.starting_balance) || 0
  }
  for (const tx of txns ?? []) {
    if (balances[tx.account_id] !== undefined) {
      balances[tx.account_id] = balances[tx.account_id]! + Number(tx.amount)
    }
  }

  return { data: balances }
}

export async function archiveAccount(
  id: string
): Promise<{ error?: string }> {
  const { supabase, householdId } = await getHouseholdId()

  const { error } = await supabase
    .from('accounts')
    .update({ is_archived: true })
    .eq('id', id)
    .eq('household_id', householdId)

  if (error) return { error: error.message }

  revalidatePath('/app/accounts')
  return {}
}

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

export type RecurringBillRow = {
  id: string
  name: string
  amount: number
  cadence: string
  next_due_date: string | null
  category_id: string | null
  account_id: string | null
  category_name: string | null
  account_name: string | null
}

export async function getRecurringBills(): Promise<{
  data: RecurringBillRow[]
  error?: string
}> {
  const { supabase, householdId } = await getHouseholdId()

  const { data, error } = await supabase
    .from('recurring_bills')
    .select('*, categories(name), accounts(name)')
    .eq('household_id', householdId)
    .order('next_due_date', { ascending: true, nullsFirst: false })

  if (error) return { data: [], error: error.message }

  const rows: RecurringBillRow[] = (data ?? []).map((b) => {
    const cat = b.categories as { name: string } | null
    const acct = b.accounts as { name: string } | null
    return {
      id: b.id,
      name: b.name,
      amount: b.amount,
      cadence: b.cadence,
      next_due_date: b.next_due_date,
      category_id: b.category_id,
      account_id: b.account_id,
      category_name: cat?.name ?? null,
      account_name: acct?.name ?? null,
    }
  })

  return { data: rows }
}

export type RecurringBillInput = {
  name: string
  amount: number
  cadence: string
  next_due_date: string | null
  category_id: string | null
  account_id: string | null
}

const VALID_CADENCES = ['weekly', 'biweekly', 'monthly', 'yearly']

export async function createRecurringBill(
  input: RecurringBillInput
): Promise<{ error?: string }> {
  if (!input.name.trim()) return { error: 'Name is required.' }
  if (input.amount <= 0) return { error: 'Amount must be positive.' }
  if (!VALID_CADENCES.includes(input.cadence)) return { error: 'Invalid cadence.' }

  const { supabase, householdId } = await getHouseholdId()

  const { error } = await supabase.from('recurring_bills').insert({
    household_id: householdId,
    name: input.name.trim(),
    amount: input.amount,
    cadence: input.cadence,
    next_due_date: input.next_due_date || null,
    category_id: input.category_id || null,
    account_id: input.account_id || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/app/recurring-bills')
  revalidatePath('/app/forecast')
  return {}
}

export async function updateRecurringBill(
  id: string,
  input: RecurringBillInput
): Promise<{ error?: string }> {
  if (!input.name.trim()) return { error: 'Name is required.' }
  if (input.amount <= 0) return { error: 'Amount must be positive.' }
  if (!VALID_CADENCES.includes(input.cadence)) return { error: 'Invalid cadence.' }

  const { supabase, householdId } = await getHouseholdId()

  const { error } = await supabase
    .from('recurring_bills')
    .update({
      name: input.name.trim(),
      amount: input.amount,
      cadence: input.cadence,
      next_due_date: input.next_due_date || null,
      category_id: input.category_id || null,
      account_id: input.account_id || null,
    })
    .eq('id', id)
    .eq('household_id', householdId)

  if (error) return { error: error.message }

  revalidatePath('/app/recurring-bills')
  revalidatePath('/app/forecast')
  return {}
}

export async function deleteRecurringBill(
  id: string
): Promise<{ error?: string }> {
  const { supabase, householdId } = await getHouseholdId()

  const { error } = await supabase
    .from('recurring_bills')
    .delete()
    .eq('id', id)
    .eq('household_id', householdId)

  if (error) return { error: error.message }

  revalidatePath('/app/recurring-bills')
  revalidatePath('/app/forecast')
  return {}
}

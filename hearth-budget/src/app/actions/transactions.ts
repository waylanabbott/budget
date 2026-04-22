'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  transactionSchema,
  type TransactionInput,
} from '@/lib/schemas/transactions'

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

export async function createTransaction(
  input: TransactionInput
): Promise<{ error?: string }> {
  const result = transactionSchema.safeParse(input)
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const { supabase, user, householdId } = await getHouseholdId()

  const { error } = await supabase.from('transactions').insert({
    household_id: householdId,
    account_id: result.data.account_id,
    category_id: result.data.category_id ?? null,
    entered_by: user.id,
    amount: result.data.amount,
    occurred_on: result.data.occurred_on,
    merchant: result.data.merchant ?? null,
    notes: result.data.notes ?? null,
    source: 'manual',
  })

  if (error) return { error: error.message }

  revalidatePath('/app/transactions')
  return {}
}

export async function updateTransaction(
  id: string,
  input: TransactionInput
): Promise<{ error?: string }> {
  const result = transactionSchema.safeParse(input)
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const { supabase, householdId } = await getHouseholdId()

  const { error } = await supabase
    .from('transactions')
    .update({
      account_id: result.data.account_id,
      category_id: result.data.category_id ?? null,
      amount: result.data.amount,
      occurred_on: result.data.occurred_on,
      merchant: result.data.merchant ?? null,
      notes: result.data.notes ?? null,
    })
    .eq('id', id)
    .eq('household_id', householdId)

  if (error) return { error: error.message }

  revalidatePath('/app/transactions')
  return {}
}

export async function deleteTransaction(
  id: string
): Promise<{ error?: string }> {
  const { supabase, householdId } = await getHouseholdId()

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('household_id', householdId)

  if (error) return { error: error.message }

  revalidatePath('/app/transactions')
  return {}
}

export async function getTransactions(params: {
  cursor?: string
  limit?: number
  search?: string
  account_id?: string
  category_id?: string
  entered_by?: string
  date_from?: string
  date_to?: string
}): Promise<{
  data: Array<{
    id: string
    household_id: string
    account_id: string
    category_id: string | null
    entered_by: string
    amount: number
    occurred_on: string
    merchant: string | null
    notes: string | null
    source: string
    external_id: string | null
    external_hash: string | null
    import_id: string | null
    created_at: string
    updated_at: string
    categories: {
      name: string
      icon: string | null
      color: string | null
      is_income: boolean
    } | null
    accounts: { name: string } | null
  }>
  nextCursor: string | null
  error?: string
}> {
  const { supabase, householdId } = await getHouseholdId()
  const limit = params.limit ?? 20

  let query = supabase
    .from('transactions')
    .select('*, categories(name, icon, color, is_income), accounts(name)')
    .eq('household_id', householdId)
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1) // fetch one extra to determine if there's a next page

  // Apply cursor (keyset pagination on occurred_on|id, matching primary sort)
  if (params.cursor) {
    const [cursorDate, cursorId] = params.cursor.split('|')
    query = query.or(
      `occurred_on.lt.${cursorDate},and(occurred_on.eq.${cursorDate},id.lt.${cursorId})`
    )
  }

  // Apply filters
  if (params.account_id) {
    query = query.eq('account_id', params.account_id)
  }

  if (params.category_id) {
    query = query.eq('category_id', params.category_id)
  }

  if (params.entered_by) {
    query = query.eq('entered_by', params.entered_by)
  }

  if (params.date_from) {
    query = query.gte('occurred_on', params.date_from)
  }

  if (params.date_to) {
    query = query.lte('occurred_on', params.date_to)
  }

  if (params.search) {
    query = query.ilike('merchant', `%${params.search}%`)
  }

  const { data, error } = await query

  if (error) return { data: [], nextCursor: null, error: error.message }

  const rows = data ?? []
  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows
  const lastItem = items[items.length - 1]
  const nextCursor = hasMore && lastItem
    ? `${lastItem.occurred_on}|${lastItem.id}`
    : null

  return { data: items, nextCursor }
}

export async function searchMerchants(
  query: string
): Promise<{ data: string[]; error?: string }> {
  if (!query || query.length < 2) return { data: [] }

  const { supabase, householdId } = await getHouseholdId()

  const { data, error } = await supabase
    .from('transactions')
    .select('merchant')
    .eq('household_id', householdId)
    .not('merchant', 'is', null)
    .ilike('merchant', `%${query}%`)
    .limit(50)

  if (error) return { data: [], error: error.message }

  // Deduplicate and limit to 10
  const unique = [...new Set((data ?? []).map((r) => r.merchant).filter(Boolean))] as string[]
  return { data: unique.slice(0, 10) }
}

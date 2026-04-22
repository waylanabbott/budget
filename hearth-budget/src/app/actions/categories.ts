'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { categorySchema, type CategoryInput } from '@/lib/schemas/categories'

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

export async function getCategories(): Promise<{
  data: Array<{
    id: string
    household_id: string
    name: string
    parent_id: string | null
    icon: string | null
    color: string | null
    is_income: boolean
    is_essential: boolean | null
    sort_order: number
    archived_at: string | null
  }>
  error?: string
}> {
  const { supabase, householdId } = await getHouseholdId()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('household_id', householdId)
    .is('archived_at', null)
    .order('sort_order')

  if (error) return { data: [], error: error.message }

  return { data: data ?? [] }
}

export async function getAllCategories(): Promise<{
  data: Array<{
    id: string
    household_id: string
    name: string
    parent_id: string | null
    icon: string | null
    color: string | null
    is_income: boolean
    is_essential: boolean | null
    sort_order: number
    archived_at: string | null
  }>
  error?: string
}> {
  const { supabase, householdId } = await getHouseholdId()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('household_id', householdId)
    .order('sort_order')

  if (error) return { data: [], error: error.message }

  return { data: data ?? [] }
}

export async function createCategory(
  input: CategoryInput
): Promise<{ error?: string }> {
  const result = categorySchema.safeParse(input)
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const { supabase, householdId } = await getHouseholdId()

  // Get next sort_order
  const { data: lastCategory } = await supabase
    .from('categories')
    .select('sort_order')
    .eq('household_id', householdId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextSortOrder = (lastCategory?.sort_order ?? 0) + 1

  const { error } = await supabase.from('categories').insert({
    household_id: householdId,
    name: result.data.name,
    parent_id: result.data.parent_id ?? null,
    icon: result.data.icon ?? null,
    color: result.data.color ?? null,
    is_income: result.data.is_income ?? false,
    is_essential: result.data.is_essential ?? false,
    sort_order: nextSortOrder,
  })

  if (error) return { error: error.message }

  revalidatePath('/app/settings/categories')
  return {}
}

export async function updateCategory(
  id: string,
  input: CategoryInput
): Promise<{ error?: string }> {
  const result = categorySchema.safeParse(input)
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const { supabase, householdId } = await getHouseholdId()

  const { error } = await supabase
    .from('categories')
    .update({
      name: result.data.name,
      parent_id: result.data.parent_id ?? null,
      icon: result.data.icon ?? null,
      color: result.data.color ?? null,
      is_income: result.data.is_income ?? false,
      is_essential: result.data.is_essential ?? false,
    })
    .eq('id', id)
    .eq('household_id', householdId)

  if (error) return { error: error.message }

  revalidatePath('/app/settings/categories')
  return {}
}

export async function archiveCategory(
  id: string
): Promise<{ error?: string }> {
  const { supabase, householdId } = await getHouseholdId()

  const { error } = await supabase
    .from('categories')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
    .eq('household_id', householdId)

  if (error) return { error: error.message }

  revalidatePath('/app/settings/categories')
  return {}
}

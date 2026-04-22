'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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

export type HouseholdMember = {
  user_id: string
  role: string
  display_name: string | null
  joined_at: string
}

export async function getHouseholdMembers(): Promise<{
  data: HouseholdMember[]
  error?: string
}> {
  const { supabase, householdId } = await getHouseholdId()

  const { data, error } = await supabase
    .from('household_members')
    .select('user_id, role, display_name, joined_at')
    .eq('household_id', householdId)
    .order('joined_at', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: data ?? [] }
}

export async function updateDisplayName(
  displayName: string
): Promise<{ error?: string }> {
  const { supabase, user, householdId } = await getHouseholdId()

  const { error } = await supabase
    .from('household_members')
    .update({ display_name: displayName })
    .eq('household_id', householdId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  return {}
}

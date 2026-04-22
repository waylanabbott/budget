'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { inviteTokenSchema } from '@/lib/schemas/invites'

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

export async function createInvite(): Promise<{
  data?: { token: string; expires_at: string }
  error?: string
}> {
  const { supabase, user, householdId } = await getHouseholdId()

  // Verify user is owner
  const { data: ownerCheck } = await supabase
    .from('household_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('household_id', householdId)
    .eq('role', 'owner')
    .maybeSingle()

  if (!ownerCheck) {
    return { error: 'Only the household owner can create invites.' }
  }

  const { data: invite, error } = await supabase
    .from('household_invites')
    .insert({ household_id: householdId, created_by: user.id })
    .select()
    .single()

  if (error) return { error: error.message }

  return { data: { token: invite.token, expires_at: invite.expires_at } }
}

export async function redeemInvite(
  token: string
): Promise<{ data?: { household_id: string }; error?: string }> {
  const result = inviteTokenSchema.safeParse({ token })
  if (!result.success) {
    return { error: 'Invalid invite token.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data, error } = await supabase.rpc('redeem_invite', {
    p_token: token,
  })

  if (error) return { error: error.message }

  revalidatePath('/app/dashboard')
  return { data: { household_id: data } }
}

export async function getActiveInvites(): Promise<{
  data: Array<{
    id: string
    token: string
    expires_at: string
    created_at: string
    redeemed_by: string | null
  }>
  error?: string
}> {
  const { supabase, householdId } = await getHouseholdId()

  const { data, error } = await supabase
    .from('household_invites')
    .select('id, token, expires_at, created_at, redeemed_by')
    .eq('household_id', householdId)
    .is('redeemed_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) return { data: [], error: error.message }

  return { data: data ?? [] }
}

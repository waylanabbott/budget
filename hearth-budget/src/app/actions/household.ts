'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createHousehold(data: {
  name: string
  zip: string
  metro: string
  income_bracket: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check if user already has a household (prevent duplicate creation)
  const { data: existing } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    redirect('/app/dashboard')
  }

  const { error } = await supabase.from('households').insert({
    name: data.name,
    zip: data.zip,
    metro: data.metro,
    income_bracket: data.income_bracket,
  })

  // DB triggers fire automatically on INSERT:
  // - on_household_created: inserts user as 'owner' in household_members (HSHD-04)
  // - on_household_created_categories: seeds 20 default categories (HSHD-05)

  if (error) return { error: error.message }

  redirect('/app/dashboard')
}

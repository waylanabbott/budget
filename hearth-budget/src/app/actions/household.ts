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

  const { error } = await supabase.rpc('setup_household', {
    p_name: data.name,
    p_zip: data.zip,
    p_metro: data.metro,
    p_income_bracket: data.income_bracket,
  })

  if (error) {
    if (error.message.includes('already belongs to a household')) {
      redirect('/app/dashboard')
    }
    return { error: error.message }
  }

  redirect('/app/dashboard')
}

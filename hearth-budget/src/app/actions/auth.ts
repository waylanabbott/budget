'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUpWithPassword(formData: {
  email: string
  password: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
  })
  if (error) return { error: error.message }
  redirect('/onboarding')
}

export async function signInWithPassword(formData: {
  email: string
  password: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  })
  if (error) return { error: error.message }
  redirect('/app/dashboard')
}

export async function signInWithMagicLink(
  email: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function requestPasswordReset(
  email: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function updatePassword(
  newPassword: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: error.message }
  redirect('/app/dashboard')
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

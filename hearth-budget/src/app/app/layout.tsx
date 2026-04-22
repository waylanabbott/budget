import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id, role, households(id, name)')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/onboarding')

  const householdName =
    (membership.households as { id: string; name: string } | null)?.name ?? 'My Household'
  const userInitial = (user.email?.[0] ?? '?').toUpperCase()

  return (
    <AppShell householdName={householdName} userInitial={userInitial}>
      {children}
    </AppShell>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { FabAddButton } from '@/components/fab-add-button'
import { getHouseholdMembers } from '@/app/actions/members'

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

  // Fetch household members for partner display and memberMap
  const { data: members } = await getHouseholdMembers()
  const partner = members.find((m) => m.user_id !== user.id)
  const partnerName = partner?.display_name ?? (partner ? 'Partner' : null)

  // Build memberMap: user_id -> initial (first char of display_name, uppercased)
  const memberMap: Record<string, string> = {}
  for (const m of members) {
    if (m.user_id === user.id) {
      memberMap[m.user_id] = userInitial
    } else {
      memberMap[m.user_id] = (m.display_name?.[0] ?? '?').toUpperCase()
    }
  }

  return (
    <AppShell
      householdName={householdName}
      userInitial={userInitial}
      partnerName={partnerName}
      memberMap={memberMap}
    >
      {children}
      <FabAddButton />
    </AppShell>
  )
}

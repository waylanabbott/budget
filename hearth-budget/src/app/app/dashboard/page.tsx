import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getHouseholdMembers } from '@/app/actions/members'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: members } = await getHouseholdMembers()
  const partner = members.find((m) => m.user_id !== user.id)
  const partnerDisplayName = partner?.display_name ?? (partner ? 'Partner' : null)

  const heading = partnerDisplayName
    ? `You and ${partnerDisplayName}`
    : 'Dashboard'

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{heading}</h1>
      <p className="text-muted-foreground">Budget summary coming in Phase 6.</p>
    </div>
  )
}

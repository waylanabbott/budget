import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Wallet, Tags, ChevronRight, Users } from 'lucide-react'
import { signOut } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { InviteSection } from '@/components/invite-section'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get user's household membership
  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/onboarding')

  const isOwner = membership.role === 'owner'

  // Get all members in the household
  const { data: members } = await supabase
    .from('household_members')
    .select('user_id, role, display_name')
    .eq('household_id', membership.household_id)

  const memberCount = members?.length ?? 0

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="text-muted-foreground mb-6">Manage your household and account.</p>

      <div className="space-y-3">
        <Link
          href="/app/accounts"
          className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Accounts</p>
              <p className="text-sm text-muted-foreground">
                Manage checking, savings, credit cards
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        <Link
          href="/app/settings/categories"
          className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            <Tags className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Categories</p>
              <p className="text-sm text-muted-foreground">
                Manage spending and income categories
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>

      <Separator className="my-6" />

      {/* Household Members */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Household Members
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          {memberCount} {memberCount === 1 ? 'member' : 'members'} in your household.
        </p>
        <div className="space-y-2">
          {members?.map((member) => (
            <div
              key={member.user_id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                  {(member.display_name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {member.display_name ?? 'Unknown'}
                    {member.user_id === user.id && (
                      <span className="ml-1 text-muted-foreground">(you)</span>
                    )}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
                {member.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Partner — only for owners with < 2 members */}
      {isOwner && memberCount < 2 && (
        <>
          <Separator className="my-6" />
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-1">Invite Partner</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Generate a one-time invite link to add your partner to this household.
            </p>
            <InviteSection />
          </div>
        </>
      )}

      <Separator className="my-6" />

      <div>
        <h2 className="text-lg font-semibold mb-1">Account</h2>
        <p className="text-sm text-muted-foreground mb-4">Sign out of Hearth Budget.</p>
        <form action={signOut}>
          <Button type="submit" variant="destructive">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  )
}

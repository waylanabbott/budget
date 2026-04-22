import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const supabase = await createClient()

  const { data: invite } = await supabase.rpc('get_invite_by_token', {
    p_token: token,
  })

  if (!invite || !invite.is_valid) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid or Expired Invite</CardTitle>
            <CardDescription>
              This invite link is no longer valid. Ask the household owner to
              send a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login" className={cn(buttonVariants())}>
              Go to Login
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const householdName = invite.household_name ?? 'a household'

  const expiresText = formatDistanceToNow(parseISO(invite.expires_at), {
    addSuffix: true,
  })

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join {householdName}</CardTitle>
          <CardDescription>
            You have been invited to join this household on Hearth Budget. Sign
            up or log in to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This invite expires {expiresText}.
          </p>
          <Link
            href={`/invite/${token}/accept`}
            className={cn(buttonVariants(), 'w-full')}
          >
            Join Household
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redeemInvite } from '@/app/actions/invites'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const requestUrl = new URL(request.url)

  // Check if user is authenticated
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Redirect to login with next param to come back here after auth
    return NextResponse.redirect(
      new URL(`/login?next=/invite/${token}/accept`, requestUrl.origin)
    )
  }

  // User is authenticated — redeem the invite
  const result = await redeemInvite(token)

  if (result.error) {
    // Redirect back to invite page with error
    return NextResponse.redirect(
      new URL(
        `/invite/${token}?error=${encodeURIComponent(result.error)}`,
        requestUrl.origin
      )
    )
  }

  // Success — redirect to dashboard
  return NextResponse.redirect(new URL('/app/dashboard', requestUrl.origin))
}

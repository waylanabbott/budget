import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    await supabase.auth.exchangeCodeForSession(code)

    // Check if user has a household — route to onboarding if not
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // If redirecting to an invite accept route, skip household check —
      // the invite accept handler manages household membership
      if (next && next.startsWith('/invite/')) {
        return NextResponse.redirect(new URL(next, requestUrl.origin))
      }

      const { data: membership } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!membership) {
        return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
      }
    }
  }

  // Default redirect: either the 'next' param or /app/dashboard
  const redirectTo = next ?? '/app/dashboard'
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
}

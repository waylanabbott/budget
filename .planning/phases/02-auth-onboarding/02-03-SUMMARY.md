---
phase: 02-auth-onboarding
plan: "03"
subsystem: auth
tags: [supabase, next-auth, react-hook-form, zod, sonner, next-themes, shadcn]

# Dependency graph
requires:
  - phase: 02-auth-onboarding
    provides: Zod v4 auth schemas (signUpSchema, signInSchema, magicLinkSchema), shadcn UI components (Button, Card, Tabs, Form, Input, Separator)
  - phase: 01-bootstrap
    provides: createClient() from @/lib/supabase/server, Database types from @/types/database

provides:
  - /login page with tabbed Sign In / Sign Up + magic link flow
  - /auth/callback route handler for magic link code exchange
  - src/app/actions/auth.ts with signUpWithPassword, signInWithPassword, signInWithMagicLink, signOut server actions
  - ThemeProvider + Toaster wired to root layout

affects: [03-transactions, 04-household-sharing, all app/* routes requiring auth]

# Tech tracking
tech-stack:
  added: [next-themes ThemeProvider (wired, was already installed)]
  patterns: [server actions for auth with redirect(), useForm+zodResolver for form validation, maybeSingle() for optional DB lookup in route handler]

key-files:
  created:
    - hearth-budget/src/app/actions/auth.ts
    - hearth-budget/src/app/(auth)/login/page.tsx
    - hearth-budget/src/app/auth/callback/route.ts
    - hearth-budget/src/components/providers.tsx
  modified:
    - hearth-budget/src/app/layout.tsx

key-decisions:
  - "signUpWithPassword and signInWithPassword use server-side createClient() for correct cookie handling via @supabase/ssr"
  - "signOut uses server-side client so cookie is cleared server-side and cannot be bypassed by the proxy guard"
  - "ThemeProvider added via Providers wrapper component (not inline in Server Component layout) to satisfy next-themes client requirement"
  - "/auth/callback checks household_members table to route new users to /onboarding vs returning users to /app/dashboard"

patterns-established:
  - "Server actions return { error?: string } union — callers check result?.error before treating redirect as success"
  - "Magic link OTP uses NEXT_PUBLIC_SITE_URL env var with /auth/callback suffix for emailRedirectTo"
  - "Client Components wire useForm + zodResolver against existing Zod schemas from @/lib/schemas/"
  - "Providers component pattern: client wrapper for global context providers placed in src/components/providers.tsx"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04]

# Metrics
duration: 12min
completed: 2026-04-22
---

# Phase 02 Plan 03: Auth Pages Summary

**Supabase email/password + magic link auth via server actions, tabbed /login page with react-hook-form, and /auth/callback route handler that routes by household membership**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-22T04:24:05Z
- **Completed:** 2026-04-22T04:36:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Auth server actions (signUp, signIn, magicLink, signOut) with server-side Supabase client and correct redirect targets
- /login page with Tabs (Sign In / Sign Up), react-hook-form + Zod v4 validation, inline root errors, and magic link form with toast feedback
- /auth/callback route handler that exchanges OTP code for session and routes to /onboarding (no household) or /app/dashboard (existing household)
- ThemeProvider + Toaster wired globally so all pages can use sonner toasts

## Task Commits

1. **Task 1: Create auth server actions** - `94a14b4` (feat)
2. **Task 2: Build /login page and /auth/callback route handler** - `eaf3e4a` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified
- `hearth-budget/src/app/actions/auth.ts` - Server actions: signUpWithPassword, signInWithPassword, signInWithMagicLink, signOut
- `hearth-budget/src/app/(auth)/login/page.tsx` - Client Component: tabbed auth card with magic link section
- `hearth-budget/src/app/auth/callback/route.ts` - GET handler: exchanges magic link code, checks household, redirects
- `hearth-budget/src/components/providers.tsx` - ThemeProvider wrapper for next-themes (required by sonner Toaster)
- `hearth-budget/src/app/layout.tsx` - Added Providers + Toaster to root layout

## Decisions Made
- Server-side createClient() used for all auth actions (signUp, signIn, signOut) to ensure correct cookie handling via @supabase/ssr — browser client auth was explicitly considered but rejected for redirect control consistency
- signOut uses server action (not browser client signOut) so cookie clearance happens server-side, preventing proxy guard bypass
- ThemeProvider added as Providers wrapper component to satisfy next-themes "use client" requirement without converting Server Component layout

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added ThemeProvider wrapper for sonner/next-themes compatibility**
- **Found during:** Task 2 (layout Toaster integration)
- **Issue:** sonner.tsx uses useTheme() from next-themes. Without ThemeProvider in the tree, the Toaster component silently falls back but theme-aware styling breaks. next-themes ThemeProvider is a client component and cannot be added inline to the Server Component layout.
- **Fix:** Created src/components/providers.tsx with ThemeProvider + disableTransitionOnChange, imported and wrapped {children} in layout.tsx
- **Files modified:** hearth-budget/src/components/providers.tsx (created), hearth-budget/src/app/layout.tsx
- **Verification:** Build passes; Toaster renders correctly in layout
- **Committed in:** eaf3e4a (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Required for Toaster to work correctly with theme system. No scope creep.

## Issues Encountered
None beyond the ThemeProvider deviation above.

## User Setup Required
None — Supabase credentials in .env.local are required for runtime (auth.signUp, auth.signInWithPassword, auth.signInWithOtp all need real credentials). The placeholder values in .env.local cause runtime failures but the build compiles successfully. User must run `supabase start` and populate .env.local with real values before testing auth flows.

## Next Phase Readiness
- /login page is fully built and ready for testing once Supabase credentials are in .env.local
- Auth callback route handles both new users (to /onboarding) and returning users (to /app/dashboard)
- signOut server action is available for any page that needs a sign-out button
- Plan 04 (onboarding) can import signOut from @/app/actions/auth and build the /onboarding page knowing the auth session is correctly set

---
*Phase: 02-auth-onboarding*
*Completed: 2026-04-22*

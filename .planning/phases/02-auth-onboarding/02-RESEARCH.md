# Phase 2: Auth & Onboarding — Research

**Researched:** 2026-04-21
**Domain:** Supabase Auth + Next.js 16 App Router + shadcn/ui forms + responsive shell layout
**Confidence:** HIGH

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Auth UI Layout**
- Centered card on gradient background for login/signup
- Tabbed single page at /login with signup toggle (not separate routes)
- Magic link: toast + "check your email" message, stay on page
- Inline form field errors via Zod + react-hook-form validation

**Onboarding Flow**
- Horizontal numbered stepper (Step 1/2/3) with progress indicator
- All 3 steps required: household name, ZIP + metro, income bracket
- Income bracket as radio button group with BLS CEX ranges (<$15k, $15-30k, $30-40k, $40-50k, $50-70k, $70-100k, $100-150k, $150k+)
- Auto-detect metro from ZIP code input

**App Shell Navigation**
- Mobile: 5-item bottom nav — Dashboard, Transactions, Budgets, Goals, Settings (lucide icons)
- Desktop: collapsible sidebar with icons + labels
- Household name in header bar, right side with avatar initial
- Active route: filled icon + accent color underline

### Claude's Discretion

- Specific shadcn/ui components for each form element
- Gradient colors and exact styling
- Stepper component implementation details
- Auth callback route handling

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can sign up with email and password | Supabase `signUp()` + Zod v4 schema + react-hook-form |
| AUTH-02 | User can sign up with magic link | Supabase `signInWithOtp()` + toast notification pattern |
| AUTH-03 | User can log in and stay logged in across sessions | Supabase `signInWithPassword()` + @supabase/ssr cookie session |
| AUTH-04 | User can log out from any page | Supabase `signOut()` + server action pattern |
| AUTH-05 | Protected routes under /app/* require authentication via Supabase middleware | proxy.ts (renamed from middleware.ts in Next.js 16) + redirect logic |
| HSHD-01 | User can create a household with name during onboarding | INSERT to households + trigger auto-assigns owner |
| HSHD-02 | User can set ZIP code and metro area during onboarding | INSERT to households.zip + households.metro |
| HSHD-03 | User can select income bracket from BLS CEX brackets during onboarding | INSERT to households.income_bracket |
| HSHD-04 | Household creator is auto-assigned as 'owner' | Already implemented via `on_household_created` DB trigger |
| HSHD-05 | Default category tree is auto-populated for new households | Already implemented via `on_household_created_categories` DB trigger |
| HSHD-06 | App shell shows household name in header with bottom nav (mobile) / sidebar (desktop) | Protected layout component reading household from Supabase |

</phase_requirements>

---

## Summary

Phase 2 builds on a solid Phase 1 foundation: the three-client Supabase split (browser/server/middleware) is in place, the database schema with all triggers is written, and shadcn/ui is initialized with the Nova preset. The work is entirely new UI: auth pages, onboarding flow, and app shell.

**Critical Next.js 16 breaking change:** `middleware.ts` is deprecated and renamed to `proxy.ts` in Next.js 16. The existing `middleware.ts` from Phase 1 must be migrated to `proxy.ts` with the function renamed from `middleware` to `proxy`. The auth redirect logic for `/app/*` routes must be added to this proxy file. This is the single most important architectural fact for this phase.

**Auth approach:** Use Supabase `@supabase/ssr` patterns with server actions for form submissions. For email/password and magic link, call Supabase Auth client-side from a Client Component (`'use client'`). Auth callback for magic link requires a Route Handler at `src/app/auth/callback/route.ts` that exchanges the code for a session. Onboarding data is written via a server action that calls the Supabase server client.

**Primary recommendation:** Migrate middleware.ts → proxy.ts first (Task 1), then build auth pages, then onboarding, then app shell. This ordering prevents a working app shell being inaccessible because the redirect guard is missing.

---

## Standard Stack

### Core (all already installed in Phase 1)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | 2.104.0 | Auth: signUp, signInWithPassword, signInWithOtp, signOut | Official Supabase client |
| `@supabase/ssr` | 0.10.2 | Cookie-based session persistence for Next.js App Router | Replaces deprecated auth-helpers |
| `react-hook-form` | 7.73.1 | Form state, validation wiring, submission pending state | Already installed; shadcn default |
| `@hookform/resolvers` | 5.2.2 | Connects Zod 4 schemas to react-hook-form | v5 explicitly targets Zod 4 API |
| `zod` | 4.3.6 | Schema validation for auth and onboarding forms | Already installed; verified Zod 4 |
| `lucide-react` | 1.8.0 | Icons for bottom nav + sidebar | Already installed |
| `next-themes` | 0.4.6 | Dark mode support (in shell) | Already installed |

### Components to Add via shadcn CLI

Run from `hearth-budget/` directory using `npx shadcn@latest add <component>`:

| Component | CLI Name | Purpose |
|-----------|----------|---------|
| Input | `input` | Email, password, household name, ZIP fields |
| Label | `label` | Form field labels |
| Form | `form` | react-hook-form wrapper with error display |
| Tabs | `tabs` | Login/Signup toggle on /login page |
| RadioGroup | `radio-group` | Income bracket selector in onboarding Step 3 |
| Sonner (Toast) | `sonner` | "Check your email" magic link notification |
| Separator | `separator` | Visual dividers in shell |
| Avatar | `avatar` | User avatar initial in header |
| Sheet | `sheet` | Mobile sidebar drawer (collapsible) |
| Sidebar | `sidebar` | Desktop sidebar component (shadcn has a built-in Sidebar) |

**Note on Sidebar:** shadcn v4 ships a `sidebar` component group. The Nova preset includes sidebar CSS tokens already in `globals.css` (verified: `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, etc. are present). Add it via `npx shadcn@latest add sidebar`.

**Installation command:**
```bash
# Run from hearth-budget/ with pnpm in PATH ($HOME/Library/pnpm:$PATH)
npx shadcn@latest add input label form tabs radio-group sonner separator avatar sheet sidebar
```

### No New npm Packages Needed

All required libraries are already installed from Phase 1. No `pnpm add` commands needed for this phase.

---

## Architecture Patterns

### Recommended Project Structure (additions only)

```
hearth-budget/
├── proxy.ts                          # RENAME from middleware.ts — Next.js 16 requirement
├── src/
│   └── app/
│       ├── auth/
│       │   └── callback/
│       │       └── route.ts          # Magic link code exchange handler
│       ├── (auth)/                   # Route group — no shared layout
│       │   └── login/
│       │       └── page.tsx          # Tabbed login+signup page
│       ├── (onboarding)/             # Route group — no shared layout
│       │   └── onboarding/
│       │       └── page.tsx          # Multi-step household setup (3 steps)
│       └── (app)/                    # Route group — shared protected shell
│           ├── layout.tsx            # App shell: header + bottom nav + sidebar
│           └── dashboard/
│               └── page.tsx          # Placeholder dashboard ("No data yet")
```

**Why route groups:** `(auth)`, `(onboarding)`, and `(app)` are Next.js 16 route groups (parentheses prefix). They allow different layouts per section without affecting URL structure. `/login` renders within `(auth)` (no shell), `/onboarding` in `(onboarding)` (no shell), and `/app/*` in `(app)` (with shell).

**Critical URL note:** The CONTEXT.md references `/app` as the protected shell. In Next.js, this means `src/app/(app)/dashboard/page.tsx` renders at `/dashboard`. If the protected path must be `/app/dashboard`, the folder must be `src/app/(app)/app/dashboard/page.tsx`. Research is inconclusive on which pattern the user wants — the CONTEXT.md says "protected shell layout" and the requirements say "/app/*", so use the actual `/app/` path: `src/app/app/(protected)/layout.tsx` pattern or directly `src/app/app/dashboard/page.tsx`.

**Simplest approach:** Use `src/app/app/` as the literal path (no route group wrapping needed). The shell layout at `src/app/app/layout.tsx` applies to all `/app/*` routes.

### Pattern 1: Next.js 16 Proxy (Renamed Middleware)

**What:** `middleware.ts` is deprecated in Next.js 16 and renamed to `proxy.ts`. The function export changes from `middleware` to `proxy`. Functionality is identical.

**Migration required:** Phase 1 created `middleware.ts`. Phase 2 must rename it to `proxy.ts` and update the function name and import.

```typescript
// proxy.ts (renamed from middleware.ts)
// Source: Next.js 16 docs — node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  // First: refresh Supabase session (already implemented in src/lib/supabase/middleware.ts)
  const response = await updateSession(request)

  // Second: redirect unauthenticated users away from /app/* routes
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/app')) {
    const supabase = createServerClient(/* ... */)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Third: redirect authenticated users who've completed onboarding away from /login
  // (Optional — prevents returning to login when already authenticated)

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Codemod available:** `npx @next/codemod@canary middleware-to-proxy .` — but since the file needs auth redirect logic added anyway, manual migration is clearer.

**Important:** The proxy function must call `supabase.auth.getUser()` (not `getSession()`) for auth checks. Per `@supabase/ssr` README: "`getSession()` returns the session directly from cookies — the user object is NOT verified by the Auth server and must not be used for authorization decisions."

### Pattern 2: Supabase Auth with Server Actions

**What:** Auth operations (signUp, signIn, signOut) run in Server Actions called from Client Components. The Client Component handles the UI state; the Server Action handles the Supabase call and redirect.

```typescript
// src/app/actions/auth.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUpWithPassword(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  redirect('/onboarding')
}

export async function signInWithPassword(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  redirect('/app/dashboard')
}

export async function signInWithMagicLink(email: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

**Alternative (Client Component calling Supabase directly):** For the login form, calling `supabase.auth.signInWithPassword()` from a Client Component using the browser client is also valid and simpler for handling inline errors. The pattern is: use browser client for auth, use server action for data writes (household creation).

### Pattern 3: Magic Link Auth Callback Route Handler

**What:** Supabase sends a magic link with a code parameter. The browser navigates to the callback URL, which exchanges the code for a session.

```typescript
// src/app/auth/callback/route.ts
// Source: Supabase SSR documentation pattern
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/app/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    await supabase.auth.exchangeCodeForSession(code)
  }

  // After code exchange: check if user has a household → route appropriately
  // If no household → /onboarding, else → /app/dashboard
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
```

**Magic link email redirect URL:** Must be configured in Supabase dashboard (or `supabase/config.toml` for local dev) to point to `http://localhost:3000/auth/callback`. In production: the actual domain.

**Local dev email testing:** Supabase local dev provides an email testing UI at `http://localhost:54324` (Inbucket). No real SMTP setup needed for development.

### Pattern 4: Zod v4 Schema Definitions

**What:** Zod v4 has breaking changes from v3. The `{error: '...'}` syntax replaces `{message: '...'}` for validation error messages. `z.email()` is now a top-level method, not chained on string.

```typescript
// Source: Next.js 16 authentication guide + Zod v4 API
import * as z from 'zod'

// Email/password signup schema
export const signUpSchema = z.object({
  email: z.email({ error: 'Please enter a valid email address.' }).trim(),
  password: z
    .string()
    .min(8, { error: 'Password must be at least 8 characters.' })
    .trim(),
})

// Magic link schema
export const magicLinkSchema = z.object({
  email: z.email({ error: 'Please enter a valid email address.' }).trim(),
})

// Onboarding Step 1 schema
export const householdNameSchema = z.object({
  name: z
    .string()
    .min(1, { error: 'Household name is required.' })
    .max(100, { error: 'Household name must be under 100 characters.' })
    .trim(),
})

// Onboarding Step 2 schema
export const locationSchema = z.object({
  zip: z
    .string()
    .regex(/^\d{5}$/, { error: 'Enter a valid 5-digit ZIP code.' }),
  metro: z.string().min(1, { error: 'Metro area is required.' }),
})

// Onboarding Step 3 schema
export const incomeBracketSchema = z.object({
  income_bracket: z.enum([
    '<$15k', '$15-30k', '$30-40k', '$40-50k',
    '$50-70k', '$70-100k', '$100-150k', '$150k+'
  ], { error: 'Please select an income bracket.' }),
})
```

**Key v4 change:** `z.string().email()` is gone. Use `z.email()` as a top-level primitive.

### Pattern 5: Multi-Step Onboarding Form (Client Component)

**What:** Three-step form using local React state to track current step. Each step's data is validated independently. Final submit writes all data to Supabase.

```typescript
// src/app/(onboarding)/onboarding/page.tsx — Client Component approach
'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

type Step = 1 | 2 | 3

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1)
  const [formData, setFormData] = useState({
    name: '', zip: '', metro: '', income_bracket: ''
  })

  // Each step has its own form with its own schema
  // On "Next", validate current step and advance
  // On final "Finish", server action writes household to DB
}
```

**Stepper UI:** Build a simple custom stepper — three numbered circles connected by lines. No external stepper library needed; shadcn does not ship one, and this is simple enough to build inline.

### Pattern 6: App Shell Layout (Protected)

**What:** `src/app/app/layout.tsx` is a Server Component that:
1. Calls `createClient()` (server Supabase client)
2. Gets the current user via `getUser()`
3. Gets the user's household via a JOIN query
4. If no user → redirect to `/login`
5. If no household → redirect to `/onboarding`
6. Renders the shell: header + nav + `{children}`

```typescript
// src/app/app/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch household membership
  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id, role, households(id, name)')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/onboarding')

  return (
    <AppShell household={membership.households} user={user}>
      {children}
    </AppShell>
  )
}
```

### Pattern 7: ZIP-to-Metro Auto-Detection

**What:** When user enters a ZIP code, auto-populate the metro field. Options:
1. **Static lookup table**: Ship a `zip-to-metro.ts` mapping file with the ~260 CBSAs (Metropolitan Statistical Areas). This is the most reliable approach with zero API dependency.
2. **External API (zippopotam.us)**: Free, no auth required, returns city/state for a ZIP. Does not return CBSA/metro name directly.
3. **Census Bureau API**: Returns CBSA for a ZIP, but requires handling the API format.

**Recommendation:** Use a static mapping of the ~50 most common metros covering the BLS CEX metro categories. The BLS CEX uses specific metro groupings; the ZIP lookup should map to those same groupings. Build a `src/lib/zip-to-metro.ts` file with ~300 ZIP prefixes mapped to BLS metro names.

**Why static over API:** No network latency, no API key, no rate limits, works offline (PWA), and the BLS CEX metro categories are a fixed known list. If a ZIP isn't in the table, default to "National Average."

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom validation logic | Zod 4 + react-hook-form + @hookform/resolvers | Edge cases with async validation, error formatting |
| Cookie session management | Manual cookie setting/reading | @supabase/ssr (createServerClient, createBrowserClient) | Token refresh, chunking, concurrent request race conditions |
| Auth redirect guard | Manual JWT parsing in proxy | supabase.auth.getUser() in proxy.ts | getUser() is verified server-side; getSession() is unverified |
| Toast notifications | Custom toast component | shadcn Sonner (via `npx shadcn@latest add sonner`) | Accessibility, stacking, dismiss, positioning |
| Sidebar/nav component | Custom responsive sidebar | shadcn Sidebar component | Already has sidebar CSS tokens in globals.css |
| Input sanitization | Manual trim/sanitize | Zod `.trim()` method | Handles whitespace consistently |

**Key insight:** Every shadcn component copies source into your repo — you own it, it's not a runtime dependency. Add components freely; the bundle cost is minimal and they handle accessibility.

---

## Common Pitfalls

### Pitfall 1: Using `middleware.ts` (Deprecated in Next.js 16)

**What goes wrong:** Phase 1 created `middleware.ts`. In Next.js 16, this convention is deprecated and renamed to `proxy.ts`. The file may still work due to backward compatibility, but the function name changes from `middleware` to `proxy` and deprecation warnings will appear. The authentication docs now exclusively show `proxy.ts`.

**Why it happens:** The rename happened at Next.js 16.0.0. Phase 1 was written based on prior patterns.

**How to avoid:** Rename `middleware.ts` → `proxy.ts` and rename the exported function. Run the codemod: `npx @next/codemod@canary middleware-to-proxy .` or rename manually.

**Warning signs:** Build warnings about deprecated middleware convention. The Next.js docs at `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` contain the migration guide.

### Pitfall 2: Using `getSession()` for Auth Guards (Security Hole)

**What goes wrong:** `getSession()` reads the session directly from cookies without server-side verification. A malicious client could craft a cookie with a spoofed user ID. Auth guards using `getSession()` can be bypassed.

**Why it happens:** `getSession()` is faster (no network call) and a common pattern from older Supabase tutorials.

**How to avoid:** Use `getUser()` in the proxy.ts guard and in the app shell layout. From the `@supabase/ssr` README: "The user object [from getSession()] is **not verified by the Auth server** and must not be used for authorization decisions." `getClaims()` is a new middle-ground option that validates the JWT locally without a network call.

**Warning signs:** Using `supabase.auth.getSession()` in proxy.ts or layout.tsx for redirect logic.

### Pitfall 3: Missing Auth Callback Route for Magic Link

**What goes wrong:** Magic link emails contain a URL like `https://app.com/auth/callback?code=xxx`. Without a Route Handler at `/auth/callback`, the user lands on a 404. The code parameter is never exchanged for a session.

**Why it happens:** Easy to overlook — magic link signup appears to work (email sent) but redemption fails silently.

**How to avoid:** Create `src/app/auth/callback/route.ts` as a GET Route Handler that calls `supabase.auth.exchangeCodeForSession(code)`. Also configure the redirect URL in Supabase: for local dev, add to `supabase/config.toml` under `[auth]` → `additional_redirect_urls`. For production: add to Supabase dashboard → Auth → URL Configuration.

**Warning signs:** Magic link emails work but clicking them shows 404 or lands on the home page without logging in.

### Pitfall 4: Onboarding Re-Entry After Completion

**What goes wrong:** A user who has already completed onboarding navigates to `/onboarding` directly and can overwrite their household data.

**Why it happens:** No guard on the onboarding page itself.

**How to avoid:** In the onboarding page's server component (or in proxy.ts), check if the user already has a `household_members` record. If yes, redirect to `/app/dashboard`. The app shell layout already does this check — onboarding should do the inverse.

**Warning signs:** Database shows duplicate households for the same user.

### Pitfall 5: `pnpm` Not in PATH

**What goes wrong:** Phase 1 installed pnpm via standalone script to `$HOME/Library/pnpm`. The standard shell PATH may not include this directory in new terminal sessions.

**Why it happens:** The standalone installer adds to `~/.zshrc` but new bash sessions (like Claude Code shell invocations) may not source `~/.zshrc`.

**How to avoid:** Prefix pnpm commands with `export PNPM_HOME="$HOME/Library/pnpm" && PATH="$PNPM_HOME:$PATH" && pnpm ...` or use the absolute path `$HOME/Library/pnpm/pnpm`.

**Warning signs:** `command not found: pnpm` in Bash tool calls.

### Pitfall 6: Supabase Migrations Not Applied to Live Project

**What goes wrong:** Phase 1 wrote migration SQL files but deferred `supabase db push`. Auth will call `households`, `household_members` tables that don't exist yet in the live Supabase project.

**Why it happens:** The user said they'd run `supabase start` locally later. Phase 2 needs the schema to exist.

**How to avoid:** Phase 2 must include a task to verify/push migrations before any auth flow can be tested. Options:
1. `supabase start` (local Docker) + `supabase db push` to local
2. Link to a live Supabase project + `supabase db push` to production
3. Manual SQL execution in Supabase Studio

**Warning signs:** Auth works (user created in `auth.users`) but household creation fails with "relation does not exist."

### Pitfall 7: Zod v4 `{error: ...}` vs v3 `{message: ...}`

**What goes wrong:** Most tutorials and LLM training data use Zod v3's `{message: 'Error text'}` syntax for validation error messages. Zod v4 changed this to `{error: 'Error text'}`. Using v3 syntax in v4 schemas silently falls back to default error messages.

**Why it happens:** Breaking change in Zod 4.0.0 released July 2025.

**How to avoid:** Use `{error: '...'}` consistently. Confirmed in Next.js 16 auth docs: `z.string().min(2, { error: 'Name must be at least 2 characters long.' })` and `z.email({ error: 'Please enter a valid email.' })`.

**Warning signs:** Form validation triggers but shows generic "Invalid" instead of custom error messages.

### Pitfall 8: Auth Callback URL Not Whitelisted in Supabase

**What goes wrong:** Magic link redirects to `http://localhost:3000/auth/callback`. Supabase rejects this if the URL is not in the allowed redirect URLs list. Clicking magic links shows a "redirect_uri_mismatch" error.

**Why it happens:** Supabase requires explicit whitelist of callback URLs for security.

**How to avoid:** Add to `supabase/config.toml`:
```toml
[auth]
additional_redirect_urls = ["http://localhost:3000/auth/callback"]
```
For production: add `https://yourdomain.com/auth/callback` in Supabase dashboard → Auth → URL Configuration.

---

## Code Examples

### Complete Auth Actions File

```typescript
// src/app/actions/auth.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUpWithPassword(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  redirect('/onboarding')
}

export async function signInWithPassword(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  redirect('/app/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

### Household Creation Server Action

```typescript
// src/app/actions/household.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createHousehold(data: {
  name: string
  zip: string
  metro: string
  income_bracket: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('households')
    .insert({
      name: data.name,
      zip: data.zip,
      metro: data.metro,
      income_bracket: data.income_bracket,
    })
  // Note: on_household_created trigger auto-inserts user as 'owner'
  // Note: on_household_created_categories trigger seeds default categories
  if (error) return { error: error.message }
  redirect('/app/dashboard')
}
```

### Proxy.ts with Auth Guard (Complete)

```typescript
// proxy.ts (renamed from middleware.ts)
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Create Supabase client for session refresh and auth checks
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // CRITICAL: Do not add logic between createServerClient and getUser()
  const { data: { user } } = await supabase.auth.getUser()

  // Protect /app/* routes
  if (pathname.startsWith('/app') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Bottom Nav Component (Mobile)

```typescript
// src/components/bottom-nav.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ArrowRightLeft, PieChart, Target, Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/transactions', label: 'Transactions', icon: ArrowRightLeft },
  { href: '/app/budgets', label: 'Budgets', icon: PieChart },
  { href: '/app/goals', label: 'Goals', icon: Target },
  { href: '/app/settings', label: 'Settings', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-background md:hidden">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2 text-xs',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.5} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` with `export function middleware()` | `proxy.ts` with `export function proxy()` | Next.js 16.0.0 (Oct 2025) | Must migrate Phase 1 file |
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | Supabase 2024 | Already using correct package |
| `getSession()` for auth checks | `getUser()` (or `getClaims()` for no-network option) | @supabase/ssr 0.10.x | Security: getSession() unverified |
| `z.string().email({message: '...'})` | `z.email({error: '...'})` | Zod 4.0.0 (July 2025) | API change — must use v4 syntax |
| Separate `/login` and `/signup` routes | Single `/login` page with tabs | User decision | Simpler UX |
| `npm run dev` / `npm install` | `pnpm dev` / `pnpm add` | Phase 1 decision | PATH quirk: pnpm at $HOME/Library/pnpm |

**Deprecated/outdated:**
- `middleware.ts`: Deprecated in Next.js 16, replaced by `proxy.ts`. File may still work (backward compat not explicitly confirmed), but docs show proxy.ts exclusively.
- `getSession()` for auth decisions: Documented as insecure in `@supabase/ssr` README — use `getUser()` or `getClaims()`.
- `z.string().email()`: Removed in Zod 4; replaced with `z.email()` top-level method.

---

## Open Questions

1. **Does `middleware.ts` still work in Next.js 16.2.4?**
   - What we know: Docs say "deprecated" and show `proxy.ts`. The version history says "Middleware is deprecated and renamed to Proxy" at v16.0.0.
   - What's unclear: Whether backward compatibility means it still runs silently, or whether it's actively broken.
   - Recommendation: Migrate to `proxy.ts` regardless. Even if it works, the deprecation means future breakage. Migration is a one-file rename + function rename.

2. **Does the user have a live Supabase project with the schema pushed?**
   - What we know: Phase 1 wrote migrations but deferred `db push`. No `.env.local` exists.
   - What's unclear: Whether the user ran `supabase start` locally or has a live project to connect.
   - Recommendation: Phase 2 Wave 0 task must include: "Verify Supabase project has schema applied; if not, walk user through setup." This is a blocking dependency for all auth testing.

3. **Onboarding redirect: should auth callback go to `/onboarding` or `/app/dashboard`?**
   - What we know: New users (no household) should hit `/onboarding`. Returning users should go straight to `/app/dashboard`.
   - What's unclear: The auth callback route handler needs to check household membership to route correctly.
   - Recommendation: Auth callback checks `household_members` for the newly authenticated user. If no rows → `/onboarding`. If rows → `/app/dashboard`.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js dev server | ✓ | 22.21.0 | — |
| pnpm | Package management | ✓ | 10.33.0 (at $HOME/Library/pnpm) | npm (not preferred) |
| Supabase CLI | Migration push | ✓ | 2.90.0 | — |
| Supabase project (local/cloud) | Auth testing | UNKNOWN | — | Must set up before testing auth |
| .env.local | Supabase URL + anon key | NOT FOUND | — | Must create before pnpm dev works with auth |
| Docker (for supabase start) | Local Supabase | NOT CHECKED | — | Use cloud project instead |

**Missing dependencies with no fallback:**
- `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — auth cannot be tested without these. Wave 0 must include a step to create this file.

**Missing dependencies with fallback:**
- Docker (for local Supabase): If Docker is unavailable, use a free cloud Supabase project instead. The migration files are ready to push.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.1.5 |
| Config file | None — Wave 0 gap; needs `vitest.config.ts` |
| Quick run command | `pnpm vitest run` |
| Full suite command | `pnpm vitest run --coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Email/password signup creates user + redirects to /onboarding | smoke (manual) | — manual only | ❌ |
| AUTH-02 | Magic link sends email + stays on page with toast | smoke (manual) | — manual only | ❌ |
| AUTH-03 | User stays logged in after refresh | smoke (manual) | — manual only | ❌ |
| AUTH-04 | Logout redirects to /login | smoke (manual) | — manual only | ❌ |
| AUTH-05 | /app/dashboard redirects to /login when unauthenticated | unit (proxy logic) | `pnpm vitest run tests/proxy.test.ts` | ❌ Wave 0 |
| HSHD-01 | Household name saved to DB | integration (manual) | — manual only | ❌ |
| HSHD-02 | ZIP + metro saved to DB | unit (zip-to-metro lookup) | `pnpm vitest run tests/zip-to-metro.test.ts` | ❌ Wave 0 |
| HSHD-03 | Income bracket saved to DB | integration (manual) | — manual only | ❌ |
| HSHD-04 | DB trigger auto-assigns owner | integration (DB trigger) | — requires live DB | ❌ |
| HSHD-05 | DB trigger seeds categories | integration (DB trigger) | — requires live DB | ❌ |
| HSHD-06 | Shell shows household name in header | smoke (visual) | — manual only | ❌ |

**Manual-only justification:** AUTH-01 through AUTH-04 require Supabase Auth network calls; these are integration/e2e concerns not suitable for unit tests. AUTH-05 is the one testable proxy logic unit.

### Sampling Rate

- **Per task commit:** `pnpm vitest run` (unit tests only, sub-5 seconds)
- **Per wave merge:** `pnpm vitest run` + manual smoke test of core auth flow
- **Phase gate:** Full manual walkthrough: signup → onboarding → protected shell renders

### Wave 0 Gaps

- [ ] `vitest.config.ts` — vitest is installed but no config file exists
- [ ] `tests/proxy.test.ts` — unit test for AUTH-05 redirect logic
- [ ] `tests/zip-to-metro.test.ts` — unit test for ZIP lookup function
- [ ] `.env.local` — required to run `pnpm dev` with working auth (not a test file, but blocks all manual smoke tests)

---

## Project Constraints (from CLAUDE.md → AGENTS.md)

AGENTS.md content: "This is NOT the Next.js you know. This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices."

**Actionable directives extracted:**
1. **Before writing any Next.js code**, read the relevant guide in `node_modules/next/dist/docs/`. This research has done so for `authentication.md`, `forms.md`, and `proxy.md`.
2. **Heed deprecation notices**: `middleware.ts` is deprecated → must use `proxy.ts`.
3. **Breaking changes exist**: Confirmed — `middleware.ts` → `proxy.ts` rename, `middleware` function → `proxy` function.
4. The research has verified Next.js 16-specific patterns from the bundled docs rather than from training data.

**Compliance requirement for planner:** Every code pattern in PLAN.md tasks must reference Next.js 16 conventions, not Next.js 13/14/15 patterns. Specifically: use `proxy.ts` not `middleware.ts`.

---

## Sources

### Primary (HIGH confidence)
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` — proxy.ts convention, migration guide, version history
- `node_modules/next/dist/docs/01-app/02-guides/authentication.md` — auth patterns, Zod v4 schema syntax, proxy redirect pattern
- `node_modules/next/dist/docs/01-app/02-guides/forms.md` — Server Actions with forms pattern
- `node_modules/@supabase/ssr/README.md` — getSession() vs getUser() security guidance, middleware pattern
- `hearth-budget/node_modules/zod/README.md` — Zod v4 API confirmation
- `hearth-budget/package.json` — All installed package versions verified
- `hearth-budget/src/lib/supabase/*.ts` — Existing client patterns from Phase 1
- `hearth-budget/supabase/migrations/*.sql` — Confirmed: triggers exist for owner auto-assign and category seeding (HSHD-04, HSHD-05 already implemented at DB level)
- `hearth-budget/src/app/globals.css` — Confirmed: sidebar CSS tokens present (--sidebar-*, supports shadcn Sidebar component)
- `hearth-budget/components.json` — shadcn Nova preset, `base-nova` style, RSC enabled, lucide icons

### Secondary (MEDIUM confidence)
- `hearth-budget/supabase/config.toml` — local Supabase auth settings: `enable_signup = true`, `enable_confirmations = false` (no email confirm required for development)

### Tertiary (LOW confidence — not needed, covered by primary sources)
- Training data on Supabase magic link flow — superseded by @supabase/ssr README

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified from package.json and node_modules
- Architecture (proxy.ts): HIGH — verified from Next.js 16 bundled docs
- Auth patterns: HIGH — verified from @supabase/ssr README + Next.js auth guide
- Zod v4 syntax: HIGH — verified from Next.js auth guide showing v4 syntax
- Pitfalls: HIGH — verified from direct source inspection
- Environment availability: MEDIUM — pnpm works, Supabase CLI works, but live project unknown

**Research date:** 2026-04-21
**Valid until:** 2026-05-21 (stable libraries; proxy.ts rename is permanent in Next.js 16)

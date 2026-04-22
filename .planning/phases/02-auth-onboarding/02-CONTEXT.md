# Phase 2: Auth & Onboarding - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can create accounts (email/password or magic link), log in, complete a 3-step household onboarding, and land on a protected app shell with bottom nav (mobile) / sidebar (desktop). Unauthenticated access to /app/* redirects to login.

</domain>

<decisions>
## Implementation Decisions

### Auth UI Layout
- Centered card on gradient background for login/signup
- Tabbed single page at /login with signup toggle (not separate routes)
- Magic link: toast + "check your email" message, stay on page
- Inline form field errors via Zod + react-hook-form validation

### Onboarding Flow
- Horizontal numbered stepper (Step 1/2/3) with progress indicator
- All 3 steps required: household name, ZIP + metro, income bracket
- Income bracket as radio button group with BLS CEX ranges (<$15k, $15-30k, $30-40k, $40-50k, $50-70k, $70-100k, $100-150k, $150k+)
- Auto-detect metro from ZIP code input

### App Shell Navigation
- Mobile: 5-item bottom nav — Dashboard, Transactions, Budgets, Goals, Settings (lucide icons)
- Desktop: collapsible sidebar with icons + labels
- Household name in header bar, right side with avatar initial
- Active route: filled icon + accent color underline

### Claude's Discretion
- Specific shadcn/ui components for each form element
- Gradient colors and exact styling
- Stepper component implementation details
- Auth callback route handling

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/supabase/client.ts` — browser Supabase client
- `src/lib/supabase/server.ts` — server Supabase client (async cookies)
- `src/lib/supabase/middleware.ts` — auth session refresh
- `middleware.ts` — root middleware calling updateSession
- `src/app/manifest.ts` — PWA manifest
- `src/app/layout.tsx` — root layout with viewport meta

### Established Patterns
- Three-client Supabase split (browser/server/middleware)
- `await cookies()` in server components
- Tailwind v4 with shadcn/ui Nova preset
- App Router with src/ directory

### Integration Points
- middleware.ts needs auth redirect logic for /app/* routes
- src/app/(auth)/ group for login pages
- src/app/(app)/ group for protected pages with shell layout
- Database: households, household_members tables ready with RLS

</code_context>

<specifics>
## Specific Ideas

- From BUDGET_APP_PLAN.md: /signup, /login, /logout routes; /onboarding 3-step form; /app protected shell with bottom nav (mobile) / sidebar (desktop)
- Default category tree auto-populated via database trigger (already in migration)
- Household creator auto-assigned as 'owner' (already in migration trigger)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

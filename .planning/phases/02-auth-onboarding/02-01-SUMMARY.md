---
phase: 02-auth-onboarding
plan: 01
subsystem: auth
tags: [nextjs16, supabase, proxy, vitest, middleware]

# Dependency graph
requires:
  - phase: 01-bootstrap
    provides: hearth-budget scaffold with Next.js 16, Supabase SSR, and TypeScript configured
provides:
  - proxy.ts with Next.js 16 auth guard redirecting /app/* to /login for unauthenticated users
  - .env.local with Supabase credential placeholders (user fills in real values)
  - vitest.config.ts with node environment and @/* path alias
  - tests/proxy.test.ts with 5 todo stubs documenting AUTH-05 redirect behavior
  - tests/zip-to-metro.test.ts with 5 todo stubs for HSHD-02 ZIP lookup
affects: [02-02, 02-03, 02-04, 02-05, 02-06]

# Tech tracking
tech-stack:
  added: [vitest@4.1.5, "@vitejs/plugin-react@6.0.1 (already in devDeps)"]
  patterns:
    - Next.js 16 proxy.ts replaces middleware.ts for route interception
    - Supabase createServerClient + getUser() inlined in proxy (not updateSession wrapper) for single-client auth guard
    - it.todo test stubs document behavior contracts before implementation

key-files:
  created:
    - hearth-budget/proxy.ts
    - hearth-budget/vitest.config.ts
    - hearth-budget/tests/proxy.test.ts
    - hearth-budget/tests/zip-to-metro.test.ts
    - hearth-budget/.env.local
  modified:
    - hearth-budget/middleware.ts (deleted — replaced by proxy.ts)

key-decisions:
  - "Next.js 16 proxy.ts replaces deprecated middleware.ts for route interception"
  - "Auth guard inlines createServerClient+getUser() instead of calling updateSession() to avoid dual-client stale cookie issues"
  - ".env.local created with placeholder values — user fills in real Supabase credentials before running pnpm dev"

patterns-established:
  - "Proxy pattern: export async function proxy() in proxy.ts (not middleware)"
  - "Auth guard: pathname.startsWith('/app') + !user check before supabaseResponse return"
  - "Test stubs: it.todo() documents behavior contracts for functions with live-service dependencies"

requirements-completed: [AUTH-05]

# Metrics
duration: 8min
completed: 2026-04-22
---

# Phase 02 Plan 01: Proxy Migration & Test Infrastructure Summary

**Next.js 16 proxy.ts replaces deprecated middleware with Supabase auth guard protecting /app/* routes, plus vitest infrastructure with behavior-documenting test stubs**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-22T04:16:10Z
- **Completed:** 2026-04-22T04:18:05Z
- **Tasks:** 3 (1 checkpoint auto-approved, 2 auto executed)
- **Files modified:** 5 created + 1 deleted

## Accomplishments
- Migrated deprecated middleware.ts to proxy.ts using Next.js 16 conventions with `export async function proxy`
- Added /app/* auth guard: unauthenticated requests redirect to /login, authenticated requests pass through
- Scaffolded vitest.config.ts with node environment, path aliases, and test glob patterns
- Created 10 todo-style test stubs (5 for proxy auth behavior, 5 for zip-to-metro lookup) that document contracts without needing live Supabase
- Created .env.local with placeholder values — unblocks all Wave 2+ plans once user fills in real credentials

## Task Commits

Each task was committed atomically:

1. **Task 1: Create .env.local (auto-approved checkpoint)** - placeholder file created, gitignored
2. **Task 2: Migrate middleware.ts to proxy.ts** - `645d51e` (feat)
3. **Task 3: Scaffold vitest config and test stubs** - `af4bfb8` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `hearth-budget/proxy.ts` - Next.js 16 proxy with Supabase auth guard for /app/* routes
- `hearth-budget/middleware.ts` - Deleted (deprecated in Next.js 16)
- `hearth-budget/.env.local` - Supabase credential placeholders (gitignored)
- `hearth-budget/vitest.config.ts` - Vitest config with node env, path aliases, test glob
- `hearth-budget/tests/proxy.test.ts` - 5 todo stubs for AUTH-05 proxy redirect behavior
- `hearth-budget/tests/zip-to-metro.test.ts` - 5 todo stubs for HSHD-02 ZIP-to-metro lookup

## Decisions Made
- Inlined createServerClient+getUser() in proxy.ts instead of calling updateSession() — avoids dual Supabase client instances with potentially stale cookies in the same request context
- Used it.todo() stubs instead of skipped tests — clearly communicates "behavior contract not yet implemented" vs "behavior implemented but skipped"
- .env.local uses placeholder values per user's decision to skip live Supabase setup for now

## Deviations from Plan

### Auto-approved Checkpoint

**Task 1 (checkpoint:human-action) auto-approved per orchestrator instructions**
- User chose to skip Supabase setup for now
- .env.local created with placeholder values (NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co, etc.)
- User will fill in real values when running `supabase start` locally

---

**Total deviations:** 1 auto-approved checkpoint (per orchestrator instructions — not a bug fix)
**Impact on plan:** No impact on code correctness. .env.local exists as required by acceptance criteria; user fills real credentials before first `pnpm dev` run.

## Issues Encountered
None — both auto tasks executed cleanly. pnpm build passed on first attempt. pnpm vitest run exited 0 with 10 todo tests.

## User Setup Required

Before running `pnpm dev`, fill in real Supabase credentials in `hearth-budget/.env.local`:

1. Go to Supabase dashboard → Settings → API
2. Copy Project URL → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy service_role secret → `SUPABASE_SERVICE_ROLE_KEY`
5. Set `NEXT_PUBLIC_SITE_URL=http://localhost:3000`

Also configure in Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `http://localhost:3000`
- Add Redirect URL: `http://localhost:3000/auth/callback`

Push schema migrations: `supabase link --project-ref <ref> && supabase db push`

## Known Stubs

| File | Stub | Reason |
|------|------|--------|
| `hearth-budget/tests/proxy.test.ts` | 5 `it.todo` entries | proxy.ts calls getUser() which requires live Supabase — integration tests deferred to e2e |
| `hearth-budget/tests/zip-to-metro.test.ts` | 5 `it.todo` entries | zip-to-metro.ts utility not yet created — Plan 04 will create the file and activate these tests |
| `hearth-budget/.env.local` | Placeholder credentials | User will fill in real values before first dev run |

These stubs are intentional — they document behavior contracts that will be fulfilled in Plans 03-04.

## Next Phase Readiness
- proxy.ts is the active auth guard — all Wave 2 plans can build /app/* routes knowing they're protected
- vitest infrastructure ready — Plans 03-05 can add real tests to the existing config
- .env.local placeholder ready — user fills credentials once, unblocks pnpm dev for all subsequent plans
- Tests directory established at hearth-budget/tests/

---
*Phase: 02-auth-onboarding*
*Completed: 2026-04-22*

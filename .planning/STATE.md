---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-04-22T06:03:39.640Z"
progress:
  total_phases: 8
  completed_phases: 3
  total_plans: 17
  completed_plans: 15
---

# Project State: Hearth Budget

*Single source of truth for session continuity. Updated at phase transitions and plan completions.*

---

## Project Reference

**Core Value:** Two people can track every dollar together in real time — entering transactions in seconds, seeing budget progress, and comparing spending to honest public benchmarks.

**Current Focus:** Phase 04 — household-sharing

---

## Current Position

Phase: 04 (household-sharing) — EXECUTING
Plan: 2 of 3

## Phase Map

| Phase | Name | Status |
|-------|------|--------|
| 1 | Bootstrap | Complete |
| 2 | Auth & Onboarding | Complete |
| 3 | Transactions | Complete |
| 4 | Household Sharing | Not started |
| 5 | CSV Import | Not started |
| 6 | Budgets, Goals & Dashboard | Not started |
| 7 | Benchmarks | Not started |
| 8 | Forecasting | Not started |

---

## Performance Metrics

**Plans completed:** 14
**Plans total:** 14
**Requirements met:** 35/63

---

## Accumulated Context

### Key Decisions

| Decision | Rationale |
|----------|-----------|
| Next.js 16 (not 15) | Research finding — v16 is current stable at time of build |
| Tailwind v4 | Research finding — current stable, different config format than v3 |
| @serwist/next (not next-pwa) | next-pwa is abandoned; serwist is the maintained fork |
| Recharts 3.x | Current stable version compatible with React 19 |
| Zod 4 | Current stable; breaking changes from v3 — use v4 APIs |
| Supabase Auth (not Clerk) | One fewer vendor; RLS with auth.uid() clean for 2-person household |
| Manual + CSV entry (no Plaid) | Free, no vendor lock-in; Plaid deferred to v2 |
| PWA over native app | Installable on mobile, single codebase |
| BLS/HUD/Zillow benchmarks | Public, free, authoritative with clear provenance |
| Phase 01-bootstrap P01 | 5 | 2 tasks | 26 files |
| pnpm via curl standalone script | npm global install blocked by macOS /usr/local permissions |
| turbopack: {} in nextConfig | Next.js 16 defaults to Turbopack; Serwist uses webpack — empty turbopack config resolves conflict |
| webworker lib reference in sw.ts | ServiceWorkerGlobalScope not in dom lib; /// reference directive avoids dom/webworker conflict |
| shadcn Nova preset (not slate custom) | shadcn v4.4 --defaults uses Nova preset; slate-like oklch colors used, configurable post-init |
| Phase 02-auth-onboarding P01 | 8 | 3 tasks | 5 files |
| proxy.ts replaces middleware.ts | Next.js 16 proxy function replaces deprecated middleware for route interception |
| Auth guard inlines createServerClient+getUser() | Avoids dual-client stale cookie issues vs calling updateSession() separately |
| .env.local placeholder values | User fills in real Supabase credentials before first pnpm dev run |
| Phase 02-auth-onboarding P02 | 5 | 2 tasks | 19 files |
| base-nova shadcn uses @base-ui not @radix-ui | form.tsx written manually with React.cloneElement (no @radix-ui/react-slot installed) |
| Zod v4 email trim order | z.email().trim() validates format before trimming — whitespace-padded emails fail validation (correct/secure behavior) |
| shadcn add form no-ops with base-nova | form component not in base-nova registry — manual creation required for all projects using this style |
| Phase 02-auth-onboarding P03 | 12 | 2 tasks | 5 files |
| Auth server actions use server-side createClient() | Ensures correct cookie handling via @supabase/ssr for all auth mutations |
| ThemeProvider added via Providers wrapper component | next-themes is a client component; cannot be inline in Server Component layout — wrapper pattern required |
| /auth/callback checks household_members for routing | New users without a household go to /onboarding; returning users go to /app/dashboard |
| Phase 03-01 P01 | 2min | 2 tasks | 6 files |
| getHouseholdId() helper per action file | Extracted auth+household lookup to reduce repetition without cross-file import issues |
| searchMerchants client-side dedup | Supabase JS has no DISTINCT; fetch 50 and deduplicate to 10 in JS |
| Cursor pagination uses created_at | Stable ordering across transactions sharing the same occurred_on date |
| Phase 03-transactions P02 | 3min | 2 tasks | 4 files |
| Phase 03-transactions P03 | 3min | 2 tasks | 4 files |
| Phase 04-household-sharing P02 | 4min | 2 tasks | 9 files |

### Todos

*(none yet — populated during execution)*

### Blockers

*(none yet)*

---

## Session Continuity

**Last updated:** 2026-04-22 after completing Phase 03
**Next action:** Plan and execute Phase 04 (Household Sharing)
**Resume context:** Phases 1-3 complete. Phase 03 delivered: transaction entry (FAB + bottom sheet), transaction list (infinite scroll, date groups, swipe edit/delete, filters), accounts CRUD, categories CRUD. 32 tests passing, build clean. Manual browser smoke tests deferred until Supabase runs locally.

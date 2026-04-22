---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-04-22T15:09:51.992Z"
progress:
  total_phases: 8
  completed_phases: 5
  total_plans: 20
  completed_plans: 20
---

# Project State: Hearth Budget

*Single source of truth for session continuity. Updated at phase transitions and plan completions.*

---

## Project Reference

**Core Value:** Two people can track every dollar together in real time — entering transactions in seconds, seeing budget progress, and comparing spending to honest public benchmarks.

**Current Focus:** Phase 06 — budgets-goals-dashboard

---

## Current Position

Phase: 06 (budgets-goals-dashboard) — PENDING
Plan: 0 of ?

## Phase Map

| Phase | Name | Status |
|-------|------|--------|
| 1 | Bootstrap | Complete |
| 2 | Auth & Onboarding | Complete |
| 3 | Transactions | Complete |
| 4 | Household Sharing | Complete |
| 5 | CSV Import | Complete |
| 6 | Budgets, Goals & Dashboard | Not started |
| 7 | Benchmarks | Not started |
| 8 | Forecasting | Not started |

---

## Performance Metrics

**Plans completed:** 20
**Plans total:** 20
**Requirements met:** 49/63

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
| Phase 04-household-sharing P01 | 5min | 2 tasks | 9 files |
| Fixed token redeemer RLS WITH CHECK | Original WITH CHECK (redeemed_at is null) blocked UPDATE setting redeemed_at — dropped and recreated |
| Invite redemption order matters | UPDATE invite first, THEN INSERT member — RLS policy checks redeemed invite exists |
| Link+buttonVariants not Button asChild | base-ui Button has no asChild prop — use Link with buttonVariants className |
| Phase 05-csv-import P01 | 6min | 2 tasks | 7 files |
| Web Crypto API for dedup hashing | crypto.subtle.digest works in both browser and Node — dedup.ts is imported by client components |
| Chase split into 2 formats | Credit card and checking have different header signatures — separate entries for reliable detection |
| Bank formats ordered most-specific first | detectBankFormat returns first match — ordering ensures precise format identification |
| Phase 05-csv-import P02 | 2min | 2 tasks | 2 files |
| Sequential await for hash generation | Web Crypto fast enough for <10k rows; simpler than Promise.all batching |
| executeImport receives pre-transformed rows | Transform happens client-side for preview before server insert |
| suggestCategories limited to 50 merchants | Prevent abuse from large CSV files |
| Phase 05-csv-import P03 | 6min | 3 tasks | 8 files |
| Multi-step state machine in CsvUpload | Manages upload->preview->duplicates->done flow with single parent component |
| Native select for column mapping | No shadcn Select component installed; native select styled with Tailwind |
| Sheet for import detail dialog | Slide-over panel consistent with shadcn patterns for detail views |

### Todos

*(none yet — populated during execution)*

### Blockers

*(none yet)*

---

## Session Continuity

**Last updated:** 2026-04-22 after completing Phase 05 Plan 03
**Next action:** Begin Phase 06 (Budgets, Goals & Dashboard)
**Resume context:** Phase 05 CSV Import complete (all 3 plans). Full import UI delivered: drag-and-drop upload with bank detection (8+ formats), 10-row preview with column mapping, duplicate review with category auto-suggest, import history with undo. Navigation updated. TypeScript clean. Ready for Phase 06.

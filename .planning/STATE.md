---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-04-22T04:22:16.338Z"
progress:
  total_phases: 8
  completed_phases: 1
  total_plans: 8
  completed_plans: 4
---

# Project State: Hearth Budget

*Single source of truth for session continuity. Updated at phase transitions and plan completions.*

---

## Project Reference

**Core Value:** Two people can track every dollar together in real time — entering transactions in seconds, seeing budget progress, and comparing spending to honest public benchmarks.

**Current Focus:** Phase 02 — auth-onboarding

---

## Current Position

Phase: 02 (auth-onboarding) — EXECUTING
Plan: 3 of 6

## Phase Map

| Phase | Name | Status |
|-------|------|--------|
| 1 | Bootstrap | Not started |
| 2 | Auth & Onboarding | Not started |
| 3 | Transactions | Not started |
| 4 | Household Sharing | Not started |
| 5 | CSV Import | Not started |
| 6 | Budgets, Goals & Dashboard | Not started |
| 7 | Benchmarks | Not started |
| 8 | Forecasting | Not started |

---

## Performance Metrics

**Plans completed:** 0
**Plans total:** TBD (filled after phase planning)
**Requirements met:** 0/63

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

### Todos

*(none yet — populated during execution)*

### Blockers

*(none yet)*

---

## Session Continuity

**Last updated:** 2026-04-22 after completing Plan 02-02 (shadcn UI components + Zod v4 schemas)
**Next action:** Execute plan 02-03 (auth pages)
**Resume context:** hearth-budget/ has all shadcn UI components in src/components/ui/, Zod v4 schemas in src/lib/schemas/ (auth.ts + onboarding.ts), 25 passing schema tests. pnpm build passes. User must fill .env.local with real Supabase credentials before pnpm dev.

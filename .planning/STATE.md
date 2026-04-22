---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-04-22T03:41:12.347Z"
progress:
  total_phases: 8
  completed_phases: 0
  total_plans: 2
  completed_plans: 1
---

# Project State: Hearth Budget

*Single source of truth for session continuity. Updated at phase transitions and plan completions.*

---

## Project Reference

**Core Value:** Two people can track every dollar together in real time — entering transactions in seconds, seeing budget progress, and comparing spending to honest public benchmarks.

**Current Focus:** Phase 01 — bootstrap

---

## Current Position

Phase: 01 (bootstrap) — EXECUTING
Plan: 2 of 2

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

### Todos

*(none yet — populated during execution)*

### Blockers

*(none yet)*

---

## Session Continuity

**Last updated:** 2026-04-22 after completing Plan 01-01 (scaffold)
**Next action:** Execute plan 01-02 (database schema, RLS migrations)
**Resume context:** hearth-budget/ scaffold complete at /Users/waylansmac/budget/hearth-budget. pnpm 10.33.0 installed, Next.js 16.2.4 running, all deps installed, build passes.

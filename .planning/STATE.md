# Project State: Hearth Budget

*Single source of truth for session continuity. Updated at phase transitions and plan completions.*

---

## Project Reference

**Core Value:** Two people can track every dollar together in real time — entering transactions in seconds, seeing budget progress, and comparing spending to honest public benchmarks.

**Current Focus:** Phase 1 — Bootstrap

---

## Current Position

**Milestone:** v1
**Phase:** 1 — Bootstrap
**Plan:** None started
**Status:** Not started

```
Progress: [                    ] 0/8 phases complete
```

---

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

### Todos

*(none yet — populated during execution)*

### Blockers

*(none yet)*

---

## Session Continuity

**Last updated:** 2026-04-21 after roadmap creation
**Next action:** Run `/gsd:plan-phase 1` to plan Phase 1: Bootstrap
**Resume context:** Roadmap created, all 63 requirements mapped, no phases planned yet

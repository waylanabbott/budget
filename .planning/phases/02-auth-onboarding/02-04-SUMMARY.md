---
phase: 02-auth-onboarding
plan: 04
subsystem: onboarding
tags: [supabase, zod4, onboarding, zip-to-metro, react-hook-form]

# Dependency graph
requires:
  - plan: 02-02
    provides: Zod v4 schemas (householdNameSchema, locationSchema, incomeBracketSchema) and shadcn UI components
  - plan: 02-03
    provides: Auth server actions and callback route
provides:
  - src/lib/zip-to-metro.ts — static ZIP prefix to BLS CEX metro area mapping
  - tests/zip-to-metro.test.ts — 7 passing unit tests for ZIP lookup
  - src/app/actions/household.ts — createHousehold server action
  - src/app/(onboarding)/onboarding/page.tsx — 3-step onboarding flow
  - src/types/database.ts — full Supabase database types for all 14 tables
affects: [02-05, 02-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Zod v4 resolver with react-hook-form per step (separate form instances)
    - Server action with redirect — no return value on success
    - Re-entry guard on createHousehold (checks household_members before insert)
    - ZIP-to-metro uses 3-digit prefix mapping, falls back to "National Average"

key-files:
  created:
    - hearth-budget/src/lib/zip-to-metro.ts
    - hearth-budget/src/app/actions/household.ts
    - hearth-budget/src/app/(onboarding)/onboarding/page.tsx
  modified:
    - hearth-budget/src/types/database.ts (replaced placeholder with full 14-table types)
    - hearth-budget/tests/zip-to-metro.test.ts (replaced 5 todo stubs with 7 real tests)

decisions:
  - "Database types generated manually from migration SQL since Supabase isn't running locally yet — will be replaced by supabase gen types later"
  - "Onboarding uses separate react-hook-form instance per step (not single multi-step form) for independent Zod validation"
  - "createHousehold re-entry guard prevents duplicate households if user navigates back"

metrics:
  completed_date: "2026-04-22"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 2
---

# Phase 02 Plan 04: Onboarding Flow Summary

**One-liner:** ZIP-to-metro utility with 7 passing tests, createHousehold server action with re-entry guard, 3-step onboarding page (household name → ZIP/metro → income bracket), and full Supabase database types for all 14 tables.

**Status: COMPLETE**

## What Was Built

### Task 1: ZIP-to-metro utility + unit tests
- Static mapping of 3-digit ZIP prefixes to BLS CEX metro names covering all major US metros
- Falls back to "National Average" for unknown ZIPs
- 7 vitest tests all passing (SLC, NYC, LA, Seattle, Atlanta, unknown, empty)

### Task 2: createHousehold server action + 3-step onboarding page
- Server action inserts into households table; DB triggers auto-fire for owner assignment (HSHD-04) and category seeding (HSHD-05)
- Re-entry guard: checks if user already has a household before inserting
- 3-step client form: household name → ZIP code (auto-detects metro) → income bracket (BLS CEX ranges as radio group)
- Horizontal stepper with progress indicator and back/next navigation
- Redirects to /app/dashboard on successful creation

### Bonus: Database types
- Generated full TypeScript types from migration SQL for all 14 tables
- Includes Row/Insert/Update variants and RLS function signatures
- Unblocks typed Supabase client queries throughout the app

## Deviations from Plan
- Database types were a placeholder stub causing build failures on `supabase.from('households').insert()`. Generated types manually from migration SQL rather than running `supabase gen types`.
- Agent execution hit Bash permission issues; commits and verification done by orchestrator.

## Acceptance Criteria
| Criterion | Result |
|-----------|--------|
| zip-to-metro tests pass | PASS (7/7) |
| createHousehold action exists | PASS |
| Onboarding page with 3 steps | PASS |
| Income brackets match BLS CEX ranges | PASS |
| Auto-detect metro from ZIP | PASS |
| pnpm build exits 0 | PASS |

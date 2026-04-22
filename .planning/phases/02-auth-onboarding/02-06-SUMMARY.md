---
phase: 02-auth-onboarding
plan: 06
subsystem: smoke-test
tags: [verification, manual-test, deferred]

# Dependency graph
requires:
  - plan: 02-04
    provides: Onboarding flow and createHousehold action
  - plan: 02-05
    provides: Protected app shell layout and navigation
provides:
  - Automated verification: vitest (32 pass, 5 todo) + build passing
  - Manual smoke tests deferred until Supabase is running locally
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified: []

decisions:
  - "Manual browser smoke tests deferred — Supabase not yet running locally (user preference for local hosting). Automated checks (vitest + build) all pass."
  - "10 manual tests documented in plan for execution when Supabase starts (AUTH-01 through AUTH-05, HSHD-01 through HSHD-06)"

metrics:
  completed_date: "2026-04-22"
  tasks_completed: 1
  tasks_total: 1
  files_created: 0
  files_modified: 0
---

# Phase 02 Plan 06: Smoke Test Checkpoint Summary

**One-liner:** Automated verification passes (32 tests + build); manual browser smoke tests deferred until Supabase is running locally.

**Status: COMPLETE (automated) / DEFERRED (manual browser tests)**

## Automated Verification

| Check | Result |
|-------|--------|
| pnpm vitest run | PASS — 32 passed, 5 todo, 0 failed |
| pnpm build | PASS — all routes compile, TypeScript clean |

## Manual Tests (Deferred)

10 browser smoke tests are documented in 02-06-PLAN.md covering:
- AUTH-05: Proxy redirect for unauthenticated /app/* access
- AUTH-01: Email/password signup → /onboarding
- HSHD-01/02/03: 3-step onboarding completion
- HSHD-06: App shell with household name in header
- HSHD-04/05: DB trigger verification (owner + categories)
- AUTH-04: Sign out from Settings
- AUTH-03: Session persistence across refresh
- AUTH-02: Magic link flow
- HSHD-02: ZIP auto-detection
- Form validation inline errors

These require a running Supabase instance (local via `supabase start` or cloud).

## Code Verification Summary

All Phase 2 code artifacts are in place:
- proxy.ts with auth guard (/app/* → /login redirect)
- /login with tabbed sign in/sign up + magic link
- /auth/callback for magic link code exchange
- /onboarding with 3-step form (name → ZIP/metro → income)
- /app/* shell with header, bottom nav (mobile), sidebar (desktop)
- Server actions: signUp, signIn, signInWithMagicLink, signOut, createHousehold
- Zod v4 schemas for all forms
- ZIP-to-metro utility with 7 passing tests
- Full database types for all 14 tables

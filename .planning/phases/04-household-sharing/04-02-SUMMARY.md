---
phase: 04-household-sharing
plan: 02
subsystem: ui
tags: [supabase, react, server-actions, avatar, household-members]

# Dependency graph
requires:
  - phase: 03-transactions
    provides: "Transaction row and list components, transactions page"
  - phase: 02-auth-onboarding
    provides: "Auth, household creation, app shell layout"
provides:
  - "getHouseholdMembers server action for querying household member data"
  - "updateDisplayName server action for editing member display names"
  - "display_name column on household_members with backfill migration"
  - "Transaction row avatars showing who entered each transaction"
  - "Partner-aware header showing 'You & [partner]' when two members exist"
  - "Dashboard partner greeting"
affects: [csv-import, budgets, settings]

# Tech tracking
tech-stack:
  added: []
  patterns: ["memberMap prop threading for user identification across components"]

key-files:
  created:
    - hearth-budget/src/app/actions/members.ts
    - hearth-budget/supabase/migrations/20260422000002_member_display_name.sql
  modified:
    - hearth-budget/src/types/database.ts
    - hearth-budget/src/app/app/layout.tsx
    - hearth-budget/src/components/app-shell.tsx
    - hearth-budget/src/app/app/dashboard/page.tsx
    - hearth-budget/src/components/transaction-row.tsx
    - hearth-budget/src/components/transaction-list.tsx
    - hearth-budget/src/app/app/transactions/page.tsx

key-decisions:
  - "display_name column on household_members with email-based backfill for existing owners"
  - "memberMap Record<string, string> prop threading pattern for user initial display"

patterns-established:
  - "memberMap pattern: build Record<user_id, initial> in server component, pass through props to client components"
  - "getHouseholdMembers: reusable server action for member data used in layout, dashboard, and transactions page"

requirements-completed: [SHAR-03, SHAR-04]

# Metrics
duration: 4min
completed: 2026-04-22
---

# Phase 04 Plan 02: Member Display Summary

**Household member avatars on transaction rows and partner-aware header using display_name column with email backfill migration**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-22T05:58:29Z
- **Completed:** 2026-04-22T06:02:28Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Each transaction row now shows a small avatar with the initial of the person who entered it
- App shell header shows "You & [partner name]" when two household members exist, falls back to household name for solo users
- Dashboard page shows "You and [partner name]" greeting when partner has joined
- Migration adds display_name column to household_members and backfills existing owner rows from auth.users email

## Task Commits

Each task was committed atomically:

1. **Task 1: Members action and app shell header update** - `3caf1b1` (feat)
2. **Task 2: Transaction row avatars and list wiring** - `a1ba49f` (feat)

## Files Created/Modified
- `hearth-budget/supabase/migrations/20260422000002_member_display_name.sql` - Adds display_name column with backfill from auth.users email
- `hearth-budget/src/app/actions/members.ts` - Server actions: getHouseholdMembers and updateDisplayName
- `hearth-budget/src/types/database.ts` - Added display_name to household_members type
- `hearth-budget/src/app/app/layout.tsx` - Fetches members, builds memberMap and partnerName, passes to AppShell
- `hearth-budget/src/components/app-shell.tsx` - Accepts partnerName prop, shows "You & [partner]" in header
- `hearth-budget/src/app/app/dashboard/page.tsx` - Async server component with partner greeting
- `hearth-budget/src/components/transaction-row.tsx` - Avatar with entered_by initial before category dot
- `hearth-budget/src/components/transaction-list.tsx` - Threads memberMap prop to TransactionRow
- `hearth-budget/src/app/app/transactions/page.tsx` - Fetches members, builds memberMap, passes to TransactionList

## Decisions Made
- Added display_name column to household_members rather than creating a separate profiles table -- pragmatic for 2-person household, avoids scope creep
- Backfill migration uses split_part(email, '@', 1) to extract username portion for existing owner rows created by Phase 2 trigger
- memberMap built in server components and passed as prop -- avoids redundant member queries in client components
- Current user's initial derived from email (always available via auth) rather than display_name for reliability

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- TypeScript errors found in `src/app/invite/[token]/page.tsx` (from parallel 04-01 agent) using `asChild` prop not available on base-ui Button. Out of scope per deviation rules -- not caused by this plan's changes.

## Known Stubs

None -- all data is wired to real sources.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Member display infrastructure complete and reusable
- getHouseholdMembers action available for future features (CSV import user attribution, budget owner display)
- memberMap pattern established for any component needing user identification

## Self-Check: PASSED

- All created files verified on disk
- All commit hashes found in git log
- TypeScript compiles cleanly (only errors from parallel agent's files)

---
*Phase: 04-household-sharing*
*Completed: 2026-04-22*

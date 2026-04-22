---
phase: 04-household-sharing
plan: 03
subsystem: realtime
tags: [supabase-realtime, postgres-changes, react-hooks, websocket, visibilitychange]

# Dependency graph
requires:
  - phase: 04-01
    provides: "Household membership model and invite system"
  - phase: 04-02
    provides: "Transaction list with memberMap prop and member display names"
provides:
  - "useRealtimeTransactions hook for live INSERT/UPDATE/DELETE on transactions table"
  - "useRealtimeSync generic hook with visibilitychange fallback"
  - "Supabase Realtime publication migration for transactions table"
  - "Connection status indicator (green/amber dot) in transaction list"
affects: [05-csv-import, 06-budgets]

# Tech tracking
tech-stack:
  added: []
  patterns: [supabase-realtime-subscription, callback-ref-pattern, visibilitychange-fallback]

key-files:
  created:
    - hearth-budget/supabase/migrations/20260422000003_enable_realtime.sql
    - hearth-budget/src/hooks/use-realtime-sync.ts
    - hearth-budget/src/hooks/use-realtime-transactions.ts
  modified:
    - hearth-budget/src/components/transaction-list.tsx
    - hearth-budget/src/app/app/transactions/page.tsx

key-decisions:
  - "INSERT/UPDATE trigger full refetch (not optimistic insert) because Realtime postgres_changes only return raw rows without joined relations"
  - "DELETE uses direct local state removal since no joined data needed for removal"
  - "Callback refs prevent channel resubscription on every render"

patterns-established:
  - "useRealtimeSync: generic Realtime connection hook with visibilitychange fallback"
  - "Callback ref pattern: store callbacks in useRef to avoid resubscription"
  - "Double-gated security: household_id filter on channel + RLS policies"

requirements-completed: [SHAR-05, SHAR-06]

# Metrics
duration: 8min
completed: 2026-04-22
---

# Phase 04 Plan 03: Realtime Sync Summary

**Supabase Realtime subscriptions on transactions table with INSERT/UPDATE/DELETE handlers and visibilitychange fallback for live household sharing**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-22T06:09:36Z
- **Completed:** 2026-04-22T06:18:09Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Supabase Realtime enabled on transactions table via migration, allowing live event streaming to clients
- useRealtimeTransactions hook subscribes to INSERT/UPDATE/DELETE events filtered by household_id with automatic refetch for full joined data
- useRealtimeSync provides generic connection management with visibilitychange-based fallback for when Realtime is unavailable
- Transaction list shows green/amber dot indicating live sync status

## Task Commits

Each task was committed atomically:

1. **Task 1: Realtime migration, generic sync hook, and transaction-specific hook** - `efbd369` (feat)
2. **Task 2: Wire Realtime into transaction list and page** - `9cdafac` (feat)

## Files Created/Modified
- `hearth-budget/supabase/migrations/20260422000003_enable_realtime.sql` - Enables Supabase Realtime publication on transactions table
- `hearth-budget/src/hooks/use-realtime-sync.ts` - Generic Realtime connection hook with visibilitychange fallback
- `hearth-budget/src/hooks/use-realtime-transactions.ts` - Transaction-specific Realtime subscription hook with INSERT/UPDATE/DELETE handlers
- `hearth-budget/src/components/transaction-list.tsx` - Wired Realtime hook, added refetch/delete handlers, connection status indicator
- `hearth-budget/src/app/app/transactions/page.tsx` - Extracts householdId from membership query, passes to TransactionList

## Decisions Made
- INSERT and UPDATE events trigger a full refetch via getTransactions server action rather than optimistic local insertion, because Realtime postgres_changes events only return raw row columns without joined relations (categories.name, accounts.name). Displaying a transaction row requires this joined data.
- DELETE events remove the transaction from local state directly using old.id, since no joined data is needed for removal. This gives immediate visual feedback.
- Callbacks stored in useRef to prevent channel resubscription on every component re-render. The Supabase channel effect only depends on householdId and supabase client.
- household_id filter on the Realtime channel subscription provides double-gated security alongside RLS policies.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - Realtime is enabled via migration. No external service configuration required. The `supabase_realtime` publication is created automatically when the migration runs.

## Next Phase Readiness
- Phase 04 (Household Sharing) is now complete with all 3 plans delivered
- Invite system, display names, role-based UI, and live sync all operational
- Ready for Phase 05 (CSV Import) which can leverage the Realtime infrastructure for import progress notifications

---
*Phase: 04-household-sharing*
*Completed: 2026-04-22*

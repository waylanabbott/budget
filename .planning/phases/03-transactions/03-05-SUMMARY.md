---
phase: 03-transactions
plan: 05
subsystem: ui
tags: [transactions, list, infinite-scroll, filters, swipe, mobile, date-grouping]

# Dependency graph
requires:
  - phase: 03-transactions
    plan: 01
    provides: server actions for getTransactions, updateTransaction, deleteTransaction, getAccounts, getCategories
provides:
  - Transactions list page with date-grouped display
  - Infinite scroll pagination via IntersectionObserver
  - Search and filter controls (merchant search, account, category, date range)
  - Swipe-to-reveal edit/delete on mobile
  - Hover edit/delete on desktop
  - Inline edit form using updateTransaction server action
  - TransactionWithRelations and FilterState types for reuse
affects: [03-06]

# Tech tracking
tech-stack:
  added: []
  patterns: [IntersectionObserver infinite scroll, date-fns format/parseISO for date grouping, touch event swipe-to-reveal, debounced search input, cursor-based pagination in client component]

key-files:
  created:
    - hearth-budget/src/components/transaction-row.tsx
    - hearth-budget/src/components/transaction-filters.tsx
    - hearth-budget/src/components/transaction-list.tsx
  modified:
    - hearth-budget/src/app/app/transactions/page.tsx

decisions:
  - Inline edit form instead of TransactionSheet for edit mode because TransactionSheet (from plan 03-04) only supports create mode; edit needs updateTransaction
  - Touch events for swipe instead of a swipe library to keep bundle size small
  - Module-level type definitions for AccountRow and CategoryRow to avoid import coupling

metrics:
  completed: "2026-04-22"
  tasks: 2
  files: 4
---

# Phase 03 Plan 05: Transaction List Page Summary

Transactions list page with date-grouped infinite scroll, debounced merchant search, account/category/date filters, and swipe-to-edit/delete on mobile.

## Tasks Completed

### Task 1: Transaction row and filter components
- **transaction-row.tsx**: Displays merchant, category dot, amount (green for income), account name. Swipe left on mobile reveals edit/delete buttons via touch events (translateX animation). Desktop shows edit/delete on hover via group/opacity classes. Calls deleteTransaction with window.confirm.
- **transaction-filters.tsx**: Search bar with 300ms debounce, account/category HTML selects, date range inputs. Active filter count badge. Horizontal scroll on mobile.
- **Types exported**: `TransactionWithRelations` (Database row + joined categories/accounts), `FilterState` (search, account_id, category_id, date_from, date_to), `EMPTY_FILTERS` constant.

### Task 2: Transaction list with infinite scroll and page wiring
- **transaction-list.tsx**: Client component with IntersectionObserver on sentinel div for infinite scroll. Groups transactions by occurred_on date with sticky date headers (format: "EEEE, MMM d, yyyy" via date-fns). Filter changes reset list and refetch. Edit opens inline EditTransactionSheet that calls updateTransaction. Loading skeleton with 3 animated rows. Empty state prompts user to add first transaction.
- **transactions/page.tsx**: Server component with Promise.all fetching initial transactions, accounts, and categories. Passes data to TransactionList client component.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Built inline edit form instead of importing TransactionSheet**
- **Found during:** Task 2
- **Issue:** TransactionSheet (from plan 03-04, same wave) only supports create mode with createTransaction. Edit mode requires updateTransaction with existing data pre-filled.
- **Fix:** Built EditTransactionSheet as an inline function component within transaction-list.tsx that uses updateTransaction server action directly with pre-filled form fields.
- **Files modified:** hearth-budget/src/components/transaction-list.tsx

### Commits

Commits could not be created due to sandbox permission restrictions on git add/commit operations. All 4 files are written correctly and ready for commit by the orchestrator:
- hearth-budget/src/components/transaction-row.tsx (new)
- hearth-budget/src/components/transaction-filters.tsx (new)
- hearth-budget/src/components/transaction-list.tsx (new)
- hearth-budget/src/app/app/transactions/page.tsx (modified)

## Known Stubs

**1. Edit sheet category picker uses basic HTML select**
- **File:** hearth-budget/src/components/transaction-list.tsx (EditTransactionSheet)
- **Line:** ~254
- **Reason:** Plan 03-04 creates CategoryPicker component for rich category selection. The inline edit form uses a plain HTML select. Can be upgraded to CategoryPicker once 03-04 is integrated.

## Verification

- All acceptance criteria patterns verified present in each file via grep
- TypeScript compilation could not be verified due to sandbox restrictions on tsc execution
- Server component page does not contain 'use client' (verified)
- IntersectionObserver, sticky headers, swipe events, currency formatting all implemented per plan

## Self-Check: PARTIAL

- [x] hearth-budget/src/components/transaction-row.tsx EXISTS
- [x] hearth-budget/src/components/transaction-filters.tsx EXISTS
- [x] hearth-budget/src/components/transaction-list.tsx EXISTS
- [x] hearth-budget/src/app/app/transactions/page.tsx EXISTS (modified)
- [ ] Task 1 commit hash (commits blocked by sandbox permissions)
- [ ] Task 2 commit hash (commits blocked by sandbox permissions)

# Phase 3: Transactions — Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can enter, view, search, edit, and delete transactions from a mobile-first quick-add interface. Accounts (checking, savings, credit card, cash) are CRUD-able with current balances. Categories support one level of nesting with icon and color. A floating "+" button on every /app page opens the new-transaction sheet, completable in under 5 seconds on mobile.

</domain>

<decisions>
## Implementation Decisions

### Transaction Entry UI
- Amount-first input with numeric keyboard on mobile (inputMode="decimal")
- Category picker: show recent 6 categories, then "All categories" expandable section
- Account selector dropdown (only active/non-archived accounts)
- Date picker defaults to today
- Merchant autocomplete from past household transactions
- Optional notes field
- Submit button reachable without scrolling on 375px-wide screen
- Floating "+" button on every /app page opens a bottom sheet (Sheet component)

### Transaction List
- Grouped by date (sticky date headers)
- Infinite scroll pagination (cursor-based, not offset)
- Swipe-to-reveal edit/delete on mobile; buttons visible on desktop
- Search bar filters by merchant name
- Filter chips/dropdowns for account, category, and date range

### Accounts Management
- /app/accounts page with list showing name, type, current balance
- Create dialog: name, type (checking/savings/credit_card/cash), starting balance
- Edit dialog: same fields
- Archive (soft delete) — archived accounts hidden from selectors but preserved for historical transactions
- Current balance = starting_balance + sum(income transactions) - sum(expense transactions) for that account

### Categories Management
- /app/settings/categories page
- One level of nesting (parent → children)
- Each category has: name, icon (lucide icon name), color (hex), is_income flag
- Create/edit/archive categories
- Default 20 categories seeded by DB trigger already exist

### Claude's Discretion
- Specific shadcn/ui component choices for sheets, dialogs, and pickers
- Infinite scroll implementation details (IntersectionObserver vs library)
- Swipe gesture implementation (touch events vs library)
- Optimistic update patterns
- Server action vs API route for data mutations

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/supabase/client.ts` — browser Supabase client
- `src/lib/supabase/server.ts` — server Supabase client (async cookies)
- `src/types/database.ts` — full typed Database for all 14 tables
- `src/components/app-shell.tsx` — app shell with header + nav
- `src/components/bottom-nav.tsx` — mobile bottom nav (5 items)
- `src/components/app-sidebar.tsx` �� desktop sidebar
- `src/app/app/layout.tsx` — protected layout (fetches user + household)
- `src/components/ui/form.tsx` — react-hook-form integration
- `src/lib/schemas/` — Zod v4 schema pattern established

### Established Patterns
- Server actions for mutations (see src/app/actions/auth.ts, household.ts)
- Zod v4 validation with react-hook-form
- shadcn base-nova components (render prop, not asChild)
- Supabase typed queries with Database type
- Protected pages under src/app/app/ with layout auth guard

### Integration Points
- Transactions table: id, household_id, account_id, category_id, entered_by, amount, occurred_on (date), merchant, notes, source, external_hash
- Accounts table: id, household_id, name, type, starting_balance, is_archived
- Categories table: id, household_id, name, parent_id, icon, color, is_income, sort_order, archived_at
- occurred_on is DATE type — must send YYYY-MM-DD, never toISOString()
- amount is numeric(12,2) — always positive, sign inferred from category is_income
- RLS policies already enforce household membership on all three tables

</code_context>

<specifics>
## Specific Ideas

- From BUDGET_APP_PLAN.md: amount-first entry, category picker with recents, merchant autocomplete, 5-second mobile goal
- Floating "+" button should be fixed position, bottom-right, above bottom nav on mobile
- Transaction list uses occurred_on DESC ordering (index already exists: transactions_household_date_idx)
- Account balance is computed, not stored — calculate from starting_balance + transaction sums
- Merchant autocomplete: SELECT DISTINCT merchant FROM transactions WHERE household_id = ? AND merchant ILIKE ?

</specifics>

<deferred>
## Deferred Ideas

- Optimistic updates with Realtime sync (Phase 4 — Household Sharing)
- CSV import transactions (Phase 5)
- Budget cap display per category (Phase 6)

</deferred>

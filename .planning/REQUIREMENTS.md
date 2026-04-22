# Requirements: Hearth Budget

**Defined:** 2026-04-21
**Core Value:** Two people can track every dollar together in real time — entering transactions in seconds, seeing budget progress, and comparing spending to honest public benchmarks.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Bootstrap

- [ ] **BOOT-01**: App boots with `pnpm dev` showing a placeholder landing page
- [ ] **BOOT-02**: TypeScript strict mode enabled with ESLint + Prettier
- [ ] **BOOT-03**: PWA manifest served with "Hearth Budget" name and installable on mobile
- [ ] **BOOT-04**: Supabase client/server utilities configured with `@supabase/ssr`
- [ ] **BOOT-05**: Mobile viewport renders cleanly on 375px-wide screens

### Authentication

- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User can sign up with magic link
- [ ] **AUTH-03**: User can log in and stay logged in across sessions
- [ ] **AUTH-04**: User can log out from any page
- [ ] **AUTH-05**: Protected routes under /app/* require authentication via Supabase middleware

### Household

- [ ] **HSHD-01**: User can create a household with name during onboarding
- [ ] **HSHD-02**: User can set ZIP code and metro area during onboarding
- [ ] **HSHD-03**: User can select income bracket from BLS CEX brackets during onboarding
- [ ] **HSHD-04**: Household creator is auto-assigned as 'owner'
- [ ] **HSHD-05**: Default category tree is auto-populated for new households
- [ ] **HSHD-06**: App shell shows household name in header with bottom nav (mobile) / sidebar (desktop)

### Transactions

- [ ] **TXNS-01**: User can add a transaction with amount, category, account, date, merchant, and notes
- [ ] **TXNS-02**: Transaction entry is completable in under 5 seconds on mobile (amount-first, recent categories, no scroll to submit)
- [ ] **TXNS-03**: Floating "+" button accessible from every /app page opens new-transaction sheet
- [ ] **TXNS-04**: User can view transactions grouped by date with infinite scroll
- [ ] **TXNS-05**: User can search and filter transactions by account, category, and date range
- [ ] **TXNS-06**: User can edit and delete transactions (swipe on mobile, buttons on desktop)
- [ ] **TXNS-07**: Merchant autocomplete from past household transactions
- [ ] **TXNS-08**: Amount validated as positive decimal with max 2 decimal places; sign inferred from category type

### Accounts

- [ ] **ACCT-01**: User can create accounts (checking, savings, credit card, cash) with name and starting balance
- [ ] **ACCT-02**: User can edit and archive accounts
- [ ] **ACCT-03**: Account list shows current balances

### Categories

- [ ] **CATG-01**: User can view, create, edit, and archive categories
- [ ] **CATG-02**: Categories support one level of nesting (parent/child)
- [ ] **CATG-03**: Categories have icon and color properties

### Sharing

- [ ] **SHAR-01**: Household owner can generate a one-time invite link (7-day expiry)
- [ ] **SHAR-02**: Invited user can sign up or log in and join the household via invite link
- [ ] **SHAR-03**: Each transaction shows who entered it (avatar + initial)
- [ ] **SHAR-04**: Dashboard shows "You and [partner]" summary
- [ ] **SHAR-05**: Transactions, budgets, and goals update live via Supabase Realtime when partner makes changes
- [ ] **SHAR-06**: App falls back to optimistic UI + visibilitychange refetch when Realtime is unreliable

### CSV Import

- [ ] **CSVP-01**: User can upload a .csv file via drag-and-drop or file picker
- [ ] **CSVP-02**: Preview shows first 10 rows with column-mapping dropdowns (date, amount, merchant, category, account)
- [ ] **CSVP-03**: Smart detection for common bank formats (Chase, BofA, Wells Fargo, Capital One, Apple Card, Discover, AMEX, Mint)
- [ ] **CSVP-04**: Amount handling supports both signed single column and separate debit/credit columns with explicit user confirmation of sign interpretation
- [ ] **CSVP-05**: Duplicate detection via hash (account_id + date + amount + first 20 chars merchant) with user choice to skip or import
- [ ] **CSVP-06**: Category auto-suggestion from past household transactions for matching merchants
- [ ] **CSVP-07**: Batch insert with source='csv', logged in imports table with row count, status, errors
- [ ] **CSVP-08**: Import detail view with one-click "Undo this import" that deletes the batch

### Budgets

- [ ] **BDGT-01**: User can set monthly budget cap per category
- [ ] **BDGT-02**: Budget list shows: cap, spent this month, % of cap, days left, pace indicator (on track / ahead / over)
- [ ] **BDGT-03**: Pace indicator compares (spent/cap) to (days_elapsed/days_in_month)
- [ ] **BDGT-04**: Inline edit cap per category
- [ ] **BDGT-05**: "Copy last month's caps" button
- [ ] **BDGT-06**: Rollup at top: total caps, total spent, total remaining

### Savings Goals

- [ ] **GOAL-01**: User can create savings goal with name, target amount, target date, and optional linked account
- [ ] **GOAL-02**: Goal shows progress bar, required $/month to hit target, and projected hit date at current pace
- [ ] **GOAL-03**: User can make manual "contribution" entries that create Savings Transfer transactions
- [ ] **GOAL-04**: If linked to account, current amount auto-calculates from account balance above starting balance

### Benchmarks

- [ ] **BNCH-01**: BLS CEX data ingested into benchmarks_bls_cex table with source URL and data year
- [ ] **BNCH-02**: HUD FMR data ingested for each unique household ZIP with source URL and data year
- [ ] **BNCH-03**: Zillow ZORI and ZHVI data ingested for household ZIPs with 24 months of history
- [ ] **BNCH-04**: All ingestion is idempotent (upsert, not duplicate) and logged in benchmark_ingestion_log
- [ ] **BNCH-05**: /app/insights shows housing spend vs HUD FMR and Zillow ZORI with source labels
- [ ] **BNCH-06**: /app/insights shows category-by-category comparison vs BLS CEX for household income bracket
- [ ] **BNCH-07**: /app/insights shows ZHVI trend chart for household ZIP over 24 months
- [ ] **BNCH-08**: Every benchmark number has tooltip with source name, data year, and link to source page
- [ ] **BNCH-09**: Missing benchmark data shown explicitly ("No HUD FMR available for [ZIP]") — never fabricated
- [ ] **BNCH-10**: Changing household ZIP triggers re-fetch of benchmark data

### Forecasting

- [ ] **FCST-01**: Monthly spend forecast per category using weighted average of last 3 months (0.5/0.3/0.2)
- [ ] **FCST-02**: End-of-month projection = spent so far + (avg daily spend last 30 days * days remaining)
- [ ] **FCST-03**: Runway calculation = total balances / avg monthly net outflow last 3 months
- [ ] **FCST-04**: Savings goal ETA based on avg monthly contribution rate, with "Not on track" message when needed
- [ ] **FCST-05**: 60-day cash flow projection combining recurring bills + avg discretionary spend with ±1 std dev confidence band
- [ ] **FCST-06**: Dashboard tiles show projected end-of-month per category against caps
- [ ] **FCST-07**: "Methodology" link next to each forecast opens modal explaining formula and inputs
- [ ] **FCST-08**: Forecasts require minimum 60 days of transaction history; below that shows "Still learning your patterns"
- [ ] **FCST-09**: All forecast math is deterministic — no ML libraries

### Dashboard

- [ ] **DASH-01**: This month: spent vs total caps with sparkline of daily spend
- [ ] **DASH-02**: Goal progress cards (up to 3 most at-risk)
- [ ] **DASH-03**: Recent transactions (last 5)
- [ ] **DASH-04**: Cash flow chart for next 60 days (when sufficient history)
- [ ] **DASH-05**: Runway widget showing months of expenses covered

### Database & Security

- [ ] **DBSC-01**: Full schema deployed via Supabase migrations (all tables from plan)
- [ ] **DBSC-02**: RLS enabled on every household-scoped table with membership subquery policy
- [ ] **DBSC-03**: Service role key used only in Edge Functions and server Route Handlers, never in browser
- [ ] **DBSC-04**: All timestamps stored as UTC, displayed in household timezone (America/Denver default)
- [ ] **DBSC-05**: Transaction dates use local date string (not UTC conversion) to avoid off-by-one bugs

## v2 Requirements

Deferred to future releases.

### Plaid Integration

- **PLID-01**: User can connect bank accounts via Plaid Link
- **PLID-02**: Background sync via Plaid webhooks writes transactions with source='plaid'
- **PLID-03**: Deduplication against manual/CSV entries

### Advanced Budgeting

- **ADVB-01**: Zero-based / paycheck-allocation budgeting mode as opt-in toggle
- **ADVB-02**: Rollover unused budget to next month

### Intelligence

- **INTL-01**: ML-based auto-categorization (requires 6+ months of labeled data)
- **INTL-02**: Spending anomaly detection

## Out of Scope

| Feature | Reason |
|---------|--------|
| Plaid integration | Deferred to v2 — costs $0.30-0.60/item/month, validate need first |
| ML auto-categorization | Needs 6+ months of labeled transactions to outperform rules |
| Multi-currency | USD only unless travel/relocation makes it relevant |
| Investment tracking | Separate concern — use dedicated tools like Kubera |
| Receipt OCR | Mobile camera unreliability + vision API cost |
| Real-time chat between partners | Overkill for two-person household |
| Approval workflows for partner transactions | Creates friction, kills adoption |
| Native mobile app | PWA covers mobile use case adequately |

## Traceability

Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BOOT-01 | Phase 1 | Pending |
| BOOT-02 | Phase 1 | Pending |
| BOOT-03 | Phase 1 | Pending |
| BOOT-04 | Phase 1 | Pending |
| BOOT-05 | Phase 1 | Pending |
| DBSC-01 | Phase 1 | Pending |
| DBSC-02 | Phase 1 | Pending |
| DBSC-03 | Phase 1 | Pending |
| DBSC-04 | Phase 1 | Pending |
| DBSC-05 | Phase 1 | Pending |
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| AUTH-04 | Phase 2 | Pending |
| AUTH-05 | Phase 2 | Pending |
| HSHD-01 | Phase 2 | Pending |
| HSHD-02 | Phase 2 | Pending |
| HSHD-03 | Phase 2 | Pending |
| HSHD-04 | Phase 2 | Pending |
| HSHD-05 | Phase 2 | Pending |
| HSHD-06 | Phase 2 | Pending |
| TXNS-01 | Phase 3 | Pending |
| TXNS-02 | Phase 3 | Pending |
| TXNS-03 | Phase 3 | Pending |
| TXNS-04 | Phase 3 | Pending |
| TXNS-05 | Phase 3 | Pending |
| TXNS-06 | Phase 3 | Pending |
| TXNS-07 | Phase 3 | Pending |
| TXNS-08 | Phase 3 | Pending |
| ACCT-01 | Phase 3 | Pending |
| ACCT-02 | Phase 3 | Pending |
| ACCT-03 | Phase 3 | Pending |
| CATG-01 | Phase 3 | Pending |
| CATG-02 | Phase 3 | Pending |
| CATG-03 | Phase 3 | Pending |
| SHAR-01 | Phase 4 | Pending |
| SHAR-02 | Phase 4 | Pending |
| SHAR-03 | Phase 4 | Pending |
| SHAR-04 | Phase 4 | Pending |
| SHAR-05 | Phase 4 | Pending |
| SHAR-06 | Phase 4 | Pending |
| CSVP-01 | Phase 5 | Pending |
| CSVP-02 | Phase 5 | Pending |
| CSVP-03 | Phase 5 | Pending |
| CSVP-04 | Phase 5 | Pending |
| CSVP-05 | Phase 5 | Pending |
| CSVP-06 | Phase 5 | Pending |
| CSVP-07 | Phase 5 | Pending |
| CSVP-08 | Phase 5 | Pending |
| BDGT-01 | Phase 6 | Pending |
| BDGT-02 | Phase 6 | Pending |
| BDGT-03 | Phase 6 | Pending |
| BDGT-04 | Phase 6 | Pending |
| BDGT-05 | Phase 6 | Pending |
| BDGT-06 | Phase 6 | Pending |
| GOAL-01 | Phase 6 | Pending |
| GOAL-02 | Phase 6 | Pending |
| GOAL-03 | Phase 6 | Pending |
| GOAL-04 | Phase 6 | Pending |
| DASH-01 | Phase 6 | Pending |
| DASH-02 | Phase 6 | Pending |
| DASH-03 | Phase 6 | Pending |
| DASH-04 | Phase 6 | Pending |
| DASH-05 | Phase 6 | Pending |
| BNCH-01 | Phase 7 | Pending |
| BNCH-02 | Phase 7 | Pending |
| BNCH-03 | Phase 7 | Pending |
| BNCH-04 | Phase 7 | Pending |
| BNCH-05 | Phase 7 | Pending |
| BNCH-06 | Phase 7 | Pending |
| BNCH-07 | Phase 7 | Pending |
| BNCH-08 | Phase 7 | Pending |
| BNCH-09 | Phase 7 | Pending |
| BNCH-10 | Phase 7 | Pending |
| FCST-01 | Phase 8 | Pending |
| FCST-02 | Phase 8 | Pending |
| FCST-03 | Phase 8 | Pending |
| FCST-04 | Phase 8 | Pending |
| FCST-05 | Phase 8 | Pending |
| FCST-06 | Phase 8 | Pending |
| FCST-07 | Phase 8 | Pending |
| FCST-08 | Phase 8 | Pending |
| FCST-09 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 63 total
- Mapped to phases: 63
- Unmapped: 0

---
*Requirements defined: 2026-04-21*
*Last updated: 2026-04-21 after roadmap creation*

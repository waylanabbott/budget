# Roadmap: Hearth Budget

**Milestone:** v1
**Created:** 2026-04-21
**Granularity:** Standard (8 phases)
**Coverage:** 63/63 requirements mapped

## Phases

- [x] **Phase 1: Bootstrap** - Next.js 16 + Supabase + PWA shell + database schema and security (completed 2026-04-22)
- [ ] **Phase 2: Auth & Onboarding** - User authentication and household setup
- [ ] **Phase 3: Transactions** - Core transaction entry, accounts, and categories
- [ ] **Phase 4: Household Sharing** - Invite link, real-time sync, partner UI
- [ ] **Phase 5: CSV Import** - Bank CSV upload, mapping, dedup, and undo
- [ ] **Phase 6: Budgets, Goals & Dashboard** - Budget caps, savings goals, and the main dashboard
- [ ] **Phase 7: Benchmarks** - BLS/HUD/Zillow ingestion and Insights page
- [ ] **Phase 8: Forecasting** - Deterministic spend forecasts and cash flow projections

## Phase Details

### Phase 1: Bootstrap
**Goal**: A deployable Next.js 16 app with PWA shell, strict TypeScript, and a fully migrated Supabase schema with RLS ready for feature work
**Depends on**: Nothing (first phase)
**Requirements**: BOOT-01, BOOT-02, BOOT-03, BOOT-04, BOOT-05, DBSC-01, DBSC-02, DBSC-03, DBSC-04, DBSC-05
**Success Criteria** (what must be TRUE):
  1. Running `pnpm dev` shows a placeholder page and `pnpm build` completes with zero TypeScript errors
  2. The PWA is installable on a mobile device and shows "Hearth Budget" in the home screen prompt
  3. The Supabase database has all v1 tables deployed via migrations with RLS policies active on every household-scoped table
  4. The app renders cleanly at 375px width with no horizontal overflow
  5. Service role key is only accessible server-side; browser network tab shows no service key exposure
**Plans**: 2 plans
Plans:
- [x] 01-01-PLAN.md — Scaffold Next.js 16, install all deps, configure TypeScript/ESLint/Prettier, Supabase three-client split, PWA with Serwist, placeholder landing page
- [x] 01-02-PLAN.md — Write and push three Supabase migration files (schema + RLS + triggers), verify 14 tables deployed with RLS active
**UI hint**: yes

### Phase 2: Auth & Onboarding
**Goal**: Users can create accounts, log in, and complete household setup before accessing the app
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, HSHD-01, HSHD-02, HSHD-03, HSHD-04, HSHD-05, HSHD-06
**Success Criteria** (what must be TRUE):
  1. User can sign up with email/password or magic link and stay logged in across browser sessions
  2. User can log out from any page and is redirected to the login screen
  3. Navigating to /app/* while unauthenticated redirects to the login page via middleware
  4. A new user completing onboarding sees their household name in the header and a default category tree ready to use
  5. The app shell shows correct bottom nav on mobile and sidebar on desktop
**Plans**: 6 plans
Plans:
- [x] 02-01-PLAN.md — Migrate middleware.ts to proxy.ts (Next.js 16), add /app/* auth guard, create .env.local, scaffold vitest config + test stubs
- [x] 02-02-PLAN.md — Install shadcn UI components (form, tabs, radio-group, sonner, sidebar, etc.), define Zod v4 schemas for auth and onboarding
- [x] 02-03-PLAN.md — Build /login page (tabbed email/password + magic link), auth server actions, /auth/callback route handler
- [ ] 02-04-PLAN.md — Build ZIP-to-metro lookup utility, household server action, 3-step onboarding page with stepper UI
- [ ] 02-05-PLAN.md — Build protected app shell: layout.tsx, AppShell/BottomNav/AppSidebar components, 5 placeholder /app/* pages
- [ ] 02-06-PLAN.md — Manual smoke test checkpoint: verify full auth + onboarding + shell flow against live Supabase
**UI hint**: yes

### Phase 3: Transactions
**Goal**: Users can enter, view, search, and manage transactions in under 5 seconds on mobile, with accounts and categories fully configured
**Depends on**: Phase 2
**Requirements**: TXNS-01, TXNS-02, TXNS-03, TXNS-04, TXNS-05, TXNS-06, TXNS-07, TXNS-08, ACCT-01, ACCT-02, ACCT-03, CATG-01, CATG-02, CATG-03
**Success Criteria** (what must be TRUE):
  1. User can open the new-transaction sheet from any /app page via the floating "+" button and save a transaction in under 5 seconds on mobile
  2. Transaction list shows entries grouped by date with infinite scroll; swiping a row on mobile reveals edit and delete
  3. User can search transactions and filter by account, category, and date range with results updating immediately
  4. Merchant name autocompletes from past household transactions; amount accepts positive decimals to 2 places with no sign required
  5. Account list shows current balances and allows creating, editing, and archiving accounts; categories support one level of nesting with icon and color
**Plans**: TBD
**UI hint**: yes

### Phase 4: Household Sharing
**Goal**: Two people share one household in real time — the second person can join via invite link and both see each other's transactions live
**Depends on**: Phase 3
**Requirements**: SHAR-01, SHAR-02, SHAR-03, SHAR-04, SHAR-05, SHAR-06
**Success Criteria** (what must be TRUE):
  1. Household owner can generate a one-time invite link; recipient clicks it, signs up or logs in, and is placed in the same household
  2. When one partner adds or edits a transaction, the other partner sees the change without refreshing the page
  3. Every transaction shows an avatar + initial indicating who entered it
  4. Dashboard header shows "You and [partner name]" once both members have joined
  5. When Realtime is unavailable, the app continues to work optimistically and syncs on tab focus
**Plans**: TBD
**UI hint**: yes

### Phase 5: CSV Import
**Goal**: Users can import bank CSV files with smart column mapping, duplicate detection, and one-click undo
**Depends on**: Phase 3
**Requirements**: CSVP-01, CSVP-02, CSVP-03, CSVP-04, CSVP-05, CSVP-06, CSVP-07, CSVP-08
**Success Criteria** (what must be TRUE):
  1. User can drag-and-drop or pick a .csv file; the app recognizes Chase, BofA, Wells Fargo, Capital One, Apple Card, Discover, AMEX, and Mint formats automatically
  2. Preview shows first 10 rows with column-mapping dropdowns the user can correct before importing
  3. Duplicate transactions are flagged before import and the user can choose to skip or import each one
  4. Imported transactions are batch-inserted and logged with row count, status, and any errors
  5. Import history shows each import; clicking "Undo this import" removes the entire batch in one action
**Plans**: TBD
**UI hint**: yes

### Phase 6: Budgets, Goals & Dashboard
**Goal**: Users can set monthly budget caps per category, track savings goals, and see their financial picture summarized on the dashboard
**Depends on**: Phase 3
**Requirements**: BDGT-01, BDGT-02, BDGT-03, BDGT-04, BDGT-05, BDGT-06, GOAL-01, GOAL-02, GOAL-03, GOAL-04, DASH-01, DASH-02, DASH-03, DASH-04, DASH-05
**Success Criteria** (what must be TRUE):
  1. User can set a monthly cap per category; the budget list shows cap, amount spent, percentage used, days remaining, and a pace indicator (on track / ahead / over)
  2. "Copy last month's caps" populates all budget caps from the prior month in one click; individual caps are editable inline
  3. User can create a savings goal with a target amount and date; the goal shows a progress bar, required $/month, and projected hit date
  4. Manual goal contributions create Savings Transfer transactions; goals linked to an account auto-calculate from the account balance
  5. Dashboard shows this month's spend vs caps with a sparkline, the 3 most-at-risk goals, the last 5 transactions, and a runway widget showing months of expenses covered
**Plans**: TBD
**UI hint**: yes

### Phase 7: Benchmarks
**Goal**: Users can see how their spending compares to BLS CEX averages, HUD fair market rents, and Zillow rental and home-value data for their ZIP code, with every number cited
**Depends on**: Phase 6
**Requirements**: BNCH-01, BNCH-02, BNCH-03, BNCH-04, BNCH-05, BNCH-06, BNCH-07, BNCH-08, BNCH-09, BNCH-10
**Success Criteria** (what must be TRUE):
  1. BLS CEX, HUD FMR, and Zillow ZORI/ZHVI data load into the database via idempotent upserts logged in benchmark_ingestion_log
  2. /app/insights shows the household's housing spend vs HUD FMR and Zillow ZORI with source labels
  3. /app/insights shows category-by-category spending vs BLS CEX benchmarks for the household's income bracket
  4. /app/insights shows a 24-month Zillow ZHVI trend chart for the household ZIP
  5. Every benchmark number has a tooltip with source name, data year, and a link to the source page; missing data shows "No HUD FMR available for [ZIP]" rather than a fabricated number; changing the household ZIP triggers a re-fetch
**Plans**: TBD

### Phase 8: Forecasting
**Goal**: Users see deterministic, methodology-transparent forecasts of category spend, end-of-month projections, runway, and 60-day cash flow — all with visible math
**Depends on**: Phase 6
**Requirements**: FCST-01, FCST-02, FCST-03, FCST-04, FCST-05, FCST-06, FCST-07, FCST-08, FCST-09
**Success Criteria** (what must be TRUE):
  1. Dashboard tiles show projected end-of-month spend per category against caps using the weighted 3-month average formula
  2. End-of-month projection updates as transactions are added; runway shows total balances divided by avg monthly net outflow
  3. Savings goal cards show projected hit date and "Not on track" message when the contribution rate is insufficient
  4. 60-day cash flow chart shows recurring bills plus avg discretionary spend with a ±1 std dev confidence band
  5. Every forecast has a "Methodology" link that opens a modal explaining the formula and its inputs; forecasts below 60 days of history show "Still learning your patterns" instead
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Bootstrap | 2/2 | Complete   | 2026-04-22 |
| 2. Auth & Onboarding | 2/6 | In Progress|  |
| 3. Transactions | 0/? | Not started | - |
| 4. Household Sharing | 0/? | Not started | - |
| 5. CSV Import | 0/? | Not started | - |
| 6. Budgets, Goals & Dashboard | 0/? | Not started | - |
| 7. Benchmarks | 0/? | Not started | - |
| 8. Forecasting | 0/? | Not started | - |

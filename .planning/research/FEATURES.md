# Feature Landscape

**Domain:** Shared household budgeting PWA (manual + CSV entry, categorical caps, benchmarks, forecasting)
**Project:** Hearth Budget
**Researched:** 2026-04-21
**Confidence note:** Web access denied in this session. All findings draw from training data (cutoff August 2025) covering YNAB, Monarch Money, Copilot, Honeydue, Goodbudget, Simplifi, and Mint (deprecated). Competitive claims are MEDIUM confidence — verify against live product pages before finalizing roadmap.

---

## Table Stakes

Features users expect from any household budgeting app. Missing = product feels broken or abandoned before they try.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Transaction list with date grouping | Every competing app has this. Users scan "what did I spend today/this week" constantly | Low | Group by day, show merchant + amount + category at a glance |
| Manual transaction entry | Core input method for manual-entry apps. Users abandon if > 3 taps to log a coffee | Low-Med | Amount-first flow on numeric keypad is the proven pattern (YNAB, Copilot both use this) |
| Category assignment per transaction | Budgeting is meaningless without categories | Low | Must support fast selection — recents + search, not a flat 80-item list |
| Monthly budget caps per category | The core budgeting primitive. Every app from Goodbudget to Monarch has this | Med | Users want a number, a progress bar, and a remaining amount |
| Budget vs. actual summary view | "Am I on track this month?" is the #1 question users open the app to answer | Med | Period rollup, color-coded (green/yellow/red) |
| Account tracking (checking, savings, credit) | Users need to know which account a transaction came from for reconciliation | Low-Med | CRUD, starting balance, current balance computed from transactions |
| Search and filter transactions | Users hunt for specific charges constantly (disputes, taxes, memory) | Low-Med | Filter by date range, category, account, amount range, keyword |
| Edit and delete transactions | Data entry always has mistakes | Low | Swipe-to-edit on mobile is the expected pattern |
| Auth + secure login | Non-negotiable for financial data | Low | Email/password + magic link covers it |
| Mobile-responsive layout | 70%+ of budgeting app sessions happen on phones (MEDIUM confidence from industry patterns) | Med | Not just responsive — actually designed for thumb reach |

## Table Stakes: Household Sharing

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Two users on one household | The entire value proposition for couples apps. Honeydue's entire differentiator; Monarch and YNAB both support it | Med | RLS-scoped data; invite link flow is standard |
| See who entered each transaction | "Did you pay the electric bill?" is a real daily conversation. Couples need attribution | Low | Avatar/initial on transaction row is sufficient; no approval workflow needed at this level |
| Real-time or near-real-time sync | If partner's transaction takes 10+ minutes to appear, the app feels broken | Med | Supabase Realtime covers this; optimistic UI + socket fallback |
| Shared budget caps | Both people operate against the same $600 grocery cap, not separate ones | Low | Already in schema — household-scoped budgets |

## Table Stakes: Data Entry Alternatives

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| CSV import from banks | Users who don't use Plaid expect CSV. Every bank offers CSV export. Mint's death drove demand for manual-first apps with CSV | High | Column mapping UI is the hard part. Chase, BofA, Capital One, AMEX, Apple Card all have different formats |
| Duplicate detection on import | Import the same CSV twice → disaster. Users learn fast if this is missing | Med | Hash-based dedup (account + date + amount + merchant prefix) is standard and reliable |
| Import history / undo | One bad import (wrong column mapped) shouldn't require manual deletion of 200 rows | Med | Log + batch delete by import ID |

## Differentiators

Features that set a product apart. Not universally expected, but create loyalty and word-of-mouth when done well.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Honest benchmark comparisons with citations | No existing consumer app does this. YNAB/Monarch show your data only. The "how do we compare to the median family in our city" question goes unanswered everywhere | Very High | BLS CEX + HUD FMR + Zillow ZORI. The value is in the citation layer — showing source + data year prevents the app from feeling like it's making things up |
| Pace tracking (am I spending too fast?) | YNAB tracks "available" but not "you're 60% through your budget with 40% of the month left" in an obvious way. Copilot shows pace. Most apps don't | Med | pace = (spent/cap) - (days_elapsed/days_in_month). Dead simple math, high visual value |
| Deterministic forecasting with visible methodology | Mint had "projected" numbers with zero explanation. Users distrusted them. Showing the formula ("3-month weighted avg, 0.5/0.3/0.2") builds trust | High | The "Methodology" modal per forecast widget is the differentiator, not just the number |
| Cash flow chart (60-day projection) | Very few consumer budgeting apps show a runway chart. Mostly a personal finance tool feature. Users with variable income or irregular bills find this extremely valuable | High | Line chart + confidence band (±1 std dev). Requires recurring_bills + avg daily spend data |
| Runway widget ("X months of expenses covered") | Emergency fund literacy metric. Common in FIRE community, rare in consumer apps | Med | (account balances) / (avg monthly net outflow). Simple but rare to surface |
| Merchant autocomplete from history | Reduces friction for repeat transactions. Copilot does this well; most manual-entry apps don't | Med | Fuzzy match on past merchant strings for this household |
| Spending context for local market (ZIP-level) | HUD FMR and Zillow ZORI at ZIP level makes the benchmark local, not national averages | High | Already in schema. The differentiation is ZIP-level, not metro-level |
| One-tap recurring bill confirmation | Recurring bills appear as "pending" and need a tap to become real transactions. Prevents silent auto-posting that surprises users | Med | Recurring_bills → tap → becomes a transaction. Paranoid-but-correct UX |
| Savings goal ETA with monthly contribution calc | "Save $417/mo to hit $10k emergency fund by Dec 2026" is more actionable than a progress bar. Most apps show the bar without the required rate | Med | Requires goal + linked account + avg contribution history |

## Anti-Features

Features to explicitly NOT build in v1. Either because they create complexity that exceeds value, or because they'd distract from the core loop.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Plaid / bank account sync | Costs $0.30-0.60/connected item/month at production scale; requires Plaid compliance review; creates a dependency that breaks when banks change auth. Value is unproven until you've used the app for 1-2 months | Phase 8 — add only after CSV + manual is validated as insufficient |
| ML-based auto-categorization | Requires 6+ months of labeled transactions to outperform simple rule-based matching. Before that threshold, it actively mis-categorizes and erodes trust | Rule-based merchant→category matching from history. Revisit at 6 months |
| Zero-based / paycheck-allocation budgeting | Different mental model from categorical caps. Adding both options in v1 creates decision paralysis during onboarding. YNAB's learning curve is infamous | Phase 7 opt-in toggle after 2 months of categorical usage |
| Investment portfolio tracking | Different domain entirely — real-time price feeds, tax lot tracking, return calculations. Kubera, Empower, and Fidelity already do this well | Hard out-of-scope. Link out if users ask |
| Bill payment / bill pay | Requires banking integrations, compliance, error handling. High operational risk for a personal project | Not applicable — track bills, don't pay them |
| SMS / push notification reminders | Push requires service worker + notification permission UX + backend scheduler. Low completion rate if not done perfectly. Adds 2-3 weeks | Phase 9+ — start with in-app indicators instead |
| Social features (share with friends, challenges) | Honeydue tried this; it has low engagement. Household of two is a tight loop, not a social graph | Strictly household-scoped. No "share your budget" features |
| Multi-currency | Adds complexity to every amount display, calculation, and comparison. USD-only app is a complete product for the target user | Config flag for later; never v1 |
| Expense splitting / IOUs | Splitwise already owns this space. Overlap with household budgeting creates confusion about which app owns the truth | Out of scope. If a charge is split, user enters their portion |
| Receipt scanning / OCR | Unreliable on mobile cameras, requires backend vision API (cost + latency), frequent failure frustrates users | Manual entry is already fast enough at 5-second target |
| Subscription tracking / detection | Interesting but secondary. Requires pattern-matching recurring charges, which needs significant transaction history | Could emerge naturally from recurring_bills in Phase 7; don't build a dedicated scanner |
| Net worth dashboard | Requires investment accounts, real estate estimates, debt balances. Scope creep beyond spending tracker | Out of scope v1 |
| Tax reporting / categorization for Schedule C | Entirely different user (self-employed). Different category system, different UX | Hard out-of-scope |

---

## Feature Dependencies

```
Auth + household onboarding
  └── All other features (nothing works without a household)

Accounts (CRUD)
  └── Transactions (account_id required)
      └── CSV import (imports to a specific account)
      └── Duplicate detection (keyed on account_id)

Categories (CRUD, seeded defaults)
  └── Transactions (category_id)
  └── Budgets (category-scoped caps)
      └── Pace tracking (requires budget + transactions)
      └── Forecasting (requires budget + transaction history)

Transactions (manual entry, min 2 months history)
  └── Merchant autocomplete
  └── Forecasting (weighted avg requires history)
  └── Cash flow chart (requires avg daily spend)
  └── Runway widget (requires net outflow calc)
  └── ML auto-categorization (Phase 9+, requires 6+ months)

Household sharing (invite link flow)
  └── Real-time sync (Supabase Realtime on transactions)
  └── Attribution (entered_by on each transaction)

Recurring bills (Phase 5)
  └── Cash flow projection (Phase 7, bills appear as forecasted outflows)
  └── One-tap confirmation flow

Savings goals (Phase 5)
  └── Goal ETA calc (requires avg monthly contribution from transactions)
  └── Savings Transfer category (must exist before goal contribution entry)

Benchmark ingestion (BLS/HUD/Zillow) — Phase 6
  └── Insights / comparison page
  └── ZIP-level benchmark display (requires household.zip)
  └── Income bracket filtering (requires household.income_bracket from onboarding)

Forecasting module (Phase 7)
  └── Requires 60+ days transaction history to show (< 60 days → "still learning" state)
  └── Requires recurring_bills from Phase 5 for cash flow chart
  └── Requires savings goals from Phase 5 for goal ETA
```

---

## Mobile-First Transaction Entry UX — Detailed Analysis

This is a load-bearing feature. If adding a transaction takes > 5 seconds, users stop logging. The failure mode is: "I'll add it later" → they never do → data is incomplete → budgets are wrong → they stop trusting the app → they stop using it.

**Proven patterns from competing apps (MEDIUM confidence — from training data):**

- **Amount-first:** Show a large numeric keypad immediately. Don't make users tap into an amount field. YNAB and Copilot both open with the amount entry in focus.
- **Recent categories first:** Show the 4-6 most recently used categories before the full list. Users repeat categories constantly (Groceries, Gas, Restaurants cover ~60% of daily transactions).
- **Date defaults to today:** Only 5-10% of transactions are entered for a past date. Don't make users interact with a date picker for the common case.
- **Merchant autocomplete:** After typing 2-3 characters, surface past merchant names. Saves keystrokes on repeat vendors.
- **One-thumb reachability:** On a 375px screen, the submit button must be reachable without scrolling. Everything above the fold on mobile.
- **Floating "+" button:** Persistent across all screens. Users should never have to navigate to a specific page to add a transaction.
- **Sheet/modal over full page:** Opens transaction entry as a bottom sheet so context is preserved. Full-page navigation adds a back-button step.

**What to avoid:**
- Requiring account selection before amount (account rarely changes)
- Date picker that requires multiple taps (default today, tap to change)
- Category tree navigation (flat recent list + search covers 90% of cases)
- Confirmation dialogs after submit (optimistic UI, undo on error)

---

## CSV Import UX — Detailed Analysis

**Why CSV is harder than it looks:**

Every major US bank exports a subtly different CSV format. Common variations:

| Bank | Date format | Amount column(s) | Header row | Notes |
|------|-------------|-----------------|------------|-------|
| Chase | MM/DD/YYYY | Single signed column | Row 1 | Debits negative |
| Bank of America | MM/DD/YYYY | Separate debit/credit | Row 7+ | Multiple header rows |
| Wells Fargo | MM/DD/YYYY | Single signed column | Row 1 | |
| Capital One | YYYY-MM-DD | Single signed column | Row 1 | |
| Apple Card | YYYY-MM-DD | Single signed column | Row 1 | "Original Amount" may differ |
| American Express | MM/DD/YYYY | Single signed column | Row 1 | Positive = charge |
| Discover | MM/DD/YYYY | Single signed column | Row 1 | |
| Mint export | YYYY-MM-DD | Single signed + type | Row 1 | "Transaction Type" column |

**Column mapping UI is non-negotiable.** Auto-detection of format reduces friction but can't replace user confirmation. The UI pattern that works:

1. Upload file → detect likely column mapping by header names
2. Show preview of first 5-10 rows with mapping applied
3. Let user correct columns via dropdowns
4. Show "X rows ready to import, Y duplicates detected, Z rows skipped (no date)"
5. Confirm → batch insert → show import summary

**Duplicate detection hash:** `account_id + date + amount + merchant[:20].lower().strip()` — this is the industry-standard approach. It's not perfect (legitimate duplicate charges exist) so always let users override the "skip" recommendation.

---

## Benchmark Comparison Feature — Detailed Analysis

This is the most differentiating feature in the plan. No consumer budgeting app currently does this with source citations at the ZIP level. The failure modes to avoid:

**What makes benchmarks trustworthy:**
- Always show data year ("BLS 2024" not "national average")
- Always show source link in tooltip
- Explicitly say "No benchmark available" when data is missing — don't fill gaps
- Don't editorialize ("You're spending too much on groceries") — show the comparison and let users interpret

**What makes benchmarks misleading:**
- Showing national averages for a Salt Lake City user without noting the geographic mismatch
- Using outdated data without labeling it
- Implying the benchmark is a target ("you should spend $X")
- Using median vs. mean inconsistently without labeling which

**BLS CEX category mapping is the hard part.** BLS CEX categories don't map cleanly to user-defined categories. The mapping table needs to be:
- Maintained in a single file with comments
- Conservative (unmapped categories show "No benchmark" not a guess)
- Documented so users understand the methodology

---

## MVP Recommendation

Given the project is a two-person household with a clear roadmap already defined, the MVP priority order aligns with the existing phases:

**Must ship for the app to be useful at all (Phases 1-3):**
1. Auth + household creation + invite link (table stakes: sharing)
2. Manual transaction entry — amount-first, floating "+", 5-second target (table stakes: entry UX)
3. Category management with defaults seeded (table stakes: categorization)
4. Transaction list with date grouping, search, edit/delete (table stakes: list view)
5. Real-time sync between household members (table stakes: sharing)

**Must ship for the app to replace an existing tool (Phases 4-5):**
6. CSV import with column mapping + dedup + undo (table stakes: data entry alternatives)
7. Budget caps with pace tracking (table stakes: budget vs. actual)
8. Savings goals with ETA (differentiator: actionable goal tracking)

**Makes the app genuinely novel (Phases 6-7):**
9. Benchmark comparisons with BLS/HUD/Zillow citations (differentiator: honest benchmarks)
10. Deterministic forecasting with methodology modals (differentiator: explainable forecasts)
11. Cash flow chart + runway widget (differentiator: cash flow visibility)

**Defer explicitly (Phase 8+):**
- Plaid: only after 1-2 months of real usage confirms CSV is insufficient
- Zero-based budgeting: opt-in toggle after 2 months with categorical
- ML auto-categorization: only after 6+ months labeled transactions
- Investment tracking: permanent out-of-scope for this app

---

## Sources

- Training knowledge of YNAB, Monarch Money, Copilot, Honeydue, Goodbudget, Simplifi, and Mint (training cutoff August 2025). Confidence: MEDIUM — product features change frequently; verify against live product pages.
- Project plan from BUDGET_APP_PLAN.md — HIGH confidence (primary source)
- PROJECT.md requirements — HIGH confidence (primary source)
- BLS CSV format knowledge — MEDIUM confidence; bank CSV formats change without notice. Phase 4 implementation should detect headers dynamically.
- Note: WebSearch and WebFetch were not available in this session. Competitive feature claims should be validated against live product pages (YNAB.com/features, monarchmoney.com/features, copilot.money) before finalizing the roadmap.

# Architecture Research

**Domain:** Shared household budgeting PWA (Next.js 15 + Supabase)
**Researched:** 2026-04-21
**Confidence:** MEDIUM — WebSearch/WebFetch unavailable; findings from project files + training data on Supabase/Next.js 15. Flag for verification before implementation.

---

## Standard Architecture

### System Overview

```
┌────────────────────────────────────────────────────────────────────┐
│  Browser / PWA Shell (Service Worker + Cache)                      │
│  ┌──────────────┐  ┌─────────────────┐  ┌────────────────────┐    │
│  │ React Client │  │  Optimistic UI  │  │ Realtime Listener  │    │
│  │ Components   │  │  (transactions) │  │ (Supabase channel) │    │
│  └──────┬───────┘  └────────┬────────┘  └────────┬───────────┘    │
│         │                   │                    │                 │
│         └───────────────────┴────────────────────┘                 │
│                             │                                      │
└─────────────────────────────┼──────────────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────▼──────────────────────────────────────┐
│  Next.js 15 App Router (Vercel Edge + Serverless)                  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Server Components (RSC)  — data fetching, initial render    │  │
│  │  ┌──────────────┐  ┌────────────────┐  ┌─────────────────┐  │  │
│  │  │ /app/        │  │ /app/budgets   │  │ /app/insights   │  │  │
│  │  │ dashboard    │  │                │  │                 │  │  │
│  │  └──────────────┘  └────────────────┘  └─────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Route Handlers (/api/*)  — CSV parse, cron triggers         │  │
│  │  ┌─────────────────┐  ┌──────────────────┐                  │  │
│  │  │ /api/import/csv │  │ /api/cron/        │                  │  │
│  │  └─────────────────┘  └──────────────────┘                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Middleware — auth session refresh, route protection          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬──────────────────────────────────────┘
                              │ @supabase/ssr (anon key / service role)
┌─────────────────────────────▼──────────────────────────────────────┐
│  Supabase Platform                                                 │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Postgres (RLS-enforced)                                    │   │
│  │  households · household_members · accounts · categories     │   │
│  │  transactions · budgets · savings_goals · recurring_bills   │   │
│  │  benchmarks_bls_cex · benchmarks_hud_fmr · benchmarks_zillow│   │
│  │  imports · household_invites · benchmark_ingestion_log      │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │                                      │
│  ┌──────────────────────────▼──────────────────────────────────┐   │
│  │  Auth (JWT, magic link, email+password)                     │   │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Realtime (postgres_changes, channel broadcast)             │   │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Edge Functions (Deno)                                      │   │
│  │  ┌────────────────┐  ┌───────────────┐  ┌────────────────┐  │   │
│  │  │ ingest-bls-cex │  │ ingest-hud-fmr│  │ ingest-zillow  │  │   │
│  │  └────────────────┘  └───────────────┘  └────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬──────────────────────────────────────┘
                              │
┌─────────────────────────────▼──────────────────────────────────────┐
│  External Data Sources (ingested, cached in Postgres)              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ BLS CEX tables   │  │ HUD FMR API      │  │ Zillow Research  │  │
│  │ (annual CSV)     │  │ (token-gated)    │  │ (monthly CSV)    │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| RSC pages (server) | Fetch initial data with service-role or user session, render HTML | Supabase (server client), layout |
| Client components | Interactivity, optimistic updates, form handling | Supabase (browser client), RSC via props |
| Realtime listener | Subscribe to `postgres_changes` on transactions/budgets/goals | Supabase Realtime, local React state |
| Middleware | Refresh auth session cookie on every request, protect /app/* routes | Supabase Auth, Next.js router |
| Route handlers (/api) | CSV parsing (server-side), cron endpoint for benchmark refresh triggers | Supabase (service-role client), Edge Functions |
| Service worker | Cache app shell + static assets, offline fallback page | Browser cache API, Next.js build output |
| Edge Functions (Deno) | Fetch external benchmark data, upsert into Postgres, log ingestion | BLS API, HUD API, Zillow CSV, Supabase Postgres |
| Supabase Auth | Issue JWTs, handle magic links, expose `auth.uid()` to RLS | All RLS policies |
| Postgres + RLS | Single source of truth; enforce access at database layer | All server/edge/client reads and writes |
| Supabase Realtime | Broadcast row-change events to subscribed clients | Postgres WAL, browser WebSocket connections |

---

## RLS Architecture — Multi-User Household Pattern

### Core Pattern: Membership Join Check

Every household-scoped table uses a subquery into `household_members` rather than a direct `user_id = auth.uid()` column match. This enables 1-to-many household membership without duplicating ownership logic.

```sql
-- Applied to: transactions, accounts, budgets, savings_goals,
--             recurring_bills, categories, imports
create policy "household members only"
on <table_name> for all
using (
  household_id in (
    select household_id
    from household_members
    where user_id = auth.uid()
  )
)
with check (
  household_id in (
    select household_id
    from household_members
    where user_id = auth.uid()
  )
);
```

**Why subquery, not join:** RLS policies must return a boolean per row. A subquery into a membership table is the standard Supabase-recommended pattern for org/group access. [MEDIUM confidence — consistent with Supabase docs architecture at training cutoff]

### Invite Table: Tighter Policy Scoping

`household_invites` needs split policies because create and redeem are different actors:

```sql
-- Only household owners can create invite links
create policy "owners create invites"
on household_invites for insert
using (
  household_id in (
    select household_id from household_members
    where user_id = auth.uid() and role = 'owner'
  )
);

-- Anyone with a valid token can read (for the /invite/[token] page)
-- The token itself is the access credential; limit to non-redeemed
create policy "public token read"
on household_invites for select
using (redeemed_at is null and expires_at > now());

-- Only the accepting user can update (mark redeemed)
create policy "token redeemer updates"
on household_invites for update
using (redeemed_at is null);
```

### Benchmark Tables: No RLS Needed

`benchmarks_bls_cex`, `benchmarks_hud_fmr`, `benchmarks_zillow`, and `benchmark_ingestion_log` contain public data with no PII. Use `anon` role for reads, service-role only for writes from Edge Functions. This avoids RLS overhead on large benchmark tables.

```sql
-- benchmark tables: public read, service-role write
alter table benchmarks_bls_cex enable row level security;
create policy "public read benchmarks"
on benchmarks_bls_cex for select
using (true); -- all authenticated users can read
-- Writes happen via Edge Function with service_role key (bypasses RLS)
```

### Performance: Security Definer Functions

For complex membership checks called frequently (e.g., dashboard loads), wrapping the membership check in a `security definer` function avoids per-row subquery overhead:

```sql
create function is_household_member(hid uuid)
returns boolean
language sql security definer stable
as $$
  select exists(
    select 1 from household_members
    where household_id = hid and user_id = auth.uid()
  );
$$;

-- Then in policy:
create policy "members only"
on transactions for all
using (is_household_member(household_id));
```

[MEDIUM confidence — this is a documented Supabase optimization but verify current recommended approach]

---

## Realtime Sync Architecture

### What to Subscribe To

Subscribe at the `household_id` filter level, not globally. Supabase Realtime `postgres_changes` filters support `filter: 'household_id=eq.{id}'`.

Tables that need realtime:
- `transactions` — live feed when partner adds a transaction
- `budgets` — if partner edits a budget cap
- `savings_goals` — contribution updates

Tables that do NOT need realtime:
- `categories`, `accounts`, `recurring_bills` — change infrequently; refetch on navigation
- `benchmarks_*` — static reference data; never realtime

### Subscription Pattern (Client Component)

```typescript
// src/components/realtime/TransactionRealtimeProvider.tsx
'use client'

import { useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export function TransactionRealtimeProvider({
  householdId,
  children,
}: {
  householdId: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const channel = supabase
      .channel(`household:${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `household_id=eq.${householdId}`,
        },
        () => {
          // Invalidate RSC data by triggering a router refresh
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [householdId, router, supabase])

  return <>{children}</>
}
```

**Key design choice — `router.refresh()` over local state:** In Next.js 15 App Router, RSC data lives server-side. `router.refresh()` re-fetches server components without a full page reload. This keeps realtime sync simple: the client component listens for changes and triggers RSC re-render, avoiding client-side cache management complexity.

**RLS and Realtime:** Supabase Realtime respects RLS for `postgres_changes` subscriptions when the client connects with the user's JWT (anon key + user session). The filter `household_id=eq.{id}` combined with RLS means a user only receives events for their household. [MEDIUM confidence — verify Supabase Realtime RLS enforcement is on by default in current version]

### Offline / Flaky Connection Strategy

Supabase Realtime over cellular is unreliable (documented gotcha in BUDGET_APP_PLAN.md). Two-layer approach:

1. **Optimistic UI for writes:** Immediately update local state on transaction submit; reconcile on server response. Use React's `useOptimistic` hook (stable in React 19 / Next.js 15).
2. **Polling fallback:** On `channel.on('error')` or when the tab becomes visible after being hidden, call `router.refresh()` to re-sync. Do not depend on the socket being alive for correctness.

```typescript
// Visibility-based refetch fallback
useEffect(() => {
  const onVisible = () => {
    if (document.visibilityState === 'visible') router.refresh()
  }
  document.addEventListener('visibilitychange', onVisible)
  return () => document.removeEventListener('visibilitychange', onVisible)
}, [router])
```

---

## Edge Functions Architecture — Benchmark Ingestion

### Execution Model

Supabase Edge Functions run on Deno. They are invoked via:
1. **HTTP trigger** — from a Next.js Route Handler (`/api/cron/benchmarks`) or directly via `supabase.functions.invoke()`
2. **Supabase scheduled** — using pg_cron or via Vercel cron hitting the Next.js Route Handler

### Ingestion Pattern per Function

Each of the three ingestion functions follows the same contract:

```
1. Verify external endpoint is reachable (HEAD or small GET)
2. Fetch/download data (paginated if needed)
3. Parse and map to internal schema
4. Upsert (ON CONFLICT DO UPDATE) into benchmark table
5. Write summary row to benchmark_ingestion_log
6. Return { rows_upserted, rows_skipped, errors[] }
```

### Service Role Requirement

Edge Functions use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for benchmark writes. This key must NEVER be exposed to the browser. All benchmark writes go through Edge Functions or server-only Route Handlers.

### Cron Scheduling

```
ingest-bls-cex   → Annual (schedule via Vercel cron: 0 6 1 1 *)
ingest-hud-fmr   → Annual + on-demand (household ZIP change event)
ingest-zillow    → Monthly (schedule: 0 6 1 * *)
```

**On-demand trigger for HUD FMR:** When a household updates its ZIP in Settings, the Next.js Route Handler fires `supabase.functions.invoke('ingest-hud-fmr', { body: { zip: newZip } })` to backfill that ZIP immediately.

### Data Flow: External → Cache → UI

```
BLS / HUD / Zillow (external)
    ↓ (Edge Function fetches, transforms)
benchmarks_* tables (Postgres, public read)
    ↓ (RSC query on /app/insights page load)
Server Component (formats data, attaches source metadata)
    ↓
Client Component (renders comparison cards with source tooltips)
```

The benchmark data is **never computed at request time** — always read from the cached Postgres tables. The ingestion functions are the only writers.

---

## PWA Service Worker Strategy

### Scope

For a two-person daily-use financial app, the PWA goal is:
1. **Installable on mobile** (manifest + service worker registration)
2. **Fast shell load** on repeat visits (cache app shell)
3. **Graceful offline** (show cached data or a clear offline message; never show stale financial totals as "current")
4. **No background sync of transactions** (financial data must be explicitly synced; silent background writes are dangerous)

### next-pwa Configuration

`next-pwa` (Ducanh's fork, `@ducanh2912/next-pwa`) wraps Workbox and integrates with Next.js 15 App Router.

```javascript
// next.config.ts
import withPWA from '@ducanh2912/next-pwa'

const nextConfig = { /* ... */ }

export default withPWA({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: false, // financial data: prefer fresh
  reloadOnOnline: true,               // force refresh when connection restores
  disable: process.env.NODE_ENV === 'development',
})(nextConfig)
```

### Caching Strategy by Asset Type

| Asset Type | Strategy | Rationale |
|------------|----------|-----------|
| App shell (JS, CSS, fonts) | CacheFirst | Static assets have content-hash filenames; safe to cache forever |
| Next.js page HTML | NetworkFirst (fallback to cache) | Financial data must be fresh; show cached version only when offline |
| Supabase API calls | NetworkOnly | Never cache transaction or budget API responses; staleness is worse than a loading state |
| Benchmark data pages | StaleWhileRevalidate | Benchmarks update annually/monthly; showing slightly stale is acceptable |
| Offline fallback page | CacheFirst | Pre-cached at install time; shown when network fails and no cache exists |

### Manifest

```json
{
  "name": "Hearth Budget",
  "short_name": "Hearth",
  "theme_color": "#0f172a",
  "background_color": "#0f172a",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/app",
  "icons": [...]
}
```

`start_url: "/app"` ensures install-launch drops the user directly into the protected shell, not the marketing landing page.

---

## Data Flow: Transaction Entry → Budget Calculations → Forecasting

### Full Pipeline

```
User taps "+" on mobile
    ↓
TransactionForm (client component)
    ↓ useOptimistic — immediately show row in list
    ↓ supabase.from('transactions').insert({...})
    ↓ (RLS validates household_id membership)
Postgres writes row
    ↓ WAL event → Supabase Realtime
    ↓ Partner's browser receives postgres_changes event
    ↓ router.refresh() on partner's device
RSC re-render fetches fresh data
    ↓ Budget calculations run in RSC (server-side)
    ↓ BudgetProgress = SUM(transactions WHERE category_id AND month) / budget.amount
Dashboard + Budgets page updated for both users
    ↓ (async, separate flow)
Forecasting module reads last 90 days of transactions
    ↓ /lib/forecast.ts computes weighted averages
    ↓ Results hydrated into Forecast widgets on next dashboard load
```

### Budget Calculation: Where It Lives

Budget math runs in **Server Components**, not the client, not Edge Functions. Rationale:
- No client-side state management complexity
- Numbers are always authoritative (straight from DB)
- RSC re-render triggered by realtime keeps them fresh

```typescript
// src/app/(app)/budgets/page.tsx — Server Component
async function BudgetsPage() {
  const supabase = createServerClient()
  const { data: budgets } = await supabase
    .from('budgets')
    .select(`
      *,
      category:categories(*),
      spent:transactions(amount.sum())
        .filter(occurred_on, gte, monthStart)
        .filter(occurred_on, lte, today)
    `)
  // Pace calculation: (spent / cap) - (daysElapsed / daysInMonth)
  return <BudgetList budgets={budgets} />
}
```

In practice, the "spent" aggregation is best done via a Postgres view or a join query rather than client-side filter, keeping the RSC thin.

### Forecasting: Computation Location

Forecasting runs in a `src/lib/forecast.ts` module called from Server Components only. It is deterministic, pure TypeScript — no API calls, no ML. Inputs come from a DB query; outputs are plain numbers passed as props to client chart components.

```
/app/dashboard (RSC)
    → queries last 90 days of transactions (server)
    → calls computeForecast(transactions, budgets, recurringBills)
    → passes { projectedSpend, runway, goalETA } to client chart components
    → Recharts renders line chart in browser
```

**Forecasting does not subscribe to realtime.** It refreshes when the dashboard RSC re-renders (triggered by `router.refresh()` from the realtime listener). This is acceptable — forecasts are not instant-accurate financial positions.

---

## Recommended Project Structure

```
src/
├── app/
│   ├── (auth)/                   # Auth route group (no layout chrome)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── onboarding/page.tsx
│   ├── (app)/                    # Protected route group (bottom nav layout)
│   │   ├── layout.tsx            # Auth check, RealtimeProvider wrapper
│   │   ├── page.tsx              # Dashboard (RSC)
│   │   ├── transactions/
│   │   │   ├── page.tsx          # List (RSC)
│   │   │   └── new/page.tsx      # Form (client)
│   │   ├── budgets/page.tsx      # RSC — pace calculations here
│   │   ├── goals/page.tsx        # RSC
│   │   ├── insights/page.tsx     # RSC — reads from benchmarks_* tables
│   │   ├── import/
│   │   │   ├── page.tsx          # Upload UI (client)
│   │   │   └── [id]/page.tsx     # Import detail (RSC)
│   │   └── settings/
│   │       ├── household/page.tsx
│   │       ├── categories/page.tsx
│   │       └── connections/page.tsx  # Phase 8: Plaid
│   ├── invite/[token]/page.tsx   # Public — invite redemption
│   └── api/
│       ├── import/csv/route.ts   # Parses CSV server-side, writes transactions
│       └── cron/
│           ├── benchmarks/route.ts  # Triggers Edge Functions on schedule
│           └── zillow/route.ts
├── components/
│   ├── ui/                       # shadcn/ui primitives (auto-generated)
│   ├── realtime/
│   │   └── RealtimeProvider.tsx  # Client wrapper — subscribe + router.refresh()
│   ├── transactions/
│   │   ├── TransactionForm.tsx   # Client — optimistic submit
│   │   ├── TransactionList.tsx   # Client — infinite scroll
│   │   └── QuickAddFAB.tsx       # Client — floating action button
│   ├── budgets/
│   │   ├── BudgetProgress.tsx    # Pace bar component
│   │   └── BudgetList.tsx
│   ├── charts/
│   │   ├── CashFlowChart.tsx     # Recharts wrapper
│   │   └── SpendSparkline.tsx
│   └── benchmarks/
│       └── BenchmarkCard.tsx     # Source-cited comparison card
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # createBrowserClient()
│   │   ├── server.ts             # createServerClient()
│   │   └── middleware.ts         # Session refresh middleware
│   ├── forecast.ts               # Pure TS — deterministic forecasting math
│   ├── csv-parser.ts             # Bank format detection + column mapping
│   ├── dedup.ts                  # Transaction dedup hash logic
│   └── benchmarks/
│       ├── bls-mapping.ts        # BLS category → internal category map
│       └── format.ts             # Source citation formatting
├── types/
│   ├── database.ts               # Supabase generated types
│   └── app.ts                    # App-level derived types
└── middleware.ts                 # Auth session refresh, /app/* protection

supabase/
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_rls_policies.sql
│   ├── 003_triggers_functions.sql
│   └── 004_household_invites.sql
└── functions/
    ├── ingest-bls-cex/index.ts
    ├── ingest-hud-fmr/index.ts
    └── ingest-zillow/index.ts
```

### Structure Rationale

- **Route groups `(auth)` and `(app)`:** Separate layouts without URL segments. Auth routes get minimal chrome; app routes get the bottom nav and realtime provider.
- **`lib/forecast.ts` as pure module:** Keeps forecast logic testable in isolation, not embedded in RSC data-fetching code.
- **`lib/supabase/` split:** `client.ts` for browser, `server.ts` for RSC/Route Handlers. Mixing these is the #1 source of auth bugs in Next.js + Supabase projects.
- **`components/realtime/`:** Isolates all WebSocket subscription code. RSC pages import this as a wrapper, keeping RSC files free of `'use client'`.
- **`supabase/functions/`:** Co-located with migrations so schema and ingestor stay in sync.

---

## Architectural Patterns

### Pattern 1: RSC for Data, Client Components for Interactivity

**What:** Server Components own data fetching and calculation; Client Components own forms, optimistic updates, and realtime subscriptions. Never fetch data in a client component if an RSC can own it.

**When to use:** All pages in this app. Dashboard, budgets, insights are RSC. Transaction form, FAB, realtime listener are client.

**Trade-offs:** RSC re-renders (via `router.refresh()`) are slightly heavier than local state updates but keep server as source of truth — critical for financial data accuracy.

### Pattern 2: Optimistic UI + Server Reconciliation for Transaction Entry

**What:** On transaction submit, immediately add the row to the local displayed list using `useOptimistic`. If the server write fails, roll back. Don't wait for the server round-trip before showing the new transaction.

**When to use:** All writes where latency would otherwise feel sluggish on mobile (transactions, goal contributions).

**Trade-offs:** Adds rollback handling complexity. Worth it for sub-5-second transaction entry UX goal.

### Pattern 3: Benchmark Data as Read-Only Reference Tables

**What:** External benchmark data is ingested once into Postgres, cached indefinitely until the next scheduled ingest. UI queries these tables directly; it never calls BLS/HUD/Zillow APIs from the browser or RSC at page-load time.

**When to use:** Any external data that changes infrequently (annually or monthly). Never make page load time contingent on third-party API availability.

**Trade-offs:** Data may be stale between ingest cycles. Mitigated by always displaying `data_year` and `ingested_at` next to every benchmark number.

### Pattern 4: Security Definer Functions for Complex RLS

**What:** Wrap multi-step membership checks (e.g., "is this user an owner of this household?") in Postgres `security definer` functions that are called from RLS policies. Avoids per-row subquery overhead.

**When to use:** Any RLS policy that does a subquery into another table (e.g., `household_members`). At two users the performance difference is academic, but this pattern scales and is the documented Supabase recommendation.

---

## Data Flow

### Request Flow — Dashboard Load

```
User opens /app (browser)
    ↓
Middleware refreshes auth session cookie
    ↓
RSC: /app/(app)/page.tsx
    ↓ createServerClient() with user session
    ↓ SELECT transactions, budgets, goals, recurring_bills
      WHERE household_id = [user's household] — enforced by RLS
    ↓ computeForecast(data) — pure TS, no I/O
    ↓ render HTML with data
    ↓
Client browser hydrates
    ↓ RealtimeProvider mounts, subscribes to household channel
    ↓ Chart components (Recharts) animate in
```

### Write Flow — Transaction Entry

```
User fills TransactionForm
    ↓ useOptimistic: add row to list immediately
    ↓ supabase.from('transactions').insert({
        household_id,  // from session context
        account_id, category_id, amount, occurred_on, merchant, source: 'manual'
      })
    ↓ Postgres INSERT — RLS verifies household membership
    ↓ WAL → Supabase Realtime → postgres_changes event
    ↓ Partner's RealtimeProvider receives event
    ↓ router.refresh() on partner's device
    ↓ Partner's dashboard RSC re-renders with new transaction
```

### Ingestion Flow — Benchmark Data

```
Vercel Cron fires /api/cron/benchmarks (monthly for Zillow, annual for others)
    ↓ Route Handler calls supabase.functions.invoke('ingest-zillow')
    ↓ Edge Function fetches Zillow CSV (public URL, no auth)
    ↓ Parse CSV, extract rows for all household ZIPs
    ↓ UPSERT into benchmarks_zillow ON CONFLICT (zip_code, metric, as_of)
    ↓ Write to benchmark_ingestion_log { function, rows_upserted, errors }
    ↓ Return 200 with summary
    ↓ (No realtime push — UI reads fresh data on next page load)
```

### CSV Import Flow

```
User drops bank CSV on /app/import
    ↓ Client reads file, sends to /api/import/csv (POST)
    ↓ Route Handler parses CSV server-side (papaparse or native)
    ↓ Detects bank format by header fingerprint
    ↓ Applies column mapping (user-confirmed in preview step)
    ↓ Computes dedup hash per row: hash(account_id + date + amount + merchant[:20])
    ↓ Queries existing transactions for matching hashes
    ↓ Returns preview: { rows, duplicates[], suggested_categories }
    ↓ User confirms in UI
    ↓ POST to /api/import/csv/confirm
    ↓ Batch INSERT transactions (source='csv') with service-role to bypass RLS?
       — NO: use user's session; RLS will enforce household ownership
    ↓ INSERT into imports log
    ↓ Return { import_id, rows_inserted, rows_skipped }
```

**Important:** CSV import writes use the user's session (not service role) so RLS is enforced. The service role is only used for benchmark ingestion from Edge Functions.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| BLS CEX tables | Edge Function: annual HTTP download of CSV/XLSX | No auth required; URL may drift — verify in Phase 6 before trusting |
| HUD FMR API | Edge Function: REST API with `HUD_API_TOKEN` header | Free token registration at huduser.gov; rate limits apply |
| Zillow Research | Edge Function: monthly CSV download from static URLs | No auth; verify URL format hasn't changed before Phase 6 |
| BLS CPI API | Route Handler or Edge Function with optional `BLS_API_KEY` | Rate-limited without key (50 req/day); key raises to 500/day |
| Supabase Auth | `@supabase/ssr` middleware pattern | Use `createServerClient` in middleware, never in Edge runtime directly |
| Vercel Cron | `vercel.json` cron config hitting `/api/cron/*` routes | Free tier: 1 cron job; scheduling all three benchmark refreshes requires one dispatcher route |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| RSC ↔ Client components | Props (serializable only) | No functions, no class instances — plain data objects and primitives only |
| Client ↔ Supabase | `createBrowserClient()` with anon key + user JWT | RLS enforces all data access |
| RSC / Route Handler ↔ Supabase | `createServerClient()` with session cookies | Must use `@supabase/ssr` cookie adapter, not direct client |
| Route Handler ↔ Edge Functions | `supabase.functions.invoke()` with service role | Only for triggering ingestion; never expose service role to client |
| Edge Functions ↔ Postgres | Supabase Postgres client with service role | Bypasses RLS — appropriate only for benchmark writes |
| `lib/forecast.ts` ↔ RSC | Pure function import — no I/O | Input: transaction array + budget array; output: plain forecast object |
| Service Worker ↔ Next.js | Workbox (via next-pwa) intercepts fetch events | Financial API calls must use NetworkOnly — never cached |

---

## Anti-Patterns

### Anti-Pattern 1: Fetching Data in Client Components

**What people do:** `useEffect(() => { supabase.from('transactions').select().then(setData) }, [])` in a client component.

**Why it's wrong:** Data arrives after first paint (flash of empty state), RLS requires user session (manageable but adds complexity), and it duplicates what RSC handles better. Client data fetching also breaks streaming and suspense boundaries.

**Do this instead:** Fetch in RSC, pass as props. Use client components only for interactivity (forms, optimistic updates, charts that need browser APIs).

### Anti-Pattern 2: Using the Service Role Key Client-Side

**What people do:** Pass `SUPABASE_SERVICE_ROLE_KEY` in `NEXT_PUBLIC_*` env vars to use from the browser.

**Why it's wrong:** Service role bypasses all RLS. Exposing it client-side gives any user full database access. One DevTools inspection reveals the key.

**Do this instead:** Service role is used ONLY in Edge Functions and Route Handlers (server-side). Browser clients use the anon key + user JWT.

### Anti-Pattern 3: Caching Financial API Responses in the Service Worker

**What people do:** Add Supabase REST endpoints to the Workbox cache strategy.

**Why it's wrong:** A user opens the app offline and sees transaction totals that are hours stale, potentially making financial decisions on bad data.

**Do this instead:** Mark all Supabase API calls as `NetworkOnly` in the Workbox config. Show a clear offline state when the API is unreachable rather than stale numbers.

### Anti-Pattern 4: Computing Budget Pace Client-Side

**What people do:** Fetch raw transactions to the browser, compute totals with `.reduce()`, and display.

**Why it's wrong:** Sends potentially thousands of transaction rows to the client. Calculations are duplicated on every client, increasing surface area for bugs. Not suitable for server-rendered pages.

**Do this instead:** Use a Postgres aggregate query (or view) to compute `SUM(amount)` per category per month server-side. RSC receives one number per budget line, not thousands of rows.

### Anti-Pattern 5: One Realtime Subscription Per Page

**What people do:** Open a new Supabase Realtime channel in every route's client component.

**Why it's wrong:** Each subscription is a WebSocket channel. With 5 routes open in different tabs (or during navigation), the user accumulates multiple channels for the same data. Supabase free tier has channel limits.

**Do this instead:** One `RealtimeProvider` at the root `(app)/layout.tsx`. It subscribes to the household channel once and calls `router.refresh()` on any change. All child pages benefit from a single subscription.

---

## Build Order Implications

Dependencies flow in this order. Each phase must complete before the next can function correctly.

```
Phase 0: Bootstrap (Next.js shell, PWA manifest, env setup)
    ↓
Phase 1: Schema + Auth + Household (RLS policies, triggers, onboarding)
    ↓ [ALL subsequent phases depend on household_id + auth.uid() being correct]
Phase 2: Transaction Entry (writes to schema from Phase 1)
    ↓
Phase 3: Realtime Sync (requires transactions to exist; adds RealtimeProvider)
    ↓ [Realtime Provider wraps layout from this point forward]
Phase 4: CSV Import (requires accounts + categories + dedup logic)
    ↓
Phase 5: Budgets + Goals (requires transaction history; adds pace calculations)
    ↓
Phase 6: Benchmark Ingestion (independent of transaction data; requires Edge Functions + cron)
    ↓ [benchmarks_* tables must be populated before insights page is useful]
Phase 7: Forecasting (requires 60+ days of transactions from Phase 2+; reads benchmarks from Phase 6)
```

**Parallelizable:** Phase 6 (benchmark ingestion) can start after Phase 1 (schema exists). It does not depend on Phase 2–5 transaction data. Could be built in parallel with Phase 3–5 if time allows.

**Not parallelizable:** Phase 7 (forecasting) strictly requires both Phase 5 (budget structure) and Phase 6 (benchmark context for insights display). Do not start Phase 7 until both are complete.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 2 users (v1) | Current architecture is correct. Supabase free tier handles this comfortably. |
| 10–100 users | Add index on `transactions(household_id, occurred_on DESC)` (already in schema). Monitor `benchmark_*` table size — benchmark data is shared across households, not per-household. |
| 1k+ users | Replace `router.refresh()` realtime pattern with optimistic client state (TanStack Query or SWR) to reduce RSC re-render load. Move forecast computation to a materialized view refreshed periodically. |
| 10k+ users | Separate benchmark ingestion into a dedicated job queue (consider Inngest or similar). Shard benchmark reads with a CDN edge cache layer. At this scale, Supabase Pro tier is needed. |

**For this project:** The 2-user scenario is the only realistic case in v1. Architecture decisions should optimize for developer velocity and correctness, not throughput. The `router.refresh()` pattern, while heavier than local state, is correct for financial data and acceptable at this scale.

---

## Sources

- Project context: `/Users/waylansmac/budget/BUDGET_APP_PLAN.md` and `.planning/PROJECT.md`
- Supabase RLS patterns: training data (cutoff August 2025); verify at https://supabase.com/docs/guides/auth/row-level-security before Phase 1
- Supabase Realtime with Next.js App Router: training data; verify at https://supabase.com/docs/guides/realtime and https://supabase.com/docs/guides/auth/server-side/nextjs
- next-pwa (Ducanh fork): training data; verify current fork at https://github.com/DuCanhGH/next-pwa before Phase 0
- Next.js 15 App Router RSC/client boundary: training data; verify at https://nextjs.org/docs/app/building-your-application/rendering
- WebSearch and WebFetch unavailable during this research session — all findings are MEDIUM confidence unless cited to project files

---

*Architecture research for: Hearth Budget — shared household budgeting PWA*
*Researched: 2026-04-21*

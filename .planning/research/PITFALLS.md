# Pitfalls Research

**Domain:** Shared household budgeting PWA (Next.js 15 + Supabase)
**Researched:** 2026-04-21
**Confidence:** HIGH (Supabase RLS, timezone, CSV, PWA); MEDIUM (BLS/Zillow API schema drift)

---

## Critical Pitfalls

### Pitfall 1: RLS Policy Bypassed via Service Role Key in Client Context

**What goes wrong:**
The `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS policies entirely. If this key is used server-side (e.g., in a Next.js Route Handler) without manually filtering by `household_id`, one user can read or mutate another household's data. The anon key correctly enforces RLS, but service role is silently unrestricted.

**Why it happens:**
Developers reach for the service role key when they hit permission errors during development, then forget to scope queries by `household_id`. The bug is invisible in a single-household dev environment — it only surfaces when a second household exists.

**How to avoid:**
- Use the service role key only for admin jobs (benchmark ingestion, cron tasks) that legitimately need to skip RLS.
- In Route Handlers serving user requests, use `createServerClient` with the anon key + user's session cookie so RLS applies automatically.
- Add a test: create two households with different users, verify user A cannot query user B's transactions via any API endpoint.
- Enforce in code review: any file importing `SUPABASE_SERVICE_ROLE_KEY` must have a comment explaining why RLS bypass is intentional.

**Warning signs:**
- A Route Handler constructs a Supabase client with `supabaseServiceRoleKey` and then does `select * from transactions` without a `where household_id = ?` clause.
- The `imports` table's `user_id` is not RLS-filtered (it's in the schema but RLS on it must be confirmed).

**Phase to address:** Phase 1 (schema and auth). Establish the rule before any data endpoints exist. Verify in Phase 3 when multi-user becomes real.

---

### Pitfall 2: RLS Missing on the `household_invites` Table (Token Enumeration)

**What goes wrong:**
The invite token is a random UUID stored in `household_invites`. If RLS is misconfigured — specifically if an unauthenticated user can `select * from household_invites` — an attacker can enumerate valid tokens and join any household. The token is only secret if the table row is not publicly readable.

**Why it happens:**
Developers enable RLS on the main data tables but forget new tables added mid-project (like `household_invites`) and leave them open, especially during development when Supabase's "Table Editor" is used without verifying the default policy.

**How to avoid:**
- In Supabase, enabling RLS on a table with no policies defined makes the table inaccessible to everyone by default. Never leave a table with RLS disabled after launch.
- Policy for `household_invites`: unauthenticated SELECT restricted to just the token lookup needed for redemption (`where token = $token and redeemed_at is null and expires_at > now()`). Do not expose the full table.
- Write a migration test: attempt `select * from household_invites` as an anon user — it must return 0 rows.

**Warning signs:**
- The `household_invites` table has `RLS enabled: false` in Supabase dashboard.
- The invite endpoint does a `select` by token using the service role client (masks the gap in a single-user test).

**Phase to address:** Phase 3 (household sharing). The migration for this table should include RLS policies in the same migration file — not as a follow-up.

---

### Pitfall 3: Transaction Dates Stored as `timestamptz` Instead of `date`, Causing Off-by-One-Day Bugs

**What goes wrong:**
A user in Salt Lake City (America/Denver, UTC-7) enters a transaction at 11:00 PM on April 30. If the client sends a UTC ISO timestamp (`2026-05-01T06:00:00Z`), the server stores it as May 1. The budget for April is undercounted; May is overcounted. Month-boundary budget calculations are silently wrong.

**Why it happens:**
Developers default to `timestamptz` for "everything" because it's the safe choice for events. But a transaction's "occurred on" date is a user-declared local date, not a moment in time — it is semantically a `date`, not a timestamp.

**How to avoid:**
- The schema correctly uses `occurred_on date` for transactions. Do not change this to `timestamptz`.
- On the client, send `occurred_on` as a `YYYY-MM-DD` string derived from the local date (use `date-fns format(new Date(), 'yyyy-MM-dd')` in the user's browser locale, not `toISOString().split('T')[0]` which is UTC).
- For `date-fns` operations in server components, always pass the household timezone (America/Denver) explicitly: use `date-fns-tz` for `startOfMonth`/`endOfMonth` when computing budget periods.
- The `created_at` column (audit trail) stays `timestamptz` UTC — that's correct.

**Warning signs:**
- Month-boundary transactions are off by one day in budget totals.
- The transaction entry form uses `new Date().toISOString().slice(0, 10)` for the default date (this gives UTC date, not local date at midnight-to-1AM).
- Budget pace math uses `timestamptz` columns instead of the `date` column for period filtering.

**Phase to address:** Phase 2 (transaction entry). Validate the date input component sends a local `YYYY-MM-DD`, and Phase 5 (budgets) must use `date-fns-tz` for all period boundary calculations.

---

### Pitfall 4: CSV Amount Sign Convention Not Confirmed Per-Bank Before Insert

**What goes wrong:**
Chase exports: positive = debit (money out), Apple Card exports: negative = debit. Bank of America: one column "Amount" where debits are positive, credits are negative. Mint export: separate "Transaction Type" column with "debit"/"credit". If the import logic assumes a single convention, half of all imports will have their signs flipped — expenses become income and vice versa. Budget calculations invert entirely.

**Why it happens:**
Developers test with one bank's CSV, assume it's universal, and ship. The bug surfaces only when a second user imports from a different bank.

**How to avoid:**
- Never infer sign convention silently. The column-mapping UI must show a preview of computed amounts (positive = expense, negative = income) and require explicit user confirmation before inserting.
- For the "separate debit/credit columns" pattern: parse both columns, use whichever is non-zero, apply the sign based on which column it came from.
- For "signed single column": show the user a toggle "Positive values are: Expenses / Income" with a sample from their file.
- The duplicate-detection hash must normalize amount sign before hashing — otherwise a re-import with a corrected sign mapping creates a duplicate instead of overwriting.

**Warning signs:**
- After import, net income shows as large negative (expenses treated as income inflows).
- Bank of America and Chase imports show opposite signs for the same type of transaction.
- The import preview shows amounts but not a "type" (expense/income) column.

**Phase to address:** Phase 4 (CSV import). The column-mapping UI is where this is won or lost. Make sign confirmation mandatory before batch insert.

---

### Pitfall 5: CSV Duplicate Detection Hash Fragility

**What goes wrong:**
The planned hash: `(account_id + date + amount + first 20 chars of merchant, case-insensitive, whitespace-collapsed)` is correct in principle but breaks in several cases:
- Bank renames "AMAZON.COM*AB12CD" differently each transaction — first 20 chars differ.
- Chase adds trailing spaces or asterisks; normalizing only case and spaces misses them.
- The user imports the same file to two different accounts (hash includes `account_id`, so both are accepted).
- Amount rounding: "12.4" vs "12.40" hash differently if not normalized to 2 decimal places.

**Why it happens:**
Merchant strings from banks are not canonical. The same merchant, same purchase, same day can have completely different description strings across a re-export.

**How to avoid:**
- Normalize merchant string aggressively before hashing: lowercase, strip all non-alphanumeric except spaces, collapse spaces, trim, take first 20 chars.
- Normalize amount to always 2 decimal places as a string before hashing.
- Store the hash in the `transactions` table and add a unique constraint on `(account_id, external_hash)` — let the DB enforce dedupe, don't rely on application-level checks alone.
- Present flagged near-duplicates (same date, same amount, different merchant string) as "probable duplicates" for user review even when hashes differ.

**Warning signs:**
- After a second import of the same file, transaction count doubles.
- Users report "ghost transactions" that appeared after re-import.
- The `imports` table shows `errors: null` but transaction count doubled (silent duplicate failure).

**Phase to address:** Phase 4 (CSV import). Define and test the hash function in isolation before wiring it to the insert path.

---

### Pitfall 6: BLS CEX Category Mapping Drift Causes Silent Data Gaps

**What goes wrong:**
BLS reorganizes CEX table structure and category names when they release new survey years. A mapping file written against 2023 CEX tables silently returns `null` for categories that were renamed in the 2024 release (e.g., "Food away from home" becomes "Food and beverages away from home"). The Insights page shows "No benchmark available" for all restaurants — not because data doesn't exist, but because the mapping key mismatches.

**Why it happens:**
The ingestion function is written once, validated against a specific release, and then treated as permanent. BLS doesn't guarantee category name stability across survey years.

**How to avoid:**
- In the ingestion Edge Function, log every BLS row category name that fails to match the mapping table. Surface these in the `benchmark_ingestion_log` table, not just in console output.
- Add an assertion: after ingestion, verify that at least the top 10 expected categories (Housing, Food, Transportation, Healthcare, etc.) have non-null data. Fail loudly if they don't.
- Keep the BLS-to-internal mapping in a single file (`lib/bls-category-map.ts`) with a comment showing the BLS source column name exactly as it appears in the CSV — this makes drift immediately visible on the next update.
- Pin the ingestion job to a specific BLS table URL (e.g., `intb1202.xlsx`) and alert when the HTTP response changes schema.

**Warning signs:**
- `benchmarks_bls_cex` has rows with `category = null` or `category = 'unknown'`.
- The Insights page shows "No benchmark available" for Housing or Food (which always have BLS data).
- `benchmark_ingestion_log` shows 0 errors but the benchmark table has fewer rows than expected.

**Phase to address:** Phase 6 (benchmark ingestion). Build the mapping validation and log assertions before the Insights UI is built — the UI will mask gaps that the log would catch.

---

### Pitfall 7: Supabase Realtime Subscription Not Reconnecting After Mobile Background/Foreground Cycle

**What goes wrong:**
On iOS and Android, the browser aggressively suspends WebSocket connections when the PWA is backgrounded. The Supabase Realtime subscription silently dies. When the user returns to the app, the transaction list appears current but is stale — the partner's entries don't appear until a manual reload.

**Why it happens:**
Supabase Realtime uses a WebSocket-based channel. Mobile OS WebSocket lifecycle differs from desktop: connections are dropped on app background (typically after 30 seconds to a few minutes). The `@supabase/supabase-js` v2 client does attempt reconnection, but the re-subscription may not re-fire the `on('INSERT')` callback for events that arrived while disconnected — those events are lost.

**How to avoid:**
- Never make the UI depend on Realtime as the sole data delivery mechanism. Use Realtime as an "instant refresh hint" that triggers a query refetch, not as the data source itself.
- Implement a `visibilitychange` listener: when `document.visibilityState === 'visible'`, invalidate the transaction cache and refetch from Supabase directly. This covers the background/foreground gap.
- Use React Query or SWR with a `refetchOnWindowFocus: true` setting as the foundation — Realtime subscription then becomes an additive optimization.
- Display a "last updated" timestamp on the transaction list so users know when data was last synced.

**Warning signs:**
- Transaction list doesn't update after switching apps and returning.
- The Realtime channel status stays `SUBSCRIBED` in the client but partner transactions aren't appearing (phantom subscription).
- The PWA passes desktop testing but fails on physical iPhone/Android device testing.

**Phase to address:** Phase 3 (household sharing and real-time sync). Design the data layer with `visibilitychange` refetch from day one — it's much harder to retrofit than to build in.

---

### Pitfall 8: next-pwa Caching SW Serving Stale Next.js Builds After Deploy

**What goes wrong:**
After deploying a new build, users who have the PWA installed continue serving the old JavaScript bundle from the service worker cache. They don't see the update until they manually close all tabs and reopen — which most users never do. This means bug fixes and schema changes deploy to the server but users continue running old client code that may conflict with the new API responses.

**Why it happens:**
`next-pwa` generates a service worker with cache-busted asset URLs based on build hash. But if the service worker update flow is not implemented, the browser only installs the new SW when all old tabs are closed — a condition that never occurs naturally for installed PWAs.

**How to avoid:**
- Use `next-pwa`'s `skipWaiting: true` and `clientsClaim: true` options to force immediate SW activation on update.
- Implement a `message` event listener in the SW that responds to `SKIP_WAITING`. Pair this with an in-app "Update available — tap to refresh" banner using the `useRegisterSW` hook from `vite-plugin-pwa` or equivalent next-pwa registration hook.
- Test the update flow explicitly: build v1, install the PWA, build v2, reload — verify the new version loads.

**Warning signs:**
- After a deploy, some users report the old UI while others see the new one.
- Console shows "Service worker: new content is available; please refresh."
- The manifest `version` field does not increment between builds.

**Phase to address:** Phase 0 (PWA bootstrap). Bake the update flow into the initial SW configuration — it requires architectural commitment that is painful to add later.

---

### Pitfall 9: Supabase `@supabase/ssr` Cookie Auth Breaking on Next.js 15 Server Components

**What goes wrong:**
Next.js 15 uses React's async server component model. `@supabase/ssr`'s `createServerClient` requires reading cookies via `cookies()` from `next/headers`. In Next.js 15, `cookies()` is async and must be awaited. If the Supabase client is created without awaiting cookies, the auth session is undefined — all RLS policies evaluate as if the user is anon, silently returning empty data instead of throwing an error.

**Why it happens:**
Many tutorials were written for Next.js 13/14 where `cookies()` was synchronous. The Next.js 15 breaking change to async cookies is documented but easy to miss, and the failure mode (empty data, not an error) makes it hard to detect.

**How to avoid:**
- Use the official Supabase Next.js 15 documentation pattern: `const cookieStore = await cookies()` before passing to `createServerClient`.
- Create a single canonical `src/lib/supabase/server.ts` that properly awaits cookies — import it everywhere instead of constructing clients inline.
- Add a test: in a server component that requires auth, `assert(session !== null)` and verify it throws when the user is not logged in rather than silently returning empty data.

**Warning signs:**
- Server components return empty arrays for authenticated queries.
- `getUser()` returns `null` in server components for a logged-in user.
- The RLS policy appears correct but queries return 0 rows on the server side while the client side works fine.

**Phase to address:** Phase 0/1 (bootstrap and auth). Establish the canonical server client pattern in Phase 0 before any data queries are written.

---

### Pitfall 10: Benchmark Data Displayed Without Staleness Guards

**What goes wrong:**
The `benchmarks_bls_cex` table is ingested annually. The `ingested_at` column records when data was loaded. If the annual ingestion job silently fails (e.g., BLS changed the download URL), the Insights page continues showing the previous year's data with the old `data_year` label — but the user sees no warning that the comparison might be outdated. Worse: if `data_year` is hardcoded in the ingestion function rather than parsed from the source, it will show "2024 BLS" in perpetuity even in 2027.

**Why it happens:**
The benchmark ingestion is a background job with no on-screen error surface. Failures are invisible until a user notices stale years on the Insights page — if they notice at all.

**How to avoid:**
- Parse `data_year` from the source data itself, not from a constant in code.
- In the Insights UI, show `data_year` next to every benchmark number (the plan already requires this — enforce it in code review).
- Add a staleness warning: if `ingested_at` for any benchmark is older than 400 days (BLS releases annually), show "Data may be outdated — last updated [date]" rather than suppressing the warning.
- The `benchmark_ingestion_log` table should be checked by a monitoring query or Vercel cron health check. Log a warning if any source hasn't been ingested in more than 13 months.

**Warning signs:**
- `benchmarks_bls_cex.data_year` shows a value from a constant string in code (`data_year: 2024`) rather than parsed from the source file.
- `ingested_at` is older than the expected annual refresh cycle.
- Insights page shows numbers that match the previous year exactly after a new BLS release.

**Phase to address:** Phase 6 (benchmark ingestion). Build the staleness check and logging before the Insights UI renders any numbers.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode `America/Denver` timezone everywhere instead of per-household config | Faster Phase 1 | Cannot add second household in different timezone without a full-app refactor | Never — store timezone per household from day one (schema already supports this) |
| Use service role key in all Route Handlers to avoid auth headaches | No permission errors in dev | All RLS becomes decorative; data isolation is illusory | Never for user-facing endpoints |
| Skip the `external_hash` unique constraint on transactions, rely on app-level check | Simpler schema | Concurrent imports (two tabs) can insert duplicates that the app-level check can't catch | Never — DB constraints are the last line of defense |
| Fetch benchmark data at request time from BLS/HUD/Zillow instead of caching | No ingestion job to build | Rate limits, downtime, slow page loads, stale-on-miss | Never — the cache table approach in the plan is correct |
| Skip `WITH CHECK` clause in RLS policies (only use `USING`) | Slightly less SQL | Users can insert rows they can't read back; silent write corruption | Never — always pair `USING` with `WITH CHECK` |
| Build CSV import with hardcoded column offsets per bank | Faster initial implementation | Breaks when any bank changes export format (they do) | Never — header-based detection as planned is the right approach |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase RLS | Using `auth.uid()` in a policy on a table that also has inserts from a service-role Edge Function — the uid() is null in Edge Function context | For Edge Function writes, bypass RLS with service role intentionally and add `household_id` filter manually in the query |
| BLS CEX API | Downloading the Excel file (`.xlsx`) without a parser — `XLSX` library adds significant bundle weight | Run ingestion in a Supabase Edge Function (Node runtime), not in the Next.js client; use `xlsx` on the server only |
| HUD FMR API | Requesting all ZIPs in one API call — HUD API has per-request limits and requires pagination | Batch by household ZIP at ingestion time; only fetch ZIPs that exist in the `households` table |
| Zillow Research | Zillow's CSV download URLs change format when they release new datasets (column names, row structure) | Pin to a specific named file URL; validate column headers at ingestion start before committing any rows |
| Supabase Realtime | Subscribing to `postgres_changes` on the `transactions` table without a `filter` — receives all household events globally | Always use `filter: \`household_id=eq.${householdId}\`` in the channel subscription |
| next-pwa + App Router | `next-pwa` v5 (based on `workbox`) has limited compatibility with Next.js 15 App Router's RSC streaming | Use `@ducanh2912/next-pwa` (actively maintained fork) or `@serwist/next` which has explicit Next.js 15 support |
| date-fns + server components | `date-fns` functions like `startOfMonth` operate in the runtime's timezone (UTC on Vercel) | Always use `date-fns-tz` with explicit `timeZone` parameter for any budget period calculation |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| No index on `transactions(household_id, occurred_on desc)` | Budget and transaction list queries slow as transaction count grows | The plan includes this index — verify it exists in the migration before Phase 5 | ~500+ transactions per household (~6 months of active use) |
| Fetching all transactions in a server component to compute budget totals | Page load slows significantly; Supabase free tier bandwidth consumed quickly | Use `sum()` aggregate queries and push budget math to Postgres, not JavaScript | ~200+ transactions |
| Real-time subscription on every page mount without cleanup | Multiple active channels per user; memory leaks; Supabase connection limits hit | Always `supabase.removeChannel(channel)` in the `useEffect` cleanup | After navigating between pages 10+ times in a session |
| Benchmark ingestion fetching the full BLS CEX Excel file on every cron run | Slow ingestion job; BLS rate limiting | Check `ingested_at` and skip if the data year hasn't changed; use `If-Modified-Since` header | First time the annual cron runs correctly — then silently wastes resources every month |
| Recharts rendering large transaction datasets inline | Chart render jank on mobile | Aggregate data server-side before passing to Recharts; limit Recharts to displaying pre-computed time series, not raw transactions | >100 data points in a chart |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing `SUPABASE_SERVICE_ROLE_KEY` via a `NEXT_PUBLIC_` prefixed env var | Full database access with no RLS from any client | Never prefix service role key with `NEXT_PUBLIC_`; audit `.env.example` to ensure this key has no public prefix |
| No expiry on invite tokens | Old invite links can be redeemed indefinitely if not cleaned up | Enforce `expires_at > now()` check in both the RLS policy AND application code; add a cron to delete expired tokens |
| Allowing invite redemption without re-checking household membership limit | An attacker with an expired or already-redeemed token retries until they succeed | The `redeemed_at is null` and `expires_at > now()` checks must be atomic — use a DB transaction with a `FOR UPDATE` lock on the invite row |
| CSV import accepting files without server-side validation | Maliciously crafted CSV can cause parsing errors or inject large payloads | Validate file size (<5MB), MIME type, and row count on the server in the Route Handler before parsing |
| Benchmark ingestion Edge Function callable without auth | Anyone who discovers the Edge Function URL can trigger expensive external API calls | Require `Authorization: Bearer [SUPABASE_SERVICE_ROLE_KEY]` header on all ingestion Edge Functions; do not expose them via anon callable paths |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Date picker defaults to UTC today, not local today | Transactions entered after 5 PM Mountain appear dated tomorrow | Default to `format(new Date(), 'yyyy-MM-dd')` in the user's browser locale, never `new Date().toISOString().slice(0, 10)` |
| Benchmark copy says "You should be spending $X on groceries" | Users feel judged by national averages that don't reflect their city or lifestyle | Use "BLS average for your income bracket is $X/mo" — descriptive, not prescriptive |
| No "undo" for bulk CSV imports | A bad import contaminates months of budget data with no recovery path | The plan's "Undo this import" feature is critical — build it in Phase 4, not as a future enhancement |
| Budget pace shown as raw percentage without context | "67% spent with 50% of month elapsed" is clear; just "67% spent" is ambiguous | Always show spent%, cap%, and days-elapsed% together in the pace indicator |
| Realtime sync indicator absent | Users unsure if partner's entries are visible; they re-enter transactions as duplicates | Show a subtle "Synced X min ago" or live dot indicator on the transaction list header |
| PWA install prompt shown on first visit | Users dismiss it before understanding the app's value | Defer the install prompt until after the user has added their first transaction (engagement trigger) |

---

## "Looks Done But Isn't" Checklist

- [ ] **RLS policies:** `WITH CHECK` clause exists on every `INSERT`/`UPDATE` policy, not just `USING` — verify each table in migration SQL.
- [ ] **Invite flow:** Expired and already-redeemed tokens both return a clear error page, not a silent success or 500.
- [ ] **CSV import:** After importing a file twice, transaction count does not double — verify unique constraint on `(account_id, external_hash)` fires.
- [ ] **Timezone:** Transaction entered at 11:55 PM Mountain Time has `occurred_on = today` in Mountain Time, not tomorrow (UTC+0).
- [ ] **Realtime:** After backgrounding the PWA for 2 minutes on a physical phone and returning, the next transaction added by the partner appears within 5 seconds (via refetch-on-focus).
- [ ] **Benchmark staleness:** Insights page shows `data_year` parsed from source data, not a hardcoded constant.
- [ ] **Service worker update:** After deploying a new build, the installed PWA prompts "Update available" rather than silently serving the old bundle.
- [ ] **Budget periods:** `startOfMonth` and `endOfMonth` in server components use `date-fns-tz` with `America/Denver`, not bare `date-fns` (which uses server UTC).
- [ ] **BLS ingestion log:** After running ingestion, `benchmark_ingestion_log` contains a row with counts of mapped vs unmapped categories. Zero unmapped rows confirms mapping coverage.
- [ ] **Amount signs:** After importing a Chase CSV and a Bank of America CSV, the same type of transaction (grocery purchase) shows as an expense in both, not an expense in one and income in the other.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Service role key used in user endpoints (RLS bypassed) | HIGH | Audit all Route Handlers, replace service role client with session-scoped client, add household_id filters, full QA pass across all data endpoints |
| Duplicate transactions from CSV re-import | MEDIUM | Add `external_hash` column to `transactions`, compute hashes for existing rows via migration, add unique constraint, delete duplicates (keep the row with lowest `created_at`) |
| Timezone-corrupted transaction dates | HIGH | Cannot fix retroactively without user involvement — prompt users to review transactions near month boundaries; add correct logic going forward |
| Bad BLS category mapping (silent data gaps) | LOW | Update the mapping file, re-run ingestion (idempotent upsert), Insights page corrects automatically |
| Stale service worker serving old build | LOW | Force users to hard refresh; update SW config to use `skipWaiting: true` in next deploy |
| Invite token security hole (enumerable tokens) | HIGH | Rotate all active tokens, add RLS policy fix via migration, notify affected households |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Service role key bypassing RLS | Phase 1 | Integration test: two households, user A cannot read user B's transactions |
| Invite token enumeration | Phase 3 | Confirm RLS policy on `household_invites` restricts anon SELECT; test expired/redeemed token returns 403 |
| Transaction date timezone off-by-one | Phase 2 | Manual test: enter transaction at 11:55 PM Mountain, verify `occurred_on` is today's date |
| CSV amount sign inversion | Phase 4 | Import Chase and BofA sample CSVs; verify grocery transactions are expenses in both |
| CSV duplicate detection fragility | Phase 4 | Import same file twice; confirm row count does not change (unique constraint fires) |
| BLS category mapping drift | Phase 6 | After ingestion, verify all 10 core categories have non-null data in `benchmarks_bls_cex` |
| Realtime subscription death on mobile | Phase 3 | Physical device test: background PWA 2 min, partner adds transaction, foreground, verify it appears |
| PWA stale build | Phase 0 | Deploy v1, install PWA, deploy v2 with visible change, verify update prompt appears |
| Next.js 15 async cookies bug | Phase 0/1 | Server component test: verify `getUser()` returns non-null for authenticated session |
| Benchmark staleness with no warning | Phase 6 | Check `data_year` in DB is parsed from source, not hardcoded; Insights UI shows data year |

---

## Sources

- Supabase RLS official documentation (https://supabase.com/docs/guides/database/postgres/row-level-security) — HIGH confidence from training data through August 2025
- Supabase Next.js 15 SSR guide (https://supabase.com/docs/guides/auth/server-side/nextjs) — HIGH confidence; async cookies change is documented in Next.js 15 release notes
- Supabase Realtime documentation and known mobile WebSocket lifecycle — MEDIUM confidence; behavior is consistent across WebSocket implementations on mobile OS
- next-pwa / @ducanh2912/next-pwa GitHub issues regarding App Router compatibility — MEDIUM confidence from training data
- BLS CEX data format documentation (https://www.bls.gov/cex/tables.htm) — MEDIUM confidence; category names observed to vary across survey years
- date-fns-tz server-side timezone handling — HIGH confidence; UTC default on Vercel is a well-documented behavior
- CSV bank export format differences (Chase, BofA, Apple Card) — HIGH confidence; directly observable from bank documentation

Note: WebSearch and WebFetch were unavailable during this research session. Findings are based on training data through August 2025 and the project's own documentation. Claims about Supabase behavior, Next.js 15 breaking changes, and CSV formats carry HIGH confidence from direct domain knowledge. BLS API schema claims carry MEDIUM confidence — verify at Phase 6 ingestion time.

---
*Pitfalls research for: Hearth Budget — household budgeting PWA (Next.js 15 + Supabase)*
*Researched: 2026-04-21*

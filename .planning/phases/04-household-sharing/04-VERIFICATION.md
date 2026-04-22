---
phase: 04-household-sharing
verified: 2026-04-21T00:00:00Z
status: gaps_found
score: 11/13 must-haves verified
gaps:
  - truth: "When Supabase Realtime is unavailable, the app still works with optimistic updates"
    status: partial
    reason: "The fallback is visibilitychange-based refetch, not optimistic UI. Optimistic updates (server-action-submitted transactions appearing immediately in local state before server confirmation) are not implemented. The plan required 'optimistic UI + visibilitychange refetch' as stated in SHAR-06. The visibilitychange fallback is correctly implemented, but the optimistic UI half is absent."
    artifacts:
      - path: "hearth-budget/src/components/transaction-list.tsx"
        issue: "onInsert handler is an empty no-op: `onInsert: () => {}`. INSERT events from the realtime hook call onRefetch (server round-trip), not an optimistic local state update. If Realtime is down, a locally-submitted transaction has no optimistic path."
    missing:
      - "Optimistic insert: when user submits a new transaction, add it to local state immediately before server round-trip completes. This is the 'optimistic UI' half of SHAR-06."
  - truth: "Duplicate display_name migration will fail on fresh apply"
    status: failed
    reason: "Migration 20260422000001_invite_rls_fix.sql adds column display_name to household_members. Migration 20260422000002_member_display_name.sql ALSO issues ALTER TABLE household_members ADD COLUMN display_name TEXT without IF NOT EXISTS. Running both migrations on a fresh database will fail at migration 2 with 'column already exists'. Migration 2 has the required backfill (split_part from auth.users) that migration 1 lacks — so the fix is to guard migration 2's ADD COLUMN with IF NOT EXISTS."
    artifacts:
      - path: "hearth-budget/supabase/migrations/20260422000001_invite_rls_fix.sql"
        issue: "Adds `display_name text` column at line 10 without backfill"
      - path: "hearth-budget/supabase/migrations/20260422000002_member_display_name.sql"
        issue: "Also adds `display_name text` column at line 2 without IF NOT EXISTS guard — will fail if migrations 1 and 2 are both applied"
    missing:
      - "Change line 2 of 20260422000002_member_display_name.sql to: `alter table household_members add column if not exists display_name text;`"
---

# Phase 4: Household Sharing Verification Report

**Phase Goal:** Two people share one household in real time — the second person can join via invite link and both see each other's transactions live
**Verified:** 2026-04-21
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Household owner can generate a one-time invite link from settings page | VERIFIED | `invite-section.tsx` calls `createInvite()`, rendered in `settings/page.tsx` when `isOwner && memberCount < 2` |
| 2 | Invite link expires after 7 days and becomes unusable | VERIFIED | `redeemInvite()` queries with `.gt('expires_at', new Date().toISOString())` returning null for expired; invite page shows "no longer valid" |
| 3 | Invited user clicking the link sees a join page with the household name | VERIFIED | `invite/[token]/page.tsx` queries `household_invites` with `households(name)` join; renders "Join {householdName}" heading |
| 4 | Invited user who signs up or logs in is placed into the household as a member | VERIFIED | `accept/route.ts` calls `redeemInvite(token)` which inserts `household_members` row with `role: 'member'` and `display_name` from email |
| 5 | An already-redeemed invite link cannot be used again | VERIFIED | `redeemInvite()` queries with `.is('redeemed_at', null)`; invite page returns null for redeemed invites; accept route redirects to error |
| 6 | Each transaction row displays an avatar with the initial of the person who entered it | VERIFIED | `transaction-row.tsx` renders `<Avatar size="sm">` with `memberMap[transaction.entered_by] ?? '?'` |
| 7 | Dashboard header shows "You and [partner name]" when both members have joined | VERIFIED | `app-shell.tsx` renders `partnerName ? "You & ${partnerName}" : householdName`; `dashboard/page.tsx` renders `"You and ${partnerDisplayName}"` heading |
| 8 | Dashboard header shows just the household name when only one member exists | VERIFIED | `partnerName` is null when `members.find(m => m.user_id !== user.id)` returns undefined; AppShell falls back to `householdName` |
| 9 | Transaction row avatar distinguishes between the two household members visually | VERIFIED | `memberMap` keys on `user_id`, initial derived from `display_name[0]` or email[0]; each member gets a distinct letter initial |
| 10 | When one partner adds a transaction, the other partner sees it appear without page refresh | VERIFIED | `useRealtimeTransactions` subscribes to INSERT events filtered by `household_id=eq.{id}` and calls `onRefetch` which re-runs `getTransactions` server action |
| 11 | When one partner edits a transaction, the other partner sees the update without page refresh | VERIFIED | `useRealtimeTransactions` subscribes to UPDATE events and calls `onRefetch` |
| 12 | When one partner deletes a transaction, it disappears from the other partner's view without page refresh | VERIFIED | DELETE handler calls `callbacksRef.current.onDelete(oldId)` which filters `setTransactions(prev => prev.filter(tx => tx.id !== id))` |
| 13 | When Supabase Realtime is unavailable, the app still works with optimistic updates | PARTIAL | `visibilitychange` fallback is wired correctly — tab focus triggers `onRefetch`. However the "optimistic updates" portion is absent: `onInsert: () => {}` is a no-op. Locally-submitted transactions are not speculatively added to local state. The SHAR-06 requirement text says "optimistic UI + visibilitychange refetch" — the optimistic UI half is missing. |
| 14 | When tab regains focus after being backgrounded, transactions refresh automatically | VERIFIED | `use-realtime-sync.ts` registers `document.addEventListener('visibilitychange', ...)` that calls `onRefetch()` when `document.visibilityState === 'visible'` |

**Score:** 12/14 truths verified (13/14 if counting SHAR-06 visibilitychange as fully meeting the fallback goal; 1 definite migration conflict gap)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `hearth-budget/src/app/actions/invites.ts` | createInvite, redeemInvite, getActiveInvites | VERIFIED | 3 exported async functions, all querying `household_invites`, `display_name` set in redeemInvite |
| `hearth-budget/src/lib/schemas/invites.ts` | Zod v4 validation for invite token | VERIFIED | `z.object({ token: z.string().uuid() })`, exports `InviteToken` type |
| `hearth-budget/src/app/invite/[token]/page.tsx` | Public invite landing page with household name | VERIFIED | Server component, queries `household_invites` with `households(name)` join, renders "Join {householdName}" |
| `hearth-budget/src/app/invite/[token]/accept/route.ts` | Route handler that redeems invite | VERIFIED | GET handler checks auth, calls `redeemInvite(token)`, redirects to dashboard or error |
| `hearth-budget/src/components/invite-section.tsx` | Client component for invite generation and copy | VERIFIED | 'use client', calls `createInvite()`, uses `navigator.clipboard.writeText()` |
| `hearth-budget/src/app/app/settings/page.tsx` | Settings page with conditional InviteSection | VERIFIED | Async server component, queries members, renders `<InviteSection />` when `isOwner && memberCount < 2` |
| `hearth-budget/src/app/actions/members.ts` | getHouseholdMembers returning display_name | VERIFIED | 'use server', exports `getHouseholdMembers` and `updateDisplayName`, queries `display_name` column |
| `hearth-budget/src/components/app-shell.tsx` | Updated header showing "You & [partner]" | VERIFIED | `partnerName ? "You & ${partnerName}" : householdName` rendered in header |
| `hearth-budget/src/components/transaction-row.tsx` | Transaction row with avatar for entered_by | VERIFIED | `<Avatar size="sm">` with `memberMap[transaction.entered_by]` lookup |
| `hearth-budget/src/app/app/dashboard/page.tsx` | Dashboard with partner greeting | VERIFIED | Calls `getHouseholdMembers()`, renders `"You and ${partnerDisplayName}"` or `"Dashboard"` |
| `hearth-budget/src/hooks/use-realtime-transactions.ts` | Realtime hook for INSERT/UPDATE/DELETE | VERIFIED | Exports `useRealtimeTransactions`, uses `postgres_changes` for all 3 events with `household_id=eq.${householdId}` filter |
| `hearth-budget/src/hooks/use-realtime-sync.ts` | Generic Realtime hook with visibilitychange fallback | VERIFIED | Exports `useRealtimeSync`, registers `visibilitychange` listener |
| `hearth-budget/supabase/migrations/20260422000001_invite_rls_fix.sql` | RLS policy for invited users + column | VERIFIED (with caveat) | "invited users join household" policy present; adds `display_name` column — but conflicts with migration 2 |
| `hearth-budget/supabase/migrations/20260422000002_member_display_name.sql` | display_name column with backfill | FAILED | Adds same `display_name` column as migration 1 without `IF NOT EXISTS` — will error on fresh database apply |
| `hearth-budget/supabase/migrations/20260422000003_enable_realtime.sql` | Enables Realtime on transactions table | VERIFIED | `alter publication supabase_realtime add table transactions` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `settings/page.tsx` | `actions/invites.ts` | createInvite server action | WIRED | `<InviteSection />` in settings page imports and calls `createInvite` |
| `invite/[token]/page.tsx` | household_invites table | server component query by token | WIRED | `.from('household_invites').select(...).eq('token', token)` |
| `invite/[token]/accept/route.ts` | `actions/invites.ts` | redeemInvite call | WIRED | `import { redeemInvite } from '@/app/actions/invites'` called in GET handler |
| `auth/callback/route.ts` | `/invite/[token]/accept` | next param redirect before household check | WIRED | `if (next && next.startsWith('/invite/'))` redirects before membership query |
| `app/app/layout.tsx` | `actions/members.ts` | getHouseholdMembers for partnerName | WIRED | `import { getHouseholdMembers }` called, `partnerName` derived and passed to AppShell |
| `transaction-row.tsx` | memberMap prop | entered_by UUID lookup to get initial | WIRED | `memberMap[transaction.entered_by] ?? '?'` in Avatar |
| `transactions/page.tsx` | `actions/members.ts` | fetches members to build memberMap | WIRED | `getHouseholdMembers()` called in Promise.all, memberMap built and passed to TransactionList |
| `transaction-list.tsx` | `hooks/use-realtime-transactions.ts` | hook call in TransactionList | WIRED | `useRealtimeTransactions({ householdId, ... })` called at top of component |
| `use-realtime-transactions.ts` | `lib/supabase/client.ts` | browser client for channel subscription | WIRED | `useRealtimeSync` calls `createClient()` from supabase client lib |
| `use-realtime-transactions.ts` | `use-realtime-sync.ts` | uses generic sync hook | WIRED | `import { useRealtimeSync }` and called at top of `useRealtimeTransactions` |
| `use-realtime-sync.ts` | visibilitychange event | document.addEventListener | WIRED | `document.addEventListener('visibilitychange', handleVisibilityChange)` in useEffect |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `transaction-row.tsx` | `memberMap[transaction.entered_by]` | `transactions/page.tsx` builds from `getHouseholdMembers()` → DB query on `household_members` | Yes | FLOWING |
| `app-shell.tsx` | `partnerName` | `layout.tsx` calls `getHouseholdMembers()` → finds partner in real DB results | Yes | FLOWING |
| `dashboard/page.tsx` | `partnerDisplayName` | `getHouseholdMembers()` → `household_members` table query | Yes | FLOWING |
| `invite/[token]/page.tsx` | `householdName` | Server query on `household_invites` with `households(name)` join | Yes | FLOWING |
| `transaction-list.tsx` | `transactions` (via Realtime) | `useRealtimeTransactions` subscribes to `supabase_realtime` publication; on events calls `refetchTransactions` → `getTransactions` server action → real DB | Yes | FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED — Supabase local instance not running (Docker daemon unavailable). Cannot run live API checks without server.

TypeScript compilation: PASS (`npx tsc --noEmit` exits 0 — zero errors across all phase 4 files)

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SHAR-01 | 04-01 | Household owner can generate a one-time invite link (7-day expiry) | SATISFIED | `createInvite()` inserts row with DB-defaulted `expires_at = now() + 7 days`; InviteSection renders in settings for owners |
| SHAR-02 | 04-01 | Invited user can sign up or log in and join the household via invite link | SATISFIED | `redeemInvite()` validates, marks invite redeemed, inserts `household_members`; auth callback passes through `/invite/*` before household check |
| SHAR-03 | 04-02 | Each transaction shows who entered it (avatar + initial) | SATISFIED | `TransactionRow` renders `<Avatar>` with `memberMap[transaction.entered_by]` initial |
| SHAR-04 | 04-02 | Dashboard shows "You and [partner]" summary | SATISFIED | `app-shell.tsx` shows `"You & ${partnerName}"` in header; `dashboard/page.tsx` shows `"You and ${partnerDisplayName}"` in h1 |
| SHAR-05 | 04-03 | Transactions update live via Supabase Realtime when partner makes changes | SATISFIED | `useRealtimeTransactions` subscribes to INSERT/UPDATE/DELETE; INSERT/UPDATE trigger refetch; DELETE removes locally |
| SHAR-06 | 04-03 | App falls back to optimistic UI + visibilitychange refetch when Realtime unreliable | PARTIAL | `visibilitychange` fallback is fully implemented. Optimistic UI for user's own submitted transactions is absent — `onInsert: () => {}` is a no-op. The tab-focus refetch satisfies the "don't get stuck" requirement but not the "optimistic" part of the spec. |

No orphaned requirements found — all 6 SHAR requirements are claimed by plans 04-01, 04-02, 04-03.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `transaction-list.tsx` | 108–109 | `onInsert: () => {}` and `onUpdate: () => {}` — callbacks registered but are no-ops, relying entirely on `onRefetch` | Info | Not a stub — `onRefetch` handles both events correctly; these callbacks exist for future per-event handling. Actual behavior works. |
| `app-shell.tsx` | 12 | `memberMap: Record<string, string>` in interface but not destructured or used in JSX — accepted prop that goes nowhere | Info | Not a blocker. memberMap flows to TransactionRow/List via independent server-component fetches in the transactions page. The prop is type-safe dead code in AppShell. |
| `migrations/20260422000001_invite_rls_fix.sql` + `20260422000002_member_display_name.sql` | lines 10 / 2 | Both migrations issue `ALTER TABLE household_members ADD COLUMN display_name TEXT` without `IF NOT EXISTS` | BLOCKER | Will fail with "column already exists" on a fresh database apply. The migrations work if only one has been applied, but both are present in the migration sequence. This breaks `supabase db push` / `supabase migration up` on a clean Supabase project. |

### Human Verification Required

#### 1. Full Invite Flow End-to-End

**Test:** As owner, open settings, click "Generate Invite Link", copy URL, open in incognito window. Sign up as new user, confirm redirect lands on `/invite/{token}` page, click "Join Household", confirm redirect to `/app/dashboard`. Check that both users see each other's transactions.
**Expected:** New user appears in household members list on settings page; partner's name appears in dashboard header.
**Why human:** Full OAuth/email auth flow with session hand-off cannot be verified programmatically without a running server.

#### 2. Realtime Live Sync Between Two Browser Tabs

**Test:** Open `/app/transactions` in two browser sessions (different auth cookies). In session A, add a transaction. Observe session B's transaction list.
**Expected:** Session B's list refreshes within ~1 second showing session A's new transaction — no manual page refresh required.
**Why human:** Requires live Supabase Realtime connection and two authenticated browser sessions.

#### 3. Tab Focus Refetch (SHAR-06 Fallback)

**Test:** Open `/app/transactions`. Switch to another browser tab for 30+ seconds (or disable network). Switch back.
**Expected:** Transaction list refreshes automatically upon tab focus, showing any new data.
**Why human:** Requires live browser and timing control.

#### 4. RLS Migration Sequence on Fresh Database

**Test:** Run `supabase db reset` on a fresh local Supabase instance. Confirm all 6 phase-4 migrations apply without error.
**Expected:** Zero migration errors. Specifically, migration `20260422000002_member_display_name.sql` should not fail with "column display_name already exists".
**Why human:** Requires Docker/local Supabase — not available in this environment. This is flagged as a BLOCKER gap above.

### Gaps Summary

**Two gaps identified:**

**Gap 1 — Migration Conflict (Blocker):** Both `20260422000001_invite_rls_fix.sql` and `20260422000002_member_display_name.sql` issue `ALTER TABLE household_members ADD COLUMN display_name TEXT`. Migration 1 was an opportunistic early add; migration 2 was the planned add with the required backfill. Running both on a fresh database will fail at migration 2. The fix is a one-line change: add `IF NOT EXISTS` to the `ALTER TABLE` in migration 2. This does not affect the currently-running dev environment if migrations were applied incrementally, but will block any fresh deployment.

**Gap 2 — SHAR-06 Optimistic UI Missing (Warning):** SHAR-06 specifies "optimistic UI + visibilitychange refetch". The visibilitychange fallback is correctly implemented. The optimistic UI portion — adding a locally-submitted transaction to the list immediately before the server round-trip completes — is not implemented. The FAB adds a transaction through the server action, but the transaction list only updates via Realtime refetch (INSERT event) or manual refresh. For the original submitter, there's a lag between submit and appearance. This is a UX gap, not a functional blocker — the data is eventually consistent — but it does not satisfy the stated "optimistic UI" requirement.

---

_Verified: 2026-04-21_
_Verifier: Claude (gsd-verifier)_

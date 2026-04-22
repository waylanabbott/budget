---
phase: 04-household-sharing
plan: 01
subsystem: auth
tags: [supabase, rls, invite-links, server-actions, next.js]

requires:
  - phase: 02-auth-onboarding
    provides: Supabase Auth with session handling, auth callback route, login/onboarding flow
  - phase: 01-bootstrap
    provides: Database schema with household_invites table and RLS policies

provides:
  - Server actions for invite CRUD (createInvite, redeemInvite, getActiveInvites)
  - Public invite landing page at /invite/[token]
  - Invite accept route handler at /invite/[token]/accept
  - Settings page with member list and invite link generation
  - RLS migration for invited users to join households
  - display_name column on household_members table

affects: [04-household-sharing, 06-budgets-goals-dashboard]

tech-stack:
  added: []
  patterns:
    - "Invite token flow: generate UUID token -> public landing page -> accept route -> redeem action"
    - "RLS invite pattern: update invite first (set redeemed_by), then insert member (RLS checks redeemed invite exists)"
    - "Auth callback invite passthrough: skip household check when next param starts with /invite/"

key-files:
  created:
    - hearth-budget/src/lib/schemas/invites.ts
    - hearth-budget/src/app/actions/invites.ts
    - hearth-budget/src/app/invite/[token]/page.tsx
    - hearth-budget/src/app/invite/[token]/accept/route.ts
    - hearth-budget/src/components/invite-section.tsx
    - hearth-budget/supabase/migrations/20260422000001_invite_rls_fix.sql
  modified:
    - hearth-budget/src/app/auth/callback/route.ts
    - hearth-budget/src/app/app/settings/page.tsx
    - hearth-budget/src/types/database.ts

key-decisions:
  - "Fixed token redeemer RLS policy: original WITH CHECK (redeemed_at is null) blocked UPDATE setting redeemed_at"
  - "Used Link with buttonVariants instead of Button asChild (base-ui Button has no asChild prop)"
  - "Invite redemption order: UPDATE invite first, THEN INSERT member row (RLS depends on this sequence)"

patterns-established:
  - "Invite flow: token generation -> public page -> auth redirect -> accept route -> dashboard"
  - "Conditional settings sections: server-side role check controls UI visibility"

requirements-completed: [SHAR-01, SHAR-02]

duration: 5min
completed: 2026-04-22
---

# Phase 04 Plan 01: Household Invite System Summary

**Invite link generation, public join page, and token redemption for adding the second household member**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-22T05:58:34Z
- **Completed:** 2026-04-22T06:04:14Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Three server actions (createInvite, redeemInvite, getActiveInvites) with full Zod validation and RLS-safe patterns
- Public /invite/[token] page shows household name and join CTA, with graceful expired/invalid handling
- Accept route handles auth check, invite redemption, and sets display_name from email on the new member
- Settings page upgraded to async server component with member list and conditional invite section for owners
- RLS migration adds policy for invited users to self-insert as members, fixes broken token redeemer update policy

## Task Commits

Each task was committed atomically:

1. **Task 1: Invite schemas, server actions, and migration** - `3caf1b1` (feat)
2. **Task 2: Invite page, accept route, auth callback update, and settings UI** - `919313f` (feat)

## Files Created/Modified
- `hearth-budget/src/lib/schemas/invites.ts` - Zod v4 invite token validation schema
- `hearth-budget/src/app/actions/invites.ts` - createInvite, redeemInvite, getActiveInvites server actions
- `hearth-budget/supabase/migrations/20260422000001_invite_rls_fix.sql` - RLS policy for invite redemption + display_name column
- `hearth-budget/src/app/invite/[token]/page.tsx` - Public invite landing page with household name
- `hearth-budget/src/app/invite/[token]/accept/route.ts` - Route handler that redeems invite for authenticated user
- `hearth-budget/src/components/invite-section.tsx` - Client component for invite link generation and clipboard copy
- `hearth-budget/src/app/auth/callback/route.ts` - Updated to pass through /invite/* redirects before household check
- `hearth-budget/src/app/app/settings/page.tsx` - Upgraded to async server component with member list and invite section
- `hearth-budget/src/types/database.ts` - Added display_name to household_members types

## Decisions Made
- Fixed token redeemer RLS policy: original WITH CHECK (redeemed_at is null) blocked the UPDATE that sets redeemed_at to now(). Dropped and recreated without WITH CHECK clause.
- Used Link with buttonVariants() instead of Button asChild because the base-ui Button component does not support asChild prop (unlike Radix-based shadcn).
- Invite redemption sequence is critical: UPDATE invite (set redeemed_by/redeemed_at) MUST happen before INSERT into household_members, because the RLS policy checks that the invite has already been redeemed by the current user.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed token redeemer RLS policy WITH CHECK clause**
- **Found during:** Task 1 (analyzing existing RLS policies)
- **Issue:** The "token redeemer updates" policy had `with check (redeemed_at is null)` which validates the NEW row. Setting `redeemed_at = now()` makes the new row have non-null redeemed_at, failing the check.
- **Fix:** Dropped and recreated the policy without WITH CHECK, keeping only the USING clause for pre-update row filtering.
- **Files modified:** hearth-budget/supabase/migrations/20260422000001_invite_rls_fix.sql
- **Verification:** Policy SQL reviewed for correctness
- **Committed in:** 3caf1b1 (Task 1 commit)

**2. [Rule 1 - Bug] Replaced Button asChild with Link + buttonVariants**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** The base-ui Button component does not support `asChild` prop. TypeScript error: "Property 'asChild' does not exist on type"
- **Fix:** Used `Link` elements with `buttonVariants()` className instead of `Button asChild`
- **Files modified:** hearth-budget/src/app/invite/[token]/page.tsx
- **Verification:** TypeScript compiles with zero errors
- **Committed in:** 919313f (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
- Task 1 files were committed by the parallel 04-02 agent (which picked up disk writes). Task 1 commit hash 3caf1b1 belongs to the 04-02 agent but contains our exact file content. No rework needed.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Invite system complete, ready for Plan 04-02 (member display names) and Plan 04-03 (role-based permissions)
- Auth callback correctly routes invited users through the join flow
- Settings page shows household members and conditionally displays invite generation

## Self-Check: PASSED

All 6 created files verified on disk. Both commit hashes (3caf1b1, 919313f) found in git log. SUMMARY.md created.

---
*Phase: 04-household-sharing*
*Completed: 2026-04-22*

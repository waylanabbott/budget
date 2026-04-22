-- Migration: invite RLS fix + display_name column
-- Adds display_name to household_members for partner name display (SHAR-04)
-- Adds RLS policy allowing invited users to insert themselves as members
-- Fixes token redeemer update policy (with check was blocking redeemed_at writes)

-- =============================================
-- Add display_name column to household_members
-- =============================================
alter table household_members
  add column display_name text;

-- =============================================
-- Fix token redeemer update policy
-- The original WITH CHECK (redeemed_at is null) blocks setting redeemed_at
-- because it checks the NEW row value. Drop and recreate without with check.
-- =============================================
drop policy if exists "token redeemer updates" on household_invites;

create policy "token redeemer updates"
on household_invites for update
to authenticated
using (redeemed_at is null and expires_at > now());

-- =============================================
-- Allow invited users to add themselves as members
-- The invite must already be marked as redeemed by this user
-- (redeemInvite updates the invite FIRST, then inserts the member)
-- =============================================
create policy "invited users join household"
on household_members for insert
to authenticated
with check (
  user_id = auth.uid()
  and role = 'member'
  and exists (
    select 1 from household_invites
    where household_invites.household_id = household_members.household_id
      and household_invites.redeemed_by = auth.uid()
      and household_invites.redeemed_at is not null
      and household_invites.expires_at > now()
  )
);

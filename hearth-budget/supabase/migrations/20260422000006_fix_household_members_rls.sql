-- Fix household_members SELECT policy: the self-referential subquery
-- prevented users from reading their own membership row.
-- Replace with is_household_member() which is SECURITY DEFINER and bypasses RLS.

drop policy if exists "members read membership" on household_members;

create policy "members read membership"
on household_members for select
using (is_household_member(household_id));

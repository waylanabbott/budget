-- Migration: Audit RLS fixes
-- C1: Replace vulnerable invite UPDATE policy with SECURITY DEFINER RPC
-- C2: Replace enumerable invite SELECT policy with SECURITY DEFINER RPC
-- H1: Add UPDATE policy on household_members (updateDisplayName was silently failing)
-- L5: Add DELETE policy on household_invites (owners can revoke invites)

-- =============================================
-- C1: Drop the vulnerable UPDATE policy (no WITH CHECK)
-- C2: Drop the enumerable SELECT policy (exposes all tokens)
-- =============================================
drop policy if exists "token redeemer updates" on household_invites;
drop policy if exists "public token read" on household_invites;

-- =============================================
-- C1: Atomic invite redemption RPC
-- Replaces the two-step update+insert that was vulnerable to
-- any authenticated user modifying unredeemed invites.
-- =============================================
create or replace function redeem_invite(p_token uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  v_invite record;
  v_user_id uuid;
  v_existing_membership uuid;
  v_display_name text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Check user is not already in a household
  select household_id into v_existing_membership
  from household_members
  where user_id = v_user_id
  limit 1;

  if v_existing_membership is not null then
    raise exception 'You are already in a household.';
  end if;

  -- Find and lock the invite (FOR UPDATE prevents race conditions)
  select id, household_id, expires_at, redeemed_at
  into v_invite
  from household_invites
  where token = p_token
  for update;

  if v_invite is null then
    raise exception 'This invite link is invalid or has expired.';
  end if;

  if v_invite.redeemed_at is not null then
    raise exception 'This invite has already been used.';
  end if;

  if v_invite.expires_at <= now() then
    raise exception 'This invite link is invalid or has expired.';
  end if;

  -- Atomically: mark redeemed + insert member
  update household_invites
  set redeemed_by = v_user_id,
      redeemed_at = now()
  where id = v_invite.id;

  -- Derive display_name from email
  select split_part(email, '@', 1) into v_display_name
  from auth.users
  where id = v_user_id;

  insert into household_members (household_id, user_id, role, display_name)
  values (v_invite.household_id, v_user_id, 'member', v_display_name);

  return v_invite.household_id;
end;
$$;

-- =============================================
-- C2: Safe single-token lookup RPC (prevents enumeration)
-- =============================================
create or replace function get_invite_by_token(p_token uuid)
returns table (
  household_name text,
  expires_at timestamptz,
  is_valid boolean
)
language sql
security definer
stable
as $$
  select
    h.name as household_name,
    hi.expires_at,
    (hi.redeemed_at is null and hi.expires_at > now()) as is_valid
  from household_invites hi
  join households h on h.id = hi.household_id
  where hi.token = p_token
  limit 1;
$$;

-- =============================================
-- H1: Allow members to update their own membership row
-- (fixes updateDisplayName silently failing)
-- =============================================
create policy "members update own row"
on household_members for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- =============================================
-- L5: Allow owners to delete/revoke invites
-- =============================================
create policy "owners delete invites"
on household_invites for delete
to authenticated
using (is_household_owner(household_id));

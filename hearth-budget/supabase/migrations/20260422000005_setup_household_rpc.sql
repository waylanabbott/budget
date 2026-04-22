-- Atomic RPC for household creation: inserts household + owner member + default categories
-- in one transaction, bypassing RLS via SECURITY DEFINER. Replaces reliance on the
-- add_household_owner trigger which depends on auth.uid() being available in the trigger context.

create or replace function setup_household(
  p_name text,
  p_zip text,
  p_metro text,
  p_income_bracket text
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_display_name text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Prevent duplicate households
  if exists (select 1 from household_members where user_id = v_user_id) then
    raise exception 'User already belongs to a household';
  end if;

  -- Create household
  insert into households (name, zip, metro, income_bracket)
  values (p_name, p_zip, p_metro, p_income_bracket)
  returning id into v_household_id;

  -- Derive display name from email
  select split_part(email, '@', 1) into v_display_name
  from auth.users where id = v_user_id;

  -- Add creator as owner (the trigger may also fire — use ON CONFLICT to handle both paths)
  insert into household_members (household_id, user_id, role, display_name)
  values (v_household_id, v_user_id, 'owner', v_display_name)
  on conflict (household_id, user_id) do update set display_name = excluded.display_name;

  -- Seed default categories (trigger may also fire — function is idempotent-ish, but
  -- we guard by checking if categories already exist for this household)
  if not exists (select 1 from categories where household_id = v_household_id) then
    perform create_default_categories(v_household_id);
  end if;

  return v_household_id;
end;
$$;

-- Make the original trigger defensive: skip if auth.uid() is null
-- (the RPC handles member creation explicitly, so the trigger is just a safety net)
create or replace function add_household_owner()
returns trigger
language plpgsql
security definer
as $$
begin
  if auth.uid() is not null then
    insert into household_members (household_id, user_id, role)
    values (new.id, auth.uid(), 'owner')
    on conflict (household_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

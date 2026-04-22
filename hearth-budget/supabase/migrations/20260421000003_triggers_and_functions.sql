-- supabase/migrations/20260421000003_triggers_and_functions.sql

-- =============================================
-- Auto-add household creator as 'owner' on insert
-- =============================================
create or replace function add_household_owner()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into household_members (household_id, user_id, role)
  values (new.id, auth.uid(), 'owner');
  return new;
end;
$$;

create trigger on_household_created
  after insert on households
  for each row
  execute function add_household_owner();

-- =============================================
-- Auto-populate default category tree for new households
-- =============================================
create or replace function create_default_categories(p_household_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_income_id        uuid;
  v_housing_id       uuid;
  v_food_id          uuid;
  v_transport_id     uuid;
  v_health_id        uuid;
  v_entertainment_id uuid;
  v_personal_id      uuid;
  v_shopping_id      uuid;
  v_savings_id       uuid;
  v_misc_id          uuid;
begin
  -- Income (parent)
  insert into categories (household_id, name, is_income, sort_order)
    values (p_household_id, 'Income', true, 0)
    returning id into v_income_id;
  insert into categories (household_id, name, parent_id, is_income, sort_order) values
    (p_household_id, 'Salary',       v_income_id, true, 1),
    (p_household_id, 'Other Income', v_income_id, true, 2);

  -- Housing
  insert into categories (household_id, name, sort_order)
    values (p_household_id, 'Housing', 10)
    returning id into v_housing_id;
  insert into categories (household_id, name, parent_id, sort_order) values
    (p_household_id, 'Rent / Mortgage', v_housing_id, 11),
    (p_household_id, 'Utilities',       v_housing_id, 12),
    (p_household_id, 'Internet',        v_housing_id, 13),
    (p_household_id, 'Home Insurance',  v_housing_id, 14);

  -- Food
  insert into categories (household_id, name, sort_order)
    values (p_household_id, 'Food', 20)
    returning id into v_food_id;
  insert into categories (household_id, name, parent_id, sort_order) values
    (p_household_id, 'Groceries',   v_food_id, 21),
    (p_household_id, 'Restaurants', v_food_id, 22);

  -- Transportation
  insert into categories (household_id, name, sort_order)
    values (p_household_id, 'Transportation', 30)
    returning id into v_transport_id;
  insert into categories (household_id, name, parent_id, sort_order) values
    (p_household_id, 'Gas',          v_transport_id, 31),
    (p_household_id, 'Car Payment',  v_transport_id, 32),
    (p_household_id, 'Parking',      v_transport_id, 33),
    (p_household_id, 'Transit',      v_transport_id, 34);

  -- Health
  insert into categories (household_id, name, sort_order)
    values (p_household_id, 'Health', 40)
    returning id into v_health_id;

  -- Entertainment
  insert into categories (household_id, name, sort_order)
    values (p_household_id, 'Entertainment', 50)
    returning id into v_entertainment_id;

  -- Personal Care
  insert into categories (household_id, name, sort_order)
    values (p_household_id, 'Personal Care', 60)
    returning id into v_personal_id;

  -- Shopping
  insert into categories (household_id, name, sort_order)
    values (p_household_id, 'Shopping', 70)
    returning id into v_shopping_id;

  -- Savings Transfers
  insert into categories (household_id, name, is_income, sort_order)
    values (p_household_id, 'Savings Transfers', false, 80)
    returning id into v_savings_id;

  -- Miscellaneous
  insert into categories (household_id, name, sort_order)
    values (p_household_id, 'Miscellaneous', 90)
    returning id into v_misc_id;
end;
$$;

create or replace function on_household_created_seed_categories()
returns trigger
language plpgsql
security definer
as $$
begin
  perform create_default_categories(new.id);
  return new;
end;
$$;

create trigger on_household_created_categories
  after insert on households
  for each row
  execute function on_household_created_seed_categories();

-- =============================================
-- Auto-update updated_at on transactions
-- =============================================
create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger transactions_updated_at
  before update on transactions
  for each row
  execute function update_updated_at_column();

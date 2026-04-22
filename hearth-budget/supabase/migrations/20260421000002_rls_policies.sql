-- supabase/migrations/20260421000002_rls_policies.sql

-- =============================================
-- Enable RLS on all household-scoped tables
-- =============================================
alter table households            enable row level security;
alter table household_members     enable row level security;
alter table accounts              enable row level security;
alter table categories            enable row level security;
alter table transactions          enable row level security;
alter table budgets               enable row level security;
alter table savings_goals         enable row level security;
alter table recurring_bills       enable row level security;
alter table imports               enable row level security;
alter table household_invites     enable row level security;

-- Enable RLS on benchmark tables (public read, service-role write)
alter table benchmarks_bls_cex        enable row level security;
alter table benchmarks_hud_fmr        enable row level security;
alter table benchmarks_zillow         enable row level security;
alter table benchmark_ingestion_log   enable row level security;

-- =============================================
-- Helper functions: membership check
-- security definer avoids per-row subquery cost at scale
-- =============================================
create or replace function is_household_member(hid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists(
    select 1 from household_members
    where household_id = hid
      and user_id = auth.uid()
  );
$$;

create or replace function is_household_owner(hid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists(
    select 1 from household_members
    where household_id = hid
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

-- =============================================
-- households policies
-- =============================================
create policy "members read own household"
on households for select
using (is_household_member(id));

create policy "authenticated users create households"
on households for insert
to authenticated
with check (true);

create policy "owners update household"
on households for update
using (is_household_owner(id))
with check (is_household_owner(id));

-- =============================================
-- household_members policies
-- =============================================
create policy "members read membership"
on household_members for select
using (
  household_id in (
    select household_id from household_members
    where user_id = auth.uid()
  )
);

create policy "owners manage members"
on household_members for insert
with check (is_household_owner(household_id));

create policy "members leave household"
on household_members for delete
using (user_id = auth.uid() or is_household_owner(household_id));

-- =============================================
-- Standard household membership policy
-- Applied to: accounts, categories, transactions,
--             budgets, savings_goals, recurring_bills, imports
-- =============================================

create policy "household members only"
on accounts for all
using (is_household_member(household_id))
with check (is_household_member(household_id));

create policy "household members only"
on categories for all
using (is_household_member(household_id))
with check (is_household_member(household_id));

create policy "household members only"
on transactions for all
using (is_household_member(household_id))
with check (is_household_member(household_id));

create policy "household members only"
on budgets for all
using (is_household_member(household_id))
with check (is_household_member(household_id));

create policy "household members only"
on savings_goals for all
using (is_household_member(household_id))
with check (is_household_member(household_id));

create policy "household members only"
on recurring_bills for all
using (is_household_member(household_id))
with check (is_household_member(household_id));

create policy "household members only"
on imports for all
using (is_household_member(household_id))
with check (is_household_member(household_id));

-- =============================================
-- household_invites: split policies
-- =============================================
create policy "owners create invites"
on household_invites for insert
to authenticated
with check (is_household_owner(household_id));

create policy "owners read own invites"
on household_invites for select
using (is_household_owner(household_id));

-- Anyone with a valid token can read (for redemption page)
-- Token UUID is the access credential; policy limits to non-redeemed, non-expired only
create policy "public token read"
on household_invites for select
using (
  redeemed_at is null
  and expires_at > now()
);

create policy "token redeemer updates"
on household_invites for update
using (redeemed_at is null and expires_at > now())
with check (redeemed_at is null);

-- =============================================
-- Benchmark tables: authenticated read, service-role write
-- Writes happen via Edge Functions using service_role key (bypasses RLS)
-- =============================================
create policy "authenticated read benchmarks bls"
on benchmarks_bls_cex for select
to authenticated
using (true);

create policy "authenticated read benchmarks hud"
on benchmarks_hud_fmr for select
to authenticated
using (true);

create policy "authenticated read benchmarks zillow"
on benchmarks_zillow for select
to authenticated
using (true);

create policy "authenticated read ingestion log"
on benchmark_ingestion_log for select
to authenticated
using (true);

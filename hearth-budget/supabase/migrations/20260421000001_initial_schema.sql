-- supabase/migrations/20260421000001_initial_schema.sql

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Households
create table households (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  zip          text,
  metro        text,
  income_bracket text,
  currency     text not null default 'USD',
  timezone     text not null default 'America/Denver',
  created_at   timestamptz not null default now()
);

-- Household members (join table)
create table household_members (
  household_id uuid not null references households(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null check (role in ('owner', 'member')),
  joined_at    timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- Accounts (checking, savings, credit card, cash)
create table accounts (
  id               uuid primary key default uuid_generate_v4(),
  household_id     uuid not null references households(id) on delete cascade,
  name             text not null,
  type             text not null check (type in ('checking', 'savings', 'credit_card', 'cash')),
  starting_balance numeric(12, 2) not null default 0,
  is_archived      boolean not null default false,
  created_at       timestamptz not null default now()
);

-- Hierarchical categories (one level of nesting via parent_id)
create table categories (
  id           uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  name         text not null,
  parent_id    uuid references categories(id) on delete set null,
  icon         text,
  color        text,
  is_income    boolean not null default false,
  sort_order   int not null default 0,
  archived_at  timestamptz
);

-- Transactions (the core table)
-- CRITICAL: occurred_on is a `date` column, NOT timestamptz.
-- Client must send YYYY-MM-DD from local date. Never use toISOString() for this field.
create table transactions (
  id            uuid primary key default uuid_generate_v4(),
  household_id  uuid not null references households(id) on delete cascade,
  account_id    uuid not null references accounts(id),
  category_id   uuid references categories(id) on delete set null,
  entered_by    uuid not null references auth.users(id),
  amount        numeric(12, 2) not null,
  occurred_on   date not null,
  merchant      text,
  notes         text,
  source        text not null check (source in ('manual', 'csv', 'plaid')) default 'manual',
  external_id   text,
  external_hash text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Index for budget queries and transaction list (household + date desc)
create index transactions_household_date_idx
  on transactions (household_id, occurred_on desc);

-- Unique constraint for CSV dedup
create unique index transactions_account_hash_idx
  on transactions (account_id, external_hash)
  where external_hash is not null;

-- Budgets (categorical monthly/annual caps)
create table budgets (
  id             uuid primary key default uuid_generate_v4(),
  household_id   uuid not null references households(id) on delete cascade,
  category_id    uuid not null references categories(id) on delete cascade,
  period         text not null check (period in ('monthly', 'annual')),
  amount         numeric(12, 2) not null,
  effective_from date not null,
  effective_to   date
);

-- Savings goals
create table savings_goals (
  id                uuid primary key default uuid_generate_v4(),
  household_id      uuid not null references households(id) on delete cascade,
  name              text not null,
  target_amount     numeric(12, 2) not null,
  target_date       date,
  linked_account_id uuid references accounts(id) on delete set null,
  created_at        timestamptz not null default now()
);

-- Recurring bills (forecasted only; not auto-posted)
create table recurring_bills (
  id            uuid primary key default uuid_generate_v4(),
  household_id  uuid not null references households(id) on delete cascade,
  name          text not null,
  category_id   uuid references categories(id) on delete set null,
  account_id    uuid references accounts(id) on delete set null,
  amount        numeric(12, 2) not null,
  cadence       text not null,
  next_due_date date
);

-- Import audit log
create table imports (
  id           uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  user_id      uuid not null references auth.users(id),
  filename     text not null,
  row_count    int not null default 0,
  status       text not null check (status in ('pending', 'complete', 'error')),
  errors       jsonb,
  created_at   timestamptz not null default now()
);

-- Household invite links
create table household_invites (
  id           uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  token        uuid not null unique default uuid_generate_v4(),
  created_by   uuid not null references auth.users(id),
  redeemed_by  uuid references auth.users(id),
  redeemed_at  timestamptz,
  expires_at   timestamptz not null default (now() + interval '7 days'),
  created_at   timestamptz not null default now()
);

-- Benchmark cache tables (public data — no PII, no household scoping needed)
create table benchmarks_bls_cex (
  id               bigserial primary key,
  income_bracket   text not null,
  household_size   int,
  region           text,
  category         text not null,
  annual_avg_spend numeric(12, 2),
  data_year        int not null,
  source_url       text,
  ingested_at      timestamptz not null default now(),
  unique (income_bracket, household_size, region, category, data_year)
);

create table benchmarks_hud_fmr (
  id          bigserial primary key,
  zip_code    text not null,
  bedrooms    int not null,
  rent_amount numeric(12, 2),
  data_year   int not null,
  source_url  text,
  ingested_at timestamptz not null default now(),
  unique (zip_code, bedrooms, data_year)
);

create table benchmarks_zillow (
  id          bigserial primary key,
  zip_code    text not null,
  metric      text not null,
  value       numeric(12, 2),
  as_of       date not null,
  source_url  text,
  ingested_at timestamptz not null default now(),
  unique (zip_code, metric, as_of)
);

-- Benchmark ingestion audit log
create table benchmark_ingestion_log (
  id            bigserial primary key,
  function_name text not null,
  rows_upserted int not null default 0,
  rows_skipped  int not null default 0,
  errors        jsonb,
  started_at    timestamptz not null,
  completed_at  timestamptz not null default now()
);

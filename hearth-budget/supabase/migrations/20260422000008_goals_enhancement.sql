-- Phase 5.5: Goals Enhancement
-- New tables: goal_templates, goal_account_links, financial_reference
-- Extended: savings_goals (template_id, computed_target, priority)
-- Extended: households (annual_gross_income, primary_age, partner_age)
-- Extended: categories (is_essential)

-- =============================================
-- Goal templates (seeded, globally readable)
-- =============================================
create table goal_templates (
  id text primary key,
  name text not null,
  description text not null,
  category text check (category in ('safety', 'housing', 'retirement', 'liquidity', 'other')),
  target_formula text,
  default_priority int,
  source_citations jsonb,
  created_at timestamptz default now()
);

alter table goal_templates enable row level security;

create policy "anyone can read templates"
on goal_templates for select
to authenticated
using (true);

-- =============================================
-- Extend savings_goals
-- =============================================
alter table savings_goals add column template_id text references goal_templates(id);
alter table savings_goals add column computed_target boolean default false;
alter table savings_goals add column priority int default 0;

-- =============================================
-- Goal ↔ account link (many-to-many)
-- =============================================
create table goal_account_links (
  goal_id uuid references savings_goals(id) on delete cascade,
  account_id uuid references accounts(id) on delete cascade,
  include_balance boolean default true,
  primary key (goal_id, account_id)
);

alter table goal_account_links enable row level security;

create policy "household members only"
on goal_account_links for all
using (
  exists (
    select 1 from savings_goals sg
    join household_members hm on hm.household_id = sg.household_id
    where sg.id = goal_account_links.goal_id
      and hm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from savings_goals sg
    join household_members hm on hm.household_id = sg.household_id
    where sg.id = goal_account_links.goal_id
      and hm.user_id = auth.uid()
  )
);

-- =============================================
-- Financial reference (informational, globally readable)
-- =============================================
create table financial_reference (
  id text primary key,
  category text,
  name text,
  summary text,
  pros jsonb,
  cons jsonb,
  source_name text,
  source_url text,
  source_date date,
  updated_at timestamptz default now()
);

alter table financial_reference enable row level security;

create policy "anyone can read references"
on financial_reference for select
to authenticated
using (true);

-- =============================================
-- Household profile extensions for retirement math
-- =============================================
alter table households add column annual_gross_income numeric;
alter table households add column primary_age int;
alter table households add column partner_age int;

-- =============================================
-- Categories: is_essential flag
-- =============================================
alter table categories add column is_essential boolean default false;

-- =============================================
-- Accounts: contribution_status for retirement tracking
-- =============================================
alter table accounts add column contribution_status text
  check (contribution_status in ('active', 'dormant', 'closed'))
  default 'active';

-- =============================================
-- Seed: goal_templates
-- =============================================
insert into goal_templates (id, name, description, category, target_formula, default_priority, source_citations) values
(
  'checking_buffer',
  'Checking buffer',
  'Keep roughly one month of essential expenses in checking to avoid overdrafts and cover timing gaps between paychecks.',
  'liquidity',
  '1 × monthly essential expenses',
  1,
  '[{"name": "General cash-flow principle", "year": null, "url": null, "note": "Common guideline, not an institutional benchmark"}]'::jsonb
),
(
  'emergency_fund_3mo',
  'Emergency fund (3 months)',
  'Cover 3 months of essential expenses in a liquid, accessible account to handle job loss, medical bills, or car repairs.',
  'safety',
  '3 × monthly essential expenses',
  2,
  '[{"name": "CFPB", "year": 2024, "url": "https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/"}]'::jsonb
),
(
  'emergency_fund_6mo',
  'Emergency fund (6 months)',
  'The recommended full emergency fund: 6 months of essential expenses in a high-yield savings account.',
  'safety',
  '6 × monthly essential expenses',
  3,
  '[{"name": "FDIC", "year": 2024, "url": "https://www.fdic.gov/consumers/assistance/protection/savings-accounts.html"}, {"name": "CFPB", "year": 2024, "url": "https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/"}]'::jsonb
),
(
  'hysa_balance',
  'High-yield savings balance',
  'Keep your emergency fund in a high-yield savings account to earn interest while maintaining FDIC insurance and liquidity.',
  'liquidity',
  'Target ≥ emergency_fund_6mo target',
  4,
  '[{"name": "CFPB", "year": 2024, "url": "https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/"}, {"name": "NerdWallet", "year": 2026, "url": "https://www.nerdwallet.com/best/banking/high-yield-online-savings-accounts"}]'::jsonb
),
(
  'retirement_rate',
  'Retirement contribution rate',
  'Aim to save at least 15% of gross household income for retirement across all retirement accounts (401k, IRA, etc.).',
  'retirement',
  '15% of annual gross income',
  5,
  '[{"name": "Fidelity", "year": 2026, "url": "https://www.fidelity.com/viewpoints/retirement/how-much-money-should-I-save"}]'::jsonb
),
(
  'retirement_balance_age',
  'Retirement balance by age',
  'Fidelity salary multiplier guideline: 1× salary by 30, 3× by 40, 6× by 50, 8× by 60, 10× by 67.',
  'retirement',
  'Fidelity salary multiplier for current age',
  6,
  '[{"name": "Fidelity", "year": 2026, "url": "https://www.fidelity.com/viewpoints/retirement/how-much-money-should-I-save"}]'::jsonb
),
(
  'house_20_percent',
  'House down payment (20%)',
  'Save 20% of your target home price to avoid private mortgage insurance (PMI) and get the best loan terms.',
  'housing',
  '20% of target home price',
  7,
  '[{"name": "Standard mortgage industry guidance", "year": null, "url": null, "note": "20% down avoids PMI on conventional loans"}]'::jsonb
),
(
  'house_5_percent',
  'House down payment (5%, conventional)',
  'Minimum 5% down for a conventional loan. PMI will be required until you reach 20% equity.',
  'housing',
  '5% of target home price',
  8,
  '[{"name": "Fannie Mae / Freddie Mac conventional loan guidelines", "year": 2024, "url": "https://singlefamily.fanniemae.com/originating-underwriting/mortgage-products/97-ltv-options"}]'::jsonb
),
(
  'house_3_5_percent',
  'House down payment (3.5%, FHA)',
  'Minimum 3.5% down for an FHA loan. Requires mortgage insurance premium (MIP) for the life of the loan.',
  'housing',
  '3.5% of target home price',
  9,
  '[{"name": "FHA / HUD", "year": 2024, "url": "https://www.hud.gov/buying/loans"}]'::jsonb
);

-- =============================================
-- Seed: financial_reference (informational only)
-- Dated figures use source_date=null to trigger "needs refresh" state
-- =============================================
insert into financial_reference (id, category, name, summary, pros, cons, source_name, source_url, source_date) values
(
  'fidelity_ira',
  'brokerage',
  'Fidelity IRA',
  'No account minimum, no annual fee, strong retirement planning tools and research. Offers both Traditional and Roth IRAs with access to stocks, bonds, ETFs, and mutual funds.',
  '["No minimum balance", "No annual account fee", "Strong retirement planning tools", "Fractional shares available", "24/7 customer support"]'::jsonb,
  '["Platform can feel complex for beginners", "Some mutual funds have minimums"]'::jsonb,
  'Fidelity, NerdWallet 2026',
  'https://www.nerdwallet.com/reviews/investing/brokers/fidelity',
  null
),
(
  'schwab_ira',
  'brokerage',
  'Charles Schwab IRA',
  'NerdWallet 2026 "best IRA broker" pick. No account minimum, no annual fee. Full-service brokerage with strong research and customer service.',
  '["No minimum balance", "No annual account fee", "Excellent customer service", "Comprehensive research tools", "Schwab Intelligent Portfolios (robo) included free"]'::jsonb,
  '["No fractional shares for OTC stocks", "Mutual fund selection smaller than Fidelity"]'::jsonb,
  'NerdWallet 2026',
  'https://www.nerdwallet.com/reviews/investing/brokers/charles-schwab',
  null
),
(
  'vanguard_ira',
  'brokerage',
  'Vanguard IRA',
  'Pioneer of low-cost index investing. Known for investor-owned structure that keeps fund expense ratios among the lowest in the industry.',
  '["Investor-owned structure (no outside shareholders)", "Ultra-low-cost index funds", "Strong long-term investment philosophy", "No account minimum for most funds"]'::jsonb,
  '["Dated web/mobile interface", "Slower trade execution vs. competitors", "Limited active trading tools"]'::jsonb,
  'Vanguard',
  'https://investor.vanguard.com/accounts-plans/iras',
  null
),
(
  'robinhood_ira',
  'brokerage',
  'Robinhood IRA',
  'Simple, mobile-first interface. Offers IRA with 1% match on contributions (subject to conditions). Limited retirement-specific planning tools compared to Fidelity/Schwab.',
  '["Clean mobile interface", "1% IRA match on contributions", "No account minimum", "Commission-free trades"]'::jsonb,
  '["Limited retirement planning tools", "Narrow research offering", "Customer support historically limited", "PFOF revenue model"]'::jsonb,
  'Robinhood, NerdWallet 2026',
  'https://robinhood.com/us/en/about/ira/',
  null
),
(
  'hysa_rate_reference',
  'rate_benchmark',
  'HYSA rate benchmark',
  'Current top high-yield savings account APY vs. FDIC national average. Rates change with Federal Reserve decisions.',
  null,
  null,
  'FDIC',
  'https://www.fdic.gov/resources/bankers/national-rates/',
  null
),
(
  'roth_vs_traditional',
  'account_type',
  'Roth IRA vs Traditional IRA',
  'Roth IRA: contribute post-tax dollars, withdrawals in retirement are tax-free. Traditional IRA: contribute pre-tax dollars (may be deductible), withdrawals are taxed as income. Both have the same annual contribution limit.',
  '["Roth: tax-free growth and withdrawals", "Roth: no RMDs during owners lifetime", "Traditional: immediate tax deduction (if eligible)", "Traditional: lower taxable income now"]'::jsonb,
  '["Roth: no upfront tax break", "Roth: income limits on direct contributions", "Traditional: RMDs starting at 73", "Traditional: withdrawals taxed as ordinary income"]'::jsonb,
  'IRS',
  'https://www.irs.gov/retirement-plans/traditional-and-roth-iras',
  '2026-01-01'
),
(
  '401k_rollover',
  'account_type',
  '401(k) rollover options',
  'When leaving an employer, you can roll over your 401(k) to an IRA. Direct rollover to Traditional IRA = no tax event. Rollover to Roth IRA = taxable conversion (pay income tax on the converted amount).',
  '["Direct rollover to Traditional IRA: no taxes owed", "More investment choices in an IRA vs. typical 401(k)", "Can consolidate multiple old 401(k)s into one IRA", "Roth conversion: pay tax now for tax-free growth later"]'::jsonb,
  '["Roth conversion triggers taxable event", "Lose 401(k) creditor protections in some states", "Some 401(k)s have institutional-class funds with lower fees than retail equivalents"]'::jsonb,
  'Vanguard, Fidelity',
  'https://www.fidelity.com/retirement-ira/401k-rollover-ira',
  '2026-01-01'
),
(
  'contribution_limits_2026',
  'rate_benchmark',
  '2026 IRS contribution limits',
  '401(k) employee elective deferral: $23,500. IRA (Traditional + Roth combined): $7,000. Catch-up (age 50+): 401(k) +$7,500, IRA +$1,000. These are 2025 limits; 2026 limits not yet announced — will update when IRS publishes.',
  null,
  null,
  'IRS',
  'https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-contributions',
  null
);

-- =============================================
-- Seed essential categories for existing households
-- Mark common essential expense categories
-- =============================================
update categories set is_essential = true
where lower(name) in (
  'housing', 'rent', 'mortgage',
  'utilities', 'electric', 'gas', 'water', 'internet', 'phone',
  'groceries', 'grocery',
  'transportation', 'gas', 'car payment', 'auto',
  'health', 'healthcare', 'medical',
  'insurance', 'health insurance', 'auto insurance', 'car insurance'
)
and archived_at is null;

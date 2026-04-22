-- Seed BLS Consumer Expenditure Survey 2024 data
-- Source: https://www.bls.gov/cex/ (API verified 2026-04-22)
-- Income quintile 2 (second 20%, $29,932–$57,452/yr) matches household income of ~$53,000

-- All quintiles seeded for comparison flexibility
-- "all" = national average across all consumer units

insert into benchmarks_bls_cex (income_bracket, category, annual_avg_spend, data_year, source_url)
values
  -- All consumer units
  ('all', 'Groceries', 6224.00, 2024, 'https://www.bls.gov/cex/'),
  ('all', 'Restaurants', 3945.00, 2024, 'https://www.bls.gov/cex/'),
  ('all', 'Housing', 26266.00, 2024, 'https://www.bls.gov/cex/'),
  ('all', 'Rent / Mortgage', 16317.00, 2024, 'https://www.bls.gov/cex/'),
  ('all', 'Transportation', 13318.00, 2024, 'https://www.bls.gov/cex/'),
  ('all', 'Car Payment', 5337.00, 2024, 'https://www.bls.gov/cex/'),
  ('all', 'Transit', 1131.00, 2024, 'https://www.bls.gov/cex/'),
  ('all', 'Health', 6197.00, 2024, 'https://www.bls.gov/cex/'),
  ('all', 'Entertainment', 3609.00, 2024, 'https://www.bls.gov/cex/'),
  ('all', 'Personal Care', 978.00, 2024, 'https://www.bls.gov/cex/'),
  ('all', 'Shopping', 2001.00, 2024, 'https://www.bls.gov/cex/'),
  ('all', 'Miscellaneous', 1218.00, 2024, 'https://www.bls.gov/cex/'),
  -- Quintile 1 (lowest 20%, <$29,932)
  ('q1', 'Groceries', 4304.00, 2024, 'https://www.bls.gov/cex/'),
  ('q1', 'Restaurants', 1741.00, 2024, 'https://www.bls.gov/cex/'),
  ('q1', 'Housing', 15200.00, 2024, 'https://www.bls.gov/cex/'),
  ('q1', 'Rent / Mortgage', 9876.00, 2024, 'https://www.bls.gov/cex/'),
  ('q1', 'Transportation', 5406.00, 2024, 'https://www.bls.gov/cex/'),
  ('q1', 'Car Payment', 1628.00, 2024, 'https://www.bls.gov/cex/'),
  ('q1', 'Transit', 302.00, 2024, 'https://www.bls.gov/cex/'),
  ('q1', 'Health', 3074.00, 2024, 'https://www.bls.gov/cex/'),
  ('q1', 'Entertainment', 1418.00, 2024, 'https://www.bls.gov/cex/'),
  ('q1', 'Personal Care', 409.00, 2024, 'https://www.bls.gov/cex/'),
  ('q1', 'Shopping', 797.00, 2024, 'https://www.bls.gov/cex/'),
  ('q1', 'Miscellaneous', 426.00, 2024, 'https://www.bls.gov/cex/'),
  -- Quintile 2 (second 20%, $29,932–$57,452)
  ('q2', 'Groceries', 5088.00, 2024, 'https://www.bls.gov/cex/'),
  ('q2', 'Restaurants', 2503.00, 2024, 'https://www.bls.gov/cex/'),
  ('q2', 'Housing', 18968.00, 2024, 'https://www.bls.gov/cex/'),
  ('q2', 'Rent / Mortgage', 11924.00, 2024, 'https://www.bls.gov/cex/'),
  ('q2', 'Transportation', 8479.00, 2024, 'https://www.bls.gov/cex/'),
  ('q2', 'Car Payment', 3154.00, 2024, 'https://www.bls.gov/cex/'),
  ('q2', 'Transit', 400.00, 2024, 'https://www.bls.gov/cex/'),
  ('q2', 'Health', 5007.00, 2024, 'https://www.bls.gov/cex/'),
  ('q2', 'Entertainment', 2071.00, 2024, 'https://www.bls.gov/cex/'),
  ('q2', 'Personal Care', 580.00, 2024, 'https://www.bls.gov/cex/'),
  ('q2', 'Shopping', 1099.00, 2024, 'https://www.bls.gov/cex/'),
  ('q2', 'Miscellaneous', 654.00, 2024, 'https://www.bls.gov/cex/'),
  -- Quintile 3 (middle 20%, $57,452–$94,511)
  ('q3', 'Groceries', 5854.00, 2024, 'https://www.bls.gov/cex/'),
  ('q3', 'Restaurants', 3301.00, 2024, 'https://www.bls.gov/cex/'),
  ('q3', 'Housing', 22906.00, 2024, 'https://www.bls.gov/cex/'),
  ('q3', 'Rent / Mortgage', 14139.00, 2024, 'https://www.bls.gov/cex/'),
  ('q3', 'Transportation', 12019.00, 2024, 'https://www.bls.gov/cex/'),
  ('q3', 'Car Payment', 5033.00, 2024, 'https://www.bls.gov/cex/'),
  ('q3', 'Transit', 596.00, 2024, 'https://www.bls.gov/cex/'),
  ('q3', 'Health', 5801.00, 2024, 'https://www.bls.gov/cex/'),
  ('q3', 'Entertainment', 2841.00, 2024, 'https://www.bls.gov/cex/'),
  ('q3', 'Personal Care', 808.00, 2024, 'https://www.bls.gov/cex/'),
  ('q3', 'Shopping', 1557.00, 2024, 'https://www.bls.gov/cex/'),
  ('q3', 'Miscellaneous', 906.00, 2024, 'https://www.bls.gov/cex/'),
  -- Quintile 4 (fourth 20%, $94,511–$155,925)
  ('q4', 'Groceries', 6729.00, 2024, 'https://www.bls.gov/cex/'),
  ('q4', 'Restaurants', 4371.00, 2024, 'https://www.bls.gov/cex/'),
  ('q4', 'Housing', 28564.00, 2024, 'https://www.bls.gov/cex/'),
  ('q4', 'Rent / Mortgage', 17620.00, 2024, 'https://www.bls.gov/cex/'),
  ('q4', 'Transportation', 15480.00, 2024, 'https://www.bls.gov/cex/'),
  ('q4', 'Car Payment', 6280.00, 2024, 'https://www.bls.gov/cex/'),
  ('q4', 'Transit', 990.00, 2024, 'https://www.bls.gov/cex/'),
  ('q4', 'Health', 7193.00, 2024, 'https://www.bls.gov/cex/'),
  ('q4', 'Entertainment', 4052.00, 2024, 'https://www.bls.gov/cex/'),
  ('q4', 'Personal Care', 1111.00, 2024, 'https://www.bls.gov/cex/'),
  ('q4', 'Shopping', 2118.00, 2024, 'https://www.bls.gov/cex/'),
  ('q4', 'Miscellaneous', 1344.00, 2024, 'https://www.bls.gov/cex/'),
  -- Quintile 5 (highest 20%, >$155,925)
  ('q5', 'Groceries', 9138.00, 2024, 'https://www.bls.gov/cex/'),
  ('q5', 'Restaurants', 7842.00, 2024, 'https://www.bls.gov/cex/'),
  ('q5', 'Housing', 45630.00, 2024, 'https://www.bls.gov/cex/'),
  ('q5', 'Rent / Mortgage', 28028.00, 2024, 'https://www.bls.gov/cex/'),
  ('q5', 'Transportation', 25216.00, 2024, 'https://www.bls.gov/cex/'),
  ('q5', 'Car Payment', 10596.00, 2024, 'https://www.bls.gov/cex/'),
  ('q5', 'Transit', 3382.00, 2024, 'https://www.bls.gov/cex/'),
  ('q5', 'Health', 9926.00, 2024, 'https://www.bls.gov/cex/'),
  ('q5', 'Entertainment', 7636.00, 2024, 'https://www.bls.gov/cex/'),
  ('q5', 'Personal Care', 1982.00, 2024, 'https://www.bls.gov/cex/'),
  ('q5', 'Shopping', 4444.00, 2024, 'https://www.bls.gov/cex/'),
  ('q5', 'Miscellaneous', 2768.00, 2024, 'https://www.bls.gov/cex/')
on conflict (income_bracket, household_size, region, category, data_year) do nothing;

-- Seed HUD Fair Market Rents FY2026 for Provo-Orem, UT
-- Source: https://www.huduser.gov/portal/datasets/fmr.html (bulk CSV verified 2026-04-22)
-- FMR = 40th percentile of gross rents (includes utilities)
insert into benchmarks_hud_fmr (zip_code, bedrooms, rent_amount, data_year, source_url)
values
  ('84601', 0, 1086.00, 2026, 'https://www.huduser.gov/portal/datasets/fmr.html'),
  ('84601', 1, 1093.00, 2026, 'https://www.huduser.gov/portal/datasets/fmr.html'),
  ('84601', 2, 1253.00, 2026, 'https://www.huduser.gov/portal/datasets/fmr.html'),
  ('84601', 3, 1766.00, 2026, 'https://www.huduser.gov/portal/datasets/fmr.html'),
  ('84601', 4, 2126.00, 2026, 'https://www.huduser.gov/portal/datasets/fmr.html')
on conflict (zip_code, bedrooms, data_year) do nothing;

-- Seed Zillow data for Provo ZIPs (as of March 2026)
-- ZORI = Zillow Observed Rent Index (smoothed, seasonally adjusted)
-- ZHVI = Zillow Home Value Index (typical home value, middle tier)
-- Source: https://www.zillow.com/research/data/ (CSV verified 2026-04-22)
insert into benchmarks_zillow (zip_code, metric, value, as_of, source_url)
values
  ('84601', 'zori', 1466.00, '2026-03-31', 'https://www.zillow.com/research/data/'),
  ('84601', 'zhvi', 452170.00, '2026-03-31', 'https://www.zillow.com/research/data/'),
  ('84604', 'zori', 1686.00, '2026-03-31', 'https://www.zillow.com/research/data/')
on conflict (zip_code, metric, as_of) do nothing;

-- Log the ingestion
insert into benchmark_ingestion_log (function_name, rows_upserted, started_at, completed_at)
values ('seed_migration_20260422000009', 75, now(), now());

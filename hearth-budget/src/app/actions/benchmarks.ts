'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { incomeToQuintile, QUINTILE_BOUNDS } from '@/lib/benchmarks/bls-cex-2024'

async function getHouseholdContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single()

  if (!member) redirect('/onboarding')

  const { data: household } = await supabase
    .from('households')
    .select('income_bracket, zip, metro')
    .eq('id', member.household_id)
    .single()

  return { supabase, user, householdId: member.household_id, household }
}

export interface CategorySpending {
  categoryName: string
  monthlySpent: number
  blsBenchmark: number | null
  blsLabel: string | null
  diffPercent: number | null
}

export interface HousingBenchmark {
  hudFmr: { rent: number; bedrooms: number; dataYear: number } | null
  zillowRent: number | null
  zillowHomeValue: number | null
  userRent: number | null
}

export interface InsightsData {
  quintile: string
  quintileLabel: string
  incomeBracket: string
  metro: string
  zip: string
  categoryComparisons: CategorySpending[]
  housing: HousingBenchmark
  dataYear: number
  sources: { name: string; url: string; note: string }[]
}

export async function getInsightsData(): Promise<{
  data: InsightsData | null
  error?: string
}> {
  const { supabase, householdId, household } = await getHouseholdContext()

  if (!household) return { data: null, error: 'Household not found' }

  const income = parseInt(household.income_bracket || '0', 10)
  const quintile = incomeToQuintile(income)
  const bounds = QUINTILE_BOUNDS[quintile]

  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`

  const [spendingResult, blsResult, fmrResult, zillowResult] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, categories(name, is_income)')
      .eq('household_id', householdId)
      .gte('occurred_on', monthStart)
      .lte('occurred_on', monthEnd),
    supabase
      .from('benchmarks_bls_cex')
      .select('*')
      .eq('income_bracket', quintile)
      .eq('data_year', 2024),
    supabase
      .from('benchmarks_hud_fmr')
      .select('*')
      .eq('zip_code', household.zip || '')
      .eq('data_year', 2026),
    supabase
      .from('benchmarks_zillow')
      .select('*')
      .eq('zip_code', household.zip || ''),
  ])

  const spending = spendingResult.data ?? []
  const blsRows = blsResult.data ?? []
  const fmrRows = fmrResult.data ?? []
  const zillowRows = zillowResult.data ?? []

  const spendByCategory: Record<string, number> = {}
  for (const tx of spending) {
    const cat = tx.categories as { name: string; is_income: boolean } | null
    if (!cat || cat.is_income) continue
    const name = cat.name
    spendByCategory[name] = (spendByCategory[name] || 0) + Math.abs(tx.amount)
  }

  const blsMap: Record<string, number> = {}
  for (const row of blsRows) {
    blsMap[row.category] = Number(row.annual_avg_spend) / 12
  }

  const categoryComparisons: CategorySpending[] = Object.entries(spendByCategory)
    .map(([categoryName, monthlySpent]) => {
      const benchmark = blsMap[categoryName] ?? null
      return {
        categoryName,
        monthlySpent: Math.round(monthlySpent * 100) / 100,
        blsBenchmark: benchmark !== null ? Math.round(benchmark * 100) / 100 : null,
        blsLabel: benchmark !== null ? `BLS CEX 2024 (${bounds.label})` : null,
        diffPercent:
          benchmark !== null && benchmark > 0
            ? Math.round(((monthlySpent - benchmark) / benchmark) * 100)
            : null,
      }
    })
    .sort((a, b) => b.monthlySpent - a.monthlySpent)

  const allBenchmarkedCategories = Object.keys(blsMap)
  for (const cat of allBenchmarkedCategories) {
    if (!spendByCategory[cat]) {
      const val = blsMap[cat]!
      categoryComparisons.push({
        categoryName: cat,
        monthlySpent: 0,
        blsBenchmark: Math.round(val * 100) / 100,
        blsLabel: `BLS CEX 2024 (${bounds.label})`,
        diffPercent: -100,
      })
    }
  }

  const fmr2br = fmrRows.find((r) => r.bedrooms === 2)
  const zoriRow = zillowRows.find((r) => r.metric === 'zori')
  const zhviRow = zillowRows.find((r) => r.metric === 'zhvi')

  const rentSpent = spendByCategory['Rent / Mortgage'] ?? null

  const housing: HousingBenchmark = {
    hudFmr: fmr2br
      ? { rent: Number(fmr2br.rent_amount), bedrooms: 2, dataYear: fmr2br.data_year }
      : null,
    zillowRent: zoriRow ? Number(zoriRow.value) : null,
    zillowHomeValue: zhviRow ? Number(zhviRow.value) : null,
    userRent: rentSpent,
  }

  return {
    data: {
      quintile,
      quintileLabel: bounds.label,
      incomeBracket: household.income_bracket || 'unknown',
      metro: household.metro || 'Unknown',
      zip: household.zip || 'Unknown',
      categoryComparisons,
      housing,
      dataYear: 2024,
      sources: [
        {
          name: 'BLS Consumer Expenditure Survey',
          url: 'https://www.bls.gov/cex/',
          note: '2024 annual means by income quintile. National averages.',
        },
        {
          name: 'HUD Fair Market Rents',
          url: 'https://www.huduser.gov/portal/datasets/fmr.html',
          note: 'FY2026. 40th percentile of gross rents (includes utilities).',
        },
        {
          name: 'Zillow Research (ZORI/ZHVI)',
          url: 'https://www.zillow.com/research/data/',
          note: 'March 2026. Smoothed, seasonally adjusted index values.',
        },
      ],
    },
  }
}

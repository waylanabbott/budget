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

export interface InsightsData {
  quintile: string
  quintileLabel: string
  incomeBracket: string
  metro: string
  zip: string
  categoryComparisons: CategorySpending[]
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

  const [spendingResult, blsResult] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, occurred_on, categories(name, is_income)')
      .eq('household_id', householdId),
    supabase
      .from('benchmarks_bls_cex')
      .select('*')
      .eq('income_bracket', quintile)
      .eq('data_year', 2024),
  ])

  const spending = spendingResult.data ?? []
  const blsRows = blsResult.data ?? []

  // Calculate average monthly spend per category across all history
  const totalByCategory: Record<string, number> = {}
  const monthsSeen = new Set<string>()
  for (const tx of spending) {
    const cat = tx.categories as { name: string; is_income: boolean } | null
    if (!cat || cat.is_income) continue
    totalByCategory[cat.name] = (totalByCategory[cat.name] || 0) + Math.abs(tx.amount)
    monthsSeen.add(tx.occurred_on.slice(0, 7))
  }
  const numMonths = Math.max(monthsSeen.size, 1)

  const spendByCategory: Record<string, number> = {}
  for (const [name, total] of Object.entries(totalByCategory)) {
    spendByCategory[name] = total / numMonths
  }

  const blsMap: Record<string, number> = {}
  for (const row of blsRows) {
    blsMap[row.category] = Number(row.annual_avg_spend) / 12
  }

  // Map user categories to BLS categories when names don't match directly
  const categoryToBls: Record<string, string> = {
    'Gas': 'Transportation',
    'Car Insurance': 'Transportation',
    'Subscriptions': 'Entertainment',
    'Gym': 'Personal Care',
    'Parking': 'Transportation',
    'Car Wash': 'Transportation',
    'Food': 'Groceries',
  }

  // Group user categories by their BLS equivalent so we compare combined
  // spending (Gas + Car Insurance + Car Wash) to one Transportation benchmark
  const blsGrouped: Record<string, { userCategories: string[]; totalSpent: number }> = {}
  for (const [name, spent] of Object.entries(spendByCategory)) {
    if (name === 'Savings Transfers') continue
    const blsCat = categoryToBls[name] ?? name
    if (!blsGrouped[blsCat]) blsGrouped[blsCat] = { userCategories: [], totalSpent: 0 }
    blsGrouped[blsCat].userCategories.push(name)
    blsGrouped[blsCat].totalSpent += spent
  }

  const categoryComparisons: CategorySpending[] = Object.entries(blsGrouped)
    .map(([blsCategory, { userCategories, totalSpent }]) => {
      const benchmark = blsMap[blsCategory] ?? null
      const displayName = userCategories.length === 1
        ? userCategories[0]!
        : blsCategory
      const subcategories = userCategories.length > 1
        ? userCategories.join(', ')
        : null
      const label = subcategories
        ? `BLS CEX 2024 — includes ${subcategories} (${bounds.label})`
        : `BLS CEX 2024 (${bounds.label})`
      return {
        categoryName: displayName,
        monthlySpent: Math.round(totalSpent * 100) / 100,
        blsBenchmark: benchmark !== null ? Math.round(benchmark * 100) / 100 : null,
        blsLabel: benchmark !== null ? label : null,
        diffPercent:
          benchmark !== null && benchmark > 0
            ? Math.round(((totalSpent - benchmark) / benchmark) * 100)
            : null,
      }
    })
    .sort((a, b) => b.monthlySpent - a.monthlySpent)

  return {
    data: {
      quintile,
      quintileLabel: bounds.label,
      incomeBracket: household.income_bracket || 'unknown',
      metro: household.metro || 'Unknown',
      zip: household.zip || 'Unknown',
      categoryComparisons,
      dataYear: 2024,
      sources: [
        {
          name: 'BLS Consumer Expenditure Survey',
          url: 'https://www.bls.gov/cex/',
          note: '2024 annual means by income quintile. National averages.',
        },
      ],
    },
  }
}

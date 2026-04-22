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

export interface SubItem {
  name: string
  monthlyAmount: number
  source: 'transactions' | 'recurring'
}

export interface CategorySpending {
  categoryName: string
  monthlySpent: number
  blsBenchmark: number | null
  blsLabel: string | null
  diffPercent: number | null
  subItems: SubItem[]
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

const CATEGORY_TO_BLS: Record<string, string> = {
  'Gas': 'Transportation',
  'Car Insurance': 'Transportation',
  'Subscriptions': 'Entertainment',
  'Gym': 'Personal Care',
  'Parking': 'Transportation',
  'Car Wash': 'Transportation',
  'Food': 'Groceries',
  'Rent / Mortgage': 'Shelter',
  'Tithing': 'Cash Contributions',
}

function billToMonthly(amount: number, cadence: string): number {
  const amt = Math.abs(amount)
  if (cadence === 'weekly') return amt * 4.33
  if (cadence === 'biweekly') return amt * 2.17
  if (cadence === 'yearly') return amt / 12
  return amt
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

  const [spendingResult, blsResult, billsResult] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, occurred_on, categories(name, is_income)')
      .eq('household_id', householdId),
    supabase
      .from('benchmarks_bls_cex')
      .select('*')
      .eq('income_bracket', quintile)
      .eq('data_year', 2024),
    supabase
      .from('recurring_bills')
      .select('name, amount, cadence, categories(name)')
      .eq('household_id', householdId),
  ])

  const spending = spendingResult.data ?? []
  const blsRows = blsResult.data ?? []
  const bills = billsResult.data ?? []

  // Average monthly spend per category from transactions
  const totalByCategory: Record<string, number> = {}
  const monthsSeen = new Set<string>()
  for (const tx of spending) {
    const cat = tx.categories as { name: string; is_income: boolean } | null
    if (!cat || cat.is_income) continue
    totalByCategory[cat.name] = (totalByCategory[cat.name] || 0) + Math.abs(tx.amount)
    monthsSeen.add(tx.occurred_on.slice(0, 7))
  }
  const numMonths = Math.max(monthsSeen.size, 1)

  const txAvgByCategory: Record<string, number> = {}
  for (const [name, total] of Object.entries(totalByCategory)) {
    txAvgByCategory[name] = total / numMonths
  }

  // Recurring bills by category (monthly equivalent)
  const billsByCategory: Record<string, { name: string; monthly: number }[]> = {}
  for (const bill of bills) {
    const cat = bill.categories as { name: string } | null
    const catName = cat?.name ?? 'Other'
    if (catName === 'Savings Transfers') continue
    if (!billsByCategory[catName]) billsByCategory[catName] = []
    billsByCategory[catName].push({
      name: bill.name,
      monthly: billToMonthly(bill.amount, bill.cadence),
    })
  }

  // BLS benchmark lookup
  const blsMap: Record<string, number> = {}
  for (const row of blsRows) {
    blsMap[row.category] = Number(row.annual_avg_spend) / 12
  }

  // Collect all user categories from both sources
  const allCategories = new Set<string>()
  for (const name of Object.keys(txAvgByCategory)) {
    if (name !== 'Savings Transfers') allCategories.add(name)
  }
  for (const name of Object.keys(billsByCategory)) {
    allCategories.add(name)
  }

  // Group by BLS equivalent
  const blsGrouped: Record<string, {
    userCategories: string[]
    totalSpent: number
    subItems: SubItem[]
  }> = {}

  for (const userCat of allCategories) {
    const blsCat = CATEGORY_TO_BLS[userCat] ?? userCat

    if (!blsGrouped[blsCat]) {
      blsGrouped[blsCat] = { userCategories: [], totalSpent: 0, subItems: [] }
    }
    const group = blsGrouped[blsCat]
    group.userCategories.push(userCat)

    const recurringBills = billsByCategory[userCat]
    const txAvg = txAvgByCategory[userCat] ?? 0

    if (recurringBills && recurringBills.length > 0) {
      // Use recurring bills as the source of truth for this category
      const billTotal = recurringBills.reduce((s, b) => s + b.monthly, 0)
      group.totalSpent += billTotal
      for (const bill of recurringBills) {
        group.subItems.push({
          name: bill.name,
          monthlyAmount: Math.round(bill.monthly * 100) / 100,
          source: 'recurring',
        })
      }
    } else if (txAvg > 0) {
      // No recurring bills — use transaction average
      group.totalSpent += txAvg
      group.subItems.push({
        name: userCat,
        monthlyAmount: Math.round(txAvg * 100) / 100,
        source: 'transactions',
      })
    }
  }

  const categoryComparisons: CategorySpending[] = Object.entries(blsGrouped)
    .map(([blsCategory, { userCategories, totalSpent, subItems }]) => {
      const benchmark = blsMap[blsCategory] ?? null
      const displayName = userCategories.length === 1
        ? userCategories[0]!
        : blsCategory

      const label = `BLS CEX 2024 (${bounds.label})`

      // Sort sub-items by amount descending
      subItems.sort((a, b) => b.monthlyAmount - a.monthlyAmount)

      return {
        categoryName: displayName,
        monthlySpent: Math.round(totalSpent * 100) / 100,
        blsBenchmark: benchmark !== null ? Math.round(benchmark * 100) / 100 : null,
        blsLabel: benchmark !== null ? label : null,
        diffPercent:
          benchmark !== null && benchmark > 0
            ? Math.round(((totalSpent - benchmark) / benchmark) * 100)
            : null,
        subItems,
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

'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  weightedAvgSpend,
  projectEndOfMonth,
  calculateRunway,
  projectCashFlow,
  dailyStandardDeviation,
  checkForecastConfidence,
  type MonthlySpend,
  type CashFlowPoint,
  type RunwayResult,
  type EndOfMonthProjection,
  type ForecastConfidence,
  type RecurringIncome,
} from '@/lib/forecast'
import { subMonths, format, differenceInCalendarDays } from 'date-fns'

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

  return { supabase, user, householdId: member.household_id }
}

export interface CategoryForecast {
  categoryId: string
  categoryName: string
  spentThisMonth: number
  projection: EndOfMonthProjection
  weightedMonthlyAvg: number
  budgetCap: number | null
}

export interface ForecastData {
  confidence: ForecastConfidence
  categoryForecasts: CategoryForecast[]
  runway: RunwayResult
  cashFlow: CashFlowPoint[]
  totalSpentThisMonth: number
  totalIncomeThisMonth: number
}

export async function getForecastData(): Promise<{
  data: ForecastData | null
  error?: string
}> {
  const { supabase, householdId } = await getHouseholdContext()
  const now = new Date()

  const threeMonthsAgo = subMonths(now, 3)
  const startDate = format(threeMonthsAgo, 'yyyy-MM-01')
  const currentMonthStart = format(now, 'yyyy-MM-01')
  const today = format(now, 'yyyy-MM-dd')

  const [txResult, categoriesResult, accountsResult, billsResult, budgetsResult] =
    await Promise.all([
      supabase
        .from('transactions')
        .select('id, amount, occurred_on, category_id, merchant, categories(name, is_income)')
        .eq('household_id', householdId)
        .gte('occurred_on', startDate)
        .lte('occurred_on', today)
        .order('occurred_on', { ascending: true }),
      supabase
        .from('categories')
        .select('id, name, is_income')
        .eq('household_id', householdId),
      supabase
        .from('accounts')
        .select('id, name, starting_balance')
        .eq('household_id', householdId)
        .eq('is_archived', false),
      supabase
        .from('recurring_bills')
        .select('id, name, amount, cadence, next_due_date, category_id')
        .eq('household_id', householdId),
      supabase
        .from('budgets')
        .select('category_id, amount')
        .eq('household_id', householdId)
        .lte('effective_from', today)
        .or(`effective_to.is.null,effective_to.gte.${today}`),
    ])

  const transactions = txResult.data ?? []
  const accounts = accountsResult.data ?? []
  const bills = billsResult.data ?? []
  const budgets = budgetsResult.data ?? []

  // Confidence check
  const firstTx = transactions[0]
  const oldestTx = firstTx ? new Date(firstTx.occurred_on) : null
  const confidence = checkForecastConfidence(oldestTx, now)

  // Account balances
  const { data: allTx } = await supabase
    .from('transactions')
    .select('amount, account_id')
    .eq('household_id', householdId)

  const accountBalances: Record<string, number> = {}
  for (const acct of accounts) {
    accountBalances[acct.id] = Number(acct.starting_balance) || 0
  }
  for (const tx of allTx ?? []) {
    const current = accountBalances[tx.account_id]
    if (current !== undefined) {
      accountBalances[tx.account_id] = current + Number(tx.amount)
    }
  }
  const totalBalance = Object.values(accountBalances).reduce((a, b) => a + b, 0)

  // Monthly spending by category (expenses only)
  const monthlyByCategory: Record<string, MonthlySpend[]> = {}
  const currentMonthSpend: Record<string, number> = {}
  let totalSpentThisMonth = 0
  let totalIncomeThisMonth = 0

  for (const tx of transactions) {
    const cat = tx.categories as { name: string; is_income: boolean } | null
    if (!cat) continue

    const txMonth = tx.occurred_on.slice(0, 7)
    const amount = Math.abs(Number(tx.amount))
    const isCurrentMonth = tx.occurred_on >= currentMonthStart

    if (cat.is_income) {
      if (isCurrentMonth) totalIncomeThisMonth += Number(tx.amount)
      continue
    }

    if (isCurrentMonth) {
      totalSpentThisMonth += amount
      currentMonthSpend[cat.name] = (currentMonthSpend[cat.name] || 0) + amount
    }

    if (!monthlyByCategory[cat.name]) monthlyByCategory[cat.name] = []
    const catMonths = monthlyByCategory[cat.name]!
    const existing = catMonths.find((m) => m.month === txMonth)
    if (existing) {
      existing.total += amount
    } else {
      catMonths.push({ month: txMonth, total: amount })
    }
  }

  // Budget caps lookup
  const budgetCaps: Record<string, number> = {}
  for (const b of budgets) {
    if (b.category_id) budgetCaps[b.category_id] = Number(b.amount)
  }

  // Category forecasts
  const categoryForecasts: CategoryForecast[] = []
  const categories = categoriesResult.data ?? []

  for (const cat of categories) {
    if (cat.is_income) continue
    const spent = currentMonthSpend[cat.name] || 0
    if (spent === 0 && !monthlyByCategory[cat.name]) continue

    const history = monthlyByCategory[cat.name] || []
    const avgMonthly = weightedAvgSpend(history)

    const dailySpendLast30 = spent > 0 ? [spent / now.getDate()] : []
    const projection = projectEndOfMonth(spent, now, dailySpendLast30)

    categoryForecasts.push({
      categoryId: cat.id,
      categoryName: cat.name,
      spentThisMonth: Math.round(spent * 100) / 100,
      projection,
      weightedMonthlyAvg: avgMonthly,
      budgetCap: budgetCaps[cat.id] ?? null,
    })
  }

  categoryForecasts.sort((a, b) => b.spentThisMonth - a.spentThisMonth)

  // Monthly outflows for runway
  const monthlyOutflows: number[] = []
  const outflowByMonth: Record<string, number> = {}
  for (const tx of transactions) {
    const cat = tx.categories as { name: string; is_income: boolean } | null
    if (!cat || cat.is_income) continue
    const txMonth = tx.occurred_on.slice(0, 7)
    outflowByMonth[txMonth] = (outflowByMonth[txMonth] || 0) + Math.abs(Number(tx.amount))
  }
  for (const [, total] of Object.entries(outflowByMonth)) {
    monthlyOutflows.push(total)
  }

  const runway = calculateRunway(totalBalance, monthlyOutflows)

  // Cash flow projection
  const dailyAmounts: number[] = []
  const expenseTxOnly = transactions.filter((tx) => {
    const cat = tx.categories as { name: string; is_income: boolean } | null
    return cat && !cat.is_income
  })

  const firstExpense = expenseTxOnly[0]
  if (firstExpense) {
    const firstDate = new Date(firstExpense.occurred_on)
    const totalDays = differenceInCalendarDays(now, firstDate) || 1
    const totalExpenseAmount = expenseTxOnly.reduce(
      (s, tx) => s + Math.abs(Number(tx.amount)),
      0
    )
    const avgDaily = totalExpenseAmount / totalDays

    const dailyMap: Record<string, number> = {}
    for (const tx of expenseTxOnly) {
      dailyMap[tx.occurred_on] =
        (dailyMap[tx.occurred_on] || 0) + Math.abs(Number(tx.amount))
    }
    for (const [, v] of Object.entries(dailyMap)) {
      dailyAmounts.push(v)
    }

    const stdDev = dailyStandardDeviation(dailyAmounts)

    const recurringBills = bills.map((b) => ({
      name: b.name,
      amount: Number(b.amount),
      cadence: b.cadence,
      nextDueDate: b.next_due_date,
    }))

    // Build recurring income from income transaction patterns
    const incomeTxOnly = transactions.filter((tx) => {
      const cat = tx.categories as { name: string; is_income: boolean } | null
      return cat && cat.is_income
    })

    const incomeBySource: Record<string, { amounts: number[]; dates: string[] }> = {}
    for (const tx of incomeTxOnly) {
      const key = tx.merchant ?? 'Income'
      if (!incomeBySource[key]) incomeBySource[key] = { amounts: [], dates: [] }
      incomeBySource[key]!.amounts.push(Math.abs(Number(tx.amount)))
      incomeBySource[key]!.dates.push(tx.occurred_on)
    }

    const recurringIncome: RecurringIncome[] = []
    for (const [name, data] of Object.entries(incomeBySource)) {
      if (data.dates.length < 2) {
        // Single paycheck — assume biweekly
        const lastDate = data.dates[data.dates.length - 1]!
        recurringIncome.push({
          name,
          amount: data.amounts[data.amounts.length - 1]!,
          cadence: 'biweekly',
          nextDate: lastDate,
        })
        continue
      }
      const sorted = [...data.dates].sort()
      const gaps: number[] = []
      for (let i = 1; i < sorted.length; i++) {
        gaps.push(differenceInCalendarDays(new Date(sorted[i]!), new Date(sorted[i - 1]!)))
      }
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length
      const cadence = avgGap <= 9 ? 'weekly' : avgGap <= 18 ? 'biweekly' : 'monthly'
      const lastDate = sorted[sorted.length - 1]!
      const lastAmount = data.amounts[data.amounts.length - 1]!

      recurringIncome.push({ name, amount: lastAmount, cadence, nextDate: lastDate })
    }

    const cashFlow = projectCashFlow(totalBalance, now, 60, recurringBills, avgDaily, stdDev, recurringIncome)

    return {
      data: {
        confidence,
        categoryForecasts,
        runway,
        cashFlow,
        totalSpentThisMonth,
        totalIncomeThisMonth,
      },
    }
  }

  return {
    data: {
      confidence,
      categoryForecasts,
      runway,
      cashFlow: [],
      totalSpentThisMonth,
      totalIncomeThisMonth,
    },
  }
}

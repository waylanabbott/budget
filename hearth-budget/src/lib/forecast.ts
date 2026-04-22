import { getDaysInMonth, differenceInCalendarDays, addDays } from 'date-fns'

export interface MonthlySpend {
  month: string // YYYY-MM
  total: number
}

export function weightedAvgSpend(months: MonthlySpend[]): number {
  if (months.length === 0) return 0
  if (months.length === 1) return months[0]!.total

  const weights = [0.5, 0.3, 0.2]
  const sorted = [...months].sort((a, b) => b.month.localeCompare(a.month))
  const used = sorted.slice(0, 3)

  let weightSum = 0
  let valueSum = 0
  for (let i = 0; i < used.length; i++) {
    const entry = used[i]!
    const w = weights[i] ?? weights[weights.length - 1]!
    valueSum += entry.total * w
    weightSum += w
  }

  return Math.round((valueSum / weightSum) * 100) / 100
}

export interface EndOfMonthProjection {
  spentSoFar: number
  avgDailySpend: number
  daysRemaining: number
  projected: number
}

export function projectEndOfMonth(
  spentSoFar: number,
  referenceDate: Date,
  dailySpendHistory: number[]
): EndOfMonthProjection {
  const daysInMonth = getDaysInMonth(referenceDate)
  const dayOfMonth = referenceDate.getDate()
  const daysRemaining = daysInMonth - dayOfMonth

  const avgDailySpend =
    dailySpendHistory.length > 0
      ? dailySpendHistory.reduce((a, b) => a + b, 0) / dailySpendHistory.length
      : 0

  const projected =
    Math.round((spentSoFar + avgDailySpend * daysRemaining) * 100) / 100

  return {
    spentSoFar,
    avgDailySpend: Math.round(avgDailySpend * 100) / 100,
    daysRemaining,
    projected,
  }
}

export interface RunwayResult {
  totalBalance: number
  avgMonthlyOutflow: number
  months: number | null
}

export function calculateRunway(
  totalBalance: number,
  monthlyOutflows: number[]
): RunwayResult {
  if (monthlyOutflows.length === 0) {
    return { totalBalance, avgMonthlyOutflow: 0, months: null }
  }

  const avgMonthlyOutflow =
    monthlyOutflows.reduce((a, b) => a + b, 0) / monthlyOutflows.length

  if (avgMonthlyOutflow <= 0) {
    return { totalBalance, avgMonthlyOutflow: 0, months: null }
  }

  const months = Math.round((totalBalance / avgMonthlyOutflow) * 10) / 10

  return {
    totalBalance,
    avgMonthlyOutflow: Math.round(avgMonthlyOutflow * 100) / 100,
    months,
  }
}

export interface RecurringBill {
  name: string
  amount: number
  cadence: string
  nextDueDate: string | null
}

export interface RecurringIncome {
  name: string
  amount: number
  cadence: string
  nextDate: string | null
}

export interface CashFlowPoint {
  date: string
  balance: number
  upper: number
  lower: number
}

export function projectCashFlow(
  startBalance: number,
  startDate: Date,
  days: number,
  recurringBills: RecurringBill[],
  avgDailySpend: number,
  dailyStdDev: number,
  recurringIncome: RecurringIncome[] = []
): CashFlowPoint[] {
  const points: CashFlowPoint[] = []
  let balance = startBalance

  for (let d = 0; d <= days; d++) {
    const date = addDays(startDate, d)
    const dateStr = formatDate(date)

    if (d > 0) {
      balance -= avgDailySpend

      for (const bill of recurringBills) {
        if (isBillDue(bill, dateStr)) {
          balance -= Math.abs(bill.amount)
        }
      }

      for (const income of recurringIncome) {
        if (isIncomeDue(income, dateStr)) {
          balance += Math.abs(income.amount)
        }
      }
    }

    const deviation = dailyStdDev * Math.sqrt(d || 1)
    points.push({
      date: dateStr,
      balance: Math.round(balance * 100) / 100,
      upper: Math.round((balance + deviation) * 100) / 100,
      lower: Math.round((balance - deviation) * 100) / 100,
    })
  }

  return points
}

function isIncomeDue(income: RecurringIncome, dateStr: string): boolean {
  if (!income.nextDate) return false
  const nextDate = new Date(income.nextDate + 'T00:00:00')
  const checkDate = new Date(dateStr + 'T00:00:00')

  if (income.cadence === 'biweekly') {
    const diff = differenceInCalendarDays(checkDate, nextDate)
    return diff >= 0 && diff % 14 === 0
  }
  if (income.cadence === 'monthly') {
    return checkDate.getDate() === nextDate.getDate()
  }
  if (income.cadence === 'weekly') {
    const diff = differenceInCalendarDays(checkDate, nextDate)
    return diff >= 0 && diff % 7 === 0
  }
  return dateStr === income.nextDate
}

function isBillDue(bill: RecurringBill, dateStr: string): boolean {
  if (!bill.nextDueDate) return false
  const dueDate = new Date(bill.nextDueDate + 'T00:00:00')
  const checkDate = new Date(dateStr + 'T00:00:00')

  if (bill.cadence === 'monthly') {
    return checkDate.getDate() === dueDate.getDate()
  }
  if (bill.cadence === 'biweekly') {
    const diff = differenceInCalendarDays(checkDate, dueDate)
    return diff >= 0 && diff % 14 === 0
  }
  if (bill.cadence === 'weekly') {
    const diff = differenceInCalendarDays(checkDate, dueDate)
    return diff >= 0 && diff % 7 === 0
  }
  if (bill.cadence === 'yearly') {
    return (
      checkDate.getMonth() === dueDate.getMonth() &&
      checkDate.getDate() === dueDate.getDate()
    )
  }
  return dateStr === bill.nextDueDate
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function dailyStandardDeviation(dailyAmounts: number[]): number {
  if (dailyAmounts.length < 2) return 0
  const mean = dailyAmounts.reduce((a, b) => a + b, 0) / dailyAmounts.length
  const variance =
    dailyAmounts.reduce((sum, val) => sum + (val - mean) ** 2, 0) /
    (dailyAmounts.length - 1)
  return Math.sqrt(variance)
}

export interface ForecastConfidence {
  ready: boolean
  daysOfHistory: number
  message: string | null
}

export function checkForecastConfidence(
  oldestTransactionDate: Date | null,
  referenceDate: Date,
  minimumDays: number = 60
): ForecastConfidence {
  if (!oldestTransactionDate) {
    return {
      ready: false,
      daysOfHistory: 0,
      message: 'No transaction history yet. Add transactions to enable forecasts.',
    }
  }

  const daysOfHistory = differenceInCalendarDays(referenceDate, oldestTransactionDate)

  if (daysOfHistory < minimumDays) {
    return {
      ready: false,
      daysOfHistory,
      message: `Still learning your patterns — ${daysOfHistory} days of history so far. Forecasts appear after ${minimumDays} days.`,
    }
  }

  return { ready: true, daysOfHistory, message: null }
}

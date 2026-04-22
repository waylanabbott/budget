import { describe, it, expect } from 'vitest'
import {
  weightedAvgSpend,
  projectEndOfMonth,
  calculateRunway,
  projectCashFlow,
  dailyStandardDeviation,
  checkForecastConfidence,
} from '@/lib/forecast'

describe('weightedAvgSpend', () => {
  it('returns 0 for empty array', () => {
    expect(weightedAvgSpend([])).toBe(0)
  })

  it('returns single month value', () => {
    expect(weightedAvgSpend([{ month: '2026-04', total: 500 }])).toBe(500)
  })

  it('applies 0.5/0.3/0.2 weights to 3 months', () => {
    const months = [
      { month: '2026-02', total: 400 },
      { month: '2026-03', total: 500 },
      { month: '2026-04', total: 600 },
    ]
    // sorted: 2026-04 (600*0.5=300), 2026-03 (500*0.3=150), 2026-02 (400*0.2=80)
    // = 530 / 1.0 = 530
    expect(weightedAvgSpend(months)).toBe(530)
  })

  it('handles 2 months with 0.5/0.3 weights', () => {
    const months = [
      { month: '2026-03', total: 400 },
      { month: '2026-04', total: 600 },
    ]
    // sorted: 2026-04 (600*0.5=300), 2026-03 (400*0.3=120)
    // = 420 / 0.8 = 525
    expect(weightedAvgSpend(months)).toBe(525)
  })

  it('uses only 3 most recent months even if more provided', () => {
    const months = [
      { month: '2026-01', total: 100 },
      { month: '2026-02', total: 400 },
      { month: '2026-03', total: 500 },
      { month: '2026-04', total: 600 },
    ]
    expect(weightedAvgSpend(months)).toBe(530)
  })
})

describe('projectEndOfMonth', () => {
  it('projects with avg daily spend', () => {
    // April 15, spent $500, avg daily $20, 15 days left
    const result = projectEndOfMonth(500, new Date(2026, 3, 15), [20, 20, 20])
    expect(result.spentSoFar).toBe(500)
    expect(result.avgDailySpend).toBe(20)
    expect(result.daysRemaining).toBe(15)
    expect(result.projected).toBe(800)
  })

  it('handles empty history', () => {
    const result = projectEndOfMonth(500, new Date(2026, 3, 15), [])
    expect(result.avgDailySpend).toBe(0)
    expect(result.projected).toBe(500)
  })

  it('last day of month has 0 remaining', () => {
    const result = projectEndOfMonth(800, new Date(2026, 3, 30), [25])
    expect(result.daysRemaining).toBe(0)
    expect(result.projected).toBe(800)
  })

  it('first day of month', () => {
    const result = projectEndOfMonth(50, new Date(2026, 3, 1), [30])
    expect(result.daysRemaining).toBe(29)
    expect(result.projected).toBe(920)
  })
})

describe('calculateRunway', () => {
  it('calculates months from balance and outflows', () => {
    const result = calculateRunway(10000, [2000, 2500, 2200])
    expect(result.avgMonthlyOutflow).toBe(2233.33)
    expect(result.months).toBe(4.5)
  })

  it('returns null months for empty outflows', () => {
    const result = calculateRunway(10000, [])
    expect(result.months).toBeNull()
  })

  it('returns null months for zero outflow', () => {
    const result = calculateRunway(10000, [0, 0, 0])
    expect(result.months).toBeNull()
  })

  it('handles negative balance', () => {
    const result = calculateRunway(-500, [2000])
    expect(result.months).toBe(-0.2)
  })
})

describe('projectCashFlow', () => {
  it('generates daily points for requested period', () => {
    const points = projectCashFlow(5000, new Date(2026, 3, 22), 7, [], 50, 10)
    expect(points).toHaveLength(8) // day 0 through day 7
    expect(points[0]!.balance).toBe(5000)
    expect(points[0]!.date).toBe('2026-04-22')
    expect(points[7]!.date).toBe('2026-04-29')
  })

  it('deducts avg daily spend each day', () => {
    const points = projectCashFlow(1000, new Date(2026, 3, 22), 3, [], 100, 0)
    expect(points[0]!.balance).toBe(1000)
    expect(points[1]!.balance).toBe(900)
    expect(points[2]!.balance).toBe(800)
    expect(points[3]!.balance).toBe(700)
  })

  it('deducts recurring monthly bill on due date', () => {
    const bills: Array<{ name: string; amount: number; cadence: string; nextDueDate: string | null }> = [
      { name: 'Rent', amount: 575, cadence: 'monthly', nextDueDate: '2026-05-01' },
    ]
    const points = projectCashFlow(5000, new Date(2026, 3, 30), 3, bills, 0, 0)
    expect(points[0]!.balance).toBe(5000)
    expect(points[1]!.balance).toBe(4425)
    expect(points[2]!.balance).toBe(4425)
  })

  it('confidence band widens over time', () => {
    const points = projectCashFlow(5000, new Date(2026, 3, 22), 5, [], 50, 20)
    expect(points[0]!.upper - points[0]!.lower).toBeCloseTo(40, 0)
    expect(points[4]!.upper - points[4]!.lower).toBeCloseTo(80, 0)
  })
})

describe('dailyStandardDeviation', () => {
  it('returns 0 for single value', () => {
    expect(dailyStandardDeviation([50])).toBe(0)
  })

  it('returns 0 for empty array', () => {
    expect(dailyStandardDeviation([])).toBe(0)
  })

  it('calculates sample std dev', () => {
    // [10, 20, 30] → mean=20, var=((10-20)²+(20-20)²+(30-20)²)/2 = 100
    const result = dailyStandardDeviation([10, 20, 30])
    expect(result).toBeCloseTo(10, 1)
  })
})

describe('checkForecastConfidence', () => {
  const ref = new Date(2026, 3, 22)

  it('not ready with no transactions', () => {
    const result = checkForecastConfidence(null, ref)
    expect(result.ready).toBe(false)
    expect(result.daysOfHistory).toBe(0)
  })

  it('not ready under 60 days', () => {
    const result = checkForecastConfidence(new Date(2026, 3, 1), ref)
    expect(result.ready).toBe(false)
    expect(result.daysOfHistory).toBe(21)
    expect(result.message).toContain('21 days')
  })

  it('ready at 60 days', () => {
    const result = checkForecastConfidence(new Date(2026, 1, 21), ref)
    expect(result.ready).toBe(true)
    expect(result.daysOfHistory).toBe(60)
    expect(result.message).toBeNull()
  })

  it('custom minimum days', () => {
    const result = checkForecastConfidence(new Date(2026, 3, 1), ref, 14)
    expect(result.ready).toBe(true)
  })
})

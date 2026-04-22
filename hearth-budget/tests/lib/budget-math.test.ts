import { describe, it, expect } from 'vitest'
import { calcBudgetPace } from '@/lib/budget-math'

describe('calcBudgetPace', () => {
  it('mid-month exactly on pace', () => {
    // April 15 = day 15 of 30. Spent 50% of $1000 cap.
    const result = calcBudgetPace(500, 1000, new Date(2026, 3, 15))
    expect(result.status).toBe('on')
    expect(result.pacePercent).toBe(0)
    expect(result.spentPercent).toBe(0.5)
    expect(result.expectedPercent).toBe(0.5)
  })

  it('over pace', () => {
    // April 15, spent 80% of cap → pace = 0.8 - 0.5 = +0.30
    const result = calcBudgetPace(800, 1000, new Date(2026, 3, 15))
    expect(result.status).toBe('over')
    expect(result.pacePercent).toBe(0.3)
  })

  it('under pace', () => {
    // April 15, spent 20% of cap → pace = 0.2 - 0.5 = -0.30
    const result = calcBudgetPace(200, 1000, new Date(2026, 3, 15))
    expect(result.status).toBe('under')
    expect(result.pacePercent).toBe(-0.3)
  })

  it('within 5pp tolerance is "on"', () => {
    // April 15, spent 54% → pace = 0.54 - 0.50 = +0.04 (within ±0.05)
    const result = calcBudgetPace(540, 1000, new Date(2026, 3, 15))
    expect(result.status).toBe('on')
  })

  it('first day of month', () => {
    // April 1, spent $0 of $500. pace = 0 - 1/30 = -0.0333 (within ±0.05 tolerance)
    const result = calcBudgetPace(0, 500, new Date(2026, 3, 1))
    expect(result.daysElapsed).toBe(1)
    expect(result.daysInMonth).toBe(30)
    expect(result.status).toBe('on')
  })

  it('last day of month', () => {
    // April 30, spent $500 of $500. expected=30/30=1.0, spent=1.0
    const result = calcBudgetPace(500, 500, new Date(2026, 3, 30))
    expect(result.daysElapsed).toBe(30)
    expect(result.expectedPercent).toBe(1)
    expect(result.spentPercent).toBe(1)
    expect(result.status).toBe('on')
  })

  it('cap is 0 with no spending', () => {
    const result = calcBudgetPace(0, 0, new Date(2026, 3, 15))
    expect(result.status).toBe('on')
    expect(result.pacePercent).toBe(0)
  })

  it('cap is 0 with spending', () => {
    const result = calcBudgetPace(50, 0, new Date(2026, 3, 15))
    expect(result.status).toBe('over')
    expect(result.pacePercent).toBe(1)
  })

  it('february has 28 days in non-leap year', () => {
    const result = calcBudgetPace(100, 280, new Date(2026, 1, 14))
    expect(result.daysInMonth).toBe(28)
    expect(result.expectedPercent).toBe(0.5)
    expect(result.spentPercent).toBeCloseTo(0.3571, 3)
  })

  it('february has 29 days in leap year', () => {
    const result = calcBudgetPace(100, 290, new Date(2028, 1, 14))
    expect(result.daysInMonth).toBe(29)
  })

  it('overspent beyond cap', () => {
    const result = calcBudgetPace(1500, 1000, new Date(2026, 3, 15))
    expect(result.spentPercent).toBe(1.5)
    expect(result.status).toBe('over')
  })
})

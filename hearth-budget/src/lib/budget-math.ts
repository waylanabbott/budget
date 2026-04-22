import { getDaysInMonth } from 'date-fns'

export interface BudgetPace {
  spent: number
  cap: number
  daysElapsed: number
  daysInMonth: number
  pacePercent: number
  spentPercent: number
  expectedPercent: number
  status: 'under' | 'on' | 'over'
}

/**
 * pacePercent = (spent/cap) - (daysElapsed/daysInMonth)
 * Negative means under-pace (good), positive means over-pace (bad).
 * "on" when within ±5pp of expected.
 */
export function calcBudgetPace(
  spent: number,
  cap: number,
  referenceDate: Date
): BudgetPace {
  const daysInMonth = getDaysInMonth(referenceDate)
  const dayOfMonth = referenceDate.getDate()
  const daysElapsed = dayOfMonth

  if (cap === 0) {
    return {
      spent,
      cap,
      daysElapsed,
      daysInMonth,
      pacePercent: spent > 0 ? 1 : 0,
      spentPercent: spent > 0 ? 1 : 0,
      expectedPercent: 0,
      status: spent > 0 ? 'over' : 'on',
    }
  }

  const spentPercent = spent / cap
  const expectedPercent = daysElapsed / daysInMonth
  const pacePercent = spentPercent - expectedPercent

  let status: 'under' | 'on' | 'over'
  if (pacePercent > 0.05) {
    status = 'over'
  } else if (pacePercent < -0.05) {
    status = 'under'
  } else {
    status = 'on'
  }

  return {
    spent,
    cap,
    daysElapsed,
    daysInMonth,
    pacePercent: Math.round(pacePercent * 10000) / 10000,
    spentPercent: Math.round(spentPercent * 10000) / 10000,
    expectedPercent: Math.round(expectedPercent * 10000) / 10000,
    status,
  }
}

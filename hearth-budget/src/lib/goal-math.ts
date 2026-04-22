import { differenceInMonths } from 'date-fns'

export interface GoalEta {
  target: number
  current: number
  remaining: number
  targetDate: Date | null
  monthsLeft: number | null
  requiredPerMonth: number | null
  onTrack: boolean | null
  monthlySavingsRate: number | null
}

export function calcGoalEta(
  target: number,
  current: number,
  targetDate: Date | null,
  monthlySavingsRate: number | null,
  referenceDate: Date
): GoalEta {
  const remaining = Math.max(0, target - current)

  if (remaining === 0) {
    return {
      target,
      current,
      remaining: 0,
      targetDate,
      monthsLeft: 0,
      requiredPerMonth: 0,
      onTrack: true,
      monthlySavingsRate,
    }
  }

  let monthsLeft: number | null = null
  let requiredPerMonth: number | null = null
  let onTrack: boolean | null = null

  if (targetDate) {
    monthsLeft = Math.max(0, differenceInMonths(targetDate, referenceDate))
    if (monthsLeft <= 0) {
      requiredPerMonth = remaining
      onTrack = false
    } else {
      requiredPerMonth = Math.round((remaining / monthsLeft) * 100) / 100
      if (monthlySavingsRate !== null) {
        onTrack = monthlySavingsRate >= requiredPerMonth
      }
    }
  } else if (monthlySavingsRate !== null && monthlySavingsRate > 0) {
    monthsLeft = Math.ceil(remaining / monthlySavingsRate)
  }

  return {
    target,
    current,
    remaining,
    targetDate,
    monthsLeft,
    requiredPerMonth,
    onTrack,
    monthlySavingsRate,
  }
}

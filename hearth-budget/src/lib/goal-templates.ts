export type TemplateComputeResult = {
  target: number | null
  explanation: string
  missing_fields?: string[]
  needs_input?: 'home_price'
}

const FIDELITY_MULTIPLIERS: Record<number, number> = {
  25: 0.5, 30: 1, 35: 2, 40: 3, 45: 4, 50: 6, 55: 7, 60: 8, 65: 10, 67: 10,
}

function getFidelityMultiplier(age: number): number {
  if (age < 25) return 0
  if (age >= 67) return 10
  const milestones = Object.keys(FIDELITY_MULTIPLIERS).map(Number).sort((a, b) => a - b)
  let lower = milestones[0]!
  let upper = milestones[milestones.length - 1]!
  for (let i = 0; i < milestones.length - 1; i++) {
    if (age >= milestones[i]! && age < milestones[i + 1]!) {
      lower = milestones[i]!
      upper = milestones[i + 1]!
      break
    }
  }
  const lowerMult = FIDELITY_MULTIPLIERS[lower] ?? 0
  const upperMult = FIDELITY_MULTIPLIERS[upper] ?? 10
  const progress = (age - lower) / (upper - lower)
  return lowerMult + progress * (upperMult - lowerMult)
}

export function computeTemplateTarget(
  templateId: string,
  monthlyEssentialExpenses: number,
  annualGrossIncome: number | null,
  primaryAge: number | null,
  homePrice?: number
): TemplateComputeResult {
  switch (templateId) {
    case 'checking_buffer':
      if (monthlyEssentialExpenses <= 0) {
        return { target: null, explanation: 'Need expense history to calculate target.' }
      }
      return {
        target: Math.round(monthlyEssentialExpenses * 100) / 100,
        explanation: `1 × monthly essential expenses ($${monthlyEssentialExpenses.toLocaleString()})`,
      }

    case 'emergency_fund_3mo':
      if (monthlyEssentialExpenses <= 0) {
        return { target: null, explanation: 'Need expense history to calculate target.' }
      }
      return {
        target: Math.round(monthlyEssentialExpenses * 3 * 100) / 100,
        explanation: `3 × monthly essential expenses ($${monthlyEssentialExpenses.toLocaleString()})`,
      }

    case 'emergency_fund_6mo':
      if (monthlyEssentialExpenses <= 0) {
        return { target: null, explanation: 'Need expense history to calculate target.' }
      }
      return {
        target: Math.round(monthlyEssentialExpenses * 6 * 100) / 100,
        explanation: `6 × monthly essential expenses ($${monthlyEssentialExpenses.toLocaleString()})`,
      }

    case 'hysa_balance':
      if (monthlyEssentialExpenses <= 0) {
        return { target: null, explanation: 'Need expense history to calculate target.' }
      }
      return {
        target: Math.round(monthlyEssentialExpenses * 6 * 100) / 100,
        explanation: `Same as 6-month emergency fund ($${(monthlyEssentialExpenses * 6).toLocaleString()})`,
      }

    case 'retirement_rate':
      if (!annualGrossIncome) {
        return { target: null, explanation: 'Complete your profile to see this target.', missing_fields: ['annual_gross_income'] }
      }
      return {
        target: Math.round(annualGrossIncome * 0.15 * 100) / 100,
        explanation: `15% of $${annualGrossIncome.toLocaleString()} gross income (per Fidelity)`,
      }

    case 'retirement_balance_age':
      if (!annualGrossIncome || !primaryAge) {
        const missing: string[] = []
        if (!annualGrossIncome) missing.push('annual_gross_income')
        if (!primaryAge) missing.push('primary_age')
        return { target: null, explanation: 'Complete your profile to see this target.', missing_fields: missing }
      }
      {
        const multiplier = getFidelityMultiplier(primaryAge)
        const target = Math.round(annualGrossIncome * multiplier * 100) / 100
        return {
          target,
          explanation: `${multiplier.toFixed(1)}× salary at age ${primaryAge} (per Fidelity)`,
        }
      }

    case 'house_20_percent':
      if (!homePrice) {
        return { target: null, explanation: 'Enter your target home price.', needs_input: 'home_price' }
      }
      return {
        target: Math.round(homePrice * 0.2 * 100) / 100,
        explanation: `20% of $${homePrice.toLocaleString()} home price`,
      }

    case 'house_5_percent':
      if (!homePrice) {
        return { target: null, explanation: 'Enter your target home price.', needs_input: 'home_price' }
      }
      return {
        target: Math.round(homePrice * 0.05 * 100) / 100,
        explanation: `5% of $${homePrice.toLocaleString()} home price`,
      }

    case 'house_3_5_percent':
      if (!homePrice) {
        return { target: null, explanation: 'Enter your target home price.', needs_input: 'home_price' }
      }
      return {
        target: Math.round(homePrice * 0.035 * 100) / 100,
        explanation: `3.5% of $${homePrice.toLocaleString()} home price`,
      }

    default:
      return { target: null, explanation: 'Unknown template.' }
  }
}

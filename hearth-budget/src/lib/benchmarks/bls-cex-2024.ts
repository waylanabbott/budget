export const BLS_CEX_SOURCE = {
  name: 'BLS Consumer Expenditure Survey',
  url: 'https://www.bls.gov/cex/',
  dataYear: 2024,
  retrievedDate: '2026-04-22',
  note: 'Annual mean expenditures. National averages — no regional adjustment.',
}

export type QuintileKey = 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'all'

export interface QuintileBounds {
  label: string
  lowerBound: number
  upperBound: number | null
}

export const QUINTILE_BOUNDS: Record<QuintileKey, QuintileBounds> = {
  q1: { label: 'Lowest 20%', lowerBound: 0, upperBound: 29932 },
  q2: { label: 'Second 20%', lowerBound: 29932, upperBound: 57452 },
  q3: { label: 'Middle 20%', lowerBound: 57452, upperBound: 94511 },
  q4: { label: 'Fourth 20%', lowerBound: 94511, upperBound: 155925 },
  q5: { label: 'Highest 20%', lowerBound: 155925, upperBound: null },
  all: { label: 'All households', lowerBound: 0, upperBound: null },
}

export function incomeToQuintile(annualIncome: number): QuintileKey {
  if (annualIncome < 29932) return 'q1'
  if (annualIncome < 57452) return 'q2'
  if (annualIncome < 94511) return 'q3'
  if (annualIncome < 155925) return 'q4'
  return 'q5'
}

export const BLS_CHARACTERISTIC_CODE: Record<QuintileKey, string> = {
  all: '01',
  q1: '02',
  q2: '03',
  q3: '04',
  q4: '05',
  q5: '06',
}

export interface BlsCategoryData {
  itemCode: string
  blsName: string
  appCategory: string | null
  annual: Record<QuintileKey, number | null>
}

export const BLS_CEX_DATA: BlsCategoryData[] = [
  {
    itemCode: 'TOTALEXP',
    blsName: 'Total expenditures',
    appCategory: null,
    annual: { all: 78535, q1: 35046, q2: 50054, q3: 66900, q4: 89972, q5: 150342 },
  },
  {
    itemCode: 'FOODHOME',
    blsName: 'Food at home',
    appCategory: 'Groceries',
    annual: { all: 6224, q1: 4304, q2: 5088, q3: 5854, q4: 6729, q5: 9138 },
  },
  {
    itemCode: 'FOODAWAY',
    blsName: 'Food away from home',
    appCategory: 'Restaurants',
    annual: { all: 3945, q1: 1741, q2: 2503, q3: 3301, q4: 4371, q5: 7842 },
  },
  {
    itemCode: 'HOUSING',
    blsName: 'Housing',
    appCategory: 'Housing',
    annual: { all: 26266, q1: 15200, q2: 18968, q3: 22906, q4: 28564, q5: 45630 },
  },
  {
    itemCode: 'SHELTER',
    blsName: 'Shelter',
    appCategory: 'Rent / Mortgage',
    annual: { all: 16317, q1: 9876, q2: 11924, q3: 14139, q4: 17620, q5: 28028 },
  },
  {
    itemCode: 'TRANS',
    blsName: 'Transportation',
    appCategory: 'Transportation',
    annual: { all: 13318, q1: 5406, q2: 8479, q3: 12019, q4: 15480, q5: 25216 },
  },
  {
    itemCode: 'VEHPURCH',
    blsName: 'Vehicle purchases',
    appCategory: 'Car Payment',
    annual: { all: 5337, q1: 1628, q2: 3154, q3: 5033, q4: 6280, q5: 10596 },
  },
  {
    itemCode: 'PUBTRANS',
    blsName: 'Public transportation',
    appCategory: 'Transit',
    annual: { all: 1131, q1: 302, q2: 400, q3: 596, q4: 990, q5: 3382 },
  },
  {
    itemCode: 'HEALTH',
    blsName: 'Healthcare',
    appCategory: 'Health',
    annual: { all: 6197, q1: 3074, q2: 5007, q3: 5801, q4: 7193, q5: 9926 },
  },
  {
    itemCode: 'ENTRTAIN',
    blsName: 'Entertainment',
    appCategory: 'Entertainment',
    annual: { all: 3609, q1: 1418, q2: 2071, q3: 2841, q4: 4052, q5: 7636 },
  },
  {
    itemCode: 'PERSCARE',
    blsName: 'Personal care',
    appCategory: 'Personal Care',
    annual: { all: 978, q1: 409, q2: 580, q3: 808, q4: 1111, q5: 1982 },
  },
  {
    itemCode: 'APPAREL',
    blsName: 'Apparel and services',
    appCategory: 'Shopping',
    annual: { all: 2001, q1: 797, q2: 1099, q3: 1557, q4: 2118, q5: 4444 },
  },
  {
    itemCode: 'MISC',
    blsName: 'Miscellaneous',
    appCategory: 'Miscellaneous',
    annual: { all: 1218, q1: 426, q2: 654, q3: 906, q4: 1344, q5: 2768 },
  },
]

export function getBlsBenchmarkForCategory(
  categoryName: string,
  quintile: QuintileKey
): { annualAvg: number; monthlyAvg: number; blsName: string } | null {
  const match = BLS_CEX_DATA.find(
    (d) => d.appCategory?.toLowerCase() === categoryName.toLowerCase()
  )
  if (!match) return null
  const annual = match.annual[quintile]
  if (annual === null) return null
  return {
    annualAvg: annual,
    monthlyAvg: Math.round((annual / 12) * 100) / 100,
    blsName: match.blsName,
  }
}

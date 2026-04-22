import { describe, it, expect } from 'vitest'
import {
  incomeToQuintile,
  getBlsBenchmarkForCategory,
  BLS_CEX_DATA,
} from '@/lib/benchmarks/bls-cex-2024'
import { getFmrForMetro } from '@/lib/benchmarks/hud-fmr-2026'
import { getZillowForZip } from '@/lib/benchmarks/zillow-2026'

describe('incomeToQuintile', () => {
  it('maps low income to q1', () => {
    expect(incomeToQuintile(20000)).toBe('q1')
  })

  it('maps $53k to q2', () => {
    expect(incomeToQuintile(53000)).toBe('q2')
  })

  it('maps $75k to q3', () => {
    expect(incomeToQuintile(75000)).toBe('q3')
  })

  it('maps $120k to q4', () => {
    expect(incomeToQuintile(120000)).toBe('q4')
  })

  it('maps $200k to q5', () => {
    expect(incomeToQuintile(200000)).toBe('q5')
  })

  it('boundary: $29,932 maps to q2', () => {
    expect(incomeToQuintile(29932)).toBe('q2')
  })

  it('boundary: $29,931 maps to q1', () => {
    expect(incomeToQuintile(29931)).toBe('q1')
  })
})

describe('getBlsBenchmarkForCategory', () => {
  it('returns groceries data for q2', () => {
    const result = getBlsBenchmarkForCategory('Groceries', 'q2')
    expect(result).not.toBeNull()
    expect(result!.annualAvg).toBe(5088)
    expect(result!.monthlyAvg).toBe(424)
    expect(result!.blsName).toBe('Food at home')
  })

  it('returns null for unmapped category', () => {
    const result = getBlsBenchmarkForCategory('Tithing', 'q2')
    expect(result).toBeNull()
  })

  it('case insensitive matching', () => {
    const result = getBlsBenchmarkForCategory('groceries', 'q2')
    expect(result).not.toBeNull()
  })

  it('all categories have data for all quintiles', () => {
    for (const entry of BLS_CEX_DATA) {
      for (const q of ['q1', 'q2', 'q3', 'q4', 'q5', 'all'] as const) {
        expect(entry.annual[q]).not.toBeNull()
      }
    }
  })
})

describe('getFmrForMetro', () => {
  it('returns Provo-Orem 2BR FMR', () => {
    const result = getFmrForMetro('Provo-Orem, UT', 2)
    expect(result).not.toBeNull()
    expect(result!.rent).toBe(1253)
  })

  it('returns null for unknown metro', () => {
    expect(getFmrForMetro('Narnia, XX')).toBeNull()
  })

  it('defaults to 2BR', () => {
    const result = getFmrForMetro('Provo-Orem, UT')
    expect(result!.bedrooms).toBe(2)
  })
})

describe('getZillowForZip', () => {
  it('returns Provo 84601 data', () => {
    const result = getZillowForZip('84601')
    expect(result).not.toBeNull()
    expect(result!.rent).toBe(1466)
    expect(result!.homeValue).toBe(452170)
    expect(result!.city).toBe('Provo')
  })

  it('returns null for unknown ZIP', () => {
    expect(getZillowForZip('00000')).toBeNull()
  })

  it('handles ZIP with partial data', () => {
    const result = getZillowForZip('84604')
    expect(result).not.toBeNull()
    expect(result!.rent).toBe(1686)
    expect(result!.homeValue).toBeNull()
  })
})

import { describe, it, expect } from 'vitest'
import { calcGoalEta } from '@/lib/goal-math'

describe('calcGoalEta', () => {
  const ref = new Date(2026, 3, 22) // April 22, 2026

  it('already achieved goal', () => {
    const result = calcGoalEta(5000, 5000, new Date(2026, 11, 31), 500, ref)
    expect(result.remaining).toBe(0)
    expect(result.monthsLeft).toBe(0)
    expect(result.requiredPerMonth).toBe(0)
    expect(result.onTrack).toBe(true)
  })

  it('over-saved past target', () => {
    const result = calcGoalEta(5000, 6000, new Date(2026, 11, 31), 500, ref)
    expect(result.remaining).toBe(0)
    expect(result.onTrack).toBe(true)
  })

  it('on track with target date', () => {
    // Need $3000 more, 8 months left, saving $500/mo → need $375/mo
    const result = calcGoalEta(5000, 2000, new Date(2026, 11, 22), 500, ref)
    expect(result.remaining).toBe(3000)
    expect(result.monthsLeft).toBe(8)
    expect(result.requiredPerMonth).toBe(375)
    expect(result.onTrack).toBe(true)
  })

  it('behind pace with target date', () => {
    // Need $3000 more, 8 months left, saving $200/mo → need $375/mo → behind
    const result = calcGoalEta(5000, 2000, new Date(2026, 11, 22), 200, ref)
    expect(result.requiredPerMonth).toBe(375)
    expect(result.onTrack).toBe(false)
  })

  it('target date already passed', () => {
    const result = calcGoalEta(5000, 2000, new Date(2026, 2, 1), 500, ref)
    expect(result.monthsLeft).toBe(0)
    expect(result.requiredPerMonth).toBe(3000)
    expect(result.onTrack).toBe(false)
  })

  it('no target date but has savings rate', () => {
    // $3000 remaining, saving $500/mo → 6 months
    const result = calcGoalEta(5000, 2000, null, 500, ref)
    expect(result.monthsLeft).toBe(6)
    expect(result.requiredPerMonth).toBeNull()
    expect(result.onTrack).toBeNull()
  })

  it('no target date and no savings rate', () => {
    const result = calcGoalEta(5000, 2000, null, null, ref)
    expect(result.monthsLeft).toBeNull()
    expect(result.requiredPerMonth).toBeNull()
    expect(result.onTrack).toBeNull()
  })

  it('zero savings rate with no target date', () => {
    const result = calcGoalEta(5000, 2000, null, 0, ref)
    expect(result.monthsLeft).toBeNull()
  })

  it('target date with no savings rate gives required but no onTrack', () => {
    const result = calcGoalEta(5000, 2000, new Date(2026, 11, 22), null, ref)
    expect(result.requiredPerMonth).toBe(375)
    expect(result.onTrack).toBeNull()
  })

  it('very small remaining rounds correctly', () => {
    // $1 remaining, 3 months left → 0.33/mo
    const result = calcGoalEta(5000, 4999, new Date(2026, 6, 22), null, ref)
    expect(result.remaining).toBe(1)
    expect(result.requiredPerMonth).toBe(0.33)
  })
})

import { describe, it, expect } from 'vitest'
import {
  INCOME_BRACKETS,
  householdNameSchema,
  locationSchema,
  incomeBracketSchema,
  type HouseholdNameInput,
  type LocationInput,
  type IncomeBracketInput,
} from '@/lib/schemas/onboarding'

describe('INCOME_BRACKETS', () => {
  it('has exactly 8 brackets', () => {
    expect(INCOME_BRACKETS).toHaveLength(8)
  })

  it('contains all expected brackets', () => {
    expect(INCOME_BRACKETS).toContain('<$15k')
    expect(INCOME_BRACKETS).toContain('$15-30k')
    expect(INCOME_BRACKETS).toContain('$30-40k')
    expect(INCOME_BRACKETS).toContain('$40-50k')
    expect(INCOME_BRACKETS).toContain('$50-70k')
    expect(INCOME_BRACKETS).toContain('$70-100k')
    expect(INCOME_BRACKETS).toContain('$100-150k')
    expect(INCOME_BRACKETS).toContain('$150k+')
  })
})

describe('householdNameSchema', () => {
  it('accepts valid household name', () => {
    const result = householdNameSchema.safeParse({ name: 'Smith Family' })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = householdNameSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects name over 100 characters', () => {
    const result = householdNameSchema.safeParse({ name: 'a'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('accepts name with exactly 100 characters', () => {
    const result = householdNameSchema.safeParse({ name: 'a'.repeat(100) })
    expect(result.success).toBe(true)
  })

  it('trims whitespace from name', () => {
    const result = householdNameSchema.safeParse({ name: '  Smith  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Smith')
    }
  })
})

describe('locationSchema', () => {
  it('accepts valid 5-digit ZIP and metro', () => {
    const result = locationSchema.safeParse({ zip: '84101', metro: 'Salt Lake City, UT' })
    expect(result.success).toBe(true)
  })

  it('rejects non-5-digit ZIP', () => {
    const result = locationSchema.safeParse({ zip: '1234', metro: 'Salt Lake City, UT' })
    expect(result.success).toBe(false)
  })

  it('rejects ZIP with letters', () => {
    const result = locationSchema.safeParse({ zip: 'ABCDE', metro: 'Salt Lake City, UT' })
    expect(result.success).toBe(false)
  })

  it('rejects ZIP with 6 digits', () => {
    const result = locationSchema.safeParse({ zip: '841011', metro: 'Salt Lake City, UT' })
    expect(result.success).toBe(false)
  })

  it('rejects empty metro', () => {
    const result = locationSchema.safeParse({ zip: '84101', metro: '' })
    expect(result.success).toBe(false)
  })
})

describe('incomeBracketSchema', () => {
  it('accepts valid income bracket', () => {
    const result = incomeBracketSchema.safeParse({ income_bracket: '$70-100k' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid income bracket', () => {
    const result = incomeBracketSchema.safeParse({ income_bracket: '$999k' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid brackets', () => {
    for (const bracket of INCOME_BRACKETS) {
      const result = incomeBracketSchema.safeParse({ income_bracket: bracket })
      expect(result.success).toBe(true)
    }
  })
})

// Type inference test (compile-time only)
type _HouseholdNameInput = HouseholdNameInput
type _LocationInput = LocationInput
type _IncomeBracketInput = IncomeBracketInput

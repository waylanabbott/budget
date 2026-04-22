import { describe, it, expect } from 'vitest'
import {
  householdNameSchema,
  locationSchema,
  incomeSchema,
  type HouseholdNameInput,
  type LocationInput,
  type IncomeInput,
} from '@/lib/schemas/onboarding'

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

describe('incomeSchema', () => {
  it('accepts valid numeric income', () => {
    const result = incomeSchema.safeParse({ income: '48000' })
    expect(result.success).toBe(true)
  })

  it('rejects empty income', () => {
    const result = incomeSchema.safeParse({ income: '' })
    expect(result.success).toBe(false)
  })

  it('rejects income with dollar sign', () => {
    const result = incomeSchema.safeParse({ income: '$48000' })
    expect(result.success).toBe(false)
  })

  it('rejects income with commas', () => {
    const result = incomeSchema.safeParse({ income: '48,000' })
    expect(result.success).toBe(false)
  })

  it('accepts large numbers', () => {
    const result = incomeSchema.safeParse({ income: '150000' })
    expect(result.success).toBe(true)
  })
})

// Type inference test (compile-time only)
type _HouseholdNameInput = HouseholdNameInput
type _LocationInput = LocationInput
type _IncomeInput = IncomeInput

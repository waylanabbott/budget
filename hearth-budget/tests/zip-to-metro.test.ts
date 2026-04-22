import { describe, it, expect } from 'vitest'
import { zipToMetro } from '../src/lib/zip-to-metro'

describe('zipToMetro (HSHD-02)', () => {
  it('84101 (Salt Lake City) returns the SLC metro', () => {
    expect(zipToMetro('84101')).toBe('Salt Lake City, UT-ID')
  })

  it('10001 (New York) returns a metro name containing New York', () => {
    expect(zipToMetro('10001')).toContain('New York')
  })

  it('90210 (Beverly Hills) returns the LA metro', () => {
    expect(zipToMetro('90210')).toBe('Los Angeles-Long Beach-Anaheim, CA')
  })

  it('99999 (unknown ZIP) returns "National Average"', () => {
    expect(zipToMetro('99999')).toBe('National Average')
  })

  it('empty string returns "National Average"', () => {
    expect(zipToMetro('')).toBe('National Average')
  })

  it('98101 (Seattle) returns the Seattle metro', () => {
    expect(zipToMetro('98101')).toContain('Seattle')
  })

  it('30301 (Atlanta) returns the Atlanta metro', () => {
    expect(zipToMetro('30301')).toContain('Atlanta')
  })
})

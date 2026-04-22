/**
 * ZIP-to-metro lookup unit tests (HSHD-02)
 * These tests import from src/lib/zip-to-metro.ts (created in Plan 04).
 * They are marked todo until that file exists.
 */
import { describe, it, expect } from 'vitest'

describe('zipToMetro (HSHD-02)', () => {
  it.todo('84101 (Salt Lake City) returns "Salt Lake City, UT-ID"')
  it.todo('10001 (New York) returns a metro name')
  it.todo('90210 (Beverly Hills) returns "Los Angeles-Long Beach-Anaheim, CA"')
  it.todo('99999 (unknown ZIP) returns "National Average"')
  it.todo('00000 (invalid ZIP) returns "National Average"')
})

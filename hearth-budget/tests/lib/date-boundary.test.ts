import { describe, it, expect } from 'vitest'

function getLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

describe('getLocalDateString date boundary', () => {
  it('Jan 31 11pm Mountain Time stays Jan 31', () => {
    // Simulating Jan 31 at 23:00 local time
    // In Mountain Time (UTC-7), 23:00 MST = Jan 32 06:00 UTC = Feb 1 06:00 UTC
    // But getLocalDateString uses local .getDate(), not UTC, so it stays Jan 31
    const jan31_11pm = new Date(2026, 0, 31, 23, 0, 0)
    expect(getLocalDateString(jan31_11pm)).toBe('2026-01-31')
  })

  it('Dec 31 11:59pm stays Dec 31', () => {
    const dec31 = new Date(2026, 11, 31, 23, 59, 59)
    expect(getLocalDateString(dec31)).toBe('2026-12-31')
  })

  it('Feb 28 non-leap year', () => {
    const feb28 = new Date(2026, 1, 28, 23, 30, 0)
    expect(getLocalDateString(feb28)).toBe('2026-02-28')
  })

  it('Feb 29 leap year', () => {
    const feb29 = new Date(2028, 1, 29, 23, 30, 0)
    expect(getLocalDateString(feb29)).toBe('2028-02-29')
  })
})

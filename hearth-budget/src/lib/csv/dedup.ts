/**
 * Duplicate detection hash generation and amount/date normalization for CSV import.
 *
 * CRITICAL: Uses the Web Crypto API (crypto.subtle.digest), NOT Node.js crypto module.
 * This file is imported by client components ('use client') and must work in the browser.
 * The global `crypto` object with `crypto.subtle` is available in all modern browsers
 * and in Node.js >= 15 without any import.
 */

import type { AmountMode } from '@/lib/schemas/csv-import'

/**
 * Generate a deterministic SHA-256 hash for duplicate detection.
 *
 * Hash is computed from: accountId | date | amount (2 decimal places) | merchant (first 20 chars, lowercase)
 *
 * Uses the Web Crypto API (works in both browser and Node.js >= 15).
 * Returns a hex-encoded SHA-256 digest string.
 */
export async function generateTransactionHash(
  accountId: string,
  date: string,
  amount: number,
  merchant: string | null
): Promise<string> {
  // Normalize merchant: trim, lowercase, first 20 chars
  const normalizedMerchant = merchant
    ? merchant.trim().replace(/\s+/g, ' ').toLowerCase().slice(0, 20)
    : ''

  const input = `${accountId}|${date}|${amount.toFixed(2)}|${normalizedMerchant}`

  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  return hashHex
}

/**
 * Normalize a raw amount string from CSV into a signed number.
 *
 * Conventions:
 * - Negative = expense/debit
 * - Positive = income/credit
 *
 * @param value - Raw amount string (for single_signed and single_unsigned_expense modes)
 * @param mode - How to interpret the amount
 * @param debitValue - Raw debit column string (for debit_credit mode)
 * @param creditValue - Raw credit column string (for debit_credit mode)
 * @returns Normalized amount rounded to 2 decimal places, or null if parsing fails
 */
export function normalizeAmount(
  value: string,
  mode: AmountMode,
  debitValue?: string,
  creditValue?: string
): number | null {
  const clean = (s: string): number => {
    const stripped = s.replace(/[$€£¥,\s]/g, '')
    const val = parseFloat(stripped)
    return isFinite(val) ? val : NaN
  }

  if (mode === 'single_signed') {
    const parsed = clean(value)
    if (isNaN(parsed)) return null
    return Math.round(parsed * 100) / 100
  }

  if (mode === 'single_unsigned_expense') {
    const parsed = clean(value)
    if (isNaN(parsed)) return null
    return Math.round(-Math.abs(parsed) * 100) / 100
  }

  if (mode === 'debit_credit') {
    const debit =
      debitValue !== undefined && debitValue.trim() !== ''
        ? clean(debitValue)
        : NaN
    const credit =
      creditValue !== undefined && creditValue.trim() !== ''
        ? clean(creditValue)
        : NaN

    if (!isNaN(debit) && debit !== 0) {
      return Math.round(-Math.abs(debit) * 100) / 100
    }

    if (!isNaN(credit) && credit !== 0) {
      return Math.round(Math.abs(credit) * 100) / 100
    }

    // Both present but zero, or neither present
    if (!isNaN(debit)) return 0
    if (!isNaN(credit)) return 0

    return null
  }

  return null
}

/**
 * Parse a date string in one of 4 common formats and return YYYY-MM-DD.
 *
 * @param value - Raw date string from CSV
 * @param format - Expected date format
 * @returns YYYY-MM-DD string, or null if the date is invalid
 */
export function parseDateString(
  value: string,
  format: 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'M/D/YYYY' | 'DD/MM/YYYY'
): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  let year: string
  let month: string
  let day: string

  if (format === 'YYYY-MM-DD') {
    const parts = trimmed.split('-')
    if (parts.length !== 3) return null
    year = parts[0]!
    month = parts[1]!
    day = parts[2]!
  } else if (format === 'MM/DD/YYYY' || format === 'M/D/YYYY') {
    const parts = trimmed.split('/')
    if (parts.length !== 3) return null
    month = parts[0]!
    day = parts[1]!
    year = parts[2]!
  } else if (format === 'DD/MM/YYYY') {
    const parts = trimmed.split('/')
    if (parts.length !== 3) return null
    day = parts[0]!
    month = parts[1]!
    year = parts[2]!
  } else {
    return null
  }

  // Validate components
  const y = parseInt(year, 10)
  const m = parseInt(month, 10)
  const d = parseInt(day, 10)

  if (isNaN(y) || isNaN(m) || isNaN(d)) return null
  if (year.length !== 4) return null
  if (m < 1 || m > 12) return null
  if (d < 1 || d > 31) return null

  return `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

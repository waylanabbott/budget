/**
 * Async transform of parsed CSV rows into transaction insert objects.
 *
 * Bridges raw CSV string arrays (from parser.ts) to typed TransformedRow objects
 * with normalized dates, amounts, Web Crypto-based hashes, and error collection.
 *
 * IMPORTANT: transformCsvRows is async because it calls generateTransactionHash
 * which uses the Web Crypto API (crypto.subtle.digest).
 */

import type { AmountMode, ColumnMapping } from '@/lib/schemas/csv-import'
import {
  generateTransactionHash,
  normalizeAmount,
  parseDateString,
} from './dedup'

export interface TransformConfig {
  accountId: string
  columnMapping: ColumnMapping
  amountMode: AmountMode
  dateFormat: 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'M/D/YYYY' | 'DD/MM/YYYY'
}

export interface TransformedRow {
  row_index: number
  occurred_on: string // YYYY-MM-DD
  amount: number // signed: negative=expense, positive=income
  merchant: string | null
  category_hint: string | null // raw category string from CSV (for auto-suggestion lookup)
  notes: string | null
  external_hash: string
  error: string | null // non-null if this row failed to parse
}

export interface TransformResult {
  rows: TransformedRow[]
  errors: Array<{ row_index: number; error: string }>
}

/**
 * Extract and trim a cell value from a CSV row at the given column index.
 * Returns null if the index is undefined or out of range, or if the trimmed value is empty.
 */
function extractCell(
  row: string[],
  index: number | undefined
): string | null {
  if (index === undefined || index < 0 || index >= row.length) return null
  const value = row[index]!.trim()
  return value === '' ? null : value
}

/**
 * Transform raw CSV string arrays into typed TransformedRow objects.
 *
 * ASYNC — calls generateTransactionHash which uses Web Crypto API.
 * Processes rows sequentially with await; the Web Crypto API is fast enough
 * for typical CSV sizes (under 10k rows).
 *
 * @param csvRows - Array of string arrays (each inner array is a row of cell values)
 * @param config - Transform configuration (account ID, column mapping, amount mode, date format)
 * @returns Promise resolving to successfully parsed rows and error details for invalid rows
 */
export async function transformCsvRows(
  csvRows: string[][],
  config: TransformConfig
): Promise<TransformResult> {
  const rows: TransformedRow[] = []
  const errors: Array<{ row_index: number; error: string }> = []

  for (let i = 0; i < csvRows.length; i++) {
    const csvRow = csvRows[i]!

    // 1. Extract and parse date
    const dateCell = extractCell(csvRow, config.columnMapping.date)
    if (!dateCell) {
      errors.push({ row_index: i, error: 'Invalid date: empty or missing' })
      continue
    }

    const occurredOn = parseDateString(dateCell, config.dateFormat)
    if (!occurredOn) {
      errors.push({
        row_index: i,
        error: `Invalid date: "${dateCell}" does not match format ${config.dateFormat}`,
      })
      continue
    }

    // 2. Extract and normalize amount
    let amount: number | null = null

    if (config.amountMode === 'debit_credit') {
      const debitCell =
        extractCell(csvRow, config.columnMapping.debit) ?? ''
      const creditCell =
        extractCell(csvRow, config.columnMapping.credit) ?? ''
      amount = normalizeAmount('', config.amountMode, debitCell, creditCell)
    } else {
      const amountCell = extractCell(csvRow, config.columnMapping.amount)
      if (!amountCell) {
        errors.push({
          row_index: i,
          error: 'Invalid amount: empty or missing',
        })
        continue
      }
      amount = normalizeAmount(amountCell, config.amountMode)
    }

    if (amount === null) {
      errors.push({ row_index: i, error: 'Invalid amount: could not parse' })
      continue
    }

    // 3. Extract merchant
    const merchant = extractCell(csvRow, config.columnMapping.merchant)

    // 4. Extract category hint
    const categoryHint = extractCell(csvRow, config.columnMapping.category)

    // 5. Extract notes
    const notes = extractCell(csvRow, config.columnMapping.notes)

    // 6. Generate external hash (async — Web Crypto API)
    const externalHash = await generateTransactionHash(
      config.accountId,
      occurredOn,
      amount,
      merchant
    )

    // 7. Push successful row
    rows.push({
      row_index: i,
      occurred_on: occurredOn,
      amount,
      merchant,
      category_hint: categoryHint,
      notes,
      external_hash: externalHash,
      error: null,
    })
  }

  return { rows, errors }
}

/**
 * Bank format auto-detection and default column mappings.
 *
 * Detects CSV exports from 8+ major banks by matching header signatures.
 * Ordered from most-specific to least-specific so the first match wins.
 */

import type { AmountMode, ColumnMapping } from '@/lib/schemas/csv-import'

export interface BankFormat {
  name: string
  id: string
  headerSignature: string[]
  mapping: ColumnMapping
  amountMode: AmountMode
  dateFormat: 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'M/D/YYYY' | 'DD/MM/YYYY'
}

/**
 * Build column mapping from detected headers.
 * Uses indexOf to find header positions dynamically.
 */
function idx(headers: string[], name: string): number {
  return headers.indexOf(name)
}

/**
 * Bank format definitions based on real CSV exports.
 * Ordered from most-specific header signatures to least-specific.
 */
export const BANK_FORMATS: BankFormat[] = [
  // Chase Credit Card — most specific with "post date" + "category" + "type"
  {
    name: 'Chase Credit Card',
    id: 'chase_credit',
    headerSignature: [
      'transaction date',
      'post date',
      'description',
      'category',
      'type',
      'amount',
    ],
    mapping: { date: -1, amount: -1, merchant: -1, category: -1 },
    amountMode: 'single_signed',
    dateFormat: 'MM/DD/YYYY',
  },
  // Chase Checking — has "details", "posting date", "check or slip #"
  {
    name: 'Chase Checking',
    id: 'chase_checking',
    headerSignature: [
      'details',
      'posting date',
      'description',
      'amount',
      'type',
      'balance',
      'check or slip #',
    ],
    mapping: { date: -1, amount: -1, merchant: -1 },
    amountMode: 'single_signed',
    dateFormat: 'MM/DD/YYYY',
  },
  // Capital One — has "card no.", separate debit/credit columns
  {
    name: 'Capital One',
    id: 'capital_one',
    headerSignature: [
      'transaction date',
      'posted date',
      'card no.',
      'description',
      'category',
      'debit',
      'credit',
    ],
    mapping: { date: -1, merchant: -1, category: -1, debit: -1, credit: -1 },
    amountMode: 'debit_credit',
    dateFormat: 'YYYY-MM-DD',
  },
  // Apple Card — has "clearing date", "merchant", "amount (purchase/adjustment)"
  {
    name: 'Apple Card',
    id: 'apple_card',
    headerSignature: [
      'transaction date',
      'clearing date',
      'description',
      'merchant',
      'category',
      'type',
    ],
    mapping: { date: -1, amount: -1, merchant: -1, category: -1 },
    amountMode: 'single_signed',
    dateFormat: 'MM/DD/YYYY',
  },
  // Mint — has "original description", "transaction type", "account name", "labels"
  {
    name: 'Mint',
    id: 'mint',
    headerSignature: [
      'date',
      'description',
      'original description',
      'amount',
      'transaction type',
      'category',
      'account name',
      'labels',
      'notes',
    ],
    mapping: {
      date: -1,
      amount: -1,
      merchant: -1,
      category: -1,
      notes: -1,
    },
    amountMode: 'single_unsigned_expense',
    dateFormat: 'M/D/YYYY',
  },
  // Discover — has "trans. date", "post date"
  {
    name: 'Discover',
    id: 'discover',
    headerSignature: [
      'trans. date',
      'post date',
      'description',
      'amount',
      'category',
    ],
    mapping: { date: -1, amount: -1, merchant: -1, category: -1 },
    amountMode: 'single_unsigned_expense',
    dateFormat: 'MM/DD/YYYY',
  },
  // Bank of America — has "running bal."
  {
    name: 'Bank of America',
    id: 'bank_of_america',
    headerSignature: ['date', 'description', 'amount', 'running bal.'],
    mapping: { date: 0, merchant: 1, amount: 2 },
    amountMode: 'single_signed',
    dateFormat: 'MM/DD/YYYY',
  },
  // AMEX — generic "date", "description", "amount" but may include "card member"
  {
    name: 'American Express',
    id: 'amex',
    headerSignature: ['date', 'description', 'amount'],
    mapping: { date: -1, amount: -1, merchant: -1 },
    amountMode: 'single_unsigned_expense',
    dateFormat: 'MM/DD/YYYY',
  },
  // Wells Fargo — minimal headers; often just 5 unlabeled columns
  {
    name: 'Wells Fargo',
    id: 'wells_fargo',
    headerSignature: ['date', 'amount', 'description'],
    mapping: { date: 0, amount: 1, merchant: 4 },
    amountMode: 'single_signed',
    dateFormat: 'MM/DD/YYYY',
  },
]

/**
 * Detect which bank format matches the given CSV headers.
 *
 * Normalizes headers (lowercase, trimmed) and checks if all items in a
 * format's headerSignature are present. Returns the first match (formats
 * are ordered most-specific first) or null.
 */
export function detectBankFormat(headers: string[]): BankFormat | null {
  const normalized = headers.map((h) => h.trim().toLowerCase())

  for (const format of BANK_FORMATS) {
    const allPresent = format.headerSignature.every((sig) =>
      normalized.includes(sig)
    )

    if (allPresent) {
      // Resolve dynamic mappings using actual header positions
      const resolved = resolveMappings(format, normalized)
      return resolved
    }
  }

  return null
}

/**
 * Resolve placeholder (-1) column indices to actual header positions.
 */
function resolveMappings(format: BankFormat, headers: string[]): BankFormat {
  const mapping = { ...format.mapping }

  // Map common header names to mapping fields
  const headerMappings: Record<string, keyof ColumnMapping> = {
    'transaction date': 'date',
    'posting date': 'date',
    'trans. date': 'date',
    date: 'date',
    amount: 'amount',
    'amount (purchase/adjustment)': 'amount',
    description: 'merchant',
    merchant: 'merchant',
    category: 'category',
    debit: 'debit',
    credit: 'credit',
    notes: 'notes',
    memo: 'notes',
  }

  // For formats with placeholder values (-1), resolve from headers
  for (const key of Object.keys(mapping) as (keyof ColumnMapping)[]) {
    if (mapping[key] === -1) {
      // Find the appropriate header for this mapping key
      const resolved = resolveFieldIndex(key, format, headers, headerMappings)
      if (resolved !== undefined) {
        ;(mapping as Record<string, number | undefined>)[key] = resolved
      }
    }
  }

  return { ...format, mapping }
}

/**
 * Resolve a single mapping field to its column index.
 */
function resolveFieldIndex(
  field: keyof ColumnMapping,
  format: BankFormat,
  headers: string[],
  headerMappings: Record<string, keyof ColumnMapping>
): number | undefined {
  // For specific bank formats, use known header names
  const formatSpecificHeaders: Record<string, Record<string, string[]>> = {
    chase_credit: {
      date: ['transaction date'],
      amount: ['amount'],
      merchant: ['description'],
      category: ['category'],
    },
    chase_checking: {
      date: ['posting date'],
      amount: ['amount'],
      merchant: ['description'],
    },
    capital_one: {
      date: ['transaction date'],
      merchant: ['description'],
      category: ['category'],
      debit: ['debit'],
      credit: ['credit'],
    },
    apple_card: {
      date: ['transaction date'],
      amount: ['amount (purchase/adjustment)', 'amount'],
      merchant: ['merchant', 'description'],
      category: ['category'],
    },
    mint: {
      date: ['date'],
      amount: ['amount'],
      merchant: ['description'],
      category: ['category'],
      notes: ['notes'],
    },
    discover: {
      date: ['trans. date'],
      amount: ['amount'],
      merchant: ['description'],
      category: ['category'],
    },
    amex: {
      date: ['date'],
      amount: ['amount'],
      merchant: ['description'],
    },
    wells_fargo: {
      date: ['date'],
      amount: ['amount'],
      merchant: ['description'],
    },
  }

  const specific = formatSpecificHeaders[format.id]
  if (specific && specific[field]) {
    for (const headerName of specific[field]) {
      const index = headers.indexOf(headerName)
      if (index !== -1) {
        return index
      }
    }
  }

  // Fallback: scan all headers for matching mapping target
  for (const [headerName, mappingField] of Object.entries(headerMappings)) {
    if (mappingField === field) {
      const index = headers.indexOf(headerName)
      if (index !== -1) {
        return index
      }
    }
  }

  return undefined
}

/**
 * Fallback column mapping for unrecognized CSV formats.
 *
 * Looks for common column names and returns a best-guess mapping.
 * Missing fields are left undefined for the user to manually map.
 */
export function buildMappingFromHeaders(headers: string[]): ColumnMapping {
  const normalized = headers.map((h) => h.trim().toLowerCase())

  const dateNames = ['date', 'transaction date', 'posting date', 'trans. date', 'trans date']
  const amountNames = ['amount', 'total', 'sum', 'amount (purchase/adjustment)']
  const merchantNames = [
    'description',
    'merchant',
    'payee',
    'name',
    'vendor',
  ]
  const categoryNames = ['category', 'type', 'group']
  const debitNames = ['debit', 'withdrawal', 'expense']
  const creditNames = ['credit', 'deposit', 'income']
  const notesNames = ['notes', 'memo', 'comment', 'reference']

  const findIndex = (names: string[]): number | undefined => {
    for (const name of names) {
      const i = normalized.indexOf(name)
      if (i !== -1) return i
    }
    return undefined
  }

  const dateIdx = findIndex(dateNames)

  // If no date column found, return minimal mapping (user must map manually)
  if (dateIdx === undefined) {
    return { date: 0 }
  }

  return {
    date: dateIdx,
    amount: findIndex(amountNames),
    merchant: findIndex(merchantNames),
    category: findIndex(categoryNames),
    debit: findIndex(debitNames),
    credit: findIndex(creditNames),
    notes: findIndex(notesNames),
  }
}

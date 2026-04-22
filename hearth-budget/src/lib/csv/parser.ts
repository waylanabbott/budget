/**
 * RFC 4180-compliant CSV text parser.
 *
 * Handles quoted fields (with embedded commas, newlines, and escaped quotes),
 * BOM stripping, empty rows, and trailing commas.
 */

export interface CsvParseResult {
  headers: string[]
  rows: string[][]
  rawRowCount: number
}

/**
 * Parse CSV text into headers and rows.
 *
 * - First non-empty line is treated as headers (trimmed, lowercased).
 * - Quoted fields may contain commas, newlines, and escaped double-quotes ("").
 * - Completely empty rows are skipped.
 * - BOM character at start of file is stripped.
 */
export function parseCsvText(text: string): CsvParseResult {
  // Strip BOM
  let input = text
  if (input.charCodeAt(0) === 0xfeff) {
    input = input.slice(1)
  }

  const records = parseRecords(input)

  if (records.length === 0) {
    return { headers: [], rows: [], rawRowCount: 0 }
  }

  // First record is headers — trim and lowercase
  const headers = records[0]!.map((h) => h.trim().toLowerCase())

  // Remaining records are data rows
  const rows = records.slice(1)

  return {
    headers,
    rows,
    rawRowCount: rows.length,
  }
}

/**
 * Parse CSV text into an array of records (each record is an array of field strings).
 * Implements RFC 4180 field parsing with support for quoted fields containing
 * commas, newlines, and escaped double-quotes.
 */
function parseRecords(text: string): string[][] {
  const records: string[][] = []
  let i = 0
  const len = text.length

  while (i < len) {
    const { record, nextIndex } = parseRecord(text, i)

    // Skip completely empty rows (single empty field)
    if (record.length > 0 && !(record.length === 1 && record[0] === '')) {
      records.push(record)
    }

    i = nextIndex
  }

  return records
}

/**
 * Parse a single CSV record starting at position `start`.
 * Returns the parsed fields and the index after the record terminator.
 */
function parseRecord(
  text: string,
  start: number
): { record: string[]; nextIndex: number } {
  const fields: string[] = []
  let i = start

  while (i <= text.length) {
    const { value, nextIndex, endOfRecord } = parseField(text, i)
    fields.push(value)
    i = nextIndex

    if (endOfRecord) {
      break
    }
  }

  return { record: fields, nextIndex: i }
}

/**
 * Parse a single field starting at position `start`.
 * Returns the field value, next position, and whether the record ended.
 */
function parseField(
  text: string,
  start: number
): { value: string; nextIndex: number; endOfRecord: boolean } {
  const len = text.length

  if (start >= len) {
    return { value: '', nextIndex: start, endOfRecord: true }
  }

  // Quoted field
  if (text[start] === '"') {
    let value = ''
    let i = start + 1

    while (i < len) {
      if (text[i] === '"') {
        // Escaped quote ("")
        if (i + 1 < len && text[i + 1] === '"') {
          value += '"'
          i += 2
        } else {
          // End of quoted field
          i++ // skip closing quote

          // Check what follows the closing quote
          if (i >= len) {
            return { value, nextIndex: i, endOfRecord: true }
          }
          if (text[i] === ',') {
            return { value, nextIndex: i + 1, endOfRecord: false }
          }
          if (text[i] === '\r') {
            const next = i + 1 < len && text[i + 1] === '\n' ? i + 2 : i + 1
            return { value, nextIndex: next, endOfRecord: true }
          }
          if (text[i] === '\n') {
            return { value, nextIndex: i + 1, endOfRecord: true }
          }
          // Malformed: content after closing quote — treat as end of field
          return { value, nextIndex: i, endOfRecord: false }
        }
      } else {
        value += text[i]
        i++
      }
    }

    // Unterminated quoted field — return what we have
    return { value, nextIndex: i, endOfRecord: true }
  }

  // Unquoted field
  let value = ''
  let i = start

  while (i < len) {
    const ch = text[i]

    if (ch === ',') {
      return { value, nextIndex: i + 1, endOfRecord: false }
    }
    if (ch === '\r') {
      const next = i + 1 < len && text[i + 1] === '\n' ? i + 2 : i + 1
      return { value, nextIndex: next, endOfRecord: true }
    }
    if (ch === '\n') {
      return { value, nextIndex: i + 1, endOfRecord: true }
    }

    value += ch
    i++
  }

  return { value, nextIndex: i, endOfRecord: true }
}

---
phase: 05-csv-import
plan: 01
subsystem: csv-import
tags: [csv, parser, bank-detection, sha256, web-crypto, zod, dedup, migration]

requires:
  - phase: 01-bootstrap
    provides: "Database schema with transactions and imports tables"
provides:
  - "CSV text parser (RFC 4180 compliant) with BOM stripping and quoted field support"
  - "Bank format auto-detection for 9 CSV export formats (Chase CC/checking, BofA, Wells Fargo, Capital One, Apple Card, Discover, AMEX, Mint)"
  - "Async SHA-256 dedup hash generation via Web Crypto API"
  - "Amount normalization (single_signed, single_unsigned_expense, debit_credit)"
  - "Date parsing for 4 common formats"
  - "Zod v4 schemas for column mapping, import config, and parsed CSV rows"
  - "import_id FK on transactions table linking to imports for batch undo"
affects: [05-csv-import, csv-transform, csv-preview, csv-server-action]

tech-stack:
  added: []
  patterns:
    - "Web Crypto API (crypto.subtle.digest) for browser-compatible hashing"
    - "Bank format detection by header signature matching (most-specific first)"
    - "Column mapping schema with optional debit/credit for flexible amount modes"

key-files:
  created:
    - hearth-budget/supabase/migrations/20260422000004_add_import_id.sql
    - hearth-budget/src/lib/schemas/csv-import.ts
    - hearth-budget/src/lib/csv/parser.ts
    - hearth-budget/src/lib/csv/bank-formats.ts
    - hearth-budget/src/lib/csv/dedup.ts
  modified:
    - hearth-budget/src/types/database.ts
    - hearth-budget/src/app/actions/transactions.ts

key-decisions:
  - "Web Crypto API over Node crypto for browser-compatible hashing in client components"
  - "9 bank formats (Chase CC + checking split into separate formats) ordered most-specific-first for reliable detection"
  - "Amount normalization stored as negative=expense, positive=income convention"

patterns-established:
  - "CSV lib modules in src/lib/csv/ with pure functions and no framework dependencies"
  - "Bank format detection uses header signature arrays with indexOf resolution"
  - "Dedup hash: accountId|date|amount(2dp)|merchant(20chars) -> SHA-256 hex"

requirements-completed: [CSVP-03, CSVP-04, CSVP-05]

duration: 6min
completed: 2026-04-22
---

# Phase 05 Plan 01: CSV Import Foundation Summary

**RFC 4180 CSV parser, 9-bank format auto-detection by header signatures, async Web Crypto SHA-256 dedup hashing, and import_id FK migration for batch undo**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-22T14:46:39Z
- **Completed:** 2026-04-22T14:52:34Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Migration adds import_id FK column to transactions with CASCADE delete for one-click import undo
- CSV parser handles RFC 4180 edge cases: quoted fields with commas/newlines, escaped quotes, BOM, empty rows
- Bank format detection identifies 9 CSV export formats (Chase CC, Chase checking, Bank of America, Wells Fargo, Capital One, Apple Card, Discover, AMEX, Mint) with correct column mappings and amount modes
- Dedup hash uses async Web Crypto API SHA-256 (browser + Node compatible) -- no Node-only imports
- Amount normalization handles single_signed, single_unsigned_expense, and debit_credit modes
- Date parsing covers MM/DD/YYYY, YYYY-MM-DD, M/D/YYYY, DD/MM/YYYY formats

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migration and type updates for import_id** - `6cd21c4` (feat)
2. **Task 2: CSV parser, bank format detection, dedup hash, and Zod schemas** - `67ca1b7` (feat)

## Files Created/Modified
- `hearth-budget/supabase/migrations/20260422000004_add_import_id.sql` - Adds import_id FK column with CASCADE delete and partial index
- `hearth-budget/src/types/database.ts` - Updated transactions Row/Insert/Update with import_id and relationship
- `hearth-budget/src/lib/schemas/csv-import.ts` - Zod v4 schemas: columnMappingSchema, amountModeSchema, importConfigSchema, parsedCsvRowSchema
- `hearth-budget/src/lib/csv/parser.ts` - RFC 4180-compliant CSV text parser with BOM stripping
- `hearth-budget/src/lib/csv/bank-formats.ts` - 9 bank format definitions, detectBankFormat(), buildMappingFromHeaders()
- `hearth-budget/src/lib/csv/dedup.ts` - generateTransactionHash (async, Web Crypto), normalizeAmount, parseDateString
- `hearth-budget/src/app/actions/transactions.ts` - Added import_id to getTransactions return type

## Decisions Made
- Web Crypto API (crypto.subtle.digest) chosen over Node.js crypto because dedup.ts is imported by client components ('use client')
- Chase split into two separate formats (credit card vs checking) because they have different header signatures and column layouts
- Bank formats ordered most-specific signatures first so detectBankFormat returns the most precise match
- Amount convention: negative = expense/debit, positive = income/credit (consistent with existing transaction schema)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added import_id to getTransactions explicit return type**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** Adding import_id to Database types caused type mismatch in getTransactions return type annotation (which explicitly lists each field)
- **Fix:** Added `import_id: string | null` to the explicit return type in getTransactions
- **Files modified:** hearth-budget/src/app/actions/transactions.ts
- **Verification:** npx tsc --noEmit passes with zero errors
- **Committed in:** 67ca1b7 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary fix for type safety after adding import_id to database types. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CSV parser, bank detection, and dedup modules ready for transform.ts (Plan 02)
- Zod schemas ready for server action validation
- Migration ready to apply with `supabase db push`

## Self-Check: PASSED

All 6 created files verified present. Both task commits (6cd21c4, 67ca1b7) verified in git log.

---
*Phase: 05-csv-import*
*Completed: 2026-04-22*

'use client'

import type { TransformedRow } from '@/lib/csv/transform'

interface CsvDuplicateReviewProps {
  rows: TransformedRow[]
  errors: Array<{ row_index: number; error: string }>
  accountId: string
  filename: string
  categories: Array<{ id: string; name: string; parent_id: string | null }>
  onImportComplete: (result: {
    import_id: string
    imported_count: number
    skipped_count: number
    errors: Array<{ row: number; error: string }>
  }) => void
  onBack: () => void
}

export function CsvDuplicateReview({
  rows: _rows,
  errors: _errors,
  accountId: _accountId,
  filename: _filename,
  categories: _categories,
  onImportComplete: _onImportComplete,
  onBack: _onBack,
}: CsvDuplicateReviewProps) {
  // Placeholder -- fully implemented in Task 2
  return <div>Loading duplicate review...</div>
}

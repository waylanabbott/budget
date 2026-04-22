'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import type { TransformedRow } from '@/lib/csv/transform'
import {
  checkDuplicates,
  suggestCategories,
  executeImport,
} from '@/app/actions/imports'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

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

const MAX_DISPLAY_ROWS = 200

export function CsvDuplicateReview({
  rows,
  errors,
  accountId,
  filename,
  categories,
  onImportComplete,
  onBack,
}: CsvDuplicateReviewProps) {
  const [duplicateHashes, setDuplicateHashes] = useState<Set<string>>(new Set())
  const [skipHashes, setSkipHashes] = useState<Set<string>>(new Set())
  const [categorySuggestions, setCategorySuggestions] = useState<
    Record<string, { category_id: string; category_name: string } | null>
  >({})
  const [categoryOverrides, setCategoryOverrides] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      // Check duplicates
      const hashes = rows.map((r) => r.external_hash)
      const dupResult = await checkDuplicates(accountId, hashes)

      if (cancelled) return
      if (dupResult.error) {
        toast.error(`Duplicate check failed: ${dupResult.error}`)
      }

      const dupSet = new Set(dupResult.duplicateHashes)
      setDuplicateHashes(dupSet)
      setSkipHashes(new Set(dupSet))

      // Suggest categories
      const merchants = [...new Set(rows.map((r) => r.merchant).filter(Boolean))] as string[]
      if (merchants.length > 0) {
        const catResult = await suggestCategories(merchants)
        if (!cancelled) {
          if (catResult.error) {
            toast.error(`Category suggestions failed: ${catResult.error}`)
          }
          setCategorySuggestions(catResult.suggestions)
        }
      }

      if (!cancelled) {
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [rows, accountId])

  const toggleSkipHash = useCallback(
    (hash: string) => {
      setSkipHashes((prev) => {
        const next = new Set(prev)
        if (next.has(hash)) {
          next.delete(hash)
        } else {
          next.add(hash)
        }
        return next
      })
    },
    []
  )

  const handleCategoryOverride = useCallback(
    (rowIndex: number, categoryId: string) => {
      setCategoryOverrides((prev) => ({ ...prev, [rowIndex]: categoryId }))
    },
    []
  )

  const importableCount = rows.filter((r) => !skipHashes.has(r.external_hash)).length

  const handleImport = useCallback(async () => {
    setImporting(true)

    const importRows = rows
      .filter((r) => !skipHashes.has(r.external_hash))
      .map((r) => {
        const merchantKey = r.merchant?.toLowerCase().trim() ?? ''
        const suggestion = categorySuggestions[merchantKey]
        const categoryId =
          categoryOverrides[r.row_index] ?? suggestion?.category_id ?? null

        return {
          occurred_on: r.occurred_on,
          amount: r.amount,
          merchant: r.merchant,
          category_id: categoryId,
          notes: r.notes,
          external_hash: r.external_hash,
        }
      })

    const result = await executeImport({
      filename,
      rows: importRows,
      account_id: accountId,
      skip_duplicate_hashes: [...skipHashes],
    })

    setImporting(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    onImportComplete({
      import_id: result.import_id,
      imported_count: result.imported_count,
      skipped_count: result.skipped_count,
      errors: result.errors,
    })
  }, [rows, skipHashes, categorySuggestions, categoryOverrides, filename, accountId, onImportComplete])

  if (loading) {
    return (
      <div className="space-y-3 pt-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const displayRows = rows.slice(0, MAX_DISPLAY_ROWS)

  return (
    <div className="space-y-4 pt-4">
      {/* Summary bar */}
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="font-medium">{rows.length} rows ready</span>
        {duplicateHashes.size > 0 && (
          <span className="text-[var(--color-warning)]">
            {duplicateHashes.size} duplicates found
          </span>
        )}
        {errors.length > 0 && (
          <span className="text-[var(--color-danger)]">
            {errors.length} rows with errors
          </span>
        )}
      </div>

      {/* Duplicate section */}
      {duplicateHashes.size > 0 && (
        <div className="rounded-lg border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/5 p-3">
          <h3 className="text-sm font-semibold text-[var(--color-warning)]">
            Duplicate Transactions
          </h3>
          <p className="mt-1 text-xs text-[var(--color-warning)]">
            These transactions already exist in this account. Uncheck to import anyway.
          </p>
          <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
            {rows
              .filter((r) => duplicateHashes.has(r.external_hash))
              .map((r) => (
                <label
                  key={r.external_hash}
                  className="flex items-center gap-2 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={skipHashes.has(r.external_hash)}
                    onChange={() => toggleSkipHash(r.external_hash)}
                    className="accent-primary"
                  />
                  <span className="text-muted-foreground">
                    {r.occurred_on} &middot;{' '}
                    <span className={r.amount < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}>
                      ${Math.abs(r.amount).toFixed(2)}
                    </span>
                    {r.merchant && ` &middot; ${r.merchant}`}
                  </span>
                  <span className="text-[var(--color-warning)]">Skip duplicate</span>
                </label>
              ))}
          </div>
        </div>
      )}

      {/* Rows table */}
      <div className="overflow-x-auto rounded-lg border">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm">
              <tr className="border-b">
                <th className="px-2 py-1.5 text-left text-xs font-medium">Row</th>
                <th className="px-2 py-1.5 text-left text-xs font-medium">Date</th>
                <th className="px-2 py-1.5 text-right text-xs font-medium">Amount</th>
                <th className="px-2 py-1.5 text-left text-xs font-medium">Merchant</th>
                <th className="px-2 py-1.5 text-left text-xs font-medium">Category</th>
                <th className="px-2 py-1.5 text-left text-xs font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row) => {
                const isDuplicate = duplicateHashes.has(row.external_hash)
                const isSkipped = skipHashes.has(row.external_hash)
                const errorRow = errors.find((e) => e.row_index === row.row_index)
                const merchantKey = row.merchant?.toLowerCase().trim() ?? ''
                const suggestion = categorySuggestions[merchantKey]
                const overrideId = categoryOverrides[row.row_index]
                const categoryName = overrideId
                  ? categories.find((c) => c.id === overrideId)?.name ?? 'Unknown'
                  : suggestion?.category_name ?? null

                return (
                  <tr
                    key={row.row_index}
                    className={`border-b last:border-b-0 ${isSkipped ? 'opacity-50' : ''}`}
                  >
                    <td className="px-2 py-1 text-xs text-muted-foreground">
                      {row.row_index + 1}
                    </td>
                    <td className="px-2 py-1 text-xs">{row.occurred_on}</td>
                    <td
                      className={`px-2 py-1 text-right text-xs font-mono ${
                        row.amount < 0
                          ? 'text-[var(--color-danger)]'
                          : 'text-[var(--color-success)]'
                      }`}
                    >
                      ${Math.abs(row.amount).toFixed(2)}
                    </td>
                    <td className="px-2 py-1 text-xs">{row.merchant ?? ''}</td>
                    <td className="px-2 py-1">
                      {categoryName ? (
                        <div className="flex items-center gap-1">
                          <select
                            value={overrideId ?? suggestion?.category_id ?? ''}
                            onChange={(e) =>
                              handleCategoryOverride(row.row_index, e.target.value)
                            }
                            className="h-6 w-full max-w-[140px] rounded border border-input bg-background px-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            {!overrideId && suggestion && (
                              <option value={suggestion.category_id}>
                                {suggestion.category_name}
                              </option>
                            )}
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                          {!overrideId && suggestion && (
                            <span className="shrink-0 rounded bg-[var(--color-info)]/10 px-1 py-0.5 text-xs font-medium text-[var(--color-info)]">
                              auto
                            </span>
                          )}
                        </div>
                      ) : (
                        <select
                          value=""
                          onChange={(e) =>
                            handleCategoryOverride(row.row_index, e.target.value)
                          }
                          className="h-6 w-full max-w-[140px] rounded border border-input bg-background px-1 text-xs text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="">Uncategorized</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-2 py-1 text-xs">
                      {errorRow ? (
                        <span className="text-[var(--color-danger)]">
                          Error: {errorRow.error}
                        </span>
                      ) : isDuplicate ? (
                        <span className="text-[var(--color-warning)]">
                          Duplicate
                        </span>
                      ) : (
                        <span className="text-[var(--color-success)]">
                          New
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {rows.length > MAX_DISPLAY_ROWS && (
        <p className="text-xs text-muted-foreground">
          Showing first {MAX_DISPLAY_ROWS} of {rows.length} rows. All rows will
          be imported.
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onBack} disabled={importing}>
          Back
        </Button>
        <Button onClick={handleImport} disabled={importing || importableCount === 0}>
          {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Import {importableCount} Transactions
        </Button>
      </div>
    </div>
  )
}

'use client'

import { useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'

import { transformCsvRows, type TransformResult } from '@/lib/csv/transform'
import type { ColumnMapping, AmountMode } from '@/lib/schemas/csv-import'

import { Button } from '@/components/ui/button'

interface CsvPreviewProps {
  headers: string[]
  rows: string[][]
  detectedFormatName: string | null
  columnMapping: ColumnMapping
  amountMode: AmountMode
  dateFormat: string
  accountId: string
  onMappingChange: (mapping: ColumnMapping) => void
  onAmountModeChange: (mode: AmountMode) => void
  onDateFormatChange: (format: string) => void
  onConfirm: (transformed: TransformResult) => void
  onBack: () => void
}

const DATE_FORMATS = ['MM/DD/YYYY', 'YYYY-MM-DD', 'M/D/YYYY', 'DD/MM/YYYY'] as const

const MAPPING_FIELDS: Array<{
  key: keyof ColumnMapping
  label: string
  modes: AmountMode[]
}> = [
  { key: 'date', label: 'Date', modes: ['single_signed', 'single_unsigned_expense', 'debit_credit'] },
  { key: 'amount', label: 'Amount', modes: ['single_signed', 'single_unsigned_expense'] },
  { key: 'debit', label: 'Debit', modes: ['debit_credit'] },
  { key: 'credit', label: 'Credit', modes: ['debit_credit'] },
  { key: 'merchant', label: 'Merchant', modes: ['single_signed', 'single_unsigned_expense', 'debit_credit'] },
  { key: 'category', label: 'Category', modes: ['single_signed', 'single_unsigned_expense', 'debit_credit'] },
  { key: 'notes', label: 'Notes', modes: ['single_signed', 'single_unsigned_expense', 'debit_credit'] },
]

/** Determine which mapping key each header column has been assigned to. */
function getMappingLabel(
  colIndex: number,
  mapping: ColumnMapping,
  amountMode: AmountMode
): string | null {
  for (const field of MAPPING_FIELDS) {
    if (!field.modes.includes(amountMode)) continue
    if (mapping[field.key] === colIndex) return field.label
  }
  return null
}

export function CsvPreview({
  headers,
  rows,
  detectedFormatName,
  columnMapping,
  amountMode,
  dateFormat,
  accountId,
  onMappingChange,
  onAmountModeChange,
  onDateFormatChange,
  onConfirm,
  onBack,
}: CsvPreviewProps) {
  const [transforming, setTransforming] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const previewRows = rows.slice(0, 10)

  const handleMappingFieldChange = useCallback(
    (field: keyof ColumnMapping, value: number) => {
      const updated = { ...columnMapping }
      if (value === -1) {
        delete updated[field]
      } else {
        updated[field] = value
      }
      onMappingChange(updated)
    },
    [columnMapping, onMappingChange]
  )

  const handleConfirm = useCallback(async () => {
    setTransforming(true)
    setErrorMessage(null)
    try {
      const result = await transformCsvRows(rows, {
        accountId,
        columnMapping,
        amountMode,
        dateFormat: dateFormat as 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'M/D/YYYY' | 'DD/MM/YYYY',
      })

      if (result.errors.length > 0 && result.rows.length === 0) {
        setErrorMessage(`All ${result.errors.length} rows had errors. Please check column mapping.`)
        setTransforming(false)
        return
      }

      onConfirm(result)
    } catch {
      setErrorMessage('Failed to transform CSV data.')
    } finally {
      setTransforming(false)
    }
  }, [rows, accountId, columnMapping, amountMode, dateFormat, onConfirm])

  return (
    <div className="space-y-4 pt-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Preview &mdash; {rows.length} rows
        </h2>
        {detectedFormatName ? (
          <span className="rounded-full bg-[var(--color-success)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--color-success)]">
            {detectedFormatName}
          </span>
        ) : (
          <span className="rounded-full bg-[var(--color-warning)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--color-warning)]">
            Manual mapping
          </span>
        )}
      </div>

      {/* Column mapping */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Column Mapping</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {MAPPING_FIELDS.filter((f) => f.modes.includes(amountMode)).map(
            (field) => (
              <div key={field.key} className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {field.label}
                </label>
                <select
                  value={columnMapping[field.key] ?? -1}
                  onChange={(e) =>
                    handleMappingFieldChange(field.key, parseInt(e.target.value, 10))
                  }
                  className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value={-1}>-- Not mapped --</option>
                  {headers.map((header, i) => (
                    <option key={i} value={i}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
            )
          )}
        </div>
      </div>

      {/* Amount mode */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Amount Interpretation</h3>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          {([
            { value: 'single_signed' as const, label: 'Single column (signed: negative=expense)' },
            { value: 'single_unsigned_expense' as const, label: 'Single column (all expenses, unsigned)' },
            { value: 'debit_credit' as const, label: 'Separate debit/credit columns' },
          ] as const).map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="amountMode"
                value={option.value}
                checked={amountMode === option.value}
                onChange={() => onAmountModeChange(option.value)}
                className="accent-primary"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      {/* Date format */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Date Format</h3>
        <select
          value={dateFormat}
          onChange={(e) => onDateFormatChange(e.target.value)}
          className="flex h-8 w-auto rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {DATE_FORMATS.map((fmt) => (
            <option key={fmt} value={fmt}>
              {fmt}
            </option>
          ))}
        </select>
      </div>

      {/* Preview table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {headers.map((header, i) => {
                const mappingLabel = getMappingLabel(i, columnMapping, amountMode)
                return (
                  <th key={i} className="px-3 py-2 text-left font-medium">
                    <div>{header}</div>
                    {mappingLabel && (
                      <span className="inline-block mt-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
                        {mappingLabel}
                      </span>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b last:border-b-0 hover:bg-muted/30">
                {row.map((cell, colIdx) => {
                  const isMappedAmount =
                    (amountMode !== 'debit_credit' && columnMapping.amount === colIdx) ||
                    (amountMode === 'debit_credit' &&
                      (columnMapping.debit === colIdx || columnMapping.credit === colIdx))

                  let amountColor = ''
                  if (isMappedAmount && cell.trim()) {
                    const numVal = parseFloat(cell.replace(/[$,]/g, ''))
                    if (!isNaN(numVal)) {
                      amountColor = numVal < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'
                      // For unsigned expense mode, all values are expenses (red)
                      if (amountMode === 'single_unsigned_expense') {
                        amountColor = 'text-[var(--color-danger)]'
                      }
                      // For debit column, always red
                      if (amountMode === 'debit_credit' && columnMapping.debit === colIdx) {
                        amountColor = 'text-[var(--color-danger)]'
                      }
                      // For credit column, always green
                      if (amountMode === 'debit_credit' && columnMapping.credit === colIdx) {
                        amountColor = 'text-[var(--color-success)]'
                      }
                    }
                  }

                  return (
                    <td key={colIdx} className={`px-3 py-1.5 ${amountColor}`}>
                      {cell}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > 10 && (
        <p className="text-xs text-muted-foreground">
          Showing first 10 of {rows.length} rows
        </p>
      )}

      {/* Error message */}
      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleConfirm} disabled={transforming}>
          {transforming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continue to Import
        </Button>
      </div>
    </div>
  )
}

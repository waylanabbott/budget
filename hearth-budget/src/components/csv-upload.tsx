'use client'

import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Upload, Loader2 } from 'lucide-react'
import Link from 'next/link'

import { parseCsvText, type CsvParseResult } from '@/lib/csv/parser'
import { detectBankFormat, buildMappingFromHeaders, type BankFormat } from '@/lib/csv/bank-formats'
import type { ColumnMapping, AmountMode } from '@/lib/schemas/csv-import'
import type { TransformResult } from '@/lib/csv/transform'

import { CsvPreview } from '@/components/csv-preview'
import { CsvDuplicateReview } from '@/components/csv-duplicate-review'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CsvUploadProps {
  accounts: Array<{ id: string; name: string }>
  categories: Array<{ id: string; name: string; parent_id: string | null }>
}

export function CsvUpload({ accounts, categories }: CsvUploadProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'duplicates' | 'importing' | 'done'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<CsvParseResult | null>(null)
  const [detectedFormat, setDetectedFormat] = useState<BankFormat | null>(null)
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({ date: 0 })
  const [amountMode, setAmountMode] = useState<AmountMode>('single_signed')
  const [dateFormat, setDateFormat] = useState<'MM/DD/YYYY' | 'YYYY-MM-DD' | 'M/D/YYYY' | 'DD/MM/YYYY'>('MM/DD/YYYY')
  const [transformedRows, setTransformedRows] = useState<TransformResult['rows']>([])
  const [transformErrors, setTransformErrors] = useState<TransformResult['errors']>([])
  const [importResult, setImportResult] = useState<{
    import_id: string
    imported_count: number
    skipped_count: number
    errors: Array<{ row: number; error: string }>
  } | null>(null)

  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (selectedFile: File) => {
      // Validate file type
      if (
        !selectedFile.name.toLowerCase().endsWith('.csv') &&
        selectedFile.type !== 'text/csv'
      ) {
        toast.error('Please select a CSV file.')
        return
      }

      // Validate account selected
      if (!selectedAccountId) {
        toast.error('Please select an account first.')
        return
      }

      setFile(selectedFile)

      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        if (!text) {
          toast.error('Failed to read file.')
          return
        }

        const parsed = parseCsvText(text)
        if (parsed.rows.length === 0) {
          toast.error('CSV file is empty or has no data rows.')
          return
        }

        setCsvData(parsed)

        const format = detectBankFormat(parsed.headers)
        setDetectedFormat(format)

        if (format) {
          setColumnMapping(format.mapping)
          setAmountMode(format.amountMode)
          setDateFormat(format.dateFormat)
          toast.success(`Detected: ${format.name}`)
        } else {
          const fallbackMapping = buildMappingFromHeaders(parsed.headers)
          setColumnMapping(fallbackMapping)
          toast.info('Unknown format -- please verify column mapping')
        }

        setStep('preview')
      }
      reader.onerror = () => {
        toast.error('Failed to read file.')
      }
      reader.readAsText(selectedFile, 'UTF-8')
    },
    [selectedAccountId]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) {
        handleFile(droppedFile)
      }
    },
    [handleFile]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        handleFile(selectedFile)
      }
    },
    [handleFile]
  )

  const handlePreviewConfirm = useCallback((result: TransformResult) => {
    setTransformedRows(result.rows)
    setTransformErrors(result.errors)
    setStep('duplicates')
  }, [])

  const handleImportComplete = useCallback(
    (result: {
      import_id: string
      imported_count: number
      skipped_count: number
      errors: Array<{ row: number; error: string }>
    }) => {
      setImportResult(result)
      setStep('done')
    },
    []
  )

  const resetAll = useCallback(() => {
    setStep('upload')
    setFile(null)
    setCsvData(null)
    setDetectedFormat(null)
    setColumnMapping({ date: 0 })
    setAmountMode('single_signed')
    setDateFormat('MM/DD/YYYY')
    setTransformedRows([])
    setTransformErrors([])
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Upload step
  if (step === 'upload') {
    return (
      <div className="space-y-4 pt-4">
        {/* Account selector */}
        <div className="space-y-2">
          <label htmlFor="account-select" className="text-sm font-medium">
            Select Account
          </label>
          <select
            id="account-select"
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">-- Select account --</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        {/* Drop zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-muted-foreground/25 hover:border-primary hover:bg-muted/50'
          }`}
        >
          <Upload className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Drag and drop a CSV file here</p>
            <p className="text-xs text-muted-foreground">or click to browse</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
    )
  }

  // Preview step
  if (step === 'preview' && csvData) {
    return (
      <CsvPreview
        headers={csvData.headers}
        rows={csvData.rows}
        detectedFormatName={detectedFormat?.name ?? null}
        columnMapping={columnMapping}
        amountMode={amountMode}
        dateFormat={dateFormat}
        accountId={selectedAccountId}
        onMappingChange={setColumnMapping}
        onAmountModeChange={setAmountMode}
        onDateFormatChange={(f) => setDateFormat(f as typeof dateFormat)}
        onConfirm={handlePreviewConfirm}
        onBack={() => {
          setStep('upload')
          setCsvData(null)
          setFile(null)
          setDetectedFormat(null)
        }}
      />
    )
  }

  // Duplicates step
  if (step === 'duplicates') {
    return (
      <CsvDuplicateReview
        rows={transformedRows}
        errors={transformErrors}
        accountId={selectedAccountId}
        filename={file?.name ?? 'import.csv'}
        categories={categories}
        onImportComplete={handleImportComplete}
        onBack={() => setStep('preview')}
      />
    )
  }

  // Done step
  if (step === 'done' && importResult) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Import Complete</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            <span className="font-semibold">{importResult.imported_count}</span> transactions
            imported from <span className="font-semibold">{file?.name}</span>
          </p>
          {importResult.skipped_count > 0 && (
            <p className="text-sm text-muted-foreground">
              {importResult.skipped_count} duplicates skipped
            </p>
          )}
          {importResult.errors.length > 0 && (
            <p className="text-sm text-destructive">
              {importResult.errors.length} rows had errors
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <Button onClick={resetAll} variant="outline">
              Import Another File
            </Button>
            <Link href="/app/transactions" className={buttonVariants({ variant: 'default' })}>
              View Transactions
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Fallback (shouldn't reach)
  return null
}

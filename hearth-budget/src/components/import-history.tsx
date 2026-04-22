'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { FileText } from 'lucide-react'

import { ImportDetailDialog } from '@/components/import-detail-dialog'

interface ImportHistoryProps {
  imports: Array<{
    id: string
    filename: string
    row_count: number
    status: string
    errors: unknown
    created_at: string
  }>
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    complete: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
    error: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
    pending: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
  }

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        colors[status] ?? 'bg-muted text-muted-foreground'
      }`}
    >
      {status}
    </span>
  )
}

export function ImportHistory({ imports: initialImports }: ImportHistoryProps) {
  const [imports, setImports] = useState(initialImports)
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null)

  const handleUndo = useCallback(
    (importId: string) => {
      const undone = imports.find((i) => i.id === importId)
      setImports((prev) => prev.filter((i) => i.id !== importId))
      setSelectedImportId(null)
      if (undone) {
        toast.success(`Import undone. ${undone.row_count} transactions removed.`)
      }
    },
    [imports]
  )

  if (imports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <FileText className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No imports yet. Upload a CSV file to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2 pt-4">
      {imports.map((imp) => (
        <button
          key={imp.id}
          onClick={() => setSelectedImportId(imp.id)}
          className="flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{imp.filename}</p>
            <p className="text-xs text-muted-foreground">
              {format(parseISO(imp.created_at), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {imp.row_count} transactions
            </span>
            <StatusBadge status={imp.status} />
          </div>
        </button>
      ))}

      {selectedImportId && (
        <ImportDetailDialog
          importId={selectedImportId}
          open={!!selectedImportId}
          onClose={() => setSelectedImportId(null)}
          onUndo={() => handleUndo(selectedImportId)}
        />
      )}
    </div>
  )
}

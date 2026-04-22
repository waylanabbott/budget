'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { Loader2 } from 'lucide-react'

import { getImportDetail, undoImport } from '@/app/actions/imports'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface ImportDetailDialogProps {
  importId: string
  open: boolean
  onClose: () => void
  onUndo: () => void
}

export function ImportDetailDialog({
  importId,
  open,
  onClose,
  onUndo,
}: ImportDetailDialogProps) {
  const [detail, setDetail] = useState<{
    import_row: {
      id: string
      filename: string
      row_count: number
      status: string
      errors: unknown
      created_at: string
    } | null
    transactions: Array<{
      id: string
      occurred_on: string
      amount: number
      merchant: string | null
      category_id: string | null
      categories: { name: string } | null
    }>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [undoing, setUndoing] = useState(false)
  const [confirmUndoOpen, setConfirmUndoOpen] = useState(false)

  useEffect(() => {
    if (!open || !importId) return

    let cancelled = false
    setLoading(true)

    async function load() {
      const result = await getImportDetail(importId)
      if (!cancelled) {
        if (result.error) {
          toast.error(result.error)
        }
        setDetail(result)
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [importId, open])

  const handleUndoConfirmed = async () => {
    setUndoing(true)
    const result = await undoImport(importId)
    setUndoing(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    onUndo()
  }

  return (
    <Sheet open={open} onOpenChange={(openState) => !openState && onClose()}>
      <SheetContent side="right">
        {loading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : detail?.import_row ? (
          <>
            <SheetHeader>
              <SheetTitle>{detail.import_row.filename}</SheetTitle>
              <SheetDescription>
                {format(parseISO(detail.import_row.created_at), 'MMM d, yyyy h:mm a')} &middot;{' '}
                {detail.import_row.row_count} transactions &middot;{' '}
                <span
                  className={
                    detail.import_row.status === 'complete'
                      ? 'text-[var(--color-success)]'
                      : detail.import_row.status === 'error'
                        ? 'text-[var(--color-danger)]'
                        : ''
                  }
                >
                  {detail.import_row.status}
                </span>
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-4">
              {detail.transactions.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">
                  No transactions found for this import.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-1 py-1.5 text-left text-xs font-medium">Date</th>
                      <th className="px-1 py-1.5 text-right text-xs font-medium">Amount</th>
                      <th className="px-1 py-1.5 text-left text-xs font-medium">Merchant</th>
                      <th className="px-1 py-1.5 text-left text-xs font-medium">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.transactions.map((txn) => (
                      <tr key={txn.id} className="border-b last:border-b-0">
                        <td className="px-1 py-1 text-xs">{txn.occurred_on}</td>
                        <td
                          className={`px-1 py-1 text-right text-xs font-mono ${
                            txn.amount < 0
                              ? 'text-[var(--color-danger)]'
                              : 'text-[var(--color-success)]'
                          }`}
                        >
                          ${Math.abs(txn.amount).toFixed(2)}
                        </td>
                        <td className="px-1 py-1 text-xs">{txn.merchant ?? '-'}</td>
                        <td className="px-1 py-1 text-xs">
                          {txn.categories?.name ?? 'Uncategorized'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <SheetFooter>
              <Button
                variant="destructive"
                onClick={() => setConfirmUndoOpen(true)}
                disabled={undoing}
                className="w-full"
              >
                {undoing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Undo this Import
              </Button>
            </SheetFooter>

            <ConfirmDialog
              open={confirmUndoOpen}
              onOpenChange={setConfirmUndoOpen}
              title="Undo this import?"
              description={`This will delete all ${detail.import_row.row_count} transactions from this import.`}
              confirmLabel="Delete transactions"
              variant="destructive"
              onConfirm={handleUndoConfirmed}
            />
          </>
        ) : (
          <div className="p-4">
            <p className="text-sm text-muted-foreground">Import not found.</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

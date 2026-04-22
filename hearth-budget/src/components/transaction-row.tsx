'use client'

import { useRef, useState, useCallback } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { deleteTransaction } from '@/app/actions/transactions'
import type { Database } from '@/types/database'

export type TransactionWithRelations = Database['public']['Tables']['transactions']['Row'] & {
  categories: { name: string; icon: string | null; color: string | null; is_income: boolean } | null
  accounts: { name: string } | null
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

interface TransactionRowProps {
  transaction: TransactionWithRelations
  onEdit: (tx: TransactionWithRelations) => void
  memberMap: Record<string, string>
}

export function TransactionRow({ transaction, onEdit, memberMap }: TransactionRowProps) {
  const touchStartX = useRef(0)
  const [translateX, setTranslateX] = useState(0)
  const [swiped, setSwiped] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const isIncome = transaction.categories?.is_income ?? false
  const formattedAmount = currencyFormatter.format(transaction.amount)
  const displayAmount = isIncome ? `+${formattedAmount}` : formattedAmount
  const categoryColor = transaction.categories?.color ?? '#94a3b8' // slate-400 fallback

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? 0
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaX = (e.touches[0]?.clientX ?? 0) - touchStartX.current
    if (deltaX < 0) {
      setTranslateX(Math.max(deltaX, -140))
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (translateX < -60) {
      setTranslateX(-140)
      setSwiped(true)
    } else {
      setTranslateX(0)
      setSwiped(false)
    }
  }, [translateX])

  const handleDeleteConfirmed = useCallback(async () => {
    setDeleting(true)
    const result = await deleteTransaction(transaction.id)
    if (result.error) {
      setDeleting(false)
      toast.error(result.error)
    }
    // On success, revalidation will remove from list
  }, [transaction.id])

  const resetSwipe = useCallback(() => {
    setTranslateX(0)
    setSwiped(false)
  }, [])

  return (
    <div className="relative overflow-hidden border-b">
      {/* Swipe action buttons (revealed behind the row) */}
      <div className="absolute inset-y-0 right-0 flex items-stretch">
        <button
          type="button"
          className="flex w-[70px] items-center justify-center bg-[var(--color-info)] text-white"
          onClick={() => {
            resetSwipe()
            onEdit(transaction)
          }}
          aria-label="Edit transaction"
        >
          <Pencil className="size-5" />
        </button>
        <button
          type="button"
          className="flex w-[70px] items-center justify-center bg-[var(--color-danger)] text-white"
          onClick={() => setConfirmDeleteOpen(true)}
          disabled={deleting}
          aria-label="Delete transaction"
        >
          <Trash2 className="size-5" />
        </button>
      </div>

      {/* Main row content */}
      <div
        className="group relative z-10 flex items-center justify-between bg-background py-3 px-4 transition-transform duration-200"
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={swiped ? resetSwipe : undefined}
      >
        {/* Left side: avatar + category dot + merchant + category name */}
        <div className="flex items-center gap-3 min-w-0">
          <Avatar size="sm" className="shrink-0">
            <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
              {memberMap[transaction.entered_by] ?? '?'}
            </AvatarFallback>
          </Avatar>
          <span
            className="shrink-0 size-2.5 rounded-full"
            style={{ backgroundColor: categoryColor }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="font-medium truncate">
              {transaction.merchant || 'Uncategorized'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {transaction.categories?.name ?? 'No category'}
            </p>
          </div>
        </div>

        {/* Right side: amount + account name + desktop actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <p className={isIncome ? 'font-medium text-[var(--color-success)]' : 'font-medium'}>
              {displayAmount}
            </p>
            <p className="text-xs text-muted-foreground">
              {transaction.accounts?.name ?? 'Unknown'}
            </p>
          </div>

          {/* Desktop hover actions */}
          <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onEdit(transaction)}
              aria-label="Edit transaction"
            >
              <Pencil />
            </Button>
            <Button
              variant="destructive"
              size="icon-xs"
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={deleting}
              aria-label="Delete transaction"
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete transaction?"
        description="This will permanently remove this transaction."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  )
}

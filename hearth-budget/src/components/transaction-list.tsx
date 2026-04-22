'use client'

import { useState, useEffect, useRef, useCallback, useTransition } from 'react'
import { format, parseISO } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getTransactions, updateTransaction } from '@/app/actions/transactions'
import { TransactionRow, type TransactionWithRelations } from '@/components/transaction-row'
import { TransactionFilters, type FilterState, EMPTY_FILTERS } from '@/components/transaction-filters'
import { useRealtimeTransactions } from '@/hooks/use-realtime-transactions'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

type AccountRow = {
  id: string
  household_id: string
  name: string
  type: string
  starting_balance: number
  is_archived: boolean
  created_at: string
}

type CategoryRow = {
  id: string
  household_id: string
  name: string
  parent_id: string | null
  icon: string | null
  color: string | null
  is_income: boolean
  sort_order: number
  archived_at: string | null
}

type MemberInfo = {
  user_id: string
  label: string
}

interface TransactionListProps {
  initialTransactions: TransactionWithRelations[]
  initialCursor: string | null
  accounts: AccountRow[]
  categories: CategoryRow[]
  memberMap: Record<string, string>
  members: MemberInfo[]
  householdId: string
}

function groupByDate(transactions: TransactionWithRelations[]) {
  const groups: Map<string, TransactionWithRelations[]> = new Map()
  for (const tx of transactions) {
    const date = tx.occurred_on
    const existing = groups.get(date)
    if (existing) {
      existing.push(tx)
    } else {
      groups.set(date, [tx])
    }
  }
  return groups
}

export function TransactionList({
  initialTransactions,
  initialCursor,
  accounts,
  categories,
  memberMap,
  members,
  householdId,
}: TransactionListProps) {
  const [transactions, setTransactions] = useState(initialTransactions)
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [hasMore, setHasMore] = useState(!!initialCursor)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [editTransaction, setEditTransaction] = useState<TransactionWithRelations | null>(null)
  const [isPending, startTransition] = useTransition()

  const sentinelRef = useRef<HTMLDivElement>(null)
  const filtersKey = useRef('')

  // Realtime: refetch current view when partner inserts/updates a transaction
  const refetchTransactions = useCallback(async () => {
    const result = await getTransactions({
      limit: 20,
      search: filters.search || undefined,
      account_id: filters.account_id || undefined,
      category_id: filters.category_id || undefined,
      entered_by: filters.entered_by || undefined,
      date_from: filters.date_from || undefined,
      date_to: filters.date_to || undefined,
    })
    if (result.error) {
      toast.error(result.error)
      return
    }
    setTransactions(result.data ?? [])
    setCursor(result.nextCursor ?? null)
    setHasMore(!!result.nextCursor)
  }, [filters])

  // Realtime: remove deleted transaction from local state immediately
  const handleRealtimeDelete = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id))
  }, [])

  // Subscribe to Realtime INSERT/UPDATE/DELETE events for the household
  const { status: realtimeStatus } = useRealtimeTransactions({
    householdId,
    onInsert: () => {}, // refetch handles this via onRefetch
    onUpdate: () => {}, // refetch handles this via onRefetch
    onDelete: handleRealtimeDelete,
    onRefetch: refetchTransactions,
  })

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    const result = await getTransactions({
      cursor: cursor ?? undefined,
      limit: 20,
      search: filters.search || undefined,
      account_id: filters.account_id || undefined,
      category_id: filters.category_id || undefined,
      entered_by: filters.entered_by || undefined,
      date_from: filters.date_from || undefined,
      date_to: filters.date_to || undefined,
    })
    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }
    setTransactions((prev) => {
      const existingIds = new Set(prev.map((tx) => tx.id))
      const newTxs = (result.data ?? []).filter((tx) => !existingIds.has(tx.id))
      return [...prev, ...newTxs]
    })
    setCursor(result.nextCursor ?? null)
    setHasMore(!!result.nextCursor)
    setLoading(false)
  }, [loading, hasMore, cursor, filters])

  // Set up IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  // When filters change, reset and refetch
  const handleFiltersChange = useCallback(
    (newFilters: FilterState) => {
      const newKey = JSON.stringify(newFilters)
      if (newKey === filtersKey.current) return
      filtersKey.current = newKey

      setFilters(newFilters)
      setTransactions([])
      setCursor(null)
      setHasMore(true)

      startTransition(async () => {
        const result = await getTransactions({
          limit: 20,
          search: newFilters.search || undefined,
          account_id: newFilters.account_id || undefined,
          category_id: newFilters.category_id || undefined,
          entered_by: newFilters.entered_by || undefined,
          date_from: newFilters.date_from || undefined,
          date_to: newFilters.date_to || undefined,
        })
        if (result.error) {
          toast.error(result.error)
          return
        }
        setTransactions(result.data ?? [])
        setCursor(result.nextCursor ?? null)
        setHasMore(!!result.nextCursor)
      })
    },
    []
  )

  // Handle edit - open sheet
  const handleEdit = useCallback((tx: TransactionWithRelations) => {
    setEditTransaction(tx)
  }, [])

  // Refresh list after an edit
  const refreshList = useCallback(async () => {
    const result = await getTransactions({
      limit: 20,
      search: filters.search || undefined,
      account_id: filters.account_id || undefined,
      category_id: filters.category_id || undefined,
      entered_by: filters.entered_by || undefined,
      date_from: filters.date_from || undefined,
      date_to: filters.date_to || undefined,
    })
    if (result.error) {
      toast.error(result.error)
      return
    }
    setTransactions(result.data ?? [])
    setCursor(result.nextCursor ?? null)
    setHasMore(!!result.nextCursor)
  }, [filters])

  const dateGroups = groupByDate(transactions)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <TransactionFilters
          accounts={accounts}
          categories={categories}
          members={members}
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
        {realtimeStatus === 'connected' && (
          <span
            className="inline-block size-2 rounded-full bg-[var(--color-success)] shrink-0"
            title="Live sync active"
          />
        )}
        {realtimeStatus === 'disconnected' && (
          <span
            className="inline-block size-2 rounded-full bg-[var(--color-warning)] shrink-0"
            title="Live sync unavailable -- refreshes on tab focus"
          />
        )}
      </div>

      <div className="rounded-lg border bg-card">
        {transactions.length === 0 && !loading && !isPending ? (
          <div className="py-12 text-center text-muted-foreground">
            <p>No transactions found.</p>
            <p className="text-sm mt-1">Tap the + button to add your first transaction.</p>
          </div>
        ) : (
          <>
            {Array.from(dateGroups.entries()).map(([date, txs]) => (
              <div key={date}>
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 py-2 text-sm font-semibold text-muted-foreground border-b">
                  {format(parseISO(date), 'EEEE, MMM d, yyyy')}
                </div>
                {txs.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    transaction={tx}
                    onEdit={handleEdit}
                    memberMap={memberMap}
                  />
                ))}
              </div>
            ))}
          </>
        )}

        {/* Loading skeleton */}
        {(loading || isPending) && (
          <div className="space-y-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 px-4 border-b animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="size-2.5 rounded-full bg-muted" />
                  <div>
                    <div className="h-4 w-24 rounded bg-muted mb-1" />
                    <div className="h-3 w-16 rounded bg-muted" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 w-16 rounded bg-muted mb-1" />
                  <div className="h-3 w-12 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-1" />
      </div>

      {/* Edit transaction sheet */}
      {editTransaction && (
        <EditTransactionSheet
          transaction={editTransaction}
          accounts={accounts}
          categories={categories}
          onClose={() => setEditTransaction(null)}
          onSaved={() => {
            setEditTransaction(null)
            refreshList()
          }}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Inline edit form (uses updateTransaction server action)           */
/* ------------------------------------------------------------------ */

function EditTransactionSheet({
  transaction,
  accounts,
  categories,
  onClose,
  onSaved,
}: {
  transaction: TransactionWithRelations
  accounts: AccountRow[]
  categories: CategoryRow[]
  onClose: () => void
  onSaved: () => void
}) {
  const [amountStr, setAmountStr] = useState(String(transaction.amount))
  const [accountId, setAccountId] = useState(transaction.account_id)
  const [categoryId, setCategoryId] = useState(transaction.category_id ?? '')
  const [occurredOn, setOccurredOn] = useState(transaction.occurred_on)
  const [merchant, setMerchant] = useState(transaction.merchant ?? '')
  const [notes, setNotes] = useState(transaction.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeAccounts = accounts.filter((a) => !a.is_archived)
  const activeCategories = categories.filter((c) => !c.archived_at)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const amount = parseFloat(amountStr)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount.')
      setSaving(false)
      return
    }

    const result = await updateTransaction(transaction.id, {
      amount,
      account_id: accountId,
      category_id: categoryId || null,
      occurred_on: occurredOn,
      merchant: merchant || null,
      notes: notes || null,
    })

    if (result.error) {
      setError(result.error)
      setSaving(false)
    } else {
      onSaved()
    }
  }

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl">
        <SheetHeader>
          <SheetTitle>Edit Transaction</SheetTitle>
          <SheetDescription>
            Update the details for this transaction.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSave} className="space-y-3 px-4 pb-4">
          {/* Amount */}
          <div className="space-y-1">
            <Label htmlFor="edit-amount" className="text-xs text-muted-foreground">
              Amount
            </Label>
            <Input
              id="edit-amount"
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.]?[0-9]{0,2}"
              value={amountStr}
              onChange={(e) => {
                const val = e.target.value
                if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                  setAmountStr(val)
                }
              }}
              className="h-12 text-center text-xl font-bold"
            />
          </div>

          {/* Account */}
          <div className="space-y-1">
            <Label htmlFor="edit-account" className="text-xs text-muted-foreground">
              Account
            </Label>
            <select
              id="edit-account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {activeAccounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <Label htmlFor="edit-category" className="text-xs text-muted-foreground">
              Category
            </Label>
            <select
              id="edit-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">No category</option>
              {activeCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="space-y-1">
            <Label htmlFor="edit-date" className="text-xs text-muted-foreground">
              Date
            </Label>
            <Input
              id="edit-date"
              type="date"
              value={occurredOn}
              onChange={(e) => setOccurredOn(e.target.value)}
            />
          </div>

          {/* Merchant */}
          <div className="space-y-1">
            <Label htmlFor="edit-merchant" className="text-xs text-muted-foreground">
              Merchant
            </Label>
            <Input
              id="edit-merchant"
              placeholder="Merchant name"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label htmlFor="edit-notes" className="text-xs text-muted-foreground">
              Notes
            </Label>
            <Input
              id="edit-notes"
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}

          {/* Save */}
          <Button type="submit" className="w-full" size="lg" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Update Transaction'
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, CalendarClock, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  createRecurringBill,
  updateRecurringBill,
  deleteRecurringBill,
  type RecurringBillRow,
  type RecurringBillInput,
} from '@/app/actions/recurring-bills'
import {
  getBlsBenchmarkForCategory,
  QUINTILE_BOUNDS,
  type QuintileKey,
} from '@/lib/benchmarks/bls-cex-2024'
import { cn } from '@/lib/utils'

const CADENCE_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  yearly: 'Yearly',
}

const fmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

type AccountOption = { id: string; name: string }
type CategoryOption = { id: string; name: string }

const CATEGORY_TO_BLS: Record<string, string> = {
  'Gas': 'Transportation',
  'Car Insurance': 'Transportation',
  'Subscriptions': 'Entertainment',
  'Gym': 'Personal Care',
  'Parking': 'Transportation',
  'Car Wash': 'Transportation',
  'Food': 'Groceries',
}

function getPersonFromName(name: string): string {
  const match = name.match(/\(([^)]+)\)\s*$/)
  return match?.[1] ?? 'Shared'
}

function billToMonthly(bill: RecurringBillRow): number {
  const amt = Math.abs(bill.amount)
  if (bill.cadence === 'weekly') return amt * 4.33
  if (bill.cadence === 'biweekly') return amt * 2.17
  if (bill.cadence === 'yearly') return amt / 12
  return amt
}

interface CategoryGroup {
  category: string
  bills: RecurringBillRow[]
  monthlyTotal: number
  byPerson: { name: string; total: number }[]
  blsBenchmark: { monthlyAvg: number; blsName: string } | null
  blsCategory: string
  diffPercent: number | null
}

function buildCategoryGroups(
  bills: RecurringBillRow[],
  quintile: QuintileKey
): CategoryGroup[] {
  const groups = new Map<string, RecurringBillRow[]>()
  for (const bill of bills) {
    const key = bill.category_name ?? 'Other'
    const group = groups.get(key)
    if (group) group.push(bill)
    else groups.set(key, [bill])
  }

  // When multiple user categories map to the same BLS category (e.g. Car Insurance
  // + Car Wash both → Transportation), sum user spending before comparing
  const userSpendByBlsCategory = new Map<string, number>()
  for (const [cat, catBills] of groups.entries()) {
    if (cat === 'Savings Transfers') continue
    const blsCat = CATEGORY_TO_BLS[cat] ?? cat
    const catMonthly = catBills.reduce((s, b) => s + billToMonthly(b), 0)
    userSpendByBlsCategory.set(blsCat, (userSpendByBlsCategory.get(blsCat) ?? 0) + catMonthly)
  }

  return Array.from(groups.entries())
    .filter(([cat]) => cat !== 'Savings Transfers')
    .map(([category, categoryBills]) => {
      const monthlyTotal = categoryBills.reduce((s, b) => s + billToMonthly(b), 0)

      const personMap = new Map<string, number>()
      for (const bill of categoryBills) {
        const person = getPersonFromName(bill.name)
        personMap.set(person, (personMap.get(person) ?? 0) + billToMonthly(bill))
      }
      const byPerson = Array.from(personMap.entries())
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)

      const blsCategory = CATEGORY_TO_BLS[category] ?? category
      const benchmark = getBlsBenchmarkForCategory(blsCategory, quintile)

      // Compare combined user spending for this BLS category, not just this one sub-category
      const combinedUserSpend = userSpendByBlsCategory.get(blsCategory) ?? monthlyTotal
      const diffPercent =
        benchmark && benchmark.monthlyAvg > 0
          ? Math.round(((combinedUserSpend - benchmark.monthlyAvg) / benchmark.monthlyAvg) * 100)
          : null

      return {
        category,
        bills: categoryBills.sort((a, b) => b.amount - a.amount),
        monthlyTotal,
        byPerson,
        blsBenchmark: benchmark,
        blsCategory,
        diffPercent,
      }
    })
    .sort((a, b) => b.monthlyTotal - a.monthlyTotal)
}

function DiffBadge({ percent }: { percent: number | null }) {
  if (percent === null) return null
  const isOver = percent > 0
  const isUnder = percent < -10
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
        isOver && 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
        isUnder && 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
        !isOver && !isUnder && 'bg-muted text-muted-foreground'
      )}
    >
      {isOver ? <TrendingUp className="h-3 w-3" /> : isUnder ? <TrendingDown className="h-3 w-3" /> : null}
      {isOver ? '+' : ''}
      {percent}%
    </span>
  )
}

interface Props {
  bills: RecurringBillRow[]
  accounts: AccountOption[]
  categories: CategoryOption[]
  quintile: QuintileKey
}

export function RecurringBillList({ bills, accounts, categories, quintile }: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingBill, setEditingBill] = useState<RecurringBillRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RecurringBillRow | null>(null)
  const [isPending, startTransition] = useTransition()

  const nonSavingsBills = bills.filter(b => b.category_name !== 'Savings Transfers')
  const savingsBills = bills.filter(b => b.category_name === 'Savings Transfers')

  const monthlyTotal = nonSavingsBills.reduce((sum, b) => sum + billToMonthly(b), 0)
  const savingsTotal = savingsBills.reduce((sum, b) => sum + billToMonthly(b), 0)

  const groups = buildCategoryGroups(bills, quintile)

  // Deduplicate: if Car Insurance + Car Wash both map to Transportation,
  // only count Transportation's benchmark once in the total
  const totalExp = (() => {
    const seen = new Set<string>()
    let sum = 0
    for (const g of groups) {
      if (g.blsBenchmark && !seen.has(g.blsCategory)) {
        seen.add(g.blsCategory)
        sum += g.blsBenchmark.monthlyAvg
      }
    }
    return sum
  })()

  const allPeople = new Map<string, number>()
  for (const bill of nonSavingsBills) {
    const person = getPersonFromName(bill.name)
    allPeople.set(person, (allPeople.get(person) ?? 0) + billToMonthly(bill))
  }
  const peopleSorted = Array.from(allPeople.entries()).sort(([, a], [, b]) => b - a)

  const bounds = QUINTILE_BOUNDS[quintile]

  function handleEdit(bill: RecurringBillRow) {
    setEditingBill(bill)
    setFormOpen(true)
  }

  function handleNew() {
    setEditingBill(null)
    setFormOpen(true)
  }

  function handleDeleteConfirmed() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteRecurringBill(deleteTarget.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`"${deleteTarget.name}" deleted`)
        setDeleteTarget(null)
      }
    })
  }

  return (
    <div className="space-y-4 pb-28">
      {/* Summary */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Your Household</p>
              <p className="text-2xl font-bold tabular-nums">{fmt.format(monthlyTotal)}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              <div className="mt-2 space-y-0.5">
                {peopleSorted.map(([person, total]) => (
                  <div key={person} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{person}</span>
                    <span className="tabular-nums font-medium">{fmt.format(total)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">National Avg ({bounds.label})</p>
              <p className="text-2xl font-bold tabular-nums text-muted-foreground">{totalExp > 0 ? fmt.format(totalExp) : '—'}<span className="text-sm font-normal">/mo</span></p>
              <p className="text-xs text-muted-foreground mt-2">
                BLS Consumer Expenditure Survey 2024 — comparable categories only
              </p>
            </div>
          </div>
          {savingsTotal > 0 && (
            <div className="mt-3 pt-3 border-t flex justify-between text-sm">
              <span className="text-muted-foreground">+ Savings transfers</span>
              <span className="tabular-nums font-medium">{fmt.format(savingsTotal)}/mo</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">By Category</p>
        <Button onClick={handleNew} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Add bill
        </Button>
      </div>

      {bills.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarClock className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-1">No recurring bills yet</p>
            <p className="text-xs text-muted-foreground">
              Add your rent, subscriptions, and other recurring expenses.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {groups.map(({ category, bills: groupBills, monthlyTotal: catTotal, byPerson, blsBenchmark, blsCategory, diffPercent }) => (
            <Card key={category}>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">{category}</CardTitle>
                  <DiffBadge percent={diffPercent} />
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="font-medium text-foreground tabular-nums">{fmt.format(catTotal)}/mo</span>
                  {blsBenchmark ? (
                    <span>
                      vs {fmt.format(blsBenchmark.monthlyAvg)}/mo avg
                      {blsCategory !== category && ` (${blsBenchmark.blsName})`}
                    </span>
                  ) : (
                    <span>No national benchmark</span>
                  )}
                </div>
                {byPerson.length > 1 && (
                  <div className="flex gap-3 mt-1.5">
                    {byPerson.map(({ name, total }) => (
                      <span key={name} className="text-xs text-muted-foreground">
                        {name}: <span className="tabular-nums font-medium text-foreground">{fmt.format(total)}</span>
                      </span>
                    ))}
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-0 divide-y">
                {groupBills.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{bill.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{CADENCE_LABELS[bill.cadence] ?? bill.cadence}</span>
                        {bill.next_due_date && (
                          <>
                            <span>·</span>
                            <span>Next: {format(parseISO(bill.next_due_date), 'MMM d')}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold tabular-nums text-sm">
                        {fmt.format(bill.amount)}
                      </span>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(bill)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive"
                        onClick={() => setDeleteTarget(bill)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </>
      )}

      <BillFormSheet
        bill={editingBill}
        open={formOpen}
        onOpenChange={setFormOpen}
        accounts={accounts}
        categories={categories}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This recurring bill will be removed from your cash flow forecast."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  )
}

function BillFormSheet({
  bill,
  open,
  onOpenChange,
  accounts,
  categories,
}: {
  bill: RecurringBillRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: AccountOption[]
  categories: CategoryOption[]
}) {
  const isEdit = !!bill
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [cadence, setCadence] = useState('monthly')
  const [nextDueDate, setNextDueDate] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [error, setError] = useState<string | null>(null)

  function resetForm() {
    setName(bill?.name ?? '')
    setAmount(bill ? String(bill.amount) : '')
    setCadence(bill?.cadence ?? 'monthly')
    setNextDueDate(bill?.next_due_date ?? '')
    setCategoryId(bill?.category_id ?? '')
    setAccountId(bill?.account_id ?? '')
    setError(null)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) resetForm()
    onOpenChange(nextOpen)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsedAmount = parseFloat(amount)
    if (!name.trim()) { setError('Name is required.'); return }
    if (isNaN(parsedAmount) || parsedAmount <= 0) { setError('Enter a valid amount.'); return }

    const input: RecurringBillInput = {
      name: name.trim(),
      amount: parsedAmount,
      cadence,
      next_due_date: nextDueDate || null,
      category_id: categoryId || null,
      account_id: accountId || null,
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateRecurringBill(bill.id, input)
        : await createRecurringBill(input)

      if (result.error) {
        setError(result.error)
      } else {
        toast.success(isEdit ? 'Bill updated' : 'Bill added')
        onOpenChange(false)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Bill' : 'Add Recurring Bill'}</SheetTitle>
          <SheetDescription>
            Recurring bills improve your cash flow forecast accuracy.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4">
          <div className="space-y-1">
            <Label htmlFor="bill-name">Name</Label>
            <Input
              id="bill-name"
              placeholder='e.g. Rent (Waylan)'
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Add (Name) at the end to attribute to a person
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="bill-amount">Amount</Label>
            <Input
              id="bill-amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="bill-cadence">Frequency</Label>
            <select
              id="bill-cadence"
              value={cadence}
              onChange={(e) => setCadence(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="weekly">Weekly</option>
              <option value="biweekly">Every 2 weeks</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="bill-due">Next due date</Label>
            <Input
              id="bill-due"
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="bill-category">Category</Label>
            <select
              id="bill-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="bill-account">Account</Label>
            <select
              id="bill-account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">None</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <SheetFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : isEdit ? 'Update Bill' : 'Add Bill'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

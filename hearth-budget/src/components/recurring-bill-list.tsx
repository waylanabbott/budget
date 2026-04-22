'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, CalendarClock, ChevronDown } from 'lucide-react'
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

const CADENCE_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  yearly: 'Yearly',
}

const formatCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

type AccountOption = { id: string; name: string }
type CategoryOption = { id: string; name: string }

function groupBillsByCategory(bills: RecurringBillRow[]) {
  const groups = new Map<string, RecurringBillRow[]>()
  for (const bill of bills) {
    const key = bill.category_name ?? 'Other'
    const group = groups.get(key)
    if (group) {
      group.push(bill)
    } else {
      groups.set(key, [bill])
    }
  }
  return Array.from(groups.entries())
    .sort(([, a], [, b]) => {
      const totalA = a.reduce((s, bill) => s + bill.amount, 0)
      const totalB = b.reduce((s, bill) => s + bill.amount, 0)
      return totalB - totalA
    })
    .map(([category, bills]) => ({
      category,
      bills: bills.sort((a, b) => a.name.localeCompare(b.name)),
    }))
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

function TotalBreakdown({ bills, monthlyTotal }: { bills: RecurringBillRow[]; monthlyTotal: number }) {
  const [expanded, setExpanded] = useState(false)

  const byPerson = new Map<string, number>()
  for (const bill of bills) {
    const person = getPersonFromName(bill.name)
    byPerson.set(person, (byPerson.get(person) ?? 0) + billToMonthly(bill))
  }
  const people = Array.from(byPerson.entries()).sort(([, a], [, b]) => b - a)

  return (
    <div className="pb-24 mb-24 rounded-xl border bg-muted/40 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <span className="text-sm font-medium text-muted-foreground">Total monthly expenses</span>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold tabular-nums">
            {formatCurrency.format(monthlyTotal)}/mo
          </span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {expanded && (
        <div className="border-t px-4 py-2 space-y-2">
          {people.map(([person, total]) => (
            <div key={person} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{person}</span>
              <span className="text-sm font-medium tabular-nums">{formatCurrency.format(total)}/mo</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface Props {
  bills: RecurringBillRow[]
  accounts: AccountOption[]
  categories: CategoryOption[]
}

export function RecurringBillList({ bills, accounts, categories }: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingBill, setEditingBill] = useState<RecurringBillRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RecurringBillRow | null>(null)
  const [isPending, startTransition] = useTransition()

  const monthlyTotal = bills.reduce((sum, b) => {
    const amt = Math.abs(b.amount)
    if (b.cadence === 'weekly') return sum + amt * 4.33
    if (b.cadence === 'biweekly') return sum + amt * 2.17
    if (b.cadence === 'yearly') return sum + amt / 12
    return sum + amt
  }, 0)

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            ~{formatCurrency.format(monthlyTotal)}/mo in recurring expenses
          </p>
        </div>
        <Button onClick={handleNew} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Add bill
        </Button>
      </div>

      {bills.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarClock className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-1">
              No recurring bills yet
            </p>
            <p className="text-xs text-muted-foreground">
              Add your rent, subscriptions, and other recurring expenses to improve cash flow forecasts.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {groupBillsByCategory(bills).map(({ category, bills: groupBills }) => (
            <Card key={category}>
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {category}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y">
                {groupBills.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between px-4 py-3">
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
                        {formatCurrency.format(bill.amount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleEdit(bill)}
                      >
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

          <TotalBreakdown bills={bills} monthlyTotal={monthlyTotal} />
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
              placeholder="e.g. Rent, Netflix"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
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

'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Copy, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { calcBudgetPace, type BudgetPace } from '@/lib/budget-math'
import {
  upsertBudget,
  deleteBudget,
  copyLastMonthBudgets,
  type BudgetWithSpent,
} from '@/app/actions/budgets'

interface BudgetListProps {
  budgets: BudgetWithSpent[]
  month: string
  unbudgetedCategories: Array<{ id: string; name: string; icon: string | null; color: string | null }>
  memberNames: Record<string, string>
  currentUserId: string
}

function PaceBadge({ pace }: { pace: BudgetPace }) {
  if (pace.cap === 0) return null
  const label =
    pace.status === 'over'
      ? 'Over pace'
      : pace.status === 'under'
        ? 'Under pace'
        : 'On track'
  const variant =
    pace.status === 'over'
      ? 'text-destructive bg-destructive/10 border-destructive/30'
      : pace.status === 'under'
        ? 'text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/30'
        : 'text-muted-foreground bg-muted'
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${variant}`}>
      {label}
    </span>
  )
}

function BudgetRow({
  budget,
  month,
  memberNames,
  currentUserId,
}: {
  budget: BudgetWithSpent
  month: string
  memberNames: Record<string, string>
  currentUserId: string
}) {
  const [editing, setEditing] = useState(false)
  const [editAmount, setEditAmount] = useState(budget.amount.toString())
  const [isPending, startTransition] = useTransition()

  const pace = calcBudgetPace(budget.spent, budget.amount, new Date())
  const progress = budget.amount > 0
    ? Math.min(100, Math.round((budget.spent / budget.amount) * 100))
    : 0
  const remaining = budget.amount - budget.spent

  const handleSave = () => {
    const amount = parseFloat(editAmount)
    if (isNaN(amount) || amount < 0) {
      toast.error('Enter a valid amount.')
      return
    }
    startTransition(async () => {
      const result = await upsertBudget({
        category_id: budget.category_id,
        amount,
        month,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        setEditing(false)
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteBudget(budget.id)
      if (result.error) toast.error(result.error)
    })
  }

  const progressColor =
    pace.status === 'over'
      ? '[&>div]:bg-destructive'
      : pace.status === 'under'
        ? '[&>div]:bg-[var(--success)]'
        : ''

  return (
    <div className="flex flex-col gap-2 px-4 py-3 border-b last:border-b-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium text-sm truncate">{budget.category_name}</span>
          <PaceBadge pace={pace} />
        </div>
        <div className="flex items-center gap-1">
          {editing ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="h-7 w-24 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={handleSave} disabled={isPending}>
                Save
              </Button>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <button
              onClick={() => { setEditAmount(budget.amount.toString()); setEditing(true) }}
              className="text-sm tabular-nums text-muted-foreground hover:text-foreground"
            >
              ${budget.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </button>
          )}
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" disabled={isPending} />}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove budget?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the {budget.category_name} budget cap for this month. Your transactions are not affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Remove</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Progress value={progress} className={`h-1.5 flex-1 ${progressColor}`} />
        <span className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
          ${budget.spent.toLocaleString(undefined, { maximumFractionDigits: 0 })} spent
        </span>
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{progress}% used</span>
        <span className={remaining < 0 ? 'text-destructive font-medium' : ''}>
          {remaining >= 0
            ? `$${remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })} left`
            : `$${Math.abs(remaining).toLocaleString(undefined, { maximumFractionDigits: 0 })} over`}
        </span>
      </div>

      {Object.keys(memberNames).length > 1 && Object.keys(budget.spentByPerson).length > 0 && (
        <div className="flex gap-3 text-[11px] text-muted-foreground">
          {Object.entries(budget.spentByPerson)
            .sort((a, b) => b[1] - a[1])
            .map(([userId, amount]) => (
              <span key={userId} className="tabular-nums">
                {userId === currentUserId ? 'You' : memberNames[userId] ?? 'Partner'}:{' '}
                ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            ))}
        </div>
      )}
    </div>
  )
}

export function BudgetList({ budgets, month, unbudgetedCategories, memberNames, currentUserId }: BudgetListProps) {
  const [isPending, startTransition] = useTransition()
  const [addingCategory, setAddingCategory] = useState('')
  const [addingAmount, setAddingAmount] = useState('')

  const totalCaps = budgets.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
  const totalRemaining = totalCaps - totalSpent

  const handleCopyLastMonth = () => {
    startTransition(async () => {
      const result = await copyLastMonthBudgets(month)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Copied ${result.copied} budget${result.copied === 1 ? '' : 's'} from last month.`)
      }
    })
  }

  const handleAddBudget = () => {
    const amount = parseFloat(addingAmount)
    if (!addingCategory || isNaN(amount) || amount <= 0) {
      toast.error('Select a category and enter a valid amount.')
      return
    }
    startTransition(async () => {
      const result = await upsertBudget({
        category_id: addingCategory,
        amount,
        month,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Budget added.')
        setAddingCategory('')
        setAddingAmount('')
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Rollup */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Total caps</p>
            <p className="text-lg font-semibold tabular-nums">
              ${totalCaps.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Spent</p>
            <p className="text-lg font-semibold tabular-nums">
              ${totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className={`text-lg font-semibold tabular-nums ${totalRemaining < 0 ? 'text-destructive' : ''}`}>
              ${Math.abs(totalRemaining).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              {totalRemaining < 0 ? ' over' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleCopyLastMonth} disabled={isPending}>
          <Copy className="mr-1 h-4 w-4" />
          Copy last month
        </Button>
      </div>

      {/* Budget list */}
      {budgets.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            {budgets.map((budget) => (
              <BudgetRow key={budget.id} budget={budget} month={month} memberNames={memberNames} currentUserId={currentUserId} />
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No budgets set for this month. Add one below or copy from last month.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add budget */}
      {unbudgetedCategories.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Add a budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Select value={addingCategory} onValueChange={(v) => { if (v) setAddingCategory(v) }}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {unbudgetedCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Amount"
                value={addingAmount}
                onChange={(e) => setAddingAmount(e.target.value)}
                className="w-28"
              />
              <Button onClick={handleAddBudget} disabled={isPending} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

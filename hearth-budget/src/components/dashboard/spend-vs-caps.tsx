'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { calcBudgetPace } from '@/lib/budget-math'
import type { BudgetWithSpent } from '@/app/actions/budgets'
import { Wallet } from 'lucide-react'

interface Props {
  budgets: BudgetWithSpent[]
  memberNames: Record<string, string>
  currentUserId: string
}

export function SpendVsCaps({ budgets, memberNames, currentUserId }: Props) {
  if (budgets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-6 text-center">
          <Wallet className="h-6 w-6 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-1">No budgets set this month</p>
          <Link href="/app/budgets" className="text-sm text-primary hover:underline">
            Set budgets
          </Link>
        </CardContent>
      </Card>
    )
  }

  const totalCap = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)
  const totalPct = totalCap > 0 ? Math.min(100, Math.round((totalSpent / totalCap) * 100)) : 0
  const remaining = totalCap - totalSpent

  const overCount = budgets.filter((b) => {
    const pace = calcBudgetPace(b.spent, b.amount, new Date())
    return pace.status === 'over'
  }).length

  const hasMultipleMembers = Object.keys(memberNames).length > 1

  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          Budgets
        </CardTitle>
        <Link href="/app/budgets" className="text-xs text-primary hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold tabular-nums">
            ${totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <span className="text-sm text-muted-foreground tabular-nums">
            of ${totalCap.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
        <Progress
          value={totalPct}
          className={`h-2 ${totalSpent > totalCap ? '[&>div]:bg-destructive' : ''}`}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{totalPct}% used</span>
          <span className={remaining < 0 ? 'text-destructive font-medium' : ''}>
            {remaining >= 0
              ? `$${remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })} left`
              : `$${Math.abs(remaining).toLocaleString(undefined, { maximumFractionDigits: 0 })} over`}
          </span>
        </div>

        {budgets.slice(0, 4).map((b) => {
          const pct = b.amount > 0 ? Math.min(100, Math.round((b.spent / b.amount) * 100)) : 0
          const pace = calcBudgetPace(b.spent, b.amount, new Date())
          const personEntries = hasMultipleMembers
            ? Object.entries(b.spentByPerson).sort((a, b) => b[1] - a[1])
            : []

          return (
            <div key={b.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="truncate">{b.category_name}</span>
                <span className="tabular-nums text-muted-foreground">
                  ${b.spent.toLocaleString(undefined, { maximumFractionDigits: 0 })} / ${b.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <Progress
                value={pct}
                className={`h-1 ${pace.status === 'over' ? '[&>div]:bg-destructive' : pace.status === 'under' ? '[&>div]:bg-[var(--success)]' : ''}`}
              />
              {personEntries.length > 0 && (
                <div className="flex gap-3 text-[10px] text-muted-foreground">
                  {personEntries.map(([userId, amount]) => (
                    <span key={userId} className="tabular-nums">
                      {userId === currentUserId ? 'You' : memberNames[userId] ?? 'Partner'}:{' '}
                      ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {overCount > 0 && (
          <p className="text-xs text-destructive">
            {overCount} budget{overCount > 1 ? 's' : ''} over pace
          </p>
        )}
      </CardContent>
    </Card>
  )
}

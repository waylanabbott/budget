'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

const fmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

interface Props {
  monthlyIncome: number
  monthlyExpenses: number
}

export function IncomeVsExpenses({ monthlyIncome, monthlyExpenses }: Props) {
  const leftover = monthlyIncome - monthlyExpenses
  const usagePercent = monthlyIncome > 0
    ? Math.min(100, Math.round((monthlyExpenses / monthlyIncome) * 100))
    : 0
  const isOverBudget = monthlyExpenses > monthlyIncome

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-baseline justify-between">
          <p className="text-sm text-muted-foreground">Monthly income vs fixed expenses</p>
          <Link href="/app/recurring-bills" className="text-xs text-primary hover:underline">
            Details
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Income</p>
            <p className="text-lg font-bold tabular-nums">{fmt.format(monthlyIncome)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Fixed bills</p>
            <p className="text-lg font-bold tabular-nums">{fmt.format(monthlyExpenses)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Left over</p>
            <p className={cn(
              'text-lg font-bold tabular-nums',
              isOverBudget ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'
            )}>
              {fmt.format(leftover)}
            </p>
          </div>
        </div>
        <Progress
          value={usagePercent}
          className={cn('h-2', isOverBudget ? '[&>div]:bg-[var(--color-danger)]' : '')}
        />
        <p className="text-xs text-muted-foreground text-center">
          {usagePercent}% of income goes to fixed expenses
        </p>
      </CardContent>
    </Card>
  )
}

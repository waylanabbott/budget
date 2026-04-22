'use client'

import type { CategoryForecast } from '@/app/actions/forecasts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MethodologyModal } from './methodology-modal'

function formatDollars(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

interface Props {
  forecasts: CategoryForecast[]
}

export function CategoryProjections({ forecasts }: Props) {
  if (forecasts.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          End-of-Month Projections
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Where you&apos;re headed this month based on your daily spending rate.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {forecasts.map((f) => {
          const projected = f.projection.projected
          const cap = f.budgetCap
          const overBudget = cap !== null && projected > cap
          const barPercent = cap
            ? Math.min(100, (f.spentThisMonth / cap) * 100)
            : 0

          return (
            <div key={f.categoryId} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{f.categoryName}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm tabular-nums">
                    {formatDollars(f.spentThisMonth)}
                  </span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span
                    className={cn(
                      'text-sm font-medium tabular-nums',
                      overBudget && 'text-[var(--color-danger)]'
                    )}
                  >
                    {formatDollars(projected)}
                  </span>
                  {cap !== null && (
                    <span className="text-xs text-muted-foreground">
                      / {formatDollars(cap)}
                    </span>
                  )}
                  <MethodologyModal
                    title={`${f.categoryName} Projection`}
                    formula="projected = spent_so_far + (avg_daily_spend × days_remaining)"
                    inputs={[
                      { label: 'Spent so far', value: formatDollars(f.spentThisMonth) },
                      {
                        label: 'Avg daily spend',
                        value: formatDollars(f.projection.avgDailySpend),
                      },
                      {
                        label: 'Days remaining',
                        value: String(f.projection.daysRemaining),
                      },
                    ]}
                  />
                </div>
              </div>
              {cap !== null && (
                <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      'absolute inset-y-0 left-0 rounded-full',
                      overBudget
                        ? 'bg-[var(--color-danger)]'
                        : 'bg-[var(--color-success)]'
                    )}
                    style={{ width: `${barPercent}%` }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

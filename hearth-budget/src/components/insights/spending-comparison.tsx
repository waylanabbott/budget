'use client'

import { useState } from 'react'
import { ChevronDown, RotateCw, CalendarClock } from 'lucide-react'
import type { CategorySpending } from '@/app/actions/benchmarks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const fmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

function DiffBadge({ percent }: { percent: number | null }) {
  if (percent === null) return null
  const isOver = percent > 0
  const isUnder = percent < -10
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        isOver && 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
        isUnder && 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
        !isOver && !isUnder && 'bg-muted text-muted-foreground'
      )}
    >
      {isOver ? '+' : ''}
      {percent}%
    </span>
  )
}

function CategoryRow({ c }: { c: CategorySpending }) {
  const [expanded, setExpanded] = useState(false)
  const hasSubItems = c.subItems.length > 1 ||
    (c.subItems.length === 1 && c.subItems[0]!.name !== c.categoryName)

  const barWidth =
    c.blsBenchmark && c.blsBenchmark > 0
      ? Math.min(100, (c.monthlySpent / c.blsBenchmark) * 100)
      : 0

  return (
    <div className="py-2">
      <button
        onClick={() => hasSubItems && setExpanded(!expanded)}
        className={cn(
          'flex w-full items-center justify-between mb-1 text-left',
          hasSubItems && 'cursor-pointer'
        )}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">{c.categoryName}</span>
          {hasSubItems && (
            <ChevronDown className={cn(
              'h-3.5 w-3.5 text-muted-foreground transition-transform',
              expanded && 'rotate-180'
            )} />
          )}
        </div>
        <DiffBadge percent={c.diffPercent} />
      </button>

      {c.blsBenchmark !== null ? (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="relative h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'absolute inset-y-0 left-0 rounded-full transition-all',
                  c.diffPercent !== null && c.diffPercent > 0
                    ? 'bg-[var(--color-danger)]'
                    : 'bg-[var(--color-success)]'
                )}
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
          <div className="text-right min-w-[120px]">
            <span className="text-sm font-medium">{fmt.format(c.monthlySpent)}</span>
            <span className="text-xs text-muted-foreground"> / {fmt.format(c.blsBenchmark)}</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">No national benchmark</span>
          <span className="text-sm font-medium">{fmt.format(c.monthlySpent)}/mo</span>
        </div>
      )}

      {expanded && hasSubItems && (
        <div className="mt-2 ml-1 space-y-1 border-l-2 border-muted pl-3">
          {c.subItems.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {item.source === 'recurring' ? (
                  <RotateCw className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <CalendarClock className="h-3 w-3 text-muted-foreground" />
                )}
                <span className="text-xs text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-xs tabular-nums font-medium">{fmt.format(item.monthlyAmount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface Props {
  comparisons: CategorySpending[]
  quintileLabel: string
  dataYear: number
}

export function SpendingComparison({ comparisons, quintileLabel, dataYear }: Props) {
  const withBenchmark = comparisons.filter((c) => c.blsBenchmark !== null)
  const withoutBenchmark = comparisons.filter(
    (c) => c.blsBenchmark === null && c.monthlySpent > 0
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Spending vs. National Average</CardTitle>
        <p className="text-xs text-muted-foreground">
          BLS Consumer Expenditure Survey {dataYear} — {quintileLabel}. Tap a category to see the breakdown.
        </p>
      </CardHeader>
      <CardContent className="space-y-1 px-4">
        {withBenchmark.length === 0 && withoutBenchmark.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">
            No spending data yet. Add transactions or recurring bills to see comparisons.
          </p>
        )}
        {withBenchmark.map((c) => (
          <CategoryRow key={c.categoryName} c={c} />
        ))}
        {withoutBenchmark.length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2">No benchmark available</p>
            {withoutBenchmark.map((c) => (
              <CategoryRow key={c.categoryName} c={c} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

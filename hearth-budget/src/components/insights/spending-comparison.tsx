'use client'

import type { CategorySpending } from '@/app/actions/benchmarks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

function formatDollars(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

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
          BLS Consumer Expenditure Survey {dataYear} — {quintileLabel}
        </p>
      </CardHeader>
      <CardContent className="space-y-1 px-4">
        {withBenchmark.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">
            No spending data yet. Add transactions to see comparisons.
          </p>
        )}
        {withBenchmark.map((c) => {
          const barWidth =
            c.blsBenchmark && c.blsBenchmark > 0
              ? Math.min(100, (c.monthlySpent / c.blsBenchmark) * 100)
              : 0
          return (
            <div key={c.categoryName} className="py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{c.categoryName}</span>
                <DiffBadge percent={c.diffPercent} />
              </div>
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
                  <span className="text-sm font-medium">
                    {formatDollars(c.monthlySpent)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {' / '}
                    {formatDollars(c.blsBenchmark!)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
        {withoutBenchmark.length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              No benchmark available
            </p>
            {withoutBenchmark.map((c) => (
              <div
                key={c.categoryName}
                className="flex items-center justify-between py-1"
              >
                <span className="text-sm">{c.categoryName}</span>
                <span className="text-sm font-medium">
                  {formatDollars(c.monthlySpent)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

'use client'

import type { RunwayResult } from '@/lib/forecast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MethodologyModal } from './methodology-modal'

interface Props {
  runway: RunwayResult
}

export function RunwayCard({ runway }: Props) {
  const months = runway.months
  const statusColor =
    months === null
      ? 'text-muted-foreground'
      : months >= 6
        ? 'text-[var(--color-success)]'
        : months >= 3
          ? 'text-[var(--color-warning)]'
          : 'text-[var(--color-danger)]'

  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          Runway
        </CardTitle>
        <MethodologyModal
          title="Runway Calculation"
          formula="runway = total_balance / avg_monthly_outflow"
          inputs={[
            { label: 'Total balance', value: `$${runway.totalBalance.toLocaleString()}` },
            {
              label: 'Avg monthly outflow',
              value: `$${runway.avgMonthlyOutflow.toLocaleString()}`,
            },
          ]}
          note="Based on your average monthly spending across all available months of data."
        />
      </CardHeader>
      <CardContent>
        {months !== null ? (
          <div>
            <p className={cn('text-3xl font-bold tabular-nums', statusColor)}>
              {months} <span className="text-lg font-normal">months</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              At current pace, your accounts cover {months} months of expenses.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Not enough data to calculate runway.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

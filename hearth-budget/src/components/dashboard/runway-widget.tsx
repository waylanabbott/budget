'use client'

import Link from 'next/link'
import type { RunwayResult } from '@/lib/forecast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  runway: RunwayResult
}

export function RunwayWidget({ runway }: Props) {
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
        <Link href="/app/forecast" className="text-xs text-primary hover:underline">
          Details
        </Link>
      </CardHeader>
      <CardContent>
        {months !== null ? (
          <div>
            <p className={cn('text-2xl font-bold tabular-nums', statusColor)}>
              {months} <span className="text-sm font-normal">months</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Based on ${runway.avgMonthlyOutflow.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo spending
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Not enough data yet
          </p>
        )}
      </CardContent>
    </Card>
  )
}

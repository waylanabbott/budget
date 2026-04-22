'use client'

import Link from 'next/link'
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts'
import type { CashFlowPoint } from '@/lib/forecast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingDown } from 'lucide-react'
import { format, parseISO } from 'date-fns'

function formatDollars(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`
  }
  return `$${value.toFixed(0)}`
}

interface Props {
  data: CashFlowPoint[]
}

export function CashFlowMini({ data }: Props) {
  if (data.length === 0) return null

  const preview = data.slice(0, 31)
  const tickInterval = Math.floor(preview.length / 4)
  const endBalance = preview[preview.length - 1]!.balance
  const startBalance = preview[0]!.balance
  const diff = endBalance - startBalance

  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
          30-Day Cash Flow
        </CardTitle>
        <Link href="/app/forecast" className="text-xs text-primary hover:underline">
          Full view
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums">
            {formatDollars(endBalance)}
          </span>
          <span className={`text-xs font-medium ${diff >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
            {diff >= 0 ? '+' : ''}{formatDollars(diff)}
          </span>
        </div>
        <div className="h-[120px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={preview} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="dashCfBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(val) => format(parseISO(val), 'M/d')}
                interval={tickInterval}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={formatDollars}
                width={45}
                axisLine={false}
                tickLine={false}
              />
              <Area
                type="monotone"
                dataKey="upper"
                stroke="none"
                fill="url(#dashCfBand)"
                fillOpacity={1}
              />
              <Area
                type="monotone"
                dataKey="lower"
                stroke="none"
                fill="hsl(var(--card))"
                fillOpacity={1}
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

'use client'

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { CashFlowPoint } from '@/lib/forecast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export function CashFlowChart({ data }: Props) {
  if (data.length === 0) return null

  const tickInterval = Math.floor(data.length / 5)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">60-Day Cash Flow Projection</CardTitle>
        <p className="text-xs text-muted-foreground">
          Projected balance based on your spending patterns. Shaded area shows ±1 standard deviation.
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(val) => format(parseISO(val), 'MMM d')}
                interval={tickInterval}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={formatDollars}
                width={55}
              />
              <Tooltip
                labelFormatter={(val) => format(parseISO(val as string), 'MMM d, yyyy')}
                formatter={(value, name) => {
                  const labels: Record<string, string> = {
                    balance: 'Projected',
                    upper: 'Upper bound',
                    lower: 'Lower bound',
                  }
                  return [formatDollars(Number(value ?? 0)), labels[String(name)] || String(name)]
                }}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--card))',
                }}
              />
              <Area
                type="monotone"
                dataKey="upper"
                stroke="none"
                fill="url(#confidenceBand)"
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

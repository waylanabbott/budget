'use client'

import type { HousingBenchmark } from '@/app/actions/benchmarks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Home } from 'lucide-react'

function formatDollars(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

interface Props {
  housing: HousingBenchmark
  metro: string
  zip: string
}

export function HousingComparison({ housing, metro, zip }: Props) {
  const hasAnyData = housing.hudFmr || housing.zillowRent || housing.zillowHomeValue

  if (!hasAnyData) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Home className="h-5 w-5" />
            Housing Benchmarks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No housing benchmark data available for {zip}.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Home className="h-5 w-5" />
          Housing — {metro}
        </CardTitle>
        <p className="text-xs text-muted-foreground">ZIP {zip}</p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {housing.userRent !== null && (
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground mb-1">Your rent/mortgage</p>
              <p className="text-2xl font-bold">{formatDollars(housing.userRent)}</p>
              <p className="text-xs text-muted-foreground">this month</p>
            </div>
          )}

          {housing.hudFmr && (
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground mb-1">
                HUD Fair Market Rent ({housing.hudFmr.bedrooms}BR)
              </p>
              <p className="text-2xl font-bold">
                {formatDollars(housing.hudFmr.rent)}
              </p>
              <p className="text-xs text-muted-foreground">
                40th percentile gross rent (incl. utilities) — FY{housing.hudFmr.dataYear}
              </p>
            </div>
          )}

          {housing.zillowRent !== null && (
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground mb-1">
                Zillow Rent Index (ZORI)
              </p>
              <p className="text-2xl font-bold">
                {formatDollars(housing.zillowRent)}
              </p>
              <p className="text-xs text-muted-foreground">
                Smoothed, seasonally adjusted — Mar 2026
              </p>
            </div>
          )}

          {housing.zillowHomeValue !== null && (
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground mb-1">
                Zillow Home Value (ZHVI)
              </p>
              <p className="text-2xl font-bold">
                {formatDollars(housing.zillowHomeValue)}
              </p>
              <p className="text-xs text-muted-foreground">
                Typical home value, middle tier — Mar 2026
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

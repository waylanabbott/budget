import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getForecastData } from '@/app/actions/forecasts'
import { CashFlowChart } from '@/components/forecasts/cash-flow-chart'
import { RunwayCard } from '@/components/forecasts/runway-card'
import { CategoryProjections } from '@/components/forecasts/category-projections'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, TrendingUp, TrendingDown } from 'lucide-react'

function formatDollars(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default async function ForecastPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data, error } = await getForecastData()

  if (error || !data) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-2">Forecast</h1>
        <p className="text-sm text-destructive">{error || 'Could not load forecast data.'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold">Forecast</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Deterministic projections based on your spending patterns. No AI — just math.
        </p>
      </div>

      {!data.confidence.ready && (
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium">Building your forecast</p>
              <p className="text-xs text-muted-foreground">{data.confidence.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Month summary cards */}
      <div className="grid gap-3 grid-cols-2">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-[var(--color-success)]" />
              <p className="text-xs text-muted-foreground">Income this month</p>
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {formatDollars(data.totalIncomeThisMonth)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-[var(--color-danger)]" />
              <p className="text-xs text-muted-foreground">Spent this month</p>
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {formatDollars(data.totalSpentThisMonth)}
            </p>
          </CardContent>
        </Card>
      </div>

      <RunwayCard runway={data.runway} />

      <CategoryProjections forecasts={data.categoryForecasts} />

      {data.cashFlow.length > 0 && <CashFlowChart data={data.cashFlow} />}
    </div>
  )
}

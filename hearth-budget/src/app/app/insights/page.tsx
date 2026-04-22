import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getInsightsData } from '@/app/actions/benchmarks'
import { SpendingComparison } from '@/components/insights/spending-comparison'
import { SourceCitations } from '@/components/insights/source-citations'

export default async function InsightsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data, error } = await getInsightsData()

  if (error || !data) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-2">Insights</h1>
        <p className="text-sm text-destructive">
          {error || 'Could not load benchmark data.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold">Insights</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Compare your spending to national averages for your income group ({data.quintileLabel}, {data.metro}).
        </p>
      </div>

      <SpendingComparison
        comparisons={data.categoryComparisons}
        quintileLabel={data.quintileLabel}
        dataYear={data.dataYear}
      />

      <SourceCitations sources={data.sources} />
    </div>
  )
}

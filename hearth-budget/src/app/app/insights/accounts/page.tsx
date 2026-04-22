import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getFinancialReferences } from '@/app/actions/goals'
import { ReferenceCards } from '@/components/goals/reference-cards'

export default async function InsightsAccountsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: references, error } = await getFinancialReferences()

  if (error) {
    throw new Error(`Failed to load references: ${error}`)
  }

  const brokerages = references.filter((r) => r.category === 'brokerage')
  const accountTypes = references.filter((r) => r.category === 'account_type')
  const benchmarks = references.filter((r) => r.category === 'rate_benchmark')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Account & Investment Info</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Informational only — not financial advice. Consult a fiduciary for your situation.
        </p>
      </div>

      {accountTypes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Compare account types</h2>
          <ReferenceCards references={accountTypes} layout="comparison" />
        </section>
      )}

      {brokerages.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Brokerage options</h2>
          <p className="text-xs text-muted-foreground">
            These are popular brokerages for retirement accounts. This is not a recommendation — research each option for your situation.
          </p>
          <ReferenceCards references={brokerages} />
        </section>
      )}

      {benchmarks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Reference benchmarks</h2>
          <ReferenceCards references={benchmarks} />
        </section>
      )}
    </div>
  )
}

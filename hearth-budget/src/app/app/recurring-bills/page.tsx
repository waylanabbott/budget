import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRecurringBills } from '@/app/actions/recurring-bills'
import { getAccounts } from '@/app/actions/accounts'
import { getCategories } from '@/app/actions/categories'
import { RecurringBillList } from '@/components/recurring-bill-list'

export default async function RecurringBillsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [billsResult, accountsResult, categoriesResult] = await Promise.all([
    getRecurringBills(),
    getAccounts(),
    getCategories(),
  ])

  const accounts = (accountsResult.data ?? [])
    .filter((a) => !a.is_archived)
    .map((a) => ({ id: a.id, name: a.name }))

  const categories = (categoriesResult.data ?? [])
    .filter((c) => !c.is_income)
    .map((c) => ({ id: c.id, name: c.name }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Recurring Bills</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track rent, subscriptions, and other fixed expenses. These feed into your cash flow forecast.
        </p>
      </div>

      {billsResult.error ? (
        <p className="text-destructive">Failed to load bills: {billsResult.error}</p>
      ) : (
        <RecurringBillList
          bills={billsResult.data}
          accounts={accounts}
          categories={categories}
        />
      )}
    </div>
  )
}

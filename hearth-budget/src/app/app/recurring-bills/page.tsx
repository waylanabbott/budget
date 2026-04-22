import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRecurringBills } from '@/app/actions/recurring-bills'
import { getAccounts } from '@/app/actions/accounts'
import { getCategories } from '@/app/actions/categories'
import { RecurringBillList } from '@/components/recurring-bill-list'
import { incomeToQuintile } from '@/lib/benchmarks/bls-cex-2024'

export default async function RecurringBillsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single()

  if (!member) redirect('/onboarding')

  const { data: household } = await supabase
    .from('households')
    .select('income_bracket')
    .eq('id', member.household_id)
    .single()

  const income = parseInt(household?.income_bracket || '0', 10)
  const quintile = incomeToQuintile(income)

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
          Track fixed expenses and compare against national averages for your income bracket.
        </p>
      </div>

      {billsResult.error ? (
        <p className="text-destructive">Failed to load bills: {billsResult.error}</p>
      ) : (
        <RecurringBillList
          bills={billsResult.data}
          accounts={accounts}
          categories={categories}
          quintile={quintile}
        />
      )}
    </div>
  )
}

import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { getBudgetsWithSpending, getUnbudgetedCategories } from '@/app/actions/budgets'
import { BudgetList } from '@/components/budget-list'

export default async function BudgetsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const currentMonth = format(new Date(), 'yyyy-MM')

  const [{ data: budgets, month }, { data: unbudgeted }] = await Promise.all([
    getBudgetsWithSpending(currentMonth),
    getUnbudgetedCategories(currentMonth),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Budgets</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {format(new Date(), 'MMMM yyyy')} — set caps and track your pace.
        </p>
      </div>

      <BudgetList
        budgets={budgets}
        month={month}
        unbudgetedCategories={unbudgeted}
      />
    </div>
  )
}

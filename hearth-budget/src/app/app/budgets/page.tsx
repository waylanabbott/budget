import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { getBudgetsWithSpending, getUnbudgetedCategories } from '@/app/actions/budgets'
import { getHouseholdMembers } from '@/app/actions/members'
import { BudgetList } from '@/components/budget-list'
import { RealtimeRefresh } from '@/components/realtime-refresh'

export default async function BudgetsPage() {
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

  const currentMonth = format(new Date(), 'yyyy-MM')

  const [{ data: budgets, month }, { data: unbudgeted }, { data: members }] =
    await Promise.all([
      getBudgetsWithSpending(currentMonth),
      getUnbudgetedCategories(currentMonth),
      getHouseholdMembers(),
    ])

  const memberNames: Record<string, string> = {}
  for (const m of members) {
    memberNames[m.user_id] = m.display_name ?? 'Unknown'
  }

  return (
    <div className="space-y-6">
      <RealtimeRefresh table="budgets" householdId={member.household_id} />
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
        memberNames={memberNames}
        currentUserId={user.id}
      />
    </div>
  )
}

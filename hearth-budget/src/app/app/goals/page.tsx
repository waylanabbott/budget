import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getGoals,
  getGoalTemplates,
  getMonthlyEssentialExpenses,
  getHouseholdProfile,
  getAccountBalances,
} from '@/app/actions/goals'
import { getAccounts } from '@/app/actions/accounts'
import { FinancialHealthDashboard } from '@/components/goals/financial-health-dashboard'
import { GoalList } from '@/components/goals/goal-list'
import { CreateGoalButton } from '@/components/goals/create-goal-button'
import { RealtimeRefresh } from '@/components/realtime-refresh'

export default async function GoalsPage() {
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

  const [
    { data: goals },
    { data: templates },
    { data: expenses },
    { data: profile },
    { data: accounts },
  ] = await Promise.all([
    getGoals(),
    getGoalTemplates(),
    getMonthlyEssentialExpenses(),
    getHouseholdProfile(),
    getAccounts(),
  ])

  // Get balances for all linked accounts across all goals
  const allLinkedAccountIds = [
    ...new Set(
      goals.flatMap((g) =>
        g.goal_account_links?.map((l) => l.account_id) ?? []
      )
    ),
  ]
  const { data: balances } = await getAccountBalances(allLinkedAccountIds)

  return (
    <div className="space-y-6">
      <RealtimeRefresh table="goals" householdId={member.household_id} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Goals</h1>
          <p className="text-sm text-muted-foreground">
            Track progress toward your financial targets.
          </p>
        </div>
        <CreateGoalButton
          templates={templates}
          accounts={accounts}
          monthlyEssentialExpenses={expenses.monthly_average}
          monthsOfData={expenses.months_of_data}
          profile={profile}
        />
      </div>

      <FinancialHealthDashboard
        templates={templates}
        goals={goals}
        expenses={expenses}
        profile={profile}
        balances={balances}
      />

      <GoalList
        goals={goals}
        balances={balances}
        accounts={accounts}
      />
    </div>
  )
}

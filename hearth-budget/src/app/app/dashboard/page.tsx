import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getHouseholdMembers } from '@/app/actions/members'
import { getGoals, getAccountBalances } from '@/app/actions/goals'
import { Target } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { IncomeVsExpenses } from '@/components/dashboard/income-vs-expenses'

export default async function DashboardPage() {
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
    { data: members },
    { data: goals },
    billsResult,
    incomeResult,
  ] = await Promise.all([
    getHouseholdMembers(),
    getGoals(),
    supabase
      .from('recurring_bills')
      .select('name, amount, cadence, categories(name)')
      .eq('household_id', member.household_id),
    supabase
      .from('households')
      .select('income_bracket')
      .eq('id', member.household_id)
      .single(),
  ])

  const partner = members.find((m) => m.user_id !== user.id)
  const partnerDisplayName = partner?.display_name ?? (partner ? 'Partner' : null)

  const heading = partnerDisplayName
    ? `You and ${partnerDisplayName}`
    : 'Dashboard'

  // Income vs expenses from recurring bills
  const monthlyIncome = parseInt(incomeResult.data?.income_bracket || '0', 10) / 12
  const bills = billsResult.data ?? []
  let monthlyExpenses = 0
  for (const bill of bills) {
    const cat = bill.categories as { name: string } | null
    if (cat?.name === 'Savings Transfers') continue
    const amt = Math.abs(bill.amount)
    if (bill.cadence === 'weekly') monthlyExpenses += amt * 4.33
    else if (bill.cadence === 'biweekly') monthlyExpenses += amt * 2.17
    else if (bill.cadence === 'yearly') monthlyExpenses += amt / 12
    else monthlyExpenses += amt
  }

  // Goals
  const allLinkedAccountIds = [
    ...new Set(
      goals.flatMap((g) =>
        g.goal_account_links?.map((l) => l.account_id) ?? []
      )
    ),
  ]
  const { data: balances } = await getAccountBalances(allLinkedAccountIds)

  const goalsWithProgress = goals.map((goal) => {
    const links = goal.goal_account_links ?? []
    const current = links.reduce((sum, l) => sum + (balances[l.account_id] ?? 0), 0)
    const progress = goal.target_amount > 0
      ? Math.min(100, Math.round((current / goal.target_amount) * 100))
      : 0
    return { ...goal, current, progress }
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{heading}</h1>

      <IncomeVsExpenses monthlyIncome={monthlyIncome} monthlyExpenses={monthlyExpenses} />

      {goalsWithProgress.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Goals</h2>
            <Link href="/app/goals" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {goalsWithProgress.map((goal) => (
              <Card key={goal.id} className={goal.current >= goal.target_amount && goal.target_amount > 0 ? 'border-[var(--success)]/50' : ''}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{goal.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium tabular-nums">
                      ${goal.current.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      of ${goal.target_amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <Progress
                    value={goal.progress}
                    className={`h-2 ${goal.current >= goal.target_amount && goal.target_amount > 0 ? '[&>div]:bg-[var(--success)]' : ''}`}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {goalsWithProgress.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Target className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">
              No goals yet — set a savings target to track your progress.
            </p>
            <Link href="/app/goals" className="text-sm text-primary hover:underline">
              Create a goal
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

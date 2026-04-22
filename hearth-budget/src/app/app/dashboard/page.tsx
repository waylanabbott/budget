import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getHouseholdMembers } from '@/app/actions/members'
import { getTransactions } from '@/app/actions/transactions'
import { LayoutDashboard, ArrowRightLeft } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: members }, txResult] = await Promise.all([
    getHouseholdMembers(),
    getTransactions({ limit: 5 }),
  ])

  const partner = members.find((m) => m.user_id !== user.id)
  const partnerDisplayName = partner?.display_name ?? (partner ? 'Partner' : null)

  const heading = partnerDisplayName
    ? `You and ${partnerDisplayName}`
    : 'Dashboard'

  const recentTransactions = txResult.data ?? []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-2">{heading}</h1>

      <Card>
        <CardHeader className="items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <LayoutDashboard className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Your dashboard is getting ready</CardTitle>
          <CardDescription>
            Once you add transactions and set budget caps, your spending summary
            will appear here.
          </CardDescription>
        </CardHeader>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">Recent transactions</h2>
        {recentTransactions.length > 0 ? (
          <Card>
            <CardContent className="divide-y">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {tx.merchant ?? 'No merchant'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(tx.occurred_on), 'MMM d, yyyy')}
                      {tx.categories?.name ? ` · ${tx.categories.name}` : ''}
                    </p>
                  </div>
                  <span
                    className={
                      tx.categories?.is_income
                        ? 'font-semibold text-green-600 tabular-nums'
                        : 'font-semibold tabular-nums'
                    }
                  >
                    {tx.categories?.is_income ? '+' : '-'}$
                    {Math.abs(tx.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <ArrowRightLeft className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No transactions yet
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

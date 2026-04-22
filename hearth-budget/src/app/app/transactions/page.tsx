import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTransactions } from '@/app/actions/transactions'
import { getAccounts } from '@/app/actions/accounts'
import { getCategories } from '@/app/actions/categories'
import { getHouseholdMembers } from '@/app/actions/members'
import { TransactionList } from '@/components/transaction-list'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get household ID for Realtime subscription
  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/onboarding')

  const householdId = membership.household_id

  const [txResult, acctResult, catResult, membersResult] = await Promise.all([
    getTransactions({ limit: 20 }),
    getAccounts(),
    getCategories(),
    getHouseholdMembers(),
  ])

  const errors = [txResult.error, acctResult.error, catResult.error, membersResult.error].filter(Boolean)
  if (errors.length > 0) {
    throw new Error(`Failed to load transactions: ${errors.join(', ')}`)
  }

  // Build memberMap: user_id -> initial
  const memberMap: Record<string, string> = {}
  for (const m of membersResult.data) {
    memberMap[m.user_id] = (m.display_name?.[0] ?? '?').toUpperCase()
  }
  // Override current user with their email initial (more reliable)
  memberMap[user.id] = (user.email?.[0] ?? '?').toUpperCase()

  // Build members list for Person filter (current user first, labeled "You")
  const members = membersResult.data.map((m) => ({
    user_id: m.user_id,
    label: m.user_id === user.id ? 'You' : (m.display_name ?? 'Partner'),
  }))

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Transactions</h1>
      <TransactionList
        initialTransactions={txResult.data ?? []}
        initialCursor={txResult.nextCursor ?? null}
        accounts={acctResult.data ?? []}
        categories={catResult.data ?? []}
        memberMap={memberMap}
        members={members}
        householdId={householdId}
      />
    </div>
  )
}

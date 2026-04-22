import { getAccounts, getAccountCurrentBalances } from '@/app/actions/accounts'
import { AccountList } from '@/components/account-list'

export default async function AccountsPage() {
  const [{ data: accounts, error }, { data: balances }] = await Promise.all([
    getAccounts(),
    getAccountCurrentBalances(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Manage your checking, savings, retirement, and investment accounts.
          </p>
        </div>
      </div>

      {error ? (
        <p className="text-destructive">Failed to load accounts: {error}</p>
      ) : (
        <AccountList accounts={accounts ?? []} balances={balances} />
      )}
    </div>
  )
}

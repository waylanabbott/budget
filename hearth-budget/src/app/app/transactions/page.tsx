import { getTransactions } from '@/app/actions/transactions'
import { getAccounts } from '@/app/actions/accounts'
import { getCategories } from '@/app/actions/categories'
import { TransactionList } from '@/components/transaction-list'

export default async function TransactionsPage() {
  const [txResult, acctResult, catResult] = await Promise.all([
    getTransactions({ limit: 20 }),
    getAccounts(),
    getCategories(),
  ])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Transactions</h1>
      <TransactionList
        initialTransactions={txResult.data ?? []}
        initialCursor={txResult.nextCursor ?? null}
        accounts={acctResult.data ?? []}
        categories={catResult.data ?? []}
      />
    </div>
  )
}

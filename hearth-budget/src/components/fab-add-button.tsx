'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import { TransactionSheet } from '@/components/transaction-sheet'
import { getAccounts } from '@/app/actions/accounts'
import { getCategories } from '@/app/actions/categories'
import type { Database } from '@/types/database'

type AccountRow = Database['public']['Tables']['accounts']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']

export function FabAddButton() {
  const [open, setOpen] = React.useState(false)
  const [accounts, setAccounts] = React.useState<AccountRow[]>([])
  const [categories, setCategories] = React.useState<CategoryRow[]>([])
  const [loaded, setLoaded] = React.useState(false)

  // Fetch accounts and categories on mount
  React.useEffect(() => {
    let cancelled = false

    async function load() {
      const [accountsResult, categoriesResult] = await Promise.all([
        getAccounts(),
        getCategories(),
      ])
      if (!cancelled) {
        setAccounts(accountsResult.data as AccountRow[])
        setCategories(categoriesResult.data as CategoryRow[])
        setLoaded(true)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 md:bottom-8 md:right-8"
        aria-label="Add transaction"
      >
        <Plus className="h-6 w-6" />
      </button>

      <TransactionSheet
        open={open}
        onOpenChange={setOpen}
        accounts={accounts}
        categories={categories}
        loaded={loaded}
      />
    </>
  )
}

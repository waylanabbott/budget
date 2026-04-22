'use client'

import { useState, useTransition } from 'react'
import { Pencil, Archive } from 'lucide-react'
import { toast } from 'sonner'

import { archiveAccount } from '@/app/actions/accounts'
import type { Database } from '@/types/database'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AccountFormDialog } from '@/components/account-form-dialog'

type AccountRow = Database['public']['Tables']['accounts']['Row']

const TYPE_LABELS: Record<string, string> = {
  checking: 'Checking',
  savings: 'Savings',
  credit_card: 'Credit Card',
  cash: 'Cash',
}

const formatCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

interface AccountListProps {
  accounts: AccountRow[]
}

export function AccountList({ accounts }: AccountListProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AccountRow | null>(null)
  const [isPending, startTransition] = useTransition()

  const activeAccounts = accounts.filter((a) => !a.is_archived)
  const archivedAccounts = accounts.filter((a) => a.is_archived)

  function handleEdit(account: AccountRow) {
    setEditingAccount(account)
    setDialogOpen(true)
  }

  function handleCreate() {
    setEditingAccount(null)
    setDialogOpen(true)
  }

  function handleArchive(account: AccountRow) {
    if (!window.confirm(`Archive "${account.name}"? You can't undo this.`)) {
      return
    }

    startTransition(async () => {
      const result = await archiveAccount(account.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`"${account.name}" archived`)
      }
    })
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={handleCreate}>New Account</Button>
      </div>

      {activeAccounts.length === 0 && archivedAccounts.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No accounts yet. Create one to start tracking.
        </p>
      ) : (
        <>
          {activeAccounts.length > 0 && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {activeAccounts.map((account) => (
                <Card key={account.id} size="sm">
                  <CardHeader>
                    <CardTitle>{account.name}</CardTitle>
                    <CardAction>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(account)}
                          aria-label={`Edit ${account.name}`}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleArchive(account)}
                          disabled={isPending}
                          aria-label={`Archive ${account.name}`}
                        >
                          <Archive />
                        </Button>
                      </div>
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {TYPE_LABELS[account.type] ?? account.type}
                      </span>
                      <span className="text-lg font-semibold tabular-nums">
                        {formatCurrency.format(account.starting_balance)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {archivedAccounts.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                Archived
              </h2>
              <div className="grid grid-cols-1 gap-3 opacity-60 md:grid-cols-2">
                {archivedAccounts.map((account) => (
                  <Card key={account.id} size="sm">
                    <CardHeader>
                      <CardTitle>{account.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {TYPE_LABELS[account.type] ?? account.type}
                        </span>
                        <span className="text-lg font-semibold tabular-nums text-muted-foreground">
                          {formatCurrency.format(account.starting_balance)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <AccountFormDialog
        account={editingAccount}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  )
}

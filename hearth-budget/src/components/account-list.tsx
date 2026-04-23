'use client'

import { useState, useTransition } from 'react'
import { Pencil, Archive, PiggyBank, Landmark, Wallet } from 'lucide-react'
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
import { ConfirmDialog } from '@/components/confirm-dialog'

type AccountRow = Database['public']['Tables']['accounts']['Row']

const TYPE_LABELS: Record<string, string> = {
  checking: 'Checking',
  savings: 'Savings',
  credit_card: 'Credit Card',
  cash: 'Cash',
  retirement: 'Retirement',
  investment: 'Investment',
}

const formatCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

interface AccountListProps {
  accounts: AccountRow[]
  balances: Record<string, number>
}

export function AccountList({ accounts, balances }: AccountListProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AccountRow | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<AccountRow | null>(null)
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

  function handleArchiveConfirmed() {
    if (!archiveTarget) return

    const account = archiveTarget
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
              {activeAccounts.map((account) => {
                const currentBalance = balances[account.id] ?? account.starting_balance
                return (
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
                            onClick={() => setArchiveTarget(account)}
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
                        <div className="text-right">
                          <span className={`text-lg font-semibold tabular-nums ${currentBalance < 0 ? 'text-destructive' : ''}`}>
                            {formatCurrency.format(currentBalance)}
                          </span>
                          {currentBalance !== account.starting_balance && (
                            <p className="text-[10px] text-muted-foreground tabular-nums">
                              Started at {formatCurrency.format(account.starting_balance)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
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

      <AccountTotals accounts={activeAccounts} balances={balances} />

      <AccountFormDialog
        account={editingAccount}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <ConfirmDialog
        open={archiveTarget !== null}
        onOpenChange={(open) => { if (!open) setArchiveTarget(null) }}
        title={`Archive "${archiveTarget?.name}"?`}
        description="This account will be hidden from new transactions. You can't undo this."
        confirmLabel="Archive"
        variant="destructive"
        onConfirm={handleArchiveConfirmed}
      />
    </>
  )
}

function AccountTotals({
  accounts,
  balances,
}: {
  accounts: AccountRow[]
  balances: Record<string, number>
}) {
  if (accounts.length === 0) return null

  const groups: { label: string; types: string[]; icon: typeof PiggyBank }[] = [
    { label: 'Savings', types: ['savings'], icon: PiggyBank },
    { label: 'Retirement', types: ['retirement'], icon: Landmark },
    { label: 'Checking', types: ['checking'], icon: Wallet },
  ]

  const totals = groups.map(({ label, types, icon }) => {
    const matching = accounts.filter((a) => types.includes(a.type))
    const total = matching.reduce(
      (sum, a) => sum + (balances[a.id] ?? a.starting_balance),
      0
    )
    return { label, total, count: matching.length, icon }
  }).filter((g) => g.count > 0)

  if (totals.length === 0) return null

  return (
    <div className="fixed bottom-14 left-0 right-0 z-30 border-t bg-background md:static md:bottom-auto md:z-auto md:mt-6 md:rounded-xl md:border">
      <div className="flex divide-x">
        {totals.map(({ label, total, icon: Icon }) => (
          <div key={label} className="flex-1 px-3 py-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className={`text-base font-bold tabular-nums ${total < 0 ? 'text-destructive' : ''}`}>
              {formatCurrency.format(total)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { accountSchema, ACCOUNT_TYPES, type AccountInput } from '@/lib/schemas/accounts'
import { createAccount, updateAccount } from '@/app/actions/accounts'
import type { Database } from '@/types/database'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type AccountRow = Database['public']['Tables']['accounts']['Row']

const TYPE_LABELS: Record<(typeof ACCOUNT_TYPES)[number], string> = {
  checking: 'Checking',
  savings: 'Savings',
  credit_card: 'Credit Card',
  cash: 'Cash',
  retirement: 'Retirement',
  investment: 'Investment',
}

interface AccountFormDialogProps {
  account?: AccountRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AccountFormDialog({
  account,
  open,
  onOpenChange,
}: AccountFormDialogProps) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!account

  const form = useForm<AccountInput>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: account?.name ?? '',
      type: (account?.type as AccountInput['type']) ?? 'checking',
      starting_balance: account?.starting_balance ?? 0,
    },
  })

  // Reset form when account changes (switching between edit targets)
  useEffect(() => {
    if (open) {
      form.reset({
        name: account?.name ?? '',
        type: (account?.type as AccountInput['type']) ?? 'checking',
        starting_balance: account?.starting_balance ?? 0,
      })
    }
  }, [account, open, form])

  function onSubmit(data: AccountInput) {
    startTransition(async () => {
      const result = isEdit
        ? await updateAccount(account.id, data)
        : await createAccount(data)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(isEdit ? 'Account updated' : 'Account created')
      onOpenChange(false)
      form.reset()
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Account' : 'New Account'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Update your account details.'
              : 'Add a new account to track your finances.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 px-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Chase Checking" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <select
                      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
                      {...field}
                    >
                      {ACCOUNT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="starting_balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starting Balance</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === '' ? 0 : parseFloat(e.target.value)
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? 'Saving...'
                  : isEdit
                    ? 'Update Account'
                    : 'Create Account'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

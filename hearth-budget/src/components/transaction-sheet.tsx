'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { transactionSchema, type TransactionInput } from '@/lib/schemas/transactions'
import { createTransaction } from '@/app/actions/transactions'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CategoryPicker } from '@/components/category-picker'
import { MerchantAutocomplete } from '@/components/merchant-autocomplete'
import type { Database } from '@/types/database'

type AccountRow = Database['public']['Tables']['accounts']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']

interface TransactionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: AccountRow[]
  categories: CategoryRow[]
  loaded: boolean
}

function getLocalDateString(): string {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function TransactionSheet({
  open,
  onOpenChange,
  accounts,
  categories,
  loaded,
}: TransactionSheetProps) {
  const amountRef = React.useRef<HTMLInputElement>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  // Non-archived accounts for the dropdown
  const activeAccounts = accounts.filter((a) => !a.is_archived)

  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: undefined as unknown as number,
      account_id: '',
      category_id: null,
      occurred_on: getLocalDateString(),
      merchant: null,
      notes: null,
    },
  })

  // Auto-focus amount when sheet opens
  React.useEffect((): void | (() => void) => {
    if (open) {
      // Reset form on open with fresh date
      form.reset({
        amount: undefined as unknown as number,
        account_id: activeAccounts[0]?.id ?? '',
        category_id: null,
        occurred_on: getLocalDateString(),
        merchant: null,
        notes: null,
      })
      setSubmitError(null)

      // Focus the amount field after a brief delay for the animation
      const timeout = setTimeout(() => {
        amountRef.current?.focus()
      }, 100)
      return () => clearTimeout(timeout)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(data: TransactionInput) {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await createTransaction(data)
      if (result.error) {
        setSubmitError(result.error)
      } else {
        onOpenChange(false)
      }
    } catch {
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Watch the amount string for display (we store as string in input, parse on submit)
  const [amountStr, setAmountStr] = React.useState('')
  const [merchantStr, setMerchantStr] = React.useState('')

  // Reset display values when form opens
  React.useEffect(() => {
    if (open) {
      setAmountStr('')
      setMerchantStr('')
    }
  }, [open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl">
        <SheetHeader>
          <SheetTitle>New Transaction</SheetTitle>
          <SheetDescription className="sr-only">
            Add a new transaction to your household
          </SheetDescription>
        </SheetHeader>

        {!loaded ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-3 px-4 pb-4"
          >
            {/* 1. Amount - FIRST field, large numeric input */}
            <div className="space-y-1">
              <Input
                ref={amountRef}
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.]?[0-9]{0,2}"
                placeholder="0.00"
                className="h-16 border-0 border-b-2 text-center text-3xl font-bold"
                value={amountStr}
                onChange={(e) => {
                  const val = e.target.value
                  // Allow only valid decimal patterns
                  if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                    setAmountStr(val)
                    const num = parseFloat(val)
                    if (!isNaN(num) && num > 0) {
                      form.setValue('amount', num, { shouldValidate: false })
                    }
                  }
                }}
                aria-label="Amount"
              />
              {form.formState.errors.amount && (
                <p className="text-center text-xs text-destructive">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>

            {/* 2. Category picker */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <CategoryPicker
                categories={categories}
                value={form.watch('category_id') ?? null}
                onChange={(id) => form.setValue('category_id', id, { shouldValidate: true })}
              />
            </div>

            {/* 3. Account dropdown */}
            <div className="space-y-1">
              <Label htmlFor="txn-account" className="text-xs text-muted-foreground">
                Account
              </Label>
              <select
                id="txn-account"
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={form.watch('account_id')}
                onChange={(e) =>
                  form.setValue('account_id', e.target.value, { shouldValidate: true })
                }
              >
                <option value="">Select account</option>
                {activeAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.account_id && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.account_id.message}
                </p>
              )}
            </div>

            {/* 4. Date */}
            <div className="space-y-1">
              <Label htmlFor="txn-date" className="text-xs text-muted-foreground">
                Date
              </Label>
              <Input
                id="txn-date"
                type="date"
                {...form.register('occurred_on')}
              />
              {form.formState.errors.occurred_on && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.occurred_on.message}
                </p>
              )}
            </div>

            {/* 5. Merchant autocomplete */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Merchant</Label>
              <MerchantAutocomplete
                value={merchantStr}
                onChange={(val) => {
                  setMerchantStr(val)
                  form.setValue('merchant', val || null, { shouldValidate: false })
                }}
              />
            </div>

            {/* 6. Notes */}
            <div className="space-y-1">
              <Label htmlFor="txn-notes" className="text-xs text-muted-foreground">
                Notes
              </Label>
              <Input
                id="txn-notes"
                placeholder="Notes (optional)"
                {...form.register('notes')}
              />
            </div>

            {/* Error message */}
            {submitError && (
              <p className="text-center text-sm text-destructive">{submitError}</p>
            )}

            {/* 7. Submit button - always visible */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Transaction'
              )}
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}

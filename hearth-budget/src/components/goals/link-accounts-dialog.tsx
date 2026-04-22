'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { linkAccountsToGoal } from '@/app/actions/goals'

interface LinkAccountsDialogProps {
  goalId: string
  currentLinks: string[]
  accounts: Array<{ id: string; name: string; type: string }>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LinkAccountsDialog({
  goalId,
  currentLinks,
  accounts,
  open,
  onOpenChange,
}: LinkAccountsDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(currentLinks))
  const [isPending, startTransition] = useTransition()

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSave = () => {
    startTransition(async () => {
      const result = await linkAccountsToGoal(goalId, [...selected])
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Accounts linked')
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link accounts to this goal</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {accounts.map((acct) => (
            <button
              key={acct.id}
              onClick={() => toggle(acct.id)}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent"
            >
              <div>
                <span className="font-medium">{acct.name}</span>
                <span className="ml-2 text-muted-foreground capitalize">{acct.type}</span>
              </div>
              {selected.has(acct.id) && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
          {accounts.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No accounts available. Create an account first.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

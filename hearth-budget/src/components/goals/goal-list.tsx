'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Trash2, Link2, TrendingUp, Pause } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { LinkAccountsDialog } from './link-accounts-dialog'
import { deleteGoal, type GoalWithLinks } from '@/app/actions/goals'

interface GoalListProps {
  goals: GoalWithLinks[]
  balances: Record<string, number>
  accounts: Array<{ id: string; name: string; type: string; is_archived: boolean }>
}

function getGoalCurrentAmount(goal: GoalWithLinks, balances: Record<string, number>): number {
  const links = goal.goal_account_links ?? []
  if (links.length === 0) return 0
  return links.reduce((sum, l) => sum + (balances[l.account_id] ?? 0), 0)
}

export function GoalList({ goals, balances, accounts }: GoalListProps) {
  const [isPending, startTransition] = useTransition()
  const [linkGoalId, setLinkGoalId] = useState<string | null>(null)

  if (goals.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No goals yet. Create one from a template or set a custom target.
        </p>
      </div>
    )
  }

  const handleDelete = (goalId: string) => {
    startTransition(async () => {
      const result = await deleteGoal(goalId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Goal deleted')
      }
    })
  }

  return (
    <>
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Your goals</h2>
        {goals.map((goal) => {
          const current = getGoalCurrentAmount(goal, balances)
          const target = goal.target_amount
          const progress = target > 0
            ? Math.min(100, Math.round((current / target) * 100))
            : 0
          const isAchieved = current >= target && target > 0
          const links = goal.goal_account_links ?? []

          return (
            <Card key={goal.id} className={isAchieved ? 'border-green-500/50' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span className="font-medium">{goal.name}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setLinkGoalId(goal.id)}
                    >
                      <Link2 className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={<Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" />}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete goal?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete &quot;{goal.name}&quot; and its account links.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(goal.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">
                    ${current.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-muted-foreground">
                    of ${target.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    {isAchieved && ' ✓'}
                  </span>
                </div>
                <Progress
                  value={progress}
                  className={`h-2 ${isAchieved ? '[&>div]:bg-green-500' : ''}`}
                />

                {links.length > 0 && (
                  <div className="space-y-1">
                    {links.map((link) => {
                      const acct = link.accounts
                      const acctBalance = balances[link.account_id] ?? 0
                      const isDormant = acct?.contribution_status === 'dormant'
                      const isClosed = acct?.contribution_status === 'closed'

                      return (
                        <div
                          key={link.account_id}
                          className="flex items-center justify-between rounded bg-muted/50 px-2 py-1 text-xs"
                        >
                          <div className="flex items-center gap-1.5">
                            {isDormant ? (
                              <Pause className="h-3 w-3 text-amber-500" />
                            ) : isClosed ? (
                              <Pause className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <TrendingUp className="h-3 w-3 text-green-500" />
                            )}
                            <span>{acct?.name ?? 'Unknown'}</span>
                            {isDormant && (
                              <Badge variant="outline" className="h-4 px-1 text-[10px] text-amber-600 border-amber-300">
                                dormant
                              </Badge>
                            )}
                            {isClosed && (
                              <Badge variant="outline" className="h-4 px-1 text-[10px]">
                                closed
                              </Badge>
                            )}
                          </div>
                          <span className="tabular-nums">
                            ${acctBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {links.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No accounts linked — tap the link icon to track progress automatically.
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {linkGoalId && (
        <LinkAccountsDialog
          goalId={linkGoalId}
          currentLinks={goals.find((g) => g.id === linkGoalId)?.goal_account_links?.map((l) => l.account_id) ?? []}
          accounts={accounts.filter((a) => !a.is_archived)}
          open={!!linkGoalId}
          onOpenChange={(open) => !open && setLinkGoalId(null)}
        />
      )}
    </>
  )
}

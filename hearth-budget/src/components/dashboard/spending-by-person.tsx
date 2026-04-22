'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'
import type { PersonSpending } from '@/app/actions/budgets'

interface Props {
  people: PersonSpending[]
  currentUserId: string
}

export function SpendingByPerson({ people, currentUserId }: Props) {
  if (people.length === 0) return null

  const total = people.reduce((s, p) => s + p.spent, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          Spending this month
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {people.map((person) => {
          const pct = total > 0 ? Math.round((person.spent / total) * 100) : 0
          const label = person.userId === currentUserId ? 'You' : person.displayName
          return (
            <div key={person.userId} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{label}</span>
                <div className="flex items-center gap-2">
                  <span className="tabular-nums font-semibold">
                    ${person.spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
                    {pct}%
                  </span>
                </div>
              </div>
              <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full ${
                    person.userId === currentUserId
                      ? 'bg-primary'
                      : 'bg-primary/60'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {person.transactionCount} transaction{person.transactionCount !== 1 ? 's' : ''}
              </p>
            </div>
          )
        })}

        <div className="border-t pt-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Combined</span>
          <span className="font-bold tabular-nums">
            ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

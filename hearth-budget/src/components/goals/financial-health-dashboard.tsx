'use client'

import { Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { computeTemplateTarget } from '@/lib/goal-templates'
import type { GoalTemplate, GoalWithLinks } from '@/app/actions/goals'

interface FinancialHealthDashboardProps {
  templates: GoalTemplate[]
  goals: GoalWithLinks[]
  expenses: { monthly_average: number; months_of_data: number }
  profile: { annual_gross_income: number | null; primary_age: number | null; partner_age: number | null }
  balances: Record<string, number>
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: string }> = {
  safety: { label: 'Safety Net', icon: '🛡️' },
  housing: { label: 'Housing', icon: '🏠' },
  retirement: { label: 'Retirement', icon: '📈' },
  liquidity: { label: 'Liquidity', icon: '💧' },
  other: { label: 'Other', icon: '🎯' },
}

function getGoalProgress(goal: GoalWithLinks, balances: Record<string, number>): number {
  const links = goal.goal_account_links ?? []
  if (links.length === 0) return 0
  return links.reduce((sum, l) => sum + (balances[l.account_id] ?? 0), 0)
}

function CitationBadge({ citations }: { citations: GoalTemplate['source_citations'] }) {
  const primary = citations?.[0]
  if (!primary) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted/80">
          <Info className="h-3 w-3" />
          {primary.name}{primary.year ? ` ${primary.year}` : ''}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1 text-xs">
            {citations.map((c, i) => (
              <div key={i}>
                <span className="font-medium">{c.name}</span>
                {c.year && <span> ({c.year})</span>}
                {c.note && <p className="text-muted-foreground">{c.note}</p>}
                {c.url && (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Source
                  </a>
                )}
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function FinancialHealthDashboard({
  templates,
  goals,
  expenses,
  profile,
  balances,
}: FinancialHealthDashboardProps) {
  const categories = [...new Set(templates.map((t) => t.category))]

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Your financial picture</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => {
          const config = CATEGORY_CONFIG[cat] ?? { label: cat, icon: '🎯' }
          const catTemplates = templates.filter((t) => t.category === cat)
          const catGoals = goals.filter((g) =>
            catTemplates.some((t) => t.id === g.template_id)
          )

          // Find the primary template for this category (first by priority)
          const primaryTemplate = catTemplates[0]
          if (!primaryTemplate) return null

          const matchedGoal = catGoals[0]
          const computed = computeTemplateTarget(
            primaryTemplate.id,
            expenses.monthly_average,
            profile.annual_gross_income,
            profile.primary_age
          )

          let currentAmount = 0
          let targetAmount = matchedGoal?.target_amount ?? computed.target ?? 0

          if (matchedGoal) {
            currentAmount = getGoalProgress(matchedGoal, balances)
            targetAmount = matchedGoal.target_amount
          }

          const progress = targetAmount > 0
            ? Math.min(100, Math.round((currentAmount / targetAmount) * 100))
            : 0

          const needsProfile = computed.missing_fields?.length

          return (
            <Card key={cat} className="relative">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm font-medium">
                  <span>
                    {config.icon} {config.label}
                  </span>
                  <CitationBadge citations={primaryTemplate.source_citations} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {needsProfile ? (
                  <p className="text-xs text-muted-foreground">
                    Complete your profile to see this benchmark.
                  </p>
                ) : matchedGoal ? (
                  <>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-medium">
                        ${currentAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-muted-foreground">
                        of ${targetAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {computed.explanation}
                    </p>
                  </>
                ) : computed.target ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Target: ${computed.target.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {computed.explanation}
                    </p>
                    <p className="text-xs text-primary">
                      No goal created yet — use + to start tracking.
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {computed.explanation}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

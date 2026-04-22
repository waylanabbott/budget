import { PieChart } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function BudgetsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Budgets</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set monthly spending caps and track your pace.
        </p>
      </div>

      <Card>
        <CardHeader className="items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <PieChart className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription className="max-w-sm">
            Monthly budget caps per category with pace tracking — see if
            you&apos;re on track, ahead, or over at a glance. Copy last
            month&apos;s caps with one tap.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

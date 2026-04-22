'use client'

import { ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Reference = {
  id: string
  category: string
  name: string
  summary: string
  pros: string[] | null
  cons: string[] | null
  source_name: string
  source_url: string
  source_date: string | null
  updated_at: string
}

interface ReferenceCardsProps {
  references: Reference[]
  layout?: 'default' | 'comparison'
}

function SourceBadge({ reference }: { reference: Reference }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <a
        href={reference.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 hover:text-primary underline-offset-2 hover:underline"
      >
        {reference.source_name}
        <ExternalLink className="h-3 w-3" />
      </a>
      {reference.source_date ? (
        <span>verified {reference.source_date}</span>
      ) : (
        <Badge variant="outline" className="h-4 px-1 text-[10px] text-amber-600 border-amber-300">
          needs refresh
        </Badge>
      )}
    </div>
  )
}

function ReferenceCard({ reference }: { reference: Reference }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{reference.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{reference.summary}</p>

        {reference.pros && reference.pros.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-green-600">Pros</p>
            <ul className="space-y-0.5">
              {reference.pros.map((pro, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="text-green-500 mt-0.5 shrink-0">+</span>
                  {pro}
                </li>
              ))}
            </ul>
          </div>
        )}

        {reference.cons && reference.cons.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-red-600">Cons</p>
            <ul className="space-y-0.5">
              {reference.cons.map((con, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="text-red-500 mt-0.5 shrink-0">-</span>
                  {con}
                </li>
              ))}
            </ul>
          </div>
        )}

        <SourceBadge reference={reference} />
      </CardContent>
    </Card>
  )
}

export function ReferenceCards({ references, layout = 'default' }: ReferenceCardsProps) {
  if (references.length === 0) return null

  const gridClass =
    layout === 'comparison'
      ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid gap-3 sm:grid-cols-2'

  return (
    <div className={gridClass}>
      {references.map((ref) => (
        <ReferenceCard key={ref.id} reference={ref} />
      ))}
    </div>
  )
}

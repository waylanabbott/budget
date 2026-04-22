import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExternalLink } from 'lucide-react'

interface Source {
  name: string
  url: string
  note: string
}

export function SourceCitations({ sources }: { sources: Source[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Data Sources
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sources.map((source) => (
          <div key={source.name} className="text-xs">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              {source.name}
              <ExternalLink className="h-3 w-3" />
            </a>
            <p className="text-muted-foreground mt-0.5">{source.note}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

'use client'

interface ImportHistoryProps {
  imports: Array<{
    id: string
    filename: string
    row_count: number
    status: string
    errors: unknown
    created_at: string
  }>
}

export function ImportHistory({ imports: _imports }: ImportHistoryProps) {
  // Placeholder -- fully implemented in Task 2
  return <div>Loading import history...</div>
}

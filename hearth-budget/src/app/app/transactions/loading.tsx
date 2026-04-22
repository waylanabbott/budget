export default function TransactionsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-40 rounded bg-muted" />

      {/* Search + filters */}
      <div className="space-y-2">
        <div className="h-10 rounded-lg bg-muted" />
        <div className="flex gap-2">
          <div className="h-8 w-28 rounded-lg bg-muted" />
          <div className="h-8 w-28 rounded-lg bg-muted" />
          <div className="h-8 w-28 rounded-lg bg-muted" />
        </div>
      </div>

      {/* Transaction rows */}
      <div className="rounded-lg border">
        <div className="px-4 py-2 border-b">
          <div className="h-4 w-36 rounded bg-muted" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3 px-4 border-b last:border-b-0">
            <div className="flex items-center gap-3">
              <div className="size-2.5 rounded-full bg-muted" />
              <div>
                <div className="h-4 w-24 rounded bg-muted mb-1" />
                <div className="h-3 w-16 rounded bg-muted" />
              </div>
            </div>
            <div className="text-right">
              <div className="h-4 w-16 rounded bg-muted mb-1" />
              <div className="h-3 w-12 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

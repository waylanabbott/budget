export default function RecurringBillsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-44 rounded bg-muted" />
        <div className="h-4 w-80 rounded bg-muted mt-2" />
      </div>

      <div className="flex justify-between">
        <div className="h-4 w-48 rounded bg-muted" />
        <div className="h-8 w-24 rounded bg-muted" />
      </div>

      <div className="rounded-xl border">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0">
            <div>
              <div className="h-4 w-28 rounded bg-muted mb-1" />
              <div className="h-3 w-40 rounded bg-muted" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-16 rounded bg-muted" />
              <div className="h-6 w-6 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

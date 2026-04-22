export default function BudgetsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-28 rounded bg-muted" />
        <div className="h-4 w-56 rounded bg-muted mt-2" />
      </div>

      {/* Rollup cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="h-20 rounded-xl bg-muted" />
        <div className="h-20 rounded-xl bg-muted" />
        <div className="h-20 rounded-xl bg-muted" />
      </div>

      {/* Actions */}
      <div className="h-8 w-36 rounded bg-muted" />

      {/* Budget rows */}
      <div className="rounded-xl border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 px-4 py-3 border-b last:border-b-0">
            <div className="flex justify-between">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-4 w-16 rounded bg-muted" />
            </div>
            <div className="h-1.5 rounded-full bg-muted" />
            <div className="flex justify-between">
              <div className="h-3 w-16 rounded bg-muted" />
              <div className="h-3 w-20 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-56 rounded bg-muted" />

      {/* Person spending */}
      <div className="h-40 rounded-xl bg-muted" />

      {/* Budget + Runway row */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-52 rounded-xl bg-muted" />
        <div className="h-52 rounded-xl bg-muted" />
      </div>

      {/* Cash flow chart */}
      <div className="h-48 rounded-xl bg-muted" />

      {/* Goals */}
      <div className="h-6 w-20 rounded bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-24 rounded-xl bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
      </div>

      {/* Recent transactions */}
      <div className="h-6 w-40 rounded bg-muted" />
      <div className="space-y-0 rounded-xl border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3 px-4 border-b last:border-b-0">
            <div>
              <div className="h-4 w-28 rounded bg-muted mb-1" />
              <div className="h-3 w-20 rounded bg-muted" />
            </div>
            <div className="h-4 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}

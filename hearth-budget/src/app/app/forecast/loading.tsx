export default function ForecastLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-32 rounded bg-muted" />
        <div className="h-4 w-72 rounded bg-muted mt-2" />
      </div>

      {/* Income / Spent cards */}
      <div className="grid gap-3 grid-cols-2">
        <div className="h-24 rounded-xl bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
      </div>

      {/* Runway */}
      <div className="h-28 rounded-xl bg-muted" />

      {/* Category projections */}
      <div className="h-64 rounded-xl bg-muted" />

      {/* Cash flow chart */}
      <div className="h-80 rounded-xl bg-muted" />
    </div>
  )
}

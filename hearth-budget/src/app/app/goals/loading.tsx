export default function GoalsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div className="h-8 w-24 rounded bg-muted" />
        <div className="h-9 w-28 rounded bg-muted" />
      </div>

      {/* Financial health dashboard */}
      <div className="h-40 rounded-xl bg-muted" />

      {/* Goal cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}

'use client'

export default function TransactionsError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="space-y-4 py-12 text-center">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <button onClick={reset} className="text-sm underline">
        Try again
      </button>
    </div>
  )
}

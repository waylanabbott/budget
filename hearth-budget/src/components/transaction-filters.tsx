'use client'

import { useRef, useCallback, useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export type FilterState = {
  search: string
  account_id: string  // '' means all
  category_id: string // '' means all
  date_from: string   // '' means no start bound (YYYY-MM-DD)
  date_to: string     // '' means no end bound (YYYY-MM-DD)
}

export const EMPTY_FILTERS: FilterState = {
  search: '',
  account_id: '',
  category_id: '',
  date_from: '',
  date_to: '',
}

type AccountRow = {
  id: string
  name: string
  is_archived: boolean
}

type CategoryRow = {
  id: string
  name: string
  is_income: boolean
  archived_at: string | null
}

interface TransactionFiltersProps {
  accounts: AccountRow[]
  categories: CategoryRow[]
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
}

export function TransactionFilters({
  accounts,
  categories,
  filters,
  onFiltersChange,
}: TransactionFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce search input by 300ms
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value)
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(() => {
        onFiltersChange({ ...filters, search: value })
      }, 300)
    },
    [filters, onFiltersChange]
  )

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  // Count active filters (excluding search)
  const activeFilterCount = [
    filters.account_id,
    filters.category_id,
    filters.date_from,
    filters.date_to,
  ].filter(Boolean).length

  const activeAccounts = accounts.filter((a) => !a.is_archived)
  const activeCategories = categories.filter((c) => !c.archived_at)

  return (
    <div className="space-y-2">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Search merchants..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Filter row - horizontal scroll on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {/* Account filter */}
        <select
          value={filters.account_id}
          onChange={(e) =>
            onFiltersChange({ ...filters, account_id: e.target.value })
          }
          className="h-8 shrink-0 rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">All accounts</option>
          {activeAccounts.map((acct) => (
            <option key={acct.id} value={acct.id}>
              {acct.name}
            </option>
          ))}
        </select>

        {/* Category filter */}
        <select
          value={filters.category_id}
          onChange={(e) =>
            onFiltersChange({ ...filters, category_id: e.target.value })
          }
          className="h-8 shrink-0 rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">All categories</option>
          {activeCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Date range */}
        <Input
          type="date"
          value={filters.date_from}
          onChange={(e) =>
            onFiltersChange({ ...filters, date_from: e.target.value })
          }
          className="h-8 w-[130px] shrink-0 text-sm"
          aria-label="From date"
        />
        <Input
          type="date"
          value={filters.date_to}
          onChange={(e) =>
            onFiltersChange({ ...filters, date_to: e.target.value })
          }
          className="h-8 w-[130px] shrink-0 text-sm"
          aria-label="To date"
        />

        {/* Active filter indicator */}
        {activeFilterCount > 0 && (
          <span className="flex items-center shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
            {activeFilterCount}
          </span>
        )}
      </div>
    </div>
  )
}

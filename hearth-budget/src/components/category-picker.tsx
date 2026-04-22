'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { Database } from '@/types/database'

type CategoryRow = Database['public']['Tables']['categories']['Row']

interface CategoryPickerProps {
  categories: CategoryRow[]
  value: string | null
  onChange: (categoryId: string | null) => void
}

export function CategoryPicker({ categories, value, onChange }: CategoryPickerProps) {
  const [expanded, setExpanded] = React.useState(false)

  // Split into expense and income categories
  const expenseCategories = categories.filter((c) => !c.is_income && !c.archived_at)
  const incomeCategories = categories.filter((c) => c.is_income && !c.archived_at)

  // First 6 expense categories by sort_order (proxy for "recent")
  const recentCategories = expenseCategories.slice(0, 6)

  // Group all categories by parent for expanded view
  const parentCategories = categories.filter((c) => !c.parent_id && !c.archived_at)
  const childrenByParent = new Map<string, CategoryRow[]>()
  for (const cat of categories) {
    if (cat.parent_id && !cat.archived_at) {
      const existing = childrenByParent.get(cat.parent_id) ?? []
      existing.push(cat)
      childrenByParent.set(cat.parent_id, existing)
    }
  }

  function handleSelect(categoryId: string) {
    if (value === categoryId) {
      onChange(null) // Deselect
    } else {
      onChange(categoryId)
    }
  }

  return (
    <div className="space-y-2">
      {/* Recent categories grid */}
      <div className="grid grid-cols-3 gap-1.5 md:grid-cols-4">
        {recentCategories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleSelect(cat.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors',
              'hover:bg-muted',
              value === cat.id
                ? 'ring-2 ring-primary border-primary bg-primary/5'
                : 'border-border'
            )}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: cat.color ?? '#94A3B8' }}
            />
            <span className="truncate">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Expand/collapse button */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-center gap-1 rounded-md py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? (
          <>
            <ChevronUp className="h-3 w-3" />
            <span>Less categories</span>
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3" />
            <span>All categories</span>
          </>
        )}
      </button>

      {/* Expanded: all categories grouped by parent */}
      {expanded && (
        <div className="max-h-48 space-y-3 overflow-y-auto">
          {/* Expense categories */}
          {parentCategories
            .filter((p) => !p.is_income)
            .map((parent) => {
              const children = childrenByParent.get(parent.id) ?? []
              return (
                <div key={parent.id}>
                  {/* Parent as section header or selectable if no children */}
                  {children.length > 0 ? (
                    <>
                      <p className="mb-1 text-xs font-semibold text-muted-foreground">
                        {parent.name}
                      </p>
                      <div className="grid grid-cols-3 gap-1.5 pl-2 md:grid-cols-4">
                        {children.map((child) => (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => handleSelect(child.id)}
                            className={cn(
                              'flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors',
                              'hover:bg-muted',
                              value === child.id
                                ? 'ring-2 ring-primary border-primary bg-primary/5'
                                : 'border-border'
                            )}
                          >
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: child.color ?? '#94A3B8' }}
                            />
                            <span className="truncate">{child.name}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5 md:grid-cols-4">
                      <button
                        type="button"
                        onClick={() => handleSelect(parent.id)}
                        className={cn(
                          'flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors',
                          'hover:bg-muted',
                          value === parent.id
                            ? 'ring-2 ring-primary border-primary bg-primary/5'
                            : 'border-border'
                        )}
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: parent.color ?? '#94A3B8' }}
                        />
                        <span className="truncate">{parent.name}</span>
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

          {/* Income categories section */}
          {incomeCategories.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">
                Income
              </p>
              <div className="grid grid-cols-3 gap-1.5 md:grid-cols-4">
                {incomeCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelect(cat.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors',
                      'hover:bg-muted',
                      value === cat.id
                        ? 'ring-2 ring-primary border-primary bg-primary/5'
                        : 'border-border'
                    )}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: cat.color ?? '#94A3B8' }}
                    />
                    <span className="truncate">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

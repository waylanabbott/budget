'use client'

import { useState, useTransition } from 'react'
import { Pencil, Archive } from 'lucide-react'
import { toast } from 'sonner'

import { archiveCategory } from '@/app/actions/categories'
import type { Database } from '@/types/database'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { CategoryFormDialog } from '@/components/category-form-dialog'

type CategoryRow = Database['public']['Tables']['categories']['Row']

interface CategoryListProps {
  categories: CategoryRow[]
}

function CategoryRow({
  category,
  onEdit,
  isChild = false,
}: {
  category: CategoryRow
  onEdit: (category: CategoryRow) => void
  isChild?: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleArchiveConfirmed() {
    startTransition(async () => {
      const result = await archiveCategory(category.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`"${category.name}" archived`)
      }
    })
  }

  return (
    <>
      <div
        className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
          isChild ? 'pl-8' : ''
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="inline-block h-4 w-4 shrink-0 rounded-full"
            style={{ backgroundColor: category.color ?? '#6366F1' }}
          />
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium truncate">{category.name}</span>
            {category.icon && (
              <span className="text-xs text-muted-foreground truncate">
                {category.icon}
              </span>
            )}
            {category.is_income && (
              <span className="inline-flex items-center rounded-full bg-[var(--color-success)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-success)]">
                Income
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(category)}
            aria-label={`Edit ${category.name}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setConfirmOpen(true)}
            disabled={isPending}
            aria-label={`Archive ${category.name}`}
          >
            <Archive className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Archive "${category.name}"?`}
        description="This category will be hidden from new transactions."
        confirmLabel="Archive"
        variant="destructive"
        onConfirm={handleArchiveConfirmed}
      />
    </>
  )
}

export function CategoryList({ categories }: CategoryListProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null)

  // Separate active and archived categories
  const activeCategories = categories.filter((c) => !c.archived_at)
  const archivedCategories = categories.filter((c) => !!c.archived_at)

  // Group by parent_id for hierarchy
  const topLevel = activeCategories.filter((c) => c.parent_id === null)
  const childrenMap = new Map<string, CategoryRow[]>()
  for (const cat of activeCategories) {
    if (cat.parent_id) {
      const existing = childrenMap.get(cat.parent_id) ?? []
      existing.push(cat)
      childrenMap.set(cat.parent_id, existing)
    }
  }

  // Parent categories for the form (only active top-level)
  const parentCategories = activeCategories.filter((c) => c.parent_id === null)

  function handleEdit(category: CategoryRow) {
    setEditingCategory(category)
    setDialogOpen(true)
  }

  function handleNew() {
    setEditingCategory(null)
    setDialogOpen(true)
  }

  const [showArchived, setShowArchived] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Categories</h2>
        <Button onClick={handleNew} size="sm">
          New Category
        </Button>
      </div>

      {topLevel.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No custom categories. The default categories are ready to use.
        </p>
      ) : (
        <div className="space-y-1">
          {topLevel.map((parent) => (
            <div key={parent.id}>
              <CategoryRow category={parent} onEdit={handleEdit} />
              {childrenMap.get(parent.id)?.map((child) => (
                <CategoryRow
                  key={child.id}
                  category={child}
                  onEdit={handleEdit}
                  isChild
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {archivedCategories.length > 0 && (
        <div className="pt-4">
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>{showArchived ? '▼' : '▶'}</span>
            Archived ({archivedCategories.length})
          </button>
          {showArchived && (
            <div className="mt-2 space-y-1 opacity-60">
              {archivedCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-3 rounded-lg border border-dashed px-3 py-2"
                >
                  <span
                    className="inline-block h-4 w-4 shrink-0 rounded-full"
                    style={{ backgroundColor: cat.color ?? '#6366F1' }}
                  />
                  <span className="text-sm">{cat.name}</span>
                  {cat.icon && (
                    <span className="text-xs text-muted-foreground">{cat.icon}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <CategoryFormDialog
        category={editingCategory}
        parentCategories={parentCategories}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}

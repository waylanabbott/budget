import { getAllCategories } from '@/app/actions/categories'
import { CategoryList } from '@/components/category-list'

export default async function CategoriesPage() {
  const { data: categories, error } = await getAllCategories()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Organize your transactions with custom categories.
        </p>
      </div>

      {error ? (
        <p className="text-destructive">Failed to load categories: {error}</p>
      ) : (
        <CategoryList categories={categories ?? []} />
      )}
    </div>
  )
}

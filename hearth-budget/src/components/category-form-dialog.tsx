'use client'

import { useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { categorySchema, type CategoryInput } from '@/lib/schemas/categories'
import { createCategory, updateCategory } from '@/app/actions/categories'
import type { Database } from '@/types/database'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type CategoryRow = Database['public']['Tables']['categories']['Row']

interface CategoryFormDialogProps {
  category?: CategoryRow | null
  parentCategories: CategoryRow[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CategoryFormDialog({
  category,
  parentCategories,
  open,
  onOpenChange,
}: CategoryFormDialogProps) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!category

  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? '',
      parent_id: category?.parent_id ?? null,
      icon: category?.icon ?? '',
      color: category?.color ?? '#6366F1',
      is_income: category?.is_income ?? false,
    },
  })

  // Reset form when category changes (switching between edit targets)
  useEffect(() => {
    if (open) {
      form.reset({
        name: category?.name ?? '',
        parent_id: category?.parent_id ?? null,
        icon: category?.icon ?? '',
        color: category?.color ?? '#6366F1',
        is_income: category?.is_income ?? false,
      })
    }
  }, [category, open, form])

  function onSubmit(data: CategoryInput) {
    startTransition(async () => {
      const result = isEdit
        ? await updateCategory(category.id, data)
        : await createCategory(data)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(isEdit ? 'Category updated' : 'Category created')
      onOpenChange(false)
      form.reset()
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Category' : 'New Category'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Update your category details.'
              : 'Add a new category to organize your transactions.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 px-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Groceries" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Category</FormLabel>
                  <FormControl>
                    <select
                      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? null : e.target.value)
                      }
                    >
                      <option value="">None (top-level)</option>
                      {parentCategories
                        .filter((c) => c.parent_id === null)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. shopping-cart"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </FormControl>
                  <FormDescription>
                    Lucide icon name (e.g. home, car, utensils)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input
                        type="color"
                        className="h-8 w-12 cursor-pointer p-0.5"
                        value={field.value ?? '#6366F1'}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                      />
                    </FormControl>
                    <Input
                      className="flex-1"
                      placeholder="#6366F1"
                      value={field.value ?? '#6366F1'}
                      onChange={field.onChange}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_income"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border border-input accent-primary"
                        checked={field.value ?? false}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">
                      This is an income category
                    </FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? 'Saving...'
                  : isEdit
                    ? 'Update Category'
                    : 'Create Category'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

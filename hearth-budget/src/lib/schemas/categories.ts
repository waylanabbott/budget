import * as z from 'zod'

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, { error: 'Category name is required.' })
    .max(50, { error: 'Category name must be under 50 characters.' })
    .trim(),
  parent_id: z
    .string()
    .uuid({ error: 'Invalid parent category.' })
    .nullable()
    .optional(),
  icon: z
    .string()
    .max(50, { error: 'Icon name too long.' })
    .nullable()
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, { error: 'Color must be a hex value like #FF5733.' })
    .nullable()
    .optional(),
  is_income: z.boolean().optional(),
})

export type CategoryInput = z.infer<typeof categorySchema>

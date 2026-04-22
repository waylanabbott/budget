import * as z from 'zod'

// Date string in YYYY-MM-DD format (occurred_on is DATE type, never toISOString())
const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'Date must be YYYY-MM-DD format.' })

export const transactionSchema = z.object({
  amount: z
    .number()
    .positive({ error: 'Amount must be greater than zero.' })
    .multipleOf(0.01, { error: 'Amount must have at most 2 decimal places.' })
    .max(999999999.99, { error: 'Amount is too large.' }),
  account_id: z.string().uuid({ error: 'Please select an account.' }),
  category_id: z
    .string()
    .uuid({ error: 'Please select a category.' })
    .nullable()
    .optional(),
  occurred_on: dateStringSchema,
  merchant: z
    .string()
    .max(200, { error: 'Merchant name too long.' })
    .trim()
    .nullable()
    .optional(),
  notes: z
    .string()
    .max(500, { error: 'Notes must be under 500 characters.' })
    .trim()
    .nullable()
    .optional(),
})

export type TransactionInput = z.infer<typeof transactionSchema>

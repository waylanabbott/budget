import * as z from 'zod'

export const ACCOUNT_TYPES = ['checking', 'savings', 'credit_card', 'cash', 'retirement', 'investment'] as const
export type AccountType = (typeof ACCOUNT_TYPES)[number]

export const accountSchema = z.object({
  name: z
    .string()
    .min(1, { error: 'Account name is required.' })
    .max(100, { error: 'Account name must be under 100 characters.' })
    .trim(),
  type: z.enum(ACCOUNT_TYPES, { error: 'Select a valid account type.' }),
  starting_balance: z
    .number()
    .min(0, { error: 'Starting balance cannot be negative.' })
    .multipleOf(0.01, { error: 'Balance must have at most 2 decimal places.' }),
})

export type AccountInput = z.infer<typeof accountSchema>

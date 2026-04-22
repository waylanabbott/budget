import * as z from 'zod'

export const columnMappingSchema = z.object({
  date: z.number().int().min(0),
  amount: z.number().int().min(0).optional(),
  debit: z.number().int().min(0).optional(),
  credit: z.number().int().min(0).optional(),
  merchant: z.number().int().min(0).optional(),
  category: z.number().int().min(0).optional(),
  notes: z.number().int().min(0).optional(),
})

export type ColumnMapping = z.infer<typeof columnMappingSchema>

export const amountModeSchema = z.enum([
  'single_signed',
  'single_unsigned_expense',
  'debit_credit',
])

export type AmountMode = z.infer<typeof amountModeSchema>

export const importConfigSchema = z.object({
  account_id: z.string().uuid(),
  column_mapping: columnMappingSchema,
  amount_mode: amountModeSchema,
  date_format: z
    .enum(['MM/DD/YYYY', 'YYYY-MM-DD', 'M/D/YYYY', 'DD/MM/YYYY'])
    .default('MM/DD/YYYY'),
  skip_duplicates: z.boolean().default(true),
})

export type ImportConfig = z.infer<typeof importConfigSchema>

export const parsedCsvRowSchema = z.object({
  row_index: z.number().int(),
  occurred_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number(),
  merchant: z.string().nullable(),
  category_hint: z.string().nullable(),
  notes: z.string().nullable(),
  external_hash: z.string(),
  is_duplicate: z.boolean().default(false),
})

export type ParsedCsvRow = z.infer<typeof parsedCsvRowSchema>

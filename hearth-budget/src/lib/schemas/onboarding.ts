import * as z from 'zod'

export const INCOME_BRACKETS = [
  '<$15k',
  '$15-30k',
  '$30-40k',
  '$40-50k',
  '$50-70k',
  '$70-100k',
  '$100-150k',
  '$150k+',
] as const

export type IncomeBracket = (typeof INCOME_BRACKETS)[number]

export const householdNameSchema = z.object({
  name: z
    .string()
    .min(1, { error: 'Household name is required.' })
    .max(100, { error: 'Household name must be under 100 characters.' })
    .trim(),
})

export const locationSchema = z.object({
  zip: z
    .string()
    .regex(/^\d{5}$/, { error: 'Enter a valid 5-digit ZIP code.' }),
  metro: z.string().min(1, { error: 'Metro area is required.' }).trim(),
})

export const incomeBracketSchema = z.object({
  income_bracket: z.enum(INCOME_BRACKETS, {
    error: 'Please select an income bracket.',
  }),
})

export type HouseholdNameInput = z.infer<typeof householdNameSchema>
export type LocationInput = z.infer<typeof locationSchema>
export type IncomeBracketInput = z.infer<typeof incomeBracketSchema>

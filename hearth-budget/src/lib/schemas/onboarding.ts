import * as z from 'zod'


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

export const incomeSchema = z.object({
  income: z
    .string()
    .min(1, { error: 'Please enter your approximate annual income.' })
    .regex(/^\d+$/, { error: 'Enter a whole number without commas or symbols.' }),
})

export type HouseholdNameInput = z.infer<typeof householdNameSchema>
export type LocationInput = z.infer<typeof locationSchema>
export type IncomeInput = z.infer<typeof incomeSchema>

import * as z from 'zod'

export const signUpSchema = z.object({
  email: z.email({ error: 'Please enter a valid email address.' }).trim(),
  password: z
    .string()
    .min(8, { error: 'Password must be at least 8 characters.' })
    .trim(),
})

export const signInSchema = z.object({
  email: z.email({ error: 'Please enter a valid email address.' }).trim(),
  password: z.string().min(1, { error: 'Password is required.' }).trim(),
})

export const magicLinkSchema = z.object({
  email: z.email({ error: 'Please enter a valid email address.' }).trim(),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type MagicLinkInput = z.infer<typeof magicLinkSchema>

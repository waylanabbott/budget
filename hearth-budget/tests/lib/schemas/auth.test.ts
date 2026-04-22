import { describe, it, expect } from 'vitest'
import {
  signUpSchema,
  signInSchema,
  magicLinkSchema,
  type SignUpInput,
  type SignInInput,
  type MagicLinkInput,
} from '@/lib/schemas/auth'

describe('signUpSchema', () => {
  it('accepts valid email and password', () => {
    const result = signUpSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = signUpSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects password shorter than 8 characters', () => {
    const result = signUpSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
    })
    expect(result.success).toBe(false)
  })

  it('rejects whitespace-padded email (Zod v4: z.email validates before trim)', () => {
    // In Zod v4, z.email().trim() validates format first then trims on success
    // Whitespace-padded emails fail format check — this is correct behavior
    const result = signUpSchema.safeParse({
      email: '  user@example.com  ',
      password: 'password123',
    })
    expect(result.success).toBe(false)
  })
})

describe('signInSchema', () => {
  it('accepts valid email and password', () => {
    const result = signInSchema.safeParse({
      email: 'user@example.com',
      password: 'any',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty password', () => {
    const result = signInSchema.safeParse({
      email: 'user@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = signInSchema.safeParse({
      email: 'bad',
      password: 'password',
    })
    expect(result.success).toBe(false)
  })
})

describe('magicLinkSchema', () => {
  it('accepts valid email', () => {
    const result = magicLinkSchema.safeParse({ email: 'user@example.com' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = magicLinkSchema.safeParse({ email: 'not-valid' })
    expect(result.success).toBe(false)
  })

  it('rejects whitespace-padded email (Zod v4: z.email validates before trim)', () => {
    // In Zod v4, z.email().trim() validates format first then trims on success
    const result = magicLinkSchema.safeParse({ email: '  user@example.com  ' })
    expect(result.success).toBe(false)
  })
})

// Type inference test (compile-time only)
type _SignUpInput = SignUpInput
type _SignInInput = SignInInput
type _MagicLinkInput = MagicLinkInput

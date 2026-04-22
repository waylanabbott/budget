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

  it('trims email whitespace', () => {
    const result = signUpSchema.safeParse({
      email: '  user@example.com  ',
      password: 'password123',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('user@example.com')
    }
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

  it('trims email whitespace', () => {
    const result = magicLinkSchema.safeParse({ email: '  user@example.com  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('user@example.com')
    }
  })
})

// Type inference test (compile-time only)
type _SignUpInput = SignUpInput
type _SignInInput = SignInInput
type _MagicLinkInput = MagicLinkInput

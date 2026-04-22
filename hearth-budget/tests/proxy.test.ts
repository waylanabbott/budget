/**
 * Proxy auth guard unit tests (AUTH-05)
 *
 * The proxy function calls supabase.auth.getUser() which requires a live
 * Supabase connection. Full integration testing is done via manual smoke test.
 * These tests document expected behavior; integration tests go in e2e/.
 */
import { describe, it, expect } from 'vitest'

describe('proxy auth guard (AUTH-05)', () => {
  it.todo('unauthenticated GET /app/dashboard redirects to /login')
  it.todo('authenticated GET /app/dashboard passes through')
  it.todo('GET /login does not redirect authenticated users')
  it.todo('GET /api/* routes are not protected')
  it.todo('GET /_next/static/* is excluded from matcher')
})

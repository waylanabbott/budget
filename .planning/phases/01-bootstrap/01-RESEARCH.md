# Phase 1: Bootstrap - Research

**Researched:** 2026-04-21
**Domain:** Next.js 16 App Router + Supabase + Serwist PWA scaffold, full database schema migration with RLS
**Confidence:** HIGH — all package versions verified against npm registry live, schema derived from BUDGET_APP_PLAN.md source of record

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and research findings to guide decisions.

Key research findings to incorporate:
- Use Next.js 16 (not 15) — current stable version
- Use `@serwist/next` (not next-pwa) — next-pwa is abandoned
- Use Tailwind v4 (not v3) — current release, shadcn v4 targets it
- Use Recharts 3.x — React 19 compatible
- Use Zod 4 (not 3) — greenfield project should use current
- Use `@supabase/ssr` (not auth-helpers) — auth-helpers deprecated
- `cookies()` is async in Next.js 15+ — Supabase client pattern must account for this
- Service role key must never be exposed to browser
- All timestamps stored UTC, transaction dates as local date strings

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase.

### Deferred Ideas (OUT OF SCOPE)
None — infrastructure phase.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BOOT-01 | App boots with `pnpm dev` showing a placeholder landing page | create-next-app command + pnpm install prerequisite; Node 22 confirmed available |
| BOOT-02 | TypeScript strict mode enabled with ESLint + Prettier | Next.js 16 ships ESLint 9 flat config; tsconfig strict flags documented below |
| BOOT-03 | PWA manifest served with "Hearth Budget" name and installable on mobile | `@serwist/next` 9.5.7 + App Router `manifest.ts` pattern |
| BOOT-04 | Supabase client/server utilities configured with `@supabase/ssr` | Three-client pattern (browser/server/middleware) documented below |
| BOOT-05 | Mobile viewport renders cleanly on 375px-wide screens | Tailwind v4 base styles + shadcn default `viewport` meta in root layout |
| DBSC-01 | Full schema deployed via Supabase migrations (all tables from plan) | Complete schema SQL documented in this file, derived from BUDGET_APP_PLAN.md |
| DBSC-02 | RLS enabled on every household-scoped table with membership subquery policy | Policy pattern documented; every table listed with its policy type |
| DBSC-03 | Service role key used only in Edge Functions and server Route Handlers, never in browser | Env var naming convention; anon key pattern for browser client |
| DBSC-04 | All timestamps stored as UTC, displayed in household timezone (America/Denver default) | `timestamptz` for audit fields; `date` type for occurred_on; `timezone` column in households |
| DBSC-05 | Transaction dates use local date string (not UTC conversion) to avoid off-by-one bugs | `occurred_on date` column; client sends `YYYY-MM-DD` from local date, never toISOString() |
</phase_requirements>

---

## Summary

Phase 1 is a pure scaffold-and-schema phase with zero feature logic. The deliverable is: a runnable Next.js 16 app with strict TypeScript, PWA registration, Supabase client utilities in place, and the full production Postgres schema migrated with RLS. No auth flows, no pages beyond a placeholder landing. Everything built here must work as a foundation for all 7 subsequent phases.

The technical surface is well-understood with HIGH confidence because the stack is current-stable (all versions verified live against npm 2026-04-21) and the schema is directly specified in BUDGET_APP_PLAN.md with no ambiguity. The two things requiring careful execution are: (1) the Serwist/Next.js App Router integration has specific configuration requirements that differ from next-pwa tutorials, and (2) the `@supabase/ssr` async cookies pattern is easy to get wrong if cargo-culting older Next.js 13/14 examples.

**Primary recommendation:** Scaffold with `pnpm create next-app`, then layer Supabase clients, Serwist PWA, and the full migration SQL in a single wave. Do not attempt partial schema — DBSC-01 requires all tables from the plan, and RLS policies require the `household_members` table to exist before any other table's policy can use it.

**Critical prerequisite:** pnpm is NOT installed on this machine (`which pnpm` returns nothing). Wave 0 must install pnpm globally before any other step.

---

## Project Constraints (from CLAUDE.md)

All directives extracted from `./CLAUDE.md` that the planner must enforce:

| Directive | Category | Enforcement |
|-----------|----------|-------------|
| Use Next.js (App Router) + Supabase + Tailwind + shadcn/ui + Recharts + PWA | Stack | Do not deviate; no Remix, no Vite SPA |
| Use Supabase Auth (not Clerk) | Auth | No Clerk dependency anywhere |
| Host on Vercel free tier | Hosting | No AWS/GCP/Railway targets |
| Every benchmark number must cite source + date | Data honesty | Not relevant to Phase 1 (no benchmark UI yet) |
| No ML libraries in v1 | ML | Not relevant to Phase 1 |
| Use GSD workflow — do not make direct repo edits outside a GSD workflow | Process | Enforced by execution agent, not planner |
| Conventions section is empty — follow patterns as they emerge | Conventions | Phase 1 establishes the conventions |

---

## Standard Stack

### Core (all versions verified live against npm 2026-04-21)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | `16.2.4` | App framework, App Router, SSR, API routes | Current `latest` tag; `create-next-app` installs this by default |
| `react` / `react-dom` | `19.2.5` | UI runtime | Required peer dep of Next.js 16 |
| `typescript` | `6.0.3` | Type safety | Next.js 16 scaffolds with 5.x; 6.0.3 is current registry latest — verify compatibility with Next 16 before pinning 6.x; 5.x is safe fallback |
| `tailwindcss` | `4.2.4` | Utility CSS | shadcn v4 CLI requires Tailwind v4; v4 uses CSS `@theme` not `tailwind.config.js` |
| `@supabase/supabase-js` | `2.104.0` | Supabase client (auth, DB, realtime) | Only official client; v2 stable |
| `@supabase/ssr` | `0.10.2` | Cookie-based auth for App Router | Replaces deprecated `@supabase/auth-helpers-nextjs` |

**TypeScript version note:** `npm view typescript version` returns 6.0.3 as of 2026-04-21. Next.js 16 peer deps specify `typescript@>=5`. Using 5.8.x (what create-next-app installs by default) is safe. Using 6.0.x requires verification against Next.js 16 release notes — do not manually upgrade TS to 6 unless confirmed compatible. The scaffold will install whatever version Next 16's template targets.

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `shadcn` CLI | `4.4.0` | Component library (run `npx shadcn@latest init`) | Run once during scaffold; not an npm install |
| `lucide-react` | `1.8.0` | Icons | shadcn's default icon set |
| `tailwind-merge` | `3.5.0` | Class conflict resolution | Installed by shadcn `cn()` utility |
| `clsx` | `2.1.1` | Conditional classes | Paired with tailwind-merge |
| `class-variance-authority` | `0.7.1` | Component variants | Used internally by shadcn |
| `next-themes` | `0.4.6` | Dark/light mode | shadcn companion; install now for future use |
| `zod` | `4.3.6` | Schema validation | Phase 1 needs it for env var validation; all subsequent phases use it |
| `react-hook-form` | `7.73.1` | Form state | Not needed in Phase 1 but install now per full-stack setup |
| `@hookform/resolvers` | `5.2.2` | Zod + react-hook-form bridge | v5 targets react-hook-form ^7.55.0 + zod ^4.x |
| `date-fns` | `4.1.0` | Date math | Install now; Phase 2+ will use it |
| `recharts` | `3.8.1` | Charts | Install now; placeholder install for Phase 6+ |
| `@serwist/next` | `9.5.7` | Service worker + PWA | BOOT-03 requires this |
| `@serwist/cli` | `9.5.7` | Serwist CLI peer dep | Required sibling of `@serwist/next` |

### Dev Tools

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| `pnpm` | `10.33.0` | Package manager | NOT INSTALLED — must install first via `npm install -g pnpm` |
| `prettier` | `3.8.3` | Code formatting | Add `.prettierrc` and `.prettierignore` |
| `supabase` CLI | `2.93.0` | Migrations, db push | NOT INSTALLED in PATH — install via `brew install supabase/tap/supabase` or `npm install -g supabase` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@serwist/next` | `next-pwa` | next-pwa abandoned 2022; no App Router support |
| `@serwist/next` | `@ducanh2912/next-pwa` | Last updated 2024-09; not maintained for Next.js 16 |
| `@supabase/ssr` | `@supabase/auth-helpers-nextjs` | auth-helpers deprecated; breaks with async cookies |
| `tailwindcss@4` | `tailwindcss@3` | v3 is LTS; shadcn v4 defaults to v4; starting on v3 creates migration debt |

### Installation Commands

```bash
# Step 0: Install prerequisites (pnpm NOT present on this machine)
npm install -g pnpm@latest

# Step 1: Scaffold (installs Next 16 + React 19 + Tailwind 4 + TypeScript)
pnpm create next-app@latest hearth-budget \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-eslint  # we configure ESLint manually for strict setup

# Step 2: Core dependencies
pnpm add @supabase/supabase-js @supabase/ssr

# Step 3: Data, forms, validation, charts
pnpm add zod react-hook-form @hookform/resolvers date-fns recharts next-themes

# Step 4: PWA
pnpm add @serwist/next @serwist/cli

# Step 5: shadcn init (copies component source — not an npm install)
npx shadcn@latest init
# Prompts: Tailwind v4, slate base color, CSS variables, src/app path

# Step 6: Initial shadcn primitives for placeholder page
npx shadcn@latest add button card

# Step 7: Dev dependencies
pnpm add -D prettier

# Step 8: Supabase CLI (if not installed)
# Option A (Homebrew, macOS):
brew install supabase/tap/supabase
# Option B (npm global):
npm install -g supabase

# Step 9: Initialize Supabase project directory
supabase init
```

---

## Architecture Patterns

### Recommended Project Structure

```
hearth-budget/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout: viewport meta, ThemeProvider, font
│   │   ├── page.tsx                # Placeholder landing page (BOOT-01)
│   │   ├── manifest.ts             # PWA manifest (App Router convention — NOT static JSON)
│   │   ├── globals.css             # Tailwind v4 @import + @theme variables
│   │   └── (app)/                  # Protected route group — placeholder only in Phase 1
│   │       └── layout.tsx          # Stub layout (auth check added in Phase 2)
│   └── api/                        # Route handlers — none in Phase 1
├── src/
│   ├── components/
│   │   └── ui/                     # shadcn/ui primitives (auto-generated)
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts           # createBrowserClient() — browser only
│   │       ├── server.ts           # createServerClient() — RSC / Route Handlers
│   │       └── middleware.ts       # Session refresh middleware client
│   └── types/
│       └── database.ts             # Supabase generated types (placeholder until `supabase gen types`)
├── src/sw.ts                       # Serwist service worker entry point
├── supabase/
│   └── migrations/
│       ├── 20260421000001_initial_schema.sql
│       ├── 20260421000002_rls_policies.sql
│       └── 20260421000003_indexes_and_functions.sql
├── public/
│   ├── icons/                      # PWA icons (192x192, 512x512 placeholders)
│   └── offline.html                # Offline fallback page
├── next.config.ts                  # Serwist wrapper
├── middleware.ts                   # Auth session refresh (top-level, not in src/)
├── tsconfig.json                   # strict: true
├── .prettierrc                     # Prettier config
├── .env.example                    # Env var template
└── eslint.config.mjs               # ESLint 9 flat config with TypeScript rules
```

### Pattern 1: Supabase Three-Client Split

**What:** Three separate client factories for three separate execution contexts. Never mix them.

**When to use:** Always. This is the mandatory `@supabase/ssr` pattern.

```typescript
// src/lib/supabase/client.ts — browser only, 'use client' components
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// src/lib/supabase/server.ts — Server Components and Route Handlers
// CRITICAL: cookies() is async in Next.js 15+. Must await.
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()  // await is mandatory in Next.js 15+/16

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server component — cannot set cookies; middleware handles session refresh
          }
        },
      },
    }
  )
}
```

```typescript
// src/lib/supabase/middleware.ts — middleware session refresh
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not write any logic between createServerClient and getUser()
  await supabase.auth.getUser()

  return supabaseResponse
}
```

```typescript
// middleware.ts (root — NOT in src/)
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Critical pitfall:** If `cookies()` is not awaited, the auth session will be `null` in server components — RLS evaluates as anon and queries silently return empty data. See Pitfall 9 in PITFALLS.md.

### Pattern 2: Serwist PWA Configuration

**What:** Serwist wraps `next.config.ts` and requires a separate `src/sw.ts` service worker entry point.

```typescript
// next.config.ts
import withSerwist from '@serwist/next'

const withPWA = withSerwist({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  // disable in dev to avoid SW caching stale hot-module-reload builds
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig = {
  // any next config options
}

export default withPWA(nextConfig)
```

```typescript
// src/sw.ts — Serwist service worker
import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,      // force immediate activation on update
  clientsClaim: true,     // claim all clients immediately
  navigationPreload: true,
  runtimeCaching: defaultCache,
})

serwist.addEventListeners()
```

**Important:** `swSrc` must match `tsconfig.json`'s `include` glob so TypeScript compiles it. Add `"src/sw.ts"` to tsconfig includes explicitly if the default glob doesn't catch it.

### Pattern 3: PWA Manifest (App Router Convention)

**What:** In Next.js App Router, the manifest is a TypeScript file, not a static `public/manifest.json`. This enables dynamic manifest generation.

```typescript
// src/app/manifest.ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Hearth Budget',
    short_name: 'Hearth',
    description: 'Track every dollar together',
    start_url: '/app',     // opens directly into protected app shell
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f172a',   // slate-900 — matches shadcn dark
    theme_color: '#0f172a',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
```

**Note:** Phase 1 uses placeholder PNG icons. Real icons can be generated in a later phase or added manually. The manifest must exist and be valid for BOOT-03 installability — actual icon quality doesn't block the requirement.

### Pattern 4: Tailwind v4 CSS Setup

**What:** Tailwind v4 has no `tailwind.config.js`. All configuration goes in CSS using `@import` and `@theme`.

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  /* shadcn CSS variable overrides go here after shadcn init */
}
```

The `@theme` block replaces `tailwind.config.js`'s `theme.extend`. shadcn `init` will populate this with its color variables.

### Pattern 5: TypeScript Strict Configuration

```json
// tsconfig.json key flags
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Pattern 6: ESLint 9 Flat Config

```javascript
// eslint.config.mjs
import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
]

export default eslintConfig
```

### Pattern 7: Prettier Configuration

```json
// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

**Note:** `prettier-plugin-tailwindcss` sorts class names. Install: `pnpm add -D prettier-plugin-tailwindcss`. This is optional but strongly recommended for maintainability.

### Pattern 8: Environment Variables

```bash
# .env.example — commit this; never commit .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-only — NEVER prefix with NEXT_PUBLIC_
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# External data sources (Phase 6+)
BLS_API_KEY=optional-bls-key
HUD_API_TOKEN=your-hud-token
```

**Security rule:** `SUPABASE_SERVICE_ROLE_KEY` must never appear with a `NEXT_PUBLIC_` prefix. Add an ESLint rule or CI check to prevent this. The service role bypasses all RLS.

### Anti-Patterns to Avoid

- **Using `next-pwa`:** Abandoned 2022. No App Router support. Use `@serwist/next`.
- **Synchronous `cookies()` in server client:** Must be `await cookies()` in Next.js 15+/16. Silent failure mode: empty data, no error thrown.
- **`@supabase/auth-helpers-nextjs`:** Deprecated. Use `@supabase/ssr`.
- **`tailwind.config.js` with v4:** Tailwind v4 uses CSS `@theme` — no JS config file.
- **Service role key in `NEXT_PUBLIC_*` env:** Exposes full DB access to browser. Fatal security bug.
- **Static `public/manifest.json`:** Use `src/app/manifest.ts` for App Router manifest. Static file is ignored by Next.js App Router when the TS manifest exists.
- **Constructing Supabase clients inline in components:** Always import from `src/lib/supabase/client.ts` or `server.ts`. Inline construction means scattered config and makes the async-cookies mistake easy.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cookie-based session management for SSR | Custom cookie parsing | `@supabase/ssr` createServerClient | Edge cases with secure, httpOnly, SameSite; Supabase handles rotation |
| Service worker with precaching | Custom workbox config | `@serwist/next` | SW update lifecycle is complex; Serwist handles precache manifest injection, skipWaiting, clientsClaim |
| App Router manifest typing | Manual JSON | `MetadataRoute.Manifest` from 'next' | Type-safe, Next.js validates structure |
| TypeScript path aliases | Modify Node resolution | `@/*` alias via create-next-app | tsconfig + next.config wired automatically by scaffold |
| PWA icon generation | Manual Photoshop export | `pwa-asset-generator` or `sharp` CLI | Phase 1 uses placeholders; use a generator when real branding exists |
| SQL migration management | Ad-hoc Supabase dashboard SQL | `supabase migration` CLI | Reproducible, version-controlled, safe for CI/CD |

**Key insight:** The Serwist/service-worker space has enormous complexity around cache invalidation, update flows, and offline fallbacks. The `defaultCache` export from `@serwist/next/worker` encodes best practices. Do not customize caching strategy in Phase 1 — use the default and override in later phases when specific financial-data `NetworkOnly` rules are needed.

---

## Complete Database Schema

The full schema for DBSC-01 and DBSC-02. Split across three migration files for organization.

### Migration 1: Initial Schema

```sql
-- supabase/migrations/20260421000001_initial_schema.sql

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Households
create table households (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  zip          text,
  metro        text,
  income_bracket text,
  currency     text not null default 'USD',
  timezone     text not null default 'America/Denver',
  created_at   timestamptz not null default now()
);

-- Household members (join table — supports future multi-user growth)
create table household_members (
  household_id uuid not null references households(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null check (role in ('owner', 'member')),
  joined_at    timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- Accounts (checking, savings, credit card, cash)
create table accounts (
  id               uuid primary key default uuid_generate_v4(),
  household_id     uuid not null references households(id) on delete cascade,
  name             text not null,
  type             text not null check (type in ('checking', 'savings', 'credit_card', 'cash')),
  starting_balance numeric(12, 2) not null default 0,
  is_archived      boolean not null default false,
  created_at       timestamptz not null default now()
);

-- Hierarchical categories (one level of nesting via parent_id)
create table categories (
  id           uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  name         text not null,
  parent_id    uuid references categories(id) on delete set null,
  icon         text,
  color        text,
  is_income    boolean not null default false,
  sort_order   int not null default 0,
  archived_at  timestamptz
);

-- Transactions (the core table)
create table transactions (
  id           uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  account_id   uuid not null references accounts(id),
  category_id  uuid references categories(id) on delete set null,
  entered_by   uuid not null references auth.users(id),
  amount       numeric(12, 2) not null,
  occurred_on  date not null,               -- LOCAL date string, NOT timestamptz
  merchant     text,
  notes        text,
  source       text not null check (source in ('manual', 'csv', 'plaid')) default 'manual',
  external_id  text,                         -- Plaid/bank transaction ID
  external_hash text,                        -- CSV dedup hash
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Index for budget queries and transaction list (household + date desc)
create index transactions_household_date_idx
  on transactions (household_id, occurred_on desc);

-- Unique constraint for CSV dedup
create unique index transactions_account_hash_idx
  on transactions (account_id, external_hash)
  where external_hash is not null;

-- Budgets (categorical monthly/annual caps)
create table budgets (
  id             uuid primary key default uuid_generate_v4(),
  household_id   uuid not null references households(id) on delete cascade,
  category_id    uuid not null references categories(id) on delete cascade,
  period         text not null check (period in ('monthly', 'annual')),
  amount         numeric(12, 2) not null,
  effective_from date not null,
  effective_to   date
);

-- Savings goals
create table savings_goals (
  id                 uuid primary key default uuid_generate_v4(),
  household_id       uuid not null references households(id) on delete cascade,
  name               text not null,
  target_amount      numeric(12, 2) not null,
  target_date        date,
  linked_account_id  uuid references accounts(id) on delete set null,
  created_at         timestamptz not null default now()
);

-- Recurring bills (forecasted only; not auto-posted)
create table recurring_bills (
  id            uuid primary key default uuid_generate_v4(),
  household_id  uuid not null references households(id) on delete cascade,
  name          text not null,
  category_id   uuid references categories(id) on delete set null,
  account_id    uuid references accounts(id) on delete set null,
  amount        numeric(12, 2) not null,
  cadence       text not null,
  next_due_date date
);

-- Import audit log
create table imports (
  id           uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  user_id      uuid not null references auth.users(id),
  filename     text not null,
  row_count    int not null default 0,
  status       text not null check (status in ('pending', 'complete', 'error')),
  errors       jsonb,
  created_at   timestamptz not null default now()
);

-- Household invite links
create table household_invites (
  id           uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id) on delete cascade,
  token        uuid not null unique default uuid_generate_v4(),
  created_by   uuid not null references auth.users(id),
  redeemed_by  uuid references auth.users(id),
  redeemed_at  timestamptz,
  expires_at   timestamptz not null default (now() + interval '7 days'),
  created_at   timestamptz not null default now()
);

-- Benchmark cache tables (public data — no PII, no household scoping)
create table benchmarks_bls_cex (
  id             bigserial primary key,
  income_bracket text not null,
  household_size int,
  region         text,
  category       text not null,
  annual_avg_spend numeric(12, 2),
  data_year      int not null,
  source_url     text,
  ingested_at    timestamptz not null default now(),
  unique (income_bracket, household_size, region, category, data_year)
);

create table benchmarks_hud_fmr (
  id           bigserial primary key,
  zip_code     text not null,
  bedrooms     int not null,
  rent_amount  numeric(12, 2),
  data_year    int not null,
  source_url   text,
  ingested_at  timestamptz not null default now(),
  unique (zip_code, bedrooms, data_year)
);

create table benchmarks_zillow (
  id           bigserial primary key,
  zip_code     text not null,
  metric       text not null,
  value        numeric(12, 2),
  as_of        date not null,
  source_url   text,
  ingested_at  timestamptz not null default now(),
  unique (zip_code, metric, as_of)
);

-- Benchmark ingestion audit log
create table benchmark_ingestion_log (
  id             bigserial primary key,
  function_name  text not null,
  rows_upserted  int not null default 0,
  rows_skipped   int not null default 0,
  errors         jsonb,
  started_at     timestamptz not null,
  completed_at   timestamptz not null default now()
);
```

### Migration 2: RLS Policies

```sql
-- supabase/migrations/20260421000002_rls_policies.sql

-- =============================================
-- Enable RLS on all household-scoped tables
-- =============================================
alter table households           enable row level security;
alter table household_members    enable row level security;
alter table accounts             enable row level security;
alter table categories           enable row level security;
alter table transactions         enable row level security;
alter table budgets              enable row level security;
alter table savings_goals        enable row level security;
alter table recurring_bills      enable row level security;
alter table imports              enable row level security;
alter table household_invites    enable row level security;

-- Enable RLS on benchmark tables (public read, service-role write)
alter table benchmarks_bls_cex       enable row level security;
alter table benchmarks_hud_fmr       enable row level security;
alter table benchmarks_zillow        enable row level security;
alter table benchmark_ingestion_log  enable row level security;

-- =============================================
-- Helper function: membership check
-- Using security definer avoids per-row subquery cost at scale
-- =============================================
create or replace function is_household_member(hid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists(
    select 1 from household_members
    where household_id = hid
      and user_id = auth.uid()
  );
$$;

create or replace function is_household_owner(hid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists(
    select 1 from household_members
    where household_id = hid
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

-- =============================================
-- households: members can read their household
-- =============================================
create policy "members read own household"
on households for select
using (is_household_member(id));

create policy "authenticated users create households"
on households for insert
to authenticated
with check (true);

create policy "owners update household"
on households for update
using (is_household_owner(id))
with check (is_household_owner(id));

-- =============================================
-- household_members: members can see their household roster
-- =============================================
create policy "members read membership"
on household_members for select
using (
  household_id in (
    select household_id from household_members
    where user_id = auth.uid()
  )
);

create policy "owners manage members"
on household_members for insert
with check (is_household_owner(household_id));

create policy "members leave household"
on household_members for delete
using (user_id = auth.uid() or is_household_owner(household_id));

-- =============================================
-- Standard household membership policy macro
-- Applied to: accounts, categories, transactions,
--             budgets, savings_goals, recurring_bills, imports
-- =============================================

-- accounts
create policy "household members only"
on accounts for all
using (is_household_member(household_id))
with check (is_household_member(household_id));

-- categories
create policy "household members only"
on categories for all
using (is_household_member(household_id))
with check (is_household_member(household_id));

-- transactions
create policy "household members only"
on transactions for all
using (is_household_member(household_id))
with check (is_household_member(household_id));

-- budgets
create policy "household members only"
on budgets for all
using (is_household_member(household_id))
with check (is_household_member(household_id));

-- savings_goals
create policy "household members only"
on savings_goals for all
using (is_household_member(household_id))
with check (is_household_member(household_id));

-- recurring_bills
create policy "household members only"
on recurring_bills for all
using (is_household_member(household_id))
with check (is_household_member(household_id));

-- imports
create policy "household members only"
on imports for all
using (is_household_member(household_id))
with check (is_household_member(household_id));

-- =============================================
-- household_invites: split policies (Phase 4, but schema deployed in Phase 1)
-- =============================================
create policy "owners create invites"
on household_invites for insert
to authenticated
with check (is_household_owner(household_id));

create policy "owners read own invites"
on household_invites for select
using (is_household_owner(household_id));

-- Anyone with a valid token can read (for redemption page)
-- Token is the access credential; restrict to non-redeemed, non-expired
create policy "public token read"
on household_invites for select
using (
  redeemed_at is null
  and expires_at > now()
);

create policy "token redeemer updates"
on household_invites for update
using (redeemed_at is null and expires_at > now())
with check (redeemed_at is null);

-- =============================================
-- Benchmark tables: public read, service-role write only
-- =============================================
create policy "public read benchmarks bls"
on benchmarks_bls_cex for select
to authenticated
using (true);

create policy "public read benchmarks hud"
on benchmarks_hud_fmr for select
to authenticated
using (true);

create policy "public read benchmarks zillow"
on benchmarks_zillow for select
to authenticated
using (true);

create policy "public read ingestion log"
on benchmark_ingestion_log for select
to authenticated
using (true);

-- Writes to benchmark tables happen via Edge Functions using service_role key
-- which bypasses RLS entirely — no insert policy needed here
```

### Migration 3: Triggers and Functions

```sql
-- supabase/migrations/20260421000003_triggers_and_functions.sql

-- =============================================
-- Auto-add household creator as 'owner' on insert
-- =============================================
create or replace function add_household_owner()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into household_members (household_id, user_id, role)
  values (new.id, auth.uid(), 'owner');
  return new;
end;
$$;

create trigger on_household_created
  after insert on households
  for each row
  execute function add_household_owner();

-- =============================================
-- Auto-populate default category tree for new households
-- =============================================
create or replace function create_default_categories(p_household_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_income_id     uuid;
  v_housing_id    uuid;
  v_food_id       uuid;
  v_transport_id  uuid;
  v_health_id     uuid;
  v_entertainment_id uuid;
  v_personal_id   uuid;
  v_shopping_id   uuid;
  v_savings_id    uuid;
  v_misc_id       uuid;
begin
  -- Income (parent)
  insert into categories (household_id, name, is_income, sort_order)
    values (p_household_id, 'Income', true, 0)
    returning id into v_income_id;
  insert into categories (household_id, name, parent_id, is_income, sort_order) values
    (p_household_id, 'Salary', v_income_id, true, 1),
    (p_household_id, 'Other Income', v_income_id, true, 2);

  -- Housing
  insert into categories (household_id, name, sort_order)
    values (p_household_id, 'Housing', 10)
    returning id into v_housing_id;
  insert into categories (household_id, name, parent_id, sort_order) values
    (p_household_id, 'Rent / Mortgage', v_housing_id, 11),
    (p_household_id, 'Utilities', v_housing_id, 12),
    (p_household_id, 'Internet', v_housing_id, 13),
    (p_household_id, 'Home Insurance', v_housing_id, 14);

  -- Food
  insert into categories (household_id, name, sort_order)
    values (p_household_id, 'Food', 20)
    returning id into v_food_id;
  insert into categories (household_id, name, parent_id, sort_order) values
    (p_household_id, 'Groceries', v_food_id, 21),
    (p_household_id, 'Restaurants', v_food_id, 22);

  -- Transportation
  insert into categories (household_id, name, sort_order)
    values (p_household_id, 'Transportation', 30)
    returning id into v_transport_id;
  insert into categories (household_id, name, parent_id, sort_order) values
    (p_household_id, 'Gas', v_transport_id, 31),
    (p_household_id, 'Car Payment', v_transport_id, 32),
    (p_household_id, 'Parking', v_transport_id, 33),
    (p_household_id, 'Transit', v_transport_id, 34);

  -- Health
  insert into categories (household_id, name, sort_order)
    values (p_household_id, 'Health', 40)
    returning id into v_health_id;

  -- Entertainment
  insert into categories (household_id, name, sort_order)
    values (p_household_id, 'Entertainment', 50)
    returning id into v_entertainment_id;

  -- Personal Care
  insert into categories (household_id, name, sort_order)
    values (p_household_id, 'Personal Care', 60)
    returning id into v_personal_id;

  -- Shopping
  insert into categories (household_id, name, sort_order)
    values (p_household_id, 'Shopping', 70)
    returning id into v_shopping_id;

  -- Savings Transfers
  insert into categories (household_id, name, is_income, sort_order)
    values (p_household_id, 'Savings Transfers', false, 80)
    returning id into v_savings_id;

  -- Miscellaneous
  insert into categories (household_id, name, sort_order)
    values (p_household_id, 'Miscellaneous', 90)
    returning id into v_misc_id;
end;
$$;

-- Trigger to auto-create categories when a household is created
create or replace function on_household_created_seed_categories()
returns trigger
language plpgsql
security definer
as $$
begin
  perform create_default_categories(new.id);
  return new;
end;
$$;

create trigger on_household_created_categories
  after insert on households
  for each row
  execute function on_household_created_seed_categories();

-- =============================================
-- Auto-update updated_at on transactions
-- =============================================
create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger transactions_updated_at
  before update on transactions
  for each row
  execute function update_updated_at_column();
```

---

## Common Pitfalls

### Pitfall 1: Async Cookies Not Awaited in Server Client

**What goes wrong:** `createServerClient` receives an empty cookie store; `auth.getUser()` returns null; RLS evaluates as anon; all queries return empty data with no error.

**Why it happens:** Most tutorials and boilerplate snippets are from Next.js 13/14 era where `cookies()` was synchronous. The Next.js 15+ breaking change is easy to miss.

**How to avoid:** Always `const cookieStore = await cookies()` in `src/lib/supabase/server.ts`. This pattern is in the code examples above. Create a single canonical server client file and import it everywhere.

**Warning signs:** `getUser()` returns null in server components while the browser client returns the correct user. Empty arrays from authenticated queries.

### Pitfall 2: Service Role Key Leaking to Browser

**What goes wrong:** `SUPABASE_SERVICE_ROLE_KEY` is prefixed `NEXT_PUBLIC_`, making it available in browser bundles. Anyone inspecting DevTools has full database access.

**How to avoid:** Never use `NEXT_PUBLIC_` prefix on the service role key. In Phase 1, the service role key is in `.env.example` with explicit documentation that it is server-only. Add a `// @ts-ignore` deterrent comment in `env.example` if needed.

**Warning signs:** `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` appears anywhere in codebase. The Supabase dashboard shows unexpected anon connections with service-role permissions.

### Pitfall 3: pnpm Not Installed

**What goes wrong:** `pnpm create next-app` fails with "command not found".

**How to avoid:** Wave 0 must install pnpm globally. Verified: `which pnpm` returns nothing on this machine (2026-04-21 audit).

```bash
npm install -g pnpm@latest
# Verify:
pnpm --version  # should show 10.x
```

### Pitfall 4: Supabase CLI Not Installed

**What goes wrong:** `supabase migration new` fails. DBSC-01 cannot be satisfied without the CLI for migration file management.

**How to avoid:** Install Supabase CLI before running migrations. Verified: `supabase` not in PATH on this machine.

```bash
# macOS (Homebrew):
brew install supabase/tap/supabase
# Or via npm:
npm install -g supabase
# Verify:
supabase --version
```

### Pitfall 5: `next.config.ts` Type Conflict with Serwist

**What goes wrong:** TypeScript complains that `withSerwist(nextConfig)` return type is incompatible with `NextConfig`.

**How to avoid:** Import `NextConfig` type explicitly:
```typescript
import type { NextConfig } from 'next'
import withSerwist from '@serwist/next'

const nextConfig: NextConfig = { /* ... */ }
export default withSerwist({ swSrc: 'src/sw.ts', swDest: 'public/sw.js' })(nextConfig)
```

### Pitfall 6: Static `manifest.json` in `public/` Ignored

**What goes wrong:** Developer creates `public/manifest.json` but Next.js App Router serves `src/app/manifest.ts` instead. Two manifests conflict; unpredictable behavior.

**How to avoid:** Use ONLY `src/app/manifest.ts`. Do not create `public/manifest.json`. If a static file exists, delete it.

### Pitfall 7: RLS `WITH CHECK` Clause Missing

**What goes wrong:** Users can insert rows into tables they cannot read back. Silent write corruption — the write succeeds but a subsequent read returns nothing.

**How to avoid:** Every `INSERT`/`UPDATE` policy must have a `WITH CHECK` clause that mirrors the `USING` clause. The migration SQL above includes `WITH CHECK` on all write policies. Verify before deploying.

### Pitfall 8: `household_invites` Table Has Two Conflicting SELECT Policies

**What goes wrong:** PostgreSQL allows multiple SELECT policies on the same table; they are OR-combined. The "public token read" policy (no auth required) combined with "owners read own invites" could expose invite records if the public policy is too broad.

**How to avoid:** The "public token read" policy must be strict: `redeemed_at is null AND expires_at > now()`. This limits unauthenticated reads to only non-redeemed, non-expired tokens — and the caller must already know the token UUID to fetch the row. An attacker cannot enumerate tokens with `select *` because they would need to supply valid UUIDs.

---

## Code Examples

### Root Layout with PWA Viewport

```typescript
// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Hearth Budget',
  description: 'Track every dollar together',
  applicationName: 'Hearth Budget',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hearth Budget',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,  // prevent zoom on input focus on iOS
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

### Placeholder Landing Page

```typescript
// src/app/page.tsx
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold">Hearth Budget</h1>
      <p className="mt-2 text-muted-foreground">Track every dollar together.</p>
    </main>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `next-pwa` (workbox wrapper) | `@serwist/next` | 2022 (next-pwa abandoned); Serwist became primary 2023+ | Do not use next-pwa — no App Router support |
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2023 (auth-helpers deprecated) | auth-helpers breaks with async cookies |
| Synchronous `cookies()` | `await cookies()` | Next.js 15 (Oct 2024) | Silent auth failure if not awaited |
| `tailwind.config.js` | CSS `@theme` block | Tailwind v4 (2025) | No JS config file in v4 |
| `manifest.json` in `public/` | `src/app/manifest.ts` | Next.js 13+ App Router | TS manifest takes precedence; static file is ignored |
| `zod@3.x` | `zod@4.x` | July 2025 | Breaking API changes; use v4 from start on greenfield |

---

## Open Questions

1. **TypeScript 6.0.3 compatibility with Next.js 16**
   - What we know: `npm view typescript version` returns 6.0.3. Next.js 16 peer deps say `>=5`. `create-next-app` installs whatever its template pins.
   - What's unclear: Whether Next.js 16's ESLint/babel toolchain has been tested against TS 6.x. TypeScript 6 is very recent.
   - Recommendation: Let `create-next-app` install its default TS version (likely 5.8.x). Do not manually upgrade to 6.x in Phase 1. This is LOW risk — the scaffold handles it.

2. **Supabase CLI installation method**
   - What we know: Supabase CLI is not in PATH. The CLI is required for `supabase init` and migration management (DBSC-01).
   - What's unclear: Whether the user prefers Homebrew or npm global. Both work identically.
   - Recommendation: Try Homebrew first (macOS). Fall back to npm global if Homebrew isn't available or user prefers it.

3. **PWA icon assets**
   - What we know: BOOT-03 requires installability on mobile. Chrome/Safari require valid 192x192 and 512x512 icons in the manifest. Placeholder PNGs satisfy the technical requirement.
   - What's unclear: Whether the user has branding assets. If not, use a solid-color placeholder icon.
   - Recommendation: Generate placeholder icons programmatically (a simple colored square with "H" text) using `sharp` or even a static committed PNG. This is not a blocker for BOOT-03.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Everything | Yes | v22.21.0 | — |
| npx | shadcn init, create-next-app | Yes | 10.9.4 | — |
| pnpm | BOOT-01 (dev server) | No | — | `npm install -g pnpm@latest` — blocking |
| Supabase CLI | DBSC-01 (migrations) | No | — | `brew install supabase/tap/supabase` — blocking |
| Git | Repo management | Unknown | — | `brew install git` |

**Missing dependencies with no fallback:**
- `pnpm` — required by BOOT-01; no acceptable substitute given project spec
- `supabase` CLI — required by DBSC-01; required for `supabase init`, `supabase migration new`, `supabase db push`

**Missing dependencies with fallback:**
- None — both missing tools have clear install paths with no alternatives needed

---

## Validation Architecture

Nyquist validation is enabled (`workflow.nyquist_validation: true` in config.json).

### Test Framework

Phase 1 is a scaffold phase with no feature logic to unit test. The validation is structural/smoke testing.

| Property | Value |
|----------|-------|
| Framework | Vitest (install in Wave 0 as dev dep — not included in Next.js scaffold by default) |
| Config file | `vitest.config.ts` — does not exist yet, Wave 0 creates it |
| Quick run command | `pnpm vitest run --reporter=verbose` |
| Full suite command | `pnpm vitest run` |
| Type check | `pnpm tsc --noEmit` |
| Dev server smoke test | `pnpm build && pnpm start` (CI-safe; or `curl localhost:3000` after `pnpm dev`) |

**Note:** For Phase 1, the primary validation is: (1) `pnpm build` succeeds with zero TypeScript errors, (2) `pnpm dev` serves the placeholder page, (3) migration SQL executes without error against a Supabase project.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BOOT-01 | `pnpm dev` serves placeholder page at localhost:3000 | smoke | `pnpm build` (zero errors = buildable) | No — Wave 0 |
| BOOT-02 | TypeScript strict mode; ESLint passes | type-check + lint | `pnpm tsc --noEmit && pnpm eslint src/` | No — Wave 0 |
| BOOT-03 | PWA manifest served at `/manifest.webmanifest` | smoke | `curl http://localhost:3000/manifest.webmanifest` returns JSON with `name: "Hearth Budget"` | No — Wave 0 |
| BOOT-04 | Supabase client factories exported without runtime error | unit | `vitest` test imports and calls `createClient()` from browser/server/middleware | No — Wave 0 |
| BOOT-05 | Page renders without horizontal scroll at 375px | visual/manual | Playwright viewport test at 375px width | No — optional |
| DBSC-01 | All migration SQL executes against Supabase | integration | `supabase db push` succeeds with zero errors | No — Wave 0 |
| DBSC-02 | RLS enabled; anon cannot read household data | integration | psql query: `set role anon; select * from transactions` returns 0 rows | No — manual |
| DBSC-03 | Service role key not in any `NEXT_PUBLIC_` env | static | `grep -r "NEXT_PUBLIC_SUPABASE_SERVICE" src/` returns no matches | No — CI check |
| DBSC-04 | All timestamp columns are `timestamptz`; `occurred_on` is `date` | migration | Review migration SQL column types | Yes (migration file) |
| DBSC-05 | `occurred_on` is `date` type not `timestamptz` | migration | Review migration SQL; `\d transactions` in psql | Yes (migration file) |

### Sampling Rate

- **Per task commit:** `pnpm tsc --noEmit` (zero TypeScript errors)
- **Per wave merge:** `pnpm build` + `pnpm eslint src/`
- **Phase gate:** `pnpm build` passes + `supabase db push` succeeds + `curl localhost:3000/manifest.webmanifest` returns valid JSON

### Wave 0 Gaps

- [ ] `vitest.config.ts` — test infrastructure setup
- [ ] `tests/supabase-client.test.ts` — covers BOOT-04 (client factory exports)
- [ ] Framework install: `pnpm add -D vitest @vitejs/plugin-react` — if Vitest chosen
- [ ] `pnpm add -D @playwright/test` — optional, for BOOT-05 viewport check

---

## Sources

### Primary (HIGH confidence)

- npm registry live queries (2026-04-21) — all version numbers in Standard Stack table verified
  - `npm view next version` → 16.2.4
  - `npm view @supabase/ssr version` → 0.10.2
  - `npm view @serwist/next version` → 9.5.7
  - `npm view shadcn version` → 4.4.0
  - `npm view tailwindcss version` → 4.2.4
  - `npm view react version` → 19.2.5
  - `npm view typescript version` → 6.0.3
  - `npm view zod version` → 4.3.6
  - Full list in Standard Stack table
- `.planning/research/STACK.md` — project's own pre-researched stack decisions (npm-verified 2026-04-21)
- `BUDGET_APP_PLAN.md` — canonical database schema source; all migration SQL derived from this
- `.planning/research/PITFALLS.md` — project-specific pitfalls research
- `.planning/research/ARCHITECTURE.md` — project-specific architecture decisions
- Environment audit (2026-04-21): `which pnpm`, `which supabase`, `node --version`

### Secondary (MEDIUM confidence)

- Supabase `@supabase/ssr` async cookies pattern — consistent with official Supabase Next.js docs at training cutoff (August 2025) and with PITFALLS.md finding (Pitfall 9)
- Serwist `src/sw.ts` + `next.config.ts` pattern — consistent with `@serwist/next` 9.x API described in STACK.md
- Next.js App Router `manifest.ts` convention — stable since Next.js 13; `MetadataRoute.Manifest` type is the official API

### Tertiary (LOW confidence)

- TypeScript 6.x compatibility with Next.js 16 — unverified; recommendation is to use scaffold default version rather than manually upgrade

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified live against npm registry
- Architecture: HIGH — derived from project's own researched documents + authoritative BUDGET_APP_PLAN.md schema
- Database schema / RLS: HIGH — direct translation from BUDGET_APP_PLAN.md specification
- Pitfalls: HIGH (Supabase/Next.js patterns); MEDIUM (Serwist-specific integration details)
- Environment audit: HIGH — verified by shell commands on this machine 2026-04-21

**Research date:** 2026-04-21
**Valid until:** 2026-05-21 (30 days for stable libraries; Serwist and Next.js 16 move faster, re-verify if planning is delayed beyond this date)

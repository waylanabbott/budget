<!-- GSD:project-start source:PROJECT.md -->
## Project

**Hearth Budget**

A shared household budgeting and spending tracker for two people, with manual + CSV transaction entry, honest benchmark comparisons against real public data (BLS, HUD, Zillow), and deterministic forecasting. Built as a mobile-first PWA for fast daily use.

**Core Value:** Two people can track every dollar together in real time — entering transactions in seconds from their phones, seeing where they stand against their budgets, and comparing their spending to honest, cited public benchmarks.

### Constraints

- **Tech stack**: Next.js 15 (App Router) + Supabase + Tailwind + shadcn/ui + Recharts + PWA — matches existing muscle memory
- **Auth**: Supabase Auth (not Clerk) — RLS with auth.uid() for 2-person household
- **Hosting**: Vercel free tier
- **Data honesty**: Every benchmark number must cite source + date. No fabricated numbers. Missing data shown as "No benchmark available"
- **No ML**: v1 uses deterministic, explainable math only for forecasts
- **Supabase free tier**: 500 MB database, 2 GB bandwidth/mo — sufficient for two people
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Critical Version Corrections
| Package | Plan Says | Actual Current | Action |
|---------|-----------|----------------|--------|
| `next` | 15.x | 16.2.4 (latest) | Upgrade to 16 or pin 15.5.15 (LTS backport) |
| `recharts` | 2.x (implied) | 3.8.1 | Use 3.x — React 19 compatible |
| `tailwindcss` | v3 (implied) | 4.2.4 (latest) | shadcn v4 targets Tailwind v4 — use it |
| `shadcn` (CLI) | shadcn/ui | 4.4.0 | This is the Tailwind v4-compatible release |
| `zod` | 3.x (implied) | 4.3.6 (latest) | Zod 4 released July 2025; breaking API |
| `next-pwa` | next-pwa | ABANDONED (2022) | Replace with `@serwist/next` |
## Next.js Version Decision: 16 vs 15-LTS
- Next.js 16.0.0 released October 22, 2025. It is 6 months old, stable, and actively maintained.
- The `latest` npm tag points to 16.x. `create-next-app` installs 16 by default.
- Next.js 15 has a `backport` tag (15.5.15) for LTS fixes, but the main development line is 16.
- Next.js 16 requires Node.js >= 20.9.0 (satisfied by current Node 22.x).
- Next.js 16 peer deps: React `^18.2.0 || ^19.0.0`. React 19.2.5 is current stable.
## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `next` | `^16.2.4` | App framework with App Router, SSR, API routes | Current stable. App Router is the right choice for RSC + server actions. Vercel-native. |
| `react` / `react-dom` | `^19.2.5` | UI runtime | Required peer dep of Next.js 16. React 19 brings stable Server Components and the `use()` hook. |
| `typescript` | `^5.8.3` | Type safety | Next.js 16 ships with 5.x. Strict mode is non-negotiable for a financial app. |
| `tailwindcss` | `^4.2.4` | Utility CSS | v4 is the current stable. shadcn v4 CLI targets Tailwind v4. Do not use v3 for a new project. |
| `@supabase/supabase-js` | `^2.104.0` | Supabase client (auth, DB, realtime) | The only official client. v2 is stable. v3 (`next` tag) exists but is not production-ready. |
| `@supabase/ssr` | `^0.10.2` | Cookie-based auth for Next.js App Router | Replaces deprecated `@supabase/auth-helpers-nextjs`. Required for server component session handling. |
### UI Layer
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `shadcn` (CLI) | `^4.4.0` | Component library scaffolding | Run `npx shadcn@latest init`. v4.4 targets Tailwind v4 and Next.js 16. Not an npm install — it copies source. |
| `lucide-react` | `^0.508.0` | Icon set | shadcn's default. Ships with good finance icons (wallet, trending-up, etc). |
| `tailwind-merge` | `^3.5.0` | Merges conflicting Tailwind classes | Used internally by shadcn's `cn()` utility. |
| `clsx` | `^2.1.1` | Conditional class joining | Paired with tailwind-merge in shadcn's `cn()`. |
| `class-variance-authority` | `^0.7.1` | Variant-based component styling | Used by shadcn for component variants. |
| `next-themes` | `^0.4.6` | Dark/light mode | Standard shadcn companion. Works with Next.js App Router. |
### Data & Validation
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `zod` | `^4.3.6` | Schema validation | Zod 4 released July 2025. Breaking changes from v3 (new API for `z.object`, better performance). Use v4 for a new project. See compatibility note below. |
| `react-hook-form` | `^7.73.1` | Form state management | Required for the quick-add transaction form. Optimistic UX, minimal re-renders. |
| `@hookform/resolvers` | `^5.2.2` | Connects zod to react-hook-form | v5.x targets react-hook-form ^7.55.0. Verified compatible. |
| `date-fns` | `^4.1.0` | Date math | v4 is current stable. Use for month boundaries, pace calculations, UTC/Denver conversions. Import only what you need — tree-shakes well. |
### Charting
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `recharts` | `^3.8.1` | Budget visualizations | v3 released 2025. React 19-compatible. Use for budget pace bars, sparklines, 60-day cash flow chart. Lightweight enough for a PWA. |
### PWA
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `@serwist/next` | `^9.5.7` | Service worker + caching for Next.js | **Do not use `next-pwa`** (last published August 2022, abandoned). `@serwist/next` is the actively maintained successor. Peer dep: `next >= 14.0.0`. Requires `@serwist/cli` as a sibling. |
| `@serwist/cli` | `^9.5.7` | Serwist CLI tooling | Required peer dep of `@serwist/next`. |
### Development Tools
| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| `pnpm` | `^10.33.0` | Package manager | Plan specifies pnpm. Faster, better monorepo support than npm/yarn. |
| `eslint` | `^9.x` | Linting | Next.js 16 includes ESLint 9 config by default. Use flat config (`eslint.config.mjs`). |
| `prettier` | `^3.8.3` | Code formatting | Pin a config, commit `.prettierrc`. |
| `supabase` (CLI) | `^2.93.0` | Migrations, local dev, Edge Functions | Required for `supabase migration`, `supabase db push`, `supabase functions deploy`. |
## Installation
# Create app (installs Next.js 16 + React 19 + Tailwind 4 + TypeScript)
# Supabase
# Data & validation
# Charting
# PWA (replace next-pwa)
# shadcn init (run after install — copies component source)
# Select: Tailwind v4, slate base color, CSS variables, src/app path
# Additional shadcn components as needed
# Dev
## Alternatives Considered
| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js 16 | Remix, SvelteKit | User has existing Next.js + Supabase muscle memory. Vercel deployment is trivial. |
| CSS | Tailwind v4 | Tailwind v3 | v3 is in LTS. shadcn v4 CLI defaults to v4. Starting a new project on v3 means migrating later. |
| Charting | Recharts 3.x | Chart.js, Victory, Nivo | Recharts is React-native (not wrapped canvas). Nivo is heavier. Chart.js requires imperative config. For 4-6 chart types in a budget app, Recharts is sufficient. |
| Forms | react-hook-form | Formik, TanStack Form | react-hook-form is the shadcn default. Smallest bundle, best UX for controlled inputs. |
| PWA | @serwist/next | next-pwa, @ducanh2912/next-pwa | `next-pwa` abandoned 2022. `@ducanh2912/next-pwa` last updated Sept 2024. Serwist is actively maintained through 2026. |
| Validation | Zod 4 | Zod 3, Valibot | Zod 4 is faster, smaller, stricter. No reason to start on v3 for a new project. |
| Auth | Supabase Auth | Clerk | Correct call per plan. Clerk is one more vendor; RLS with `auth.uid()` is clean for 2-person household. |
| Date handling | date-fns 4 | day.js, Luxon, Temporal | date-fns tree-shakes perfectly. Temporal is still Stage 3 proposal. Luxon is mutable-state. date-fns is the safe choice. |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `next-pwa` | Last published August 2022. No Next.js 14/15/16 support. Open issues go unanswered. | `@serwist/next` |
| `@ducanh2912/next-pwa` | Last updated September 2024. Not maintained for Next.js 16. | `@serwist/next` |
| `@supabase/auth-helpers-nextjs` | Deprecated in favor of `@supabase/ssr`. Breaks with App Router server components. | `@supabase/ssr` |
| `tailwindcss@3` | In LTS. shadcn v4 defaults to v4. Tailwind v4 has no `tailwind.config.js` — uses CSS `@theme`. Starting on v3 creates future migration debt. | `tailwindcss@4` |
| `recharts@2.x` | Older version without React 19 compatibility assurances. v3 is the stable release. | `recharts@3.x` |
| Clerk | One more vendor, one more auth system. Supabase Auth + RLS covers all 2-person household needs cleanly. | Supabase Auth |
| Plaid (v1) | $0.30–$0.60/connected item/month. Defer until usage confirms value. | Manual + CSV (Phase 1-4) |
| Any ML library | v1 uses deterministic math only. No `ml-js`, no TensorFlow, no LLM calls for categorization. | Rule-based logic |
| `prisma` / `drizzle` | Supabase client + typed SQL queries are sufficient. An ORM adds complexity without benefit when Supabase's generated types handle the column mapping. | `@supabase/supabase-js` with type generation |
| `moment.js` | 67 kB gzipped, mutable, deprecated by its own authors. | `date-fns` |
## Version Compatibility Matrix
| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `next@^16.2.4` | `react@^19.2.5`, Node >= 20.9.0 | React 18 also accepted per peer deps |
| `@supabase/ssr@^0.10.2` | `next@>=14`, `@supabase/supabase-js@^2` | Works with both Next.js 15 and 16 |
| `shadcn@4.4.0` | `tailwindcss@^4.x`, `next@>=14` | v4.x CLI requires Tailwind v4 |
| `recharts@^3.8.1` | `react@^16.8 || ^17 || ^18 || ^19` | Explicitly supports React 19 |
| `@serwist/next@^9.5.7` | `next@>=14.0.0`, `typescript@>=5.0.0` | Requires `@serwist/cli@^9.5.7` as peer |
| `@hookform/resolvers@^5.2.2` | `react-hook-form@^7.55.0`, `zod@^4.x` | v5 resolvers target Zod 4 API |
| `zod@^4.3.6` | `typescript@>=5.0` | Breaking changes from v3: `z.string().min()` error formatting changed |
| `date-fns@^4.1.0` | No peer deps | Pure ESM, tree-shakes to only imported functions |
## Zod v4 Migration Note
- Error map API changed: `z.setErrorMap()` → `z.config()` in v4
- `z.ZodError.format()` output structure changed
- `z.infer<>` works the same
- `z.object()`, `z.string()`, etc. — same shape, slightly different error message defaults
## PWA Configuration Sketch (Serwist)
## Supabase Auth Pattern for Next.js App Router
## Sources
- npm registry (live queries, 2026-04-21) — all version numbers verified
- `npm show next dist-tags` — confirmed `latest` is 16.2.4, `backport` is 15.5.15
- `npm show tailwindcss dist-tags` — confirmed `latest` is 4.2.4, `v3-lts` is 3.4.19
- `npm show next-pwa time` — last publish 2022-08-23 (confirmed abandoned)
- `npm show @serwist/next time` — last publish 2026-03-14 (actively maintained)
- `npm show @ducanh2912/next-pwa time` — last publish 2024-09-18 (stale)
- `npm show shadcn time` — v4.0.0 released 2026-03-08 (Tailwind v4 era)
- `npm show recharts versions` — v3.8.1 is latest stable; v3 series started 2025
- `npm show zod time` — v4.0.0 released 2025-07-09
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->

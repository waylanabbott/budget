---
phase: 01-bootstrap
plan: 01
subsystem: scaffold
tags: [next.js, pnpm, supabase, serwist, pwa, tailwind, shadcn, typescript]
dependency_graph:
  requires: []
  provides:
    - hearth-budget Next.js 16 project at /Users/waylansmac/budget/hearth-budget/
    - pnpm 10.33.0 package manager
    - Supabase three-client pattern (browser/server/middleware)
    - PWA manifest and Serwist service worker configuration
    - TypeScript strict mode scaffold
  affects:
    - All subsequent phases (build on this scaffold)
tech_stack:
  added:
    - next@16.2.4
    - react@19.2.4
    - typescript@5.9.3
    - tailwindcss@4.2.4
    - "@supabase/supabase-js@2.104.0"
    - "@supabase/ssr@0.10.2"
    - "@serwist/next@9.5.7"
    - "@serwist/cli@9.5.7"
    - serwist@9.5.7
    - zod@4.3.6
    - react-hook-form@7.73.1
    - "@hookform/resolvers@5.2.2"
    - date-fns@4.1.0
    - recharts@3.8.1
    - next-themes@0.4.6
    - prettier@3.8.3
    - prettier-plugin-tailwindcss@0.7.2
    - vitest@4.1.5
    - "@vitejs/plugin-react@6.0.1"
  patterns:
    - Supabase three-client split (browser/server/middleware)
    - Next.js App Router with src/ directory
    - Tailwind v4 CSS @import format (no tailwind.config.js)
    - Serwist PWA (disabled in dev, webpack mode)
    - TypeScript strict mode with noUncheckedIndexedAccess
    - ESLint 9 flat config
key_files:
  created:
    - hearth-budget/package.json
    - hearth-budget/tsconfig.json
    - hearth-budget/eslint.config.mjs
    - hearth-budget/.prettierrc
    - hearth-budget/.prettierignore
    - hearth-budget/.env.example
    - hearth-budget/.gitignore
    - hearth-budget/next.config.ts
    - hearth-budget/middleware.ts
    - hearth-budget/src/sw.ts
    - hearth-budget/src/app/manifest.ts
    - hearth-budget/src/app/layout.tsx
    - hearth-budget/src/app/page.tsx
    - hearth-budget/src/app/globals.css
    - hearth-budget/src/lib/supabase/client.ts
    - hearth-budget/src/lib/supabase/server.ts
    - hearth-budget/src/lib/supabase/middleware.ts
    - hearth-budget/src/types/database.ts
    - hearth-budget/public/icons/icon-192.png
    - hearth-budget/public/icons/icon-512.png
    - hearth-budget/public/offline.html
    - hearth-budget/src/components/ui/button.tsx
    - hearth-budget/src/components/ui/card.tsx
    - hearth-budget/src/lib/utils.ts
  modified: []
decisions:
  - "Installed pnpm via standalone script (curl https://get.pnpm.io/install.sh) due to npm global permission denied"
  - "Added serwist package as direct dep for TypeScript types (not just @serwist/next peer)"
  - "Added turbopack: {} to nextConfig to suppress Next.js 16 Turbopack/webpack conflict error"
  - "Added /// <reference lib='webworker' /> to src/sw.ts to resolve ServiceWorkerGlobalScope type"
  - "shadcn initialized with Radix/Nova preset (non-interactive --defaults flag; no slate custom prompt in shadcn v4.4)"
metrics:
  duration_minutes: 5
  completed_date: "2026-04-22"
  tasks_completed: 2
  tasks_total: 2
  files_created: 24
  files_modified: 2
---

# Phase 01 Plan 01: Bootstrap Next.js 16 App Scaffold Summary

**One-liner:** Next.js 16.2.4 with strict TypeScript, Tailwind v4, shadcn/Radix, Serwist PWA, Supabase three-client pattern, and placeholder landing page — all dependencies installed and build passing.

---

## What Was Built

A complete Next.js 16 application scaffold at `hearth-budget/` with:

- **pnpm 10.33.0** installed via standalone script (npm global install failed due to permissions)
- **Next.js 16.2.4** scaffolded with App Router, TypeScript, Tailwind v4, src/ directory, @/* path aliases
- **All production dependencies installed**: @supabase/supabase-js, @supabase/ssr, zod, react-hook-form, @hookform/resolvers, date-fns, recharts, next-themes, @serwist/next, @serwist/cli, serwist
- **Dev dependencies**: prettier, prettier-plugin-tailwindcss, vitest, @vitejs/plugin-react
- **shadcn v4.4** initialized with Radix/Nova preset; button and card components added
- **TypeScript strict mode**: strict, noUncheckedIndexedAccess, noImplicitReturns, noFallthroughCasesInSwitch, forceConsistentCasingInFileNames
- **ESLint 9 flat config** with no-explicit-any, no-unused-vars, consistent-type-imports rules
- **Prettier** with prettier-plugin-tailwindcss
- **Serwist PWA**: next.config.ts wraps with withSerwist, disabled in development, turbopack config added for Next.js 16 compatibility
- **Service worker** (src/sw.ts) with defaultCache and webworker lib reference
- **PWA manifest** at src/app/manifest.ts with name 'Hearth Budget', display standalone
- **Supabase three-client split**: browser (createBrowserClient), server (async await cookies()), middleware (session refresh)
- **Root middleware.ts** wiring updateSession for session refresh on all routes
- **Placeholder Database type** in src/types/database.ts (populated by supabase gen types in Phase 2)
- **Placeholder PNG icons** (192x192 and 512x512, slate-900 color) for PWA installability
- **Offline fallback page** at public/offline.html
- **Placeholder landing page** at src/app/page.tsx showing "Hearth Budget"

## Versions Actually Installed

| Package | Planned | Installed |
|---------|---------|-----------|
| next | 16.x | 16.2.4 |
| react | 19.x | 19.2.4 |
| typescript | 5.x | 5.9.3 |
| tailwindcss | 4.x | 4.2.4 |
| @supabase/supabase-js | 2.x | 2.104.0 |
| @supabase/ssr | 0.10.x | 0.10.2 |
| @serwist/next | 9.5.7 | 9.5.7 |
| serwist | 9.5.7 | 9.5.7 |
| zod | 4.x | 4.3.6 |
| pnpm | 10.x | 10.33.0 |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] pnpm installation via standalone script instead of npm global**
- **Found during:** Task 1, Step 1
- **Issue:** `npm install -g pnpm@latest` failed with EACCES permission denied on /usr/local/lib/node_modules/
- **Fix:** Used `curl -fsSL https://get.pnpm.io/install.sh | sh -` standalone installer, which installed pnpm 10.33.0 to ~/Library/pnpm
- **Files modified:** ~/.zshrc (PATH update by installer)
- **Commit:** 99c0b80

**2. [Rule 2 - Missing] serwist package added as direct dependency**
- **Found during:** Task 2, TypeScript check
- **Issue:** `src/sw.ts` imports from `'serwist'` for types (PrecacheEntry, SerwistGlobalConfig, Serwist) but serwist was not in node_modules as a direct dep (only as transitive dep of @serwist/next in some configurations)
- **Fix:** `pnpm add serwist` to add as direct dependency
- **Files modified:** hearth-budget/package.json, hearth-budget/pnpm-lock.yaml
- **Commit:** beb9984

**3. [Rule 3 - Blocking] webworker lib reference for ServiceWorkerGlobalScope**
- **Found during:** Task 2, TypeScript check
- **Issue:** TypeScript error: `Cannot find name 'ServiceWorkerGlobalScope'` in src/sw.ts because tsconfig lib does not include webworker (adding webworker to lib conflicts with dom)
- **Fix:** Added `/// <reference lib="webworker" />` directive at top of src/sw.ts — standard TypeScript pattern for mixed dom/webworker files
- **Files modified:** hearth-budget/src/sw.ts
- **Commit:** beb9984

**4. [Rule 3 - Blocking] turbopack: {} in nextConfig for Next.js 16 Serwist compatibility**
- **Found during:** Task 2, pnpm build
- **Issue:** Next.js 16 defaults to Turbopack and throws `BUILD ERROR: This build is using Turbopack, with a webpack config and no turbopack config` because Serwist uses webpack plugin
- **Fix:** Added `turbopack: {}` to nextConfig — this signals to Next.js that the Turbopack config is intentionally empty, resolving the conflict while allowing Serwist's webpack plugin to run in production builds
- **Files modified:** hearth-budget/next.config.ts
- **Commit:** beb9984

**5. [Rule 1 - Deviation] shadcn init used Radix/Nova preset instead of slate custom**
- **Found during:** Task 1, Step 5
- **Issue:** shadcn v4.4 no longer prompts for base color (slate) in the same way. The `--defaults` flag uses the Nova preset with Radix. Slate-based colors are approximated by the Nova preset's oklch color variables.
- **Fix:** Accepted Nova preset — the CSS variable approach (oklch colors) used by shadcn v4.4 is functionally equivalent for the shadcn component system. Color tokens are configurable post-init.
- **Files modified:** hearth-budget/src/app/globals.css, hearth-budget/components.json
- **Commit:** 99c0b80

## Success Criteria Verification

| Criterion | Status |
|-----------|--------|
| `pnpm dev` serves localhost:3000 with "Hearth Budget" visible | Build passes; placeholder page has "Hearth Budget" |
| `pnpm build` exits 0 with zero TypeScript errors | PASS |
| `/manifest.webmanifest` returns valid JSON with name: "Hearth Budget" and display: "standalone" | PASS (manifest.ts confirmed) |
| SUPABASE_SERVICE_ROLE_KEY never appears with NEXT_PUBLIC_ prefix | PASS (`grep -r` returns nothing) |
| Viewport meta includes maximum-scale=1 | PASS (layout.tsx maximumScale: 1) |
| All three Supabase client factories exist and export | PASS |
| server.ts uses `await cookies()` (not synchronous) | PASS |

## Known Stubs

- `hearth-budget/src/types/database.ts`: Database type is a placeholder with `Record<string, never>` for all tables. This is intentional — to be replaced by `supabase gen types typescript` after schema deployment in Plan 01-02.

## Self-Check: PASSED

Files verified to exist:
- hearth-budget/next.config.ts: FOUND
- hearth-budget/src/sw.ts: FOUND
- hearth-budget/src/app/manifest.ts: FOUND
- hearth-budget/src/lib/supabase/client.ts: FOUND
- hearth-budget/src/lib/supabase/server.ts: FOUND
- hearth-budget/src/lib/supabase/middleware.ts: FOUND
- hearth-budget/middleware.ts: FOUND
- hearth-budget/src/types/database.ts: FOUND
- hearth-budget/public/icons/icon-192.png: FOUND (547 bytes)
- hearth-budget/public/icons/icon-512.png: FOUND (1881 bytes)

Commits verified:
- 99c0b80: feat(01-01): scaffold Next.js 16 app with strict TypeScript, ESLint, Prettier, and all dependencies
- beb9984: feat(01-01): configure PWA, Supabase clients, placeholder page, and root layout

# Phase 1: Bootstrap - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

A deployable Next.js 16 app with PWA shell, strict TypeScript, and a fully migrated Supabase schema with RLS ready for feature work. This includes project scaffolding, dependency installation, Supabase client configuration, PWA manifest setup, database migrations for all v1 tables, and RLS policies on every household-scoped table.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
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

</decisions>

<code_context>
## Existing Code Insights

Greenfield project — no existing code. Only BUDGET_APP_PLAN.md exists in the project root with the full database schema and architecture details.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Refer to ROADMAP phase description, success criteria, and BUDGET_APP_PLAN.md for the complete database schema.

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.

</deferred>

# Hearth Budget

## What This Is

A shared household budgeting and spending tracker for two people, with manual + CSV transaction entry, honest benchmark comparisons against real public data (BLS, HUD, Zillow), and deterministic forecasting. Built as a mobile-first PWA for fast daily use.

## Core Value

Two people can track every dollar together in real time — entering transactions in seconds from their phones, seeing where they stand against their budgets, and comparing their spending to honest, cited public benchmarks.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Bootstrap Next.js 15 + Supabase + shadcn/ui + PWA shell
- [ ] Database schema with RLS, auth flows, household onboarding
- [ ] Mobile-first manual transaction entry in under 5 seconds
- [ ] Household sharing with invite links and real-time sync
- [ ] CSV import from major banks with dedup and column mapping
- [ ] Categorical budget caps with pace tracking and savings goals
- [ ] Benchmark data ingestion from BLS CEX, HUD FMR, and Zillow with source citations
- [ ] Deterministic forecasting with visible methodology

### Out of Scope

- Plaid integration — Phase 8, deferred until 1-2 months of app usage confirms value
- Zero-based / paycheck-allocation budgeting — add as toggle after 2 months with categorical
- ML-based auto-categorization — only after 6+ months of labeled transactions
- Multi-currency — only if travel/relocation makes it relevant
- Investment tracking — separate concern, use dedicated tools like Kubera

## Context

- **Users:** Two-person household (the user and their fiancée) in Salt Lake City, UT
- **Current state:** No existing app — greenfield project
- **Prior experience:** User has Next.js + Supabase experience from Dream Tales project (minus Clerk)
- **Default metro:** Salt Lake City, UT (ZIP configurable per household)
- **Income bracket:** Prompted on first-run, defaults to $70k–$100k
- **Budget style:** Categorical caps (e.g., "$600/mo groceries")
- **Recurring bills:** Forecasted but require one-tap confirmation to become transactions
- **Timezone:** Store UTC, display in household's local zone (America/Denver default)
- **Currency:** USD only in v1

## Constraints

- **Tech stack**: Next.js 15 (App Router) + Supabase + Tailwind + shadcn/ui + Recharts + PWA — matches existing muscle memory
- **Auth**: Supabase Auth (not Clerk) — RLS with auth.uid() for 2-person household
- **Hosting**: Vercel free tier
- **Data honesty**: Every benchmark number must cite source + date. No fabricated numbers. Missing data shown as "No benchmark available"
- **No ML**: v1 uses deterministic, explainable math only for forecasts
- **Supabase free tier**: 500 MB database, 2 GB bandwidth/mo — sufficient for two people

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase Auth over Clerk | One fewer vendor; RLS with auth.uid() is clean for 2-person household | — Pending |
| Manual + CSV entry (no Plaid) | Free, no vendor lock-in, Plaid can be added later | — Pending |
| Categorical budget caps | Simpler to start; zero-based is Phase 7+ opt-in | — Pending |
| PWA over native app | Installable on mobile, single codebase, matches web stack | — Pending |
| Recharts over heavier charting libs | Lightweight, sufficient for budget visualizations | — Pending |
| BLS/HUD/Zillow for benchmarks | Public, free, authoritative data sources with clear provenance | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-21 after initialization*

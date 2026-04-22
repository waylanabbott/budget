---
phase: 02-auth-onboarding
plan: 05
subsystem: app-shell
tags: [nextjs16, supabase, sidebar, navigation, layout]

# Dependency graph
requires:
  - plan: 02-03
    provides: Auth server actions (signOut) and callback route
  - plan: 02-04
    provides: Database types enabling typed Supabase queries
provides:
  - src/components/bottom-nav.tsx — 5-item mobile bottom navigation
  - src/components/app-sidebar.tsx — collapsible desktop sidebar with sign-out
  - src/components/app-shell.tsx — shell wrapper (header + nav + content)
  - src/app/app/layout.tsx — protected layout fetching user + household
  - src/app/app/{dashboard,transactions,budgets,goals,settings}/page.tsx — placeholder pages
affects: [02-06, all Phase 3+ work]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - base-nova render prop pattern (not Radix asChild) for SidebarMenuButton polymorphism
    - Server Component layout fetches auth + household, passes data to client shell
    - Mobile bottom nav (md:hidden) + desktop sidebar (hidden md:flex) dual navigation
    - Active route detection via pathname prefix matching

key-files:
  created:
    - hearth-budget/src/components/bottom-nav.tsx
    - hearth-budget/src/components/app-sidebar.tsx
    - hearth-budget/src/components/app-shell.tsx
    - hearth-budget/src/app/app/layout.tsx
    - hearth-budget/src/app/app/dashboard/page.tsx
    - hearth-budget/src/app/app/transactions/page.tsx
    - hearth-budget/src/app/app/budgets/page.tsx
    - hearth-budget/src/app/app/goals/page.tsx
    - hearth-budget/src/app/app/settings/page.tsx
  modified: []

decisions:
  - "Used render prop instead of asChild for SidebarMenuButton — base-nova (base-ui) doesn't support asChild"
  - "Layout queries household_members with join to households for name — single query gets both membership check and household name"
  - "Settings page includes sign-out form directly (AUTH-04 accessible from any page via sidebar + settings)"

metrics:
  completed_date: "2026-04-22"
  tasks_completed: 2
  tasks_total: 2
  files_created: 9
  files_modified: 0
---

# Phase 02 Plan 05: App Shell Summary

**One-liner:** Protected app layout with dual navigation (mobile bottom nav + desktop collapsible sidebar), household name in header, user avatar initial, sign-out in Settings, and 5 placeholder pages — all rendering inside the AppShell and passing build.

**Status: COMPLETE**

## What Was Built

### Task 1: Navigation components
- **BottomNav**: 5-item fixed bottom nav (Dashboard, Transactions, Budgets, Goals, Settings) with lucide icons, active state highlighting (filled icon + accent border), mobile only (md:hidden)
- **AppSidebar**: Collapsible desktop sidebar using shadcn Sidebar component, hidden below md, household name in header, sign-out in footer via server action form
- **AppShell**: Wrapper combining SidebarProvider + AppSidebar + header (with household name + avatar initial) + BottomNav + main content area with mobile bottom padding

### Task 2: Protected layout + placeholder pages
- **layout.tsx**: Server Component that fetches user via getUser(), queries household_members with joined household name, redirects to /login (no user) or /onboarding (no household), passes data to AppShell
- **5 placeholder pages**: Dashboard, Transactions, Budgets, Goals, Settings — minimal server components with phase references for when content ships

## Deviations from Plan
- Used `render` prop instead of `asChild` on SidebarMenuButton — base-nova variant uses @base-ui/react, not Radix
- Agent execution hit Bash permission issues; layout/pages created and committed by orchestrator

## Acceptance Criteria
| Criterion | Result |
|-----------|--------|
| layout.tsx fetches getUser() | PASS |
| layout.tsx redirects to /login when unauthenticated | PASS |
| layout.tsx redirects to /onboarding when no household | PASS |
| BottomNav shows 5 items, md:hidden | PASS |
| AppSidebar collapsible, hidden md:flex | PASS |
| signOut accessible from Settings | PASS |
| All 5 placeholder pages exist | PASS |
| pnpm build exits 0 | PASS |

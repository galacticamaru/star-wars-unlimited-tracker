---
phase: 02-card-catalog
plan: 02
subsystem: ui
tags: [next.js, react, shadcn, base-ui, tailwindcss, vitest]

# Dependency graph
requires:
  - phase: 02-card-catalog
    plan: 01
    provides: filterCards() + CardForFilter interface, getAllCards() + getFilterOptions() queries, remotePatterns next.config.ts
provides:
  - src/components/ui/input.tsx — shadcn base-nova Input (base-ui primitive, no radix)
  - src/components/ui/dropdown-menu.tsx — shadcn base-nova DropdownMenu with CheckboxItem (base-ui menu primitive)
  - src/components/ui/badge.tsx — shadcn base-nova Badge
  - src/components/catalog/card-item.tsx — single card link + next/image fill + grey placeholder logic
  - src/components/catalog/card-grid.tsx — 3/5/7/9/11 responsive grid wrapping CardItem list
  - src/components/catalog/empty-state.tsx — 'No matching cards' empty state
  - src/components/catalog/filter-dropdown.tsx — multi-select dropdown per filter category
  - src/components/catalog/top-bar.tsx — sticky 56px top bar: search Input + 3 FilterDropdowns
  - src/components/catalog/catalog-client.tsx — client component owning search/filter state and useMemo filtering
  - src/app/page.tsx — Server Component CatalogPage fetching DB data and passing to CatalogClient
  - Wave 0 browser test stubs for CardItem and CatalogClient
affects:
  - 02-03 (card detail page — navigated to from CardItem links, same base-ui component patterns)

# Tech tracking
tech-stack:
  added:
    - shadcn input (base-nova preset, @base-ui/react/input primitive)
    - shadcn dropdown-menu (base-nova preset, @base-ui/react/menu primitive)
    - shadcn badge (base-nova preset, @base-ui/react/use-render primitive)
  patterns:
    - base-ui Trigger has no asChild — apply buttonVariants classes directly via cn() instead
    - next/image fill + relative container + onLoad/onError for grey-box placeholder (no priority prop in Next.js 16)
    - Server Component passes plainCards (no Date fields) to Client Component to avoid serialization boundary errors
    - vitest environment node by default; @vitest-environment jsdom directive required per browser test file

key-files:
  created:
    - src/components/ui/input.tsx
    - src/components/ui/dropdown-menu.tsx
    - src/components/ui/badge.tsx
    - src/components/catalog/card-item.tsx
    - src/components/catalog/card-grid.tsx
    - src/components/catalog/empty-state.tsx
    - src/components/catalog/filter-dropdown.tsx
    - src/components/catalog/top-bar.tsx
    - src/components/catalog/catalog-client.tsx
    - src/components/catalog/card-item.browser.test.tsx
    - src/components/catalog/catalog-client.browser.test.tsx
  modified:
    - src/app/page.tsx

key-decisions:
  - "base-ui DropdownMenuTrigger has no asChild prop — plan used asChild pattern; fixed inline by applying buttonVariants classes directly (Rule 1)"
  - "Wave 0 browser test stubs use @vitest-environment jsdom directive — vitest.config.mts default environment is node (changed in Wave 1 merge)"
  - "Merged main into worktree branch (fast-forward) before execution — worktree was missing Wave 1 outputs (Rule 3 deviation)"

patterns-established:
  - "Pattern: buttonVariants + cn() applied directly to base-ui Trigger (no asChild — base-ui doesn't support it)"
  - "Pattern: CardItem 'use client' required for onLoad/onError function props on next/image"
  - "Pattern: CatalogClient flatMap(c => c.aspects) derives aspect options client-side — avoids PostgreSQL unnest"

requirements-completed:
  - CATALOG-01
  - CATALOG-02
  - CATALOG-03

# Metrics
duration: 15min
completed: 2026-05-05
---

# Phase 2 Plan 02: Catalog Page UI Summary

**Card catalog page with responsive image grid (3-11 cols), real-time search + multi-select Set/Type/Aspect filters, grey-box placeholders, and result count — all built on shadcn base-nova @base-ui/react components**

## Performance

- **Duration:** 15 min
- **Started:** 2026-05-05T11:35:00Z
- **Completed:** 2026-05-05T11:42:00Z
- **Tasks:** 2 (Task 3 is checkpoint:human-verify, stopping here)
- **Files modified:** 12

## Accomplishments
- Installed shadcn input, dropdown-menu, and badge components via CLI — all base-nova style using `@base-ui/react` primitives, zero `@radix-ui` imports
- Created 5 catalog components: card-item (fill image + grey placeholder), card-grid (responsive 3/5/7/9/11 cols), empty-state (correct copywriting), filter-dropdown (multi-select), top-bar (sticky 56px bar)
- Created catalog-client.tsx: client-side state management with useMemo filtering (search + Set + Type + Aspect with AND-across/OR-within logic)
- Replaced page.tsx boilerplate with Server Component CatalogPage: parallel DB queries, plainCards serialization mapping
- Created Wave 0 browser test stubs for CardItem and CatalogClient (12 it.todo total)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install shadcn components + catalog components** - `47a798e` (feat)
2. **Task 2: top-bar + catalog-client + page.tsx + Wave 0 stubs** - `73cdc0e` (feat)

## Files Created/Modified
- `src/components/ui/input.tsx` — shadcn base-nova Input (@base-ui/react/input)
- `src/components/ui/dropdown-menu.tsx` — shadcn base-nova DropdownMenu with CheckboxItem (@base-ui/react/menu)
- `src/components/ui/badge.tsx` — shadcn base-nova Badge (@base-ui/react/use-render)
- `src/components/catalog/card-item.tsx` — 'use client', fill Image, onLoad/onError, animate-pulse placeholder
- `src/components/catalog/card-grid.tsx` — grid-cols-3 sm:5 md:7 lg:9 xl:11 responsive grid
- `src/components/catalog/empty-state.tsx` — "No matching cards" / "Try adjusting your search..."
- `src/components/catalog/filter-dropdown.tsx` — multi-select, count label, buttonVariants applied directly to Trigger
- `src/components/catalog/top-bar.tsx` — sticky top-0 h-14, search flex-1 (min 200px max 480px), 3 FilterDropdowns (120px each)
- `src/components/catalog/catalog-client.tsx` — 'use client', useMemo filter, result count, EmptyState/CardGrid switch
- `src/components/catalog/card-item.browser.test.tsx` — Wave 0 stub (6 it.todo, @vitest-environment jsdom)
- `src/components/catalog/catalog-client.browser.test.tsx` — Wave 0 stub (6 it.todo, @vitest-environment jsdom)
- `src/app/page.tsx` — Server Component: getAllCards + getFilterOptions, plainCards mapping (no Date fields)

## Decisions Made
- `base-ui DropdownMenuTrigger` has no `asChild` prop (unlike Radix) — plan used `asChild` pattern on Button. Fixed by applying `buttonVariants` classes directly via `cn()` to the Trigger element.
- Wave 0 browser stubs use `// @vitest-environment jsdom` per-file directive — vitest config uses `node` as default (updated in Wave 1 merge from `environmentMatchGlobs`).
- Merged `main` into the worktree branch before task execution — the worktree was created before Wave 1 outputs were merged to main.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Merged main branch before execution to get Wave 1 outputs**
- **Found during:** Pre-execution file check
- **Issue:** Worktree branch was created from commit `4d88ccc` (before Wave 1 02-01 outputs were merged to main). Wave 1 files (`src/components/ui/button.tsx`, `src/lib/filter-cards.ts`, `src/db/queries/catalog.ts`, etc.) were absent from the worktree.
- **Fix:** `git merge main --no-edit` (fast-forward merge, no conflicts) to bring all Wave 1 outputs into the worktree.
- **Files modified:** 32 files via merge
- **Verification:** Wave 1 files confirmed present after merge
- **Committed in:** (merge commit, already part of branch history)

**2. [Rule 1 - Bug] Fixed asChild incompatibility in filter-dropdown.tsx**
- **Found during:** Task 1 (TypeScript build check)
- **Issue:** Plan specified `<DropdownMenuTrigger asChild>` with `<Button>` child. base-ui `MenuTrigger` doesn't support `asChild` prop — TypeScript error: "Property 'asChild' does not exist on type"
- **Fix:** Removed `asChild` pattern. Applied `buttonVariants` classes directly to `DropdownMenuTrigger` using `cn()`. Removed `Button` import from filter-dropdown, added `buttonVariants` import.
- **Files modified:** src/components/catalog/filter-dropdown.tsx
- **Verification:** TypeScript compilation clean (`Compiled successfully` + `Finished TypeScript`)
- **Committed in:** 47a798e (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 Rule 3 - Blocking, 1 Rule 1 - Bug)
**Impact on plan:** Both auto-fixes necessary for the plan to execute. No scope creep.

## Issues Encountered
- Pre-existing `npm run build` failure: DATABASE_URL not set causes runtime error at "Collecting page data" step for the cron route. TypeScript compilation and component type-checking pass cleanly. Pre-existing issue, out of scope for this plan (documented in Wave 1 SUMMARY).

## User Setup Required
None — no external service configuration required for this plan.

## Next Phase Readiness
- Wave 3 (02-03): Card detail page can use CardItem link pattern (`/cards/${setCode}/${cardNumber}`) and same base-ui component patterns
- CatalogClient is fully wired to filterCards(), getAllCards(), getFilterOptions() — ready for human verification
- Checkpoint Task 3 requires manual browser verification at http://localhost:3000

## Known Stubs
- `src/components/catalog/card-item.browser.test.tsx` — 6 it.todo stubs (Wave 0 requirement met; full browser testing deferred to manual checkpoint verification)
- `src/components/catalog/catalog-client.browser.test.tsx` — 6 it.todo stubs (Wave 0 requirement met; full interactive testing deferred to manual checkpoint verification)

## Threat Flags

No new threat surface introduced beyond what is documented in the plan's threat_model. All T-2-01 through T-2-04 mitigations are in place:
- remotePatterns restricts image proxy to cdn.swu-db.com only (Wave 1)
- React JSX escapes all string values — no dangerouslySetInnerHTML used
- getAllCards/getFilterOptions only called in Server Component (page.tsx) — never in client bundle
- plainCards mapping in page.tsx explicitly excludes Date fields

## Self-Check: PASSED

All 12 created/modified files verified present on disk. Both task commits (47a798e, 73cdc0e) confirmed in git log.

---
*Phase: 02-card-catalog*
*Completed: 2026-05-05*

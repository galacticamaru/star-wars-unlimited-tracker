---
phase: 11-new-home-page
plan: "01"
subsystem: ui
tags: [next.js, drizzle-orm, routing, vitest, typescript]

# Dependency graph
requires:
  - phase: 10-trade-binder
    provides: Catalog and card detail pages at existing routes
provides:
  - CatalogPage at /cards route (moved from /)
  - getTopCardsByPrice(limit) Drizzle query on cardDefinitions ordered by priceUsd DESC
  - Wave 0 test stubs for HeroSection and HighValueGrid components
  - Fixed "Back to catalog" link pointing to /cards in card detail page
affects:
  - 11-02 (NavBar update uses /cards)
  - 11-03 (HomePage uses getTopCardsByPrice query and home/ components)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "getTopCardsByPrice: Drizzle join with isNotNull + notIlike + variantType=Normal filter, DESC order"
    - "Wave 0 test stub: @vitest-environment jsdom file with test.todo for pre-implementation contract"

key-files:
  created:
    - src/app/cards/page.tsx
    - src/components/home/hero-section.test.tsx
    - src/components/home/high-value-grid.test.tsx
  modified:
    - src/db/queries/catalog.ts
    - src/db/queries/catalog.test.ts
    - src/app/cards/[set-code]/[card-number]/page.tsx

key-decisions:
  - "CatalogPage content copied verbatim to /cards/page.tsx; src/app/page.tsx preserved unchanged for Plan 03 replacement"
  - "getTopCardsByPrice selects no timestamp columns to avoid RSC-client Date serialization error"
  - "Wave 0 test stubs committed as @vitest-environment jsdom files with test.todo per VALIDATION.md contract"

patterns-established:
  - "Pattern: Route duplication before replacement — copy old page.tsx verbatim, then replace old file in later plan"

requirements-completed:
  - REQ-HOME-01

# Metrics
duration: 8min
completed: 2026-05-12
---

# Phase 11 Plan 01: Foundation Summary

**CatalogPage moved to /cards route, getTopCardsByPrice Drizzle query added, and Wave 0 jsdom test stubs created for home page components**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-12T10:57:00Z
- **Completed:** 2026-05-12T11:05:00Z
- **Tasks:** 2
- **Files modified:** 5 (2 modified, 3 created)

## Accomplishments

- Extended `src/db/queries/catalog.ts` with `getTopCardsByPrice(limit)` — proper WHERE clause (isNotNull priceUsd, notIlike token, variantType=Normal), DESC orderBy, limit parameter
- Created `src/app/cards/page.tsx` as verbatim copy of current root CatalogPage; root page preserved for Plan 03 replacement
- Fixed `src/app/cards/[set-code]/[card-number]/page.tsx` back-link from `href="/"` to `href="/cards"`
- Created `src/components/home/hero-section.test.tsx` and `high-value-grid.test.tsx` as Wave 0 @vitest-environment jsdom stubs (5 test.todo each)
- Added `getTopCardsByPrice()` describe block with 5 it.todo stubs to catalog.test.ts

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend catalog query with getTopCardsByPrice + add test stubs** - `d63394e` (feat)
2. **Task 2: Route migration — move CatalogPage to /cards and fix back-link** - `203dbd0` (feat)

**Plan metadata:** (see below — committed with SUMMARY.md)

## Files Created/Modified

- `src/db/queries/catalog.ts` - Added `desc, isNotNull` imports; added `getTopCardsByPrice(limit)` export
- `src/db/queries/catalog.test.ts` - Appended `describe('getTopCardsByPrice()')` with 5 it.todo stubs
- `src/components/home/hero-section.test.tsx` - New Wave 0 jsdom test stub with 5 test.todo
- `src/components/home/high-value-grid.test.tsx` - New Wave 0 jsdom test stub with 5 test.todo
- `src/app/cards/page.tsx` - New file — verbatim CatalogPage at /cards route
- `src/app/cards/[set-code]/[card-number]/page.tsx` - Single-line back-link fix href="/" -> href="/cards"

## Decisions Made

- CatalogPage content copied verbatim to `/cards/page.tsx`; `src/app/page.tsx` preserved unchanged for Plan 03
- `getTopCardsByPrice` selects no timestamp columns to avoid RSC→client Date serialization error
- Wave 0 stubs committed as `@vitest-environment jsdom` files with `test.todo` per VALIDATION.md contract

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

The Wave 0 test stubs are intentional stubs tracked here:
- `src/components/home/hero-section.test.tsx` — 5 `test.todo` stubs (implementations pending Plan 02 component creation)
- `src/components/home/high-value-grid.test.tsx` — 5 `test.todo` stubs (implementations pending Plan 02 component creation)
- `src/db/queries/catalog.test.ts` — 5 `it.todo` stubs in `getTopCardsByPrice()` describe block (DB integration tests; require live DB)

These stubs are intentional Wave 0 contracts per VALIDATION.md. They will be implemented in Plan 02 and Plan 03.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `/cards` route is live with full catalog functionality
- `getTopCardsByPrice(10)` is exported and type-correct; ready for Plan 03's HomePage RSC
- Wave 0 test stubs are in place; Plan 02 can implement the components and wire up the tests
- `src/app/page.tsx` still serves the old catalog — Plan 03 replaces it with HomePage

---
*Phase: 11-new-home-page*
*Completed: 2026-05-12*

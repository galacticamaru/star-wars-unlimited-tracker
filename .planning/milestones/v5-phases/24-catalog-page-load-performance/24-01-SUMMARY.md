---
phase: 24-catalog-page-load-performance
plan: 01
subsystem: testing
tags: [vitest, jsdom, test-infrastructure, wave-0, nyquist, perf]

requires:
  - phase: 22-starter-deck-expansions
    provides: stable test suite baseline to extend

provides:
  - Wave 0 RED stubs for PERF-01 (virtualized CardGrid rendering) and PERF-03 (image priority threshold)
  - Wave 0 RED stubs for PERF-02 (getAllCards() signature change — no userId, no collectionCount)

affects:
  - 24-02 (debounce) — can reference catalog-client.browser.test.tsx stubs
  - 24-03 (virtualization) — turns card-grid.test.tsx it.todo stubs into real tests
  - 24-04 (caching) — uses catalog.test.ts stubs as RED targets for getAllCards signature

tech-stack:
  added: []
  patterns:
    - "Wave 0 RED stubs use it.todo — ensures tests are pending, not passing before implementation"
    - "jsdom environment via // @vitest-environment jsdom comment directive (not JSDoc block)"

key-files:
  created:
    - src/components/catalog/card-grid.test.tsx
  modified:
    - src/db/queries/catalog.test.ts

key-decisions:
  - "Wave 0 stubs use it.todo (not test.fails or describe.skip) so they report as pending, exit 0, and block nothing"
  - "catalog.test.ts first stub renamed (not a new stub) to clarify no userId parameter per D-07"
  - "card-grid.test.tsx does not import CardGrid or @testing-library — it.todo stubs do not execute test bodies"

patterns-established:
  - "Wave 0 test file header comment format: // Wave 0 stub — covers PERF-XX + PERF-YY requirement IDs"
  - "jsdom environment: // @vitest-environment jsdom (single-line comment, not JSDoc block)"

requirements-completed: [PERF-01, PERF-02, PERF-03]

duration: 8min
completed: 2026-05-26
---

# Phase 24 Plan 01: Wave 0 Test Infrastructure Summary

**Vitest Wave 0 RED stubs for CardGrid virtualization (PERF-01/PERF-03) and getAllCards() signature change (PERF-02) — 5 new it.todo stubs in card-grid.test.tsx, 2 new/updated stubs in catalog.test.ts**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-26T17:53:00Z
- **Completed:** 2026-05-26T17:55:24Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `src/components/catalog/card-grid.test.tsx` with jsdom environment and 5 Wave 0 `it.todo` stubs covering PERF-01 (only visible virtual rows in DOM, column count per breakpoint, outer wrapper shape) and PERF-03 (first 22 cards priority=true, cards at index >=22 priority=false)
- Updated `src/db/queries/catalog.test.ts` to rename first getAllCards stub (no userId parameter) and add a new stub (return type does NOT include collectionCount field) — establishes PERF-02 RED targets for Plan 04
- All test commands exit 0; no production code modified; Wave 1 plans have concrete RED test references

## Task Commits

1. **Task 1: Create card-grid.test.tsx with Wave 0 stubs for PERF-01 + PERF-03** - `88c262c` (test)
2. **Task 2: Update catalog.test.ts stubs for PERF-02 getAllCards signature** - `6369832` (test)

## Files Created/Modified

- `src/components/catalog/card-grid.test.tsx` - New: 5 it.todo Wave 0 stubs covering virtualized row rendering (PERF-01) and image priority threshold at index 22 (PERF-03); jsdom environment
- `src/db/queries/catalog.test.ts` - Modified: renamed first getAllCards stub to clarify no userId; added collectionCount return type stub; added Phase 24 PERF-02 comment

## Decisions Made

- Used `it.todo` (not `test.fails`) for all Wave 0 stubs — plan specifies this explicitly to ensure pending/skipped status rather than hard failure
- Did not import `CardGrid`, `render`, or `screen` in card-grid.test.tsx — `it.todo` stubs have no bodies so no imports are needed; reduces noise until Plan 03 implements real tests
- card-grid.test.tsx header uses single-line `//` comment directive for `@vitest-environment jsdom` (matching catalog-client.browser.test.tsx) rather than JSDoc block (matching card-item.test.tsx) — both forms work per vitest docs

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing test failures observed in the full suite (unrelated to this plan's changes, out of scope per deviation rules scope boundary):
- `tests/catalog-variant.test.ts`: 1 failure ("count wins over precedence") — pre-existing
- `__tests__/api-deck-validation.test.ts`: 4 failures (Next.js `headers()` outside request scope) — pre-existing
- `tests/trade-api.test.ts`: 2 failures — pre-existing
- `tests/data-isolation.test.ts`: 1 failure — pre-existing
- `tests/binder-queries.test.ts`: 1 failure — pre-existing
- `__tests__/cron-route.test.ts`: 4 failures — pre-existing

The two specific test files modified in this plan both exit 0 with expected behavior.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Wave 1 plans (02/03/04) have RED test targets to turn GREEN
- `card-grid.test.tsx` stubs will be replaced with real `test(...)` bodies in Plan 03 when CardGrid gains `scrollContainerRef` prop and `useVirtualizer` rendering
- `catalog.test.ts` stubs will be driven to GREEN in Plan 04 when `getAllCards()` signature change is implemented

---

## Self-Check: PASSED

- `src/components/catalog/card-grid.test.tsx` — EXISTS
- `src/db/queries/catalog.test.ts` — EXISTS (modified)
- Commit `88c262c` — verified via git log
- Commit `6369832` — verified via git log

---

*Phase: 24-catalog-page-load-performance*
*Completed: 2026-05-26*

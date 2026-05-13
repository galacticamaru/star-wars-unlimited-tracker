---
phase: 13-advanced-filters
plan: 01
subsystem: testing
tags: [vitest, typescript, filter-cards, ownedOnly, tdd]

# Dependency graph
requires: []
provides:
  - "FilterState interface extended with ownedOnly?: boolean field"
  - "filterCards() extended with third collection: Record<number, number> = {} parameter"
  - "matchesOwned gate: !ownedOnly || (collection[card.id] ?? 0) >= 1"
  - "4 unit tests covering all ownedOnly behavior scenarios"
affects: [13-advanced-filters/13-02, 13-advanced-filters/13-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD RED/GREEN cycle for filter extension: write failing tests first, then implement"
    - "Default parameter collection = {} prevents breaking existing 2-arg call sites"
    - "ownedOnly gate short-circuits to true when toggle is off (no-op for non-authenticated)"

key-files:
  created: []
  modified:
    - src/lib/filter-cards.ts
    - src/lib/filter-cards.test.ts

key-decisions:
  - "collection parameter defaults to {} so existing filterCards() call sites need no changes"
  - "matchesOwned expression mirrors D-01: collection[id] >= 1 means at least 1 copy owned"
  - "ownedOnly field is optional (?: boolean) to keep FilterState backward-compatible"

patterns-established:
  - "Pattern: extend filterCards() for new filter criteria by adding to FilterState + new gate const + AND chain"

requirements-completed: [REQ-DECK-06]

# Metrics
duration: 8min
completed: 2026-05-13
---

# Phase 13 Plan 01: Advanced Filters — Filter Logic Summary

**filterCards() extended with ownedOnly boolean gate and collection parameter, backed by 4 TDD unit tests (RED then GREEN)**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-13T14:38:00Z
- **Completed:** 2026-05-13T14:46:00Z
- **Tasks:** 2 (TDD RED + GREEN)
- **Files modified:** 2

## Accomplishments
- Added `ownedOnly?: boolean` to `FilterState` interface — backward-compatible optional field
- Extended `filterCards()` with third `collection: Record<number, number> = {}` parameter — default prevents breaking existing 2-arg call sites
- Implemented `matchesOwned = !ownedOnly || (collection[card.id] ?? 0) >= 1` gate in AND chain
- 4 new unit tests covering: false pass-through, true owned card, true empty collection, AND with type filter
- All 15 tests pass; TypeScript compiles cleanly with no errors

## Task Commits

Each task was committed atomically:

1. **Task 1: RED — Write 4 failing ownedOnly test cases** - `3ee8d95` (test)
2. **Task 2: GREEN — Extend FilterState and filterCards() to pass tests** - `71acaaa` (feat)

**Plan metadata:** committed with SUMMARY.md

_TDD plan: RED commit (3 test failures) confirmed correct test wiring before implementation._

## Files Created/Modified
- `src/lib/filter-cards.test.ts` - Added `describe('ownedOnly filter')` block with 4 test cases
- `src/lib/filter-cards.ts` - Added `ownedOnly?: boolean` to FilterState; extended filterCards() signature; added matchesOwned gate

## Decisions Made
- Used optional `ownedOnly?: boolean` (not required) to keep FilterState backward-compatible with all existing spreads
- Default `collection = {}` parameter avoids updating existing `filterCards()` call sites in production code
- `matchesOwned` positioned last in the AND chain — consistent with existing gate ordering

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - implementation was straightforward. Full test suite has 4 pre-existing failures in DB-dependent tests (auth-config, api-deck-validation, prices, cron-route) that require DATABASE_URL env var — these are unrelated to this plan's changes.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `filterCards()` data layer contract is established and tested; Wave 2 plans (13-02, 13-03) can safely consume the new signature
- `FilterState.ownedOnly` is ready for nuqs integration in CatalogClient (plan 13-02)
- `collection` parameter is ready to receive the existing `collection` state from CatalogClient

---
*Phase: 13-advanced-filters*
*Completed: 2026-05-13*

---
phase: 15-deck-list-display-polish
plan: 01
subsystem: ui
tags: [react, useMemo, vitest, deck-builder, type-grouping]

# Dependency graph
requires: []
provides:
  - groupDeckCards() pure function in src/lib/deck-grouping.ts classifying DeckCard[] into 5 named groups
  - GroupedDeck interface with groundUnits, spaceUnits, upgrades, events, other arrays
  - deck-builder.tsx groupedDeck useMemo replacing flat mainDeck.map block
  - Per-type section render with aria-label, empty-section suppression, correct copy
  - Wave 0 test stubs for deck-grouping (8 tests, GREEN) and aspect-panel (5 tests, RED)
affects: [15-02, 15-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Pure helper function extracted to src/lib/ and tested in isolation (groupDeckCards)
    - useMemo chaining pattern — groupedDeck useMemo chains from mainDeck useMemo
    - TDD Wave 0 stubs — test files created before implementation to drive GREEN

key-files:
  created:
    - src/lib/deck-grouping.ts
    - __tests__/deck-grouping.test.ts
    - __tests__/aspect-panel.test.ts
  modified:
    - src/components/decks/deck-builder.tsx

key-decisions:
  - "groupDeckCards extracted to src/lib/ (not inline in component) to enable pure unit testing"
  - "Empty sections suppressed by returning null from the .map() — no heading rendered when group.length === 0 (D-02)"
  - "arenas guard uses card.arenas ?? [] to protect against null arenas (Assumption A1)"
  - "Section elements use <section aria-label={label}> per UI-SPEC accessibility contract"

patterns-established:
  - "Pure grouping helpers go in src/lib/ with matching __tests__ files"
  - "useMemo chains: groupedDeck depends on mainDeck, mainDeck depends on state.cards + cardMap"

requirements-completed: [REQ-DECK-07]

# Metrics
duration: 12min
completed: 2026-05-14
---

# Phase 15 Plan 01: Deck List Type-Grouping Summary

**groupDeckCards() pure helper and useMemo-driven type-grouped sections replacing flat Main Deck list in deck-builder.tsx, with Wave 0 TDD test stubs**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-05-14T11:46:00Z
- **Completed:** 2026-05-14T11:49:00Z
- **Tasks:** 2 (TDD RED + GREEN)
- **Files modified:** 4

## Accomplishments

- Created `src/lib/deck-grouping.ts` with `groupDeckCards()` pure function and `GroupedDeck` interface — classifies DeckCard[] into groundUnits, spaceUnits, upgrades, events, other using `card.arenas[]` (not `card.type` alone)
- Replaced flat "Main Deck (N)" heading + single `mainDeck.map()` block in `deck-builder.tsx` with per-type `<section>` elements; empty sections are hidden; section headers show group count with exact copy per UI-SPEC
- All 8 deck-grouping unit tests pass; aspect-panel tests remain RED (expected — modules not yet created, stub for Plan 03)

## Task Commits

1. **Task 1: Wave 0 test stubs** - `54e83d6` (test)
2. **Task 2: groupDeckCards + grouped sections** - `837577e` (feat)

## Files Created/Modified

- `src/lib/deck-grouping.ts` — groupDeckCards() pure function and GroupedDeck interface
- `__tests__/deck-grouping.test.ts` — 8 unit tests for groupDeckCards() (all passing)
- `__tests__/aspect-panel.test.ts` — 5 unit test stubs for filterAndSortAspects() (RED — Plan 03 will create the module)
- `src/components/decks/deck-builder.tsx` — import + groupedDeck useMemo + grouped sections render replacing flat card list

## Decisions Made

- `groupDeckCards` extracted to `src/lib/` (not inlined in the component) — enables pure unit testing without any React dependency
- `card.arenas ?? []` null guard ensures safe operation even if arenas field is unexpectedly absent (Assumption A1 from research)
- Section elements use `<section aria-label={label}>` per UI-SPEC accessibility contract (not `<div>`)
- `space-y-6` between groups per UI-SPEC spacing contract (24px)

## Deviations from Plan

None — plan executed exactly as written. Pre-existing test failures (DATABASE_URL, auth-config) are environment issues unrelated to this plan's scope and were not introduced by these changes.

## Issues Encountered

The vitest runner (invoked from the main repo) picks up both main repo tests and worktree test files. This caused pre-existing failures (cron-route, auth-config, prices, decks/page) to appear in the full suite output. Verified via git stash that all failures pre-date this plan's changes.

## Next Phase Readiness

- Plan 02 (leader/base art + hover preview) can begin immediately; `deck-builder.tsx` is in a clean state
- Plan 03 (aspect panel) will create `src/lib/aspect-panel.ts` to satisfy the RED test stubs in `__tests__/aspect-panel.test.ts`
- No blockers

---

*Phase: 15-deck-list-display-polish*
*Completed: 2026-05-14*

---
phase: 26-mobile-deck-builder-ux
plan: "01"
subsystem: test-infrastructure
tags: [test-infrastructure, nyquist-wave-0, vitest, jsdom, mobile-ux]
completed_date: "2026-05-29"
duration_minutes: 5

dependency_graph:
  requires: []
  provides:
    - "Wave 0 RED stub stubs for MOBILE-01/02/03/04 in deck-builder.test.tsx"
    - "Wave 0 MOBILE-02 catalog overlay stub in card-item.deck.test.tsx"
  affects:
    - "src/components/decks/deck-builder.test.tsx"
    - "src/components/catalog/card-item.deck.test.tsx"

tech_stack:
  added: []
  patterns:
    - "it.todo() stubs as Wave 0 pending tests (Nyquist validation strategy)"
    - "@vitest-environment jsdom directive on first line (matches existing card-item.deck.test.tsx)"

key_files:
  created:
    - src/components/decks/deck-builder.test.tsx
  modified:
    - src/components/catalog/card-item.deck.test.tsx

decisions:
  - "Used it.todo() exclusively — no render() calls or DeckBuilder imports in Wave 0 stubs per plan spec"
  - "Placed MOBILE-02 catalog stub inside the existing describe('CardItem Shortfall Logic') block as final test"

metrics:
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 1
---

# Phase 26 Plan 01: Wave 0 Test Stubs Summary

## One-liner

Created five `it.todo` RED stubs in `deck-builder.test.tsx` covering MOBILE-01/02/03/04 and extended `card-item.deck.test.tsx` with one `it.todo` MOBILE-02 catalog overlay stub — all pending, all exits 0 under vitest.

## What Was Built

### Task 1 — `src/components/decks/deck-builder.test.tsx` (new file)

New Wave 0 stub file for Phase 26. Contains one top-level `describe('DeckBuilder mobile layout')` block with exactly five `it.todo` stubs:

1. `MOBILE-01: renders sticky summary bar with class "md:hidden fixed bottom-0 left-0 right-0 h-14 z-50" on mobile` — per D-01
2. `MOBILE-01: Sheet is not visible initially (SheetContent absent from DOM until trigger tapped)` — per D-02
3. `MOBILE-02: deck list quantity +/- buttons render with class "h-11 w-11" (NOT h-8 w-8)` — per D-09, D-10
4. `MOBILE-03: toolbar root div has class "flex flex-col md:flex-row" (or equivalent two-row mobile layout)` — per D-06
5. `MOBILE-04: inline DeckSidebar wrapper has class "hidden md:flex" so sidebar is desktop-only inline` — per D-05

File has `// @vitest-environment jsdom` as first line. Only imports `describe, it` from `vitest`. No `render()`, no DeckBuilder import — these are Wave 1 additions.

`npx vitest run src/components/decks/deck-builder.test.tsx` → 5 todo, 0 failed, 0 passed. Exit 0.

### Task 2 — `src/components/catalog/card-item.deck.test.tsx` (extended)

Added one new `it.todo` at the end of the existing `describe('CardItem Shortfall Logic')` block:

```
it.todo('MOBILE-02: selector-mode overlay +/- buttons have class min-h-[44px] min-w-[44px] (replaces p-1)')
```

The four existing tests are unchanged. The description includes both `MOBILE-02` and the literal Tailwind class strings `min-h-[44px]` and `min-w-[44px]` so Plan 03's implementation can grep for it.

`npx vitest run src/components/catalog/card-item.deck.test.tsx` → 4 passed, 1 todo. Exit 0.

## Commits

| Task | Commit | Files |
|------|--------|-------|
| Task 1 | `25ebad6` | `src/components/decks/deck-builder.test.tsx` (created) |
| Task 2 | `4abe63d` | `src/components/catalog/card-item.deck.test.tsx` (modified) |

## Verification Results

- `npx vitest run src/components/decks/deck-builder.test.tsx` → Exit 0, 5 todo
- `npx vitest run src/components/catalog/card-item.deck.test.tsx` → Exit 0, 4 passed + 1 todo
- Full suite (`npx vitest run`) → Pre-existing 11 test file failures confirmed unchanged (DATABASE_URL missing, catalog variant logic, binder mock issues — all pre-existing; none caused by this plan's changes)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

The stub tests in `deck-builder.test.tsx` and the MOBILE-02 stub in `card-item.deck.test.tsx` are intentional Wave 0 pending markers. They do not yet assert anything — that is by design. Wave 1 plans (02/03/04) will convert them to full `it(...)` bodies once the implementation lands.

## Threat Flags

None. This plan only creates test stubs. No new network endpoints, auth paths, file access patterns, or schema changes.

## Self-Check: PASSED

- `src/components/decks/deck-builder.test.tsx` exists: FOUND
- `src/components/catalog/card-item.deck.test.tsx` modified: FOUND
- Commit `25ebad6` exists: FOUND
- Commit `4abe63d` exists: FOUND
- Both files contain correct `it.todo` stubs: VERIFIED
- `deck-builder.test.tsx` does NOT contain `render(`: VERIFIED
- Full suite failures are pre-existing (identical count before and after changes): VERIFIED

---
phase: 26-mobile-deck-builder-ux
plan: "03"
subsystem: touch-targets
tags: [mobile-ux, touch-targets, wcag-2-5-5, deck-builder, card-catalog]
completed_date: "2026-05-29"
duration_minutes: 10

dependency_graph:
  requires: ["26-01"]
  provides:
    - "Deck list +/- buttons sized 44px (h-11 w-11) in deck-builder.tsx"
    - "Move to SB / Move to Main buttons sized 44px tall (h-11) in deck-builder.tsx"
    - "Selector-mode catalog overlay +/- buttons with min-h-[44px] min-w-[44px] in card-item.tsx"
    - "MOBILE-02 Wave 0 stubs converted to GREEN in both test files"
  affects:
    - "src/components/decks/deck-builder.tsx"
    - "src/components/catalog/card-item.tsx"
    - "src/components/decks/deck-builder.test.tsx"
    - "src/components/catalog/card-item.deck.test.tsx"

tech_stack:
  added: []
  patterns:
    - "Tailwind h-11 w-11 override via cn() tailwind-merge (size-8 from buttonVariants overridden)"
    - "min-h-[44px] min-w-[44px] flex items-center justify-center for overlay button touch target expansion"
    - "TDD RED/GREEN cycle for both tasks"

key_files:
  created: []
  modified:
    - src/components/decks/deck-builder.tsx
    - src/components/catalog/card-item.tsx
    - src/components/decks/deck-builder.test.tsx
    - src/components/catalog/card-item.deck.test.tsx

decisions:
  - "Used className override pattern (h-11 w-11 via cn() tailwind-merge) rather than dropping size='icon' — preserves non-dimension CVA styling while overriding dimensions"
  - "min-h rather than h for catalog overlay buttons — minimum constraint allows parent flex row to expand to fit; fixed h would not adapt to container"
  - "Scope limited strictly to selector-mode (isSelector branch) buttons in card-item.tsx per D-10; onUpdateCount catalog-mode buttons unchanged"

metrics:
  tasks_completed: 2
  tasks_total: 2
  files_created: 0
  files_modified: 4
---

# Phase 26 Plan 03: Touch Target Upgrade (MOBILE-02) Summary

## One-liner

Six className edits across deck-builder.tsx and card-item.tsx upgrade all deck builder +/- and action buttons to the 44px WCAG 2.5.5 / Apple HIG minimum touch target, with MOBILE-02 Wave 0 stubs converted to GREEN in both test files.

## What Was Built

### Task 1 — `src/components/decks/deck-builder.tsx` + `deck-builder.test.tsx`

Six className changes in deck-builder.tsx (TDD RED → GREEN):

1. **Main deck `-` button** (line 543): `className="h-8 w-8"` → `className="h-11 w-11"`
2. **Main deck `+` button** (line 544): `className="h-8 w-8"` → `className="h-11 w-11"`
3. **Move to SB button** (lines 545-553): `className="h-8 text-xs text-amber-600..."` → `className="h-11 text-xs text-amber-600..."`
4. **Sideboard `-` button** (line 598): `className="h-8 w-8"` → `className="h-11 w-11"`
5. **Sideboard `+` button** (line 599): `className="h-8 w-8"` → `className="h-11 w-11"`
6. **Move to Main button** (lines 600-607): `className="h-8 text-xs text-indigo-600..."` → `className="h-11 text-xs text-indigo-600..."`

The `size="icon"` prop is kept — tailwind-merge resolves the `h-11 w-11` className override on top of `size-8` from buttonVariants. No onChange to onClick handlers, disabled logic, aria-labels, or button labels.

MOBILE-02 deck list stub in `deck-builder.test.tsx` converted from `it.todo` to full `it(...)` body. Renders DeckBuilder with a fixture containing one main deck card (`cardDefinitionId: 100, quantity: 2, isSideboard: false`) and asserts `container.querySelectorAll('button.h-11.w-11').length >= 2`.

### Task 2 — `src/components/catalog/card-item.tsx` + `card-item.deck.test.tsx`

Two className changes in card-item.tsx selector-mode branch (TDD RED → GREEN):

1. **Decrease deck count button** (aria-label="Decrease deck count"): `className="p-1 hover:bg-muted rounded-full transition-colors"` → `className="min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-muted rounded-full transition-colors"`
2. **Increase deck count button** (aria-label="Increase deck count"): same replacement

The two `p-1` buttons in the `onUpdateCount` catalog-mode branch (aria-label="Decrease/Increase owned count") are intentionally unchanged per D-10 scope restriction. Icon sizes (`w-4 h-4` on Minus/Plus components) unchanged — visible icon stays compact while touch target area grows around it.

MOBILE-02 catalog overlay stub in `card-item.deck.test.tsx` converted from `it.todo` to full `it(...)` body. Renders `<CardItem {...defaultProps} mode="selector" deckCount={1} />` and asserts at least 2 buttons have both `min-h-[44px]` and `min-w-[44px]` in className. Test suite goes from 4 passed + 1 todo to 5 passed + 0 todo.

## Commits

| Task | Commit | Files |
|------|--------|-------|
| Task 1 | `911af34` | `src/components/decks/deck-builder.tsx`, `src/components/decks/deck-builder.test.tsx` |
| Task 2 | `ac1c2e6` | `src/components/catalog/card-item.tsx`, `src/components/catalog/card-item.deck.test.tsx` |

## Verification Results

- `npx vitest run src/components/decks/deck-builder.test.tsx` → 4 passed, 1 todo (MOBILE-03 for Plan 04), 0 failed. Exit 0.
- `npx vitest run src/components/catalog/card-item.deck.test.tsx` → 5 passed, 0 todo, 0 failed. Exit 0.
- Both files together → 9 passed, 1 todo, 0 failed. Exit 0.
- Full suite → 11 pre-existing failures unchanged (DATABASE_URL missing, legacy jest format tests in `__tests__/`). Not caused by this plan.
- `npx tsc --noEmit` → 0 errors in modified files. Pre-existing errors in `__tests__/` legacy jest files confirmed unchanged.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All touch target upgrades are wired to real component className strings. No placeholder values.

## Threat Flags

None. This plan only modifies Tailwind className strings. No new network endpoints, auth paths, file access patterns, or schema changes.

## Self-Check: PASSED

- `src/components/decks/deck-builder.tsx` contains `className="h-11 w-11"` 4 times: VERIFIED
- `src/components/decks/deck-builder.tsx` contains 0 occurrences of `className="h-8 w-8"`: VERIFIED
- `src/components/decks/deck-builder.tsx` contains `h-11 text-xs text-amber-600` once: VERIFIED
- `src/components/decks/deck-builder.tsx` contains `h-11 text-xs text-indigo-600` once: VERIFIED
- `src/components/catalog/card-item.tsx` contains `min-h-[44px] min-w-[44px]` 2 times: VERIFIED
- `src/components/catalog/card-item.tsx` contains `p-1 hover:bg-muted rounded-full transition-colors` 2 times (unchanged): VERIFIED
- `src/components/catalog/card-item.tsx` contains aria-labels for both deck count buttons: VERIFIED
- `src/components/catalog/card-item.tsx` contains `<Minus className="w-4 h-4" />` and `<Plus className="w-4 h-4" />`: VERIFIED
- Commit `911af34` exists: FOUND
- Commit `ac1c2e6` exists: FOUND

---
phase: 09-Sideboard
plan: "02"
subsystem: deck-builder
tags:
  - sideboard
  - deck-builder
  - ui
dependency_graph:
  requires:
    - "09-01"  # sideboardCostCurve available from validation layer
  provides:
    - handleMoveToSideboard
    - handleMoveToMain
    - Sideboard section in Deck List editor
  affects:
    - src/components/decks/deck-builder.tsx
tech_stack:
  added: []
  patterns:
    - Two-dispatch move pattern (decrement source, increment target) using UPDATE_CARD
    - sideboardTotal useMemo for UI disabled-state guard
    - Always-visible sideboard section with empty state
key_files:
  created: []
  modified:
    - src/components/decks/deck-builder.tsx
decisions:
  - "handleMoveToSideboard uses two UPDATE_CARD dispatches (not a new reducer action) — consistent with existing handleDeckUpdate pattern"
  - "sideboardTotal derived from sideboard useMemo (not state.cards) — avoids duplication and stays in sync with rendered sideboard array"
  - "Empty state uses p-8 (not p-12) per UI-SPEC C-04 — sideboard is always in view below existing content so less padding appropriate"
  - "Sideboard quantity badge uses bg-amber-100 text-amber-600 (not bg-slate-100 text-indigo-600) for visual distinction from main deck rows"
metrics:
  duration: "~5 minutes"
  completed: "2026-05-11"
  tasks_completed: 2
  files_changed: 1
---

# Phase 9 Plan 02: Sideboard UI — Move Handlers and Deck List Section Summary

**One-liner:** Added `handleMoveToSideboard`/`handleMoveToMain` handlers and always-visible sideboard section with amber-tinted rows to the Deck List editor in `deck-builder.tsx`.

## What Was Built

Extended `src/components/decks/deck-builder.tsx` with full sideboard management UI in the Deck List editor tab:

1. **`handleMoveToSideboard(cardDefinitionId)` handler** — two `UPDATE_CARD` dispatches: decrements the card's main count by 1 (removing the entry when it hits 0) and increments its sideboard count by 1.

2. **`handleMoveToMain(cardDefinitionId)` handler** — mirror operation: decrements sideboard count by 1 and increments main count by 1.

3. **`sideboardTotal` useMemo** — derives the total sideboard card count from the existing `sideboard` computed array, used to gate the "Move to SB" disabled state.

4. **"Move to SB" button on each main deck row** — amber-tinted outline button appended after the existing `–`/`+` controls, `disabled={sideboardTotal >= 10}` enforcing the 10-card cap.

5. **Sideboard section below the main deck list** — always rendered in the Deck List editor tab:
   - Header: `Sideboard (N / 10)` showing live count
   - Rows: amber quantity badge (`bg-amber-100 text-amber-600`), card name/type/cost, `–`/`+` controls, "Move to Main" button
   - Empty state: instructional text pointing users to "Move to SB"

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Add move handlers and "Move to SB" button on main deck rows | `be6b3ca` |
| 2 | Add sideboard section below main deck list in Deck List editor | `05e7d08` |

## Verification

All plan acceptance criteria confirmed by grep:

```
handleMoveToSideboard count: 2 (definition + onClick usage)
handleMoveToMain count: 1 (definition; usage in sideboard rows)
sideboardTotal useMemo: 1
Move to SB: 2 (button label + empty state text reference)
sideboardTotal >= 10: 1 (disabled condition)
Sideboard (: 1 (h3 header)
/ 10): 1 (header cap display)
Move to Main: 1 (sideboard row button)
No sideboard cards yet: 1 (empty state)
bg-amber-100: 1 (sideboard quantity badge)
isSideboard: true: 4 (handleMoveToSideboard x2, sideboard row - and + buttons)
```

TypeScript check: one pre-existing error in `src/lib/sync/prices.test.ts` (PriceData export), not introduced by this plan.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All handlers are wired to real reducer dispatches. The sideboard section renders from live `sideboard` state. No placeholder values or hardcoded data.

## Threat Flags

No new threat surface introduced. All `handleMoveToSideboard`/`handleMoveToMain` operations are client-side state mutations only. No new network calls, file access, or auth paths added. Matches T-09-03 and T-09-04 accepted dispositions from the plan threat model.

## Self-Check: PASSED

- `src/components/decks/deck-builder.tsx` exists and contains `handleMoveToSideboard`, `handleMoveToMain`, `sideboardTotal`, "Move to SB" button, sideboard section with "Sideboard (" h3 heading
- Task 1 commit `be6b3ca` exists in git log
- Task 2 commit `05e7d08` exists in git log

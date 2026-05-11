---
phase: 09-Sideboard
plan: "01"
subsystem: deck-validation
tags:
  - tdd
  - sideboard
  - validation
  - cost-curve
dependency_graph:
  requires: []
  provides:
    - ValidationStats.sideboardCostCurve
    - validateDeck sideboard 10-card limit error
  affects:
    - src/components/decks/deck-sidebar.tsx
tech_stack:
  added: []
  patterns:
    - TDD RED/GREEN with vitest
    - TypeScript interface extension (additive, non-breaking)
key_files:
  created: []
  modified:
    - src/lib/deck-validation.ts
    - src/lib/deck-validation.test.ts
decisions:
  - "sideboardCostCurve uses same Math.min(cost, 9) capping as main costCurve — consistent chart behaviour"
  - "Sideboard size check placed after cardQuantities loop (before return) — follows existing error-accumulation pattern"
metrics:
  duration: "~2 minutes"
  completed: "2026-05-11"
  tasks_completed: 2
  files_changed: 2
---

# Phase 9 Plan 01: Sideboard Validation — Cost Curve + 10-Card Limit Summary

**One-liner:** Added `sideboardCostCurve: Record<number, number>` to `ValidationStats` and 10-card sideboard limit enforcement to `validateDeck()` using TDD.

## What Was Built

Extended `src/lib/deck-validation.ts` with two new behaviors required by Phase 9 (Sideboard):

1. **`sideboardCostCurve` field in `ValidationStats`** — populated from sideboard card costs with the same `Math.min(cost, 9)` capping logic used by `costCurve`. This enables the stacked amber/main cost curve bars in Plan 02 (`DeckSidebar`).

2. **10-card sideboard limit validation** — after processing all cards, `validateDeck()` sums sideboard quantities and pushes `'Sideboard cannot exceed 10 cards'` to `errors` if the total exceeds 10.

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED (test) | `2106efc` | PASSED — 5 new tests failed as expected |
| GREEN (impl) | `88dcc77` | PASSED — all 15 tests pass |
| REFACTOR | n/a | No cleanup needed |

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| RED | Add 7 failing sideboard tests to `deck-validation.test.ts` | `2106efc` |
| GREEN | Implement `sideboardCostCurve` + limit check in `deck-validation.ts` | `88dcc77` |

## Verification

```
Test Files  1 passed (1)
     Tests  15 passed (15)
```

All 15 tests pass including the 7 new sideboard tests:
- "should reject sideboard exceeding 10 cards"
- "should allow sideboard of exactly 10 cards"
- "should allow empty sideboard with no sideboard error"
- "should populate sideboardCostCurve from sideboard cards"
- "should cap sideboardCostCurve at key 9 for cost >= 9"
- "should return empty sideboardCostCurve when no sideboard cards"
- "should not include sideboard costs in main costCurve"

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. `sideboardCostCurve` is a real computed value derived from sideboard card data. No placeholder values.

## Threat Flags

No new threat surface introduced. Changes are pure client-side transform logic with no network, file, or database access (matches T-09-02 accepted disposition in plan threat model).

## Self-Check: PASSED

- `src/lib/deck-validation.ts` exists and contains `sideboardCostCurve`
- `src/lib/deck-validation.test.ts` contains 7 new sideboard tests
- RED commit `2106efc` exists in git log
- GREEN commit `88dcc77` exists in git log
- All 15 tests pass

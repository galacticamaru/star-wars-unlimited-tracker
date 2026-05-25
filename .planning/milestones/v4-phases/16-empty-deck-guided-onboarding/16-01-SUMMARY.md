---
phase: 16-empty-deck-guided-onboarding
plan: "01"
subsystem: lib
tags:
  - tdd
  - filter
  - pure-function
  - deck-builder
dependency_graph:
  requires: []
  provides:
    - src/lib/auto-filter.ts (AutoFilter, computeAutoFilter, computeAutoFilterLabel)
  affects:
    - Wave 2 plans: sidebar-filters, catalog-client
    - Wave 3 plan: deck-builder
tech_stack:
  added: []
  patterns:
    - TDD RED/GREEN with vitest node environment
    - Set-union pattern mirrored from deck-validation.ts combinedAspects
key_files:
  created:
    - src/lib/auto-filter.ts
    - src/lib/auto-filter.test.ts
  modified: []
decisions:
  - D-01 three-state machine encoded as pure function (types filter when !leader || !base; aspects union when both set)
  - D-08 Basic exclusion enforced in computeAutoFilter and explicitly tested
  - D-09 chip-label strings are single source of truth in computeAutoFilterLabel
metrics:
  duration: "~80 seconds"
  completed: "2026-05-15"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 0
---

# Phase 16 Plan 01: Auto-Filter Pure Functions Summary

**One-liner:** Pure AutoFilter contract layer (`computeAutoFilter` + `computeAutoFilterLabel`) with 12 unit tests encoding D-01 three states, D-08 Basic exclusion, and D-09 chip-label strings.

## What Was Built

Two files:

**`src/lib/auto-filter.ts`** — 3 exports:

```typescript
// AutoFilter shape
export interface AutoFilter {
  types?: string[];    // set when leader or base is missing (D-01 empty/leader-only)
  aspects?: string[];  // set when both leader and base are selected (D-01 both-selected)
}

// Derives filter target from deck state
export function computeAutoFilter(
  leader: Card | null,
  base: Card | null
): AutoFilter | null

// Derives chip label for the informational UI badge
export function computeAutoFilterLabel(
  autoFilter: AutoFilter | null,
  isOverridden: boolean
): string | null
```

**`src/lib/auto-filter.test.ts`** — 12 unit tests covering:
- All three D-01 states (null/null, leader-only, base-only, both-selected)
- D-08 Basic aspect exclusion (explicit `not.toContain('Basic')` assertion)
- D-09 exact label strings (`'Auto: Leader & Base'`, `'Auto: Aspect filter'`)
- Override suppression (`isOverridden=true` → returns null)
- Empty aspects array edge case (`aspects=[]` is a valid aspects filter state, not null)

## Decisions Encoded

| Decision | Encoded Where | Test Coverage |
|----------|--------------|---------------|
| D-01: types filter when no leader OR no base | `computeAutoFilter` (!leader \|\| !base branch) | Tests 1–3 |
| D-01: aspects union when both selected | `computeAutoFilter` (Set-union of leader+base aspects) | Tests 4–7 |
| D-08: exclude "Basic" from aspect union | `if (a !== 'Basic') combined.add(a)` | Test 6, 7 |
| D-09: "Auto: Leader & Base" label | `computeAutoFilterLabel` types branch | Test 10 |
| D-09: "Auto: Aspect filter" label | `computeAutoFilterLabel` aspects branch | Tests 11, 12 |
| D-09: chip hidden when overridden | `computeAutoFilterLabel` isOverridden guard | Test 8 |

## TDD Gate Compliance

- RED commit: `e3fc6f1` — `test(16-01): add failing tests for computeAutoFilter and computeAutoFilterLabel`
- GREEN commit: `4302964` — `feat(16-01): implement computeAutoFilter and computeAutoFilterLabel`
- REFACTOR: Not needed — implementation was clean on first pass

Both gates present in correct order.

## Re-Verification Command

```bash
npx vitest run src/lib/auto-filter.test.ts
```

Expected: 12 tests passing, 0 failing.

## Deviations from Plan

None — plan executed exactly as written. Both files created with exact content specified in the plan action blocks. All 12 tests pass on GREEN. TypeScript check passes.

## Known Stubs

None. This is a pure-function library with no UI rendering and no data sources.

## Threat Flags

None. Pure derivation functions over already-trusted in-memory Card objects. No I/O, no network, no user input.

## Self-Check

- [x] `src/lib/auto-filter.ts` exists
- [x] `src/lib/auto-filter.test.ts` exists
- [x] RED commit `e3fc6f1` exists in git log
- [x] GREEN commit `4302964` exists in git log
- [x] 12 tests pass under `npx vitest run src/lib/auto-filter.test.ts`
- [x] `npx tsc --noEmit` exits 0
- [x] 3 exports confirmed (`grep -c "export" src/lib/auto-filter.ts` = 3)

## Self-Check: PASSED

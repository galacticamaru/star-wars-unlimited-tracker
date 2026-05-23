---
phase: 21-binder-variant-badges
plan: "01"
subsystem: catalog/card-item
tags: [tdd, nyquist, tests, binder, variant-badges]
dependency_graph:
  requires: []
  provides: [nyquist-gate-21-variant-badge]
  affects: [src/components/catalog/card-item.test.tsx]
tech_stack:
  added: []
  patterns: [vitest, testing-library, tdd-red-phase]
key_files:
  created: []
  modified:
    - src/components/catalog/card-item.test.tsx
decisions:
  - "variantType prop does not exist in CardItemProps yet — Foil badge test is RED as required"
  - "Normal badge test passes even pre-implementation (absence assertion) — exit is still non-zero from Foil test failure"
metrics:
  duration: "~5 minutes"
  completed: "2026-05-23"
---

# Phase 21 Plan 01: Binder Variant Badge — Nyquist Gate (Wave 0) Summary

Wrote 2 new test cases in `card-item.test.tsx` that define the acceptance contract for the variant badge behavior in binder mode. The Foil badge test is RED (failing) because `variantType` prop does not exist in `CardItemProps` yet. The Normal absence test passes naturally. The test suite exits non-zero — the Wave 0 Nyquist gate is active and Wave 1 implementation must turn the Foil test GREEN.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend card-item.test.tsx with 2 failing badge tests | a61c86b | src/components/catalog/card-item.test.tsx |

## Verification

- `npx vitest run src/components/catalog/card-item.test.tsx` — exits non-zero (1 test failed) ✓
- "shows variant badge in binder mode when variantType is 'Foil'" — FAILS (RED gate active) ✓
- "does not show variant badge in binder mode when variantType is 'Normal'" — PASSES (absence assertion, correct) ✓
- All 5 pre-existing tests remain GREEN ✓
- Test file contains `screen.getByText('Foil')` ✓
- Test file contains `screen.queryByText('Normal')` ✓

## Deviations from Plan

**1. [Rule 1 - Observation] Only 1 of 2 new tests is RED**

- **Found during:** Task 1 verification
- **Issue:** The plan stated "the 2 new tests fail" but the Normal absence test (`screen.queryByText('Normal') === null`) passes even pre-implementation because the component ignores the unknown `variantType` prop and never renders the text "Normal". TypeScript/React spread accepts extra props silently.
- **Fix:** No fix needed. The test is correctly written. The exit code is non-zero due to the Foil test failure, satisfying the Nyquist gate. The Normal test's behavior is correct throughout the TDD lifecycle (it passes before and after implementation).
- **Files modified:** None — test is correct as-is.
- **Commit:** a61c86b (same task commit)

## Known Stubs

None — this plan only adds tests.

## Threat Flags

None — test-only changes, no production trust boundary crossed.

## Self-Check: PASSED

- `src/components/catalog/card-item.test.tsx` — file exists and contains both new test names ✓
- Commit `a61c86b` exists in git log ✓
- Exit code non-zero on `npx vitest run` ✓

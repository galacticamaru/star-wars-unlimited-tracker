---
phase: 27-decks-route-performance
plan: "02"
subsystem: ui
tags: [perf, startTransition, react, router-cache, inp]
requires:
  - phase: 27-00
    provides: deck-builder-perf.test.ts RED stubs for PERF-08 startTransition assertions
provides:
  - startTransition-wrapped dispatches in handleDeckUpdate (PERF-08)
  - router.refresh() in handleSave on success (PERF-07 D-05)
affects: [src/components/decks/deck-builder.tsx]
tech-stack:
  added: []
  patterns: [startTransition-wrapped-dispatch, router-refresh-on-save-success]
key-files:
  created: []
  modified:
    - src/components/decks/deck-builder.tsx
    - src/components/decks/deck-builder-perf.test.ts
key-decisions:
  - "startTransition imported from 'react' (named export), not from 'next'"
  - "setIsAutoFilterOverridden(false) kept outside startTransition callbacks (Pitfall 4 — must apply immediately)"
  - "router.refresh() placed before router.push('/decks') inside if (res.ok) block (Pitfall 2 — refresh before navigation)"
  - "handleSave not wrapped in startTransition (D-08 — async network call conflicts with setIsSaving loading state)"
  - "Fixed deck-builder-perf.test.ts: replaced indexOf position-ordering assertions with regex match (type definitions contain same string literals as dispatch calls, making indexOf ordering unreliable)"
  - "Fixed deck-builder-perf.test.ts: replaced /s flag regex with [\\s\\S] pattern (ES2017 target does not support dotAll flag)"
patterns-established:
  - "startTransition wrapping: wrap ONLY the dispatch call inside startTransition(() => { ... }); state setters that must apply immediately remain outside"
  - "router-refresh-before-push: always call router.refresh() before router.push() when both are needed to ensure Router Cache is busted before navigation"
requirements-completed: [PERF-08, PERF-07]
duration: ~12min
completed: "2026-06-02"
---

# Phase 27 Plan 02: deck-builder.tsx Performance Optimizations Summary

**startTransition wraps the three high-frequency add/remove dispatches in handleDeckUpdate (PERF-08/INP fix) and router.refresh() busts the Router Cache on save success (PERF-07 D-05).**

## Performance

- **Duration:** ~12 minutes
- **Started:** 2026-06-02T15:23:00Z
- **Completed:** 2026-06-02T15:27:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Wrapped SET_LEADER, SET_BASE, and UPDATE_CARD dispatch calls in `startTransition(() => { ... })` so rapid add/remove taps no longer block input handling (INP optimization)
- setIsAutoFilterOverridden(false) deliberately kept OUTSIDE the transitions — stays synchronous for immediate UI feedback (Pitfall 4 mitigation)
- Added router.refresh() to handleSave inside the `if (res.ok)` block, before the conditional router.push('/decks') — busts Router Cache so /decks reflects deck changes after navigation
- Fixed two test correctness issues in deck-builder-perf.test.ts (Rule 1 auto-fixes)

## Task Commits

Each task was committed atomically:

1. **Task 1: Wrap handleDeckUpdate dispatch calls in startTransition** - `e0a90ee` (feat)
2. **Task 2: Add router.refresh() to handleSave on success** - `8e8eaa7` (feat)

## Files Created/Modified

- `src/components/decks/deck-builder.tsx` — Added startTransition to React import; wrapped three dispatch calls in handleDeckUpdate in startTransition; added router.refresh() inside handleSave if (res.ok) block before router.push
- `src/components/decks/deck-builder-perf.test.ts` — Fixed SET_LEADER/SET_BASE/UPDATE_CARD assertions to use regex match instead of indexOf position comparison; replaced /s flag with [\s\S] for ES2017 target compatibility

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed deck-builder-perf.test.ts indexOf position assertions**
- **Found during:** Task 1 — test run after implementing startTransition
- **Issue:** Wave 0 RED stubs used `indexOf('startTransition(')` compared to `indexOf("'SET_LEADER'")` to verify the ordering. However, `'SET_LEADER'` appears first in the DeckAction type definition (line ~35) while `startTransition(` only appears in `handleDeckUpdate` (line ~250). When RED (startTransition absent), `startTransitionIndex = -1` made `expect(setLeaderIndex).toBeGreaterThan(-1)` pass — a coincidentally correct RED. After implementation, `startTransitionIndex = 9982` and `setLeaderIndex = 1333`, failing the assertion despite correct implementation.
- **Fix:** Replaced position-ordering assertions with regex match: `/startTransition\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?'SET_LEADER'/` which directly verifies the structural relationship.
- **Files modified:** src/components/decks/deck-builder-perf.test.ts
- **Commit:** e0a90ee (bundled with Task 1)

**2. [Rule 1 - Bug] Fixed /s regex flag for ES2017 target compatibility**
- **Found during:** Task 1 — tsc --noEmit check after test implementation
- **Issue:** Initial regex fix used `/s` (dotAll) flag which requires ES2018+ target. tsconfig.json has `"target": "ES2017"`, causing TS1501 errors in the test file.
- **Fix:** Replaced `/s` flag with `[\s\S]` pattern (equivalent but ES2017-compatible).
- **Files modified:** src/components/decks/deck-builder-perf.test.ts
- **Commit:** 8e8eaa7 (bundled with Task 2)

## Known Stubs

None — no placeholder values or hardcoded empty data introduced.

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes. All changes are client-side React state/transition wrappers.

T-27-02-01 mitigated: `setIsAutoFilterOverridden(false)` confirmed outside all startTransition callbacks.
T-27-02-02 mitigated: `router.refresh()` confirmed inside `if (res.ok)` block only (not in error/catch branches).

## Self-Check: PASSED

Files modified exist:
- src/components/decks/deck-builder.tsx: FOUND
- src/components/decks/deck-builder-perf.test.ts: FOUND

Commits exist:
- e0a90ee: Task 1 commit
- 8e8eaa7: Task 2 commit

Test suite: npx vitest run src/components/decks/deck-builder-perf.test.ts → 6/6 passed

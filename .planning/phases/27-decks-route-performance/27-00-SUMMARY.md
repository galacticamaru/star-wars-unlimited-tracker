---
phase: 27-decks-route-performance
plan: "00"
subsystem: testing
tags: [tdd, caching, perf, red-green]
dependency_graph:
  requires: []
  provides: [27-00-test-stubs]
  affects: [src/db/queries/decks.ts, src/app/api/decks/route.ts, src/app/api/decks/[id]/route.ts, src/components/decks/deck-builder.tsx, src/components/decks/decks-client.tsx]
tech_stack:
  added: []
  patterns: [source-inspection-tests, vitest-vi-mock, dynamic-import-beforeEach]
key_files:
  created:
    - src/db/queries/decks.test.ts
    - __tests__/api-deck-revalidate.test.ts
    - src/components/decks/deck-builder-perf.test.ts
  modified:
    - src/app/decks/page.test.tsx
decisions:
  - Used deck-builder-perf.test.ts instead of deck-builder.test.tsx to avoid environment conflict with Phase 26 jsdom tests
  - Source-inspection pattern (readFileSync) avoids DATABASE_URL trap for node-environment test files
  - Dynamic import in beforeEach for api-deck-revalidate.test.ts mirrors cron-route.test.ts pattern
metrics:
  duration: "~8 minutes"
  completed: "2026-06-02T05:19:00Z"
  tasks_completed: 3
  files_changed: 4
---

# Phase 27 Plan 00: Wave 0 Test Infrastructure Summary

**One-liner:** Four Phase 27 test files establish RED baseline for PERF-07 cache-tag + revalidateTag assertions and PERF-08 startTransition assertions, all running without DATABASE_URL crash.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Source-inspection stub for deck query caching | fb4a825 | src/db/queries/decks.test.ts (created) |
| 2 | revalidateTag mock stub for deck mutation handlers | 9b09066 | __tests__/api-deck-revalidate.test.ts (created) |
| 3 | startTransition source stub + retarget page.test.tsx | 3f80573 | src/components/decks/deck-builder-perf.test.ts (created), src/app/decks/page.test.tsx (modified) |

## What Was Built

**Task 1 — `src/db/queries/decks.test.ts` (node environment)**
Source-inspection test file that reads `decks.ts` via `readFileSync` and asserts:
- `getDecks()` contains `'use cache'` directive, `cacheTag(\`decks-user-${userId}\`)`, and `cacheLife()`
- `getDeckWithCards()` contains `'use cache'`, `cacheTag(\`deck-${deckId}-user-${userId}\`)`, and `cacheLife()`
- Ownership clause `and(eq(decks.id, deckId), eq(decks.userId, userId))` still present (Pitfall 3 guard)
- Runs without DATABASE_URL error; 6 of 8 tests fail RED (missing cache directives)

**Task 2 — `__tests__/api-deck-revalidate.test.ts` (node environment)**
Mock-based test file that exercises real handler control flow (auth → mutation → response) with `revalidateTag` as a spy. Asserts:
- POST `/api/decks`: `revalidateTag('decks-user-7', 'max')` called after deck creation
- PATCH `/api/decks/[id]`: both `revalidateTag('deck-5-user-7', 'max')` and `revalidateTag('decks-user-7', 'max')` called (D-04 two-tag rule)
- DELETE `/api/decks/[id]`: same two-tag pattern after deletion
- All 3 fail RED; DB/auth/validation fully mocked so no DATABASE_URL error

**Task 3A — `src/components/decks/deck-builder-perf.test.ts` (node environment)**
Source-inspection test file asserting PERF-08 startTransition requirements:
- `startTransition` is imported from `'react'`
- `SET_LEADER`, `SET_BASE`, `UPDATE_CARD` dispatches each appear after a `startTransition(` opener
- At least 3 `startTransition(` occurrences in source
- `setIsAutoFilterOverridden(false)` remains outside transitions (Pitfall 4)
- 5 of 6 fail RED (startTransition not yet in source); 1 passes (Pitfall 4 guard — already present)

**Task 3B — `src/app/decks/page.test.tsx` (jsdom environment — retargeted)**
Replaced RSC `./page` import (DATABASE_URL crash) with `DecksClient` rendered directly:
- Mocks `next/navigation` with `mockRouter = { push: vi.fn(), refresh: vi.fn() }`
- Mocks `@/components/catalog/card-item` to prevent heavy catalog dep chain
- Delete test asserts `mockRouter.refresh` called after DELETE success (RED — not yet wired)
- Create test asserts `mockRouter.push('/decks/123')` (passes — wired in current code)

## Verification

```
npx vitest run src/db/queries/decks.test.ts __tests__/api-deck-revalidate.test.ts \
  src/components/decks/deck-builder-perf.test.ts src/app/decks/page.test.tsx
```

**Result:** 4 test files, 15 failing (RED), 5 passing — zero DATABASE_URL load errors.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Conflict] Used deck-builder-perf.test.ts instead of deck-builder.test.tsx**
- **Found during:** Task 3
- **Issue:** `src/components/decks/deck-builder.test.tsx` already exists from Phase 26 work with `// @vitest-environment jsdom` and active rendering tests (MOBILE-01 through MOBILE-04). The plan's Task 3 requires `// @vitest-environment node` for source inspection. Changing the environment would break Phase 26 tests.
- **Fix:** Created `src/components/decks/deck-builder-perf.test.ts` (node environment) as a sibling file for Phase 27 PERF-08 source-inspection stubs. The `deck-builder.test.tsx` file was left unchanged.
- **Files modified:** src/components/decks/deck-builder-perf.test.ts (created), src/components/decks/deck-builder.test.tsx (not modified)
- **Commit:** 3f80573

## Known Stubs

None — these are intentionally RED test stubs establishing the Wave 0 baseline. No production code was modified.

## Threat Flags

None. No new network endpoints, auth paths, or schema changes introduced. Test files only.

## Self-Check: PASSED

Files created:
- src/db/queries/decks.test.ts: FOUND
- __tests__/api-deck-revalidate.test.ts: FOUND
- src/components/decks/deck-builder-perf.test.ts: FOUND
- src/app/decks/page.test.tsx: FOUND (retargeted)

Commits verified:
- fb4a825: FOUND (Task 1)
- 9b09066: FOUND (Task 2)
- 3f80573: FOUND (Task 3)

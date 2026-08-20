---
phase: 34-card-sync-reliability
plan: 08
subsystem: sync
tags: [vitest, drizzle, try-catch, cron, error-isolation]

# Dependency graph
requires:
  - phase: 34-01
    provides: syncAllCards() batched upsert with failedSets/unprocessedSets accounting
  - phase: 34-07
    provides: cron route's cardsOk/pricesOk honest verdict and outer catch
provides:
  - "syncAllCards() per-set try/catch isolating a rejected fetch(), a data-less JSON body, a DB write error, and upsertCards()'s unresolved-swudbId throw — each now lands in failedSets instead of crashing the whole run"
  - "Route-level regression pins proving syncPrices() and revalidateTag() still fire when a card set fails per-set, contrasted against the still-reachable bodyless-500 degraded path for an outright syncAllCards() rejection"
  - "Six non-blocking warnings (WR-01..WR-05, IN-01) recorded as conscious deferrals in deferred-items.md"
affects: [34-VERIFICATION, future-sync-reliability-audit]

actuals:
  tokens: 3200
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Per-set try/catch mirroring syncPrices()'s existing shape: deadline check outside the try, try wraps fetch+upsert, catch logs setId+error and pushes to failedSets, no rethrow"

key-files:
  created: []
  modified:
    - src/lib/sync/upsert-cards.ts
    - __tests__/upsert-cards.test.ts
    - __tests__/cron-route.test.ts
    - .planning/phases/34-card-sync-reliability/deferred-items.md

key-decisions:
  - "Try/catch boundary kept to exactly the per-set body (fetch + upsertCards), with the D-08 soft-deadline check left outside and before it — a deadline is a whole-run decision, not a per-set failure"
  - "The existing !cardsResponse.ok branch's continue was left untouched (still pushes to failedSets once, exits before the catch) to preserve the pre-existing no-double-push guarantee"
  - "Local DB-chain test helper added only inside the syncAllCards describe block (not the shared upsertCards beforeEach) to avoid touching that block's setup, per the plan's explicit instruction"

patterns-established: []

requirements-completed: [SYNC-01, SYNC-03]

coverage:
  - id: D1
    description: "syncAllCards() always resolves with a CardSyncResult — a rejected fetch(), a data-less body, a DB write error, and the deliberate unresolved-swudbId throw are each caught per set and never propagate out"
    requirement: SYNC-01
    verification:
      - kind: unit
        ref: "__tests__/upsert-cards.test.ts#a rejected cards fetch lands the set in failedSets and later sets still process"
        status: pass
      - kind: unit
        ref: "__tests__/upsert-cards.test.ts#a cards response with no data key lands the set in failedSets and later sets still process"
        status: pass
      - kind: unit
        ref: "__tests__/upsert-cards.test.ts#a DB write error inside upsertCards lands the set in failedSets and later sets still process"
        status: pass
      - kind: unit
        ref: "__tests__/upsert-cards.test.ts#the deliberate unresolved-swudbId throw inside upsertCards lands the set in failedSets, not an uncaught rejection"
        status: pass
    human_judgment: false
  - id: D2
    description: "A per-set card failure still reaches the cron route's honest cardsOk/pricesOk verdict — JSON body naming cards.failedSets, syncPrices() still runs, revalidateTag() still fires — instead of the bodyless outer-catch 500"
    requirement: SYNC-03
    verification:
      - kind: unit
        ref: "__tests__/cron-route.test.ts#a per-set card failure still reaches syncPrices, still invalidates the cache, and returns a JSON body naming cards.failedSets"
        status: pass
      - kind: unit
        ref: "__tests__/cron-route.test.ts#CONTRAST: a syncAllCards that rejects outright still degrades to the bodyless 500 and never reaches syncPrices"
        status: pass
    human_judgment: false
  - id: D3
    description: "Six non-blocking warnings (WR-01..WR-05, IN-01) recorded as conscious deferrals with file/line provenance"
    verification:
      - kind: other
        ref: ".planning/phases/34-card-sync-reliability/deferred-items.md § 34-08"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-08-20
status: complete
---

# Phase 34 Plan 08: Sync Per-Set Failure Isolation Gap Closure Summary

**Wrapped `syncAllCards()`'s per-set loop body in a try/catch mirroring `syncPrices()`, closing both `34-VERIFICATION.md` gaps — a single bad set (rejected fetch, malformed JSON, DB error, or the deliberate unresolved-swudbId throw) no longer crashes the whole cards sync or skips the price half.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- `syncAllCards()`'s per-set loop body (`src/lib/sync/upsert-cards.ts`) now has a try/catch identical in shape to `syncPrices()`'s: the D-08 soft-deadline check stays outside and before the try; the try wraps the fetch, the `!ok` branch (unchanged, still `continue`s past the catch), and `upsertCards()`; the catch logs `set.setId` + the error and pushes to `failedSets` — never rethrows, never puts the caught error in an HTTP response
- Four new tests in `__tests__/upsert-cards.test.ts`, each on a fresh 3-set `[SOR, SHD, TWI]` list where only SOR fails, proving: a rejected `fetch()`, a `data`-less JSON body, a DB write error, and `upsertCards()`'s own unresolved-swudbId throw all land in `failedSets` while SHD and TWI still process, the accounting identity (`setsProcessed + failedSets.length + unprocessedSets.length === setsTotal`) holds, and SOR is fetched exactly once (no reattempt)
- Two new tests in `__tests__/cron-route.test.ts` pin the route-level consequence: a per-set card failure (mocked `syncAllCards` resolving with `failedSets: ['JTL']`) still returns 500 with a parseable JSON body naming `cards.failedSets`, still calls `syncPrices()` once with the shared set list, and still calls `revalidateTag()` once; a CONTRAST case pins the previously-dominant degraded path (`syncAllCards` rejecting outright still returns the bodyless text 500 and never reaches `syncPrices()`) as a labelled regression guard, with a comment steering future fixes to `syncAllCards()` rather than the route
- Six non-blocking warnings (WR-01..WR-05, IN-01) from `34-VERIFICATION.md`'s Anti-Patterns table recorded as conscious deferrals in `deferred-items.md` with file/line provenance — none is a `gaps:` entry this plan closes

## Task Commits

Each task was committed atomically:

1. **Task 1: Isolate per-set failures in syncAllCards(), mirroring syncPrices()** - `f459330` (fix, includes the tdd-style test additions)
2. **Task 2: Pin the route-level consequence — honest JSON verdict, price half survives** - `05a2cd8` (test)
3. **Task 3: Record the non-blocking warnings as explicit deferrals** - `b035b8a` (docs)

_Note: worktree mode — no separate plan-metadata commit; STATE.md/ROADMAP.md are owned by the orchestrator._

## Files Created/Modified

- `src/lib/sync/upsert-cards.ts` - `syncAllCards()`'s loop body wrapped in try/catch; catch logs `set.setId` + error and pushes to `failedSets`
- `__tests__/upsert-cards.test.ts` - local `setupWorkingDbInsertChain()` helper + `THREE_SET_LIST` fixture added to the `syncAllCards` describe block; 4 new tests (19 → 23 total)
- `__tests__/cron-route.test.ts` - 2 new tests pinning the honest-verdict and degraded-bodyless-500 paths (12 → 14 total)
- `.planning/phases/34-card-sync-reliability/deferred-items.md` - new `## 34-08` section recording WR-01..WR-05, IN-01

## Decisions Made

- Try/catch scoped to exactly the per-set body (fetch + `upsertCards()` call), with the D-08 soft-deadline check left outside and before it, per the plan's explicit prohibition against widening the catch to the whole loop
- The pre-existing `!cardsResponse.ok` branch's `continue` was left byte-identical (still exits before the new catch, still pushes to `failedSets` exactly once) to preserve the no-double-push property the existing test pins
- The new DB-chain test helper (`setupWorkingDbInsertChain`) was added only inside the `syncAllCards` describe block, not the shared `upsertCards` describe block's `beforeEach`, matching the plan's explicit instruction not to alter that block

## Deviations from Plan

None — plan executed exactly as written. All three tasks' acceptance criteria were met without needing any Rule 1-4 auto-fixes.

## Issues Encountered

**Full-suite `npx vitest run` shows a new failing file, `__tests__/starter-decks-resolve.test.ts`, not present in the 8-file baseline recorded in `34-VALIDATION.md`.** Investigated: it fails with `Error: DATABASE_URL environment variable is not set` from `src/db/index.ts`, thrown at import time before any test body runs. This worktree has no `.env.local` — the identical root cause `deferred-items.md`'s pre-existing `34-01` entry already documents for `__tests__/cron-route.test.ts` and `src/lib/sync/prices.test.ts` in a `DATABASE_URL`-less environment. This plan touches neither `src/db/index.ts`, `vitest.config.mts`, nor `__tests__/starter-decks-resolve.test.ts` itself — the failure is a pure environment/credentials gap of this specific worktree, not a code regression introduced by Tasks 1-3. `src/lib/sync/prices.test.ts` and `__tests__/cron-route.test.ts` (the two in-scope baseline files) are both green, as expected. Full-suite result: 7 failed files / 42 passed / 3 skipped — 6 of the 7 are exactly the pre-existing baseline subset (`api-deck-validation.test.ts`, `collection-page.test.tsx`, `tests/auth-config.test.ts`, `tests/binder-queries.test.ts`, `tests/catalog-variant.test.ts`, `tests/data-isolation.test.ts`); the 7th (`starter-decks-resolve.test.ts`) is this environment-only DB-credential gap. Not auto-fixed — repairing it would mean provisioning a real `DATABASE_URL`/`.env.local` for this worktree, which is out of this plan's scope and outside what an executor can safely do without the user's database credentials.

## Next Phase Readiness

- Both `34-VERIFICATION.md` gaps are closed: `syncAllCards()` is now total (never rejects for a single bad set) and the cron route's honest `cardsOk`/`pricesOk` verdict is reachable for the failure class that previously bypassed it.
- Re-running `/gsd-verify-work` or a fresh `34-VERIFICATION.md` pass against this plan's commits should flip both previously-`failed` truths to `verified`.
- The six recorded non-blocking warnings remain open for a future phase or an `/gsd-audit-fix` pass — none blocks phase completion per `34-VERIFICATION.md`'s own scoring.
- No blockers for downstream v8 phases (35-38) — this plan touches only `src/lib/sync/upsert-cards.ts` and test files, with zero overlap with the UI-phase file set.

---
*Phase: 34-card-sync-reliability*
*Plan: 08*
*Completed: 2026-08-20*

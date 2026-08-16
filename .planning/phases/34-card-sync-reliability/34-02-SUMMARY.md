---
phase: 34-card-sync-reliability
plan: 02
subsystem: sync
tags: [drizzle, postgres, batch-update, case-when, vitest, price-sync]

requires:
  - phase: 34-card-sync-reliability
    provides: "src/lib/sync/set-list.ts (getNonTokenSets(), SWUSet), src/lib/sync/chunk.ts (chunk(), SYNC_CHUNK_SIZE), SyncRunOptions shape from upsert-cards.ts"
provides:
  - "syncPrices({ sets?, deadlineAt? }) — set list derived from getNonTokenSets() (D-10), soft deadline (D-08), no artificial sleep (D-12)"
  - "PriceSyncResult { setsTotal, setsProcessed, totalUpdated, failedSets, unprocessedSets, deadlineHit, sets }"
  - "buildCaseUpdate() — chunked multi-row CASE WHEN price UPDATE (D-11), replacing one UPDATE per card"
affects: [34-03, 34-07]

tech-stack:
  added: []
  patterns:
    - "Collect-dedupe-chunk-write for UPDATE (not just INSERT ... ON CONFLICT) — mirrors 34-01's Phase A-D shape but for a per-row-differing UPDATE via Drizzle's CASE WHEN + sql.join pattern"
    - "Per-set try/catch pushes failedSets instead of a bare console.error swallow — mirrors syncAllCards()'s D-05 continuation"

key-files:
  created: []
  modified:
    - src/lib/sync/prices.ts
    - src/lib/sync/prices.test.ts

key-decisions:
  - "Task 1 (set-list/deadline/failure reporting) and Task 2 (batched CASE WHEN write) landed as separate commits even though both touch prices.ts, matching the plan's task split — Task 1 kept the original per-card db.update().where(eq(...)) write mechanism unchanged, Task 2 replaced only the write mechanism"
  - "Price rows are de-duplicated by swudbId with a Map (last-write-wins) before chunking, matching upsert-cards.ts's dedup discipline, so a duplicated upstream row cannot produce two conflicting CASE branches for the same key"
  - "setUpdated is counted from each chunk's .returning({id}) row length, not assumed from chunk.length, so a swudbId with no matching card_definitions row doesn't inflate the count"
  - "Test file mocks inArray via vi.mock('drizzle-orm', importOriginal) partial-mock — keeps the real sql/sql.join/sql.raw so buildCaseUpdate() executes genuinely, while letting tests inspect the id list passed to inArray()"

requirements-completed: [SYNC-01, SYNC-02, SYNC-03]

coverage:
  - id: D1
    description: "syncPrices() derives its set list from getNonTokenSets() when no sets option is supplied, so ASH, LOF and TS26 are priced — the hardcoded seven-set array is gone"
    requirement: "SYNC-02"
    verification:
      - kind: unit
        ref: "src/lib/sync/prices.test.ts#derives the set list from getNonTokenSets() and fetches prices for ASH, LOF and TS26"
        status: pass
      - kind: unit
        ref: "src/lib/sync/prices.test.ts#an injected sets option suppresses the getNonTokenSets() call"
        status: pass
      - kind: other
        ref: "grep -c 'activeSets' src/lib/sync/prices.ts == 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Price writes are one multi-row UPDATE per chunk of at most 500 cards (CASE WHEN + sql.join), not one UPDATE per card"
    requirement: "SYNC-01"
    verification:
      - kind: unit
        ref: "src/lib/sync/prices.test.ts#a 501-row Normal-variant payload produces exactly 2 db.update calls with where id-list lengths [500, 1]"
        status: pass
      - kind: unit
        ref: "src/lib/sync/prices.test.ts#a 500-row Normal-variant payload produces exactly 1 db.update call"
        status: pass
      - kind: other
        ref: "grep -c \"sql.raw(' ')\" src/lib/sync/prices.ts >= 1; grep -c 'db.execute' src/lib/sync/prices.ts == 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "syncPrices() returns setsTotal/setsProcessed and records a set whose fetch or write throws in failedSets instead of swallowing it in a bare console.error"
    requirement: "SYNC-03"
    verification:
      - kind: unit
        ref: "src/lib/sync/prices.test.ts#a set whose fetch rejects appears in failedSets with setsProcessed strictly less than setsTotal, while a later set still processes"
        status: pass
      - kind: unit
        ref: "src/lib/sync/prices.test.ts#a failing set is attempted exactly once per run — no retry fetch for the same set code"
        status: pass
    human_judgment: false
  - id: D4
    description: "The inter-set delay is removed; syncPrices() issues no artificial wait between sets"
    requirement: "SYNC-01"
    verification:
      - kind: other
        ref: "grep -c 'setTimeout' src/lib/sync/prices.ts == 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "syncPrices() honours a caller-supplied deadlineAt at set boundaries and lists never-started sets in unprocessedSets; still resolves with no arguments"
    requirement: "SYNC-01"
    verification:
      - kind: unit
        ref: "src/lib/sync/prices.test.ts#a past deadlineAt yields deadlineHit true with every set in unprocessedSets"
        status: pass
      - kind: unit
        ref: "src/lib/sync/prices.test.ts#resolves when called with no argument (scripts/sync-prices-now.ts and scripts/test-sync.ts contract)"
        status: pass
    human_judgment: false
  - id: D6
    description: "A set whose price search returns zero cards, or zero Normal-variant cards, performs zero UPDATE statements, counts as processed rather than failed, and does not throw"
    requirement: "SYNC-02"
    verification:
      - kind: unit
        ref: "src/lib/sync/prices.test.ts#a payload with zero Normal variants produces 0 db.update calls, failedSets empty, and setsProcessed === setsTotal"
        status: pass
      - kind: unit
        ref: "src/lib/sync/prices.test.ts#an empty card array produces 0 db.update calls and counts the set as processed"
        status: pass
    human_judgment: false

duration: ~20min
completed: 2026-08-16
status: complete
---

# Phase 34 Plan 02: Price Sync Batching, Single-Source Set List, and Loud Failure Reporting Summary

**Chunked `CASE WHEN` multi-row `UPDATE`s (500-card batches) replacing one `UPDATE` per card in `syncPrices()`, sourced from the same `getNonTokenSets()` list `syncAllCards()` uses (closing the ASH/LOF/TS26 gap), with a `setsProcessed`/`failedSets` total that no longer disappears into a bare `console.error`.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-08-16
- **Tasks:** 2 completed
- **Files modified:** 2

## Accomplishments
- `syncPrices()` derives its set list from `getNonTokenSets()` (D-10) — the hardcoded `activeSets = ['SOR', 'SHD', 'TWI', 'JTL', 'SEC', 'LAW', 'IBH']` array is gone entirely, closing the exact defect that left ASH, LOF and TS26 unpriced
- Accepts an optional `{ sets?, deadlineAt? }` mirroring 34-01's `SyncRunOptions`; still resolves with zero arguments for `scripts/sync-prices-now.ts` and `scripts/test-sync.ts`
- Price writes are now one multi-row `UPDATE ... SET price_eur = CASE WHEN ... END` per 500-card chunk via a new `buildCaseUpdate()` helper — Drizzle's officially documented pattern, staying inside the query builder (`grep -c 'db.execute' == 0`)
- A per-set failure is recorded in `failedSets` (D-07) instead of being swallowed by a bare `console.error` — `setsProcessed + failedSets.length + unprocessedSets.length === setsTotal` in every tested case
- The hardcoded 1-second inter-set sleep is gone with no replacement (D-12)
- D-08 soft deadline check at the top of the per-set loop, listing every unstarted set in `unprocessedSets` and setting `deadlineHit`
- `PriceSyncResult` mirrors `CardSyncResult`'s shape from 34-01

## Task Commits

Each task was committed atomically:

1. **Task 1: Unify the set list, drop the sleep, and make syncPrices report a total** - `67b30c6` (feat)
2. **Task 2: Replace the per-card UPDATE loop with a chunked CASE WHEN bulk update** - `569dbec` (feat)

**Plan metadata:** committed alongside this SUMMARY (worktree mode — orchestrator handles the shared-file/metadata commit after merge)

## Files Created/Modified
- `src/lib/sync/prices.ts` - `syncPrices()` rewritten: `PriceSyncOptions`/`PriceSyncResult`, set list from `getNonTokenSets()`, D-08 deadline, `failedSets` on catch, no sleep; write mechanism replaced with chunked `buildCaseUpdate()` CASE WHEN batches
- `src/lib/sync/prices.test.ts` - 13 tests total: 3 pre-existing `mapPriceData` tests kept unmodified and green, 10 new `syncPrices` tests (set-list derivation, injected sets, failure accounting, no-retry, deadline, no-args resolve, 501/500-row chunk boundaries, zero-Normal-variant payload, empty card array)

## Decisions Made
- Task 1 and Task 2 landed as separate atomic commits despite both touching `prices.ts` — Task 1 changed only the control flow (set list, deadline, failure accounting, sleep removal) while keeping the original single-row `db.update().where(eq(...))` write; Task 2 changed only the write mechanism to the chunked CASE WHEN form. This matches the plan's task boundary exactly and keeps each commit's diff scoped to what its own acceptance criteria test.
- Price rows are de-duplicated by `swudbId` via a `Map` (last-write-wins) before chunking — same discipline as 34-01's `upsertCards()` — so a duplicated upstream row can't produce two conflicting `CASE` branches for the same key in one `UPDATE`.
- `setUpdated` is counted from each chunk's `.returning({ id: cardDefinitions.id })` row count, not assumed from `priceChunk.length`, so a `swudbId` with no matching `card_definitions` row doesn't inflate the reported count.
- The test file spies on `inArray` via `vi.mock('drizzle-orm', importOriginal)` partial-mock rather than mocking the whole module — this keeps `sql`, `sql.join`, and `sql.raw` real so `buildCaseUpdate()` executes its actual logic under test, while still letting assertions inspect the id list passed to `inArray()` per chunk.

## Deviations from Plan

None - plan executed exactly as written. Both tasks' acceptance criteria (grep-based structural checks, chunk-boundary tests, failure-accounting tests) pass without needing any auto-fix.

## Issues Encountered

None specific to this plan's files. `npx tsc --noEmit` (project-wide) still reports the same pre-existing, unrelated errors in `__tests__/api-deck-validation.test.ts` and `__tests__/collection-page.test.tsx` documented in 34-01-SUMMARY.md and `.planning/phases/34-card-sync-reliability/34-VALIDATION.md` — neither file overlaps this plan's changed files, and scoped `tsc` output for `prices.ts` is clean (`grep -i prices` on the full output returns nothing).

Full-suite run after this plan: 7 failed test files / 39 passed / 3 skipped (was 8 failed at the recorded baseline — `src/lib/sync/prices.test.ts` moved from red to green, the other 7 pre-existing failures are unchanged and unrelated to this plan's files). No new failures introduced.

## Known Stubs

None — every function shipped in this plan is fully wired (no hardcoded empty/placeholder returns).

## Threat Flags

None — this plan's threat surface is exactly what `34-02-PLAN.md`'s `<threat_model>` already registered (T-34-06 through T-34-09, T-34-SC): the `buildCaseUpdate()` SQL assembly parameterizes every API-derived value through the `sql`` template, `sql.raw()` is restricted to the literal separator and `case`/`end` keywords, and no new endpoints, auth paths, or trust boundaries were introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `syncPrices()` is ready for 34-07 (the cron route's loud-failure verdict), which needs `PriceSyncResult.setsProcessed`/`setsTotal`/`failedSets`/`unprocessedSets`/`deadlineHit` alongside 34-01's `CardSyncResult` to compute `success = cardsOk && pricesOk`
- `scripts/sync-prices-now.ts` and `scripts/test-sync.ts` are unaffected by this plan's signature change — both call `syncPrices()` with no arguments and read `result.totalUpdated`/`result.sets[].{setCode,updated}`, all of which are preserved in `PriceSyncResult`
- No blockers for downstream plans in this phase

## Self-Check: PASSED

All claimed modified files exist on disk (`src/lib/sync/prices.ts`, `src/lib/sync/prices.test.ts`, this SUMMARY.md) and both task commits (`67b30c6`, `569dbec`) are present in `git log --oneline --all`.

- FOUND: src/lib/sync/prices.ts
- FOUND: src/lib/sync/prices.test.ts
- FOUND: .planning/phases/34-card-sync-reliability/34-02-SUMMARY.md
- FOUND: 67b30c6
- FOUND: 569dbec

---
*Phase: 34-card-sync-reliability*
*Completed: 2026-08-16*

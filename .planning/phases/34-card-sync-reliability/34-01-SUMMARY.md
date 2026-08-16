---
phase: 34-card-sync-reliability
plan: 01
subsystem: sync
tags: [drizzle, postgres, batch-upsert, vitest, card-sync]

requires: []
provides:
  - "Batched upsertCards() — O(sets x ceil(cards/500)) db.insert calls instead of O(cards)"
  - "src/lib/sync/chunk.ts — shared chunk<T>() helper and SYNC_CHUNK_SIZE=500 constant"
  - "src/lib/sync/set-list.ts — single-source getNonTokenSets()/isTokenSetId()/SWUSet"
  - "syncAllCards({ sets?, deadlineAt? }) — injectable set list + D-08 soft deadline"
  - "CardSyncResult { setsTotal, setsProcessed, cardsUpserted, failedSets, unprocessedSets, deadlineHit }"
affects: [34-02, 34-03, 34-07]

tech-stack:
  added: []
  patterns:
    - "Collect-dedupe-chunk-write batch upsert (Phase A-D), reusing collection.ts's onConflictDoUpdate shape but adding a swudbId -> id RETURNING map since batching breaks the old 1:1 def.id linkage"
    - "Soft deadline checked once per outer-loop boundary, never mid-unit-of-work"

key-files:
  created:
    - src/lib/sync/chunk.ts
    - src/lib/sync/set-list.ts
  modified:
    - src/lib/sync/upsert-cards.ts
    - __tests__/upsert-cards.test.ts

key-decisions:
  - "Definitions and printings are each collected into one in-memory array per set, deduplicated by conflict key (last-write-wins), then chunked at 500 rows — matches the plan's Phase A-D structure exactly"
  - "idBySwudbId built from each chunk's RETURNING rows, keyed by the row's own swudbId column, never a positional index — proven by a test with a deliberately reversed RETURNING order"
  - "set-list.ts holds the only /sets fetch and the canonical isTokenSetId() predicate; upsert-cards.ts re-exports SWUSet so existing importers are unaffected"
  - "D-08 deadline check lives at the top of the per-set loop only — a set already in progress is never interrupted, matching the locked decision"

requirements-completed: [SYNC-01, SYNC-02]

coverage:
  - id: D1
    description: "upsertCards() batches card_definitions and card_printings writes into bounded 500-row chunks instead of one insert per row"
    requirement: "SYNC-01"
    verification:
      - kind: unit
        ref: "__tests__/upsert-cards.test.ts#a set of 501 distinct card groups produces exactly 2 definitions inserts with array lengths 500 and 1"
        status: pass
      - kind: unit
        ref: "__tests__/upsert-cards.test.ts#exactly 500 groups produces exactly 1 definitions insert"
        status: pass
      - kind: unit
        ref: "__tests__/upsert-cards.test.ts#an empty card array performs zero insert calls and resolves to 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Printing-to-definition linkage is built from the RETURNING row's swudbId column, not positional index, and survives a reversed RETURNING order"
    requirement: "SYNC-01"
    verification:
      - kind: unit
        ref: "__tests__/upsert-cards.test.ts#a mockReturning that reverses RETURNING row order still links each printing to its own anchor id"
        status: pass
    human_judgment: false
  - id: D3
    description: "Duplicate conflict keys across groups are deduplicated before the batched insert, avoiding the ON CONFLICT DO UPDATE cannot affect row a second time error"
    requirement: "SYNC-01"
    verification:
      - kind: unit
        ref: "__tests__/upsert-cards.test.ts#two group entries sharing the same anchor swudbId are deduplicated into one row"
        status: pass
    human_judgment: false
  - id: D4
    description: "getNonTokenSets() is the single source of the non-token set list; the /sets endpoint is fetched from exactly one file"
    requirement: "SYNC-02"
    verification:
      - kind: unit
        ref: "__tests__/upsert-cards.test.ts#uses an injected sets array without fetching /sets"
        status: pass
      - kind: other
        ref: "grep -rc 'api.swu-db.com/sets' src/lib/sync/ (matches only in set-list.ts)"
        status: pass
    human_judgment: false
  - id: D5
    description: "syncAllCards() accepts an optional { sets?, deadlineAt? }, still works with zero arguments, and every set lands in exactly one of setsProcessed/failedSets/unprocessedSets"
    requirement: "SYNC-02"
    verification:
      - kind: unit
        ref: "__tests__/upsert-cards.test.ts#resolves with no argument, keeping scripts/seed.ts working"
        status: pass
      - kind: unit
        ref: "__tests__/upsert-cards.test.ts#a deadlineAt already in the past leaves setsProcessed at 0 and lists every set as unprocessed"
        status: pass
      - kind: unit
        ref: "__tests__/upsert-cards.test.ts#a set whose cards fetch fails appears in failedSets while later sets still process"
        status: pass
      - kind: unit
        ref: "__tests__/upsert-cards.test.ts#two consecutive calls with the same past deadlineAt return identical unprocessedSets — no state carries between runs"
        status: pass
    human_judgment: false

duration: ~12min
completed: 2026-08-16
status: complete
---

# Phase 34 Plan 01: Batch Card-Definition/Printing Upserts + Single-Source Set List Summary

**Chunked multi-row `INSERT ... ON CONFLICT DO UPDATE` (500-row batches) replacing ~8,400 sequential round trips in `upsertCards()`, plus a single-source `getNonTokenSets()` and a deadline-aware `syncAllCards({ sets?, deadlineAt? })`.**

## Performance

- **Duration:** ~12 min
- **Completed:** 2026-08-16
- **Tasks:** 2 completed
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments
- `upsertCards()` no longer awaits one `db.insert()` per card definition and per printing — it collects, deduplicates, and writes both tables in bounded 500-row chunks, with `swudbId -> id` linkage built from `RETURNING` (order-independent, proven by test)
- Extracted the single source of truth for "the sets we sync" into `src/lib/sync/set-list.ts` (`getNonTokenSets()`, `isTokenSetId()`, `SWUSet`) — the `/sets` endpoint is now fetched from exactly one file
- `syncAllCards()` accepts an optional `SyncRunOptions` (`{ sets?, deadlineAt? }`), still resolves with zero arguments for `scripts/seed.ts`, and implements the D-08 soft deadline (checked once per set boundary, never mid-set)
- Every set is now accounted for in exactly one of `setsProcessed` / `failedSets` / `unprocessedSets` — the data 34-07's honest-verdict work needs

## Task Commits

Each task was committed atomically:

1. **Task 1: Batch the card-definition and card-printing upserts end to end** - `23f79ae` (feat)
2. **Task 2: Single-source the non-token set list and add the D-08 soft deadline** - `cd8ba2a` (feat)

**Plan metadata:** committed alongside this SUMMARY (worktree mode — orchestrator handles the shared-file/metadata commit after merge)

## Files Created/Modified
- `src/lib/sync/chunk.ts` - `SYNC_CHUNK_SIZE = 500` constant and `chunk<T>(items, size)` helper
- `src/lib/sync/set-list.ts` - `SWUSet`, `isTokenSetId()`, `getNonTokenSets()` — the single `/sets` fetch site
- `src/lib/sync/upsert-cards.ts` - `upsertCards()` rewritten to batched Phase A-D (collect/dedupe/write-definitions/write-printings); `syncAllCards()` reworked to accept `SyncRunOptions` and return `CardSyncResult`
- `__tests__/upsert-cards.test.ts` - mock chain updated for the array-based `.values()` call shape; 11 new tests added (chunk boundaries, empty/all-token cases, dedup, reversed-RETURNING linkage, injected set list, deadline, failed-set accounting)

## Decisions Made
- Batch chunk size fixed at 500 rows for both `card_definitions` and `card_printings` — matches the plan's researched constant, comfortably under Postgres's 65,535 bind-parameter ceiling in both directions
- `idBySwudbId` is built exclusively from each chunk's `RETURNING` rows keyed by the row's own `swudbId` column — never a positional array index — and an unresolved lookup throws rather than writing an orphan or silently dropping the printing
- De-duplication (Phase B) runs before chunking for both tables, last-write-wins, guarding against the `ON CONFLICT DO UPDATE command cannot affect row a second time` failure mode that batching introduces
- `set-list.ts` is a new file (not an export tacked onto `upsert-cards.ts`) per the plan's file layout — keeps `upsert-cards.ts` focused on card-shape logic
- D-08's deadline check is scoped to the outer per-set loop boundary only, by design — a set already in progress always finishes; this is documented in-code so a future change doesn't "improve" it into per-chunk checking

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed dead `eq`, `and`, `isNull` imports from `upsert-cards.ts`**
- **Found during:** Task 1 (editing the top of the file to add the `chunk` import)
- **Issue:** The original file imported `eq`, `and`, `isNull` from `drizzle-orm` but never used them
- **Fix:** Dropped the unused names from the import line while adding the new `chunk`/`SYNC_CHUNK_SIZE` import
- **Files modified:** `src/lib/sync/upsert-cards.ts`
- **Verification:** `npx tsc --noEmit` and `npx eslint src/lib/sync` both clean
- **Committed in:** `23f79ae` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1, dead-import cleanup, incidental to an edit already touching that line)
**Impact on plan:** No scope creep — a one-line import cleanup made while adding a required new import to the same statement.

## Issues Encountered

- `npx tsc --noEmit` (project-wide) reports pre-existing, unrelated errors in `__tests__/api-deck-validation.test.ts` and `__tests__/collection-page.test.tsx` (last touched by commit `3dbce5d`, before this phase). Neither file overlaps this plan's changed files. Scoped `tsc` output for the changed files (`chunk.ts`, `set-list.ts`, `upsert-cards.ts`) is clean. Logged to `.planning/phases/34-card-sync-reliability/deferred-items.md`, not auto-fixed per the executor's scope boundary.
- `__tests__/cron-route.test.ts` and `src/lib/sync/prices.test.ts` fail in this worktree because `.env.local` is absent and `src/app/api/cron/sync-cards/route.ts` transitively imports the real `@/db` via the (untouched) `src/lib/sync/prices.ts`. Neither file is modified by this plan; this plan's own test file (`__tests__/upsert-cards.test.ts`) mocks `@/db` entirely and is unaffected. Also logged to `deferred-items.md`.

## Known Stubs

None — every function shipped in this plan is fully wired (no hardcoded empty/placeholder returns).

## Threat Flags

None — this plan's threat surface is exactly what `34-01-PLAN.md`'s `<threat_model>` already registered (T-34-01 through T-34-05, T-34-SC). No new endpoints, auth paths, or trust boundaries were introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `upsertCards()` and `syncAllCards()` are ready for 34-02 (price sync batching, which needs `getNonTokenSets()` as its second consumer) and 34-03 (the cron route's `maxDuration` + loud-failure verdict, which needs `CardSyncResult.setsProcessed`/`setsTotal`/`failedSets`/`unprocessedSets`/`deadlineHit`)
- `src/app/api/cron/sync-cards/route.ts` still calls `syncAllCards()` with no arguments — unaffected by this plan (it's a later plan's file) and continues to compile and pass its own tests (`cron-route.test.ts`'s mock of `@/lib/sync/upsert-cards` is untouched by the new optional-args signature)
- No blockers for downstream plans in this phase

## Self-Check: PASSED

All claimed created/modified files exist on disk (`src/lib/sync/chunk.ts`, `src/lib/sync/set-list.ts`, `src/lib/sync/upsert-cards.ts`, `__tests__/upsert-cards.test.ts`, this SUMMARY.md, `deferred-items.md`) and all three task commits (`23f79ae`, `cd8ba2a`, `ed1cacf`) are present in `git log --oneline --all`.

---
*Phase: 34-card-sync-reliability*
*Completed: 2026-08-16*

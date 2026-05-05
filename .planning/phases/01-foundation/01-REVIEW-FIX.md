---
phase: 01-foundation
fixed_at: 2026-05-04T16:58:00Z
review_path: .planning/phases/01-foundation/01-REVIEW.md
iteration: 1
findings_in_scope: 10
fixed: 10
skipped: 0
status: all_fixed
---

# Phase 01: Code Review Fix Report

**Fixed at:** 2026-05-04T16:58:00Z
**Source review:** .planning/phases/01-foundation/01-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 10 (CR-01 through CR-04, WR-01 through WR-06)
- Fixed: 10
- Skipped: 0

## Fixed Issues

### CR-01: Non-null assertion on DATABASE_URL crashes the process at module load

**Files modified:** `src/db/index.ts`
**Commit:** e87425e
**Applied fix:** Replaced `neon(process.env.DATABASE_URL!)` with an explicit guard that extracts the env var, throws an `Error` with an actionable message if absent, then passes the validated string to `neon()`.

---

### CR-02: drizzle.config.ts crashes at import with same non-null assertion

**Files modified:** `drizzle.config.ts`
**Commit:** 2224ef3
**Applied fix:** Added explicit guard after `import 'dotenv/config'` — extracts `process.env.DATABASE_URL` into `url`, throws if absent, and passes `url` (not the non-null asserted expression) to `dbCredentials`.

---

### CR-03: Pass 2 upsert for orphaned and existing variant cards silently drops backArtUrl and artist

**Files modified:** `src/lib/sync/upsert-cards.ts`
**Commit:** 4fb5cc3
**Applied fix:** Added `backArtUrl: sql\`excluded.back_art_url\`` and `artist: sql\`excluded.artist\`` to the `onConflictDoUpdate` set clauses of both the orphan-variant path (no existing definition) and the existing-variant path (found existing definition). The Normal-variant path already had these fields. All three card_printings upsert paths are now consistent.

---

### CR-04: Variant-card lookup uses name+subtitle across all sets — can match wrong card

**Files modified:** `src/lib/sync/upsert-cards.ts`
**Commit:** f0d0068
**Applied fix:** Wrapped the existing name+subtitle WHERE clause in an outer `and(...)` that prepends `sql\`${cardDefinitions.swudbId} LIKE ${card.Set + '-%'}\`` — scoping the lookup to definitions whose swudb_id starts with the current set prefix. Also added a comment explaining the intent.

---

### WR-01: updatedAt is set to new Date() at query-build time, not execution time

**Files modified:** `src/lib/sync/upsert-cards.ts`
**Commit:** 83b00a1
**Applied fix:** Replaced all 10 occurrences of `updatedAt: new Date()` (both in `.values()` inserts and in `onConflictDoUpdate` set clauses) with `updatedAt: sql\`now()\`` so the DB sets the timestamp atomically at execution time.

---

### WR-02: syncAllCards silently swallows per-set errors and misreports setsProcessed

**Files modified:** `src/lib/sync/upsert-cards.ts`
**Commit:** 568830f
**Applied fix:** Added `setsTotal: number` to the `SyncResult` interface alongside `setsProcessed: number` (now documenting it as successfully processed). Added `let setsSucceeded = 0` and incremented it only on successful set processing. Return now reports `{ setsTotal: nonTokenSets.length, setsProcessed: setsSucceeded, cardsUpserted: totalUpserted }`. Also updated the cron-route test mock return value to include `setsTotal` for consistency.

---

### WR-03: Test mock chain for db.insert is broken for card_printings-only path

**Files modified:** `__tests__/upsert-cards.test.ts`
**Commit:** b6031f1
**Applied fix:** Added `then: (resolve) => resolve([])` to the `mockOnConflict` return value, making it thenable for code paths that `await .onConflictDoUpdate()` directly without chaining `.returning()`. The mock now correctly models both usage patterns.

---

### WR-04: cron-route test re-imports module after vi.resetModules() but mock may not apply

**Files modified:** `__tests__/cron-route.test.ts`
**Commit:** efbbd3a
**Applied fix:** Removed `vi.resetModules()` from `beforeEach` — `vi.clearAllMocks()` is sufficient. Added a guard assertion `expect(vi.isMockFunction(syncAllCards)).toBe(true)` after the dynamic re-import to explicitly verify the mock is still in place for each test run. Also updated the mock return value to include `setsTotal` to match the updated `SyncResult` shape.

---

### WR-05: Token-set filter in upsertCards is redundant with the filter in syncAllCards

**Files modified:** `src/lib/sync/upsert-cards.ts`
**Commit:** c1e2b4d
**Applied fix:** Added a detailed comment to the guard in `upsertCards` explaining it is the canonical location and that callers do not need to pre-filter. Updated the comment in `syncAllCards` to explain it keeps the pre-filter to avoid unnecessary API calls to swu-db.com for token sets (not to duplicate the guard). The pre-filter in `syncAllCards` was preserved because removing it would cause unnecessary network fetches and would break the `syncAllCards` test (which asserts `/cards/TSOR` is never fetched).

---

### WR-06: vitest.config.mts uses jsdom environment globally for server-side tests

**Files modified:** `vitest.config.mts`, `__tests__/upsert-cards.test.ts`, `__tests__/cron-route.test.ts`
**Commit:** 5178afe
**Applied fix:** Changed global `environment` from `'jsdom'` to `'node'` in `vitest.config.mts`. Added `environmentMatchGlobs` to apply jsdom only for files matching `**/*.browser.test.{ts,tsx}` (future UI tests). Added `// @vitest-environment node` comment at the top of both server-side test files to make the intent explicit.

---

## Skipped Issues

None — all 10 in-scope findings were successfully fixed.

---

_Fixed: 2026-05-04T16:58:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_

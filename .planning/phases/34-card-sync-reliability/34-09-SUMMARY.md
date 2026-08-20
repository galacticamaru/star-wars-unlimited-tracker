---
phase: 34-card-sync-reliability
plan: 09
subsystem: sync
tags: [postgres, drizzle, sqlstate-42804, price-sync, vitest, gap-closure]

requires:
  - phase: 34-card-sync-reliability (34-02)
    provides: "buildCaseUpdate() batched CASE WHEN multi-row UPDATE pattern (D-11) and SYNC_CHUNK_SIZE chunking"
provides:
  - "buildCaseUpdate() branches carry an explicit ::integer cast, closing SQLSTATE 42804 against the integer price_eur/price_usd columns"
  - "An unmocked Postgres regression guard (__tests__/price-case-update-types.test.ts) that proves the production expression parses, and goes red if the cast is ever removed"
  - "scripts/sync-prices-now.ts reports failedSets/unprocessedSets/setsProcessed/setsTotal/deadlineHit and exits non-zero on any shortfall or a zero total"
  - "A real price sync run that wrote prices for all 10 real card sets for the first time since 2026-05-12"
affects: [34-verification, 34-uat]

actuals:
  tokens: 2303
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Database-backed Vitest guard for SQL type-safety: execute the production SQL expression against real Postgres with sentinel WHERE-clause keys proven absent, asserting zero rows returned, rather than asserting the emitted SQL string"

key-files:
  created:
    - __tests__/price-case-update-types.test.ts
  modified:
    - src/lib/sync/prices.ts
    - scripts/sync-prices-now.ts

key-decisions:
  - "Cast appended as a static ::integer suffix inside the sql template on the bound parameter (not sql.raw() on the value, not string concatenation) — preserves 34-02's parameter-binding discipline while fixing the type"
  - "Guard test issues real UPDATEs against sentinel swudbId values (G341-GUARD-*) with a beforeAll proving their absence, so 'wrote nothing' is measured every run rather than assumed"
  - "sync-prices-now.ts exit code now derives from failedSets.length > 0 || unprocessedSets.length > 0 || totalUpdated === 0 — strict equality, no tolerance threshold, mirroring the cron route's verdict"

patterns-established:
  - "Second unmocked-@/db test file in the repo (after __tests__/starter-decks-resolve.test.ts) — same beforeAll-throws-on-missing-DATABASE_URL / afterAll-pool.end() shape, for any future SQL-type-safety guard"

requirements-completed: [SYNC-01, SYNC-02, SYNC-03]

coverage:
  - id: D1
    description: "buildCaseUpdate() casts every CASE branch to integer; the production UPDATE parses against price_eur/price_usd"
    requirement: SYNC-01
    verification:
      - kind: integration
        ref: "__tests__/price-case-update-types.test.ts#the production CASE WHEN update parses against the integer price columns and matches zero rows"
        status: pass
      - kind: integration
        ref: "__tests__/price-case-update-types.test.ts#an all-NULL price row is accepted against the nullable integer columns"
        status: pass
      - kind: integration
        ref: "__tests__/price-case-update-types.test.ts#a full SYNC_CHUNK_SIZE batch parses within the bind-parameter ceiling"
        status: pass
    human_judgment: false
  - id: D2
    description: "A committed, unmocked test executes the production CASE expression against real Postgres and was observed red at SQLSTATE 42804 against unmodified HEAD before the fix"
    requirement: SYNC-01
    verification:
      - kind: integration
        ref: "Task 1 RED run captured verbatim below — all 3 cases failed with SQLSTATE 42804 before the ::integer cast existed"
        status: pass
    human_judgment: false
  - id: D3
    description: "A real price sync run writes prices for every non-empty non-token set (failedSets: [], setsProcessed === setsTotal, totalUpdated > 0)"
    requirement: SYNC-02
    verification:
      - kind: e2e
        ref: "npx tsx --env-file=.env.local scripts/sync-prices-now.ts — full output captured below, exit 0, setsProcessed 35/35, failedSets empty, totalUpdated 2277"
        status: pass
    human_judgment: false
  - id: D4
    description: "scripts/sync-prices-now.ts reports the shortfall vocabulary (failedSets/unprocessedSets/setsProcessed/setsTotal/deadlineHit) and exits non-zero on any shortfall or a zero total"
    requirement: SYNC-03
    verification:
      - kind: e2e
        ref: "Real run output below shows all five fields printed; script logic (scripts/sync-prices-now.ts) derives exit code from result, not from absence of a throw"
        status: pass
    human_judgment: false

duration: ~20min (across one spend-limit interruption/resume)
completed: 2026-08-20
status: complete
---

# Phase 34 Plan 09: Price Sync CASE-Type Gap Closure (G-34-1) Summary

**Cast each `buildCaseUpdate()` CASE branch to `::integer`, closing SQLSTATE 42804; added an unmocked Postgres regression guard that goes red at HEAD; real sync run wrote prices for all 10 real card sets for the first time since 2026-05-12**

## Performance

- **Duration:** ~20 min (session included one spend-limit interruption/resume — no work was redone; the coordinator's inspection confirmed Task 1's export-only change and the observed RED survived the interruption intact)
- **Started:** 2026-08-20T07:42:00Z (approx, first guard-test run)
- **Completed:** 2026-08-20T07:48:46Z
- **Tasks:** 3/3
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- Closed G-34-1: `buildCaseUpdate()` in `src/lib/sync/prices.ts` now emits `then $n::integer` on every CASE branch, so the UPDATE parses against the `integer` `price_eur`/`price_usd` columns instead of dying at parse analysis with SQLSTATE 42804
- Added `__tests__/price-case-update-types.test.ts` — a database-backed Vitest guard (mocks nothing) that executes the exact production expression against real Postgres via sentinel `swudbId` values proven absent beforehand, asserting zero rows returned. Observed genuinely RED against unmodified HEAD (all 3 cases, SQLSTATE 42804) before the cast was applied
- Rewrote the `buildCaseUpdate()` docstring: removed the false claim that "Postgres infers each branch's type from the target column" and replaced it with the actual parse-analysis mechanism, citing G-34-1 as provenance
- Extended `scripts/sync-prices-now.ts` to print `setsProcessed`/`setsTotal`, `failedSets`/`unprocessedSets`, and `deadlineHit`, and to exit non-zero on any failed set, unprocessed set, or zero total — mirroring the cron route's strict verdict instead of exiting 0 on any resolved promise
- Ran the real sync against the live Neon catalog: exit 0, `setsProcessed 35/35`, `failedSets: []`, `totalUpdated: 2277`. All 10 real card sets (LOF, SOR, LAW, IBH, TWI, SEC, SHD, TS26, JTL, ASH) now carry a non-zero updated count and are 100% priced with fresh 2026-08-20 timestamps — price sync has written prices for the first time since 2026-05-12

## Task 1 RED Evidence (captured verbatim, params truncated for readability on the chunk-batch case)

Run: `npx vitest run __tests__/price-case-update-types.test.ts` against unmodified HEAD (export-only change to `buildCaseUpdate`, no cast).

```
 ❯ __tests__/price-case-update-types.test.ts (3 tests | 3 failed) 1587ms
     × the production CASE WHEN update parses against the integer price columns and matches zero rows 36ms
     × an all-NULL price row is accepted against the nullable integer columns 114ms
     × a full SYNC_CHUNK_SIZE batch parses within the bind-parameter ceiling 175ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 3 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  __tests__/price-case-update-types.test.ts > buildCaseUpdate() CASE branch types against real Postgres (G-34-1) > the production CASE WHEN update parses against the integer price columns and matches zero rows
Error: Failed query: update "card_definitions" set "price_eur" = (case when "card_definitions"."swudb_id" = $1 then $2 when "card_definitions"."swudb_id" = $3 then $4 end), "price_usd" = (case when "card_definitions"."swudb_id" = $5 then $6 when "card_definitions"."swudb_id" = $7 then $8 end), "prices_updated_at" = now() where "card_definitions"."swudb_id" in ($9, $10) returning "id"
params: G341-GUARD-1,100,G341-GUARD-2,,G341-GUARD-1,109,G341-GUARD-2,,G341-GUARD-1,G341-GUARD-2

Caused by: error: column "price_eur" is of type integer but expression is of type text
Serialized Error: { length: 194, severity: 'ERROR', code: '42804', detail: undefined, hint: 'You will need to rewrite or cast the expression.', position: '46', ..., file: 'parse_target.c', routine: 'transformAssignedExpr' }

 FAIL  __tests__/price-case-update-types.test.ts > ... > an all-NULL price row is accepted against the nullable integer columns
Error: Failed query: update "card_definitions" set "price_eur" = (case when "card_definitions"."swudb_id" = $1 then $2 end), "price_usd" = (case when "card_definitions"."swudb_id" = $3 then $4 end), "prices_updated_at" = now() where "card_definitions"."swudb_id" in ($5) returning "id"
params: G341-GUARD-null,,G341-GUARD-null,,G341-GUARD-null

Caused by: error: column "price_eur" is of type integer but expression is of type text
Serialized Error: { ..., code: '42804', hint: 'You will need to rewrite or cast the expression.', ... }

 FAIL  __tests__/price-case-update-types.test.ts > ... > a full SYNC_CHUNK_SIZE batch parses within the bind-parameter ceiling
Error: Failed query: update "card_definitions" set "price_eur" = (case when "card_definitions"."swudb_id" = $1 then $2 when ... [500 rows, 2500 bind params total] ... end), ...
Caused by: error: column "price_eur" is of type integer but expression is of type text
Serialized Error: { ..., code: '42804', hint: 'You will need to rewrite or cast the expression.', ... }

 Test Files  1 failed (1)
      Tests  3 failed (3)
```

All three cases fail identically on SQLSTATE 42804 naming `price_eur`, confirming the guard exercises the exact defect G-34-1 diagnosed and that the priced, null, and full-chunk-size branches are all affected.

## Task 2: GREEN after cast

Run: `npx vitest run __tests__/price-case-update-types.test.ts` after adding `::integer` to each branch.

```
 Test Files  1 passed (1)
      Tests  3 passed (3)
```

`npx vitest run src/lib/sync/prices.test.ts __tests__/cron-route.test.ts` (mocked suites, unaffected by the cast): `2 passed | 27 passed`.

## Task 3: Real Sync Run (full output)

Pre-run baseline (measured before this run, matches the plan's corrected `<reversibility>` baseline exactly):

| Set | Total | Priced | Newest `prices_updated_at` |
|---|---|---|---|
| SOR | 252 | 252 | 2026-08-20 07:15 (UAT diagnostic probe, not HEAD) |
| IBH | 104 | 104 | 2026-05-12 00:30 |
| LAW | 264 | 264 | 2026-05-12 00:30 |
| SEC | 264 | 264 | 2026-05-12 00:30 |
| JTL | 262 | 262 | 2026-05-12 00:30 |
| TWI | 257 | 257 | 2026-05-12 00:30 |
| SHD | 262 | 262 | 2026-05-12 00:30 |
| LOF | 264 | 6 | NULL (never priced) |
| ASH | 264 | 0 | NULL (never priced) |
| TS26 | 84 | 0 | NULL (never priced) |
| J25 | 19 | 0 | NULL (never priced) |

Command: `npx tsx --env-file=.env.local scripts/sync-prices-now.ts`

```
--- Manual Price Sync Started ---
Starting price synchronization via swu-db.com...
Fetching prices for set: LOF from swu-db.com...
Updated 264 prices for set LOF
[... 35 sets fetched sequentially ...]
Fetching prices for set: SOR from swu-db.com...
Updated 252 prices for set SOR
Fetching prices for set: LAW from swu-db.com...
Updated 264 prices for set LAW
Fetching prices for set: IBH from swu-db.com...
Updated 104 prices for set IBH
Fetching prices for set: TWI from swu-db.com...
Updated 257 prices for set TWI
Fetching prices for set: SEC from swu-db.com...
Updated 264 prices for set SEC
Fetching prices for set: SHD from swu-db.com...
Updated 262 prices for set SHD
Fetching prices for set: TS26 from swu-db.com...
Updated 84 prices for set TS26
Fetching prices for set: JTL from swu-db.com...
Updated 262 prices for set JTL
Fetching prices for set: ASH from swu-db.com...
Updated 264 prices for set ASH
Price sync complete. Total cards updated: 2277

--- Sync Results ---
Total cards updated: 2277
  Set LOF: 264 cards
  Set SOR: 252 cards
  Set LAW: 264 cards
  Set IBH: 104 cards
  Set TWI: 257 cards
  Set SEC: 264 cards
  Set SHD: 262 cards
  Set TS26: 84 cards
  Set JTL: 262 cards
  Set ASH: 264 cards
  [... all promo/OP/token sets: 0 cards each — legitimate, no cards upstream ...]
Duration: 46.84s

Sets processed: 35/35
Failed sets: (none)
Unprocessed sets: (none)
Deadline hit: false
```

Exit code: 0 (confirmed via script logic: `failedSets.length === 0 && unprocessedSets.length === 0 && totalUpdated > 0`, all three hold).

Post-run per-set state (queried directly from Neon immediately after the run):

| Set | Total | Priced (before → after) | `prices_updated_at` (before → after) |
|---|---|---|---|
| LOF | 264 | 6 → **264** | NULL → **2026-08-20 07:46** |
| SOR | 252 | 252 → 252 | 2026-08-20 07:15 (probe) → **2026-08-20 07:46** |
| LAW | 264 | 264 → 264 | 2026-05-12 → **2026-08-20 07:47** |
| IBH | 104 | 104 → 104 | 2026-05-12 → **2026-08-20 07:47** |
| TWI | 257 | 257 → 257 | 2026-05-12 → **2026-08-20 07:47** |
| SEC | 264 | 264 → 264 | 2026-05-12 → **2026-08-20 07:47** |
| SHD | 262 | 262 → 262 | 2026-05-12 → **2026-08-20 07:47** |
| TS26 | 84 | 0 → **84** | NULL → **2026-08-20 07:47** |
| JTL | 262 | 262 → 262 | 2026-05-12 → **2026-08-20 07:47** |
| ASH | 264 | 0 → **264** | NULL → **2026-08-20 07:47** |
| J25 | 19 | 0 → 0 | NULL → NULL (upstream has no market price data for this set — no cards upstream, or MarketPrice absent for all rows; consistent with `failedSets` staying empty since this is not an error, just zero priced rows for a promo-adjacent set) |

ASH and LOF — the two sets with `prices_updated_at` NULL in the pre-run baseline — are now fully priced with a fresh timestamp, the clearest signal the fix landed. Every non-empty real card set carries a `2026-08-20 07:46`–`07:47` timestamp, replacing the `2026-05-12` freeze recorded in the baseline.

## Task Commits

Each task was committed atomically:

1. **Task 1: Database-backed regression guard — observed RED against current HEAD** - `736a058` (test)
2. **Task 2: Cast each CASE branch to integer and correct the false docstring — GREEN** - `9ff3f9c` (fix)
3. **Task 3: Honest manual-trigger reporting, and a real run proving prices land** - `215c05e` (feat)

## Files Created/Modified

- `__tests__/price-case-update-types.test.ts` - New unmocked Postgres guard proving `buildCaseUpdate()`'s CASE branches parse against the integer price columns; observed RED against HEAD before the fix
- `src/lib/sync/prices.ts` - `buildCaseUpdate()` exported and each branch cast to `::integer`; docstring rewritten to state the real parse-analysis mechanism
- `scripts/sync-prices-now.ts` - Now reports the shortfall vocabulary and exits non-zero on any failed/unprocessed set or a zero total

## Decisions Made

- Cast is a static `::integer` suffix appended inside the same `sql` template as the bound parameter — no `sql.raw()` on a value, no string concatenation — preserving 34-02's injection-safety discipline while fixing the type
- The guard's sentinel prefix (`G341-GUARD`) is asserted absent from `card_definitions` in a `beforeAll` before every subsequent zero-rows assertion is trusted, per the plan's data-integrity prohibition
- `sync-prices-now.ts`'s exit code now mirrors the cron route's strict `setsProcessed === setsTotal` verdict with no tolerance threshold — a `totalUpdated === 0` condition alone forces a non-zero exit even if nothing technically "failed," since that is the exact shape G-34-1 wore

## Deviations from Plan

None — plan executed exactly as written. All three tasks completed with their `<done>` criteria met; no Rule 1-4 deviations were triggered.

## Issues Encountered

The execution session hit an interruption (a spend-limit condition) partway through Task 1, after the RED evidence had already been observed and captured but before the eslint verify step and the commit. On resume, the coordinator confirmed the worktree state (export-only change to `buildCaseUpdate`, untracked test file, no commits yet) matched exactly what had been reported, so no work was redone — execution picked up at the eslint check and proceeded through Tasks 2 and 3 without re-running the RED observation.

## Known Stubs

None. No hardcoded empty values, placeholder text, or unwired data sources were introduced by this plan.

## Threat Flags

None. All threat register items in the plan's `<threat_model>` (T-34-50 through T-34-57, T-34-SC) were addressed by the planned implementation; no new security-relevant surface was introduced beyond what the plan's threat model already covers.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- G-34-1 is closed: the price half of the nightly cron sync now writes prices for every real card set, and a committed regression guard prevents the cast from silently regressing again.
- `.planning/phases/34-card-sync-reliability/34-UAT.md` test 1 ("Deployed cron run completes inside the 300s Vercel budget") can now be re-run against a deploy with meaningful price data — its local pre-fix run showed `prices setsProcessed 25/35, totalUpdated 0`; that shortfall is now resolved locally and should be re-verified against the deployed cron.
- Full test suite: `8 failed | 305 passed | 33 todo (346)` — the 5 failing files are byte-identical to the recorded baseline in `deferred-items.md` (`tests/data-isolation.test.ts`, `__tests__/api-deck-validation.test.ts`, `__tests__/collection-page.test.tsx`, `tests/binder-queries.test.ts`, `tests/catalog-variant.test.ts`). This plan introduced zero new failures and 3 new passing tests (the guard file). The suite is NOT green — those 5 files remain pre-existing, out-of-scope failures for a future test-infrastructure phase.
- No file outside `src/lib/sync/prices.ts`, `__tests__/price-case-update-types.test.ts`, and `scripts/sync-prices-now.ts` was modified (verified via scoped `git status --porcelain` checks against the plan's `<verification>` block).

---
*Phase: 34-card-sync-reliability*
*Completed: 2026-08-20*

## Self-Check: PASSED

All claimed files verified present on disk:
- FOUND: `__tests__/price-case-update-types.test.ts`
- FOUND: `src/lib/sync/prices.ts`
- FOUND: `scripts/sync-prices-now.ts`
- FOUND: `.planning/phases/34-card-sync-reliability/34-09-SUMMARY.md`

All claimed commits verified in `git log --oneline --all`:
- FOUND: `736a058` (Task 1)
- FOUND: `9ff3f9c` (Task 2)
- FOUND: `215c05e` (Task 3)

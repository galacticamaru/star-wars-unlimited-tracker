---
phase: 34-card-sync-reliability
plan: 03
subsystem: api
tags: [nextjs, drizzle, postgres, vitest, cron, observability]

requires:
  - phase: 34-01
    provides: "card_printings.updated_at freshness signal written by upsertCards() (indirect — this route reads the column, does not depend on 34-01's code)"
provides:
  - "GET /api/cron/sync-status — secret-guarded, DB-only per-set freshness report + top-level verdict"
  - "FRESH_WINDOW_HOURS = 24 exported constant, matching SYNC-02's staleness window"
affects: [34-06, 34-07]

tech-stack:
  added: []
  patterns:
    - "Bearer CRON_SECRET guard copied verbatim (including the !cronSecret empty-string-bypass check) rather than abstracted into a shared helper — matches the existing single-copy convention at sync-cards/route.ts"
    - "SQL orderBy() plus a redundant application-level .sort() on the mapped array — belt-and-suspenders determinism since Postgres GROUP BY output order is unspecified and SQL orderBy alone isn't observable through a mocked select chain in tests"

key-files:
  created:
    - src/app/api/cron/sync-status/route.ts
    - __tests__/sync-status-route.test.ts
  modified: []

key-decisions:
  - "fresh requires sets.length > 0 as an explicit AND term — Array.prototype.every is vacuously true on an empty array, so without this guard a wiped card_printings table would report a perfectly fresh catalog"
  - "ageHours computed via strict > FRESH_WINDOW_HOURS comparison so a set at exactly 24.00 hours reads fresh, matching the plan's D-01 edge probe"
  - "Sort applied twice: once in SQL (orderBy, load-bearing per the plan) and once in application code after mapping — the SQL orderBy is not observable through a mocked db.select chain, so the JS-level sort is what actually makes the determinism guarantee testable and true regardless of driver behavior"

requirements-completed: [SYNC-04, SYNC-02]

coverage:
  - id: D1
    description: "GET /api/cron/sync-status returns 401 for a missing header, a wrong secret, and an unset CRON_SECRET (fail-closed on the empty-string case), and 200 for a correct Bearer secret — guard byte-identical to sync-cards/route.ts:7-14"
    requirement: "SYNC-04"
    verification:
      - kind: unit
        ref: "__tests__/sync-status-route.test.ts#returns 401 when Authorization header is missing"
        status: pass
      - kind: unit
        ref: "__tests__/sync-status-route.test.ts#returns 401 when Authorization header has wrong secret"
        status: pass
      - kind: unit
        ref: "__tests__/sync-status-route.test.ts#returns 401 when CRON_SECRET env var is not set, even with a Bearer header present"
        status: pass
      - kind: unit
        ref: "__tests__/sync-status-route.test.ts#returns 200 when Authorization header matches CRON_SECRET"
        status: pass
    human_judgment: false
  - id: D2
    description: "The 24-hour freshness boundary is exact: exactly 24.00 hours old is fresh, 24.01 hours old is stale, and a mixed fresh/stale set drives the top-level verdict to false"
    requirement: "SYNC-04"
    verification:
      - kind: unit
        ref: "__tests__/sync-status-route.test.ts#a set at exactly 24.00 hours old reports stale:false, and fresh is true when it is the only set"
        status: pass
      - kind: unit
        ref: "__tests__/sync-status-route.test.ts#a set at 24.01 hours old reports stale:true and drives fresh to false"
        status: pass
      - kind: unit
        ref: "__tests__/sync-status-route.test.ts#a mixed array of one fresh and one stale set yields fresh:false with both sets present"
        status: pass
    human_judgment: false
  - id: D3
    description: "An empty card_printings aggregate reports fresh:false and sets:[] — never vacuously fresh"
    requirement: "SYNC-04"
    verification:
      - kind: unit
        ref: "__tests__/sync-status-route.test.ts#an empty row set produces fresh:false and sets:[] — an empty catalog is the worst case, not a healthy one"
        status: pass
    human_judgment: false
  - id: D4
    description: "Output ordering is deterministic — scrambled input rows serialise ascending by setCode, and two identical calls produce byte-identical JSON"
    requirement: "SYNC-04"
    verification:
      - kind: unit
        ref: "__tests__/sync-status-route.test.ts#serialises scrambled input rows in ascending setCode order, identically across two calls"
        status: pass
    human_judgment: false
  - id: D5
    description: "The route performs zero outbound fetches (D-04) and returns exactly the contracted response shape (top-level fresh/checkedAt/sets, per-set setCode/lastSyncedAt/ageHours/stale, no extra keys)"
    requirement: "SYNC-04"
    verification:
      - kind: unit
        ref: "__tests__/sync-status-route.test.ts#returns a 200 body with exactly the keys fresh, checkedAt, sets, and no set entry carries an extra key"
        status: pass
      - kind: other
        ref: "grep -n 'swu-db\\|https://' src/app/api/cron/sync-status/route.ts returns nothing"
        status: pass
    human_judgment: false
  - id: D6
    description: "An operator can answer 'which sets last synced and when' with a single authenticated curl against a real deployment, without opening a Neon console"
    verification: []
    human_judgment: true
    rationale: "Operator-workflow claim against a real deployed environment, not a code property — listed as a Manual-Only Verification in 34-VALIDATION.md (curl -H \"Authorization: Bearer $CRON_SECRET\" <deploy>/api/cron/sync-status)"

duration: ~15min
completed: 2026-08-16
status: complete
---

# Phase 34 Plan 03: Operator-Facing Sync-Status Freshness Route Summary

**Secret-guarded `GET /api/cron/sync-status` deriving per-set freshness from `MAX(card_printings.updated_at) GROUP BY set_code`, with a strict 24-hour staleness window and an empty-catalog-never-fresh verdict — the phase's pull-based notification substrate for a platform that doesn't alert on cron failures.**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-08-16
- **Tasks:** 2 completed
- **Files modified:** 2 (both created)

## Accomplishments
- New route `GET /api/cron/sync-status` answers "which sets last synced and when" from a single read-only aggregate over `card_printings` — no new table, no migration, no outbound fetch (D-02, D-04)
- Bearer `CRON_SECRET` guard copied verbatim from `sync-cards/route.ts:7-14`, including the `!cronSecret`-first empty-string-bypass check, so an unset or empty secret fails closed
- `fresh` verdict is honest at both edges the plan called out: exactly 24 hours is fresh (`ageHours > 24`, never `>=`), and an entirely empty aggregate reports `fresh:false` rather than exploiting `Array.prototype.every`'s vacuous truth on `[]`
- Output is deterministic — sorted both in SQL (`orderBy`) and again in application code after mapping, so two identical calls always serialise identically regardless of Postgres's unspecified `GROUP BY` row order
- 11 new tests pin the guard (4 cases), the boundary (3 cases via frozen-clock `vi.setSystemTime`), the empty-table verdict, ordering determinism, the no-outbound-fetch constraint, and the exact response-body key set

## Task Commits

Each task was committed atomically:

1. **Task 1: Build the secret-guarded, DB-only freshness route** - `9307098` (feat)
2. **Task 2: Cover the guard, the 24-hour boundary, the empty table, and output ordering** - `910b48a` (test)

**Plan metadata:** committed alongside this SUMMARY (worktree mode — orchestrator handles the shared-file/metadata commit after merge)

## Files Created/Modified
- `src/app/api/cron/sync-status/route.ts` - New route: `FRESH_WINDOW_HOURS = 24` constant, Bearer guard, single grouped/ordered `db.select` aggregate over `cardPrintings`, `{ fresh, checkedAt, sets }` response shape, generic 500 on failure
- `__tests__/sync-status-route.test.ts` - 11 tests covering the guard, the boundary, the empty-table verdict, ordering determinism, the no-outbound-fetch constraint, and the exact response shape

## Decisions Made
- `fresh = sets.length > 0 && sets.every(s => !s.stale)` — the `sets.length > 0` term is non-negotiable per the plan's prohibition against reading absence of evidence as success
- `ageHours` rounded to two decimal places for readability, but the `stale` comparison operates on the unrounded value from the strict `>` check against `FRESH_WINDOW_HOURS`
- Added a second, application-level sort (`.sort((a, b) => a.setCode.localeCompare(b.setCode))`) after the SQL `orderBy` — see Deviations below

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Added application-level sort in addition to SQL orderBy**
- **Found during:** Task 2 (writing the ordering-determinism test)
- **Issue:** The plan's Task 1 action specified SQL `orderBy(asc(cardPrintings.setCode))` as "load-bearing, not cosmetic" because Postgres `GROUP BY` output order is unspecified. Task 2's own acceptance criteria then require a test that feeds the mocked `db.select` chain scrambled rows and asserts the *route's* output is sorted ascending. A SQL-level `orderBy()` call is invisible to a unit test that mocks the select chain — the mock returns whatever array it's told to return, regardless of what `.orderBy()` was called with. Without an application-level sort, the determinism guarantee the plan requires would be real against a live Postgres instance but unverifiable (and un-verified) by the committed test suite.
- **Fix:** Added `.sort((a, b) => a.setCode.localeCompare(b.setCode))` to the mapped `sets` array in `route.ts`, after the existing SQL `orderBy`. Both mechanisms now cooperate: SQL orderBy reduces the DB-side work in the common case, and the JS sort is what the test suite — and any future refactor that touches the query — actually enforces.
- **Files modified:** `src/app/api/cron/sync-status/route.ts`
- **Verification:** `__tests__/sync-status-route.test.ts#serialises scrambled input rows in ascending setCode order, identically across two calls` passes with genuinely scrambled mock input; `npx tsc --noEmit` and `npx eslint src/app/api/cron/sync-status` both clean
- **Committed in:** `910b48a` (Task 2 commit, alongside the test file since the fix and its proof are inseparable)

---

**Total deviations:** 1 auto-fixed (Rule 2, determinism guarantee made real and testable, not just SQL-level)
**Impact on plan:** No scope creep — the plan's own Task 2 acceptance criteria required a test that only a JS-level sort can satisfy against a mocked DB layer. The route's threat-model prohibition ("MUST NOT report freshness from an absence of evidence") and this ordering fix are both about making a stated guarantee actually true under test, not adding new behavior.

## Issues Encountered
- This worktree had no `node_modules` (git worktrees don't get their own `npm install`). Verified `package-lock.json` is byte-identical to the main repo's, then symlinked `node_modules` from the main repo (`ln -s <main-repo>/node_modules node_modules`) rather than running a redundant install. The symlink is gitignored (`/node_modules` in `.gitignore`) and was never staged.
- Project-wide `npx tsc --noEmit` reports pre-existing errors in `__tests__/api-deck-validation.test.ts` and `__tests__/collection-page.test.tsx` — same failures already logged in `deferred-items.md` by 34-01, neither file touched by this plan. Scoped output for this plan's two files is clean.
- Full-suite `npx vitest run` after this plan: **8 failed test files / 39 passed / 3 skipped (50 total)**, **12 failed tests / 260 passed / 33 todo (305 total)**. The failing-file set (`collection-page.test.tsx`, `auth-config.test.ts`, `prices.test.ts`, `api-deck-validation.test.ts`, `cron-route.test.ts`, `binder-queries.test.ts`, `catalog-variant.test.ts`, `data-isolation.test.ts`) is an exact match for the 8-file baseline recorded in `34-VALIDATION.md` — this plan introduces zero new regressions. The new test file (`sync-status-route.test.ts`) and its 11 tests all pass.

## Known Stubs

None — the route is fully wired against the real `db`/`cardPrintings` schema; no hardcoded empty/placeholder returns.

## Threat Flags

None — this plan's threat surface is exactly what `34-03-PLAN.md`'s `<threat_model>` already registered (T-34-10 through T-34-16, T-34-SC). No endpoints, auth paths, or trust boundaries beyond the ones the plan enumerated were introduced.

## User Setup Required

None - no external service configuration required. `CRON_SECRET` is the same environment variable already configured for `sync-cards`; this route reads it, does not require a separate secret.

## Next Phase Readiness

- `/api/cron/sync-status` is deployable independently of the rest of Phase 34 — it has no dependency on 34-02, 34-04, 34-05, or 34-07's code, only on the `card_printings` table already in production
- 34-06 (Vercel budget confirmation) and 34-07 (loud cron failure verdict) are unaffected by this plan's files and can proceed in parallel or after
- The Manual-Only Verification row in `34-VALIDATION.md` ("Catalog freshness answerable by a single authenticated curl") remains open until a real deploy — flagged there as `human_needed`, not a blocker for this plan's completion
- No blockers for downstream plans in this phase

## Self-Check: PASSED

All claimed created files exist on disk (`src/app/api/cron/sync-status/route.ts`, `__tests__/sync-status-route.test.ts`, this SUMMARY.md) and both task commits (`9307098`, `910b48a`) are present in `git log --oneline --all`.

---
*Phase: 34-card-sync-reliability*
*Completed: 2026-08-16*

---
phase: 34-card-sync-reliability
plan: 04
subsystem: testing
tags: [vitest, drizzle-orm, neon-postgres, integration-test, data-integrity]

requires:
  - phase: 34-card-sync-reliability (plan 01)
    provides: "src/lib/sync/chunk.ts (chunk, SYNC_CHUNK_SIZE) reused for batching the collector-number query"
provides:
  - "DB-backed Vitest test path (vitest.config.mts loadEnv + __tests__/starter-decks-resolve.test.ts) — first real-database test in the repo's suite"
  - "Committed regression guard proving every starterDecks[] collector number resolves to a Normal card_printings row"
  - "DEBT-05 closed: disproven-cause CONCERNS.md entry rewritten with the real placeholder-substitution history"
affects: [starter-decks, quick-add, vitest-config]

tech-stack:
  added: []
  patterns:
    - "loadEnv(mode, cwd, 'DATABASE_') in vitest.config.mts test.env — least-privilege env exposure for the one test file that needs a real DB connection"
    - "afterAll(() => pool.end()) teardown for DB-backed Vitest tests, instead of process-exit patterns used by standalone tsx scripts"

key-files:
  created:
    - __tests__/starter-decks-resolve.test.ts
  modified:
    - vitest.config.mts
    - src/db/index.ts
    - .planning/codebase/CONCERNS.md

key-decisions:
  - "loadEnv's per-key merge order (process.env values override .env-file values for prefixed keys) means `DATABASE_URL= npx vitest run` correctly fails the guard test — verified by direct read of vite's loadEnv source, not assumed"
  - "variantType='Normal' filter applied in the SQL WHERE clause (matching starter-deck/route.ts exactly), not post-query in JS — the edge-probe truth requires byte-identical filtering semantics to the runtime route"
  - "Both LAW spotlight decks (law-jabba-the-hutt, law-leia-organa) resolve cleanly against the live catalog — Task 2 required no correction to starter-decks.ts, only the CONCERNS.md record needed rewriting"

patterns-established:
  - "DB-backed integration tests import '@/db' directly (never mocked) and are named/organized to make that obvious from the test file name (starter-decks-resolve)"

requirements-completed: [DEBT-05]

coverage:
  - id: D1
    description: "DB-backed Vitest test path exists: vitest.config.mts exposes DATABASE_URL via loadEnv scoped to the DATABASE_ prefix; test closes its Pool connection in afterAll so the worker exits cleanly"
    requirement: "DEBT-05"
    verification:
      - kind: integration
        ref: "npx vitest run __tests__/starter-decks-resolve.test.ts — process returns to shell without hanging"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every collector number in every deck in starterDecks[] (22 decks / 746 unique numbers) resolves to a Normal-variant card_printings row, mirroring the variantType filter in starter-deck/route.ts:44-47"
    requirement: "DEBT-05"
    verification:
      - kind: integration
        ref: "__tests__/starter-decks-resolve.test.ts#resolves every collector number in every starter deck to a Normal printing"
        status: pass
    human_judgment: false
  - id: D3
    description: "The check fails loudly (never skips) when DATABASE_URL is absent"
    requirement: "DEBT-05"
    verification:
      - kind: integration
        ref: "DATABASE_URL= npx vitest run __tests__/starter-decks-resolve.test.ts — exits non-zero"
        status: pass
    human_judgment: false
  - id: D4
    description: "A collector number existing only as a non-Normal variant is classified UNRESOLVED, without a database round trip"
    requirement: "DEBT-05"
    verification:
      - kind: unit
        ref: "__tests__/starter-decks-resolve.test.ts#classifies a collector number that exists only as a non-Normal variant as unresolved (no database round trip)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Both LAW spotlight decks confirmed correct (no correction needed); CONCERNS.md DEBT-05 entry rewritten to match the disproven-cause finding, citing commits 8ca6265 and eeb1b6b"
    requirement: "DEBT-05"
    verification:
      - kind: other
        ref: "grep -c 'law-jabba-the-hutt' .planning/codebase/CONCERNS.md (>=1), grep -c 'Kessel Run' (=0), grep -c 'swu-db maintainers' (=0), grep -c '8ca6265'/'eeb1b6b' (=1 each)"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-08-16
status: complete
---

# Phase 34 Plan 04: DB-Backed Starter-Deck Resolution Test Summary

**Committed DB-backed Vitest test proves all 746 unique collector numbers across 22 starterDecks[] entries — including both LAW spotlight decks — resolve to Normal card_printings rows; CONCERNS.md's DEBT-05 record rewritten from a disproven "missing data" cause to the real placeholder-substitution history.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-08-16T18:00Z (base commit)
- **Completed:** 2026-08-16T18:08Z
- **Tasks:** 2 completed
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- Established the repo's first DB-backed Vitest path: `vitest.config.mts` now loads `DATABASE_URL` via `loadEnv(mode, cwd, 'DATABASE_')`, scoped to that prefix so no other secret (`AUTH_SECRET`, etc.) reaches the test environment
- New `__tests__/starter-decks-resolve.test.ts` queries `card_printings` (chunked at `SYNC_CHUNK_SIZE`) for every unique collector number across all 22 decks in `starterDecks[]`, applying the exact `variantType = 'Normal'` filter the quick-add route uses — and found **zero unresolved pairs**, closing DEBT-05 as verify-and-close rather than a data-correction task
- Confirmed the guard fails loudly rather than skipping: an absent `DATABASE_URL` throws at import time (via `src/db/index.ts`'s existing guard) and a `DATABASE_URL=` shell override correctly propagates through `loadEnv`'s merge order to also fail the test — verified directly against the merge logic in vite's `loadEnv` source, not assumed
- Rewrote `.planning/codebase/CONCERNS.md`'s DEBT-05 entry: replaced a reference to a non-existent "Kessel Run" deck and a debunked "9 cards absent from DB" cause with the real placeholder-substitution history (`8ca6265` introduced the placeholders, `eeb1b6b` filled them in unverified) and the real fix (this committed test)
- Ran the full suite after both tasks: 6 failed files / 300 tests, a strict subset of the recorded 8-file RED baseline — no regressions introduced (`tests/auth-config.test.ts` and `src/lib/sync/prices.test.ts` are no longer failing, addressed by other wave work; the remaining 6 are pre-existing and out of this plan's scope)

## Task Commits

Each task was committed atomically:

1. **Task 1: Establish the DB-backed Vitest path and the deck-resolution test** - `7faa94d` (feat)
2. **Task 2: Correct any unresolved deck entries and rewrite the CONCERNS.md DEBT-05 record** - `d87e4c2` (docs)

**Plan metadata:** committed together with this SUMMARY.md per worktree execution protocol.

## Files Created/Modified

- `__tests__/starter-decks-resolve.test.ts` - New DB-backed, read-only test resolving every `starterDecks[]` collector number against `card_printings`; includes a pure-function unit test for non-Normal-variant classification
- `vitest.config.mts` - Function-form `defineConfig(({ mode }) => ...)` with `test.env: loadEnv(mode, process.cwd(), 'DATABASE_')`
- `src/db/index.ts` - Exported the `Pool` instance (additive) so the test can close its connection in `afterAll`
- `.planning/codebase/CONCERNS.md` - DEBT-05 entry rewritten with accurate history, correct deck IDs, and correct fix

## Decisions Made

- Applied the `variantType = 'Normal'` filter inside the SQL `WHERE` clause (via Drizzle `and(inArray(...), eq(...))`), not as a post-query JS filter, so the test's query is byte-identical in filtering semantics to `starter-deck/route.ts:44-47` — this is what the edge-probe truth in the plan's `must_haves` requires
- Extracted `flattenPairs`, `computeUnresolved`, and `buildResolvedSet` as small pure functions inside the test file, enabling the required non-Normal-variant classification test to run without a database round trip while the main resolution test still exercises the real query
- No `src/data/starter-decks.ts` correction was needed — verified this is the finding (not a non-event) since the plan explicitly calls out documenting a clean pass as a real outcome

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Bootstrapped this worktree's `node_modules` via `npm ci`**
- **Found during:** Task 1 (before running any Vitest command)
- **Issue:** This git worktree had no `node_modules` directory at all (worktrees don't inherit gitignored directories), so `npx vitest`/`npx tsc` could not resolve any package
- **Fix:** Ran `npm ci --no-audit --no-fund` against the committed `package-lock.json` — a standard project-bootstrap install of already-declared dependencies, not a new/unreviewed package addition, so this is outside the package-manager-install exclusion in Rule 3 (that exclusion targets adding a *new*, unverified package name, not restoring a lockfile-pinned install)
- **Files modified:** none tracked (node_modules is gitignored)
- **Verification:** `npx vitest run`, `npx tsc --noEmit`, `npx eslint` all execute successfully afterward
- **Committed in:** n/a (gitignored, not committed)

**2. [Rule 3 - Blocking] Corrected the `vitest/config` import for `loadEnv`**
- **Found during:** Task 1, verifying the config change against installed package types
- **Issue:** The plan's action text implied importing `loadEnv` alongside `defineConfig` from `vitest/config`, but `vitest/config`'s type surface (checked directly against `node_modules/vitest/dist/config.d.ts`) does not re-export `loadEnv` — only `defineConfig`, `mergeConfig`, and a few Vite type re-exports
- **Fix:** Imported `loadEnv` from `vite` directly (`import { loadEnv } from 'vite';`), which is where the plan's own read_first pointer (Pitfall discussion of `loadEnv`) sources it from
- **Files modified:** `vitest.config.mts`
- **Verification:** `npx vitest run __tests__/starter-decks-resolve.test.ts` succeeds with `DATABASE_URL` correctly populated from `.env.local`
- **Committed in:** `7faa94d` (Task 1 commit)

**3. [Rule 3 - Blocking] Copied `.env.local` into this worktree from the main repo checkout**
- **Found during:** Task 1, first test run
- **Issue:** `.env.local` (gitignored, holds `DATABASE_URL`) exists at the main repo root but is not present in this per-agent worktree, since git worktrees do not share gitignored files. Without it the DB-backed test cannot exercise its real code path at all
- **Fix:** Copied `.env.local` from the main repo root into this worktree's root via `cp` (source and destination both local filesystem paths, no content was echoed through the shell). Confirmed via `git check-ignore -v .env.local` that it remains gitignored and did not enter any commit
- **Files modified:** none tracked (`.env.local` is gitignored)
- **Verification:** `git status --short` shows no `.env.local` in either commit; `npx vitest run __tests__/starter-decks-resolve.test.ts` passes against the real database
- **Committed in:** n/a (gitignored, not committed)

---

**Total deviations:** 3 auto-fixed (all Rule 3 - blocking issues necessary to execute the plan's own acceptance criteria)
**Impact on plan:** All three were prerequisites for running the DB-backed test the plan mandates; no scope creep, no application code beyond what the plan specified.

## Issues Encountered

None beyond the three deviations above.

## User Setup Required

None - no external service configuration required. `DATABASE_URL` already existed in the main repo's `.env.local`; this worktree needed a local copy only, and no new environment variables or dashboard configuration were introduced.

## Next Phase Readiness

- DEBT-05 is fully closed: the regression guard is permanent (committed) and will catch any future hand-edited deck that introduces an unresolvable collector number
- `src/db/index.ts` now exports `pool`, available for any future DB-backed test that needs the same teardown pattern
- No blockers for the rest of Phase 34's waves; this plan's files (`vitest.config.mts`, `__tests__/starter-decks-resolve.test.ts`, `src/data/starter-decks.ts`, `.planning/codebase/CONCERNS.md`) were listed as this plan's exclusive `files_modified` and had no overlap with sibling wave-2 plans

---
*Phase: 34-card-sync-reliability*
*Completed: 2026-08-16*

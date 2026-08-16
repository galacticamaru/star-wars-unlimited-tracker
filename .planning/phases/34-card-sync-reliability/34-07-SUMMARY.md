---
phase: 34-card-sync-reliability
plan: 07
subsystem: api
tags: [nextjs, cron, vercel, vitest, sync, observability]

requires:
  - phase: 34-card-sync-reliability
    provides: "CardSyncResult (34-01), PriceSyncResult (34-02) — both carry setsTotal/setsProcessed/failedSets/unprocessedSets/deadlineHit; getNonTokenSets() (34-01); CONFIRMED_MAX_DURATION_SECONDS=300 / SOFT_DEADLINE_SECONDS=240 (34-06, 34-BUDGET.md)"
provides:
  - "GET /api/cron/sync-cards — explicit maxDuration=300, one getNonTokenSets() call feeding both halves, computed success verdict (cardsOk && pricesOk), 500 on any shortfall naming failed/unprocessed set codes"
affects: []

tech-stack:
  added: []
  patterns:
    - "One shared set-list fetch feeding two independent sync calls (D-10) — structurally prevents cards and prices from ever disagreeing about scope"
    - "Verdict as strict-equality comparison (setsProcessed === setsTotal, setsTotal > 0) rather than a threshold or percentage — no tolerance band for a partial sync"
    - "Unconditional cache invalidation decoupled from the success verdict — failure signal lives in the HTTP status and log line, not in withheld revalidateTag"

key-files:
  created: []
  modified:
    - src/app/api/cron/sync-cards/route.ts
    - __tests__/cron-route.test.ts

key-decisions:
  - "maxDuration is a bare numeric literal (300), not imported from 34-BUDGET.md or computed — Next.js route segment config requires static analysability; confirmed against node_modules/next/dist/docs/.../maxDuration.md"
  - "deadlineAt is derived once in route.ts from maxDuration * 1000 * SOFT_DEADLINE_RATIO (0.8) and passed to both syncAllCards() and syncPrices() — single source, no drift between D-08 and D-09"
  - "revalidateTag('cards', 'max') stays unconditional (outside the success/failure branch) — the sets that did land genuinely changed, and gating invalidation on the verdict would serve stale cache for real updates"
  - "The console.error naming the shortfall runs before the response is built and includes both halves' processed/total counts and failedSets/unprocessedSets — Vercel Hobby cron doesn't alert on non-2xx, so this log line and the sync-status route (34-03) are the only operator channels"
  - "Test mocks now cover all four route dependencies (upsert-cards, prices, set-list, next/cache) with full result shapes, replacing the prior single-mock/partial-shape setup that made the route's field reads untestable"

requirements-completed: [SYNC-01, SYNC-03]

coverage:
  - id: D1
    description: "The cron route computes success as cardsOk && pricesOk (strict setsProcessed === setsTotal, each requiring setsTotal > 0) and returns 500 on any shortfall, replacing the prior unconditional success: true"
    requirement: "SYNC-03"
    verification:
      - kind: unit
        ref: "__tests__/cron-route.test.ts#reports a cards shortfall as status 500 with success false and names the failing set"
        status: pass
      - kind: unit
        ref: "__tests__/cron-route.test.ts#reports a prices-only shortfall as status 500 with success false (D-07)"
        status: pass
      - kind: unit
        ref: "__tests__/cron-route.test.ts#exact-equality boundary: 5-of-5 both halves is exactly 200, 4-of-5 cards is exactly 500 — no band between them"
        status: pass
      - kind: unit
        ref: "__tests__/cron-route.test.ts#an empty set list on both halves is a failed run, not a trivially complete one"
        status: pass
      - kind: other
        ref: "grep -Ec 'const success = cardsOk && pricesOk' src/app/api/cron/sync-cards/route.ts == 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "A fired soft deadline still returns a response (500) naming the unprocessed set codes, and every set is accounted for in exactly one of processed/failed/unprocessed"
    requirement: "SYNC-01"
    verification:
      - kind: unit
        ref: "__tests__/cron-route.test.ts#a fired soft deadline surfaces the unprocessed set codes and fails the run"
        status: pass
      - kind: unit
        ref: "__tests__/cron-route.test.ts#accounts for every set in exactly one of processed, failed, or unprocessed"
        status: pass
    human_judgment: false
  - id: D3
    description: "maxDuration is an explicit, statically-analysable export matching the confirmed 300s ceiling; the soft deadline is derived once as 80% of it and shared by both sync calls"
    requirement: "SYNC-01"
    verification:
      - kind: other
        ref: "grep -Ec '^export const maxDuration = [0-9]+' src/app/api/cron/sync-cards/route.ts == 1, value 300 matches 34-BUDGET.md CONFIRMED_MAX_DURATION_SECONDS"
        status: pass
      - kind: other
        ref: "grep -c 'SOFT_DEADLINE_RATIO' src/app/api/cron/sync-cards/route.ts == 2"
        status: pass
      - kind: other
        ref: "npx next build exits 0 (route segment config accepted by this Next.js version)"
        status: pass
    human_judgment: false
  - id: D4
    description: "getNonTokenSets() is fetched exactly once per request and the identical array is passed as `sets` to both syncAllCards and syncPrices (D-10)"
    requirement: "SYNC-01"
    verification:
      - kind: unit
        ref: "__tests__/cron-route.test.ts#fetches the set list exactly once and passes the identical array as `sets` to both syncAllCards and syncPrices"
        status: pass
    human_judgment: false
  - id: D5
    description: "revalidateTag('cards', 'max') fires on every non-throwing run regardless of verdict; the 401 paths and generic 'Sync failed' catch are unchanged"
    requirement: "SYNC-01"
    verification:
      - kind: unit
        ref: "__tests__/cron-route.test.ts#still invalidates the cards cache tag on a failed (500) run — invalidation is not gated on the verdict"
        status: pass
      - kind: unit
        ref: "__tests__/cron-route.test.ts#returns 401 when Authorization header is missing / has wrong secret / CRON_SECRET env var is not set"
        status: pass
    human_judgment: false
  - id: D6
    description: "A real deployed invocation of GET /api/cron/sync-cards processes every non-token set and returns a response inside the confirmed 300s Vercel function budget"
    verification: []
    human_judgment: true
    rationale: "Deployment-only truth (verification: backstop in the plan) — only observable against real upstream data volume on real Vercel infrastructure post-deploy, not a code property this worktree can prove."
duration: ~25min
completed: 2026-08-16
status: complete
---

# Phase 34 Plan 07: Honest Cron Sync Verdict Summary

**Cron route now computes `success = cardsOk && pricesOk` from strict `setsProcessed === setsTotal` (and `setsTotal > 0`) on both halves instead of unconditionally returning `success: true`, with an explicit `maxDuration = 300` and one shared `getNonTokenSets()` call feeding both syncs.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-08-16
- **Tasks:** 2 completed
- **Files modified:** 2

## Accomplishments
- Replaced the unconditional `success: true` at the old `route.ts:31` with a computed verdict: `cardsOk = cardResult.setsTotal > 0 && cardResult.setsProcessed === cardResult.setsTotal` (mirrored for prices), `success = cardsOk && pricesOk` — no threshold, no percentage, a shortfall of one set in either half fails the run
- Added `export const maxDuration = 300` (D-09, matching `CONFIRMED_MAX_DURATION_SECONDS` in `34-BUDGET.md`) as a bare numeric literal, confirmed against this project's actual Next.js `maxDuration` doc rather than assumed from training data
- Derived `deadlineAt` once from `maxDuration * 1000 * SOFT_DEADLINE_RATIO` (0.8) and passed the identical value to both `syncAllCards()` and `syncPrices()` — D-08's threshold can never drift from D-09's budget
- Route now fetches `getNonTokenSets()` exactly once and hands the same array to both halves (D-10) — cards and prices can no longer disagree about scope
- `revalidateTag('cards', 'max')` fires unconditionally on every non-throwing run, before the response is built — the failure signal lives in the HTTP status and a new `console.error` naming the shortfall, not in withheld cache invalidation
- The 401 auth-guard block (`:6-14`) and the generic `Sync failed` catch are byte-identical to before
- Rewrote `__tests__/cron-route.test.ts`: mocks now cover all four route dependencies (`upsert-cards`, `prices`, `set-list`, `next/cache`) with full result shapes, and 8 new cases pin the shortfall, boundary, empty-list, deadline, accounting, cache-invalidation and shared-set-list behavior — all 4 pre-existing 401/200 cases stay green, and all 12 tests now pass (the file was 4-of-4 red at baseline)

## Task Commits

Each task was committed atomically:

1. **Task 1: Set the execution budget, share one set list, and compute an honest verdict** - `4ebb83b` (feat)
2. **Task 2: Pin the verdict with partial-run, empty-list and deadline test cases** - `c06c5ab` (test)

**Plan metadata:** committed alongside this SUMMARY (worktree mode — orchestrator handles the shared-file/metadata commit after merge)

## Files Created/Modified
- `src/app/api/cron/sync-cards/route.ts` - `maxDuration = 300` export, `SOFT_DEADLINE_RATIO = 0.8`, one `getNonTokenSets()` call feeding both `syncAllCards({sets, deadlineAt})` and `syncPrices({sets, deadlineAt})`, computed `cardsOk`/`pricesOk`/`success` verdict, shortfall `console.error`, `deadlineHit` in the response body, status `success ? 200 : 500`
- `__tests__/cron-route.test.ts` - Mocks extended to `@/lib/sync/prices`, `@/lib/sync/set-list`, `next/cache`; 12 tests total (4 pre-existing 401/200 cases + 8 new: cards shortfall, prices-only shortfall, exact-equality boundary pair, empty set list, fired deadline, per-half accounting identity, unconditional cache invalidation on failure, shared-set-list propagation)

## Decisions Made
- `maxDuration` is a plain numeric literal (`300`), never imported from `34-BUDGET.md` or computed — Next.js's static analysis of route segment config requires this; confirmed against `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/maxDuration.md` before writing it, per `AGENTS.md`'s "not the Next.js you know" directive
- `revalidateTag('cards', 'max')` kept at the two-argument form already in use (confirmed current against `node_modules/next/dist/docs/.../revalidateTag.md` — the single-argument form is deprecated in this Next.js version); left outside any conditional, matching the plan's explicit prohibition against gating invalidation on the verdict
- Test result-shape builder functions (`fullCardResult`/`fullPriceResult`) default to a full 5-of-5 success and take `Partial<...>` overrides per test — keeps each test's diff-from-default readable (e.g. `fullCardResult({ setsProcessed: 4, failedSets: ['JTL'] })`) instead of restating every field
- The exact-equality boundary is pinned as one test that calls the same `handler` twice (5-of-5 then 4-of-5) rather than two separate tests, so the "no band between them" property is visible as a pair in one assertion block, matching the plan's phrasing

## Deviations from Plan

None - plan executed exactly as written. Both tasks' acceptance criteria (grep-based structural checks, `tsc`/`eslint` cleanliness, the full test suite) pass without needing any auto-fix.

## Issues Encountered

- This worktree had no `node_modules` (git worktrees don't get their own `npm install`). Verified `package-lock.json` is byte-identical to the main repo's (matching the precedent set by 34-03), then symlinked `node_modules` from the main repo rather than running a redundant install. The symlink is gitignored and was never staged.
- This worktree also had no `.env.local` (gitignored, as documented in the executor's `<parallel_execution>` instructions). `npx vitest run` (full suite) without it shows 7 failed files instead of the expected 6-file baseline — the two extras (`__tests__/starter-decks-resolve.test.ts`, `tests/auth-config.test.ts`) both throw `DATABASE_URL environment variable is not set` from `src/db/index.ts`, a 34-04 DB-backed test path this plan does not touch. To confirm this was purely a worktree-isolation artifact and not a regression, `.env.local` was temporarily symlinked from the main repo (never staged/committed, matching the same "never staged" discipline as the `node_modules` symlink) and the full suite re-run: **5 failed test files / 44 passed / 3 skipped (52 total)**, exactly the expected subset of the 6-file baseline (`__tests__/api-deck-validation.test.ts`, `__tests__/collection-page.test.tsx`, `tests/binder-queries.test.ts`, `tests/catalog-variant.test.ts`, `tests/data-isolation.test.ts`) with `__tests__/cron-route.test.ts` now green. The symlink was removed afterward; it is not present in this worktree's working tree at handoff.
- `npx next build` was also verified with the `.env.local` symlink present: exits 0, and `/api/cron/sync-cards` appears in the route table as `ƒ` (dynamic) with no errors related to the `maxDuration` config. The build's own console output shows unrelated pre-existing warnings (`BetterAuthError: default secret`, `HANGING_PROMISE_REJECTION` on a few unrelated `/api/*` routes during static-page generation) that do not affect the build's exit code and are not caused by this plan's files.
- `npx tsc --noEmit` (project-wide) still reports the same pre-existing, unrelated errors in `__tests__/api-deck-validation.test.ts` and `__tests__/collection-page.test.tsx` documented since 34-01. Scoped output for `src/app/api/cron/sync-cards/route.ts` and `__tests__/cron-route.test.ts` is clean.

## Known Stubs

None — every code path shipped in this plan is fully wired against the real `syncAllCards()`/`syncPrices()`/`getNonTokenSets()` implementations; no hardcoded empty/placeholder returns.

## Threat Flags

None — this plan's threat surface is exactly what `34-07-PLAN.md`'s `<threat_model>` already registered (T-34-30 through T-34-35, T-34-SC). No new endpoints, auth paths, or trust boundaries were introduced; the auth guard at `route.ts:6-14` is byte-identical to before.

## User Setup Required

None - no external service configuration required. `CRON_SECRET` and `DATABASE_URL` are the same environment variables already configured for this route and the rest of the project.

## Next Phase Readiness

- SYNC-03 (loud cron failure) is now closed: the route can no longer report a partial sync as a success
- The Manual-Only Verification row in `34-VALIDATION.md` ("A real deployed `GET /api/cron/sync-cards` processes every non-token set and returns 200 or 500 inside the confirmed budget") remains open until a real deploy — flagged there as `human_needed`, not a blocker for this plan's completion (see coverage D6 above)
- This was the last plan in Wave 3 and the last plan in Phase 34; no downstream plans in this phase depend on it
- No blockers

## Self-Check: PASSED

All claimed modified files exist on disk (`src/app/api/cron/sync-cards/route.ts`, `__tests__/cron-route.test.ts`, this SUMMARY.md) and both task commits (`4ebb83b`, `c06c5ab`) are present in `git log --oneline --all`.

---
*Phase: 34-card-sync-reliability*
*Completed: 2026-08-16*

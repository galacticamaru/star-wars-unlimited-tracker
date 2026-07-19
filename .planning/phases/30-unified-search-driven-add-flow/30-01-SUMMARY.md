---
phase: 30-unified-search-driven-add-flow
plan: 01
subsystem: ui, api
tags: [react, nextjs, drizzle, trade-binder, authorization]

# Dependency graph
requires: []
provides:
  - "Ownership-gated VariantTradeSection (disabled trade stepper + informational reason for unowned variants)"
  - "New VariantWantSection — always-available want-quantity stepper writing to /api/binder/wants"
  - "Server-side ownership enforcement on PATCH /api/trade (403 for unowned printings)"
affects: [30-02]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-row ownership gating on stepper controls via ownedCount === 0 threaded from printing rows"
    - "Server-side authorization check mirroring client-side gating (userPrintingCollections count > 0) before a privileged upsert"

key-files:
  created:
    - src/components/catalog/variant-want-section.tsx
  modified:
    - src/components/catalog/variant-trade-section.tsx
    - src/app/api/trade/route.ts
    - tests/trade-api.test.ts

key-decisions:
  - "Ownership check only applies when tradeQuantity > 0; clearing an offering (quantity 0) is always allowed, matching the plan's explicit acceptance criterion"
  - "Added vi.mock('@/db') and vi.mock('next/cache') to tests/trade-api.test.ts to properly exercise the new ownership branch, since the file previously had zero real DB/cache mocking and only ran (barely) because DATABASE_URL happened to be missing before any assertion was reached"

patterns-established:
  - "Ownership-gated stepper pattern: thread ownedCount into a section's Printing interface, compute isOwned per row, disable all three controls (minus/input/plus) and render an inline text-muted-foreground reason — never destructive color for informational (non-error) unowned state"

requirements-completed: [BINDER-13, BINDER-14]

coverage:
  - id: D1
    description: "Trade stepper disabled for unowned variants with 'You don't own this variant' reason, informational (not destructive) styling"
    requirement: "BINDER-13"
    verification:
      - kind: unit
        ref: "grep -n ownedCount src/components/catalog/variant-trade-section.tsx (manual verification per plan's <verify> block; no unit test file exists for this component)"
        status: pass
    human_judgment: true
    rationale: "Visual/interaction correctness (disabled control styling, reason placement) needs human confirmation in the browser; no component-level test harness exists for these catalog stepper sections."
  - id: D2
    description: "Always-available want stepper section (VariantWantSection) posting to /api/binder/wants, ungated by ownership"
    requirement: "BINDER-14"
    verification:
      - kind: unit
        ref: "grep -c ownedCount src/components/catalog/variant-want-section.tsx returns 0 (manual verification per plan's <verify> block)"
        status: pass
    human_judgment: true
    rationale: "No unit test exercises the new component's rendering/interaction; visual confirmation of the always-enabled stepper is more reliable via UAT than a grep."
  - id: D3
    description: "PATCH /api/trade rejects positive-quantity trade offerings for printings the user does not own (403), still allows clearing (quantity 0) and owned updates"
    requirement: "BINDER-13"
    verification:
      - kind: unit
        ref: "tests/trade-api.test.ts#PATCH /api/trade > returns 403 and does not persist an offering for an unowned printing (T-30-01)"
        status: pass
      - kind: unit
        ref: "tests/trade-api.test.ts#PATCH /api/trade > allows clearing an offering (tradeQuantity 0) without an ownership check"
        status: pass
      - kind: unit
        ref: "tests/trade-api.test.ts#PATCH /api/trade > updates trade quantity when the user owns the printing"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-07-19
status: complete
---

# Phase 30 Plan 01: Ownership-Gated Trade Stepper, Want Stepper, Server-Side Trade Authorization Summary

**Ownership-gated `VariantTradeSection`, a new always-available `VariantWantSection` twin, and a server-side `userPrintingCollections` ownership check on `PATCH /api/trade` that closes a broken-access-control gap (T-30-01).**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-19T00:34:10Z
- **Completed:** 2026-07-19T00:39:58Z
- **Tasks:** 3 completed
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments
- Trade stepper (`VariantTradeSection`) now disables its minus/input/plus controls for unowned variants and shows an inline, informational (`text-muted-foreground`, never destructive) "You don't own this variant" reason
- New `VariantWantSection` component — a near line-for-line twin of `VariantTradeSection` — always enabled for every variant, posting `{ cardPrintingId, quantity }` to `POST /api/binder/wants`
- `PATCH /api/trade` now authoritatively enforces ownership server-side: a positive `tradeQuantity` for a printing the user does not own returns 403 and never reaches `upsertTradeOffering`; `tradeQuantity === 0` (clearing) is always allowed

## Task Commits

Each task was committed atomically:

1. **Task 1: Add ownership gating to the trade stepper section** - `51235ab` (feat)
2. **Task 2: Create the always-available want stepper section** - `1d910e2` (feat)
3. **Task 3: Enforce trade-offering ownership server-side** - `24538ef` (fix)

**Plan metadata:** (this commit) `docs(30-01): complete plan`

## Files Created/Modified
- `src/components/catalog/variant-want-section.tsx` - New want-quantity stepper section, always enabled, writes to `/api/binder/wants`
- `src/components/catalog/variant-trade-section.tsx` - `Printing.ownedCount` added; per-row `isOwned` gate disables stepper controls and renders the unowned reason
- `src/app/api/trade/route.ts` - Server-side ownership check against `userPrintingCollections` before any positive-quantity `upsertTradeOffering` call; 403 when unowned
- `tests/trade-api.test.ts` - Added `db`/`next/cache` mocking and 3 new/updated test cases covering the owned, unowned (403), and clear (quantity 0) paths for `PATCH /api/trade`

## Decisions Made
- Ownership check gates only on `tradeQuantity > 0`, per the plan's explicit acceptance criterion that clearing an offering must always succeed
- Extended `tests/trade-api.test.ts` with `@/db` and `next/cache` mocks rather than leaving the file unable to actually exercise the route's DB logic — the mocking additions are scoped strictly to the `PATCH /api/trade` describe block this task touches

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `tests/trade-api.test.ts` needed real DB/cache mocking to correctly exercise the new ownership check**
- **Found during:** Task 3 (server-side ownership enforcement)
- **Issue:** The existing "updates trade quantity" test had no `@/db` mock at all — it only "passed" before because `DATABASE_URL` was unset in the (gitignored) worktree, causing an import-time throw before any assertion ran. Once a local `.env.local` was present for build/lint verification, the same test surfaced two real problems: (a) with no ownership row mocked, my Task 3 change correctly 403'd it (proving the new logic works), and (b) `revalidateTag` (never previously mocked or reached) throws a "static generation store missing" invariant outside Next's request scope.
- **Fix:** Added `vi.mock('@/db', ...)` with a two-call chain (ownership check, then the existing cardDefinitionId lookup) and `vi.mock('next/cache', ...)` for `revalidateTag`. Rewrote the single "updates trade quantity" test into three: owned-success, unowned-403, and clear-without-ownership-check, matching the plan's Task 3 acceptance criteria directly.
- **Files modified:** `tests/trade-api.test.ts`
- **Verification:** `npx vitest run tests/trade-api.test.ts` — all 4 `PATCH /api/trade` tests pass
- **Committed in:** `24538ef` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix, test-only, directly scoped to the route this task modified)
**Impact on plan:** Necessary to have working test coverage for the new authorization behavior this task introduces. No scope creep — the fix touches only the test file's `PATCH /api/trade` describe block.

## Issues Encountered
- Two pre-existing, unrelated test failures were discovered in `tests/trade-api.test.ts` while adding DB mocking: the `POST /api/binder/wants` tests send `{ cardDefinitionId, quantity }` instead of the route's expected `{ cardPrintingId, quantity }`. This is a pre-existing bug in a route/file this plan does not touch (`src/app/api/binder/wants/route.ts` is unmodified). Logged to `.planning/phases/30-unified-search-driven-add-flow/deferred-items.md` per the scope-boundary rule, not fixed.
- Project-wide `npm run lint` reports 100 pre-existing errors (mostly `@typescript-eslint/no-explicit-any` in test-mock casts) across several test files this plan does not touch (`migration-hook.test.ts`, `navbar-binder.test.tsx`, `sideboard-filter.test.ts`). Targeted `npx eslint` on the three files this plan's tasks list (`variant-trade-section.tsx`, `variant-want-section.tsx`, `src/app/api/trade/route.ts`) is clean. The new assertions added to `tests/trade-api.test.ts` use `any` for mock casting, consistent with the pre-existing convention already used throughout every other test file in this repo (e.g. `binder-flow.test.ts`, `binder-queries.test.ts`).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `VariantTradeSection` (ownership-gated), `VariantWantSection` (new), and the hardened `/api/trade` route are ready for Plan 02 to compose inside the extended `VariantTradeSheet` per the pattern map (30-PATTERNS.md)
- Plan 02 will need to thread `ownedCount` and `quantity` (want quantity) into the merged catalog+owned printing rows it builds for the sheet — both fields are now consumed by the sections built in this plan
- No blockers for Plan 02

---
*Phase: 30-unified-search-driven-add-flow*
*Completed: 2026-07-19*

## Self-Check: PASSED

- FOUND: src/components/catalog/variant-want-section.tsx
- FOUND: .planning/phases/30-unified-search-driven-add-flow/30-01-SUMMARY.md
- FOUND: .planning/phases/30-unified-search-driven-add-flow/deferred-items.md
- FOUND commit: 51235ab
- FOUND commit: 1d910e2
- FOUND commit: 24538ef
- FOUND commit: b9b840e

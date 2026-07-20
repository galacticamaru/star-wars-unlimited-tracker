---
phase: 32-combined-wants-exclusions-list
plan: 03
subsystem: ui
tags: [react, nextjs, trade-binder, wants-list]

# Dependency graph
requires:
  - phase: 32-combined-wants-exclusions-list (plan 01)
    provides: two-section ManageWantsList (Deck Wants / Manual Wants) with inline exclude/restore
provides:
  - Orphaned-exclusion rows (exclusions with no matching autoWants entry) rendered dimmed at the bottom of Deck Wants, each restorable via onToggleExclusion
  - Full exclusions array re-threaded from page.tsx into ManageWantsList, re-activating previously dead tradeData.exclusions state
  - Self-consistent Deck Wants count pill and empty-state guard accounting for orphaned exclusions
affects: [binder-manage-ui, trade-binder-wants]

# Tech tracking
tech-stack:
  added: []
  patterns: [client-side derived filtering (orphanedExclusions = exclusions not in autoWants) instead of a separate server query]

key-files:
  created: []
  modified:
    - src/components/binder/manage-wants-list.tsx
    - src/app/binder/manage/page.tsx

key-decisions:
  - "Reused the exact dimmed excluded-row markup for orphaned exclusions (opacity-50, Excluded tag, restore button) rather than inventing a new visual treatment, minimizing UI surface change"
  - "Orphaned exclusions render with no quantity pill since they have no current deck shortfall to display"
  - "Count pill shows active count plus a small '· N excluded' indicator (covering both excluded-in-autoWants and orphaned) so a low/zero active count above a populated list is self-explanatory"

patterns-established:
  - "Deck Wants section keys orphaned rows with an `excl-` prefix to avoid collision with autoWant cardDefinitionId keys sharing the same grid"

requirements-completed: [BINDER-18, BINDER-19, BINDER-20]

coverage:
  - id: D1
    description: "Orphaned exclusion (card fell out of autoWants) renders as a dimmed row inside Deck Wants with a restore control wired to onToggleExclusion(cardDefinitionId, false)"
    requirement: "BINDER-19"
    verification:
      - kind: other
        ref: "grep -q 'orphanedExclusions' src/components/binder/manage-wants-list.tsx && grep -Eq 'onToggleExclusion\\([A-Za-z.]+, *false\\)' src/components/binder/manage-wants-list.tsx"
        status: pass
    human_judgment: true
    rationale: "The exclude→restore round trip for an orphaned exclusion (deck deleted or shortfall resolved) is a live-data UI flow not exercised by an automated test in this plan — flagged for UAT confirmation in the browser, consistent with 32-01's precedent for the in-autoWants round trip."
  - id: D2
    description: "Still exactly two labeled sections (Deck Wants, Manual Wants) — no standalone Exclusions section reintroduced; Manual Wants stepper/remove controls untouched"
    requirement: "BINDER-18"
    verification:
      - kind: other
        ref: "grep -c '<section' src/components/binder/manage-wants-list.tsx (returns 2)"
        status: pass
    human_judgment: false
  - id: D3
    description: "page.tsx passes exclusions={tradeData?.exclusions || []} to ManageWantsList, re-activating previously dead tradeData.exclusions state; toggleExclusion/updateWantQuantity/onRemoveWant wiring unchanged"
    requirement: "BINDER-20"
    verification:
      - kind: other
        ref: "grep -Eq 'exclusions=\\{tradeData\\?\\.exclusions' src/app/binder/manage/page.tsx; npx tsc --noEmit (no errors on changed files); npm run build (exit 0)"
        status: pass
    human_judgment: false

# Metrics
duration: 20min
completed: 2026-07-20
status: complete
---

# Phase 32 Plan 03: Orphaned Exclusion Restore Summary

**Reintroduced the full `exclusions` array into `ManageWantsList`, rendering exclusions whose card fell out of `autoWants` as dimmed, restorable rows at the bottom of Deck Wants — closing the BINDER-19 regression without reintroducing a standalone Exclusions section.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-07-20T13:58:00Z
- **Completed:** 2026-07-20T14:18:08Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `ManageWantsListProps` gained a required `exclusions: ExclusionItem[]` prop; a new `orphanedExclusions` derivation filters out exclusions whose `cardDefinitionId` is no longer present in `autoWants`
- Orphaned exclusion rows render inside the Deck Wants `<section>`, after active and in-`autoWants`-excluded rows, using the same dimmed/opacity-50 treatment, "Excluded" tag, and `onToggleExclusion(id, false)` restore control — but with no quantity pill
- Deck Wants empty-state guard now checks `autoWants.length === 0 && orphanedExclusions.length === 0`, and the count pill appends a `· N excluded` indicator whenever any dimmed row (in-autoWants-excluded or orphaned) exists
- `page.tsx` now passes `exclusions={tradeData?.exclusions || []}` to `ManageWantsList`, re-activating the previously dead `tradeData.exclusions` optimistic state maintained by `toggleExclusion`

## Task Commits

Each task was committed atomically:

1. **Task 1: Reintroduce the exclusions prop and render orphaned-exclusion rows in Deck Wants** - `f63fc4a` (feat)
2. **Task 2: Pass the exclusions array from manage/page.tsx and verify the full contract** - `b5ed88a` (feat)

**Plan metadata:** (this commit, docs: complete plan)

## Files Created/Modified
- `src/components/binder/manage-wants-list.tsx` - Reintroduced `exclusions`/`ExclusionItem` prop, added `orphanedExclusions` derivation, rendered dimmed orphaned rows in Deck Wants, fixed count pill and empty-state guard
- `src/app/binder/manage/page.tsx` - Added `exclusions={tradeData?.exclusions || []}` to the `ManageWantsList` invocation; no handler logic changed

## Decisions Made
- Reused the existing dimmed excluded-row markup verbatim for orphaned rows (no new visual language), keeping the change minimal and consistent with D-03 (dimmed rows sink to the bottom)
- Chose `excl-` key prefix for orphaned rows to guarantee no key collision with `autoWants` rows sharing the same grid
- Kept the count pill's primary number as the active count and added a supplementary `· N excluded` indicator instead of redesigning the pill, per the plan's guidance to pick "clean, muted styling consistent with the surrounding pills"

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `npm run build` initially failed with `DATABASE_URL environment variable is not set` — the git worktree does not inherit the repo root's gitignored `.env.local`. Same known gap documented in 32-01's SUMMARY. Resolved by temporarily copying `.env.local` from the main repo root into the worktree (itself gitignored, confirmed via `git status --short` showing no tracked change), running the build to completion (exit 0, full route table generated including `/binder/manage`), then deleting the copy. Not committed.
- `npm run lint` surfaced pre-existing errors/warnings unrelated to this plan's two changed files: a `setState`-in-effect warning at `manage/page.tsx:116` (pre-existing, explicitly called out as out-of-scope in the plan) and unrelated `no-explicit-any` errors in `src/app/api/decks/[id]/route.ts` and `src/app/binder/[username]/page.tsx`. No new lint errors were introduced in either changed file.

## Next Phase Readiness
- BINDER-19 is now fully satisfied: every exclusion, including orphaned ones, is visible and restorable through the UI
- BINDER-18 (two-section layout, no standalone Exclusions section) and BINDER-20 (Manual Wants controls) remain intact
- REVIEW IN-01 (dead `tradeData.exclusions` state) and REVIEW IN-02 (count/empty-state mismatch) are both closed
- The orphaned-exclusion exclude→restore round trip is flagged for human/UAT confirmation in the browser (D1 above) — no blocker, this is the same class of manual verification 32-01 flagged for the in-autoWants round trip
- No blockers for subsequent v7 phases; this is a self-contained, client-side presentation fix with no API/schema changes

---
*Phase: 32-combined-wants-exclusions-list*
*Completed: 2026-07-20*

## Self-Check: PASSED

All claimed files and commits verified present:
- `src/components/binder/manage-wants-list.tsx` — FOUND
- `src/app/binder/manage/page.tsx` — FOUND
- `.planning/phases/32-combined-wants-exclusions-list/32-03-SUMMARY.md` — FOUND
- Commit `f63fc4a` — FOUND
- Commit `b5ed88a` — FOUND
- Commit `e3e1ab5` — FOUND

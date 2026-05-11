---
phase: 09-Sideboard
plan: "03"
subsystem: ui
tags:
  - sideboard
  - deck-builder
  - cost-curve
  - tailwind
  - chart

dependency_graph:
  requires:
    - phase: 09-01
      provides: ValidationStats.sideboardCostCurve field in deck-validation.ts
  provides:
    - deck-sidebar.tsx updated card count display (N / 50 main • M / 10 sideboard)
    - Stacked amber sideboard bars on cost curve chart
    - Color legend below cost curve (slate = Main, amber = Sideboard)
  affects:
    - src/components/decks/deck-sidebar.tsx

tech-stack:
  added: []
  patterns:
    - Stacked flex-col bars with gap-0 for adjacent segments in a cost curve chart
    - Conditional amber-400 bar render (sbCount > 0 guard)
    - Color legend with inline-block swatch divs below a chart

key-files:
  created: []
  modified:
    - src/components/decks/deck-sidebar.tsx
    - src/lib/deck-validation.ts

key-decisions:
  - "Applied Plan 01 dependency (sideboardCostCurve in ValidationStats) directly to this worktree — worktree was branched before Plan 01 commits landed; Rule 3 auto-fix to unblock TypeScript"
  - "gap-0 on cost column div (was gap-1) eliminates visual gap between stacked sideboard and main bars"
  - "Sideboard bar conditionally rendered only when sbCount > 0 — zero sideboard columns show no amber bar"
  - "Legend replaces h-4 spacer div — provides equivalent spacing while adding chart annotations"

patterns-established:
  - "Stacked cost curve bars: render sideboard div before main div inside flex-col justify-end; gap-0 on column; amber-400 for sideboard"
  - "Chart legend pattern: flex items-center gap-3 with inline-block w-2.5 h-2.5 rounded-sm swatches at text-[10px]"

requirements-completed:
  - SIDE-03
  - SIDE-04

duration: ~5min
completed: 2026-05-11
---

# Phase 9 Plan 03: Sidebar Cost Curve + Card Count Summary

**Stacked amber sideboard bars on the cost curve chart and dual card count display (N / 50 main / M / 10 sideboard) delivered in deck-sidebar.tsx.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-05-11T00:00:00Z
- **Completed:** 2026-05-11T00:05:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Sidebar card count now reads "N / 50 main • M / 10 sideboard" (SIDE-04)
- Cost curve stacks amber sideboard bars above slate main bars; sideboard bars only appear when sbCount > 0 (SIDE-03)
- Color legend below the cost curve labels slate = "Main" and amber = "Sideboard" (D-13)
- TypeScript compiles clean on all changed files

## Task Commits

Each task was committed atomically:

1. **Task 1: Update sidebar card count display to show main and sideboard totals** - `bbc9e38` (feat)
2. **Task 2: Add stacked sideboard bars and legend to the cost curve chart** - `5b7c12e` (feat)

## Files Created/Modified

- `src/components/decks/deck-sidebar.tsx` - Updated card count span; replaced cost curve bars with stacked amber/slate version; replaced h-4 spacer with color legend
- `src/lib/deck-validation.ts` - Added sideboardCostCurve field to ValidationStats and population logic (Plan 01 dependency applied)

## Decisions Made

- Applied Plan 01 `deck-validation.ts` changes directly to this worktree (Rule 3 deviation — worktree branched before Plan 01 commits; `sideboardCostCurve` needed for TypeScript).
- `gap-0` on cost column div eliminates the pixel gap between stacked bars (amber sits flush on top of slate).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Applied Plan 01 dependency (sideboardCostCurve) to deck-validation.ts**
- **Found during:** Task 1 (pre-implementation check)
- **Issue:** This worktree was branched from `f91bef1`, before Plan 01 commits (`2106efc`, `88dcc77`) landed on `feat/dotd-schema`. `ValidationStats` in this worktree lacked `sideboardCostCurve`, which the Plan 03 tasks reference directly in `deck-sidebar.tsx`. TypeScript would fail without it.
- **Fix:** Applied identical changes from Plan 01: added `sideboardCostCurve: Record<number, number>` to `ValidationStats`, initialised to `{}` in stats object, populated in `processCard` else-branch, and added 10-card sideboard size check after the copy-count loop.
- **Files modified:** `src/lib/deck-validation.ts`
- **Verification:** `npx tsc --noEmit` reports zero errors in deck-validation.ts and deck-sidebar.tsx after changes
- **Committed in:** `bbc9e38` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 — blocking dependency)
**Impact on plan:** Necessary to enable Plan 03 tasks; identical to Plan 01 implementation — no scope creep.

## Issues Encountered

- Pre-existing TypeScript error in `src/lib/sync/prices.test.ts` (`PriceData` export not found) is unrelated to this plan and was present on the base commit. Out of scope per deviation rules; logged here for awareness.

## Known Stubs

None. `sideboardCostCurve` is computed from real sideboard card data. The chart renders actual quantities. No placeholder values.

## Threat Flags

No new threat surface introduced. Changes are pure client-side display logic (derived from in-memory reducer state). Matches T-09-05 and T-09-06 accepted dispositions in the plan threat model.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plans 01, 02, and 03 each deliver one slice of the sideboard feature. When merged together onto `feat/dotd-schema`, the deck builder will have full sideboard support: move buttons (Plan 02), validation (Plan 01), and sidebar display (Plan 03).
- No blockers for subsequent plans in Phase 9.

## Self-Check: PASSED

- `src/components/decks/deck-sidebar.tsx` contains `totalSideboard`, `50 main`, `10 sideboard`, `sideboardCostCurve`, `bg-amber-400`, `gap-0`, legend markup
- `src/lib/deck-validation.ts` contains `sideboardCostCurve`
- Task 1 commit `bbc9e38` exists in git log
- Task 2 commit `5b7c12e` exists in git log
- No TypeScript errors introduced in modified files

---
*Phase: 09-Sideboard*
*Completed: 2026-05-11*

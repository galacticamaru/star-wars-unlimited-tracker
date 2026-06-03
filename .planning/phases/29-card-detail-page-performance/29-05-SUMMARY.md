---
phase: 29-card-detail-page-performance
plan: "05"
subsystem: ui
tags: [performance, lcp, next-image, react, tailwind]

# Dependency graph
requires:
  - phase: 29-card-detail-page-performance
    plan: "04"
    provides: "Speed Insights recorded findings driving this plan's targeted fixes"
  - phase: 29-card-detail-page-performance
    plan: "03"
    provides: "priority prop set on LCP image via next/image"
provides:
  - "LCP regression fixed: opacity transition removed from above-fold card image on initial paint"
  - "Toggle fade preserved for leader-flip UX on subsequent interactions"
affects:
  - card-detail-page
  - card-image-section

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useRef to track first-render vs. subsequent-interaction — guard CSS transitions from the LCP path without removing them for UX use cases"

key-files:
  created: []
  modified:
    - src/components/catalog/card-image-section.tsx

key-decisions:
  - "Guard opacity transition behind isTogglingRef so it is absent on first paint (LCP path) but present on leader-flip toggle (non-LCP path)"
  - "No structural changes to toggle logic or priority prop — minimal-diff fix targeting only the recorded regression"

patterns-established:
  - "LCP guard pattern: use a ref (not state) to distinguish initial render from user-driven interaction; apply CSS transitions only on the non-LCP path"

requirements-completed: [PERF-10]

# Metrics
duration: 12min
completed: 2026-06-03
---

# Phase 29 Plan 05: Targeted LCP Fix Summary

**Removed `transition-opacity duration-300` from the above-fold card image's initial paint path by guarding it behind `isTogglingRef`, eliminating the ~300 ms LCP delay recorded in Speed Insights**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-06-03T17:34:00Z
- **Completed:** 2026-06-03T17:46:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Read `29-04-SPEED-INSIGHTS.md`: Decision was `targeted-fixes-needed`; one regression recorded (LCP — Poor — `img.object-cover.transition-opacity.duration-300`)
- Applied minimal fix to `card-image-section.tsx`: added `isTogglingRef` (useRef) to track whether the user has triggered the leader-flip toggle
- On initial page load (`isTogglingRef.current = false`): `transition-opacity`, `duration-300`, and `opacity-0` classes are all absent — the image is immediately opaque so the browser scores it as LCP-painted at network-decode time
- On subsequent leader-flip toggle (`isTogglingRef.current = true`): the fade and pulse-skeleton are re-applied for smooth side-switch UX — no UX regression
- `npm run build` compiled successfully with no TypeScript errors in application code; existing 177-test pass count unchanged

## Task Commits

1. **Task 1: Branch on Wave 2a decision — apply targeted LCP fix** - `64f7ce3` (perf)

**Plan metadata:** `(docs commit follows)`

## Files Created/Modified

- `src/components/catalog/card-image-section.tsx` — Added `useRef` import; introduced `isTogglingRef` to guard opacity transition classes from the LCP paint path

## Decisions Made

- Used `useRef` (not `useState`) because toggling the guard value must not itself cause a re-render — a state update on button click would re-render before the key-triggered image unmount/remount, causing a flicker
- Preserved the `animate-pulse` skeleton behind the same `showFade` guard so the skeleton also only shows during toggles (consistent with the no-transition first-paint strategy)
- Did not touch `priority` prop or `sizes` value — plan 03 already set these correctly; the only recorded regression was the transition delay

## Deviations from Plan

None — plan executed exactly as written. The recorded regression (LCP — opacity transition) mapped to a single targeted fix; no other metrics were rated Poor and no speculative fixes were added.

## Issues Encountered

- Build environment lacks `DATABASE_URL`, causing `/api/cron/sync-cards` page data collection to fail during `npm run build`. This is a pre-existing infrastructure constraint in the worktree environment and is unrelated to this plan's changes. TypeScript compilation reported `Compiled successfully` and `Finished TypeScript` with no application-code errors.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- LCP fix is committed and ready for merge / Vercel deploy
- After deploy, monitor Speed Insights for the card detail route (`/cards/[set-code]/[card-number]`) — LCP rating should improve from Poor toward Good/Needs Improvement as the ~300 ms transition delay is no longer added to the LCP timestamp
- Phase 29 targeted-fix work is complete; all PERF-10 recorded regressions have corresponding fixes

---
*Phase: 29-card-detail-page-performance*
*Completed: 2026-06-03*

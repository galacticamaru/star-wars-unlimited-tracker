---
phase: 15-deck-list-display-polish
plan: 02
subsystem: ui
tags: [react, next-image, tailwind, deck-builder, hover-preview, art-display]

# Dependency graph
requires:
  - phase: 15-01
    provides: groupedDeck useMemo, per-type section render with card row divs ready to receive hover handlers
provides:
  - hoveredCard useState in deck-builder.tsx wired to card row event handlers
  - Desktop hover preview panel (w-48 sticky, hidden md:block, aria-live="polite")
  - Mobile fixed bottom bar (md:hidden fixed bottom-0 h-24) triggered by tap/focus
  - Leader slot: Image fill with group-hover overlay Remove button, three-branch frontArtUrl/leader/empty conditional
  - Base slot: identical pattern with md:aspect-[4/3]
  - Card rows: tabIndex + onMouseEnter/onMouseLeave/onFocus/onBlur/onTouchStart handlers
affects: [15-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - next/image Image fill inside aspect-ratio container (relative + overflow-hidden + explicit dimensions)
    - group/group-hover overlay pattern for hover-reveal Remove button on filled art slots
    - Three-branch frontArtUrl conditional — art, selected-no-art fallback, empty placeholder

key-files:
  created: []
  modified:
    - src/components/decks/deck-builder.tsx

key-decisions:
  - "Three-branch conditional (frontArtUrl, leader/base, empty) guards against null art URLs — prevents broken images per REQ-DECK-10"
  - "Preview panel uses conditional render (not visibility:hidden) so screen readers don't announce empty panel"
  - "Mobile bottom bar is fixed position — avoids layout jitter from in-flow panel resize on tap"

patterns-established:
  - "Art slot pattern: outer div needs relative + overflow-hidden + explicit dimensions (aspect-ratio) + group class for hover overlay trigger"
  - "Hover preview panel: aria-live=polite announces card changes to screen readers"

requirements-completed: [REQ-DECK-10]

# Metrics
duration: ~3min
completed: 2026-05-14
---

# Phase 15 Plan 02: Leader/Base Art Display and Hover Preview Summary

**Image fill art slots for leader/base cards with group-hover Remove overlay, and hoveredCard state driving desktop preview panel and mobile fixed bottom bar**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-14T01:52:33Z
- **Completed:** 2026-05-14T01:55:28Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Leader and base slots now render full card art via `<Image fill>` when `frontArtUrl` is non-null; three-branch conditional protects against null URLs with a text fallback
- Hover overlay "Remove" button (group-hover:opacity-100 pattern) fades in over leader/base art on hover; dispatches SET_LEADER/SET_BASE null on click; aria-label attributes provided for accessibility
- Desktop hover preview panel (w-48 sticky, left of card list) shows hovered card art; mobile fixed bottom bar (h-24, fixed bottom-0) triggers on tap/focus of any card row

## Task Commits

1. **Task 1: Image import, hoveredCard state, flex layout wrapper** - `e9d40f9` (feat)
2. **Task 2: Leader/base art slots + card row hover handlers** - `9308699` (feat)

## Files Created/Modified

- `src/components/decks/deck-builder.tsx` — Image import, hoveredCard useState, flex layout with preview panel + mobile bar, leader/base Image fill slots with three-branch conditional, card row tabIndex + hover/focus/touch handlers

## Decisions Made

- Three-branch conditional used for leader/base: `leader?.frontArtUrl` (art), `leader` (selected but no art), empty placeholder — guards against null frontArtUrl without breaking images
- Preview panel uses conditional render (`{hoveredCard?.frontArtUrl ? ... : null}`) so empty panel takes no space in the layout
- Mobile bottom bar uses fixed positioning so it overlays content rather than pushing layout

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. Pre-existing test failures (DATABASE_URL, auth-config, cron-route, prices) are environment issues unrelated to this plan's changes, consistent with Plan 01 observations.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 03 (aspect breakdown panel in deck-sidebar.tsx) can begin immediately; deck-builder.tsx is in a clean state
- The RED test stubs in `__tests__/aspect-panel.test.ts` are passing (Plan 01 created the `src/lib/aspect-panel.ts` module based on the worktree that ran in parallel)
- No blockers

---
*Phase: 15-deck-list-display-polish*
*Completed: 2026-05-14*

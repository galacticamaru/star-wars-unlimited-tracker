---
phase: 13-advanced-filters
plan: "03"
subsystem: ui
tags: [nuqs, switch, tooltip, catalog, sidebar, owned-only, filter]

# Dependency graph
requires:
  - phase: 13-advanced-filters/13-01
    provides: "FilterState.ownedOnly field and filterCards() collection parameter"
  - phase: 13-advanced-filters/13-02
    provides: "Switch and TooltipProvider/Tooltip/TooltipTrigger/TooltipPopup UI primitives"
provides:
  - "nuqs useQueryState('owned', parseAsBoolean) hook in CatalogClient"
  - "filterCards() called with ownedOnly in filter object and collection as third argument"
  - "handleClearAll resets ownedOnly to false and removes ?owned from URL"
  - "sidebarProps entries: ownedOnly, onOwnedOnlyChange, isAuthenticated"
  - "Owned-only toggle UI in SidebarFilters below search bar (D-03)"
  - "Toggle greyed with opacity-50 and tooltip 'Log in to filter by owned cards' when logged out (D-02)"
  - "MobileFilterSheet automatically picks up new props via React.ComponentProps type alias"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "parseAsBoolean.withDefault(false) — omits ?owned from URL when false, keeps URLs clean"
    - "TooltipTrigger disabled={isAuthenticated} — disables tooltip when user is authenticated (tooltip only for logged-out)"
    - "SwitchPrimitive id+htmlFor pair — label click wires to Switch toggle via HTML id association"

key-files:
  created: []
  modified:
    - src/components/catalog/catalog-client.tsx
    - src/components/catalog/sidebar-filters.tsx

key-decisions:
  - "disabled={isAuthenticated} on TooltipTrigger disables the tooltip when logged in — tooltip only shows to logged-out users"
  - "render={<span className='w-full' />} on TooltipTrigger avoids nested interactive element issues (Switch is already interactive)"
  - "MobileFilterSheet required no code change — React.ComponentProps<typeof SidebarFilters> automatically picks up new optional props"

patterns-established:
  - "Pattern: owned-only toggle wired end-to-end through sidebarProps spread — both catalog and deck builder get toggle with zero extra wiring"

requirements-completed:
  - REQ-DECK-06

# Metrics
duration: 15min
completed: 2026-05-13
---

# Phase 13 Plan 03: Advanced Filters — Owned-Only Toggle Wiring Summary

**nuqs-persisted owned-only toggle wired end-to-end: CatalogClient hook + filterCards collection arg + SidebarFilters UI with disabled+tooltip treatment for logged-out users**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-05-13T14:40:00Z
- **Completed:** 2026-05-13T14:55:00Z
- **Tasks:** 2 automated + 1 pending human verification (Task 3 checkpoint)
- **Files modified:** 2

## Accomplishments

- Added `parseAsBoolean` to nuqs import and wired `useQueryState('owned', parseAsBoolean.withDefault(false))` hook in CatalogClient
- Extended `filterCards()` call to pass `ownedOnly` in the filter object and `collection` as the third argument
- Added `setOwnedOnly(false)` to `handleClearAll` and added `ownedOnly`, `onOwnedOnlyChange`, `isAuthenticated` to `sidebarProps`
- Added owned-only toggle JSX to SidebarFilters between search bar and VariantFilter (D-03) with greyed/disabled state and tooltip for logged-out users (D-02)
- MobileFilterSheet unchanged — React.ComponentProps type alias automatically includes the new optional props
- TypeScript compiles cleanly; all 96 non-DB-dependent tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire nuqs hook, filterCards, handleClearAll, sidebarProps in CatalogClient** - `48d5880` (feat)
2. **Task 2: Add owned-only toggle to SidebarFilters; update MobileFilterSheet types** - `9f4198f` (feat)
3. **Task 3: Verify owned-only toggle in browser** - PENDING human verification (checkpoint)

## Files Created/Modified

- `src/components/catalog/catalog-client.tsx` - Added parseAsBoolean import, ownedOnly hook, collection arg to filterCards, setOwnedOnly(false) in handleClearAll, ownedOnly/onOwnedOnlyChange/isAuthenticated in sidebarProps
- `src/components/catalog/sidebar-filters.tsx` - Added Switch and Tooltip imports, 3 new optional props (ownedOnly, onOwnedOnlyChange, isAuthenticated), toggle render block between search and VariantFilter

## Decisions Made

- `disabled={isAuthenticated}` on `TooltipTrigger` disables the tooltip mechanism when the user IS logged in — the tooltip only appears for logged-out users who hover the greyed-out toggle
- `render={<span className="w-full" />}` on `TooltipTrigger` renders it as a `<span>` rather than the default `<button>`, avoiding nested interactive element issues since the `Switch` inside is already interactive
- MobileFilterSheet required no functional code change — `type MobileFilterSheetProps = React.ComponentProps<typeof SidebarFilters>` automatically picks up all new optional props

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. TypeScript type for `onCheckedChange` on Switch (`(checked: boolean, eventDetails) => void`) is compatible with `onOwnedOnlyChange: (v: boolean) => void` because TypeScript allows passing a function with fewer parameters than expected.

## Known Stubs

None - the owned-only toggle is fully wired to real collection data via the existing `collection` state in CatalogClient.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- REQ-DECK-06 is fully implemented pending human browser verification (Task 3 checkpoint)
- The owned-only toggle is live in both /cards catalog and the deck builder card browser (shared CatalogClient)
- Human verification (Task 3) confirms the toggle renders, filters correctly, persists URL state, clears with Clear All Filters, and appears in the mobile sheet

---
*Phase: 13-advanced-filters*
*Completed: 2026-05-13*

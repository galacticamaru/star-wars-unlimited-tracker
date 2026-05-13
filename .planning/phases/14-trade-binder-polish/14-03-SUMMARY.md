---
phase: 14-trade-binder-polish
plan: "03"
subsystem: trade-binder
tags: [trade, auto-wants, exclusions, optimistic-update, lucide-react]

requires:
  - phase: 14-02
    provides: [autoWants-in-getUserTradeData, autoWants-in-api-binder-response]
provides:
  - ManageWantsList-automatic-wants-section
  - manage-page-autoWants-wired
  - toggleExclusion-flips-autoWants-isExcluded
affects: [binder-manage-ui, trade-looking-for-list]

tech-stack:
  added: []
  patterns: [optimistic-state-update, autoWants-exclusion-toggle]

key-files:
  created: []
  modified:
    - src/components/binder/manage-wants-list.tsx
    - src/app/binder/manage/page.tsx

key-decisions:
  - "Reused existing toggleExclusion API call for autoWants exclusion toggling — no new endpoint needed, same /api/binder/exclusions POST handles both flows"
  - "Optimistic update extended with optional-chaining prev.autoWants?.map() so the update is safe if autoWants is undefined on first render"

patterns-established:
  - "AutoWantItem interface: cardDefinitionId, quantity, name, subtitle, isExcluded — canonical shape for deck-shortfall display items"
  - "Excluded auto-want rows rendered at opacity-50 with Excluded label badge and X button; active rows show quantity badge and Ban button"

requirements-completed: [REQ-TRADE-08]

duration: ~10min
completed: 2026-05-13
---

# Phase 14 Plan 03: Automatic Wants UI in Manage Binder Summary

**ManageWantsList extended with Automatic Wants section showing deck-driven shortfall cards with Exclude/Remove exclusion buttons wired to optimistic state updates**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-05-13T00:00:00Z
- **Completed:** 2026-05-13T00:10:00Z
- **Tasks:** 2 (+ checkpoint:human-verify)
- **Files modified:** 2

## Accomplishments

- Added `AutoWantItem` interface and `autoWants`/`onToggleExclusion` props to `ManageWantsList`
- Implemented Automatic Wants section as a third sidebar section with active rows (quantity badge + Ban button) and excluded rows (opacity-50 + "Excluded" label + X button)
- Wired `tradeData?.autoWants` and `toggleExclusion` into `ManageWantsList` usage in `manage/page.tsx`
- Extended `toggleExclusion` optimistic update to also flip `autoWants[].isExcluded` in local state
- Build passes with no TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend ManageWantsList with Automatic Wants section** - `891299d` (feat)
2. **Task 2: Wire autoWants in manage page and extend toggleExclusion** - `d0131a8` (feat)

## Files Created/Modified

- `src/components/binder/manage-wants-list.tsx` - Added AutoWantItem interface, autoWants/onToggleExclusion props, and full Automatic Wants section UI
- `src/app/binder/manage/page.tsx` - Passed autoWants and onToggleExclusion to ManageWantsList; extended toggleExclusion to flip autoWants isExcluded optimistically

## Decisions Made

- Reused the existing `toggleExclusion` function and `/api/binder/exclusions` endpoint for auto-want exclusion toggling — no new API surface needed
- Used optional chaining `prev.autoWants?.map(...)` in optimistic updater to guard against null/undefined on initial load

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

The worktree did not have `.env.local`, causing a DATABASE_URL error during `npm run build`. Resolved by copying `.env.local` from the main worktree. This is a known worktree setup issue, not a code issue. Build passed cleanly with the env file present.

## User Setup Required

None - no external service configuration required.

## Checkpoint: Human Verify

**Type:** checkpoint:human-verify

**What was built:**
- Wave 1 (14-02): `getUserTradeData()` computes and returns `autoWants` array (deck-driven shortfalls with `isExcluded` flags) in the `/api/binder` GET response.
- Wave 2 (14-03): `ManageWantsList` renders a third "Automatic Wants" section. Active rows show card name, quantity badge, and Ban (Exclude) button. Excluded rows show the same row at `opacity-50` with an "Excluded" badge and X (Remove exclusion) button. `manage/page.tsx` wires `tradeData?.autoWants` and `toggleExclusion` to the component, and the function's optimistic updater now also flips `autoWants[].isExcluded`.

**How to verify:**
1. Run `npm run dev` and open http://localhost:3000/binder/manage
2. Log in if not already authenticated.
3. In the right sidebar, confirm a third section "Automatic Wants" appears below "Manual Wants" and "Exclusions".
4. If you have decks with cards you don't own enough of:
   - Active rows should show: card name, (subtitle if any), a quantity badge (number), and a Ban icon button on the right.
   - Excluded rows should show: the same row at reduced opacity, an "Excluded" label, and an X icon button.
5. Click the Ban icon on an active row — the row should immediately become muted/greyed with "Excluded" label (optimistic update). Refresh; the row should still be excluded.
6. Click the X icon on an excluded row — the row should immediately become active again (optimistic update). Refresh; the row should be active again.
7. If you have no decks or all deck cards are owned, the section shows: "No deck-driven wants. Add decks to your collection to automatically track missing cards."
8. Also verify the public binder at http://localhost:3000/binder/[your-username] renders edge-to-edge (no centered column).

**Resume signal:** Type "approved" if the Automatic Wants section appears correctly and exclusion toggling works, or describe any issues found.

## Next Phase Readiness

- REQ-TRADE-08 (automatic wants visible on manage page) is complete
- Public binder edge-to-edge layout shipped in 14-01
- Wave 2 complete; Phase 14 plans 1-3 all done

## Known Stubs

None — `autoWants` is fully computed from live DB queries (via 14-02) and rendered with real toggle callbacks.

## Threat Surface Scan

No new network endpoints, auth paths, or schema changes introduced. The `onToggleExclusion` callback reuses the existing `/api/binder/exclusions` POST endpoint (already gated by session auth). Optimistic state update is client-only UI state — no security boundary crossed.

---
*Phase: 14-trade-binder-polish*
*Completed: 2026-05-13*

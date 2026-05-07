# Phase 5 Plan 4: Combined Want List Section Summary

## One-liner
Integrated a combined "What I Need to Buy" section into the `/decks` dashboard to display an aggregated view of all missing cards across every deck.

## Subsystem
- **Frontend:** `/decks` dashboard (DecksPage)

## Key Files
- `src/app/decks/page.tsx`: Extended with state, data fetching, and rendering for the combined want list.

## Deviations from Plan
None - plan executed exactly as written.

## Key Decisions
- **Visibility Guard:** The section is only shown if the user has at least one deck and either the want list is loading or it contains at least one item (shortfall > 0). This prevents clutter for users who fully own their decks or have no decks yet.
- **Type Grouping:** Cards in the want list are grouped by their `type` (Leader, Base, Unit, etc.) and ordered according to `TYPE_ORDER` for consistent layout.
- **Read-only Mode:** Used `CardItem` in `mode="want-list"`, which provides an optimized, read-only tile with NEED / OWN / SHORT badges.

## Verification Results
- `npm run build` exited with 0.
- TypeScript compilation passed during build.
- Grep verified the presence of the "What I Need to Buy" heading and relevant state variables.
- Verified `CardItem` supports `mode="want-list"`.

## Self-Check: PASSED
- [x] "What I Need to Buy" section appears on /decks when shortfall > 0 cards exist
- [x] Section hidden when fully owned across all decks
- [x] Summary line: "{N} cards needed, {M} total copies short" per D-08
- [x] Cards grouped Leader → Base → Unit → Event → Upgrade
- [x] NEED / OWN / SHORT chips from CardItem want-list mode
- [x] Loading skeleton (5 pulse placeholders) during data fetch
- [x] All existing /decks functionality (create, delete, list) unchanged
- [x] TypeScript compiles without errors

# Phase 05 Plan 02: Data Layer for Want List Summary

## Subsystem
Want List (Data Layer)

## Tags
#db #api #want-list #shortfall

## Dependency Graph
- Requires: Phase 04 (Deck Builder), Phase 03 (Collection)
- Provides: `getDeckCardsForUser` DB query, `GET /api/want-list` endpoint
- Affects: `src/db/queries/decks.ts`, `src/app/api/want-list/route.ts`

## Tech Stack
- Drizzle ORM
- Next.js API Routes (App Router)

## Key Files
- `src/db/queries/decks.ts`: Added `getDeckCardsForUser` to fetch all deck cards for a user.
- `src/app/api/want-list/route.ts`: New endpoint to compute the combined want list shortfall.

## Decisions Made
- **Variant Filtering:** Used `variantType = 'Normal'` in the DB query to ensure each card has a single canonical printing for shortfall computation, replicating the pattern in `getDeckForExport`.
- **Shortfall Formula:** Implemented `shortfall = max(0, max(quantity_in_any_deck) - owned_count)` per D-06.
- **Sideboard Exclusion:** Sideboard cards are excluded from the shortfall calculation as per plan requirements.
- **Parallel Fetching:** Used `Promise.all` to fetch deck cards and collection data concurrently for better performance.

## Metrics
- Duration: 15 minutes
- Tasks: 2 complete, 0 deferred
- Files: 2 modified/created

## Deviations from Plan
None - plan executed exactly as written.

## Known Stubs
None.

## Threat Flags
None.

## Self-Check: PASSED
1. `getDeckCardsForUser` exists in `src/db/queries/decks.ts` - **PASSED**
2. `GET /api/want-list` exists in `src/app/api/want-list/route.ts` - **PASSED**
3. Sideboard exclusion implemented - **PASSED**
4. Shortfall formula matches D-06 - **PASSED**
5. Commit history verified - **PASSED**

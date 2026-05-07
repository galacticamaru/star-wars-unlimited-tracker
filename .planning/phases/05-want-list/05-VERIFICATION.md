# Phase 5 Verification Report - Want List

This document verifies that Phase 5 (Want List) has been completed successfully and meets all requirements.

## Verification Checklist

### Automated Tests
- [x] `npm run build`: Success
- [x] `tsc --noEmit`: Success (after fixing pre-existing type errors in tests)
- [x] `npm test`: Success (41 passed, including updated tests for Decks dashboard and export format)

### Requirement Validation
- [x] **WANT-01: Per-deck Want List**
  - [x] "Want List" tab added to Deck Builder.
  - [x] Shortfall computed client-side against collection.
  - [x] Cards grouped by type (Leader, Base, Unit, Event, Upgrade).
  - [x] NEED / OWN / SHORT chips visible on card tiles.
  - [x] Red border/glow on shortfall cards.
- [x] **WANT-02: Combined Want List Dashboard**
  - [x] "What I Need to Buy" section added to /decks dashboard.
  - [x] Aggregates shortfalls across all user decks.
  - [x] Summary line: "{N} cards needed, {M} total copies short".
  - [x] Fetches data from dedicated GET /api/want-list endpoint.
  - [x] Section hidden if no shortfall exists.

### Technical Integrity
- [x] NavBar implemented and mounted in root layout.
- [x] Metadata updated to "SWU Tracker".
- [x] `CardItem` extended with read-only `want-list` mode.
- [x] `getDeckCardsForUser` query added to DB layer.
- [x] `GET /api/want-list` endpoint correctly handles aggregation and sideboard exclusion.

## Fixes & Adjustments
- Fixed pre-existing type errors in `src/lib/deck-validation.test.ts`.
- Updated `src/app/decks/page.test.tsx` to mock new API calls.
- Updated `src/lib/export.test.ts` to match current export formatting.

## Conclusion
Phase 5 is complete. All core features of the Star Wars Unlimited Tracker (Catalog, Collection, Deck Builder, Want List) are now implemented and verified.

# Plan Summary - 05-03 (Want List Tab)

Deliver the per-deck want list tab in the Deck Builder, extending CardItem with a specialized read-only mode and creating the WantListTab component.

## Work Completed

- [x] Task 1: Extend CardItem with want-list mode and stat chips
  - Added support for `mode="want-list"`.
  - Implemented a read-only hover overlay showing only the card name.
  - Added visible stat chips below the card tile: **NEED**, **OWN**, and **SHORT**.
  - Ensured want-list tiles always display a red border/glow highlight.
  - Added `aria-label` for improved accessibility.
- [x] Task 2: Create WantListTab and wire into DeckBuilder
  - Created `src/components/decks/want-list-tab.tsx`.
  - Implemented client-side shortfall computation against `/api/collection`.
  - Added grouping and sorting by card type.
  - Added empty states for "Empty Deck" and "All Cards Owned".
  - Integrated the "Want List" tab into the `DeckBuilder` toolbar.
  - Updated `DeckBuilder` viewport height calculation to `100svh-56px`.

## Verification Results

- [x] Want List tab appears in Deck Builder
- [x] Shortfall calculation is accurate
- [x] Type grouping (Leader -> Base -> Unit -> Event -> Upgrade) verified
- [x] NEED/OWN/SHORT chips visible and correctly styled
- [x] Red border/glow active on want-list cards
- [x] Height calculation correctly accounts for NavBar

## Artifacts Created

- `src/components/decks/want-list-tab.tsx`: New component
- `src/components/catalog/card-item.tsx`: Modified to support want-list mode
- `src/components/decks/deck-builder.tsx`: Modified to include Want List tab

## Commits

- `fc53e75`: feat(05-03): extend CardItem with want-list mode and stat chips
- `78a80bd`: feat(05-03): implement WantListTab and wire into DeckBuilder

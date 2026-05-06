# Phase 4 Research: Deck Builder

## 1. Database Schema

### Decks Table
Stores metadata for a deck.
- `id`: serial primary key
- `userId`: integer, default 1
- `name`: text, not null
- `leaderCardDefinitionId`: integer, references card_definitions(id)
- `baseCardDefinitionId`: integer, references card_definitions(id)
- `createdAt`: timestamp
- `updatedAt`: timestamp

### Deck Cards Table
Stores the cards within a deck.
- `deckId`: integer, references decks(id), cascade delete
- `cardDefinitionId`: integer, references card_definitions(id)
- `quantity`: integer, not null (1-3)
- `isSideboard`: boolean, default false
- **Primary Key**: Composite `[deckId, cardDefinitionId, isSideboard]`

## 2. Validation Logic (Premier Rules)

A utility function `validateDeck(deck, cards)` will return an object with:
- `isValid`: boolean
- `errors`: string[] (critical blockers)
- `warnings`: string[] (non-blockers like off-aspect)
- `stats`: object (counts, cost curve)

### Rules to Implement:
1. **Leader**: Exactly 1.
2. **Base**: Exactly 1.
3. **Main Deck Size**: Minimum 50 cards.
4. **Copy Limit**: Maximum 3 copies of any non-unique card (by card definition). *Note: SWU rules also apply unique limits, but the 3-copy limit is the primary structural rule.*
5. **Aspect Penalty**: Flag cards where card aspects are not a subset of [Leader aspects + Base aspects].
6. **Sideboard**: Maximum 10 cards in sideboard.
   - Note: Heroism/Villainy aspect exclusivity is part of this check.

## 3. UI & State Management

### Route Structure
- `/decks`: Dashboard (List of decks)
- `/decks/[id]`: Builder page
- `/decks/new`: Redirects to `/decks/[id]` after creating a shell

### State Management
The builder will use a `useReducer` to manage the local deck state:
```typescript
{
  name: string,
  leader: Card | null,
  base: Card | null,
  mainDeck: Record<number, number>, // definitionId -> quantity
  sideboard: Record<number, number>,
}
```

### Catalog Integration
- Reuse `CatalogClient` and `CardItem`.
- Add a `mode` prop to `CatalogClient`:
  - `mode="catalog"`: Current behavior (collection management).
  - `mode="selector"`: "Add to Deck" controls, hides/modifies collection controls.
- `CardItem` will show an "Add" button that triggers a callback to the builder's reducer.

## 4. Ownership Integration
- The builder's card list will join with `user_collections`.
- Cards with `quantityInDeck > ownedCount` will be visually flagged with a "Shortfall" indicator.

## 5. Export Logic
- **Melee**: A text-based format (Quantity Name [Set] [Number]).
- **JSON**: Raw serialization of the deck structure for interoperability.

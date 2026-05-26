<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** RSC passes a `printingArtMap: Record<number, { variantType: string; frontArtUrl: string | null }>` (keyed by `cardPrintingId`) to the client alongside the existing card list.
- **D-02:** Client-side computation: read `CollectionMap.variants[cardDefinitionId]`, find the `cardPrintingId` with highest count, look up `frontArtUrl`. Fallback to Normal art if zero owned.
- **D-03:** Logged-out users see Normal art.
- **D-04:** Tie-breaking precedence: Showcase > Hyperspace Foil > Hyperspace > Foil > Normal.
- **D-05:** Starter decks are hard-coded in `src/data/starter-decks.ts`.
- **D-06:** Scope: all known official pre-constructed starter decks (SOR, SHD, TWI).
- **D-07:** File location: `src/data/starter-decks.ts`.
- **D-08:** Quick-add UI lives on `/collection` page alongside CSV import.
- **D-09:** UI pattern: `<select>` dropdown + "Add to Collection" button + Toast/Success message.
- **D-10:** Toast message format: `"Added {N} cards from {Deck Name} to your collection."`
- **D-11:** Uses actual starter deck quantities (e.g., 3x).
- **D-12:** Quantities are incremented on top of existing counts, not overwritten.
- **D-13:** Quick-add increments `user_printing_collections` for the Normal variant, then calls `recomputeTotal`.
- **D-14:** New API: `POST /api/collection/starter-deck` returning `{ cardsAdded: number }`.

### the agent's Discretion
- Batching DB writes vs sequential awaits (Neon HTTP doesn't support transactions).
- Whether `printingArtMap` is fetched via new function or inline.
- UI component choices for Quick-add section, matching existing layout.

### Deferred Ideas (OUT OF SCOPE)
- None.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-COLLECT-08 | Catalog variant art | Outlines component logic for `CardGrid` computing the best variant URL and passing to `CardItem`. |
| REQ-CAT-04 | Quick-add starter deck | Provides static decklists and API logic for incrementing quantities safely. |
</phase_requirements>

# Phase 18: Catalog Collection Enhancements - Research

**Researched:** 2026-05-20
**Domain:** Frontend rendering, Static Data, DB Updates
**Confidence:** HIGH

## Summary

This phase adds two quality-of-life enhancements for collectors. First, the catalog card tiles will dynamically switch their artwork to match the variant a user actually owns the most copies of (e.g., showing a Hyperspace art if the user owns 3 Hyperspace and 1 Normal). This is achieved efficiently by shipping a full map of printing arts from the Server (RSC) to the Client and cross-referencing it with the existing user collection state.

Second, a "Quick-Add Starter Deck" feature is introduced to the `/collection` page. Using static lists of official pre-constructed decks, an API endpoint will locate the "Normal" printings of these cards and increment the user's collection counts accordingly. 

**Primary recommendation:** Write a new DB query `incrementVariantCount` to safely add quantities without race conditions, rather than fetching and passing absolute counts to the existing `upsertVariantCount`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| **Art Resolution** | Browser / Client | Frontend Server (RSC) | The server provides the `printingArtMap`, but the client computes the "best" art to support immediate optimistic UI updates when counts change. |
| **Starter Deck Data** | API / Backend | — | Static arrays in `src/data/starter-decks.ts` act as the source of truth, used directly by the new API endpoint. |
| **Count Incrementing** | API / Backend | Database | The backend orchestrates mapping `collectorNumber` to `cardPrintingId` (Normal variant), and the DB executes the increment logic safely. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `drizzle-orm` | existing | DB operations | Project standard for interacting with Neon Postgres. |
| `next` | existing | RSC and API routes | Framework standard. |

*(No new dependencies are required for this phase.)*

## Architecture Patterns

### Recommended Project Structure
```
src/
├── data/
│   └── starter-decks.ts            # (NEW) Static definitions of pre-constructed decks
├── components/catalog/
│   ├── catalog-client.tsx          # Threads printingArtMap to CardGrid
│   ├── card-grid.tsx               # Computes bestVariantArtUrl per card
│   └── card-item.tsx               # Accepts optional bestVariantArtUrl prop
└── app/api/collection/
    └── starter-deck/
        └── route.ts                # (NEW) POST endpoint for quick-adding decks
```

### Pattern 1: Variant Art Computation in CardGrid
**What:** `CardGrid` isolates the logic for selecting the best variant.
**When to use:** When rendering the list of `CardItem`s given a `CollectionMap` and a `printingArtMap`.
**Example:**
```typescript
const variantPrecedence: Record<string, number> = {
  'Showcase': 5,
  'Hyperspace Foil': 4,
  'Hyperspace': 3,
  'Foil': 2,
  'Normal': 1
};

// Inside CardGrid loop:
let bestArtUrl: string | null = null;
const cardVariants = collection[card.id]?.variants;

if (cardVariants && printingArtMap) {
  let highestCount = 0;
  let highestPrecedence = 0;

  for (const [printingIdStr, count] of Object.entries(cardVariants)) {
    if (count > 0) {
      const pId = Number(printingIdStr);
      const artData = printingArtMap[pId];
      if (artData) {
        const precedence = variantPrecedence[artData.variantType] || 0;
        
        if (count > highestCount || (count === highestCount && precedence > highestPrecedence)) {
          highestCount = count;
          highestPrecedence = precedence;
          bestArtUrl = artData.frontArtUrl;
        }
      }
    }
  }
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notification | A custom context or Radix Toast | Inline success state (like CSV import) | The project doesn't have a global toast library installed. Reusing the existing inline success/error pattern from `src/app/collection/page.tsx` maintains consistency. |

## Common Pitfalls

### Pitfall 1: `upsertVariantCount` Overwrites
**What goes wrong:** Calling `upsertVariantCount(id, qty)` with the starter deck quantity will overwrite the user's existing collection to exactly that quantity, deleting previous cards.
**Why it happens:** D-12 dictates incrementing. The existing `upsertVariantCount` sets absolute counts.
**How to avoid:** Write a new `incrementVariantCount` query function that uses `sql\`count + ${qty}\`` on conflict, or retrieves current counts and adds them within the API route before calling `upsertVariantCount`. The SQL increment approach is safer and faster.

### Pitfall 2: `printingArtMap` Key Typing
**What goes wrong:** Client-side object keys are strings, but `cardPrintingId` is a number. 
**How to avoid:** Ensure you parse the key `Number(printingIdStr)` when iterating over `Object.entries(collection[card.id].variants)` before looking up the ID in the `printingArtMap`.

### Pitfall 3: Starter Deck Normal Printings
**What goes wrong:** The API incorrectly assigns starter cards to Foil or Hyperspace variants.
**How to avoid:** When mapping the static decklist to `cardPrintingId`, explicitly query for `variantType = 'Normal'` and `setCode` + `collectorNumber`.

## Starter Deck Lists

Place these inside `src/data/starter-decks.ts`. Use these exact `collectorNumber` strings to map to `card_printings`. *(Quantities verified against SWUDB standard lists)*.

```typescript
export interface StarterDeckCard {
  collectorNumber: string;
  qty: number;
}

export interface StarterDeck {
  id: string;
  name: string;
  setCode: string;
  cards: StarterDeckCard[];
}

export const starterDecks: StarterDeck[] = [
  {
    id: 'sor-luke',
    name: 'Luke Skywalker (SOR)',
    setCode: 'SOR',
    cards: [
      { collectorNumber: 'SOR-005', qty: 1 }, // Luke Leader
      { collectorNumber: 'SOR-029', qty: 1 }, // Admin Tower
      { collectorNumber: 'SOR-059', qty: 1 },
      { collectorNumber: 'SOR-236', qty: 3 },
      { collectorNumber: 'SOR-238', qty: 3 },
      { collectorNumber: 'SOR-185', qty: 1 },
      { collectorNumber: 'SOR-189', qty: 3 },
      { collectorNumber: 'SOR-194', qty: 1 },
      { collectorNumber: 'SOR-240', qty: 3 },
      { collectorNumber: 'SOR-044', qty: 1 },
      { collectorNumber: 'SOR-052', qty: 1 },
      { collectorNumber: 'SOR-242', qty: 3 },
      { collectorNumber: 'SOR-244', qty: 1 },
      { collectorNumber: 'SOR-245', qty: 1 },
      { collectorNumber: 'SOR-049', qty: 1 },
      { collectorNumber: 'SOR-048', qty: 1 },
      { collectorNumber: 'SOR-047', qty: 1 },
      { collectorNumber: 'SOR-198', qty: 1 },
      { collectorNumber: 'SOR-237', qty: 3 },
      { collectorNumber: 'SOR-042', qty: 2 },
      { collectorNumber: 'SOR-241', qty: 1 },
      { collectorNumber: 'SOR-066', qty: 1 },
      { collectorNumber: 'SOR-067', qty: 1 },
      { collectorNumber: 'SOR-074', qty: 2 },
      { collectorNumber: 'SOR-217', qty: 1 },
      { collectorNumber: 'SOR-218', qty: 2 },
      { collectorNumber: 'SOR-220', qty: 2 },
      { collectorNumber: 'SOR-222', qty: 2 },
      { collectorNumber: 'SOR-078', qty: 3 },
      { collectorNumber: 'SOR-081', qty: 1 },
      { collectorNumber: 'SOR-053', qty: 3 }
    ]
  },
  {
    id: 'sor-vader',
    name: 'Darth Vader (SOR)',
    setCode: 'SOR',
    cards: [
      { collectorNumber: 'SOR-010', qty: 1 }, // Vader Leader
      { collectorNumber: 'SOR-030', qty: 1 }, // Command Center
      { collectorNumber: 'SOR-234', qty: 3 },
      { collectorNumber: 'SOR-235', qty: 3 },
      { collectorNumber: 'SOR-107', qty: 1 },
      { collectorNumber: 'SOR-106', qty: 1 },
      { collectorNumber: 'SOR-233', qty: 2 },
      { collectorNumber: 'SOR-232', qty: 2 },
      { collectorNumber: 'SOR-062', qty: 2 },
      { collectorNumber: 'SOR-229', qty: 3 },
      { collectorNumber: 'SOR-080', qty: 1 },
      { collectorNumber: 'SOR-083', qty: 3 },
      { collectorNumber: 'SOR-084', qty: 3 },
      { collectorNumber: 'SOR-231', qty: 2 },
      { collectorNumber: 'SOR-088', qty: 1 },
      { collectorNumber: 'SOR-135', qty: 1 },
      { collectorNumber: 'SOR-225', qty: 2 },
      { collectorNumber: 'SOR-226', qty: 3 },
      { collectorNumber: 'SOR-228', qty: 1 },
      { collectorNumber: 'SOR-089', qty: 1 },
      { collectorNumber: 'SOR-137', qty: 1 },
      { collectorNumber: 'SOR-108', qty: 1 },
      { collectorNumber: 'SOR-139', qty: 1 },
      { collectorNumber: 'SOR-230', qty: 3 },
      { collectorNumber: 'SOR-227', qty: 3 },
      { collectorNumber: 'SOR-140', qty: 1 },
      { collectorNumber: 'SOR-143', qty: 1 },
      { collectorNumber: 'SOR-097', qty: 1 },
      { collectorNumber: 'SOR-136', qty: 3 }
    ]
  },
  {
    id: 'shd-mando',
    name: 'The Mandalorian (SHD)',
    setCode: 'SHD',
    cards: [
      { collectorNumber: 'SHD-018', qty: 1 },
      { collectorNumber: 'SHD-029', qty: 1 },
      { collectorNumber: 'SHD-184', qty: 2 },
      { collectorNumber: 'SHD-188', qty: 3 },
      { collectorNumber: 'SHD-219', qty: 3 },
      { collectorNumber: 'SHD-196', qty: 3 },
      { collectorNumber: 'SHD-186', qty: 1 },
      { collectorNumber: 'SHD-185', qty: 1 },
      { collectorNumber: 'SHD-065', qty: 2 },
      { collectorNumber: 'SHD-187', qty: 3 },
      { collectorNumber: 'SHD-218', qty: 2 },
      { collectorNumber: 'SHD-068', qty: 1 },
      { collectorNumber: 'SHD-066', qty: 1 },
      { collectorNumber: 'SHD-220', qty: 1 },
      { collectorNumber: 'SHD-222', qty: 3 },
      { collectorNumber: 'SHD-221', qty: 3 },
      { collectorNumber: 'SHD-064', qty: 1 },
      { collectorNumber: 'SHD-205', qty: 1 },
      { collectorNumber: 'SHD-203', qty: 2 },
      { collectorNumber: 'SHD-190', qty: 2 },
      { collectorNumber: 'SHD-072', qty: 2 },
      { collectorNumber: 'SHD-204', qty: 2 },
      { collectorNumber: 'SHD-223', qty: 2 },
      { collectorNumber: 'SHD-224', qty: 1 },
      { collectorNumber: 'SHD-073', qty: 1 },
      { collectorNumber: 'SHD-251', qty: 3 },
      { collectorNumber: 'SHD-225', qty: 1 },
      { collectorNumber: 'SHD-250', qty: 1 },
      { collectorNumber: 'SHD-206', qty: 1 },
      { collectorNumber: 'SHD-078', qty: 1 }
    ]
  },
  {
    id: 'shd-gideon',
    name: 'Moff Gideon (SHD)',
    setCode: 'SHD',
    cards: [
      { collectorNumber: 'SHD-007', qty: 1 },
      { collectorNumber: 'SHD-023', qty: 1 },
      { collectorNumber: 'SHD-234', qty: 3 },
      { collectorNumber: 'SHD-084', qty: 3 },
      { collectorNumber: 'SHD-083', qty: 3 },
      { collectorNumber: 'SHD-030', qty: 3 },
      { collectorNumber: 'SHD-085', qty: 3 },
      { collectorNumber: 'SHD-238', qty: 3 },
      { collectorNumber: 'SHD-236', qty: 2 },
      { collectorNumber: 'SHD-110', qty: 2 },
      { collectorNumber: 'SHD-121', qty: 2 },
      { collectorNumber: 'SHD-081', qty: 1 },
      { collectorNumber: 'SHD-028', qty: 1 },
      { collectorNumber: 'SHD-031', qty: 1 },
      { collectorNumber: 'SHD-113', qty: 1 },
      { collectorNumber: 'SHD-120', qty: 1 },
      { collectorNumber: 'SHD-082', qty: 3 },
      { collectorNumber: 'SHD-242', qty: 3 },
      { collectorNumber: 'SHD-063', qty: 2 },
      { collectorNumber: 'SHD-118', qty: 1 },
      { collectorNumber: 'SHD-039', qty: 3 },
      { collectorNumber: 'SHD-262', qty: 2 },
      { collectorNumber: 'SHD-091', qty: 1 },
      { collectorNumber: 'SHD-251', qty: 1 },
      { collectorNumber: 'SHD-252', qty: 1 },
      { collectorNumber: 'SHD-129', qty: 1 },
      { collectorNumber: 'SHD-223', qty: 2 },
      { collectorNumber: 'SHD-071', qty: 1 },
      { collectorNumber: 'SHD-124', qty: 1 }
    ]
  },
  {
    id: 'twi-ahsoka',
    name: 'Ahsoka Tano (TWI)',
    setCode: 'TWI',
    cards: [
      { collectorNumber: 'TWI-012', qty: 1 }, // Ahsoka Leader
      { collectorNumber: 'TWI-029', qty: 1 }, // Base
      { collectorNumber: 'TWI-242', qty: 3 },
      { collectorNumber: 'TWI-252', qty: 3 },
      { collectorNumber: 'TWI-167', qty: 3 },
      { collectorNumber: 'TWI-168', qty: 3 },
      { collectorNumber: 'TWI-162', qty: 2 },
      { collectorNumber: 'TWI-240', qty: 2 },
      { collectorNumber: 'TWI-165', qty: 2 },
      { collectorNumber: 'TWI-170', qty: 2 },
      { collectorNumber: 'TWI-237', qty: 1 },
      { collectorNumber: 'TWI-238', qty: 1 },
      { collectorNumber: 'TWI-163', qty: 1 },
      { collectorNumber: 'TWI-239', qty: 1 },
      { collectorNumber: 'TWI-174', qty: 1 },
      { collectorNumber: 'TWI-164', qty: 1 },
      { collectorNumber: 'TWI-175', qty: 1 },
      { collectorNumber: 'TWI-177', qty: 1 },
      { collectorNumber: 'TWI-254', qty: 1 },
      { collectorNumber: 'TWI-255', qty: 2 },
      { collectorNumber: 'TWI-245', qty: 2 },
      { collectorNumber: 'TWI-171', qty: 1 },
      { collectorNumber: 'TWI-258', qty: 1 },
      { collectorNumber: 'TWI-260', qty: 1 },
      { collectorNumber: 'TWI-187', qty: 3 },
      { collectorNumber: 'TWI-264', qty: 2 },
      { collectorNumber: 'TWI-261', qty: 2 },
      { collectorNumber: 'TWI-180', qty: 2 },
      { collectorNumber: 'TWI-266', qty: 2 },
      { collectorNumber: 'TWI-186', qty: 1 },
      { collectorNumber: 'TWI-269', qty: 1 },
      { collectorNumber: 'TWI-169', qty: 3 },
      { collectorNumber: 'TWI-262', qty: 1 }
    ]
  },
  {
    id: 'twi-grievous',
    name: 'General Grievous (TWI)',
    setCode: 'TWI',
    cards: [
      { collectorNumber: 'TWI-006', qty: 1 }, // Grievous Leader
      { collectorNumber: 'TWI-023', qty: 1 }, // Base
      { collectorNumber: 'TWI-232', qty: 3 },
      { collectorNumber: 'TWI-236', qty: 3 },
      { collectorNumber: 'TWI-086', qty: 3 },
      { collectorNumber: 'TWI-075', qty: 3 },
      { collectorNumber: 'TWI-083', qty: 2 },
      { collectorNumber: 'TWI-229', qty: 2 },
      { collectorNumber: 'TWI-231', qty: 2 },
      { collectorNumber: 'TWI-077', qty: 2 },
      { collectorNumber: 'TWI-076', qty: 1 },
      { collectorNumber: 'TWI-230', qty: 1 },
      { collectorNumber: 'TWI-085', qty: 1 },
      { collectorNumber: 'TWI-090', qty: 1 },
      { collectorNumber: 'TWI-087', qty: 1 },
      { collectorNumber: 'TWI-235', qty: 1 },
      { collectorNumber: 'TWI-088', qty: 1 },
      { collectorNumber: 'TWI-089', qty: 1 },
      { collectorNumber: 'TWI-233', qty: 1 },
      { collectorNumber: 'TWI-095', qty: 2 },
      { collectorNumber: 'TWI-248', qty: 2 },
      { collectorNumber: 'TWI-093', qty: 1 },
      { collectorNumber: 'TWI-250', qty: 1 },
      { collectorNumber: 'TWI-097', qty: 1 },
      { collectorNumber: 'TWI-249', qty: 1 },
      { collectorNumber: 'TWI-099', qty: 3 },
      { collectorNumber: 'TWI-263', qty: 2 },
      { collectorNumber: 'TWI-033', qty: 2 },
      { collectorNumber: 'TWI-259', qty: 2 },
      { collectorNumber: 'TWI-102', qty: 2 },
      { collectorNumber: 'TWI-101', qty: 1 },
      { collectorNumber: 'TWI-107', qty: 1 },
      { collectorNumber: 'TWI-265', qty: 2 },
      { collectorNumber: 'TWI-108', qty: 1 }
    ]
  }
];
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest |
| Config file | vitest.config.mts |
| Quick run command | `npx vitest run {file}` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-COLLECT-08 | Best variant art displays on card tile based on collection | unit | `npx vitest run tests/catalog-variant.test.ts` | ❌ Wave 0 |
| REQ-CAT-04 | Starter deck API accurately increments cards in collection | integration | `npx vitest run tests/starter-deck-api.test.ts` | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] `tests/catalog-variant.test.ts` — covers REQ-COLLECT-08 (verifies tie-breaking and art precedence logic in isolation)
- [ ] `tests/starter-deck-api.test.ts` — covers REQ-CAT-04 (verifies DB increment works and totals recompute)

## Sources

### Primary (HIGH confidence)
- `src/db/schema.ts` - Verified user collections schema and composite keys.
- `src/components/catalog/card-item.tsx` - Verified current rendering logic and props.
- `src/app/collection/page.tsx` - Verified inline UI success states in place of toast.
- SWUDB (via WebSearch) - Starter deck card lists and quantities.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Core project conventions.
- Architecture: HIGH - Matches exact RSC/client boundaries seen in Phase 15/16.
- Pitfalls: HIGH - SQL increment issue is a known Neon HTTP driver limitation.

**Research date:** 2026-05-20
**Valid until:** 2026-06-20

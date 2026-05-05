# Phase 4: Deck Builder - Research

**Researched:** 2026-05-05
**Domain:** Deck Construction, Rule Validation, Collection Integration
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Single-User:** Like Phase 3, this will be single-user (userId: 1) for now.
- **Local Storage / DB:** Decks will be stored in the PostgreSQL database.
- **Legality Enforcement:** Validation will happen on the client for immediate feedback, but will also be enforced on the server during save.
- **Responsive:** The builder needs to work well on mobile and desktop.

### the agent's Discretion
*(Not explicitly listed in CONTEXT.md, but implied for UI layout and technical implementation)*

### Deferred Ideas (OUT OF SCOPE)
*(None listed in CONTEXT.md)*
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DECK-01 | Create named deck with 1 Leader, 1 Base, 50-card main deck | DB Schema and API design defined for metadata + contents. |
| DECK-02 | Save, view, delete multiple decks | CRUD API endpoints and Drizzle schema defined. |
| DECK-03 | Show owned count inline | Reusing collection fetch pattern from Phase 3. |
| DECK-04 | Highlight cards not owned | Clsx/Tailwind pattern defined for missing-card visual state. |
| DECK-05 | Validate legality (SWU Premier rules) | Logic for 3-copy limit (inc. reprints) and aspect penalty researched. |
| Export | Export in Melee and JSON format | Melee TXT and SwuDB JSON formats verified. |
| Stats | Units count, aspects, cost curve | Cost curve pattern and aspect extraction logic defined. |
</phase_requirements>

## Summary

Phase 4 focuses on creating a robust Deck Builder for Star Wars: Unlimited Premier play. The builder integrates with the existing card catalog (Phase 2) and user collection (Phase 3). Users can construct decks by selecting a Leader, a Base, and a main deck of at least 50 cards, plus an optional 10-card sideboard.

**Primary recommendation:** Use a client-side `useReducer` to manage the complex state of a deck in progress, and implement a dedicated validation utility that groups cards by identity (Name + Subtitle) to correctly enforce the 3-copy limit across reprints.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Deck State | Client (React) | — | Immediate feedback, responsive editing experience |
| Rule Validation | Client (JS) | API (Backend) | Client for UX; Server-side for data integrity & exports |
| Persistence | API (Backend) | Database | Single source of truth for saved decks |
| Collection Integration | Client (JS) | — | Comparing deck counts vs owned counts locally |
| Stats Calculation | Client (JS) | — | Dynamic updates of cost curve and aspect distribution |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Drizzle ORM | ^0.45.2 | Database Access | Project standard for type-safe SQL |
| Neon Serverless | ^1.1.0 | PostgreSQL | Existing DB infrastructure |
| nuqs | ^2.8.9 | URL State | Managing search/filters in catalog while building |
| shadcn/ui | ^4.6.0 | UI Components | Accessible, themed component library |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| Lucide React | ^1.14.0 | Icons | Legend/Base icons, status indicators |
| clsx / tailwind-merge | — | CSS Classes | Conditional styling for validity/missing cards |

**Installation:**
No new core packages required. Existing `package.json` covers all needs.

## Database Schema

We will add two new tables to support deck persistence.

```typescript
import { pgTable, serial, text, integer, timestamp, boolean, primaryKey } from 'drizzle-orm/pg-core';
import { cardDefinitions } from './schema';

export const decks = pgTable('decks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().default(1),
  name: text('name').notNull(),
  leaderCardDefinitionId: integer('leader_card_definition_id')
    .references(() => cardDefinitions.id),
  baseCardDefinitionId: integer('base_card_definition_id')
    .references(() => cardDefinitions.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const deckCards = pgTable('deck_cards', {
  deckId: integer('deck_id')
    .notNull()
    .references(() => decks.id, { onDelete: 'cascade' }),
  cardDefinitionId: integer('card_definition_id')
    .notNull()
    .references(() => cardDefinitions.id),
  quantity: integer('quantity').notNull().default(1),
  isSideboard: boolean('is_sideboard').notNull().default(false),
}, (t) => [
  primaryKey({ columns: [t.deckId, t.cardDefinitionId, t.isSideboard] }),
]);
```

## API Design

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/decks` | List all decks for the user (metadata + counts) |
| `POST` | `/api/decks` | Create a new deck |
| `GET` | `/api/decks/[id]` | Get full deck details (metadata + card list) |
| `PATCH` | `/api/decks/[id]` | Update deck (name, leader, base, and full card list) |
| `DELETE` | `/api/decks/[id]` | Delete a deck |

**Payload Structure (PATCH):**
```json
{
  "name": "Vader's Fist",
  "leaderId": 42,
  "baseId": 10,
  "cards": [
    { "id": 101, "count": 3, "isSideboard": false },
    { "id": 102, "count": 1, "isSideboard": true }
  ]
}
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/deck-builder/
│   ├── deck-builder-client.tsx    # Main container
│   ├── deck-sidebar.tsx          # Deck list, stats, validation
│   ├── deck-card-item.tsx        # Card row in sidebar
│   └── catalog-wrapper.tsx       # Catalog with "Add" buttons
├── db/queries/
│   └── decks.ts                  # CRUD logic
└── lib/
    └── deck-validation.ts        # Logic for SWU rules
```

### Pattern: Rule Validation Utility
Validation must be reactive to state changes in the builder.

```typescript
// src/lib/deck-validation.ts
export interface DeckValidationResult {
  isValid: boolean;
  errors: string[];
  aspectsProvided: string[];
  counts: { main: number; sideboard: number };
}

export function validateDeck(deck: DeckState): DeckValidationResult {
  // 1. Group by (Name, Subtitle) for 3-copy limit across reprints
  // 2. Sum Main (min 50) and SB (max 10)
  // 3. Extract aspects from Leader + Base
  // 4. Check for mandatory Leader/Base selection
}
```

### Anti-Patterns to Avoid
- **Saving on every change:** Decks can be large (60+ cards). Use a "Save" button or debounced auto-save to avoid database churn.
- **Client-only validation:** While client validation is great for UX, the API must verify counts and copy limits before persistence to ensure database integrity.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cost Curve Graph | Custom SVG chart library | CSS Flexbox/Grid bars | Sufficiently simple; avoids heavy chart dependencies |
| Export Formats | Custom string builders | Standard Utility functions | Melee TXT and SwuDB JSON have specific, rigid formats |

## Common Pitfalls

### Pitfall 1: 3-Copy Limit across Reprints
**What goes wrong:** A card (e.g., "Luke Skywalker - Faithful Friend") might be printed in Set 1 and Set 5. Users can include 3 copies *total* across all sets, not 3 of each.
**Prevention:** Validation logic must group by card Name + Subtitle (or a canonical identity ID if implemented) rather than just `cardDefinitionId`.

### Pitfall 2: Aspect Penalty Calculation
**What goes wrong:** Miscalculating the +2 resource penalty for missing aspect icons.
**Prevention:** Use a pool-based matching algorithm (consume icons from the "provided" pool as you match them on the card) to correctly handle double-aspect cards (e.g. Double Blue cards).

### Pitfall 3: Unique Rule vs Deck Limit
**What goes wrong:** Confusing the "Unique" rule (only one copy in play) with the deck building limit (max 3 in deck).
**How to avoid:** Deck building only cares about the 3-copy limit. The "Unique" status is irrelevant for construction legality.

## Code Examples

### Aspect Penalty Utility
```typescript
function calculatePenalty(cardAspects: string[], providedAspects: string[]): number {
  let penalty = 0;
  const pool = [...providedAspects];
  for (const aspect of cardAspects) {
    const idx = pool.indexOf(aspect);
    if (idx !== -1) {
      pool.splice(idx, 1); // Consumed
    } else {
      penalty += 2;
    }
  }
  return penalty;
}
```

### Melee Export Format
```text
1 Boba Fett - Collecting the Bounty
1 Energy Conversion Lab
3 Superlaser Technician
...
Sideboard
3 Change of Heart
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | vitest.config.mts |
| Quick run command | `npm test src/lib/deck-validation.test.ts` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DECK-01 | Create valid deck | Integration | `npm test` | ❌ Wave 0 |
| DECK-05 | 3-copy limit (inc. reprints) | Unit | `npm test` | ❌ Wave 0 |
| DECK-05 | Aspect penalty logic | Unit | `npm test` | ❌ Wave 0 |
| DECK-03 | Owned count comparison | Unit | `npm test` | ❌ Wave 0 |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Server-side validation of deck contents (counts/limits) |

### Known Threat Patterns for Next.js/Postgres

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL Injection | Tampering | Drizzle ORM parameterized queries |
| Unauthorized Delete | Spoofing | Ensure `userId: 1` constraint (future: real Auth) |

## Sources

### Primary (HIGH confidence)
- [Official SWU Rules](https://starwarsunlimited.com/how-to-play?chapter=deck-building) - Deck building constraints and aspect penalty.
- [Melee.gg FAQ](https://melee.gg/) - Decklist submission format.
- [SWUDB API Documentation](https://api.swu-db.com/) - JSON export format and aspect array structure.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Reusing existing project infra.
- Architecture: HIGH - Standard React state/CRUD pattern.
- Pitfalls: HIGH - Well-documented TCG rules.

**Research date:** 2026-05-05
**Valid until:** 2026-06-05 (Stable domain)

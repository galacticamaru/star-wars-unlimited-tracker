# Phase 18: Catalog Collection Enhancements - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Two independent features:
1. **Catalog variant art** — Each catalog card tile shows the art of the variant the user owns the most copies of. If zero copies owned (or user is logged out), falls back to Normal/Standard art. The RSC passes a `printingArtMap` (all `cardPrintingId → { variantType, frontArtUrl }` rows) alongside the card list; the client computes the best-variant art from the existing `CollectionMap.variants` data.
2. **Starter deck quick-add** — On the Collection page import section, a dropdown lets users select a named pre-constructed starter deck and add all its cards to their collection in one click. A toast confirms how many cards were added.

</domain>

<decisions>
## Implementation Decisions

### Variant Art — Delivery Mechanism
- **D-01:** RSC passes a `printingArtMap: Record<number, { variantType: string; frontArtUrl: string | null }>` (keyed by `cardPrintingId`) to the client alongside the existing card list. This map is fetched server-side from `card_printings` (all rows, no user filter needed).
- **D-02:** Client-side computation: for each card tile, read `CollectionMap.variants[cardDefinitionId]` (the per-printing counts), find the `cardPrintingId` with the highest count, look up its `frontArtUrl` from `printingArtMap`. If no owned variants, use the card's existing `frontArtUrl` (Normal art).
- **D-03:** Logged-out users see Normal art — same code path as "zero owned" (no collection loaded).

### Variant Art — Tie-Breaking
- **D-04:** When two variants are tied (equal owned count), prefer the most premium variant. Precedence (highest to lowest): Showcase > Hyperspace Foil > Hyperspace > Foil > Normal. If variant type is unknown, treat as lowest priority.

### Starter Deck Data Source
- **D-05:** Starter deck definitions are hard-coded as static arrays in `src/data/starter-decks.ts`. No DB table, no API call. Each entry has `{ id, name, setCode, cards: { collectorNumber: string, qty: number }[] }`.
- **D-06:** Scope: all known official pre-constructed starter decks across all released SWU sets (SOR, SHD, TWI, and any others). The researcher must gather the complete canonical list with card quantities.
- **D-07:** File location: `src/data/starter-decks.ts` — a new `/data` directory signals static reference data, distinct from logic in `/lib`.

### Quick-Add Placement & UX
- **D-08:** The quick-add UI lives on the **Collection page** (`/collection`) in the import/add section — alongside or below the existing CSV import control.
- **D-09:** UI pattern: a `<select>` dropdown listing all starter decks by name, plus an "Add to Collection" button. On click, calls the API; on success, shows a toast.
- **D-10:** Toast message format: `"Added {N} cards from {Deck Name} to your collection."` Consistent with how other collection actions provide feedback.

### Quick-Add Quantity Behavior
- **D-11:** Quick-add uses the actual deck quantities from the starter deck definition (e.g., if a starter has 3× of a card, add 3 copies). Not a flat 1× per card.
- **D-12:** Quantities are **incremented** on top of existing counts — not overwritten. Running quick-add twice correctly reflects owning two copies of that starter.
- **D-13:** Cards in starter decks are Normal variant prints. Quick-add increments `user_printing_collections` for the Normal `cardPrintingId` (looked up from `card_printings` by `collectorNumber + variantType = 'Normal'`), then triggers `recomputeTotal` to update `userCollections.count`.

### API
- **D-14:** New endpoint `POST /api/collection/starter-deck` with body `{ starterDeckId: string }`. Resolves the deck from `src/data/starter-decks.ts`, looks up Normal `cardPrintingId` for each `collectorNumber`, calls `upsertVariantCount` + `recomputeTotal` per card (or a batched variant). Returns `{ cardsAdded: number }`.

### Claude's Discretion
- Whether to batch the DB writes for quick-add (single transaction-equivalent vs. sequential awaits) — planner decides based on Neon HTTP driver constraints (no transactions).
- Whether `printingArtMap` is fetched via a new dedicated query function or inline in the catalog RSC page — planner decides.
- Whether the quick-add section on the Collection page uses an existing `Card` or `Section` UI component, or inline HTML — consistent with the page's existing layout.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema & Queries
- `src/db/schema.ts` — `card_printings` (variantType, frontArtUrl), `user_printing_collections`, `userCollections` — understand existing composite PKs and the auto-sum pattern
- `src/db/queries/collection.ts` — `upsertVariantCount` and `recomputeTotal` — new quick-add endpoint reuses these per-card
- `src/db/queries/catalog.ts` — `getAllCards` — understand how the catalog RSC fetches card data; the new `printingArtMap` query is added alongside this

### Catalog Components
- `src/components/catalog/card-grid.tsx` — receives `cards` and `collection`; must also receive and thread `printingArtMap` to `CardItem`
- `src/components/catalog/card-item.tsx` — currently uses `frontArtUrl` prop; must accept optional `bestVariantArtUrl` that overrides when present
- `src/components/catalog/catalog-client.tsx` — client entry point; receives `printingArtMap` from RSC and passes it to `CardGrid`

### Collection API & Shape
- `src/app/api/collection/collection-shape.ts` — `CollectionMap` type: `{ [cardDefinitionId]: { total, variants: { [cardPrintingId]: count } } }` — the `variants` map drives best-variant art selection
- `src/app/api/collection/route.ts` — GET pattern; new `POST /api/collection/starter-deck` follows same auth check pattern

### Collection Page
- `src/app/collection/page.tsx` (or closest equivalent) — where the quick-add UI is added; researcher should confirm the exact file path

### Phase Requirements
- `.planning/REQUIREMENTS.md` — REQ-COLLECT-08 (catalog variant art), REQ-CAT-04 (quick-add starter deck)
- `.planning/ROADMAP.md` §Phase 18 — Success criteria (3 items) and phase goal

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `upsertVariantCount` + `recomputeTotal` in `src/db/queries/collection.ts` — exact pattern for quick-add: upsert per-variant count, then recompute total. Quick-add calls these per card in the starter deck.
- `CollectionMap.variants` in the client — already has `{ [cardPrintingId]: count }` per card definition. Variant art selection reads this directly — no new fetch needed.
- `card_printings` table — already has `frontArtUrl` and `variantType` per printing. The `printingArtMap` is just a SELECT of all rows' `(id, frontArtUrl, variantType)`.

### Established Patterns
- **Auth check**: `auth.api.getSession({ headers: await headers() })` in every API route — new `POST /api/collection/starter-deck` follows this.
- **Optimistic UI in catalog**: `collection` loaded client-side via `useEffect` + `fetch('/api/collection')` — `printingArtMap` is fetched server-side (RSC) and passed as a prop, not client-fetched.
- **No Radix UI**: `@base-ui/react` only for headless primitives. The dropdown for starter deck selection should use a native `<select>` or base-ui component, not Radix.
- **Toast pattern**: check existing toast usage in the codebase — the collection page or import section likely already uses a toast for CSV import confirmation; reuse the same pattern.

### Integration Points
- **Catalog RSC (`src/app/cards/page.tsx`)**: currently calls `getAllCards(userId)`. Must also fetch all printing rows (for `printingArtMap`) in parallel. `printingArtMap` is passed to `CatalogClient` and threaded to `CardGrid` → `CardItem`.
- **CardItem variant art logic**: `CardItem` currently picks `displayUrl = isLeader ? frontArtUrl : frontArtUrl`. New logic: if `bestVariantArtUrl` prop is provided and non-null, use it instead of `frontArtUrl`.
- **Collection page quick-add**: new component/section added to `/collection` page. After successful API call, refetches collection or invalidates client state so counts update immediately.
- **Neon HTTP driver**: does not support transactions. Quick-add with many cards means sequential `upsertVariantCount` + `recomputeTotal` calls. Consider batching all upserts first, then one final `recomputeTotal` per distinct `cardDefinitionId` — but this is planner's call.

</code_context>

<specifics>
## Specific Ideas

- The `printingArtMap` approach keeps the server → client data contract clean: the client already has `CollectionMap.variants` (cardPrintingId → count) from the existing collection fetch, and now also has `printingArtMap` (cardPrintingId → artUrl). Combining them is a simple lookup.
- Variant type priority for tie-breaking (D-04): Showcase > Hyperspace Foil > Hyperspace > Foil > Normal — reflects the physical rarity / premium feel of each print type.
- Quick-add endpoint returns `{ cardsAdded: number }` — the toast uses this count directly in the confirmation message.
- Starter deck data file (`src/data/starter-decks.ts`) should be typed: `interface StarterDeck { id: string; name: string; setCode: string; cards: { collectorNumber: string; qty: number }[] }`.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 18-Catalog-Collection-Enhancements*
*Context gathered: 2026-05-20*

# Phase 17: Variant Collection Tracking - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Add per-variant owned count tracking to the card detail page. Users can see a list of all available printings for the current set (Normal, Hyperspace, Showcase, etc.), view how many copies they own of each, and increment/decrement counts individually via +/- controls. A read-only total is shown. The DB stores per-printing counts in a new `user_printing_collections` table; the existing `userCollections.count` auto-sums from variant counts so all downstream code (catalog, deck builder, want lists) continues to work unchanged.

This phase also removes the legacy total-count endpoint (`POST /api/collection`) and updates the CSV import to write per-variant counts instead of totals.

</domain>

<decisions>
## Implementation Decisions

### DB Schema
- **D-01:** Add a new table `user_printing_collections` with composite PK `(userId, cardPrintingId)` and a `count integer NOT NULL DEFAULT 0` column. Mirrors the structure of existing `userCollections` but keyed on `cardPrintingId` (from `card_printings.id`) instead of `cardDefinitionId`.
- **D-02:** After every per-variant upsert, auto-recompute and persist the total: `SUM(count)` from `user_printing_collections` for the associated `cardDefinitionId`, written to `userCollections.count`. This keeps all existing queries reading `userCollections.count` unchanged — catalog overlays, deck builder shortfall badges, and want lists continue to work with zero code changes.
- **D-03:** The old `POST /api/collection` total-count endpoint is **removed**. All count mutations go through `/api/collection/variants`.

### API
- **D-04:** New endpoint `POST /api/collection/variants` with body `{ cardPrintingId: number, count: number }`. Upserts into `user_printing_collections`, then auto-sums → updates `userCollections`. Standard auth check pattern (same as existing endpoints).
- **D-05:** `GET /api/collection` is updated to return per-variant breakdown alongside totals. New response shape: `{ [cardDefinitionId]: { total: number, variants: { [cardPrintingId]: number } } }`. Existing consumers of the old flat `{ [cardDefinitionId]: count }` shape will need to be updated to use `.total`.

### CSV Import
- **D-06:** `POST /api/collection/import` is updated to write per-variant counts instead of totals. The import currently maps `collectorNumber → cardDefinitionId`. Updated version maps `collectorNumber → cardPrintingId` (the specific printing row, already looked up from `card_printings`). Each collectorNumber (e.g., "SOR-059") maps exactly to one printing and its variantType. Writes to `user_printing_collections`, then auto-sums → `userCollections`.

### Variant Scope on Card Detail Page
- **D-07:** The card detail page shows only same-set variants — all `card_printings` rows where `setCode` matches the URL's set code AND `cardDefinitionId` matches the card being viewed. Reprints in other sets have their own URLs and show their own variant lists.
- **D-08:** Each variant row is labeled by `variantType` only (e.g., "Normal", "Hyperspace", "Showcase"). The set is implied by the page URL.
- **D-09:** All same-set variants are always shown, even those with 0 owned copies. No "add variant" flow needed — users can directly increment any variant from 0.

### Card Detail Page UI
- **D-10:** The existing single-total `CollectionControls` component is **removed** from the card detail page. The "Your Collection" section is replaced entirely with a per-variant list.
- **D-11:** Each variant row uses the same +/− pattern as the existing `CollectionControls`: a minus button (disabled at 0), a number display, a plus button. Reuses the existing component logic per row, one row per printing.
- **D-12:** A read-only "Total: X copies" line appears in the collection section (position: top or bottom of the variant list — planner's choice based on visual weight). It displays the sum of all variant counts for this card definition; it is not editable.

### Claude's Discretion
- Positioning of "Total: X" within the collection section (above vs. below variant rows) — planner decides based on visual balance.
- Whether to extract a new `VariantCollectionControls` component or inline the per-variant list in the card detail page — planner decides based on reuse potential.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema & Queries
- `src/db/schema.ts` — All existing tables; new `user_printing_collections` table goes here. Note `userCollections` composite PK pattern `(userId, cardDefinitionId)` — mirror for new table.
- `src/db/queries/collection.ts` — `getUserCollection` and `upsertCardCount` query patterns; new per-variant queries added here.
- `src/db/queries/card-detail.ts` — Currently queries `WHERE variantType = 'Normal'`; must be extended to fetch all same-set printings for the variant list.

### API Routes
- `src/app/api/collection/route.ts` — GET updated (new response shape), POST **removed**.
- `src/app/api/collection/import/route.ts` — Updated to map collectorNumbers to cardPrintingId and write to `user_printing_collections`.

### Card Detail Page
- `src/app/cards/[set-code]/[card-number]/page.tsx` — RSC that renders the card detail; `CollectionControls` import removed, replaced with new per-variant component.
- `src/components/catalog/collection-controls.tsx` — Existing +/− pattern to replicate (or reuse) per variant row.

### Phase Requirements
- `.planning/REQUIREMENTS.md` — REQ-COLLECT-06 (view per-variant counts), REQ-COLLECT-07 (increment/decrement per variant)
- `.planning/ROADMAP.md` §Phase 17 — Success criteria (4 items) and phase goal

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CollectionControls` component (`src/components/catalog/collection-controls.tsx`): The +/− with number display pattern is exactly what each variant row needs. Either reuse it directly (passing `cardPrintingId` instead of `cardDefinitionId`) or extract the control pattern into a shared primitive.
- `upsertCardCount` in `src/db/queries/collection.ts`: The upsert-on-conflict pattern (onConflictDoUpdate targeting composite PK) is the exact pattern for the new `user_printing_collections` upsert.
- `card_printings` table already has all variant rows keyed by `(setCode, collectorNumber)` — same-set variant query is a simple filter on `cardDefinitionId` + `setCode`.

### Established Patterns
- Composite PK tables: `userCollections (userId, cardDefinitionId)`, `deckCards (deckId, cardDefinitionId, isSideboard)` — new table follows same pattern with `(userId, cardPrintingId)`.
- API auth: `auth.api.getSession({ headers: await headers() })` pattern in every API route — new `/api/collection/variants` route follows this.
- Optimistic UI: `CollectionControls` uses local `useState` + async `fetch` without blocking (fire-and-update pattern) — per-variant rows should do the same.

### Integration Points
- `GET /api/collection` response shape change: all consumers of the old flat `{ [cardDefinitionId]: count }` need to read `.total` from the new shape. Key consumers: `CatalogClient` (collection overlay), `DeckBuilder` (owned count overlay), `CollectionPage`. The planner must audit these and update accordingly.
- Card detail RSC (`page.tsx`): currently calls `getUserCollection(userId)` to get the total count for this card. After this phase, the RSC fetches all same-set printings AND their per-variant owned counts in a single query (or two parallel queries).

</code_context>

<specifics>
## Specific Ideas

- The user specifically wants the GET /api/collection to return both total and per-variant breakdown in a single response — not separate endpoints.
- CSV import: existing collectorNumbers in SWU CSVs already encode the specific printing (each collectorNumber is unique per physical printing). The import simply needs to look up `cardPrintings.id` (printingId) alongside the existing `cardDefinitionId` lookup — it's already halfway there.
- The "Total: X copies" display is read-only — no +/− control on it. Users update the total indirectly by adjusting variant counts.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 17-Variant-Collection-Tracking*
*Context gathered: 2026-05-17*

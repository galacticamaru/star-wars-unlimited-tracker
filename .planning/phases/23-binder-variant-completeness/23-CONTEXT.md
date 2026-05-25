# Phase 23: Binder Variant Completeness - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 23 closes three variant gaps across the binder surfaces:

1. **BINDER-07 — Looking For variant badges**: The public binder's "Looking For" section gains per-variant tiles that show a variant badge, matching the badge style on "Available for Trade" tiles. Requires migrating `tradeManualWants` from card-definition-level to printing-level (matching the `user_trade_offerings` schema), and updating `getPublicBinderData()` to produce per-printing looking-for entries.

2. **BINDER-08 — Card Detail trade offer management**: An "Available for Trade" section is added below `VariantCollectionSection` on the card detail page, allowing authenticated users to set/edit/remove trade quantities per printing without visiting Manage Binder.

3. **BINDER-09 — Manage Binder collection-driven discovery**: The Manage Binder page's "add cards to binder" flow is redesigned from browsing the full catalog to browsing owned cards (card-definition total > 0), with a side panel for per-printing variant trade controls.

No changes to the public binder Available for Trade section (badges already work there via `ManageTradeCard`).
No changes to the trade exclusions or auto-exclusion logic.

</domain>

<decisions>
## Implementation Decisions

### Looking For — schema migration

- **D-01:** `tradeManualWants` table migrates to use `cardPrintingId` instead of `cardDefinitionId`, matching the `user_trade_offerings` model exactly. New primary key: `(userId, cardPrintingId)`. Old unique constraint on `(userId, cardDefinitionId)` is dropped.
- **D-02:** Existing manual want rows are migrated to their Normal printing's `cardPrintingId`. Find each `cardDefinitionId`'s Normal printing and map the row forward. Rows that cannot be mapped (no Normal printing exists) are dropped — data loss is acceptable here since variants are new.
- **D-03:** Auto-wants (deck-driven shortfalls) stay card-definition-level. They continue to appear in the public binder Looking For section with a Normal variant badge as their default (no variant-specific meaning — they represent "any version").

### Looking For — per-printing tiles

- **D-04:** `getPublicBinderData()` is updated to produce per-printing Looking For entries for manual wants. Auto-wants still produce card-definition-level entries (fetched via Normal printing). The combined list feeds the public binder's Looking For `CardGrid`.
- **D-05:** One tile per printing — if a user has both a Normal and a Foil manual want for the same card, visitors see two separate tiles. Mirrors how Available for Trade works.
- **D-06:** Both auto-wants and manual wants remain in the public Looking For section (not manual-only).

### Looking For — manual wants UX (Manage Binder)

- **D-07:** After searching for a card by name (card-definition level), the user picks which variant they want using chips (variant type selector). This replaces the current quantity-only add-want flow.
- **D-08:** The `tradeManualWants` API (`/api/binder/wants`) is updated to accept `cardPrintingId` instead of `cardDefinitionId`.

### Card Detail — trade offer section

- **D-09:** A new "Available for Trade" section is placed directly below `VariantCollectionSection` in the image column of the card detail page (`src/app/cards/[set-code]/[card-number]/page.tsx`). Auth-gated: only shown when `userId && printings.length > 0`.
- **D-10:** Mirrors the `VariantCollectionSection` row pattern — one row per printing, with +/- controls for trade quantity. Trade quantity of 0 means not trading (row still visible for discoverability).
- **D-11:** Data is fetched server-side with the page load. Extend `getSameSetPrintingsWithCounts()` (or add a new query) to also return `tradeQuantity` per printing from `user_trade_offerings`. No separate client-side fetch.
- **D-12:** Mutations (updating trade quantity) use the existing `/api/trade` PATCH endpoint. A new thin client component handles the interactive +/- controls, similar to `VariantCollectionSection`'s client wrapper.

### Manage Binder — owned-card discovery

- **D-13:** The "add cards to binder" section of the Manage Binder page switches from showing all printings (`/api/cards/all`) to showing card definitions where `user_collections.count > 0`. This is the same filter as the catalog's "Owned Only" toggle.
- **D-14:** Card tile art uses highest-owned variant precedence (Showcase > Hyperspace Foil > Hyperspace > Foil > Normal), matching the Phase 18 catalog grid art logic.
- **D-15:** Clicking a card tile opens a **side panel / sheet** showing per-printing trade quantity controls for that card. The sheet lists the owned printings with their variant type, owned count, and current trade quantity with +/- controls.
- **D-16:** The side panel uses the same `/api/trade` PATCH endpoint for mutations. Optimistic state updates in the sheet.

### Cross-page sync

- **D-17:** "Immediately reflected" means fresh on next navigation. After updating a trade quantity on the Card Detail page, if the user navigates to Manage Binder via Next.js client-side routing, the Manage Binder re-fetches its data on mount (existing `useEffect`) and shows the updated state. No additional real-time mechanism needed.

### Claude's Discretion

- Exact visual styling of the variant chip selector in the manual wants add-flow (color, size, spacing)
- Whether to extract the "owned cards" API into a new endpoint (e.g., `/api/collection/owned-printings`) or extend the existing `/api/binder` GET response
- Pagination or virtualization of the owned-card browse grid if the user has many cards
- Whether the side panel in Manage Binder is a `Sheet` from shadcn/ui or a custom drawer

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema
- `src/db/schema.ts` — `userTradeOfferings`, `tradeManualWants`, `tradeExclusions`, `cardDefinitions`, `cardPrintings`, `userCollections`, `user_printing_collections` — all involved in this phase

### Binder data layer
- `src/db/queries/binder.ts` — `getPublicBinderData()` needs to be updated to produce per-printing Looking For entries; `getUserTradeData()` may need extension for Manage Binder data
- `src/lib/binder-logic.ts` — `calculateLookingFor()` — shared shortfall formula; reused in updated Looking For logic

### Binder API routes
- `src/app/api/binder/route.ts` — GET (returns offerings + wants + exclusions) — response shape will change
- `src/app/api/binder/wants/route.ts` — POST (add/update manual want) — must accept `cardPrintingId` instead of `cardDefinitionId`
- `src/app/api/trade/route.ts` — PATCH (update trade quantity per printing) — already per-printing, reused for Card Detail trade section

### Card Detail page
- `src/app/cards/[set-code]/[card-number]/page.tsx` — Server Component; trade section added in image column below `VariantCollectionSection`
- `src/db/queries/card-detail.ts` — `getSameSetPrintingsWithCounts()` — extend to also return `tradeQuantity` from `user_trade_offerings`
- `src/components/catalog/variant-collection-section.tsx` — established per-variant row UI pattern; trade section mirrors this layout

### Manage Binder page
- `src/app/binder/manage/page.tsx` — redesigned for collection-driven discovery; card grid data source changes
- `src/components/binder/manage-trade-card.tsx` — existing card tile with variant badge and trade controls; reuse in the owned-card browse grid
- `src/components/binder/manage-wants-list.tsx` — wants row UI; manual wants flow gets variant chip selector

### Public binder page
- `src/app/binder/[username]/page.tsx` — passes `lookingFor` to `PublicBinderClient`; no changes to component itself, just data shape
- `src/components/binder/public-binder-client.tsx` — renders Looking For section via `CardGrid` in binder mode; `lookingFor` tiles will now include per-printing entries with `variantType`

### Prior phase context (reference only)
- `src/db/queries/catalog.ts` — owned-card art logic from Phase 18 (highest-owned variant art selection) — use same precedence logic for Manage Binder browse tiles
- `.planning/milestones/v4-phases/21-binder-variant-badges/` — Phase 21 CONTEXT.md + plans (user_trade_offerings schema, per-variant offering model, ManageTradeCard badge pattern)

### v5 milestone roadmap
- `.planning/milestones/v5-ROADMAP.md` — Phase 23 success criteria (BINDER-07, BINDER-08, BINDER-09)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `VariantCollectionSection` (`src/components/catalog/variant-collection-section.tsx`) — per-variant row pattern with +/- controls; the Card Detail trade section mirrors this exactly
- `ManageTradeCard` (`src/components/binder/manage-trade-card.tsx`) — card tile with variant badge (top-left) and quantity badge (top-right); reuse in the owned-card browse grid
- `calculateLookingFor()` (`src/lib/binder-logic.ts`) — shortfall formula; reuse in updated Looking For logic
- `ManageWantsList` (`src/components/binder/manage-wants-list.tsx`) — existing wants row UI; extend with variant chip selector
- `VariantFilter` (`src/components/catalog/variant-filter.tsx`) — chip-style variant selector; may be reusable for the variant picker in manual wants flow
- `/api/trade` PATCH — already accepts `cardPrintingId` + `quantity`; reused directly by the Card Detail trade section

### Established Patterns
- Per-variant rows: `VariantCollectionSection` pattern (one row per `printing`, label = variant type, +/- controls, optimistic state update via Client Component)
- Binder mode badges: `ManageTradeCard` (quantity badge top-right, variant badge top-left if not Normal)
- Owned-only art selection: catalog grid uses `getPrintingArtMap()` / highest-owned precedence from Phase 18
- Client-side data fetch in Manage Binder: existing `useEffect` fetches `/api/binder` + `/api/cards/all` on mount; pattern stays, just data source changes
- shadcn/ui `Sheet` component exists in the project for side panels

### Integration Points
- `src/app/cards/[set-code]/[card-number]/page.tsx` — new trade section component added below `VariantCollectionSection` (lines ~76-78)
- `src/app/binder/manage/page.tsx` — owned-card browse replaces `allCards` state / `/api/cards/all` fetch
- `src/db/queries/binder.ts` — `getPublicBinderData()` updated for per-printing Looking For
- Database migration needed: `tradeManualWants` PK change from `(userId, cardDefinitionId)` to `(userId, cardPrintingId)`

</code_context>

<specifics>
## Specific Ideas

- Manual wants variant picker: search by card name (card-definition search, same as today), then show variant chips for that card's printings. User clicks chip to select variant. Chip style similar to the variant filter chips in the catalog sidebar.
- Manage Binder browse tiles: same card grid as the catalog's owned-only view — show card art using highest-owned-variant precedence
- Card Detail trade section heading: "Available for Trade" (matches the public binder section label)
- `tradeManualWants` schema migration must be done carefully: map existing rows to Normal printing ID before dropping the old constraint

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope.

</deferred>

---

*Phase: 23-binder-variant-completeness*
*Context gathered: 2026-05-25*

# Phase 21: Binder Variant Badges - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Schema migration to support per-variant trade offerings: replace `userCollections.tradeQuantity` (keyed by `cardDefinitionId`) with a new `user_trade_offerings` table keyed by `(userId, cardPrintingId)`. Existing binder data migrates to the Normal variant. Public binder tiles render the actual variant's art plus a variant type badge for non-Normal offerings.

</domain>

<decisions>
## Implementation Decisions

### New Table Schema
- **D-01:** Create `user_trade_offerings` table with `(userId, cardPrintingId, quantity)` — same shape as `userPrintingCollections`. Composite PK on `(userId, cardPrintingId)`. This is the new source of truth for what a user is offering to trade.
- **D-02:** Drop `userCollections.tradeQuantity` column after migration (clean break — no two sources of truth). All reads and writes to this column are removed from `getUserTradeData`, `getPublicBinderData`, `upsertTradeQuantity`, and the PATCH `/api/trade` route.

### Data Migration
- **D-03:** Migration runs atomically via a custom SQL block in the Drizzle migration file: `INSERT INTO user_trade_offerings (user_id, card_printing_id, quantity) SELECT uc.user_id, cp.id, uc.trade_quantity FROM user_collections uc JOIN card_printings cp ON cp.card_definition_id = uc.card_definition_id WHERE cp.variant_type = 'Normal' AND uc.trade_quantity > 0`. Runs as part of `npx drizzle-kit push` — pre-migration data preserved as Normal variant offerings.

### Public Binder — Variant Art & Badge
- **D-04:** Public binder offering tiles show the actual variant's art URL (from `card_printings` for the specific `cardPrintingId` being offered), plus a variant type badge for non-Normal variants. `getPublicBinderData` queries `user_trade_offerings` directly, joins to `card_printings` to get `frontArtUrl` and `variantType`, and includes both in the returned offering shape.
- **D-05:** Add `variantType?: string` to `CardItemProps`. Render the badge only in `mode='binder'`. Consistent with the existing badge in `ManageTradeCard` (same style: `bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase`).

### Multi-Variant Display
- **D-06:** If a user offers both a Normal and a Foil of the same card, the public binder shows **2 separate tiles** — one per `cardPrintingId`. No grouping logic needed; the query naturally returns one row per offering.

### Manage Page — API Contract
- **D-07:** Add `printingId: cardPrintings.id` to `getAllCards()` return shape and expose via `/api/cards/all`. The manage binder page uses `card.printingId` when calling the trade API. The PATCH `/api/trade` route changes from `{ cardDefinitionId, tradeQuantity }` to `{ cardPrintingId, tradeQuantity }`.

### Claude's Discretion
- Whether to update `getAllCards()` in place or create a separate query for binder search — planner decides based on caller impact.
- Whether `upsertTradeOffering` is a new query function in `trade.ts` or inline in the API route — planner decides following existing patterns.
- Whether the manage page's optimistic state update (currently keyed by `cardDefinitionId`) migrates to `cardPrintingId` as the key — planner decides.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema & Queries
- `src/db/schema.ts` — `userCollections` (tradeQuantity column to remove), `userPrintingCollections` (template for new table shape), `cardPrintings` (variantType, frontArtUrl)
- `src/db/queries/trade.ts` — `getUserTradeData`, `upsertTradeQuantity` — both require full rewrite to use `user_trade_offerings`
- `src/db/queries/binder.ts` — `getPublicBinderData` — offerings query rewritten to join `user_trade_offerings` → `card_printings`
- `src/db/queries/catalog.ts` — `getAllCards()` — add `printingId: cardPrintings.id` to the SELECT

### API Routes
- `src/app/api/trade/route.ts` — PATCH changes from `cardDefinitionId` → `cardPrintingId`
- `src/app/api/cards/all/route.ts` — expose `printingId` from updated `getAllCards()`
- `src/app/api/binder/route.ts` — verify it reads from the new table correctly

### Binder Components
- `src/components/binder/manage-trade-card.tsx` — existing variant badge pattern (lines 93–98) — match this style in `CardItem`
- `src/components/binder/public-binder-client.tsx` — passes offerings to `CardGrid` with `mode="binder"`
- `src/components/catalog/card-item.tsx` — add `variantType?: string` prop + badge render in binder mode
- `src/app/binder/manage/page.tsx` — update `updateTradeQuantity` to use `card.printingId`, update `AllCard` interface

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 21 — 3 success criteria (printingId storage, public binder badge, clean migration)
- `.planning/REQUIREMENTS.md` — REQ-BINDER-06 (variant badge on offering tiles)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `userPrintingCollections` table in `src/db/schema.ts` — exact template for the new `user_trade_offerings` table (`userId + cardPrintingId` composite PK, `quantity` column)
- Variant badge in `src/components/binder/manage-trade-card.tsx` (lines 93–98) — copy this style verbatim for `CardItem`'s binder-mode badge
- `upsertVariantCount` / `recomputeTotal` pattern in `src/db/queries/collection.ts` — template for the new `upsertTradeOffering` query

### Established Patterns
- **No DB transactions:** Neon HTTP driver — sequential awaits only. The schema push + data migration SQL runs as part of `drizzle-kit push`, which handles this natively.
- **Auth check:** `auth.api.getSession({ headers: await headers() })` in every API route — unchanged.
- **No Radix UI:** badge is plain `<div>` with Tailwind — no new imports needed.
- **Drizzle migration SQL:** see Phase 17's `17-07-PLAN.md` for the `npx drizzle-kit push` pattern.

### Integration Points
- **`getPublicBinderData`** currently joins `userCollections WHERE variantType = 'Normal'` for art — after Phase 21, joins `user_trade_offerings → card_printings` directly (no variant filter needed; the printing row carries the art and variant type)
- **Manage page `AllCard` interface** — gains `printingId: number` field
- **`CardGrid`** receives `CardForFilter[]` which already has `variantType?: string` — threads through to `CardItem` without interface change to `CardGrid`
- **`/api/trade` PATCH** — replace `upsertTradeQuantity` call with new `upsertTradeOffering(userId, cardPrintingId, quantity)` 

</code_context>

<specifics>
## Specific Ideas

- The Drizzle migration SQL for data migration must account for cards where no Normal variant exists (unlikely for SWU but defensive: use LEFT JOIN and skip rows with no matching printing).
- Badge style to copy from `ManageTradeCard`: `absolute top-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-bold shadow-md z-20 pointer-events-none uppercase` — exact same positioning and styling in `CardItem`.
- The manage binder page currently keys the `offerings` optimistic state by `cardDefinitionId`. After Phase 21, it must key by `cardPrintingId` (since two variants of the same card can both be in the binder).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 21-Binder-Variant-Badges*
*Context gathered: 2026-05-21*

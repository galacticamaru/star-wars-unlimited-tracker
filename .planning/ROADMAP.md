# Roadmap: Star Wars Unlimited Tracker

## Milestones

- ✅ **v1 MVP** — Phases 1–5.2 (shipped 2026-05-07) · [Archive](milestones/v1-ROADMAP.md)
- ✅ **v2 Multi-User, Market, Decks & Trading** — Phases 6–10.1 (shipped 2026-05-12) · [Archive](milestones/v2-ROADMAP.md)
- ✅ **v3 Catalog, Home & Binder Polish** — Phases 11–14 (shipped 2026-05-13) · [Archive](milestones/v3-ROADMAP.md)
- ✅ **v4 Deck Builder & Collection Depth** — Phases 15–22 (all complete 2026-05-23)

## Phases

<details>
<summary>✅ v1 MVP (Phases 1–5.2) — SHIPPED 2026-05-07</summary>

See [milestones/v1-ROADMAP.md](milestones/v1-ROADMAP.md) for full details.

</details>

<details>
<summary>✅ v2 Multi-User, Market, Decks & Trading (Phases 6–10.1) — SHIPPED 2026-05-12</summary>

See [milestones/v2-ROADMAP.md](milestones/v2-ROADMAP.md) for full details.

</details>

<details>
<summary>✅ v3 Catalog, Home & Binder Polish (Phases 11–14) — SHIPPED 2026-05-13</summary>

- [x] **Phase 11: New Home Page** — Route refactor (/cards), Hero section, and High Value card grid (3/3 plans)
- [x] **Phase 12: Catalog Evolution** — Sticky sidebar filters, variant support, and TS26 set (3/3 plans)
- [x] **Phase 13: Advanced Filters** — Owned-only filter in catalog and deck builder (3/3 plans)
- [x] **Phase 14: Trade Binder Polish** — Full-width layouts and automatic want management (3/3 plans)

See [milestones/v3-ROADMAP.md](milestones/v3-ROADMAP.md) for full details.

</details>

### v4 Deck Builder & Collection Depth (Phases 15–20)

- [x] **Phase 15: Deck List Display Polish** — Card type grouping, aspect breakdown panel, and card art in the deck list view (2026-05-14)
- [x] **Phase 16: Empty Deck Guided Onboarding** — Auto-filter flow that guides users from leader+base selection through aspect-filtered card browsing (2026-05-15)
- [x] **Phase 17: Variant Collection Tracking** — Per-variant owned counts viewed and updated on the card detail page (2026-05-18)
- [x] **Phase 17.1: Card Sync Variant Grouping** — Refactor upsertCards to in-memory grouping; all variant types correctly linked in card_printings (2026-05-20)
- [x] **Phase 18: Catalog Collection Enhancements** — Catalog grid shows highest-owned variant art; quick-add all cards from a starter deck (2026-05-20)
- [x] **Phase 19: Variant Filter Enhancements** — Unified variant filtering across the entire app; Foil/Hyperspace Foil added; variant badges in trade binder (2026-05-20)
- [x] **Phase 20: CSV Variant Imports** — CSV import updated to support all four variant types via array-based variant lookup (2026-05-20)
- [x] **Phase 21: Binder Variant Badges** — Schema migration to support per-variant trade offerings; variant type badges on public binder cards (INSERTED — REQ-BINDER-06 gap closure) (2026-05-23)
- [x] **Phase 22: Starter Deck Expansions** — Add TS26, IBH, and LAW/SEC spotlight decks to the Quick Add feature; corrected all starter/spotlight deck card lists (2026-05-23)

## Phase Details

### Phase 15: Deck List Display Polish
**Goal**: The deck list view is visually rich — cards are grouped by type, the sidebar shows aspect distribution, and art appears on every card row
**Depends on**: Phase 14 (v3 complete)
**Requirements**: REQ-DECK-07, REQ-DECK-08, REQ-DECK-10
**Success Criteria** (what must be TRUE):
  1. Deck List tab renders separate sections for Ground Units, Space Units, Upgrades, and Events, each with its own header and count
  2. Deck stats sidebar includes an aspect pip breakdown panel showing distribution across all aspects in the deck
  3. Leader and Base card images are visible as full card art in the Deck List tab
  4. Hovering any non-Leader/Base card row in the Deck List tab shows that card's art
**Plans**: 3 plans
Plans:
- [x] 15-01-PLAN.md — Wave 0 test stubs + type-grouped card sections in deck-builder.tsx (REQ-DECK-07)
- [x] 15-02-PLAN.md — Leader/Base art slots + hover art preview panel in deck-builder.tsx (REQ-DECK-10)
- [x] 15-03-PLAN.md — Aspect breakdown panel in deck-sidebar.tsx (REQ-DECK-08)
**UI hint**: yes

### Phase 15.1: order each cardRow in a decklist by cost ascending. (INSERTED)

**Goal:** Deck list card rows in all sections are ordered by cost ascending, then alphabetically by name
**Requirements**: (polish)
**Depends on:** Phase 15
**Plans:** 1 plan

Plans:
- [x] 15.1-01-PLAN.md — Sort mainDeck and sideboard arrays by cost ascending (2026-05-15)

### Phase 16: Empty Deck Guided Onboarding
**Goal**: A user starting with an empty deck is guided — the card browser intelligently filters first to Leader and Base cards, then narrows to the aspects of the chosen leader and base combination
**Depends on**: Phase 15
**Requirements**: REQ-DECK-09
**Success Criteria** (what must be TRUE):
  1. When a deck has no leader or base selected, the card browser automatically pre-filters to show only Leader and Base card types
  2. After a leader and base are selected, the card browser automatically filters to cards matching the combined aspects of that leader+base pair
  3. The user can override the auto-filter at any time without the browser reverting unexpectedly
**Plans**: 4 plans
Plans:
**Wave 1**
- [x] 16-01-PLAN.md — Wave 1 TDD: pure `computeAutoFilter` + `computeAutoFilterLabel` in `src/lib/auto-filter.ts` with unit tests (REQ-DECK-09 / D-01, D-08, D-09)

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 16-02-PLAN.md — Wave 2: SidebarFilters `autoFilterLabel` prop + Badge chip render (REQ-DECK-09 / D-09, D-10)
- [x] 16-03-PLAN.md — Wave 2: CatalogClient auto-filter useEffect, override-detection handlers, and `autoFilterLabel` threading (REQ-DECK-09 / D-02, D-03, D-06, D-07)

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 16-04-PLAN.md — Wave 3: DeckBuilder state + memos + dispatch-site resets + CTA rename to "Add Cards" (REQ-DECK-09 / D-04, D-05, D-11)
**UI hint**: yes

### Phase 16.1: Reorder Deck Tabs (INSERTED)

**Goal:** Tab order changes to Deck List → Add Cards → Want List; default active tab changes from Add Cards to Deck List
**Requirements:** (polish)
**Depends on:** Phase 16
**Plans:** 1 plan

Plans:
- [x] 16.1-01-PLAN.md — Reorder tab buttons and change useState default to 'editor' in deck-builder.tsx (D-01, D-02, D-03, D-04) (2026-05-15)

### Phase 17: Variant Collection Tracking
**Goal**: Users can view and manage how many copies they own of each variant of a card on that card's detail page
**Depends on**: Phase 14 (v3 complete)
**Requirements**: REQ-COLLECT-06, REQ-COLLECT-07
**Success Criteria** (what must be TRUE):
  1. The card detail page lists each available variant (Standard, Showcase, Prestige, Serialized) with the user's current owned count next to each
  2. User can increment the owned count for any individual variant directly on the card detail page
  3. User can decrement the owned count for any individual variant (down to zero) directly on the card detail page
  4. Changes to per-variant counts persist and are reflected immediately without a full page reload
**Plans**: 10 plans (+ 2 gap-closure)

Plans:

**Wave 0**
- [x] 17-01-PLAN.md — Test stubs + DB suffix lookup (Wave 0): normalize.test.ts, collection-shape.test.ts, collection-shape.ts stub (REQ-COLLECT-06, REQ-COLLECT-07)

**Wave 1** *(blocked on Wave 0)*
- [x] 17-02-PLAN.md — DB schema (userPrintingCollections table) + query helpers (upsertVariantCount, recomputeTotal, getSameSetPrintingsWithCounts, updated getUserCollection) + buildCollectionMap implementation (REQ-COLLECT-06, REQ-COLLECT-07)

**Wave 2** *(blocked on Wave 1, parallel)*
- [x] 17-03-PLAN.md — API routes: POST /api/collection/variants (new), GET /api/collection (updated shape), POST /api/collection (removed per D-03) (REQ-COLLECT-06, REQ-COLLECT-07)
- [x] 17-04-PLAN.md — Consumer migration: CatalogClient, WantListTab, filter-cards.ts read .total from new GET shape; CatalogClient POST mutation removed (REQ-COLLECT-06)

**Wave 3** *(blocked on Waves 2a + 2b)*
- [x] 17-05-PLAN.md — Card detail page UI: VariantCollectionSection component + page.tsx wiring, CollectionControls removed (REQ-COLLECT-06, REQ-COLLECT-07)

**Wave 4** *(blocked on Wave 1)*
- [x] 17-06-PLAN.md — CSV import update: normalizeRedditCsv per-variant keys, import route writes to user_printing_collections (REQ-COLLECT-06, REQ-COLLECT-07)

**Wave 5 — BLOCKING** *(blocked on all preceding waves)*
- [x] 17-07-PLAN.md — `npx drizzle-kit push` — schema push to live Neon DB (REQ-COLLECT-06, REQ-COLLECT-07)

**Wave 6** *(blocked on Wave 5)*
- [x] 17-08-PLAN.md — Human verification checkpoint: card detail page visual + functional check + catalog regression check (REQ-COLLECT-06, REQ-COLLECT-07)

**Wave 7 — Gap Closure** *(blocked on Wave 6)*
- [ ] 17-09-PLAN.md — Fix upsert-cards.ts Pass 2 swudbId fallback + data repair SQL for orphaned SEC/SOR Foil rows (REQ-COLLECT-06, REQ-COLLECT-07)

**Wave 8 — Gap Closure** *(blocked on Wave 7)*
- [ ] 17-10-PLAN.md — Re-seed DB + UAT Test 9 re-verification (REQ-COLLECT-06, REQ-COLLECT-07)

Cross-cutting constraints:
- `userId` always from `session.user.id`, never from request body (auth on every API route)
- `Math.max(0, count)` floor on every variant count mutation
- GET /api/collection consumers read `.total` not raw number after shape change (CatalogClient, WantListTab)
- No DB transactions — Neon HTTP driver requires sequential awaits (upsert then recompute)

**UI hint**: yes

### Phase 17.1: Card Sync Variant Grouping (INSERTED)

**Goal**: Replace the fragile two-pass seeding logic in `upsertCards` with in-memory variant grouping by (Name, Subtitle), so all variants of a card reliably share the same `card_definition_id` regardless of set numbering conventions
**Depends on**: Phase 17
**Requirements**: (data integrity)
**Success Criteria** (what must be TRUE):
  1. `upsertCards` groups all API-returned variants by (Name, Subtitle) in memory before any DB operations — no cross-DB name lookup inside the loop
  2. All variant types (Normal, Foil, Hyperspace, Showcase, Prestige, etc.) for the same card share a single `card_definition_id` in `card_printings`
  3. Re-seeding is self-healing: running `npm run db:seed` again corrects any orphaned `card_definition_id` values in `card_printings`
  4. Promo-only sets (no Normal variant present) seed correctly using the lowest collectorNumber as the definition anchor
  5. After re-seed: 0 orphaned Foil/variant rows across all sets (verified by the orphan-check query)
**Plans**: 2 plans

Plans:

**Wave 1**
- [x] 17.1-01-PLAN.md — Rewrite upsertCards with in-memory variant grouping; add cardDefinitionId to card_printings onConflictDoUpdate (2026-05-20)

**Wave 2** *(blocked on Wave 1)*
- [x] 17.1-02-PLAN.md — Re-seed DB + orphan-check query verification + human checkpoint (2026-05-20)

### Phase 18: Catalog Collection Enhancements
**Goal**: The catalog surface reflects variant ownership in its art display, and users can seed their collection from a known starter deck in one click
**Depends on**: Phase 17
**Requirements**: REQ-COLLECT-08, REQ-CAT-04
**Success Criteria** (what must be TRUE):
  1. A catalog card tile displays the art of whichever variant the user owns the most copies of; if the user owns no copies, it falls back to Standard art
  2. User can trigger a single action to add all cards from a named pre-constructed starter deck to their collection
  3. After the quick-add action completes, the user receives confirmation of how many cards were added
**Plans**: 3 plans
Plans:
**Wave 1**
- [x] 18-01-PLAN.md — Starter Deck Quick-Add (REQ-CAT-04)
- [x] 18-02-PLAN.md — Catalog Variant Art Display (REQ-COLLECT-08)

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 18-03-PLAN.md — Expand starter-decks.ts: add deckType field + JTL/LOF/SEC Spotlight Decks (REQ-CAT-04)
**UI hint**: yes

### Phase 20: CSV Variant Imports
**Goal**: Update CSV imports to support all four variant types
**Depends on**: Phase 19 (or parallel)
**Requirements**: REQ-COLLECT-09
**Success Criteria** (what must be TRUE):
  1. The normalizer returns variant objects.
  2. The API route correctly looks up variant printingIds and upserts counts.
**Plans**: 1 plan
Plans:
- [x] 20-01-PLAN.md — CSV Import refactor to array-based variant lookup (REQ-COLLECT-09)

### Phase 19: Variant Filter Enhancements
**Goal**: Unified and complete variant filtering across the entire application, with clear visual identification of variants in the trade binder
**Depends on**: Phase 18
**Requirements**: REQ-FILTER-01, REQ-BINDER-05, REQ-BINDER-06
**Success Criteria** (what must be TRUE):
  1. `VariantFilter` includes "Foil" and "Hyperspace Foil" as selectable options
  2. Public binder and Deck Builder correctly track and apply the variant filter state
  3. The Trade Binder management page includes a variant filter next to the card search
  4. Cards in the trade binder offerings display a "Foil", "Showcase", etc. badge if they are not "Normal"
**Plans**: 2 plans

Plans:
**Wave 1**
- [x] 19-01-PLAN.md — Update VariantFilter component and public/deck-builder state tracking (REQ-FILTER-01)

**Wave 2** *(blocked on Wave 1)*
- [x] 19-02-PLAN.md — Trade Binder filters + variant badges on trade cards (REQ-BINDER-05, REQ-BINDER-06)

### Phase 21: Binder Variant Badges (INSERTED)

**Goal**: Trade binder offerings display a variant type badge when the variant is not "Normal", closing REQ-BINDER-06
**Depends on**: Phase 19
**Requirements**: REQ-BINDER-06
**Success Criteria** (what must be TRUE):
  1. Each trade offering record in the binder stores the specific `card_printing_id` (not just `card_definition_id`)
  2. The public binder renders a "Foil", "Showcase", etc. badge on each offering tile that is not Normal variant
  3. Existing binder data migrates cleanly — pre-migration offerings treated as Normal
**Plans**: 4 plans

Plans:

**Wave 0**
- [x] 21-01-PLAN.md — Extend card-item.test.tsx with 2 failing badge tests (REQ-BINDER-06)

**Wave 1** *(blocked on Wave 0)*
- [x] 21-02-PLAN.md — DB layer: add userTradeOfferings table, rewrite trade/binder/catalog queries (REQ-BINDER-06)
- [x] 21-03-PLAN.md — API + UI layer: PATCH /api/trade, /api/cards/all, CardItem badge, manage/page.tsx interfaces (REQ-BINDER-06)

**Wave 2** *(blocked on Wave 1)*
- [x] 21-04-PLAN.md — [BLOCKING] drizzle-kit push + data migration SQL + human smoke verification (REQ-BINDER-06)

Cross-cutting constraints:
- `userId` always from `session.user.id`, never from request body
- `Math.max(0, tradeQuantity)` floor on every trade quantity mutation
- No DB transactions — Neon HTTP driver requires sequential awaits
- `drizzle-kit push` is DDL-only — data migration SQL must run as a separate explicit step after push

**UI hint**: yes

### Phase 22: Starter Deck Expansions (INSERTED)

**Goal**: The Quick Add feature includes all TS26 preconstructed decks and IBH decks so users can seed their collection from the full range of pre-built products
**Depends on**: Phase 18
**Requirements**: REQ-CAT-04 (extension)
**Success Criteria** (what must be TRUE):
  1. All TS26 preconstructed deck entries are added to `starter-decks.ts` with correct collector numbers and deckType
  2. All IBH deck entries are added to `starter-decks.ts` with correct collector numbers and deckType
  3. New decks appear in the Quick Add dropdown on the Collection page and add cards correctly
**Plans**: 3 plans

Plans:

**Wave 1**
- [ ] 22-01-PLAN.md — Add 4 TS26 Twin Suns precon entries + remove deferred comment block (REQ-CAT-04)

**Wave 2** *(blocked on Wave 1)*
- [ ] 22-02-PLAN.md — Add 2 IBH starter decks + SEC Padmé Amidala spotlight (REQ-CAT-04)

**Wave 3** *(blocked on Wave 2)*
- [ ] 22-03-PLAN.md — DB lookup + add LAW Jabba the Hutt + LAW Leia Organa spotlight decks (REQ-CAT-04)

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1–5.2 | v1 | 22/22 | ✅ Complete | 2026-05-07 |
| 6–10.1 | v2 | 16/16 | ✅ Complete | 2026-05-12 |
| 11 | v3 | 3/3 | ✅ Complete | 2026-05-12 |
| 12 | v3 | 3/3 | ✅ Complete | 2026-05-13 |
| 13 | v3 | 3/3 | ✅ Complete | 2026-05-13 |
| 14 | v3 | 3/3 | ✅ Complete | 2026-05-13 |
| 15 | v4 | 3/3 | ✅ Complete | 2026-05-14 |
| 15.1 | v4 | 1/1 | ✅ Complete | 2026-05-15 |
| 16 | v4 | 4/4 | ✅ Complete | 2026-05-15 |
| 16.1 | v4 | 1/1 | ✅ Complete | 2026-05-15 |
| 17 | v4 | 10/10 | ✅ Complete | 2026-05-20 |
| 17.1 | v4 | 2/2 | ✅ Complete | 2026-05-20 |
| 18 | v4 | 3/3 | ✅ Complete | 2026-05-20 |
| 19 | v4 | 2/2 | ✅ Complete | 2026-05-20 |
| 20 | v4 | 1/1 | ✅ Complete | 2026-05-20 |
| 21 | v4 | 0/4 | ⬜ Ready to execute | - |
| 22 | v4 | 0/3 | ⬜ Not started | - |

# Milestone v4: Deck Builder & Collection Depth

**Status:** ✅ SHIPPED 2026-05-23
**Phases:** 15–22 (incl. 15.1, 16.1, 17.1 — decimal polish + gap-closure inserts)
**Total Plans:** 34

## Overview

Deep deck builder and collection improvements: card type grouping with art, guided empty-deck onboarding, per-variant collection tracking with +/- controls, catalog variant art display, starter deck quick-add, unified variant filtering, CSV variant import, and a full schema migration to per-variant trade offerings with binder variant badges.

---

## Phases

### Phase 15: Deck List Display Polish

**Goal:** The deck list view is visually rich — cards are grouped by type, the sidebar shows aspect distribution, and art appears on every card row
**Depends on:** Phase 14 (v3 complete)
**Requirements:** REQ-DECK-07, REQ-DECK-08, REQ-DECK-10
**Plans:** 3 plans

**Wave 1**
- [x] 15-01-PLAN.md — Wave 0 test stubs + type-grouped card sections in deck-builder.tsx (REQ-DECK-07)

**Wave 2** *(blocked on Wave 1)*
- [x] 15-02-PLAN.md — Leader/Base art slots + hover art preview panel in deck-builder.tsx (REQ-DECK-10)
- [x] 15-03-PLAN.md — Aspect breakdown panel in deck-sidebar.tsx (REQ-DECK-08)

---

### Phase 15.1: Cost Sort (INSERTED)

**Goal:** Deck list card rows in all sections are ordered by cost ascending, then alphabetically by name
**Depends on:** Phase 15
**Requirements:** (polish)
**Plans:** 1 plan

- [x] 15.1-01-PLAN.md — Sort mainDeck and sideboard arrays by cost ascending (2026-05-15)

---

### Phase 16: Empty Deck Guided Onboarding

**Goal:** A user starting with an empty deck is guided — the card browser intelligently filters first to Leader and Base cards, then narrows to the aspects of the chosen leader and base combination
**Depends on:** Phase 15
**Requirements:** REQ-DECK-09
**Plans:** 4 plans

**Wave 1**
- [x] 16-01-PLAN.md — Wave 1 TDD: pure `computeAutoFilter` + `computeAutoFilterLabel` in `src/lib/auto-filter.ts` with unit tests (REQ-DECK-09)

**Wave 2** *(blocked on Wave 1)*
- [x] 16-02-PLAN.md — SidebarFilters `autoFilterLabel` prop + Badge chip render (REQ-DECK-09)
- [x] 16-03-PLAN.md — CatalogClient auto-filter useEffect, override-detection handlers, and `autoFilterLabel` threading (REQ-DECK-09)

**Wave 3** *(blocked on Wave 2)*
- [x] 16-04-PLAN.md — DeckBuilder state + memos + dispatch-site resets + CTA rename to "Add Cards" (REQ-DECK-09)

---

### Phase 16.1: Reorder Deck Tabs (INSERTED)

**Goal:** Tab order changes to Deck List → Add Cards → Want List; default active tab changes from Add Cards to Deck List
**Depends on:** Phase 16
**Requirements:** (polish)
**Plans:** 1 plan

- [x] 16.1-01-PLAN.md — Reorder tab buttons and change useState default to 'editor' in deck-builder.tsx (2026-05-15)

---

### Phase 17: Variant Collection Tracking

**Goal:** Users can view and manage how many copies they own of each variant of a card on that card's detail page
**Depends on:** Phase 14 (v3 complete)
**Requirements:** REQ-COLLECT-06, REQ-COLLECT-07
**Plans:** 10 plans (+ 2 gap-closure)

**Wave 0**
- [x] 17-01-PLAN.md — Test stubs + DB suffix lookup: normalize.test.ts, collection-shape.test.ts, collection-shape.ts stub

**Wave 1** *(blocked on Wave 0)*
- [x] 17-02-PLAN.md — DB schema (userPrintingCollections table) + query helpers (upsertVariantCount, recomputeTotal, getSameSetPrintingsWithCounts, updated getUserCollection) + buildCollectionMap implementation

**Wave 2** *(blocked on Wave 1, parallel)*
- [x] 17-03-PLAN.md — API routes: POST /api/collection/variants (new), GET /api/collection (updated shape), POST /api/collection (removed per D-03)
- [x] 17-04-PLAN.md — Consumer migration: CatalogClient, WantListTab, filter-cards.ts read .total from new GET shape; CatalogClient POST mutation removed

**Wave 3** *(blocked on Waves 2a + 2b)*
- [x] 17-05-PLAN.md — Card detail page UI: VariantCollectionSection component + page.tsx wiring, CollectionControls removed

**Wave 4** *(blocked on Wave 1)*
- [x] 17-06-PLAN.md — CSV import update: normalizeRedditCsv per-variant keys, import route writes to user_printing_collections

**Wave 5 — BLOCKING** *(blocked on all preceding waves)*
- [x] 17-07-PLAN.md — `npx drizzle-kit push` — schema push to live Neon DB

**Wave 6** *(blocked on Wave 5)*
- [x] 17-08-PLAN.md — Human verification checkpoint: card detail page visual + functional check + catalog regression check

**Wave 7 — Gap Closure** *(blocked on Wave 6)*
- [x] 17-09-PLAN.md — Fix upsert-cards.ts Pass 2 swudbId fallback + data repair SQL for orphaned SEC/SOR Foil rows

**Wave 8 — Gap Closure** *(blocked on Wave 7)*
- [x] 17-10-PLAN.md — Re-seed DB + UAT Test 9 re-verification

Cross-cutting constraints:
- `userId` always from `session.user.id`, never from request body
- `Math.max(0, count)` floor on every variant count mutation
- GET /api/collection consumers read `.total` not raw number after shape change
- No DB transactions — Neon HTTP driver requires sequential awaits

---

### Phase 17.1: Card Sync Variant Grouping (INSERTED)

**Goal:** Replace the fragile two-pass seeding logic in `upsertCards` with in-memory variant grouping by (Name, Subtitle), so all variants of a card reliably share the same `card_definition_id`
**Depends on:** Phase 17
**Requirements:** (data integrity)
**Plans:** 2 plans

**Wave 1**
- [x] 17.1-01-PLAN.md — Rewrite upsertCards with in-memory variant grouping; add cardDefinitionId to card_printings onConflictDoUpdate (2026-05-20)

**Wave 2** *(blocked on Wave 1)*
- [x] 17.1-02-PLAN.md — Re-seed DB + orphan-check query verification + human checkpoint (2026-05-20)

---

### Phase 18: Catalog Collection Enhancements

**Goal:** The catalog surface reflects variant ownership in its art display, and users can seed their collection from a known starter deck in one click
**Depends on:** Phase 17
**Requirements:** REQ-COLLECT-08, REQ-CAT-04
**Plans:** 3 plans

**Wave 1**
- [x] 18-01-PLAN.md — Starter Deck Quick-Add: POST /api/collection/starter-deck + starter-decks.ts static data + Collection page UI (REQ-CAT-04)
- [x] 18-02-PLAN.md — Catalog Variant Art Display: getPrintingArtMap() + CatalogClient art override (REQ-COLLECT-08)

**Wave 2** *(blocked on Wave 1)*
- [x] 18-03-PLAN.md — Expand starter-decks.ts: add deckType field + JTL/LOF/SEC Spotlight Decks (REQ-CAT-04)

---

### Phase 19: Variant Filter Enhancements

**Goal:** Unified and complete variant filtering across the entire application, with clear visual identification of variants in the trade binder
**Depends on:** Phase 18
**Requirements:** REQ-FILTER-01, REQ-BINDER-05, REQ-BINDER-06
**Plans:** 2 plans

**Wave 1**
- [x] 19-01-PLAN.md — Update VariantFilter component and public/deck-builder state tracking (REQ-FILTER-01)

**Wave 2** *(blocked on Wave 1)*
- [x] 19-02-PLAN.md — Trade Binder filters + variant badges on trade cards (REQ-BINDER-05; REQ-BINDER-06 partially — offerings were cardDefinitionId-scoped, not per-variant)

---

### Phase 20: CSV Variant Imports

**Goal:** Update CSV imports to support all four variant types
**Depends on:** Phase 19 (or parallel)
**Requirements:** REQ-COLLECT-09
**Plans:** 1 plan

- [x] 20-01-PLAN.md — CSV Import refactor to array-based variant lookup (REQ-COLLECT-09)

---

### Phase 21: Binder Variant Badges (INSERTED)

**Goal:** Trade binder offerings display a variant type badge when the variant is not "Normal", closing REQ-BINDER-06
**Depends on:** Phase 19
**Requirements:** REQ-BINDER-06
**Plans:** 4 plans

**Wave 0**
- [x] 21-01-PLAN.md — Extend card-item.test.tsx with 2 failing badge tests (Nyquist gate)

**Wave 1** *(blocked on Wave 0)*
- [x] 21-02-PLAN.md — DB layer: add userTradeOfferings table, rewrite trade/binder/catalog queries
- [x] 21-03-PLAN.md — API + UI layer: PATCH /api/trade, /api/cards/all, CardItem badge, manage/page.tsx interfaces

**Wave 2** *(blocked on Wave 1)*
- [x] 21-04-PLAN.md — [BLOCKING] drizzle-kit push + data migration SQL + human smoke verification

Cross-cutting constraints:
- `userId` always from `session.user.id`, never from request body
- `Math.max(0, tradeQuantity)` floor on every trade quantity mutation
- No DB transactions — Neon HTTP driver requires sequential awaits
- `drizzle-kit push` is DDL-only — data migration SQL must run as a separate explicit step after push

---

### Phase 22: Starter Deck Expansions (INSERTED)

**Goal:** The Quick Add feature includes all TS26 preconstructed decks and IBH decks so users can seed their collection from the full range of pre-built products
**Depends on:** Phase 18
**Requirements:** REQ-CAT-04 (extension)
**Plans:** 3 plans

**Wave 1**
- [x] 22-01-PLAN.md — Add 4 TS26 Twin Suns precon entries + remove deferred comment block

**Wave 2** *(blocked on Wave 1)*
- [x] 22-02-PLAN.md — Add 2 IBH starter decks + SEC Padmé Amidala spotlight

**Wave 3** *(blocked on Wave 2)*
- [x] 22-03-PLAN.md — DB lookup + add LAW Jabba the Hutt + LAW Leia Organa spotlight decks

---

## Milestone Summary

**Decimal / Inserted Phases:**
- Phase 15.1: Cost Sort (inserted after Phase 15 for quick polish)
- Phase 16.1: Reorder Deck Tabs (inserted after Phase 16 for quick polish)
- Phase 17.1: Card Sync Variant Grouping (inserted after Phase 17 for data integrity)
- Phase 21: Binder Variant Badges (inserted to close REQ-BINDER-06 schema gap found at audit)
- Phase 22: Starter Deck Expansions (inserted to extend REQ-CAT-04 quick-add coverage)

**Key Decisions:**

- `userPrintingCollections` table stores per-variant owned counts keyed by (userId, cardPrintingId)
- `userTradeOfferings` table replaces `tradeQuantity` column in `userCollections` — enables per-printing trade tracking
- `buildCollectionMap()` returns CollectionMap with `.total` and per-variant suffix keys (e.g. `_Foil`, `_Showcase`)
- `getPrintingArtMap()` is a server-side query that returns the best variant art per `cardDefinitionId` based on owned counts + precedence
- In-memory variant grouping in `upsertCards()` — groups by (Name, Subtitle) before any DB ops; eliminates orphaned variant rows
- Starter decks defined as static TypeScript data in `src/data/starter-decks.ts`; Quick Add uses `incrementVariantCount` (additive, never overwrites)
- DDL-first schema migration pattern: `drizzle-kit push` for DDL, then separate SQL for data migration if needed

**Issues Resolved:**

- REQ-BINDER-06: Phase 19 discovered that trade offerings were `cardDefinitionId`-scoped (no per-variant identity); Phase 21 resolved this with a full schema migration to `user_trade_offerings` keyed by `cardPrintingId`
- Orphaned Foil/variant rows in `card_printings` after Phase 17 — resolved by Phase 17.1 in-memory grouping rewrite + DB re-seed

**Issues Deferred (Tech Debt):**

- `CollectionControls` component is dead code (0 imports) — calls deleted `POST /api/collection` endpoint; should be deleted (v5)
- `DeckBuilder` Add Cards tab missing `getPrintingArtMap()` — variant art override not shown in deck builder catalog (v5)
- `Prestige Foil` absent from `VARIANT_OPTIONS` in variant-filter.tsx — cannot filter by Prestige Foil (v5)
- `Serialized` present in filter UI but missing from `VARIANT_PRECEDENCE` — Serialized art never preferred (v5)
- Catalog collection state not invalidated after card detail page mutation — stale art until page reload (v5)
- Starter deck route missing `setCode` guard in collector number lookup — low-risk cross-set collision possible (v5)
- LAW spotlight deck cards 9 entries absent from DB — commented-out TODOs in `starter-decks.ts` (v5, pending DB sync)

**Audit Gaps Acknowledged at Close:**

- Phase 19: no `VERIFICATION.md` (implementation confirmed via SUMMARY.md evidence only)
- Phase 20: no `VERIFICATION.md` (manual verification noted in 20-01-SUMMARY.md)

---

*For current project status, see .planning/ROADMAP.md*

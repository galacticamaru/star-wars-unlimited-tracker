# Roadmap: Star Wars Unlimited Tracker

## Milestones

- ✅ **v1 MVP** — Phases 1–5.2 (shipped 2026-05-07) · [Archive](milestones/v1-ROADMAP.md)
- 📋 **v2** — Phases 6–10 (auth, multi-user, market pricing, deck of the day, sideboard, trade binder)

## Phases

<details>
<summary>✅ v1 MVP (Phases 1–5.2) — SHIPPED 2026-05-07</summary>

- [x] **Phase 1: Foundation** — Project scaffolding, database schema, card catalog sync (4/4 plans) — completed 2026-05-04
- [x] **Phase 2: Card Catalog** — Browse, search, and filter the full card catalog with images (3/3 plans) — completed 2026-05-05
- [x] **Phase 3: Collection** — Track owned card counts and import from CSV formats (4/4 plans + 1 fix) — completed 2026-05-05
- [x] **Phase 4: Deck Builder** — Build legal decks with ownership overlay and missing-card highlights (5/5 plans) — completed 2026-05-06
- [x] **Phase 5: Want List** — See missing cards per deck and combined across all decks (4/4 plans) — completed 2026-05-06
- [x] **Phase 5.1 (INSERTED): Want List Gap Fix** — Include leader and base in want list computation (1/1 plans) — completed 2026-05-07
- [x] **Phase 5.2 (INSERTED): Rarity Filter Fix** — Implement rarity predicate in filterCards() (1/1 plans) — completed 2026-05-07

</details>

### 📋 v2 Multi-User, Market, Decks & Trading (Phases 6–10)

- [x] **Phase 6: Auth & Multi-User** — Per-user accounts with Better Auth; migrate v1 single-user data to first account — completed 2026-05-08
- [x] **Phase 7: Market Pricing** — Card prices (EUR + USD) from pokemon-api.com; deck cost totals; daily cache refresh — completed 2026-05-08
- [ ] ~~**Phase 8: Deck of the Day** — Daily featured tournament deck with ownership overlay and copy-to-library~~ (ABANDONED: swustats.net API issues)
- [x] **Phase 9: Sideboard** — Sideboard support in deck builder with rules enforcement and distinct cost curve display — completed 2026-05-11
- [ ] **Phase 10: Trade Binder** — Public trade binder at /binder/[username] with catalog filters and want section

## Phase Details

### Phase 6: Auth & Multi-User
**Goal**: Users can create accounts and log in; all data is isolated per user; v1 hardcoded userId=1 is fully removed
**Depends on**: Nothing (first v2 phase; all other v2 phases require real userId)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07
**Success Criteria** (what must be TRUE):
  1. User can register with email and password and receive a working account
  2. User can log in with email or Google OAuth or Discord OAuth and remain logged in across browser restarts
  3. User can log out from any page and is returned to the login screen
  4. All collection data and decks are visible only to the owning user — a second registered account sees a clean slate
  5. v1 data (cards, decks) is associated with the first registered account after migration
**Plans**: 4 plans
- [x] 06-01-PLAN.md — Setup Better Auth core, schema, and test scaffolding
- [x] 06-02-PLAN.md — Refactor database queries for user isolation
- [x] 06-03-PLAN.md — Update API routes with session checks
- [x] 06-04-PLAN.md — Implement route protection, migration, and UI integration
**UI hint**: yes

### Phase 7: Market Pricing
**Goal**: Users can see card prices (EUR and USD) on card detail pages, in the deck builder as a total cost, and on the want list as an estimated completion cost
**Depends on**: Phase 6
**Requirements**: MARKET-01, MARKET-02, MARKET-03, MARKET-04
**Success Criteria** (what must be TRUE):
  1. User can open a card detail page and see its current EUR and USD price
  2. User can view the deck builder and see a total deck cost in EUR and USD
  3. User can view their want list and see an estimated cost to acquire all missing cards
  4. Prices are never fetched live — they come from the database cache and update once per day via cron
**Plans**: 4 plans
- [x] 07-01-PLAN.md — Schema & API Infrastructure
- [x] 07-02-PLAN.md — Daily Price Sync Implementation
- [x] 07-03-PLAN.md — Currency Control & Card UI
- [x] 07-04-PLAN.md — Deck & Want List Valuation

### ~~Phase 8: Deck of the Day~~ (ABANDONED)
**Goal**: Users can view a daily featured tournament deck, see which cards they own vs are missing, and copy it into their personal library
**Status**: ABANDONED (2026-05-10) due to swustats.net API endpoints for tournament decks returning 404 or missing card names.

### Phase 9: Sideboard
**Goal**: Users can add a sideboard to any deck, with rules enforcement and distinct visual separation from the main deck
**Depends on**: Phase 6
**Requirements**: SIDE-01, SIDE-02, SIDE-03, SIDE-04
**Success Criteria** (what must be TRUE):
  1. User can mark cards in the deck builder as sideboard cards, distinct from main deck slots
  2. The deck builder prevents adding more than 10 sideboard cards and surfaces a validation message when the limit is reached
  3. The cost curve chart shows sideboard cards in a distinct color from main deck cards
  4. The deck view displays sideboard cards in a separate section below the main deck
**Plans**: 3 plans

**Wave 1**
- [x] 09-01-PLAN.md — Extend validateDeck() with sideboardCostCurve and 10-card limit (TDD)

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 09-02-PLAN.md — Add Move to SB/Main handlers and sideboard section in deck-builder.tsx
- [x] 09-03-PLAN.md — Stack amber sideboard bars on cost curve and update sidebar count in deck-sidebar.tsx
**UI hint**: yes

### Phase 10: Trade Binder
**Goal**: Users can curate a public trade binder from their collection, and anyone can browse it at a shareable URL without logging in
**Depends on**: Phase 6
**Requirements**: TRADE-01, TRADE-02, TRADE-03, TRADE-04, TRADE-05
**Success Criteria** (what must be TRUE):
  1. User can add cards from their collection to their trade binder and set a quantity they are offering
  2. User can update or remove cards from their trade binder at any time
  3. Any visitor can browse the trade binder at /binder/[username] without creating an account
  4. The public binder page supports catalog-style filters (set, type, aspect, arena, rarity) to narrow results
  5. User can list cards they are looking for in a want section alongside their offerings on the same binder page
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1 | 4/4 | ✅ Complete | 2026-05-04 |
| 2. Card Catalog | v1 | 3/3 | ✅ Complete | 2026-05-05 |
| 3. Collection | v1 | 4/4 | ✅ Complete | 2026-05-05 |
| 4. Deck Builder | v1 | 5/5 | ✅ Complete | 2026-05-06 |
| 5. Want List | v1 | 4/4 | ✅ Complete | 2026-05-06 |
| 5.1. Want List Gap Fix | v1 | 1/1 | ✅ Complete | 2026-05-07 |
| 5.2. Rarity Filter Fix | v1 | 1/1 | ✅ Complete | 2026-05-07 |
| 6. Auth & Multi-User | v2 | 4/4 | ✅ Complete | 2026-05-08 |
| 7. Market Pricing | v2 | 4/4 | ✅ Complete | 2026-05-08 |
| 8. Deck of the Day | v2 | 0/4 | ❌ Abandoned | 2026-05-10 |
| 9. Sideboard | v2 | 3/3 | ✅ Complete | 2026-05-11 |
| 10. Trade Binder | v2 | 0/? | Not started | — |

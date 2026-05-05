# Roadmap: Star Wars Unlimited Tracker

## Overview

The build proceeds in strict dependency order: cards must exist in the database before the catalog can be browsed, the collection must be stable before the deck builder begins, and the want list is only computable once both collection and decks exist. Five phases deliver the complete core loop — from a blank database to a user who knows exactly what cards they're missing for every deck they own.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Project scaffolding, database schema, and card catalog sync from swu-db.com
- [x] **Phase 2: Card Catalog** - Browse, search, and filter the full card catalog with images
- [ ] **Phase 3: Collection** - Track owned card counts and import from CSV formats
- [ ] **Phase 4: Deck Builder** - Build legal decks with ownership overlay and missing-card highlights
- [ ] **Phase 5: Want List** - See missing cards per deck and combined across all decks

## Phase Details

### Phase 1: Foundation
**Goal**: The project runs locally, the database schema is in place, and the full card catalog is seeded from the swu-db.com API and kept current via a sync job
**Depends on**: Nothing (first phase)
**Requirements**: CATALOG-04
**Success Criteria** (what must be TRUE):
  1. Running `npm run dev` starts the Next.js app without errors
  2. The database contains the full set of Star Wars Unlimited card definitions and printings, populated from the swu-db.com API
  3. A sync job (Vercel Cron or equivalent) runs and upserts new cards when new sets are released — no manual intervention needed
  4. Token cards are excluded from the synced catalog (filtered by collector number convention)
**Plans**: 4
- **Wave 1** — 01-01: Project scaffold (Next.js 16, Drizzle config, Vitest, env) — COMPLETE (2026-05-04)
- **Wave 2** — 01-02: Neon setup + Drizzle schema + db:push — COMPLETE (2026-05-04)
- **Wave 3** — 01-03: Sync logic TDD (upsertCards, syncAllCards, token filtering) — COMPLETE (2026-05-04)
- **Wave 4** — 01-04: Seed script + Vercel Cron route + deploy — COMPLETE (2026-05-04)


**Cross-cutting constraints:**
- `npm run dev` starts without errors (all waves)
- swu-db.com API is never called in the user request path (Waves 3-4)
- Token cards filtered from all catalog queries (Wave 3)

**UI hint**: yes

### Phase 2: Card Catalog
**Goal**: A user can open the app and browse, search, and filter every Star Wars Unlimited card with its image and metadata
**Depends on**: Phase 1
**Requirements**: CATALOG-01, CATALOG-02, CATALOG-03
**Success Criteria** (what must be TRUE):
  1. User can open the catalog page and see all cards with card images, name, type, set, and aspect displayed
  2. User can type a card name into a search field and see matching results update in real time
  3. User can filter the catalog by set, card type, and aspect — filters can be combined
  4. Browsing, searching, and filtering all query the local PostgreSQL cache, not the upstream API
**Plans**: 3
- **Wave 1** — 02-01-PLAN.md — next.config.ts remotePatterns + DB query layer (getAllCards, getFilterOptions, getCardByPrinting) + filterCards pure function + Wave 0 test stubs
- **Wave 2** — 02-02-PLAN.md — catalog UI: shadcn components, catalog-client, card-item, card-grid, top-bar, filter-dropdown, empty-state, page.tsx replacement + browser test stubs + human verify checkpoint
- **Wave 3** — 02-03-PLAN.md — card detail page /cards/[set-code]/[card-number] + human verify checkpoint
**UI hint**: yes

### Phase 3: Collection
**Goal**: A user can see their owned card counts and update them by searching and clicking; they can also bulk-import an existing collection from a CSV file
**Depends on**: Phase 2
**Requirements**: COLLECT-01, COLLECT-02, COLLECT-03, COLLECT-04
**Success Criteria** (what must be TRUE):
  1. User can open the collection view and see every card with its current owned copy count (including zero)
  2. User can search for a card, click it, and set the quantity owned — the count updates immediately
  3. User can upload a generic CSV file and have their collection populated from it, with partial failures wrapped in a transaction (all-or-nothing per import)
  4. User can upload the community Reddit SWU tracking spreadsheet CSV (Card # + Standard/Hyperspace/F-Hyperspace columns) and have variant counts summed into total owned per card
  5. User can filter the catalog by Arena, Trait, Rarity, Keyword, and cost (multi-select, values 0–9+) in addition to existing filters
  6. When returning to the catalog from a card detail page, any active search query and filters are preserved
**Plans**: 4
- **Wave 1** — 03-01-PLAN.md — user_collections schema + migration + GET/POST /api/collection endpoint
- **Wave 2** — 03-02-PLAN.md — URL-synced filters with nuqs + advanced filter expansion (Arena, Trait, Rarity, Keyword, Cost)
- **Wave 3** — 03-03-PLAN.md — card grid hover overlay controls + detail page count controls + human verify
- **Wave 4** — 03-04-PLAN.md — CSV import page + normalization logic + transactional /api/collection/import endpoint
**UI hint**: yes

### Phase 4: Deck Builder
**Goal**: A user can create and save named decks composed of a Leader, a Base, and a 50-card main deck, with owned counts shown on every card and legality enforced
**Depends on**: Phase 3
**Requirements**: DECK-01, DECK-02, DECK-03, DECK-04, DECK-05
**Success Criteria** (what must be TRUE):
  1. User can create a named deck, assign exactly 1 Leader card, 1 Base card, and up to 50 main deck cards, then save it
  2. User can view a list of all saved decks and delete any deck from the list
  3. While building a deck, every card in the catalog shows the user's owned copy count inline
  4. Cards where the user does not own enough copies to cover the deck quantity are visually highlighted
  5. The deck builder enforces SWU Premier legality: 1 Leader, 1 Base, 50-card main deck, maximum 3 copies of any non-unique card, Heroism/Villainy aspect exclusivity — an invalid deck cannot be saved
  6. User can export any saved deck in Melee format and raw JSON format for use in Karabast or other deck builders
  7. While viewing or building a deck, user can see ground/space unit counts, aspect breakdown, and a card cost curve
**Plans**: TBD
**UI hint**: yes

### Phase 5: Want List
**Goal**: A user can immediately see which cards each deck is missing and view a single aggregated list of everything they need to acquire across all their decks
**Depends on**: Phase 4
**Requirements**: WANT-01, WANT-02
**Success Criteria** (what must be TRUE):
  1. On any saved deck's page, the user can see a list of cards the deck requires that they do not own enough copies of, with the exact shortfall quantity shown
  2. User can view a combined want list that aggregates missing cards across all their decks, deduplicating by card and summing shortfall quantities
  3. Both want list views derive from a live query against collection and deck data — no separate sync or store needed
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 4/4 | COMPLETE | 2026-05-04 |
| 2. Card Catalog | 3/3 | COMPLETE | 2026-05-05 |
| 3. Collection | 0/4 | Not started | - |
| 4. Deck Builder | 0/? | Not started | - |
| 5. Want List | 0/? | Not started | - |

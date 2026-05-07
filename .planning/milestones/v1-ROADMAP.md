# Milestone v1: MVP

**Status:** ✅ SHIPPED 2026-05-07
**Phases:** 1–5.2 (7 phases including 2 inserted decimal phases)
**Total Plans:** 22
**Timeline:** 2026-05-03 → 2026-05-07 (5 days)

## Overview

Complete core loop for a Star Wars: Unlimited TCG card tracker. From a blank database to a user who can see exactly which cards they own while building decks and know instantly what they're missing. Replaced the fragmented workflow of a spreadsheet for collection tracking plus a separate deck-building tool with no awareness of what you own.

## Phases

### Phase 1: Foundation

**Goal:** The project runs locally, the database schema is in place, and the full card catalog is seeded from the swu-db.com API and kept current via a sync job
**Depends on:** Nothing (first phase)
**Requirements:** CATALOG-04
**Success Criteria:**
1. Running `npm run dev` starts the Next.js app without errors
2. The database contains the full set of Star Wars Unlimited card definitions and printings, populated from the swu-db.com API
3. A sync job (Vercel Cron or equivalent) runs and upserts new cards when new sets are released — no manual intervention needed
4. Token cards are excluded from the synced catalog (filtered by collector number convention)

**Plans:** 4
- [x] 01-01: Project scaffold (Next.js 16, Drizzle config, Vitest, env)
- [x] 01-02: Neon setup + Drizzle schema + db:push
- [x] 01-03: Sync logic TDD (upsertCards, syncAllCards, token filtering)
- [x] 01-04: Seed script + Vercel Cron route + deploy

**Completed:** 2026-05-04

---

### Phase 2: Card Catalog

**Goal:** A user can open the app and browse, search, and filter every Star Wars Unlimited card with its image and metadata
**Depends on:** Phase 1
**Requirements:** CATALOG-01, CATALOG-02, CATALOG-03
**Success Criteria:**
1. User can open the catalog page and see all cards with card images, name, type, set, and aspect displayed
2. User can type a card name into a search field and see matching results update in real time
3. User can filter the catalog by set, card type, and aspect — filters can be combined
4. Browsing, searching, and filtering all query the local PostgreSQL cache, not the upstream API

**Plans:** 3
- [x] 02-01: DB query layer & filter logic
- [x] 02-02: Catalog UI (shadcn, nuqs, browser tests)
- [x] 02-03: Card detail page

**Completed:** 2026-05-05

---

### Phase 3: Collection

**Goal:** A user can see their owned card counts and update them by searching and clicking; they can also bulk-import an existing collection from a CSV file
**Depends on:** Phase 2
**Requirements:** COLLECT-01, COLLECT-02, COLLECT-03, COLLECT-04
**Success Criteria:**
1. User can open the collection view and see every card with its current owned copy count (including zero)
2. User can search for a card, click it, and set the quantity owned — the count updates immediately
3. User can upload a generic CSV file and have their collection populated from it, with partial failures wrapped in a transaction (all-or-nothing per import)
4. User can upload the community Reddit SWU tracking spreadsheet CSV and have variant counts summed into total owned per card
5. User can filter the catalog by Arena, Trait, Rarity, Keyword, and cost (multi-select, values 0–9+) in addition to existing filters
6. When returning to the catalog from a card detail page, any active search query and filters are preserved

**Plans:** 4 + 1 fix plan
- [x] 03-01: user_collections schema & API
- [x] 03-02: URL-synced advanced filters (nuqs)
- [x] 03-03: Catalog & detail page collection controls
- [x] 03-04: CSV import (generic & community formats)
- [x] 03-05-FIX: COLLECT-04 fix (community CSV column mapping)

**Completed:** 2026-05-05

---

### Phase 4: Deck Builder

**Goal:** A user can create and save named decks composed of a Leader, a Base, and a 50-card main deck, with owned counts shown on every card and legality enforced
**Depends on:** Phase 3
**Requirements:** DECK-01, DECK-02, DECK-03, DECK-04, DECK-05
**Success Criteria:**
1. User can create a named deck, assign exactly 1 Leader card, 1 Base card, and up to 50 main deck cards, then save it
2. User can view a list of all saved decks and delete any deck from the list
3. While building a deck, every card in the catalog shows the user's owned copy count inline
4. Cards where the user does not own enough copies to cover the deck quantity are visually highlighted
5. The deck builder enforces SWU Premier legality: 1 Leader, 1 Base, 50-card main deck, maximum 3 copies of any non-unique card, Heroism/Villainy aspect exclusivity — an invalid deck cannot be saved
6. User can export any saved deck in Melee format and raw JSON format for use in Karabast or other deck builders
7. While viewing or building a deck, user can see ground/space unit counts, aspect breakdown, and a card cost curve

**Plans:** 5
- [x] 04-01: Database schema (decks, deck_cards) & CRUD API routes
- [x] 04-02: Deck validation logic & stats calculation (TDD)
- [x] 04-03: Deck builder core UI: Dashboard, shell with useReducer, and stats sidebar
- [x] 04-04: Catalog integration: Selector mode, Add buttons, and shortfall highlights
- [x] 04-05: Export (Melee/JSON) and final polish

**Completed:** 2026-05-06

---

### Phase 5: Want List

**Goal:** A user can immediately see which cards each deck is missing and view a single aggregated list of everything they need to acquire across all their decks
**Depends on:** Phase 4
**Requirements:** WANT-01, WANT-02
**Success Criteria:**
1. On any saved deck's page, the user can see a list of cards the deck requires that they do not own enough copies of, with the exact shortfall quantity shown
2. User can view a combined want list that aggregates missing cards across all their decks, deduplicating by card and summing shortfall quantities
3. Both want list views derive from a live query against collection and deck data — no separate sync or store needed

**Plans:** 4
- [x] 05-01: NavBar component + root layout mount
- [x] 05-02: getDeckCardsForUser DB query + GET /api/want-list route
- [x] 05-03: CardItem want-list mode + WantListTab + deck builder third tab
- [x] 05-04: Combined want list section on /decks dashboard

**Completed:** 2026-05-06

---

### Phase 5.1 (INSERTED): Want List Gap Fix

**Goal:** The want list computation includes the deck's Leader and Base cards so that WANT-01 and WANT-02 are fully satisfied — missing Leaders and Bases are surfaced in both the per-deck and combined want list views
**Depends on:** Phase 5
**Requirements:** WANT-01, WANT-02

**Plans:** 1
- [x] 05.1-01: Extend getDeckCardsForUser() + inject leader/base into WantListTab prop

**Completed:** 2026-05-07

---

### Phase 5.2 (INSERTED): Rarity Filter Fix

**Goal:** The rarity dropdown in the card catalog actually filters results — `filterCards()` evaluates `selectedRarities` instead of the hardcoded `true` bypass, closing a Phase 3 success criterion gap
**Depends on:** Phase 5.1
**Requirements:** COLLECT-05 (rarity filter criterion from Phase 3 scope)

**Plans:** 1
- [x] 05.2-01: Implement rarity filtering with UI label mapping

**Completed:** 2026-05-07

---

## Milestone Summary

### Decimal Phases

- **Phase 5.1** (INSERTED): Want List Gap Fix — inserted after Phase 5 to surface Leader/Base shortfalls that were silently omitted from want list computation
- **Phase 5.2** (INSERTED): Rarity Filter Fix — inserted after Phase 5.1 to fix hardcoded `true` bypass in rarity predicate discovered by milestone audit

### Key Decisions

- Two-table card model (card_definitions + card_printings) — non-negotiable from Phase 1
- Local PostgreSQL card cache only — never proxy swu-db.com; sync on schedule
- v1 single-user (no auth) — Better Auth deferred to v2
- neon-http driver (not WebSocket) for Drizzle client — correct for Next.js serverless on Vercel
- integer columns for cost/power/hp — proper numeric sort
- Two-pass variant strategy for card syncing: Normal cards anchor card_definitions, non-Normal variants look up by name+subtitle
- nuqs for URL-synced search/filters — snappy client-side state with shareable URLs
- Multi-line TopBar — necessary for 5 advanced filters
- Hover overlay collection controls with optimistic updates
- Deck Draft Support — `is_draft` boolean for saving invalid states
- Want List Visibility — hidden if all cards owned or no decks exist
- Synthetic rows in getDeckCardsForUser() — append leader/base after deckCardRows; shape must match Drizzle inferred type
- UI prefix stripping for rarity filter — split on space to match DB values

### Issues Resolved

- COLLECT-04 community CSV column mapping (03-05-FIX-PLAN.md)
- Leader/Base cards excluded from want list computation (Phase 5.1)
- Rarity filter hardcoded bypass `matchesRarity = true` (Phase 5.2)
- Sticky filter z-index/offset issue in catalog and deck builder

### Issues Deferred

- Nyquist compliance artifacts missing for Phases 2, 3, 5 (VERIFICATION.md informal or missing)
- No SUMMARY.md files for Phase 3 plans (03-01 through 03-04)
- N+1 resolvePrinting() calls in getDeckCardsForUser() — acceptable for v1 small deck count; batch join deferred to v2

### Technical Debt Incurred

- Phase 2 VERIFICATION.md missing; VALIDATION.md stuck at draft/false
- Phase 3 SUMMARY.md files missing for all 4 plans; VERIFICATION.md missing
- Phase 4 VERIFICATION.md is informal prose without structured frontmatter
- Phase 5 VERIFICATION.md is informal checklist without structured frontmatter
- No phase is fully Nyquist-compliant

---

*Milestone complete. For current project status, see .planning/ROADMAP.md*
*Archived: 2026-05-07*

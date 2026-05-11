# Roadmap: Star Wars Unlimited Tracker

## Milestones

- ✅ **v1 MVP** — Phases 1–5.2 (shipped 2026-05-07) · [Archive](milestones/v1-ROADMAP.md)
- ✅ **v2** — Phases 6–10 (auth, multi-user, market pricing, sideboard, trade binder) · (shipped 2026-05-11)

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

<details>
<summary>✅ v2 Multi-User, Market, Decks & Trading (Phases 6–10) — SHIPPED 2026-05-11</summary>

- [x] **Phase 6: Auth & Multi-User** — Per-user accounts with Better Auth; migrate v1 single-user data to first account — completed 2026-05-08
- [x] **Phase 7: Market Pricing** — Card prices (EUR + USD) from pokemon-api.com; deck cost totals; daily cache refresh — completed 2026-05-08
- [ ] ~~**Phase 8: Deck of the Day** — Daily featured tournament deck with ownership overlay and copy-to-library~~ (ABANDONED: swustats.net API issues)
- [x] **Phase 9: Sideboard** — Sideboard support in deck builder with rules enforcement and distinct cost curve display — completed 2026-05-11
- [x] **Phase 10: Trade Binder** — Public trade binder at /binder/[username] with catalog filters and want section — completed 2026-05-11

</details>

## Phase Details

### Phase 6: Auth & Multi-User
**Goal**: Users can create accounts and log in; all data is isolated per user; v1 hardcoded userId=1 is fully removed
**Plans**: 4 plans
- [x] 06-01-PLAN.md — Setup Better Auth core, schema, and test scaffolding
- [x] 06-02-PLAN.md — Refactor database queries for user isolation
- [x] 06-03-PLAN.md — Update API routes with session checks
- [x] 06-04-PLAN.md — Implement route protection, migration, and UI integration

### Phase 7: Market Pricing
**Goal**: Users can see card prices (EUR and USD) on card detail pages, in the deck builder as a total cost, and on the want list as an estimated completion cost
**Plans**: 4 plans
- [x] 07-01-PLAN.md — Schema & API Infrastructure
- [x] 07-02-PLAN.md — Daily Price Sync Implementation
- [x] 07-03-PLAN.md — Currency Control & Card UI
- [x] 07-04-PLAN.md — Deck & Want List Valuation

### Phase 9: Sideboard
**Goal**: Users can add a sideboard to any deck, with rules enforcement and distinct visual separation from the main deck
**Plans**: 3 plans
- [x] 09-01-PLAN.md — Extend validateDeck() with sideboardCostCurve and 10-card limit (TDD)
- [x] 09-02-PLAN.md — Add Move to SB/Main handlers and sideboard section in deck-builder.tsx
- [x] 09-03-PLAN.md — Stack amber sideboard bars on cost curve and update sidebar count in deck-sidebar.tsx

### Phase 10: Trade Binder
**Goal**: Users can curate a public trade binder from their collection, and anyone can browse it at a shareable URL without logging in
**Plans**: 4 plans
- [x] 10-01-PLAN.md — Infrastructure & Logic (usernames, trade quantities)
- [x] 10-02-PLAN.md — Management API & UI (manual wants, exclusions)
- [x] 10-03-PLAN.md — Public View (slug-based resolution, filtering)
- [x] 10-04-PLAN.md — Integration & E2E Verification

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
| 10. Trade Binder | v2 | 4/4 | ✅ Complete | 2026-05-11 |

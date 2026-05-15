# Roadmap: Star Wars Unlimited Tracker

## Milestones

- ✅ **v1 MVP** — Phases 1–5.2 (shipped 2026-05-07) · [Archive](milestones/v1-ROADMAP.md)
- ✅ **v2 Multi-User, Market, Decks & Trading** — Phases 6–10.1 (shipped 2026-05-12) · [Archive](milestones/v2-ROADMAP.md)
- ✅ **v3 Catalog, Home & Binder Polish** — Phases 11–14 (shipped 2026-05-13) · [Archive](milestones/v3-ROADMAP.md)
- 🔄 **v4 Deck Builder & Collection Depth** — Phases 15–18 (in progress)

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

### v4 Deck Builder & Collection Depth (Phases 15–18)

- [x] **Phase 15: Deck List Display Polish** — Card type grouping, aspect breakdown panel, and card art in the deck list view (2026-05-14)
- [x] **Phase 16: Empty Deck Guided Onboarding** — Auto-filter flow that guides users from leader+base selection through aspect-filtered card browsing (2026-05-15)
- [ ] **Phase 17: Variant Collection Tracking** — Per-variant owned counts viewed and updated on the card detail page
- [ ] **Phase 18: Catalog Collection Enhancements** — Catalog grid shows highest-owned variant art; quick-add all cards from a starter deck

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
**Plans**: TBD
**UI hint**: yes

### Phase 18: Catalog Collection Enhancements
**Goal**: The catalog surface reflects variant ownership in its art display, and users can seed their collection from a known starter deck in one click
**Depends on**: Phase 17
**Requirements**: REQ-COLLECT-08, REQ-CAT-04
**Success Criteria** (what must be TRUE):
  1. A catalog card tile displays the art of whichever variant the user owns the most copies of; if the user owns no copies, it falls back to Standard art
  2. User can trigger a single action to add all cards from a named pre-constructed starter deck to their collection
  3. After the quick-add action completes, the user receives confirmation of how many cards were added
**Plans**: TBD
**UI hint**: yes

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
| 17 | v4 | 0/? | Not started | — |
| 18 | v4 | 0/? | Not started | — |

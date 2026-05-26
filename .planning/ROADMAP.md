# Roadmap: Star Wars Unlimited Tracker

## Milestones

- ✅ **v1 MVP** — Phases 1–5.2 (shipped 2026-05-07) · [Archive](milestones/v1-ROADMAP.md)
- ✅ **v2 Multi-User, Market, Decks & Trading** — Phases 6–10.1 (shipped 2026-05-12) · [Archive](milestones/v2-ROADMAP.md)
- ✅ **v3 Catalog, Home & Binder Polish** — Phases 11–14 (shipped 2026-05-13) · [Archive](milestones/v3-ROADMAP.md)
- ✅ **v4 Deck Builder & Collection Depth** — Phases 15–22 (shipped 2026-05-23) · [Archive](milestones/v4-ROADMAP.md)
- 🚧 **v5 Trade Binder & Performance** — Phases 23–25 (in progress) · [Archive](milestones/v5-ROADMAP.md)

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
- [x] **Phase 12: Catalog Evolution** — Sticky sidebar filters, variant support (Showcase, Prestige, Serialized), TS26 set (3/3 plans)
- [x] **Phase 13: Advanced Filters** — Owned-only filter in catalog and deck builder (3/3 plans)
- [x] **Phase 14: Trade Binder Polish** — Full-width layouts and automatic want management (3/3 plans)

See [milestones/v3-ROADMAP.md](milestones/v3-ROADMAP.md) for full details.

</details>

<details>
<summary>✅ v4 Deck Builder & Collection Depth (Phases 15–22) — SHIPPED 2026-05-23</summary>

- [x] **Phase 15: Deck List Display Polish** — Card type grouping, aspect breakdown panel, and card art in the deck list view (3/3 plans) — 2026-05-14
- [x] **Phase 15.1: Cost Sort** — Deck list card rows ordered by cost ascending (1/1 plan) — 2026-05-15
- [x] **Phase 16: Empty Deck Guided Onboarding** — Auto-filter flow that guides users from leader+base selection through aspect-filtered card browsing (4/4 plans) — 2026-05-15
- [x] **Phase 16.1: Reorder Deck Tabs** — Tab order changed to Deck List → Add Cards → Want List; default tab is now Deck List (1/1 plan) — 2026-05-15
- [x] **Phase 17: Variant Collection Tracking** — Per-variant owned counts viewed and updated on the card detail page (10/10 plans) — 2026-05-18
- [x] **Phase 17.1: Card Sync Variant Grouping** — Refactor upsertCards to in-memory grouping; all variant types correctly linked in card_printings (2/2 plans) — 2026-05-20
- [x] **Phase 18: Catalog Collection Enhancements** — Catalog grid shows highest-owned variant art; quick-add all cards from a starter deck (3/3 plans) — 2026-05-20
- [x] **Phase 19: Variant Filter Enhancements** — Unified variant filtering across the entire app; Foil/Hyperspace Foil added; variant filters in binder (2/2 plans) — 2026-05-20
- [x] **Phase 20: CSV Variant Imports** — CSV import updated to support all four variant types via array-based variant lookup (1/1 plan) — 2026-05-20
- [x] **Phase 21: Binder Variant Badges** — Schema migration to support per-variant trade offerings; variant type badges on public binder cards (4/4 plans) — 2026-05-23
- [x] **Phase 22: Starter Deck Expansions** — Add TS26, IBH, and LAW/SEC spotlight decks to the Quick Add feature; corrected all starter/spotlight deck card lists (3/3 plans) — 2026-05-23

See [milestones/v4-ROADMAP.md](milestones/v4-ROADMAP.md) for full details.

</details>

<details open>
<summary>🚧 v5 Trade Binder & Performance (Phases 23–25) — In Progress</summary>

- [x] **Phase 23: Binder Variant Completeness** — Looking For variant badges, Card Detail trade offer management, and collection-driven Manage Binder discovery (completed 2026-05-26)
- [ ] **Phase 24: Catalog & Page Load Performance** — Filter response ≤200ms, reduced LCP, and layout-shift-free image loading
- [ ] **Phase 25: Operation Performance** — Progress feedback for Quick Add/CSV Import, timeout-proof bulk ops, and deck creation ≤500ms

See [milestones/v5-ROADMAP.md](milestones/v5-ROADMAP.md) for full details.

</details>

## Phase Details

### Phase 23: Binder Variant Completeness

**Goal:** All binder surfaces accurately reflect variant identity — Looking For tiles show variant badges, the Card Detail page exposes trade offer management, and the Manage Binder page lets users discover tradeable cards from their own collection
**Depends on:** Phase 22 (v4 complete)
**Requirements:** BINDER-07, BINDER-08, BINDER-09
**Success Criteria** (what must be TRUE):

  1. A visitor to a public binder's "Looking For" section sees a variant badge (Normal / Foil / Showcase / Hyperspace / Hyperspace Foil) on each tile, matching the badge style used on "Available for Trade" tiles
  2. An authenticated user on any card's detail page can see an "Available for Trade" section that shows current trade offer state per variant and can set, edit, or remove a quantity without visiting the Manage Binder page
  3. An authenticated user on the Manage Binder page can browse and search their owned cards directly (filtered list of collection cards) and add any of them to their trade binder — no full catalog navigation required
  4. Adding or removing a trade offer from the Card Detail page is reflected immediately in the Manage Binder page without requiring a full page reload

**Plans:** 4/4 plans complete
**Wave 1**

- [x] 23-01-PLAN.md — Schema migration + DB/API foundation for printing-level manual wants (BINDER-07 data layer)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 23-02-PLAN.md — Looking For variant badge UI on public binder (BINDER-07 UI completion)
- [x] 23-03-PLAN.md — Card Detail "Available for Trade" section with server-rendered initial state + PATCH wiring (BINDER-08)
- [x] 23-04-PLAN.md — Manage Binder owned-card browse, Sheet panel, and manual-wants variant chip selector (BINDER-09 + BINDER-07 manual-wants UX)

**UI hint**: yes

### Phase 24: Catalog & Page Load Performance

**Goal:** Catalog filter interactions feel near-instant, above-fold content appears faster on first load, and card images appear without layout shift or blank flicker
**Depends on:** Phase 23
**Requirements:** PERF-01, PERF-02, PERF-03
**Success Criteria** (what must be TRUE):

  1. Changing any catalog filter (set, rarity, variant, owned-only) reflects new results in ≤200ms without a visible loading spinner or full page reload
  2. The catalog page and public binder page show their above-fold content measurably faster on first load — LCP is reduced compared to baseline
  3. Card images below the fold load lazily and never cause layout shift — containers have fixed dimensions before images resolve
  4. The first visible row of card images loads with priority (no waiting behind below-fold images) and displays a blur placeholder or skeleton while the image fetches

**Plans:** 5 plans

**Wave 0** *(test infrastructure — must complete before Wave 1)*

- [ ] 24-01-PLAN.md - Wave 0 test stubs for CardGrid virtualization + getAllCards signature change

**Wave 1** *(parallel — independent file ownership)*

- [ ] 24-02-PLAN.md - Search input 150ms debounce in CatalogClient (PERF-01)
- [ ] 24-04-PLAN.md - RSC caching: use-cache directive + cacheTag, remove force-dynamic, drop userId from getAllCards (PERF-02)

**Wave 2** *(blocked on Wave 1 catalog-client.tsx ownership)*

- [ ] 24-03-PLAN.md - CardGrid virtualization with @tanstack/react-virtual + image priority threshold (PERF-01 + PERF-03)

**Wave 3** *(final verification)*

- [ ] 24-05-PLAN.md - npm run build + full test suite + route handler cacheComponents compat
**UI hint**: yes

### Phase 25: Operation Performance

**Goal:** Bulk operations (Quick Add, CSV Import) give real-time feedback and never time out, and creating a new deck reaches the empty skeleton instantly
**Depends on:** Phase 23
**Requirements:** PERF-04, PERF-05
**Success Criteria** (what must be TRUE):

  1. While a Quick Add (starter deck) or CSV Import is processing, the user sees a live progress indicator (row count or percentage) — the UI is never frozen or silent during a long operation
  2. Quick Add and CSV Import complete successfully for collections up to 1,000 cards without a timeout error, even on a slow connection
  3. After clicking "New Deck", the empty Deck Builder skeleton (with guided onboarding visible) appears within ≤500ms — no perceptible blank or loading state before onboarding renders

**Plans:** TBD

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
| 21 | v4 | 4/4 | ✅ Complete | 2026-05-23 |
| 22 | v4 | 3/3 | ✅ Complete | 2026-05-23 |
| 23 | v5 | 4/4 | Complete    | 2026-05-26 |
| 24 | v5 | 0/TBD | Not started | - |
| 25 | v5 | 0/TBD | Not started | - |

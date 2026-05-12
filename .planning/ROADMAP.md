# Roadmap: Star Wars Unlimited Tracker

## Milestones

- ✅ **v1 MVP** — Phases 1–5.2 (shipped 2026-05-07) · [Archive](milestones/v1-ROADMAP.md)
- ✅ **v2 Multi-User, Market, Decks & Trading** — Phases 6–10.1 (shipped 2026-05-12) · [Archive](milestones/v2-ROADMAP.md)
- 🏗️ **v3 Catalog, Home & Binder Polish** — Phases 11–14 (Home Page, Catalog, Filters, Binder UI)

## Phases

<details>
<summary>🏗️ v3 Catalog, Home & Binder Polish (Phases 11–14) — IN PLANNING</summary>

- [ ] **Phase 11: New Home Page** — Route refactor (/cards), Hero section, and High Value card grid
- [ ] **Phase 12: Catalog Evolution** — Sticky sidebar filters, variant support, and Twin Suns (TS26) set
- [ ] **Phase 13: Advanced Filters** — Owned-only filter and market price thresholds in deck builder
- [ ] **Phase 14: Trade Binder Polish** — Full-width layouts and automatic want management

</details>

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1–5.2 | v1 | 22/22 | ✅ Complete | 2026-05-07 |
| 6–10.1 | v2 | 16/16 | ✅ Complete | 2026-05-12 |
| 11 | v3 | 2/3 | 🔄 In Progress | — |

### Phase 11: New Home Page

**Goal:** Route refactor (/cards), Hero section, and Highest Value card grid
**Plans:** 3 plans

Plans:

**Wave 1**
- [x] 11-01-PLAN.md — Data foundation: getTopCardsByPrice query, test scaffolding, CatalogPage migration to /cards

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 11-02-PLAN.md — UI components: HeroSection, HighValueGrid, NavBar updates

**Wave 3** *(blocked on Wave 2 completion)*
- [ ] 11-03-PLAN.md — Wiring: new HomePage RSC at / + human visual verification checkpoint

Cross-cutting constraints:
- `export const dynamic = 'force-dynamic'` must appear in both `src/app/cards/page.tsx` and `src/app/page.tsx`
- No auth gate on the home page or high-value grid (D-06)
- Locked copy: title "Star Wars Unlimited Card Database and Deck Builder", subtitle as-is (D-01, D-02)

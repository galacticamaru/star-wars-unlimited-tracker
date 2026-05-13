# Roadmap: Star Wars Unlimited Tracker

## Milestones

- ✅ **v1 MVP** — Phases 1–5.2 (shipped 2026-05-07) · [Archive](milestones/v1-ROADMAP.md)
- ✅ **v2 Multi-User, Market, Decks & Trading** — Phases 6–10.1 (shipped 2026-05-12) · [Archive](milestones/v2-ROADMAP.md)
- 🏗️ **v3 Catalog, Home & Binder Polish** — Phases 11–14 (Home Page, Catalog, Filters, Binder UI)

## Phases

<details>
<summary>🏗️ v3 Catalog, Home & Binder Polish (Phases 11–14) — IN PLANNING</summary>

- [x] **Phase 11: New Home Page** — Route refactor (/cards), Hero section, and High Value card grid
- [x] **Phase 12: Catalog Evolution** — Sticky sidebar filters, variant support, and Twin Suns (TS26) set
- [x] **Phase 13: Advanced Filters** — Owned-only filter in catalog and deck builder
- [ ] **Phase 14: Trade Binder Polish** — Full-width layouts and automatic want management

</details>

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1–5.2 | v1 | 22/22 | ✅ Complete | 2026-05-07 |
| 6–10.1 | v2 | 16/16 | ✅ Complete | 2026-05-12 |
| 11 | v3 | 3/3 | ✅ Complete | 2026-05-12 |
| 12 | v3 | 3/3 | ✅ Complete | 2026-05-13 |
| 13 | v3 | 3/3 | ✅ Complete | 2026-05-13 |

### Phase 11: New Home Page

**Goal:** Route refactor (/cards), Hero section, and Highest Value card grid
**Plans:** 3 plans

Plans:

**Wave 1**
- [x] 11-01-PLAN.md — Data foundation: getTopCardsByPrice query, test scaffolding, CatalogPage migration to /cards

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 11-02-PLAN.md — UI components: HeroSection, HighValueGrid, NavBar updates

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 11-03-PLAN.md — Wiring: new HomePage RSC at / + human visual verification checkpoint

Cross-cutting constraints:
- `export const dynamic = 'force-dynamic'` must appear in both `src/app/cards/page.tsx` and `src/app/page.tsx`
- No auth gate on the home page or high-value grid (D-06)
- Locked copy: title "Star Wars Unlimited Card Database and Deck Builder", subtitle as-is (D-01, D-02)

### Phase 13: Advanced Filters

**Goal:** Owned-only toggle in the catalog sidebar and deck builder card browser (REQ-DECK-06)
**Plans:** 3 plans

Plans:

**Wave 1** *(run in parallel — no file overlap)*
- [x] 13-01-PLAN.md — TDD: extend FilterState + filterCards() with ownedOnly gate; 4 unit tests green
- [x] 13-02-PLAN.md — UI primitives: Switch and Tooltip wrappers over Base UI 1.4.1

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 13-03-PLAN.md — Wiring: nuqs hook in CatalogClient, toggle UI in SidebarFilters, human verification checkpoint

Cross-cutting constraints:
- All filter state via nuqs URL persistence — do NOT use useState for ownedOnly (Phase 12 rule)
- Toggle visible to all users; disabled with tooltip when logged out (D-02)
- Toggle placement: below search bar, above VariantFilter in sidebar (D-03)
- No @radix-ui imports — Base UI (@base-ui/react) only
- REQ-MARKET-05 (price threshold filter) is OUT OF SCOPE for this phase — deferred

### Phase 14: Trade Binder Polish

**Goal:** Full-width public binder layout and automatic deck-driven want management in the manage page
**Requirements:** REQ-TRADE-06, REQ-TRADE-07, REQ-TRADE-08
**Depends on:** Phase 13
**Plans:** 3 plans

Plans:

**Wave 1** *(run in parallel — no file overlap)*
- [x] 14-01-PLAN.md — Layout fix: remove container wrapper from public binder page (REQ-TRADE-06, REQ-TRADE-07)
- [x] 14-02-PLAN.md — Data layer: extend getUserTradeData() to compute and return autoWants (REQ-TRADE-08)

**Wave 2** *(blocked on 14-02 completion)*
- [x] 14-03-PLAN.md — UI: Automatic Wants section in ManageWantsList + manage page wiring + human verification checkpoint (REQ-TRADE-08)

Cross-cutting constraints:
- Full-width applies only to public binder (/binder/[username]); manage page keeps container mx-auto (D-01)
- Auto-wants computation inline in getUserTradeData(), not extracted to shared helper (Option B per D-07 discretion)
- Automatic Wants row style mirrors Manual Wants: `flex items-center justify-between p-2 bg-muted/50 rounded-md border group`
- Excluded rows rendered with opacity-50 + Excluded badge + Remove exclusion button (D-06)
- toggleExclusion reused as-is for auto-want rows — no new API endpoints needed

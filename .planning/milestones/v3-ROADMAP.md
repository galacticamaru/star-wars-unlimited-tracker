# Milestone v3: Catalog, Home & Binder Polish

**Status:** ✅ SHIPPED 2026-05-13
**Phases:** 11–14
**Total Plans:** 12
**PR:** #11

## Overview

Modernized the user experience with a dedicated landing page, sticky catalog filtering, support for all card variants, and an improved trade binder with automatic deck-driven want management.

---

## Phases

### Phase 11: New Home Page

**Goal:** Route refactor (/cards), Hero section, and Highest Value card grid
**Plans:** 3 plans

**Wave 1**
- [x] 11-01-PLAN.md — Data foundation: getTopCardsByPrice query, test scaffolding, CatalogPage migration to /cards

**Wave 2**
- [x] 11-02-PLAN.md — UI components: HeroSection, HighValueGrid, NavBar updates

**Wave 3**
- [x] 11-03-PLAN.md — Wiring: new HomePage RSC at / + human visual verification checkpoint

Cross-cutting constraints:
- `export const dynamic = 'force-dynamic'` must appear in both `src/app/cards/page.tsx` and `src/app/page.tsx`
- No auth gate on the home page or high-value grid (D-06)
- Locked copy: title "Star Wars Unlimited Card Database and Deck Builder", subtitle as-is (D-01, D-02)

---

### Phase 12: Catalog Evolution

**Goal:** Sticky sidebar filters, variant support (Showcase, Prestige, Serialized), and TS26 (Twin Suns) set sync
**Plans:** 3 plans

**Wave 1**
- [x] 12-01-PLAN.md — Data layer: variantType filter in getAllCards, TS26 set unblock in sync

**Wave 2** *(blocked on Wave 1)*
- [x] 12-02-PLAN.md — UI primitives: SidebarFilters, VariantFilter, MobileFilterSheet

**Wave 3** *(blocked on Wave 2)*
- [x] 12-03-PLAN.md — Wiring: CatalogClient fixed-height layout, sidebar integration, human visual checkpoint

Cross-cutting constraints:
- Fixed-height container pattern (100svh - 56px) for independent scroll
- All filter state via nuqs URL persistence
- No @radix-ui imports — Base UI (@base-ui/react) only

---

### Phase 13: Advanced Filters

**Goal:** Owned-only toggle in the catalog sidebar and deck builder card browser (REQ-DECK-06)
**Plans:** 3 plans

**Wave 1** *(run in parallel — no file overlap)*
- [x] 13-01-PLAN.md — TDD: extend FilterState + filterCards() with ownedOnly gate; 4 unit tests green
- [x] 13-02-PLAN.md — UI primitives: Switch and Tooltip wrappers over Base UI 1.4.1

**Wave 2** *(blocked on Wave 1)*
- [x] 13-03-PLAN.md — Wiring: nuqs hook in CatalogClient, toggle UI in SidebarFilters, human verification checkpoint

Cross-cutting constraints:
- All filter state via nuqs URL persistence — do NOT use useState for ownedOnly
- Toggle visible to all users; disabled with tooltip when logged out (D-02)
- Toggle placement: below search bar, above VariantFilter in sidebar (D-03)
- No @radix-ui imports — Base UI (@base-ui/react) only
- REQ-MARKET-05 (price threshold filter) OUT OF SCOPE — deferred

---

### Phase 14: Trade Binder Polish

**Goal:** Full-width public binder layout and automatic deck-driven want management in the manage page
**Requirements:** REQ-TRADE-06, REQ-TRADE-07, REQ-TRADE-08
**Plans:** 3 plans

**Wave 1** *(run in parallel — no file overlap)*
- [x] 14-01-PLAN.md — Layout fix: remove container wrapper from public binder page (REQ-TRADE-06, REQ-TRADE-07)
- [x] 14-02-PLAN.md — Data layer: extend getUserTradeData() to compute and return autoWants (REQ-TRADE-08)

**Wave 2** *(blocked on 14-02)*
- [x] 14-03-PLAN.md — UI: Automatic Wants section in ManageWantsList + manage page wiring + human verification checkpoint (REQ-TRADE-08)

Cross-cutting constraints:
- Full-width applies only to public binder (/binder/[username]); manage page keeps container mx-auto (D-01)
- Auto-wants computation inline in getUserTradeData(), not extracted to shared helper (D-07)
- Automatic Wants row style mirrors Manual Wants
- Excluded rows rendered with opacity-50 + Excluded badge + Remove exclusion button (D-06)
- toggleExclusion reused as-is for auto-want rows — no new API endpoints needed

---

## Milestone Summary

**Key Decisions:**

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fixed-height container for catalog (100svh - 56px) | Enables independent scroll for sidebar + main | ✓ Good |
| Base UI over Radix for Switch/Tooltip | Project constraint, no @radix-ui | ✓ Good |
| nuqs for all filter state | URL persistence, shareable, avoids useState proliferation | ✓ Good |
| TDD approach for filterCards() ownedOnly | RED → GREEN → REFACTOR discipline enforced | ✓ Good |
| auto-wants inline in getUserTradeData() | Keeps change self-contained, no new shared helper | ✓ Good |
| toggleExclusion reused for auto-want rows | No new API endpoints needed | ✓ Good |
| Full-width via container wrapper removal | PublicBinderClient already had correct internal padding | ✓ Good |

**Issues Resolved:**
- Portal wrapping required for Base UI TooltipPositioner (fix(13-02))
- ownedOnly filter state default value needed explicit reset in clear-all (fix(13))

**Issues Deferred:**
- REQ-MARKET-05: Price threshold filter — complexity vs. value tradeoff
- REQ-CAT-04: Quick-add pre-constructed decks
- Variant-aware collection tracking (REQ-COLLECT-06/07/08) — requires schema evolution
- Deck builder improvements (REQ-DECK-07 through 11)

**Technical Debt:**
- manage/page.tsx has pervasive `any` typing (code review CR-01 through CR-04 identified, not fixed in v3)
- Duplicate row risk for reprinted cards in offerings/lookingFor queries

---

*For current project status, see .planning/ROADMAP.md*

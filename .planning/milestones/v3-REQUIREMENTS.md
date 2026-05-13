# Requirements Archive — v3.0 Catalog, Home & Binder Polish

**Archived:** 2026-05-13
**Status:** ✅ MILESTONE COMPLETE

---

## Milestone Goal

Modernize the user experience with a dedicated landing page, sticky catalog filtering, support for all card variants, and improved trade binder presentation.

---

## v3 Requirements — Final Status

### Catalog Evolution (CAT)

- [x] **REQ-CAT-01**: Support all card variants (Showcase, Prestige, Serialized) in sync and UI — ✅ Phase 12
- [x] **REQ-CAT-02**: Implement sticky sidebar for catalog filters (swu.fan style) — ✅ Phase 12
- [x] **REQ-CAT-03**: Add Twin Suns (TS26) set support — ✅ Phase 12
- [ ] **REQ-CAT-04**: "Quick-add" pre-constructed decks to collection — ⏭ Deferred to v4+

### Advanced Filters (SEARCH)

- [x] **REQ-DECK-06**: Filter deck builder catalog to show ONLY cards user owns — ✅ Phase 13
- [ ] **REQ-MARKET-05**: Filter cards by market price thresholds — ⏭ Deferred to v4+

### New Home Page (HOME)

- [x] **REQ-HOME-01**: Move catalog to `/cards`; update root route and navigation — ✅ Phase 11
- [x] **REQ-HOME-02**: Hero section with Title, Subtitle, and clear CTAs — ✅ Phase 11
- [x] **REQ-HOME-03**: "Highest Value Cards" 10-card grid (5x2) on home page — ✅ Phase 11

### Trade Binder Polish (TRADE)

- [x] **REQ-TRADE-06**: Make `/binder/[username]` full-width — ✅ Phase 14
- [x] **REQ-TRADE-07**: Standardize public binder card grid to match catalog size — ✅ Phase 14
- [x] **REQ-TRADE-08**: Display automatic wants in `/binder/manage` with exclusion controls — ✅ Phase 14

---

## Traceability — Final

| REQ-ID | Phase | Final Status |
|--------|-------|--------------|
| REQ-HOME-01 | Phase 11 | ✅ Complete |
| REQ-HOME-02 | Phase 11 | ✅ Complete |
| REQ-HOME-03 | Phase 11 | ✅ Complete |
| REQ-CAT-01 | Phase 12 | ✅ Complete |
| REQ-CAT-02 | Phase 12 | ✅ Complete |
| REQ-CAT-03 | Phase 12 | ✅ Complete |
| REQ-CAT-04 | — | ⏭ Deferred to v4+ |
| REQ-DECK-06 | Phase 13 | ✅ Complete |
| REQ-MARKET-05 | — | ⏭ Deferred to v4+ |
| REQ-TRADE-06 | Phase 14 | ✅ Complete |
| REQ-TRADE-07 | Phase 14 | ✅ Complete |
| REQ-TRADE-08 | Phase 14 | ✅ Complete |

**Shipped:** 10/12 requirements (2 deferred by design — REQ-CAT-04 and REQ-MARKET-05 were never in-scope for any phase)

---

## Deferred to v4+ Backlog

Carried forward to v4 REQUIREMENTS.md:

- REQ-DECK-07: Deck List grouped by card type (Ground/Space Units, Upgrades, Events)
- REQ-DECK-08: Aspect breakdown panel — colour-coded bar chart + numeric counts
- REQ-DECK-09: Empty deck onboarding — guided leader+base selection with auto aspect filter
- REQ-DECK-10: Card art in Deck List tab (leader/base images, hover art on rows)
- REQ-DECK-11: Remove CTA from empty deck placeholder
- REQ-COLLECT-06: Per-variant collection counts on card detail page
- REQ-COLLECT-07: Add/remove any variant on card detail page
- REQ-COLLECT-08: Display highest-owned variant art in catalog (Showcase > Serialized > Prestige > Hyperspace > Normal)
- WANT-03: Export/share want list
- COLLECT-04v2: Collection CSV export
- COLLECT-05: SWUDB-specific CSV import
- DOTD-v2: Re-implement featured decks with stable API
- REQ-CAT-04: Quick-add pre-constructed decks
- REQ-MARKET-05: Price threshold filter

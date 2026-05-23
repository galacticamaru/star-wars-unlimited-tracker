# Requirements Archive — v4 Deck Builder & Collection Depth

**Archived:** 2026-05-23
**Status:** ✅ MILESTONE COMPLETE

---

## Milestone Goal

Deep deck builder and collection improvements: per-variant ownership, catalog variant art, guided onboarding, starter deck quick-add, unified variant filtering, CSV variant import, and per-variant trade offerings.

---

## v4 Requirements — Final Status

### Deck Builder

- [x] **REQ-DECK-07**: User can view the Deck List tab with cards grouped by type section (Ground Units, Space Units, Upgrades, Events) — ✅ Phase 15
- [x] **REQ-DECK-08**: User can see an aspect pip breakdown panel in the deck stats sidebar showing distribution across all aspects — ✅ Phase 15
- [x] **REQ-DECK-09**: User is guided through building an empty deck — card browser auto-filters to Leader and Base cards first, then filters by the combination of chosen leader's and base aspects after selection — ✅ Phase 16
- [x] **REQ-DECK-10**: User sees leader and base card images in the Deck List tab, and card art appears on hover for all deck card rows — ✅ Phase 15

### Collection / Catalog

- [x] **REQ-COLLECT-06**: User can view per-variant owned counts on the card detail page (Standard, Showcase, Prestige, Serialized) — ✅ Phase 17
- [x] **REQ-COLLECT-07**: User can increment and decrement owned count per variant on the card detail page — ✅ Phase 17
- [x] **REQ-COLLECT-08**: Catalog card grid displays art for the variant the user owns the most copies of (falls back to Standard art if none owned) — ✅ Phase 18
- [x] **REQ-COLLECT-09**: User can bulk-import collection from community Reddit SWU spreadsheet, including Foil, Hyperspace, and Hyperspace Foil variants — ✅ Phase 20 *(note: VERIFICATION.md not created; implementation confirmed via SUMMARY.md + manual test)*
- [x] **REQ-CAT-04**: User can add all cards from a known pre-constructed starter deck to their collection in one action — ✅ Phase 18 (extended in Phase 22)

### Filters

- [x] **REQ-FILTER-01**: User can filter cards by all available variant types (Normal, Foil, Hyperspace, Hyperspace Foil, Showcase, Prestige, Serialized) — ✅ Phase 19 *(partial: Prestige Foil absent from filter options; Serialized missing from VARIANT_PRECEDENCE — deferred to v5)*
- [x] **REQ-BINDER-05**: User can filter the search results in the trade binder management page by variant type — ✅ Phase 19 *(note: VERIFICATION.md not created)*
- [x] **REQ-BINDER-06**: Card tiles in the trade binder (offerings) display their variant type if it is not "Normal" — ✅ Phase 21 (schema migration; `user_trade_offerings` table; full variant badge implementation)

---

## Traceability — Final

| REQ-ID | Phase | Final Status |
|--------|-------|--------------|
| REQ-DECK-07 | Phase 15 | ✅ Complete |
| REQ-DECK-08 | Phase 15 | ✅ Complete |
| REQ-DECK-10 | Phase 15 | ✅ Complete |
| REQ-DECK-09 | Phase 16 | ✅ Complete |
| REQ-COLLECT-06 | Phase 17 | ✅ Complete |
| REQ-COLLECT-07 | Phase 17 | ✅ Complete |
| REQ-COLLECT-08 | Phase 18 | ✅ Complete |
| REQ-CAT-04 | Phase 18 + 22 | ✅ Complete (extended) |
| REQ-COLLECT-09 | Phase 20 | ✅ Complete (no VERIFICATION.md) |
| REQ-FILTER-01 | Phase 19 | ✅ Partial (Prestige Foil/Serialized gaps noted) |
| REQ-BINDER-05 | Phase 19 | ✅ Complete (no VERIFICATION.md) |
| REQ-BINDER-06 | Phase 21 | ✅ Complete (schema migration) |

**Coverage:** 12/12 v4 requirements satisfied or accepted at close.

---

## Deferred (to v5)

| Feature | Reason |
|---------|--------|
| Want list export (WANT-03) | Low priority; deferred from v3 |
| CSV export/import (COLLECT-04/05) | Existing Reddit CSV import covers migration; deferred |
| Market price threshold filter (REQ-MARKET-05) | Complexity outweighs value; deferred |
| Prestige Foil in variant filter | Missing from VARIANT_OPTIONS — quick fix, deferred |
| Serialized in VARIANT_PRECEDENCE | Omission in select-best-variant.ts — quick fix, deferred |

---

*Archived: 2026-05-23 at v4 milestone close*
*For current requirements, see the new REQUIREMENTS.md created for v5*

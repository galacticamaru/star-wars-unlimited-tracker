# Requirements — v3.0 Catalog, Home & Binder Polish

## Milestone Goal

Modernize the user experience with a dedicated landing page, sticky catalog filtering, support for all card variants, and improved trade binder presentation.

---

## v3 Requirements

### Catalog Evolution (CAT)

- [x] **REQ-CAT-01**: Support all card variants (Showcase, Prestige, Serialized) in sync and UI
- [x] **REQ-CAT-02**: Implement sticky sidebar for catalog filters (swu.fan style)
- [x] **REQ-CAT-03**: Add Twin Suns (TS26) set support
- [ ] **REQ-CAT-04**: "Quick-add" pre-constructed decks to collection

### Advanced Filters (SEARCH)

- [x] **REQ-DECK-06**: Filter deck builder catalog to show ONLY cards user owns
- [ ] **REQ-MARKET-05**: Filter cards by market price thresholds (e.g. "under $1.00")

### New Home Page (HOME)

- [x] **REQ-HOME-01**: Move catalog to `/cards`; update root route and navigation
- [x] **REQ-HOME-02**: Hero section with Title, Subtitle, and clear CTAs (Import, Build, Trade)
- [x] **REQ-HOME-03**: "Highest Value Cards" 10-card grid (5x2) on home page

### Trade Binder Polish (TRADE)

- [x] **REQ-TRADE-06**: Make `/binder/[username]` full-width
- [x] **REQ-TRADE-07**: Standardize public binder card grid to match catalog size
- [x] **REQ-TRADE-08**: Display automatic wants in `/binder/manage` with exclusion controls

---

## Future Requirements (Deferred to v4+)

### Variant-Aware Collection Tracking (COLLECT)

- [ ] **REQ-COLLECT-06**: On a card detail page, display how many copies of each variant the user owns in their collection
- [ ] **REQ-COLLECT-07**: On a card detail page, allow adding or removing copies of any variant that card supports (not limited to Normal)
- [ ] **REQ-COLLECT-08**: In the catalog, display the art of the highest-rarity variant the user owns, rather than always showing Normal art. Display hierarchy: Showcase > Serialized > Prestige > Hyperspace > Normal. Catalog add-to-collection button continues to add Normal variant only.

### Other Deferred

- **WANT-03**: Export or share want list
- **COLLECT-04v2**: Collection CSV export
- **COLLECT-05**: SWUDB-specific CSV import
- **DOTD-v2**: Re-implement featured decks with stable API
- **REQ-CAT-04**: "Quick-add" pre-constructed decks to collection
- **REQ-MARKET-05**: Filter cards by market price thresholds

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| REQ-HOME-01 | Phase 11 | ✅ Complete |
| REQ-HOME-02 | Phase 11 | ✅ Complete |
| REQ-HOME-03 | Phase 11 | ✅ Complete |
| REQ-CAT-01 | Phase 12 | ✅ Complete |
| REQ-CAT-02 | Phase 12 | ✅ Complete |
| REQ-CAT-03 | Phase 12 | ✅ Complete |
| REQ-CAT-04 | — | Deferred to v4+ |
| REQ-DECK-06 | Phase 13 | ✅ Complete |
| REQ-MARKET-05 | — | Deferred to v4+ |
| REQ-TRADE-06 | Phase 14 | ✅ Complete |
| REQ-TRADE-07 | Phase 14 | ✅ Complete |
| REQ-TRADE-08 | Phase 14 | ✅ Complete |
| REQ-COLLECT-06 | — | Backlog (v4+) |
| REQ-COLLECT-07 | — | Backlog (v4+) |
| REQ-COLLECT-08 | — | Backlog (v4+) |

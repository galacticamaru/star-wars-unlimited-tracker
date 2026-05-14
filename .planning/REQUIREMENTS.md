# Requirements: Star Wars Unlimited Tracker — v4.0

**Defined:** 2026-05-14
**Core Value:** See exactly which cards you own while building decks, and know instantly what you're missing.

## v4.0 Requirements

### Deck Builder

- [ ] **REQ-DECK-07**: User can view the Deck List tab with cards grouped by type section (Ground Units, Space Units, Upgrades, Events)
- [ ] **REQ-DECK-08**: User can see an aspect pip breakdown panel in the deck stats sidebar showing distribution across all aspects
- [ ] **REQ-DECK-09**: User is guided through building an empty deck — card browser auto-filters to Leader and Base cards first, then filters by the combination of chosen leader's and base aspects after selection
- [ ] **REQ-DECK-10**: User sees leader and base card images in the Deck List tab, and card art appears on hover for all deck card rows

### Collection / Catalog

- [ ] **REQ-COLLECT-06**: User can view per-variant owned counts on the card detail page (Standard, Showcase, Prestige, Serialized)
- [ ] **REQ-COLLECT-07**: User can increment and decrement owned count per variant on the card detail page
- [ ] **REQ-COLLECT-08**: Catalog card grid displays art for the variant the user owns the most copies of (falls back to Standard art if none owned)
- [ ] **REQ-CAT-04**: User can add all cards from a known pre-constructed starter deck to their collection in one action

## Future Requirements

Deferred from v4 — not in current roadmap.

### Want List

- **WANT-03**: User can export or share their want list (link or file)

### Collection

- **COLLECT-04**: User can export their full collection as a CSV file
- **COLLECT-05**: User can import collection from SWUDB-format CSV

### Filters

- **REQ-MARKET-05**: User can filter the catalog by market price threshold (min/max EUR or USD)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Want list export (WANT-03) | Low priority relative to deck builder and collection depth; deferred to v5+ |
| CSV export/import (COLLECT-04/05) | Existing Reddit CSV import covers collection migration; deferred to v5+ |
| Market price threshold filter (REQ-MARKET-05) | Complexity outweighs value for current user base; deferred to v5+ |
| Card trading / marketplace | Different product |
| Mobile native app | Web-first; responsive design covers mobile browsers |
| Camera scanning | ML complexity; CSV import covers collection migration |
| Price history charts | Significant complexity, low value for a deck builder |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-DECK-07 | Phase 15 | Pending |
| REQ-DECK-08 | Phase 15 | Pending |
| REQ-DECK-10 | Phase 15 | Pending |
| REQ-DECK-09 | Phase 16 | Pending |
| REQ-COLLECT-06 | Phase 17 | Pending |
| REQ-COLLECT-07 | Phase 17 | Pending |
| REQ-COLLECT-08 | Phase 18 | Pending |
| REQ-CAT-04 | Phase 18 | Pending |

**Coverage:**
- v4 requirements: 8 total
- Mapped to phases: 8
- Unmapped: 0

---
*Requirements defined: 2026-05-14*
*Last updated: 2026-05-14 — roadmap created, all 8 requirements mapped to Phases 15–18*

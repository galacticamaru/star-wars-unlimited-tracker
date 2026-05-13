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

### Deck Builder Improvements (DECK)

- [ ] **REQ-DECK-07**: In the Deck List tab, group cards into labelled sections and subsections. Main Deck sections: Ground Units, Space Units, Upgrades, Events. Sideboard sections: Ground Units, Space Units, Upgrades, Events. Each section shows its card count in the heading.

- [ ] **REQ-DECK-08**: Add an aspect breakdown panel to the deck stats sidebar. Requirements:
  - Show a count for each aspect present in the deck (Aggression, Vigilance, Command, Cunning, Heroism, Villainy)
  - Render a bar chart styled identically to the existing cost-curve chart
  - Each bar is colour-coded: Aggression = red, Vigilance = blue, Command = green, Cunning = yellow, Heroism = white, Villainy = black
  - Cards with multiple aspects contribute a proportional split bar (each aspect segment coloured accordingly)
  - Show both the visual bar and a numeric count per aspect

- [ ] **REQ-DECK-09**: Guided onboarding flow for empty decks:
  - When the deck has no leader and no base selected, automatically apply a filter showing only Leader and Base cards in the card browser
  - Once a leader and base are both selected, automatically switch the filter to the aspects of the combined leader+base (e.g. a Command/Aggression leader shows Command and Aggression cards by default)
  - The user can clear or change filters at any time — the auto-filter is a default, not a lock
  - Once the deck has at least one non-leader/base card, the onboarding flow no longer re-applies automatically

- [ ] **REQ-DECK-10**: Introduce card art to the Deck List tab:
  - Display the leader and base card images at the top of the Deck List tab using the same card image component used in card detail pages
  - For the leader card, include a front/back toggle so the user can flip between the leader's two art faces
  - For each card row in the list, show the card's front art on hover (tooltip or inline reveal)

- [ ] **REQ-DECK-11**: Remove the call-to-action from the empty deck placeholder. The guided filter flow (REQ-DECK-09) replaces it as the onboarding mechanism.

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
| REQ-DECK-07 | — | Backlog (v4+) |
| REQ-DECK-08 | — | Backlog (v4+) |
| REQ-DECK-09 | — | Backlog (v4+) |
| REQ-DECK-10 | — | Backlog (v4+) |
| REQ-DECK-11 | — | Backlog (v4+) |

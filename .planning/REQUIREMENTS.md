# Requirements — Star Wars: Unlimited Tracker

## v1 Requirements

### Card Catalog

- [x] **CATALOG-01**: User can browse all Star Wars: Unlimited cards with card images, name, type, set, and aspect
- [x] **CATALOG-02**: User can search the card catalog by card name
- [x] **CATALOG-03**: User can filter the card catalog by set, card type, and aspect
- [x] **CATALOG-04**: Card catalog automatically syncs new card sets from the swu-db.com API without manual intervention

### Collection

- [x] **COLLECT-01**: User can view their collection showing the owned copy count for each card
- [x] **COLLECT-02**: User can set the quantity owned for any card by searching and clicking
- [x] **COLLECT-03**: User can import their collection from a CSV spreadsheet file (generic column mapping)
- [x] **COLLECT-04**: User can import their collection from the community Reddit SWU tracking spreadsheet format (Card # + Standard/Hyperspace/F-Hyperspace variant columns; variant counts summed into total owned per card)

### Deck Builder

- [x] **DECK-01**: User can create a named deck composed of exactly 1 Leader card, 1 Base card, and a 50-card main deck
- [x] **DECK-02**: User can save, view, and delete multiple decks
- [x] **DECK-03**: Deck builder shows owned copy count for each card inline while the user builds a deck
- [x] **DECK-04**: Deck builder visually highlights cards the user does not own enough copies of
- [x] **DECK-05**: App validates deck legality against SWU Premier rules: 1 Leader, 1 Base, 50-card main deck, maximum 3 copies of any non-unique card, Heroism/Villainy aspect exclusivity

### Want List

- [x] **WANT-01**: User can see which cards each individual deck is missing, based on their owned collection
- [x] **WANT-02**: User can view a combined want list that aggregates missing cards across all their decks

---

## v2 Requirements

*Deferred — not in scope for the initial version.*

- **AUTH-01**: User can create an account with email and password
- **AUTH-02**: User can log in with an OAuth provider (Google or GitHub)
- **AUTH-03**: User can reset their password via email
- **COLLECT-04**: User can export their collection to CSV
- **COLLECT-05**: User can import collection from a SWUDB-specific CSV export (column mapping distinct from generic CSV)
- **DECK-06**: User can filter the deck builder to show only cards they own
- **WANT-03**: User can export or share their want list (CSV download or shareable link)
- **SCAN-01**: User can add cards to their collection by scanning physical cards with a camera (image recognition)

---

## Out of Scope

- **Multi-user / public accounts** — v1 is a single-user personal tool; auth and per-user isolation are v2
- **Card trading or marketplace** — different product; outside this project's purpose
- **Native mobile app** — web-first; responsive design covers mobile browser use
- **Variant / foil tracking at the printing level** — deck legality counts by card identity, not printing; foil tracking is a v2 concern
- **Sideboard support** — competitive play feature; basic 50-card deck covers casual play in v1
- **Social / sharing features** (deck sharing, public profiles) — v2 retention features once core loop is proven

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| CATALOG-01 | Phase 2 | Complete |
| CATALOG-02 | Phase 2 | Complete |
| CATALOG-03 | Phase 2 | Complete |
| CATALOG-04 | Phase 1 | Complete |
| COLLECT-01 | Phase 3 | Complete |
| COLLECT-02 | Phase 3 | Complete |
| COLLECT-03 | Phase 3 | Complete |
| COLLECT-04 | Phase 3 | Complete |
| DECK-01 | Phase 4 | Complete |
| DECK-02 | Phase 4 | Complete |
| DECK-03 | Phase 4 | Complete |
| DECK-04 | Phase 4 | Complete |
| DECK-05 | Phase 4 | Complete |
| WANT-01 | Phase 5 | Complete |
| WANT-02 | Phase 5 | Complete |

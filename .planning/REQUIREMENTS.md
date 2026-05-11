# Requirements — v2.0 Multi-User, Market, Decks & Trading

## Milestone Goal

Expand from single-user personal tool to multi-user platform with card pricing, curated tournament decks, a public trade binder, and sideboard support in the deck builder.

---

## v2 Requirements

### Auth + Multi-User (AUTH)

- [x] **AUTH-01**: User can register with email and password
- [x] **AUTH-02**: User can log in with email and password
- [x] **AUTH-03**: User session persists across browser restarts (stay logged in)
- [x] **AUTH-04**: User can log out
- [x] **AUTH-05**: User can log in via Google OAuth
- [x] **AUTH-06**: User can log in via Discord OAuth
- [x] **AUTH-07**: All existing v1 collection and deck data is migrated to the first registered account

### Market Pricing (MARKET)

- [x] **MARKET-01**: User can view card price (EUR and USD) on the card detail page
- [x] **MARKET-02**: User can see total deck cost (EUR and USD) in the deck builder
- [x] **MARKET-03**: User can see estimated cost to complete a deck (based on missing cards) on the want list
- [x] **MARKET-04**: Card prices are cached in the database and refreshed daily — never fetched live per request

### Deck of the Day (DOTD)

- [ ] **DOTD-01**: User can view the Deck of the Day — a featured deck from a PQ-or-higher tournament winner
- [ ] **DOTD-02**: Deck of the Day shows which cards the user owns vs is missing (owned-count overlay, same as deck builder)
- [ ] **DOTD-03**: User can copy the Deck of the Day into their personal deck library with one click
- [ ] **DOTD-04**: A new featured deck is automatically fetched daily via cron from swuapi.com

### Trade Binder (TRADE)

- [x] **TRADE-01**: User can add cards from their collection to their trade binder with a quantity they are offering
- [x] **TRADE-02**: User can update or remove cards from their trade binder
- [x] **TRADE-03**: Trade binder is publicly viewable at a shareable URL (e.g. `/binder/[username]`) without login
- [x] **TRADE-04**: Trade binder supports catalog-style filters (set, type, aspect, arena, rarity, etc.)
- [x] **TRADE-05**: User can list cards they are looking for on their trade binder (want section alongside offerings)
- [ ] **TRADE-SIDE-FIX**: Sideboard cards are excluded from auto-calculated "Looking For" requirements (Phase 10.1)

### Sideboard (SIDE)

- [x] **SIDE-01**: User can mark cards in a deck as sideboard cards
- [x] **SIDE-02**: Sideboard is capped at 10 cards per SWU Premier rules; deck validation enforces this limit
- [x] **SIDE-03**: Sideboard cards appear on the cost curve with a distinct color, separate from main deck cards
- [x] **SIDE-04**: Sideboard cards are displayed separately from the main deck in the deck view

---

## Future Requirements (Deferred to v3)

- **WANT-03**: User can export or share their want list — defer to v3
- **DECK-06**: User can filter the deck builder to show only cards they own — defer to v3
- **COLLECT-05**: User can import collection from SWUDB-specific CSV export — defer to v3
- **COLLECT-04v2**: User can export collection to CSV — defer to v3

---

## Out of Scope

- Card trading / matching between users — marketplace feature, different product
- Price history charts — significant complexity, low value for a deck builder
- Buy links / affiliate integration — different product
- Past Deck of the Day archive — nice to have, not table stakes for v2
- Private trade binders — defeats the purpose; public is the primary use case
- Camera scanning (SCAN-01) — ML complexity, deferred indefinitely

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| AUTH-01 | Phase 6 | ✅ Complete |
| AUTH-02 | Phase 6 | ✅ Complete |
| AUTH-03 | Phase 6 | ✅ Complete |
| AUTH-04 | Phase 6 | ✅ Complete |
| AUTH-05 | Phase 6 | ✅ Complete |
| AUTH-06 | Phase 6 | ✅ Complete |
| AUTH-07 | Phase 6 | ✅ Complete |
| MARKET-01 | Phase 7 | ✅ Complete |
| MARKET-02 | Phase 7 | ✅ Complete |
| MARKET-03 | Phase 7 | ✅ Complete |
| MARKET-04 | Phase 7 | ✅ Complete |
| DOTD-01 | Phase 8 | Pending |
| DOTD-02 | Phase 8 | Pending |
| DOTD-03 | Phase 8 | Pending |
| DOTD-04 | Phase 8 | Pending |
| SIDE-01 | Phase 9 | ✅ Complete |
| SIDE-02 | Phase 9 | ✅ Complete |
| SIDE-03 | Phase 9 | ✅ Complete |
| SIDE-04 | Phase 9 | ✅ Complete |
| TRADE-01 | Phase 10 | ✅ Complete |
| TRADE-02 | Phase 10 | ✅ Complete |
| TRADE-03 | Phase 10 | ✅ Complete |
| TRADE-04 | Phase 10 | ✅ Complete |
| TRADE-05 | Phase 10 | ✅ Complete |
| TRADE-SIDE-FIX | Phase 10.1 | Pending |

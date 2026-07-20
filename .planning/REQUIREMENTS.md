# Requirements: Star Wars Unlimited Tracker

**Defined:** 2026-07-05
**Core Value:** See exactly which cards you own while building decks, and know instantly what you're missing.

## v7 Requirements

Requirements for the v7 Trade Binder Improvements milestone. Phases continue from v6 (Phase 30+).

### Unified Binder Add Flow

- [x] **BINDER-10**: The Manage Binder page presents a single search-driven flow (replacing the separate "Add Cards" and "Add Manual Want" boxes) for putting cards into the binder
- [x] **BINDER-11**: The binder search queries the full card catalog and shows no results until the user enters a search term (no eager render of the collection on page load)
- [x] **BINDER-12**: From a search result, the user picks a specific variant (printing) and chooses its destination — trade binder or want
- [x] **BINDER-13**: "Add to trade binder" (set trade quantity) is available only for variants the user owns; unowned variants show the action disabled with a clear reason
- [x] **BINDER-14**: The user can add any card as a manual want from a search result, including cards not in their collection

### Trade Profile

- [x] **BINDER-15**: The trade profile (username / binder URL) is reached via a profile button that opens a modal, instead of occupying the Manage Binder page permanently
- [x] **BINDER-16**: The user can set a public "trade note" (short free text) in the trade profile modal
- [x] **BINDER-17**: The public binder page displays the user's trade note

### Wants & Exclusions

- [x] **BINDER-18**: The wants list shows deck-driven auto-wants and manually-added wants together in one list, visually distinguishing the two
- [x] **BINDER-19**: The user can hide (exclude) an auto-generated want and restore a previously excluded one
- [x] **BINDER-20**: The user can adjust the quantity of, or remove, a manual want from the wants list

### Spotlight Decks (Ashes of the Empire)

> **Gated:** deck lists to be supplied by the user, and both decks depend on the ASH ("Ashes of the Empire") set being present in the catalog DB via the swu-db.com sync. This category is scoped to its own phase, blocked until those inputs are ready.

- [x] **DECK-11**: The Luke Skywalker (ASH) Ashes of the Empire spotlight deck is available in Quick Add and adds its full card list to the user's collection
- [x] **DECK-12**: The Emperor Palpatine (ASH) Ashes of the Empire spotlight deck is available in Quick Add and adds its full card list to the user's collection

---

## Future Requirements (Deferred)

### Carried from v6

- **DEBT-02**: DeckBuilder Add Cards tab displays variant art via `getPrintingArtMap()` — deferred; needs investigation on interaction with the virtualized list
- **DEBT-05**: LAW spotlight deck unknowns resolved (9 cards absent from DB, commented TODOs cleared) — deferred pending DB sync

### Previously Deferred

| ID | Description | Deferred At |
|----|-------------|-------------|
| WANT-03 | Export / share want list (link or downloadable file) | v4 planning |
| COLLECT-05 | SWUDB CSV import format support | v4 planning |
| COLLECT-04v2 | CSV export of full collection | v4 planning |
| REQ-MARKET-05 | Market price threshold filter in catalog | v4 planning |

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Trade proposals / messaging between users | Different product surface; v7 is binder curation UX, not a trading marketplace |
| Automatic want-vs-offer matching across users | Larger feature; not part of the manage-binder redesign |
| Card trading / marketplace | Different product |
| Mobile native app | Web-first; responsive design covers mobile browsers |
| Camera scanning | ML complexity; CSV import covers collection migration |

## Traceability

Which phases cover which requirements. Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BINDER-10 | Phase 30 | Complete |
| BINDER-11 | Phase 30 | Complete |
| BINDER-12 | Phase 30 | Complete |
| BINDER-13 | Phase 30 | Complete |
| BINDER-14 | Phase 30 | Complete |
| BINDER-15 | Phase 31 | Complete |
| BINDER-16 | Phase 31 | Complete |
| BINDER-17 | Phase 31 | Complete |
| BINDER-18 | Phase 32 | Complete |
| BINDER-19 | Phase 32 | Complete |
| BINDER-20 | Phase 32 | Complete |
| DECK-11 | Phase 33 | Complete (implemented directly; verified in DB) |
| DECK-12 | Phase 33 | Complete (implemented directly; verified in DB) |

**Coverage:**

- v7 requirements: 13 total
- Mapped to phases: 13/13 ✓
- Unmapped: 0

---
*Requirements defined: 2026-07-05*
*Last updated: 2026-07-05 after v7 ROADMAP.md creation (Phases 30–33)*

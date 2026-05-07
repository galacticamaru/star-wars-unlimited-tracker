# Requirements Archive — v1 MVP

**Milestone:** v1 MVP
**Archived:** 2026-05-07
**Status:** All v1 requirements satisfied ✅

---

## v1 Requirements — Final Status

### Card Catalog

- [x] **CATALOG-01** — User can browse all Star Wars: Unlimited cards with card images, name, type, set, and aspect
  - *Outcome: Validated — Phase 2 catalog page with card grid, images, and metadata*
- [x] **CATALOG-02** — User can search the card catalog by card name
  - *Outcome: Validated — Phase 2 real-time name search via nuqs URL state*
- [x] **CATALOG-03** — User can filter the card catalog by set, card type, and aspect
  - *Outcome: Validated — Phase 2 multi-filter support; Phase 3 extended with 5 additional filter dimensions (Arena, Trait, Rarity, Keyword, Cost)*
- [x] **CATALOG-04** — Card catalog automatically syncs new card sets from the swu-db.com API without manual intervention
  - *Outcome: Validated — Phase 1 Vercel Cron job (daily 06:00 UTC) + seed script*

### Collection

- [x] **COLLECT-01** — User can view their collection showing the owned copy count for each card
  - *Outcome: Validated — Phase 3 user_collections overlay on catalog*
- [x] **COLLECT-02** — User can set the quantity owned for any card by searching and clicking
  - *Outcome: Validated — Phase 3 hover overlay controls with optimistic updates*
- [x] **COLLECT-03** — User can import their collection from a CSV spreadsheet file (generic column mapping)
  - *Outcome: Validated — Phase 3 CSV import via PapaParse with transactional all-or-nothing import*
- [x] **COLLECT-04** — User can import their collection from the community Reddit SWU tracking spreadsheet format (Card # + Standard/Hyperspace/F-Hyperspace variant columns; variant counts summed into total owned per card)
  - *Outcome: Validated — Phase 3 normalizeRedditCsv() with column header detection; 03-05-FIX fixed column mapping bug*

### Deck Builder

- [x] **DECK-01** — User can create a named deck composed of exactly 1 Leader card, 1 Base card, and a 50-card main deck
  - *Outcome: Validated — Phase 4 POST /api/decks with validateDeck() enforcement*
- [x] **DECK-02** — User can save, view, and delete multiple decks
  - *Outcome: Validated — Phase 4 /decks dashboard with GET/DELETE routes*
- [x] **DECK-03** — Deck builder shows owned copy count for each card inline while the user builds a deck
  - *Outcome: Validated — Phase 4 CatalogClient selector mode passes deckCounts to CardItem*
- [x] **DECK-04** — Deck builder visually highlights cards the user does not own enough copies of
  - *Outcome: Validated — Phase 4 hasShortfall flag → red border highlight*
- [x] **DECK-05** — App validates deck legality against SWU Premier rules: 1 Leader, 1 Base, 50-card main deck, maximum 3 copies of any non-unique card, Heroism/Villainy aspect exclusivity
  - *Outcome: Validated — Phase 4 validateDeck() server-side enforcement; is_draft boolean for work-in-progress decks*

### Want List

- [x] **WANT-01** — User can see which cards each individual deck is missing, based on their owned collection
  - *Outcome: Validated — Phase 5 WantListTab; Phase 5.1 extended to include Leader/Base shortfalls via synthetic rows*
- [x] **WANT-02** — User can view a combined want list that aggregates missing cards across all their decks
  - *Outcome: Validated — Phase 5 /api/want-list + combined section on /decks; Phase 5.1 extended getDeckCardsForUser() to include Leader/Base*

---

## Traceability Table — Final

| REQ-ID | Phase | Status | Notes |
|--------|-------|--------|-------|
| CATALOG-01 | Phase 2 | ✅ Complete | UAT 10/10 passed |
| CATALOG-02 | Phase 2 | ✅ Complete | nuqs search wired |
| CATALOG-03 | Phase 2 | ✅ Complete | Extended in Phase 3 with 5 more filter dimensions |
| CATALOG-04 | Phase 1 | ✅ Complete | Vercel Cron + seed script |
| COLLECT-01 | Phase 3 | ✅ Complete | Collection overlay on catalog |
| COLLECT-02 | Phase 3 | ✅ Complete | Hover controls + optimistic updates |
| COLLECT-03 | Phase 3 | ✅ Complete | Generic CSV import |
| COLLECT-04 | Phase 3 | ✅ Complete | Community CSV import; fixed in 03-05-FIX |
| DECK-01 | Phase 4 | ✅ Complete | POST /api/decks + validation |
| DECK-02 | Phase 4 | ✅ Complete | /decks dashboard + delete |
| DECK-03 | Phase 4 | ✅ Complete | Inline owned counts in selector |
| DECK-04 | Phase 4 | ✅ Complete | Red border shortfall highlight |
| DECK-05 | Phase 4 | ✅ Complete | Full Premier legality enforcement |
| WANT-01 | Phase 5 + 5.1 | ✅ Complete | Per-deck want list incl. Leader/Base |
| WANT-02 | Phase 5 + 5.1 | ✅ Complete | Combined want list incl. Leader/Base |

---

## Deferred to v2

- **AUTH-01** — User can create an account with email and password
- **AUTH-02** — User can log in with an OAuth provider (Google or GitHub)
- **AUTH-03** — User can reset their password via email
- **COLLECT-04 v2** — User can export their collection to CSV (COLLECT-04 in v1 was the Reddit CSV import)
- **COLLECT-05** — User can import collection from a SWUDB-specific CSV export (column mapping distinct from generic CSV)
- **DECK-06** — User can filter the deck builder to show only cards they own
- **WANT-03** — User can export or share their want list (CSV download or shareable link)
- **SCAN-01** — User can add cards to their collection by scanning physical cards with a camera

---

*Requirements archived from .planning/REQUIREMENTS.md at v1 milestone close.*
*For next milestone requirements, see .planning/REQUIREMENTS.md (fresh file).*

# Phase 4: Deck Builder - Context

**Gathered:** 2026-05-05
**Status:** Initializing

<domain>
## Phase Boundary

Phase 4 introduces the core deck building experience. Users can create, manage, and validate decks for Star Wars: Unlimited Premier play. This includes selecting a Leader, a Base, and a 50-card main deck.

The key value of this phase is integrating the collection data from Phase 3, allowing users to see their owned counts inline and highlighting missing cards.

</domain>

<requirements>
## Requirements

- **DECK-01**: User can create a named deck composed of exactly 1 Leader card, 1 Base card, and a 50-card main deck.
- **DECK-02**: User can save, view, and delete multiple decks.
- **DECK-03**: Deck builder shows owned copy count for each card inline while the user builds a deck.
- **DECK-04**: Deck builder visually highlights cards the user does not own enough copies of.
- **DECK-05**: App validates deck legality against SWU Premier rules: 1 Leader, 1 Base, 50-card main deck, maximum 3 copies of any non-unique card, Heroism/Villainy aspect exclusivity.
- **Export**: User can export any saved deck in Melee format and raw JSON format.
- **Stats**: While viewing or building a deck, user can see ground/space unit counts, aspect breakdown, and a card cost curve.

</requirements>

<decisions>
## Initial Decisions

- **Single-User:** Like Phase 3, this will be single-user (userId: 1) for now.
- **Local Storage / DB:** Decks will be stored in the PostgreSQL database.
- **Legality Enforcement:** Validation will happen on the client for immediate feedback, but will also be enforced on the server during save.
- **Responsive:** The builder needs to work well on mobile and desktop.

</decisions>

---

*Phase: 4-Deck Builder*
*Context gathered: 2026-05-05*

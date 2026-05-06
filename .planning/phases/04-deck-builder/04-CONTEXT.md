# Phase 4: Deck Builder - Context

**Gathered:** 2026-05-05
**Status:** Decisions Locked

<domain>
## Phase Boundary

Phase 4 introduces the core deck building experience. Users can create, manage, and validate decks for Star Wars: Unlimited Premier play. This phase integrates collection data from Phase 3 to show ownership status while building.

</domain>

<requirements>
## Requirements

- **DECK-01**: User can create a named deck composed of exactly 1 Leader card, 1 Base card, and a 50-card main deck.
- **DECK-02**: User can save, view, and delete multiple decks.
- **DECK-03**: Deck builder shows owned copy count for each card inline while the user builds a deck.
- **DECK-04**: Deck builder visually highlights cards the user does not own enough copies of (shortfall).
- **DECK-05**: App validates deck legality against SWU Premier rules: 1 Leader, 1 Base, 50-card main deck, maximum 3 copies of any non-unique card, Heroism/Villainy aspect exclusivity.
- **Export**: User can export any saved deck in Melee format and raw JSON format.
- **Stats**: While viewing or building a deck, user can see ground/space unit counts, aspect breakdown, and a card cost curve.

</requirements>

<decisions>
## Implementation Decisions

### UI Layout: Separate Page
- **Navigation:**
  - `/decks`: Dashboard listing all saved decks.
  - `/decks/new`: Create a new deck.
  - `/decks/[id]`: Edit/View an existing deck.
- **Builder Structure:**
  - The deck edit page is a dedicated view showing the current Leader, Base, and Main Deck list (grouped by type).
  - **Selector:** An "Add Cards" action will open a full-screen selector view or modal that reuses the `CatalogClient` component.
  - **Mode Toggle:** When the catalog is used within the builder, `CardItem` will show "Add to Deck" controls (quantity selector) in addition to or instead of collection controls.

### Validation & Legality
- **Real-time Feedback:** The builder will show a "Legality" or "Warnings" sidebar/panel that updates instantly as cards are added/removed.
- **Rules:** Enforce SWU Premier rules (1 Leader, 1 Base, 50-card main deck, max 3 copies of non-unique).
- **Aspect Penalty:** The builder will **flag** cards that do not match the Leader/Base aspects (Off-Aspect) but will **not** automatically modify the displayed cost of the card.
- **Save Blocking:** Decks that do not meet core requirements (1 Leader, 1 Base, 50 cards) should ideally be flagged, but the user must be able to save "In Progress" decks (though they might be marked as "Illegal" in the dashboard). *Correction: ROADMAP says "an invalid deck cannot be saved". We will follow the roadmap for the final save, but allow drafting if possible.*

### Ownership Integration
- **Owned vs. Deck Count:** Every card in the deck list and selector must show `ownedCount`.
- **Shortfall Highlighting:** If `countInDeck > ownedCount`, the card entry in the deck list will have a high-contrast visual indicator (e.g., red text or "Missing X" badge).

### Export
- Support Melee format (text) and raw JSON export.

</decisions>

<patterns>
## Reusable Patterns
- **API:** Standard REST-ish routes `/api/decks` and `/api/decks/[id]`.
- **State:** `useReducer` or `zustand` for local deck state during building before persisting.
- **Components:** Reuse `CatalogClient`, `CardGrid`, and `CardItem` for the card selector.
</patterns>

---

*Phase: 4-Deck Builder*
*Context gathered: 2026-05-05*

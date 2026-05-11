# Phase 9: Sideboard - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Add sideboard support to the deck builder: users can move copies of main deck cards into a sideboard, see the sideboard in a separate section of the Deck List editor, see sideboard cards stacked on the cost curve in a distinct color, and have the 10-card sideboard limit enforced by validation.

The catalog tab is NOT changed — it always adds to the main deck. All sideboard management happens in the Deck List editor tab via move buttons.

</domain>

<decisions>
## Implementation Decisions

### Sideboard UX — Adding Cards

- **D-01:** The catalog ("Add Cards" tab) is unchanged — `+` always adds to the main deck with `isSideboard: false`. No new catalog controls.
- **D-02:** Sideboard management lives entirely in the **Deck List editor tab**. Each main deck card row gets a "Move to SB" button added alongside the existing `–` and `+` controls. Clicking it decrements the card's main count by 1 and increments its sideboard count by 1 (atomic dispatch or two dispatches).
- **D-03:** Each sideboard card row gets a "Move to Main" button in the same position. Clicking it moves one copy back to the main deck.
- **D-04:** If a main deck card is at quantity 1 and the user clicks "Move to SB," the card is removed from main deck and added to sideboard (net result: 0 in main, 1 in sideboard, card no longer appears in main list).

### Sideboard List Display — Deck List Editor Tab

- **D-05:** The sideboard section appears **below the main deck list** in the Deck List editor tab. It uses the same card row format as the main deck.
- **D-06:** The sideboard section is **always visible**, even when empty. Empty state shows a prompt: e.g., "No sideboard cards yet. Click 'Move to SB' on a main deck card to add one."
- **D-07:** The sideboard section header reads **"Sideboard (N / 10)"** where N is the total sideboard card count.
- **D-08:** The sidebar header (currently "N / 50 cards") is updated to show sideboard count separately — e.g., "50 / 50 main • 3 / 10 sideboard".

### Validation — 10-Card Limit

- **D-09:** `validateDeck()` in `src/lib/deck-validation.ts` gains a sideboard count check: `if sideboard total > 10 → errors.push('Sideboard cannot exceed 10 cards')`.
- **D-10:** The existing copy-count check already processes sideboard cards (via `processCard(item, false)`) — no change needed there.

### Cost Curve — Sideboard Bars

- **D-11:** `ValidationStats` gains a `sideboardCostCurve: Record<number, number>` field, populated in `validateDeck()` for sideboard cards (same capping logic as main: cost >= 9 maps to key 9).
- **D-12:** In the cost curve chart (`DeckSidebar`), sideboard cards are **stacked on top of** main deck bars in the same column. Sideboard bar color: **amber/orange** (e.g., `bg-amber-400`). Main deck bar color: unchanged (existing slate/indigo).
- **D-13:** A small legend below the chart labels the two colors (e.g., "■ Main  ■ Sideboard").

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Deck Builder Core
- `src/components/decks/deck-builder.tsx` — Main orchestrator component; contains `DeckState`, `DeckAction`, `deckReducer`, `mainDeck`/`sideboard` computed arrays, and the Deck List editor view to extend
- `src/components/decks/deck-sidebar.tsx` — Cost curve chart and sidebar header count display; needs sideboard stacking and updated card count display
- `src/lib/deck-validation.ts` — `validateDeck()` and `ValidationStats`; add sideboard cost curve tracking and 10-card limit check

### Schema
- `src/db/schema.ts` — `deck_cards` table already has `is_sideboard` boolean column; no schema migration needed

### Phase Requirements
- `.planning/REQUIREMENTS.md` — SIDE-01 through SIDE-04 (the 4 acceptance criteria for this phase)
- `.planning/ROADMAP.md` — Phase 9 success criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `isSideboard` field in `DeckState.cards[]` — already in state; no new state shape needed
- `sideboard: DeckCard[]` array — already computed in `DeckBuilder` via `useMemo`; passed to `DeckSidebar`
- `dispatch({ type: 'UPDATE_CARD', payload: { cardDefinitionId, quantity, isSideboard } })` — already supports `isSideboard: true`; move-to-SB is just two dispatches (decrement main, increment sideboard) or a new reducer action
- `validateDeck(leader, base, mainDeck, sideboard)` — already accepts sideboard; already processes it for copy-count limit; add the new 10-card check and `sideboardCostCurve` population

### Established Patterns
- Card row format in Deck List editor: `[qty badge] [name + type/cost] [-] [+]` — extend with `[Move to SB]` button at far right
- Cost curve bar rendering: array of `[0..9]` costs, each a flex-col with `bg-slate-400` bar and a `title` tooltip — add a stacked amber bar inside the same column div
- Badge component from shadcn/ui — already used for legal/illegal status; reuse for sideboard count indicator if needed

### Integration Points
- `handleDeckUpdate` in `DeckBuilder` handles Leader/Base via `SET_LEADER`/`SET_BASE` — sideboard move needs a new handler `handleMoveToSideboard(cardDefinitionId)` and `handleMoveToMain(cardDefinitionId)` (or inline dispatches)
- `DeckSidebar` receives `mainDeck` and `sideboard` props — sidebar count display and cost curve both need updating in this file only
- `ValidationStats` type change propagates to anywhere `validation.stats` is destructured — check `deck-sidebar.tsx` and any test files

</code_context>

<specifics>
## Specific Ideas

- "Move to SB" button text is the explicit label requested — keep it concise, no icon-only
- Sideboard section header: "Sideboard (N / 10)" — the "/10" makes the cap immediately legible
- Sidebar count format: "50 / 50 main • 3 / 10 sideboard" — user confirmed this exact breakdown
- Amber/orange cost curve bars — amber-400 from Tailwind's amber scale matches the existing warning color (used in `bg-amber-50`/`text-amber-600` in `DeckSidebar`) for visual cohesion
- Empty sideboard state: instructional text pointing users to use "Move to SB" on a main deck card

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 9-Sideboard*
*Context gathered: 2026-05-11*

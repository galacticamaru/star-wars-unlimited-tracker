# Phase 15: Deck List Display Polish - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the Deck List tab visually rich: cards grouped by type (Ground Units, Space Units, Upgrades, Events), leader and base shown as full card art images, a hover art preview panel for all other card rows, and an aspect breakdown panel added to the sidebar stats.

</domain>

<decisions>
## Implementation Decisions

### Type Grouping
- **D-01:** Group main deck cards into 4 sections: Ground Units (type="Unit" AND arenas includes "Ground"), Space Units (type="Unit" AND arenas includes "Space"), Upgrades (type="Upgrade"), Events (type="Event"). A catch-all "Other" section captures anything that doesn't fit (e.g. tokens, future types).
- **D-02:** Hide empty sections entirely — do not render a section header when its card count is 0.
- **D-03:** Group derivation uses the `arenas[]` array on the card, NOT the `type` field alone (type is just "Unit" in DB for both Ground and Space cards).

### Aspect Breakdown Panel
- **D-04:** Add an "Aspects" panel to the deck sidebar (`deck-sidebar.tsx`), styled identically to the existing Types/Arenas breakdown panels — aspect name on the left, numeric count on the right.
- **D-05:** Exclude the "Basic" aspect from the panel — it is not a real strategic aspect.
- **D-06:** Show numeric counts (e.g. "Aggression: 12"), not percentages. `aspectCounts` is already computed in `ValidationStats` — no new validation logic needed.

### Leader/Base Art Display
- **D-07:** When a leader or base is selected, replace the text-only content inside the existing dashed box with a full card image using `frontArtUrl`. The dashed box dimensions and layout stay the same.
- **D-08:** Use `frontArtUrl` for both leaders and bases (same as catalog `card-item.tsx`).
- **D-09:** When the slot is empty (no card selected), keep the existing dashed placeholder box and "No Leader Selected" / "No Base Selected" text unchanged.
- **D-10:** Show the Remove action as an overlay button on hover over the card image — same hover-overlay pattern used in `card-item.tsx`.

### Hover Art Mechanism
- **D-11:** When hovering a non-Leader/Base card row in the Deck List, show that card's art in a fixed preview panel to the LEFT of the card list, within the Deck List tab area.
- **D-12:** Show `frontArtUrl` only (no back face logic for double-sided cards).
- **D-13:** Trigger on mouse hover (desktop) AND on tap/focus (mobile). The fixed panel approach means no tooltip jitter and the art doesn't obscure row action buttons.
- **D-14:** When no row is hovered, the preview panel shows nothing (empty/hidden state).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current Deck List Implementation
- `src/components/decks/deck-builder.tsx` — The full DeckBuilder component; the "editor" view (Deck List tab) is the primary target of this phase (lines ~342–456)
- `src/components/decks/deck-sidebar.tsx` — Sidebar with cost curve, types/arenas panels; aspect panel to be added here
- `src/lib/deck-validation.ts` — `ValidationStats` already includes `aspectCounts: Record<string, number>` — no new validation logic needed for the aspect panel

### Art Display Pattern
- `src/components/catalog/card-item.tsx` — Established pattern for card art display using Next.js `Image`, `frontArtUrl` for leaders, hover overlay pattern for action buttons

### Phase Requirements
- `.planning/REQUIREMENTS.md` — REQ-DECK-07 (type grouping), REQ-DECK-08 (aspect panel), REQ-DECK-10 (art display)
- `.planning/ROADMAP.md` §Phase 15 — Success criteria and phase goal

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ValidationStats.aspectCounts`: Already tracked in `validateDeck()` — just needs a UI panel in the sidebar
- `Card.arenas[]`: The field that distinguishes Ground Units from Space Units (not `Card.type`)
- `Card.frontArtUrl` / `Card.backArtUrl`: Both present on every Card object passed to DeckBuilder
- `card-item.tsx` hover overlay pattern: `opacity-0 group-hover:opacity-100 transition-opacity` — can be replicated for the remove button on leader/base art

### Established Patterns
- Sidebar panels in `deck-sidebar.tsx` use: `<h3 className="text-sm font-semibold uppercase text-slate-500 mb-2">` header + `space-y-1` item list with flex justify-between — aspect panel must match this style
- Next.js `Image` component is used for all card art (not `<img>`) — use `fill` or explicit `width`/`height` with `object-cover`
- The `mainDeck: DeckCard[]` array is already computed and available in `DeckBuilder` — grouping can be done with `useMemo` over this array

### Integration Points
- The hover art preview panel sits INSIDE the `view === 'editor'` branch of DeckBuilder, to the left of the card list — likely a flex row layout: `[preview panel] [card list]`
- The preview panel receives the hovered card's `frontArtUrl` via React state (`useState<Card | null>`)
- The Leader/Base image slots are within the existing `grid grid-cols-1 md:grid-cols-2` layout (lines ~344–372 of deck-builder.tsx)

</code_context>

<specifics>
## Specific Ideas

- The hover preview panel is fixed within the Deck List content area (not a floating tooltip) — this prevents jitter and keeps buttons accessible
- The aspect panel in the sidebar is a simple name/count text list — no color-coded pips needed

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 15-Deck-List-Display-Polish*
*Context gathered: 2026-05-14*

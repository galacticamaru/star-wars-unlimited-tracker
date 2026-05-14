# Phase 15: Deck List Display Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 15-Deck-List-Display-Polish
**Areas discussed:** Type Grouping Logic, Aspect Pip Design, Leader/Base Art Display, Hover Art Mechanism

---

## Type Grouping Logic

| Option | Description | Selected |
|--------|-------------|----------|
| Strict 4 groups + catch-all 'Other' | Ground Units, Space Units, Upgrades, Events — anything else falls into an 'Other' section | ✓ |
| Strict 4 groups only — hide unknowns | Only show the 4 canonical groups; cards that don't fit are silently excluded | |
| You decide | Pick what makes sense based on the SWU card pool | |

**User's choice:** Strict 4 groups + catch-all 'Other'
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Hide empty sections | Only render sections that have cards in them. Cleaner view. | ✓ |
| Always show all 4 sections | Always render Ground Units, Space Units, Upgrades, Events — even when count is 0 | |

**User's choice:** Hide empty sections
**Notes:** —

---

## Aspect Pip Design

| Option | Description | Selected |
|--------|-------------|----------|
| Color-coded pips/dots | Each aspect gets its canonical SWU color; show a row of pips or a count chip per aspect | |
| Plain text list (like existing Types panel) | Aspect name on left, count on right — same layout as Types/Arenas breakdown | ✓ |

**User's choice:** Plain text list (like existing Types panel)
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Exclude Basic | Basic is a non-aspect marker — not meaningful for deck-building | ✓ |
| Include Basic | Show Basic alongside the other aspects for completeness | |

**User's choice:** Exclude Basic
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Numeric count | E.g. 'Aggression: 12' — consistent with other sidebar panels | ✓ |
| Percentage | E.g. 'Aggression: 24%' | |
| You decide | Pick what feels most useful | |

**User's choice:** Numeric count
**Notes:** —

---

## Leader/Base Art Display

| Option | Description | Selected |
|--------|-------------|----------|
| Front face | frontArtUrl — same as catalog (card-item.tsx uses frontArtUrl for leaders) | ✓ |
| Back face | backArtUrl — shows the deployed form | |
| You decide | Pick whichever looks best | |

**User's choice:** Front face
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Keep existing dashed placeholder box | Preserve current empty state — replace with art only when card is selected | ✓ |
| Show a card-shaped placeholder image | A card-back graphic or greyed silhouette | |

**User's choice:** Keep existing dashed placeholder box
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Overlay remove button on hover | Show a subtle Remove button on hover over the card image — same pattern as catalog card overlays | ✓ |
| Keep existing text + Remove button | Show card name and Remove button as text below or over the image | |

**User's choice:** Overlay remove button on hover
**Notes:** —

---

## Hover Art Mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed preview panel to the left of the list | A fixed position panel shows the card image while hovering — no jitter, doesn't block buttons | ✓ |
| Floating tooltip near the cursor | Card art pops up near the mouse position, anchored to the hovered row | |
| You decide | Pick the UX that feels most natural | |

**User's choice:** Fixed preview panel to the left of the list
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Front face only | Always show frontArtUrl — simpler, consistent | ✓ |
| Show back face for double-sided cards | Use backArtUrl when doubleSided=true | |

**User's choice:** Front face only
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Desktop hover only | CSS hover state — no touch support needed | |
| Also support tap/focus on mobile | Touch-friendly — tap to show art, tap elsewhere to dismiss | ✓ |

**User's choice:** Also support tap/focus on mobile
**Notes:** —

---

## Claude's Discretion

None — all areas had explicit user decisions.

## Deferred Ideas

None — discussion stayed within phase scope.

---
sketch: 001
name: selector-tile-mobile
question: "What tile layout and control placement works for deck-builder selector mode at 390px?"
winner: "B"
tags: [mobile, deck-builder, catalog, touch, layout]
---

# Sketch 001: Selector tile at 390px

## Design Question

The deck-builder catalog (selector mode) has to satisfy three things you named that pull against
each other at phone width:

- **Fast and rapid-fire** — you add ~50 cards in a session
- **Card art forward** — art is how you recognise cards
- **Confident and precise** — no mistaps, clear feedback

Today it satisfies none of them. What layout resolves the tension?

## How to View

```
open .planning/sketches/001-selector-tile-mobile/index.html
```

## Variants

- **A: 2-col + stepper bar** — trades a grid column for control space. Permanent stepper under each
  card's art. The mobile-commerce pattern applied directly.
- **B: 3-col + pinned bar** — keeps today's density, makes the tile art-only with a count badge.
  Tapping selects; a pinned bottom bar holds the stepper with the full 390px to work with.
- **C: List rows** — abandons the grid. Art becomes a 44px thumbnail, name and cost carry
  recognition, stepper sits at the row's right edge.
- **✗ Today (broken)** — the current build, reproduced so the defect can be felt rather than read
  about. Included as the control.

## What to Look For

**Turn on `Measure` in the bottom-right toolbar first.** It overlays real pixel widths and flags
any control that overflows its own tile. That single toggle is the fastest way to see why the
current build fails — and it's measuring the live DOM, not a claim in a caption.

Then, per variant:

1. **Tap the `+` repeatedly.** How many taps to add 3 copies? Does the count feedback land where
   your eye already is, or somewhere else?
2. **Add several different cards in a row.** A wins on directness; B costs a select tap but keeps
   the bar warm; C is fastest but you're reading names, not seeing art.
3. **Watch the shortfall ring** (red outline — mirrors `hasShortfall` in `card-item.tsx:75`).
   Cards seeded above your owned count show it. Is it legible at each tile size?
4. **On the "Today" tab, try to tap a card's `+` without triggering navigation.** That's the bug.
5. **Count cards per screen.** A ≈ 4, B ≈ 9, C ≈ 9. That's the density cost of A stated plainly.

## Stack Constraints Reflected

The catalog grid is row-virtualized (`@tanstack/react-virtual`, `card-grid.tsx:74-83`):

- `useColumnCount()` returns 3 at base (`card-grid.tsx:27`) — A needs a one-line change here.
- `estimateSize` assumes tile height = `width × 1.5` with no control-bar allowance
  (`card-grid.tsx:80`) — A changes row geometry, B does not, C removes the guess entirely.
- C is the cheapest to virtualize (uniform row heights) but shares the least code with the
  desktop grid.

## Outcome — Variant B

**Winner: B (3-col + pinned action bar).**

Density is preserved at today's 3 columns, the tile becomes pure art with a count badge, and the
stepper moves to a pinned bar with the full 390px to work with. The "controls don't fit in a 118px
tile" constraint isn't solved so much as dissolved — nothing has to fit in the tile any more.

Accepted trade: the first adjustment to any card costs a select tap. In exchange the bar stays warm,
so re-targeting to the next card is a single tap and adjusting the current one is immediate.

**Unresolved, carried into sketch 002:** the pinned bar competes for the bottom of the screen with
the existing deck-stats sheet trigger (`deck-builder.tsx:708-737`) and the deck total footer. Three
things now want the same 56–120px. That collision has to be designed, not discovered during
implementation.

## Related

- Root-cause analysis: `.planning/notes/catalog-interaction-model.md`
- Seed: `.planning/seeds/catalog-variant-drawer.md`

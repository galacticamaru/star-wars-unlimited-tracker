---
sketch: 003
name: responsive-scope
question: "Does the tile + off-tile-controls model apply at every breakpoint, or is it mobile-only?"
winner: "C"
tags: [responsive, desktop, deck-builder, catalog, consistency]
---

# Sketch 003: Responsive scope

## Design Question

Sketches 001 and 002 were both built at 390px, but the decisions they produced are stated globally
in the findings skill — "nothing hover-dependent", "the tile is not a `<Link>`". Neither was tested
above 390px.

That matters because the existing desktop surface **is not broken**. The hover overlay at
`card-item.tsx:119` works fine with a mouse: hover is real, the pointer is precise, and there is no
sticky-hover problem. Deleting it globally regresses something that works.

So: does the new model replace desktop too, or fork at the breakpoint?

## The measurement that reframes the question

Going in, the assumption was that desktop has more room. It does not.

`useColumnCount()` reads **window** width (`card-grid.tsx:17-27`), while `estimateSize` reads
**container** width (`card-grid.tsx:78`). In the deck builder the container is the window minus the
320px sidebar (`deck-sidebar.tsx:60`, `w-80`). At a 1024px window:

| | Columns | Container | Tile width |
|---|---|---|---|
| Desktop (`lg`) | 9 (from window) | ~704px (minus sidebar) | **~68px** |
| Mobile | 3 | ~390px | **~118px** |

**Desktop tiles in the deck builder are smaller than mobile tiles.** The "put controls on the tile"
option is therefore worse on desktop, not better — which removes the most obvious argument for a
global rule and changes what the variants are actually choosing between.

Note this also means the current code picks a column count from one width and estimates row height
from another. Worth confirming during planning whether that's intentional.

## How to View

```
open .planning/sketches/003-responsive-scope/index.html
```

Each variant shows a 1024px desktop frame (9 columns + 320px sidebar) above a 390px phone frame,
so the two breakpoints are visible together.

## Variants

- **A: Breakpoint fork** — mobile gets the new model; desktop keeps today's hover overlay and
  tile-wide link untouched.
- **B: Global, controls on tile** — the literal reading of "nothing hover-dependent", built so its
  failure is visible. Controls attach under every tile at every width.
- **C: One model, two containers** — tap-selects everywhere, controls always off-tile. The
  container changes: bottom bar on mobile, the existing 320px sidebar on desktop.

## What to Look For

**Turn on `Measure`** — every tile is labelled with its real width. Compare desktop against mobile
before judging anything else.

1. **Variant A, hover a desktop tile.** The legacy overlay still works. Ask whether that's worth
   keeping given it means the same component behaves differently by breakpoint.
2. **Variant B, look at the desktop control buttons.** They're 30px — already below the 44px floor —
   and still cramped at ~68px tiles. This is the same failure sketch 001 rejected at 118px.
3. **Variant C, click tiles in both frames.** The rhythm should feel like one product. Note the
   sidebar was already there doing less (`deck-sidebar.tsx` shows stats and validation only), so
   hosting controls costs no new screen space.
4. **What desktop loses under C:** hover-to-adjust. Mouse users gain a select step they don't
   strictly need. That's the honest cost — decide whether it's acceptable.

## Outcome — Variant C

**Winner: C (one model, two containers).**

The interaction contract is identical at every breakpoint: **tap selects, controls live off the
tile, nothing depends on hover.** Only the container changes — the merged bottom bar on mobile, the
existing 320px sidebar on desktop.

This means the findings skill's rules are genuinely global, not mobile-only footnotes. No
per-breakpoint fork, one codepath, one thing to reason about.

**Accepted cost:** desktop loses hover-to-adjust. Mouse users gain a select step they don't strictly
need. Judged worth it for a single contract.

**Why B was rejected outright:** at ~68px desktop tiles its controls were already 30px — below the
44px floor — and still cramped. It fails harder on desktop than the pattern sketch 001 rejected at
118px.

**Why A was rejected:** desktop isn't roomy, it's just precise. Once the measurement showed desktop
tiles are *smaller* than mobile ones, the case for a fork rested only on preserving hover — not
enough to justify one component with two interaction contracts.

### Follow-on decisions this creates

- The desktop sidebar (`deck-sidebar.tsx`) gains a selected-card region above its existing stats.
  Today it renders stats and validation only.
- Hover could still be layered on desktop as an *accelerator* over the same contract. That
  reintroduces a second path, so it is a deliberate later decision, not part of this one.
- `estimateSize` (`card-grid.tsx:80`) stays valid at every breakpoint, since nothing is added below
  the art anywhere.

### Code observation worth confirming separately

`useColumnCount()` derives columns from **window** width (`card-grid.tsx:17-27`) while
`estimateSize` derives row height from **container** width (`card-grid.tsx:78`). With the 320px
sidebar present these disagree, which is how desktop ends up at ~68px tiles. Whether that is
intentional or a latent sizing bug is outside this sketch's scope but should be checked during
planning.

## Related

- Sketch 001 (winner B): `.planning/sketches/001-selector-tile-mobile/`
- Sketch 002 (winner C): `.planning/sketches/002-bottom-zone-and-detail-affordance/`
- Findings skill: `.claude/skills/sketch-findings-star-wars-unlimited-tracker/`

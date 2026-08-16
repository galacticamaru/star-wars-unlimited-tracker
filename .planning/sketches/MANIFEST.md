# Sketch Manifest

## Design Direction

Mobile deck building should feel **fast and rapid-fire**, keep **card art forward** as the primary
means of recognition, and be **confident and precise** — you always know what you tapped and what it
did. At 390px these three pull against each other: density wants small tiles, art wants big ones,
and precision wants 44px targets that don't fit in either. Resolving that tension is the whole
design problem.

Visual language follows the live app rather than inventing one: slate surfaces, indigo for deck
counts, amber for sideboard, red for shortfall. Card art is stood in with SWU aspect-colour
gradients so mockups stay offline and still read as the real product.

## Reference Points

- **Generic mobile commerce** — grid of images with a persistent per-tile quantity stepper. The
  pattern users already understand from any store app.
- Otherwise derived from constraints rather than borrowed. No TCG-tool conventions being matched.

## Sketches

| # | Name | Design Question | Winner | Tags |
|---|------|----------------|--------|------|
| 001 | selector-tile-mobile | What tile layout and control placement works for selector mode at 390px? | **B** — 3-col art-only tile + pinned action bar | mobile, deck-builder, catalog, touch, layout |
| 002 | bottom-zone-and-detail-affordance | With three things competing for the bottom of the screen, how do they coexist — and where does the detail-page link go? | _pending_ | mobile, navigation, feedback |

## Decisions So Far

- **Selector tiles stay 3 columns at mobile.** Density is preserved; controls move off the tile
  entirely rather than being squeezed into 118px (sketch 001).
- **Tapping a selector tile selects, it does not navigate.** The tile-wide `<Link>` goes away
  (`card-item.tsx:79`); the detail page needs a new affordance — sketch 002.
- **No hover-dependent controls.** Anything a touch user needs must be visible at rest.

## Context

- Root cause the sketches respond to: `.planning/notes/catalog-interaction-model.md`
- Forward-looking scope: `.planning/seeds/catalog-variant-drawer.md`

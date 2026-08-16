# Sketch Wrap-Up Summary

**Date:** 2026-08-16 (initial wrap: sketches 001–002 · appended: sketch 003)
**Sketches processed:** 3
**Design areas:** Tile layout & touch · Bottom chrome & navigation · Responsive & containers
**Skill output:** `./.claude/skills/sketch-findings-star-wars-unlimited-tracker/`

## Included Sketches

| # | Name | Winner | Design Area |
|---|------|--------|-------------|
| 001 | selector-tile-mobile | B — 3-col art-only tile + off-tile controls | Tile layout & touch |
| 002 | bottom-zone-and-detail-affordance | C — one merged 64px bar; corner ⓘ + long-press | Bottom chrome & navigation |
| 003 | responsive-scope | C — one model, two containers | Responsive & containers |

## Excluded Sketches

None.

## Design Direction

The catalog tile shows art and reports state — nothing else. It is not a link and hosts no
controls. Tapping selects; all mutation happens in a control surface elsewhere.

**This applies at every breakpoint.** Only the container changes: a merged bottom bar on mobile,
the existing 320px sidebar on desktop. One interaction contract, one codepath.

This inverts the current design, where the tile is a `<Link>` with a hover overlay bolted on.

## Key Decisions

**Layout**
- 3 columns retained at mobile — density beat control comfort; a 2-column variant cut visible cards
  from ~9 to ~4 and was rejected
- Tile contains art, a cost pip, and a deck-count badge; the badges are decorative, not targets
- One merged ~64px bottom bar on mobile rather than swapping bars (hides the count) or stacking
  them (costs a grid row)
- On desktop the existing sidebar hosts the selected-card controls above its current stats — no new
  screen real estate, no new component category

**Interaction**
- Tap selects; it does not navigate. The tile-wide `<Link>` is removed at every breakpoint
- Nothing hover-dependent — `opacity: 0` does not remove hit-testing, so invisible controls still
  receive taps on touch. Desktop accepts losing hover-to-adjust in exchange for a single contract
- 44px floor for every real target
- Card detail pages reached via a corner ⓘ plus long-press; the pages themselves are unchanged and
  stay shareable

**Measured facts**

| Context | Columns | Container | Tile |
|---|---|---|---|
| Mobile 390px | 3 | ~390px | ~118px |
| Desktop `lg` 1024px, deck builder | 9 | ~704px (window − sidebar) | ~68px |

A stepper needs ~180px. Desktop tiles are *smaller* than mobile ones, so on-tile controls fail at
every width — which is what settled the responsive question.

**Implementation constraints**
- Keeping controls off the tile preserves the existing virtualizer `estimateSize` heuristic
  (`card-grid.tsx:80`) at every breakpoint
- The stats trigger must stop being `fixed` (`deck-builder.tsx:710`) and join the flex column

## Open Risks Carried Forward

Accepted at selection, unresolved — planning inputs, not settled guidance:

1. Corner ⓘ is 22px, below the 44px floor. Long-press is the real target. Needs device testing;
   fallback is promoting ⓘ into the control surface.
2. The deck count is both a display and a button — discoverability unverified.
3. Long-press has no accessible equivalent; the corner ⓘ must be a real focusable button.
4. Long-press can fire during a slow scroll — needs a movement threshold to cancel.
5. `useColumnCount()` reads window width while `estimateSize` reads container width
   (`card-grid.tsx:17-27` vs `:78`). With the 320px sidebar present they disagree — the mechanism
   behind the ~68px desktop tiles. Confirm whether intentional or a latent sizing bug.

## Not Yet Sketched

Frontier mode surfaced two candidates that were deferred:

- **004 — catalog variant drawer.** The seed's main scope. Assumed to port cleanly from the binder's
  `VariantTradeSheet`, but the catalog context adds ownership, deck state, and a different entry
  gesture. Also unchecked: whether a right-side drawer (catalog) and a bottom bar (selector) read as
  one product on visually identical tiles.
- **005 — search-first grid states.** Zero results, loading, empty collection.

## Origin

The sketches respond to a root cause identified during `/gsd-explore`:
`.planning/notes/catalog-interaction-model.md`. Forward-looking scope for the wider catalog drawer
work is in `.planning/seeds/catalog-variant-drawer.md`.

# Sketch Wrap-Up Summary

**Date:** 2026-08-16
**Sketches processed:** 2
**Design areas:** Tile layout & touch · Bottom chrome & navigation
**Skill output:** `./.claude/skills/sketch-findings-star-wars-unlimited-tracker/`

## Included Sketches

| # | Name | Winner | Design Area |
|---|------|--------|-------------|
| 001 | selector-tile-mobile | B — 3-col art-only tile + off-tile controls | Tile layout & touch |
| 002 | bottom-zone-and-detail-affordance | C — one merged 64px bar; corner ⓘ + long-press | Bottom chrome & navigation |

## Excluded Sketches

None.

## Design Direction

The mobile catalog tile shows art and reports state — nothing else. It is not a link and hosts no
controls. Tapping selects; all mutation happens in a single merged bar pinned to the bottom, which
also carries the running deck count and opens the deck-stats sheet.

This inverts the current design, where the tile is a `<Link>` with a hover overlay on top.

## Key Decisions

**Layout**
- 3 columns retained at mobile — density beat control comfort; a 2-column variant cut visible cards
  from ~9 to ~4 and was rejected
- Tile contains art, a cost pip, and a deck-count badge; the badges are decorative, not targets
- One merged ~64px bottom bar rather than swapping bars (hides the count) or stacking them (costs a
  grid row)

**Interaction**
- Tap selects; it does not navigate. The tile-wide `<Link>` is removed
- Nothing hover-dependent — `opacity: 0` does not remove hit-testing, so invisible controls still
  receive taps on touch
- 44px floor for every real target
- Card detail pages reached via a corner ⓘ plus long-press; the pages themselves are unchanged and
  stay shareable

**Implementation constraints**
- Keeping controls off the tile preserves the existing virtualizer `estimateSize` heuristic
  (`card-grid.tsx:80`), which assumes tile height = width × 1.5 with no allowance for a control bar
- The stats trigger must stop being `fixed` (`deck-builder.tsx:710`) and join the flex column, or it
  renders on top of the merged bar

## Open Risks Carried Forward

Accepted at selection, unresolved — planning inputs, not settled guidance:

1. Corner ⓘ is 22px, below the 44px floor. Long-press is the real target. Needs device testing;
   fallback is promoting ⓘ into the merged bar.
2. The deck count is both a display and a button — discoverability unverified.
3. Long-press has no accessible equivalent; the corner ⓘ must be a real focusable button.
4. Long-press can fire during a slow scroll — needs a movement threshold to cancel.

## Origin

The sketches respond to a root cause identified during `/gsd-explore`:
`.planning/notes/catalog-interaction-model.md`. Forward-looking scope for the wider catalog drawer
work is in `.planning/seeds/catalog-variant-drawer.md`.

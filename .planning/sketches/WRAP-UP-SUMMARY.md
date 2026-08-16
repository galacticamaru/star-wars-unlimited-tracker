# Sketch Wrap-Up Summary

**Date:** 2026-08-16 (initial wrap: 001–002 · appended: 003 · appended: 004–005)
**Sketches processed:** 5
**Design areas:** Tile layout & touch · Bottom chrome & navigation · Responsive & containers ·
Catalog drawer & states
**Skill output:** `./.claude/skills/sketch-findings-star-wars-unlimited-tracker/`

## Included Sketches

| # | Name | Winner | Design Area |
|---|------|--------|-------------|
| 001 | selector-tile-mobile | B — 3-col art-only tile + off-tile controls | Tile layout & touch |
| 002 | bottom-zone-and-detail-affordance | C — one merged 64px bar; corner ⓘ + long-press | Bottom chrome & navigation |
| 003 | responsive-scope | C — one model, two containers | Responsive & containers |
| 004 | catalog-variant-drawer | A — port the binder sheet as-is | Catalog drawer & states |
| 005 | catalog-state-vocabulary | A — inline per-row errors + one grid-state component | Catalog drawer & states |

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

**Catalog drawer & feedback**
- The catalog drawer is a straight port of the binder's `VariantTradeSheet` — three stacked sections,
  existing components untouched. A denser unified table was rejected for 26px cells; progressive
  disclosure was rejected for layout shift
- Card detail pages stay as shareable URLs; the drawer removes the need to navigate to them
- Failed optimistic writes surface **inline on the row that failed** — red row, number shakes back,
  Retry beneath. Chosen for attribution: 12 steppers in one drawer
- One grid-state component covers `idle / loading / empty / error`, replacing `empty-state.tsx` and
  the inline blocks at `manage/page.tsx:385-407`. Loading uses skeleton tiles, not a spinner
- Two mutation surfaces are acceptable — ambient bar for one number, modal drawer for twelve

**Implementation constraints**
- Keeping controls off the tile preserves the existing virtualizer `estimateSize` heuristic
  (`card-grid.tsx:80`) at every breakpoint
- The stats trigger must stop being `fixed` (`deck-builder.tsx:710`) and join the flex column
- **BLOCKING:** the three variant sections must share state before the drawer ships.
  `VariantTradeSection` gates on `ownedCount` while `VariantCollectionSection` mutates it locally.
  Lifting state into the drawer also collapses three `router.refresh()` calls into one and gives the
  inline error map a home — one refactor serving both sketches

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
6. **Non-drawer optimistic writes have no error vocabulary.** Inline row errors need a row to attach
   to. Deck-builder selector writes and other binder writes still fail silently. The global-toast
   alternative was rejected because a 4-second toast recreates the silent revert it was meant to
   fix. Not a blocker; an open hole in the error contract.
7. **Multi-failure error stacking is untested** — offline mid-session produces several red rows at
   once, never seen on a real device with a real network drop.
8. **Prop contract mismatch** — the detail page passes no `onQuantityChange` to
   `VariantTradeSection` (`page.tsx:67`) while the sheet does.
9. **Section membership disagreement** — the detail page renders Collection + Trade; the sheet
   renders all three. Whether the drawer and detail page should agree is undecided.

## Settled by Omission

The two-surface split (ambient bar for the selector, modal drawer for the catalog) was presented as
a coherence check during sketch 004 and not separately contested. It is recorded as acceptable
scaling of one contract. If it later feels wrong, that is a deliberate reopen — not a discovery.

## Not Yet Sketched

Frontier mode's original queue is now empty. Nothing is pending; a fresh frontier pass would need to
analyze the five-sketch landscape from scratch.

## Origin

The sketches respond to a root cause identified during `/gsd-explore`:
`.planning/notes/catalog-interaction-model.md`. Forward-looking scope for the wider catalog drawer
work is in `.planning/seeds/catalog-variant-drawer.md`.

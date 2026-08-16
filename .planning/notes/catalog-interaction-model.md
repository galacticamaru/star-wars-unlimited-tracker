---
title: Catalog interaction model — drawer for catalog, inline for deck selector
date: 2026-08-16
context: Exploration after v7 close, scoping candidate work for v8
---

# Catalog interaction model

## Origin

Two separate complaints raised during post-v7 exploration:

1. Adding cards to a deck on mobile feels clunky — the add controls feel imprecise.
2. Catalog actions (add/remove) force a trip to the card detail page. Lots of clicks, painful across multiple cards. The trade binder already solved this with a side drawer.

They are the same defect.

## Root cause

**The catalog tile's primary action is "navigate", and mutation is a hover overlay bolted on top.**

Complaint 2 is that navigation. Complaint 1 is that overlay failing at phone width.

Three compounding failures in selector mode (`src/components/catalog/card-item.tsx:118-165`):

- **Hover overlay on a touch device.** Controls are `opacity-0 group-hover:opacity-100`
  (`card-item.tsx:119`). Touch has no hover; browsers fake it with sticky-hover on first tap.
  `opacity-0` does *not* remove hit-testing, so the +/- buttons are invisible and still tappable,
  sitting over the card art.
- **The whole tile is a `<Link>`** to `/cards/[set]/[id]` (`card-item.tsx:79`). A mistap navigates
  away and costs you your grid position.
- **The control is wider than the tile.** Grid is `grid-cols-3` at mobile (`card-grid.tsx:12`) —
  ~118px tile on a 390px phone. The add pill needs `px-3` + 44px + `gap-3` + "In Deck" label +
  `gap-3` + 44px ≈ **180px minimum**.

Note the interaction between the last two: v6 Phase 26 correctly sized touch targets to 44px, which
made them overflow a tile half that wide. The 44px fix and the 3-column grid are in direct conflict.

## Why the fix is cheaper than it looks

The card detail page is already just a routed wrapper around the body the binder drawer shows:

- `src/app/cards/[set-code]/[card-number]/page.tsx:63,67` renders `VariantCollectionSection` +
  `VariantTradeSection`.
- `src/components/binder/variant-trade-sheet.tsx:51-59` renders those same two, plus
  `VariantWantSection`.
- All three already live in `src/components/catalog/` — they were built in the catalog namespace.

`VariantTradeSheet` is `side="right"`, `w-full sm:max-w-sm` (`variant-trade-sheet.tsx:37`) —
full-screen on a phone, drawer on desktop. The pattern is already correct and already ported
halfway.

One asymmetry to handle: the detail page passes `printings` to `VariantTradeSection` with no
`onQuantityChange`; the sheet passes a handler.

## Decision

**Split by job. The catalog tile serves two different ones.**

| Mode | Tap action | Rationale |
|---|---|---|
| Catalog / collection | Open drawer (own / trade / want) | Depth: one card, several variants, needs room |
| Selector (deck builder) | Inline `+`/`-`, redesigned for touch | Speed: 50 cards a session, a drawer per card would be *more* taps |

Selector redesign must address: always-visible controls (no hover dependency), column count and tile
size at 390px, and removing or relocating the tile-wide `<Link>` so mistaps stop navigating.

**Card detail pages stay.** They remain useful as shareable URLs for linking other users to a
specific card — and they cost nothing to keep, since they are the routed wrapper around the same
body.

## Adjacency

The pending todo `2026-07-20-stale-trade-availability-after-collection-add-on-binder-mana.md` is a
client-state freshness bug *in the variant sheet* (collection add doesn't make a card tradeable
without reload; no `onOwnedCountChange` callback). If the drawer becomes the catalog's main mutation
surface, that stops being a binder edge case and becomes the core interaction. Same work, larger
blast radius — sequence it with the drawer port.

See [[catalog-variant-drawer]].

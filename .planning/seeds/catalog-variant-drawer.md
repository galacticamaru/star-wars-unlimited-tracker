---
title: Catalog variant drawer + touch-viable deck selector
trigger_condition: Next milestone scoping (v8) — or sooner if mobile deck building becomes blocking
planted_date: 2026-08-16
---

# Catalog variant drawer + touch-viable deck selector

## The idea

Stop making the catalog tile navigate. Give it two mode-appropriate actions:

- **Catalog / collection mode** — tap opens a variant drawer (own / trade / want), porting the
  binder's `VariantTradeSheet` pattern to catalog tiles.
- **Selector mode (deck builder)** — keep inline `+`/`-`, but redesign so it actually works on a
  touch screen.

Card detail pages stay as-is. They are still wanted as shareable URLs for linking other users to a
specific card, and they are already the routed wrapper around the same body the drawer renders.

## Why it's worth doing

Two independent pain points collapse into one fix:

- Catalog add/remove costs a full page navigation per card — brutal across multiple cards.
- Deck-builder add controls are effectively unusable on a phone: a hover overlay that stays
  hit-testable while invisible, ~180px of controls inside a ~118px tile, and a tile-wide `<Link>`
  that swallows mistaps.

Full root-cause analysis and the file:line evidence: [[catalog-interaction-model]].

## Why it's cheap

The pieces exist:

- `VariantCollectionSection`, `VariantTradeSection`, `VariantWantSection` already live in
  `src/components/catalog/`.
- `variant-trade-sheet.tsx` already composes them behind a `Sheet` that is full-screen on mobile and
  a right drawer on desktop.
- `/cards/[set-code]/[card-number]/page.tsx` already renders the same body.

The work is largely: change what the tile's tap does, thread the mutation handlers into catalog
mode, and redesign the selector tile for touch.

## Open questions

- Selector-mode layout at 390px — column count, control placement, and where the "view detail page"
  affordance goes once the tile is no longer a `<Link>`. Worth a `/gsd-sketch` pass before planning.
- Does the drawer need a "view full card page" link for the sharing use case?
- Detail page currently passes no `onQuantityChange` to `VariantTradeSection` while the sheet does —
  reconcile the prop contract.

## Sequencing note

Pull in the pending todo
`2026-07-20-stale-trade-availability-after-collection-add-on-binder-mana.md` with this work. It is a
client-state freshness bug in the variant sheet (no `onOwnedCountChange` callback). Promoting the
drawer to the catalog's primary mutation surface makes that bug far more visible.

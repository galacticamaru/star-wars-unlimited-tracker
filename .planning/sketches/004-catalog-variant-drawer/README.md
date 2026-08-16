---
sketch: 004
name: catalog-variant-drawer
question: "What's in the catalog variant drawer, and how do its sections relate to each other?"
winner: "A"
tags: [catalog, drawer, state, variants, coherence]
---

# Sketch 004: Catalog variant drawer

## Design Question

The seed proposes porting the binder's `VariantTradeSheet` to catalog tiles so that owning, trading
and wanting a card no longer costs a page navigation. The container question is already answered —
the binder proved a `Sheet` that is full-screen on mobile and a right drawer on desktop.

The unanswered question is **how the drawer's sections relate to each other**, and it turns out to
matter more than the container.

### What grounding found

The three variant sections each hold their own `useState`, seeded from props, with independent
optimistic updates and their own `router.refresh()`:

| Component | Owns | Line |
|---|---|---|
| `VariantCollectionSection` | `counts` from `ownedCount` | `variant-collection-section.tsx:22` |
| `VariantTradeSection` | `counts` from `tradeQuantity` — **gated on `ownedCount`** | `variant-trade-section.tsx:25` |
| `VariantWantSection` | `counts` from `quantity` | `variant-want-section.tsx:23` |

`VariantTradeSection` is gated on ownership, but `VariantCollectionSection` mutates ownership in its
own local state and never tells it. That is the pending todo
(`2026-07-20-stale-trade-availability-after-collection-add-on-binder-mana.md`) — and in a drawer
showing all three sections *at once*, it stops being an edge case and becomes the thing on screen.

Also noted: the card detail page renders only Collection + Trade
(`/cards/[set-code]/[card-number]/page.tsx:63,67`), while the binder sheet renders all three. The
surfaces already disagree about what belongs.

## How to View

```
open .planning/sketches/004-catalog-variant-drawer/index.html
```

The toolbar has a **Phone view** toggle that reflows the frames to 390px / 3 columns.

## Variants

- **A: Port the binder sheet as-is** — three stacked sections, each independent. Faithfully
  simulates the lagging trade gate, including a 2-second "refresh" delay and a `router.refresh()`
  counter, so the bug is experienced rather than described.
- **B: Unified variant table** — one row per printing, columns for Owned / Trade / Want. One state
  object per row; the coupling disappears by construction.
- **C: Ownership-first, progressive** — keeps the three sections but shares one state object and
  makes the ownership gate explicit: Trade is absent with a stated reason until you own something.
- **◇ Coherence check** — the deck-builder bottom bar and the catalog drawer shown side by side at
  the same width, to judge whether two mutation surfaces on identical-looking tiles read as one
  product.

## What to Look For

1. **On A, open a card and add a copy of an unowned variant.** The Trade row stays locked for
   ~2 seconds. Watch the counter at bottom-left — each section fires its own refresh. This is the
   current architecture, not a strawman.
2. **On B, do the same.** Trade unlocks in the same row instantly. No refresh, no callback
   threading — the row owns all three numbers.
3. **Switch to Phone view and look at B's table cells.** They are 26px, below the 44px floor
   established in sketch 001. This is B's real cost and the thing most likely to sink it.
4. **On C, watch the layout shift** as the Trade section appears and disappears while you edit
   ownership. Judge whether that reads as responsive or jumpy.
5. **Compare drawer height across A and C** for Vanquish (4 printings). A is roughly 3× B.
6. **On the Coherence tab**, decide whether an ambient bottom bar for one number and a modal drawer
   for twelve is a sensible scaling of the same contract, or a split worth removing.

## Stack Notes

- Data shapes in the mockup are the real ones:
  `Printing { id, variantType, collectorNumber, ownedCount, tradeQuantity, quantity }`.
- Endpoints differ per section — `/api/collection/variants` (POST), `/api/trade` (PATCH), and the
  want route. A unified row still needs three calls; B changes the UI, not the API surface.
- B is the largest rewrite: the three components stop being reusable as-is and their shared
  optimistic-update logic would need extracting into one row component.
- The detail page passes no `onQuantityChange` to `VariantTradeSection` while the sheet does — the
  prop contract needs reconciling regardless of which variant wins.

## Outcome — Variant A

**Winner: A (port the binder sheet as-is).**

Three stacked sections — Collection, Trade, Want — composed exactly as `variant-trade-sheet.tsx`
does today, opened from a catalog tile instead of a binder row. The container is the proven
`Sheet`: full-screen on mobile, right drawer on desktop.

The rationale is component preservation. `VariantCollectionSection`, `VariantTradeSection` and
`VariantWantSection` already live in `src/components/catalog/` and are proven in the binder. A keeps
them untouched and treats the state coupling as a **wiring fix**, not a reason to redesign the
surface.

**What A does not do is resolve the coupling.** B resolved it by construction and was rejected on
touch grounds (26px cells, below the 44px floor); C resolved it with shared state and was rejected
for layout shift. Under A the fix is explicit work, not a property of the design.

### Blocking prerequisite

**The stale trade gate must be fixed before this ships.** In the binder it is a deferred edge case
(pending todo `2026-07-20-stale-trade-availability-after-collection-add-on-binder-mana.md`). In the
catalog drawer all three sections are visible simultaneously, so a locked Trade row sitting directly
below a Collection row you just incremented is the primary thing on screen.

Two ways to close it, both compatible with A:

1. **Lift state up** — the drawer owns one `printings` state object and passes values plus setters
   down. Sections keep their markup, lose their local `useState`.
2. **Thread a callback** — add `onOwnedCountChange` to `VariantCollectionSection` mirroring the
   existing `onQuantityChange` on the other two, and have the drawer re-derive the gate.

Option 1 also collapses the three independent `router.refresh()` calls into one.

### Other carried items

- **Prop contract mismatch.** The detail page passes no `onQuantityChange` to `VariantTradeSection`
  (`page.tsx:67`) while the sheet does. Reconcile when the drawer is built.
- **Section membership disagreement.** The detail page renders Collection + Trade only; the binder
  sheet renders all three. Decide whether the catalog drawer and the detail page should now match.
- **Drawer height.** With 4 printings (e.g. Vanquish), A is roughly 3× the height of B and scrolls
  on a phone. Acceptable, but worth checking against real cards with the most printings.

## Coherence check — outcome

The panel compared the deck-builder bottom bar against the catalog drawer at the same width.

**Shared:** identical tiles, identical selection ring, identical corner ⓘ, tap-selects-never-
navigates, controls always off-tile, nothing hover-dependent.

**Divergent:** container (ambient bar vs modal drawer), depth (one number vs three per printing),
dismissal (never blocks vs must be closed), persistence (re-targets across cards vs closes and
reopens).

**Read:** the contract is shared and only the container scales with the depth of the job. Recorded
as acceptable. This was not separately contested during selection, so if the two-surface split later
feels wrong, it should be reopened deliberately rather than treated as settled by omission.

## Related

- Seed: `.planning/seeds/catalog-variant-drawer.md`
- Root cause: `.planning/notes/catalog-interaction-model.md`
- Sketches 001–003 and the findings skill establish the tile and container rules this builds on.

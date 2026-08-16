---
sketch: 002
name: bottom-zone-and-detail-affordance
question: "With the action bar, the stats trigger, and the deck count all wanting the bottom of the screen, how do they coexist — and where does the detail-page link go once the tile isn't a <Link>?"
winner: "C"
tags: [mobile, navigation, feedback, deck-builder]
---

# Sketch 002: Bottom zone & detail affordance

## Design Question

Sketch 001 chose Variant B — a pinned action bar. That created two problems at once:

**1. The bottom of the screen is now contested.** Three things want it:

| Element | Height | Source |
|---|---|---|
| Deck stats sheet trigger | 56px | `deck-builder.tsx:710` — currently `fixed bottom-0`, full width |
| Pinned action bar | ~70px | Sketch 001 winner |
| Running deck count | ~44px | Wanted visible while building |

The stats trigger is `fixed`, so today it would render *on top of* the action bar. This is a
layout conflict, not a polish item.

**2. The detail page needs a new front door.** Selector tiles stop being `<Link>`s, but card detail
pages stay — they're wanted as shareable URLs for linking other players to a card.

## How to View

```
open .planning/sketches/002-bottom-zone-and-detail-affordance/index.html
```

## Variants

- **A: Swap on select** — one slot, ~56px. No selection shows the stats trigger; selection replaces
  it with the action bar. Detail via an ⓘ button in the action bar.
- **B: Stack both** — action bar above the stats trigger, ~118px when active. Deck count stays
  visible the whole time you're adding. Detail via the same ⓘ button.
- **C: Merge into one** — a single ~64px bar. Card identity and stepper on the left, running deck
  count on the right doubling as the stats trigger. Detail moves back onto the grid: a corner ⓘ on
  the tile plus long-press.

## What to Look For

**Turn on `Measure`** — it outlines the bottom zone and reports its live height per variant. The
whole question is what that number costs you.

1. **Add cards and watch the deck count.** A hides it while you're adding — the exact "can't see
   what I'm building" complaint that started this. B and C keep it. Does A's in-bar count chip
   compensate, or is it too small a signal?
2. **Count grid rows while a card is selected.** B costs roughly one row (~9 cards → ~6). Is
   persistent context worth that?
3. **On C, hold a tile for half a second** — the fill ring runs and the detail page opens.
   Then try the 22px corner ⓘ. That icon is below the 44px floor; long-press is the real target and
   the icon is the visual hint. Judge whether that compromise is acceptable or whether it repeats
   the original sin of a too-small control.
4. **On C, tap the deck count on the right** — it opens the stats sheet. Is a number that's also a
   button discoverable without a label?
5. **Deselect** (tap the selected card again) in each variant and watch how the bottom settles.

## Stack Notes

- The existing stats trigger is `fixed bottom-0 left-0 right-0 h-14 z-50` (`deck-builder.tsx:710`).
  All three variants require it to stop being `fixed` and become part of a flex column, otherwise it
  overlaps whatever else lands there.
- The sheet itself (`deck-builder.tsx:723`, `SheetContent side="bottom"`) is unchanged in all three
  — only its trigger moves.
- C is the only variant that needs a new gesture (long-press), which means a new interaction to
  test on real devices and an accessibility fallback for keyboard/screen-reader users.

## Outcome — Variant C

**Winner: C (one merged ~64px bar).**

The bottom collapses to a single bar. Selected card identity plus stepper on the left, running deck
count on the right doubling as the stats-sheet trigger. Costs ~8px more than the cheapest option
(A) while keeping the deck count visible the entire time you're building — which was the original
complaint.

Detail-page access moves back onto the grid: a corner ⓘ on the tile plus long-press. Detail pages
themselves are untouched and remain shareable URLs.

### Risks carried into implementation

These were flagged at selection and accepted. They are not resolved — they need to be handled during
planning, not rediscovered:

1. **The corner ⓘ is 22px, below the 44px touch floor.** Long-press is the intended real target and
   the icon is a visual hint. This is structurally similar to the reasoning that produced the
   original broken overlay, so it warrants explicit device testing. If it fails, the fallback is to
   promote ⓘ into the merged bar and drop the corner icon.
2. **The deck count is both a display and a button.** Discoverability is unverified — a number that
   opens a sheet has no conventional affordance. The `▲` chevron is the only hint. Consider whether
   it needs a border, a background, or a label.
3. **Long-press needs an accessible equivalent.** Keyboard and screen-reader users cannot long-press.
   The corner ⓘ must be a real focusable `<button>` with an accessible name, not decoration.
4. **Long-press must not fight scrolling.** A 500ms hold on a scrolling grid risks firing during a
   slow drag. Needs a movement threshold that cancels the press.

### Applies regardless of variant

The existing stats trigger is `fixed bottom-0 left-0 right-0 h-14 z-50` (`deck-builder.tsx:710`).
It must stop being `fixed` and join the flex column, or it will render on top of the merged bar. The
`Sheet` itself (`deck-builder.tsx:723`) is unchanged — only its trigger moves.

## Related

- Sketch 001 (winner: B): `.planning/sketches/001-selector-tile-mobile/`
- Root cause: `.planning/notes/catalog-interaction-model.md`

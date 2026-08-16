---
sketch: 005
name: catalog-state-vocabulary
question: "What is the catalog's state vocabulary once it becomes a mutation surface, and what does a failed optimistic write look like?"
winner: "A"
tags: [states, errors, empty-state, catalog, consistency]
---

# Sketch 005: Catalog state vocabulary

## Design Question

This started as "sketch the empty and loading states." Grounding showed a bigger gap.

### The two surfaces diverge

| | Catalog `/cards` | Manage Binder (v7) |
|---|---|---|
| Data | Fully server-rendered | Lazy client fetch on 2nd keystroke |
| Idle | Shows everything | "Type at least 2 characters" |
| Loading | **none** | Spinner + "Loading catalog…" |
| Error | **none** | Dashed box + Retry |
| Zero results | `empty-state.tsx` — "No matching cards" | `manage/page.tsx:404` — "No cards found" |

The catalog has two states, the binder has five, and the one situation they share looks different in
each — different container, type scale, and copy.

### The catalog is about to need a vocabulary it doesn't have

The catalog has no loading or error states because nothing there was ever async. **Sketch 004
changed that** — the variant drawer makes every catalog interaction a `fetch` plus an optimistic
update plus `router.refresh()`.

And there is a concrete gap already in the code: all three variant sections roll back on failure and
`console.error`. Nothing reaches the user.

```js
// variant-collection-section.tsx:52-56 — same shape in the trade and want sections
setCounts(c => ({ ...c, [cardPrintingId]: prev }));   // silent rollback
console.error('Failed to update variant count:', await res.text());
```

In the drawer that means your number silently snaps back with no explanation.

## How to View

```
open .planning/sketches/005-catalog-state-vocabulary/index.html
```

Each variant tab has a **driver bar**: cycle the grid through `results / empty / loading / error /
idle`, and set mutations to `succeed / fail next / fail all`. Then open a card and use the steppers.

## Variants

All three share the same converged grid-state treatment; they differ only in **where a failed
mutation surfaces**.

- **A: Inline per-row** — the failing row turns red, the number shakes back, and a Retry sits
  directly beneath it.
- **B: Drawer banner** — failures collapse into one region under the card title with a single
  Retry-all.
- **C: Global toast** — a toast outside the drawer; one mechanism that would serve every optimistic
  write in the app.
- **◇ Today's divergence** — the two current empty states side by side with the proposed converged
  one, plus all four states of the unified component.

## What to Look For

1. **Set "fail next", then increment a Collection count.** Watch the rollback. Compare how much you
   understand about what happened in each variant.
2. **Set "fail all" and hit several steppers.** A stacks red rows; B collapses to one banner; C
   queues toasts. Offline is the realistic case for this.
3. **On B, scroll the drawer down before failing.** The banner can appear above the fold and never
   be seen — the same class of problem the merged bottom bar avoided in sketch 002.
4. **On C, wait 4 seconds after a failure.** The toast leaves, and you're back to a reverted number
   with no explanation — the exact situation this sketch exists to fix.
5. **Cycle the grid states** with the driver. Judge whether one component can carry idle, loading,
   empty and error without any of them feeling forced.
6. **Attribution test:** with 4 printings × 3 sections there are 12 steppers in one drawer. Ask
   which variant tells you *which* one failed.

## Stack Notes

- No toast primitive exists in `src/components/ui/` today (`badge`, `button`, `card`, `dialog`,
  `dropdown-menu`, `input`, `label`, `sheet`, `switch`, `tabs`, `textarea`, `tooltip`). Variant C
  adds one.
- The loading variant uses skeleton tiles rather than a spinner, matching the streaming-skeleton
  approach used in v6 Phase 27/29.
- A converged component replaces `empty-state.tsx` and the inline blocks in `manage/page.tsx:385-407`
  — the binder additionally needs `idle` and `loading`, which the catalog does not.
- Whichever variant wins, the three sections need their `catch` blocks to surface state rather than
  only `console.error`.

## Outcome — Variant A

**Winner: A (inline, on the row that failed).**

A failed write turns its variant row red, shakes the number back to its previous value, and shows a
one-line "Reverted — couldn't save" with a Retry directly beneath.

Chosen for attribution. A 4-printing card puts 12 steppers in one drawer; only a row-level treatment
can say *which* one failed without making the user infer it from text. Retry also lands within reach
of the control that just failed.

**Also adopted:** the converged grid-state treatment shown on the divergence tab — one component
covering `idle / loading / empty / error`, replacing `empty-state.tsx` and the inline blocks at
`manage/page.tsx:385-407`. The catalog uses `empty` and `error`; the binder additionally uses `idle`
and `loading` because it fetches lazily.

### Accepted costs

- **Layout shift.** The row grows to fit its message, nudging everything below it. Acceptable
  because it is local and self-explanatory, but it means the drawer moves under the user's finger at
  the moment something went wrong.
- **Stacking under multi-failure.** Going offline mid-session produces several red rows at once.
  Judged informative rather than alarming, but it is the untested case — nobody has seen it on a
  real phone with a real network drop.

### Scope gap — recorded, not solved

**A only covers writes that happen inside a variant list.** Optimistic writes elsewhere still fail
silently:

- Deck-builder selector count changes (sketch 001–003 model)
- The binder's own `VariantTradeSheet`, which shares these components and would inherit the fix, but
  the binder page has other writes that would not
- Any future optimistic write with no row to attach an error to

C (global toast) was the only variant that answered this, and it was rejected because a 4-second
toast recreates the silent-revert problem it was meant to fix. **That leaves non-drawer writes with
no error vocabulary at all.** Options if it becomes a problem: pair A with a minimal persistent
toast for orphan writes, or give each write surface its own inline treatment.

This is not a blocker for the drawer work. It is a known hole in the error contract.

### Implementation note

Whichever surface, the three sections' `catch` blocks must surface state instead of only
`console.error` (`variant-collection-section.tsx:52-56` and the same shape in the trade and want
sections). Under A that means each section tracks a per-printing error map alongside its counts —
which composes naturally with the state-lifting fix that sketch 004 made a prerequisite.

## Related

- Sketch 004 (drawer): `.planning/sketches/004-catalog-variant-drawer/`
- Seed: `.planning/seeds/catalog-variant-drawer.md`

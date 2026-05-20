# Phase 18: Catalog Collection Enhancements - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 18-Catalog-Collection-Enhancements
**Areas discussed:** Variant Art Delivery, Starter Deck Data Source, Quick-Add Placement & UX, Quick-Add Quantity Behavior

---

## Variant Art Delivery

| Option | Description | Selected |
|--------|-------------|----------|
| Client-side lookup map | RSC passes printingArtMap (cardPrintingId → artUrl) to client; client computes best variant from CollectionMap.variants | ✓ |
| Server-side enriched query | Extend getAllCards with window/lateral subquery to return best-variant art URL per user | |
| You decide | Planner picks whichever fits codebase better | |

**User's choice:** Client-side lookup map

| Option | Description | Selected |
|--------|-------------|----------|
| Always fall back to Normal art | Logged-out / zero-owned users see Normal art — same code path | ✓ |
| You decide | Planner handles logged-out edge case | |

**User's choice:** Always fall back to Normal art

| Option | Description | Selected |
|--------|-------------|----------|
| Most premium variant wins | Showcase > Hyperspace > Foil > Normal tie-break | ✓ |
| Highest cardPrintingId wins | Tie-break by insertion order — simple and deterministic | |
| You decide | Planner picks the tie-break rule | |

**User's choice:** Most premium variant wins

---

## Starter Deck Data Source

| Option | Description | Selected |
|--------|-------------|----------|
| Static in-code arrays | Hard-coded deck definitions in src/data/starter-decks.ts | ✓ |
| DB-seeded table | New starter_decks + starter_deck_cards tables seeded via migration | |
| swu-db.com API | Pull from swu-db.com if they expose precon deck endpoints | |

**User's choice:** Static in-code arrays

| Option | Description | Selected |
|--------|-------------|----------|
| All known official SWU starters | All sets (SOR, SHD, TWI, etc.) — researcher gathers full list | ✓ |
| SOR starters only for now | Start with two SOR starters; add more per-set later | |
| You decide | Planner decides scope based on data availability | |

**User's choice:** All known official SWU starters

| Option | Description | Selected |
|--------|-------------|----------|
| src/lib/starter-decks.ts | Consistent with lib pattern for pure data/logic | |
| src/data/starter-decks.ts | New /data directory signals static reference data | ✓ |
| You decide | Planner picks the file location | |

**User's choice:** src/data/starter-decks.ts

---

## Quick-Add Placement & UX

| Option | Description | Selected |
|--------|-------------|----------|
| Collection page import section | Alongside existing CSV import — semantically a collection population action | ✓ |
| Catalog page toolbar | Button in catalog top bar or sidebar | |
| Both | Available on collection and catalog pages | |

**User's choice:** Collection page import section

| Option | Description | Selected |
|--------|-------------|----------|
| Dropdown select + confirm button | Select from list, click "Add to Collection" | ✓ |
| Card list for each starter | Visual cards per deck with individual Add buttons | |

**User's choice:** Dropdown select + confirm button

| Option | Description | Selected |
|--------|-------------|----------|
| Toast notification | "Added N cards from Deck Name to your collection." | ✓ |
| Inline text below the button | Success message replaces button area | |
| You decide | Planner picks confirmation style | |

**User's choice:** Toast notification

---

## Quick-Add Quantity Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Actual deck quantities | Add exact quantities from starter deck definition (e.g., 3× if deck has 3) | ✓ |
| Always 1 copy per card | Flat 1× per unique card — simpler but less accurate | |

**User's choice:** Actual deck quantities

| Option | Description | Selected |
|--------|-------------|----------|
| Increment on top | Adds to existing counts — correct for "I bought another starter" | ✓ |
| Set (overwrite) | Sets to deck quantities, ignoring existing values — risk of data loss | |

**User's choice:** Increment on top

| Option | Description | Selected |
|--------|-------------|----------|
| Normal variant only | Starter decks contain Normal prints; target Normal cardPrintingId | ✓ |
| You decide | Planner figures out variant mapping | |

**User's choice:** Normal variant only

---

## Claude's Discretion

- Whether to batch DB writes for quick-add or use sequential awaits (Neon HTTP driver has no transactions)
- Whether `printingArtMap` is fetched via a new dedicated query function or inline in the catalog RSC
- Whether the quick-add section uses an existing UI component or inline layout elements

## Deferred Ideas

None — discussion stayed within phase scope.

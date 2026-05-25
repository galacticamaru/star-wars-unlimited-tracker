# Phase 21: Binder Variant Badges - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-21
**Phase:** 21-binder-variant-badges
**Areas discussed:** Variant art in public binder, Old tradeQuantity column, Multiple variants of same card

---

## Variant art in public binder

| Option | Description | Selected |
|--------|-------------|----------|
| Variant art + badge | Tile shows the actual Foil/Showcase art URL from card_printings for the offered printing, plus a variant badge | ✓ |
| Normal art + badge only | Always show Normal art, but add the variant badge | |

**User's choice:** Variant art + badge

---

| Option | Description | Selected |
|--------|-------------|----------|
| Add variantType to CardItem | Add `variantType?: string` to CardItemProps; render badge in binder mode only — consistent with ManageTradeCard | ✓ |
| Render badge in CardGrid instead | CardGrid overlays the badge from outside, avoiding changes to CardItem | |

**User's choice:** Add variantType to CardItem

---

## Old tradeQuantity column

| Option | Description | Selected |
|--------|-------------|----------|
| Drop the column | Remove from schema and all reads/writes — clean break, no two sources of truth | ✓ |
| Keep it, zero it out | Leave in schema but set all rows to 0 — simpler diff but leaves dead code | |

**User's choice:** Drop the column

---

| Option | Description | Selected |
|--------|-------------|----------|
| Drizzle migration SQL | Custom SQL block in migration file to INSERT existing tradeQuantity rows into user_trade_offerings as Normal variant | ✓ |
| Separate drizzle-kit push + manual SQL | Schema push first, then separate one-off migration script | |

**User's choice:** Drizzle migration SQL

---

## Multiple variants of same card

| Option | Description | Selected |
|--------|-------------|----------|
| 2 separate tiles | One tile per cardPrintingId offering — accurate, no grouping logic | ✓ |
| 1 grouped tile | Group by cardDefinitionId, show most premium variant | |

**User's choice:** 2 separate tiles

---

| Option | Description | Selected |
|--------|-------------|----------|
| Add printingId to /api/cards/all | Expose cardPrintings.id as printingId in getAllCards() and the endpoint | ✓ |
| Server-side lookup in /api/trade | Continue sending cardDefinitionId + variantType; resolve cardPrintingId server-side | |

**User's choice:** Add printingId to /api/cards/all

---

## Claude's Discretion

- Whether to update `getAllCards()` in place or create a separate query for binder search
- Whether `upsertTradeOffering` is a new function in `trade.ts` or inline in the API route
- Whether the manage page's optimistic state update migrates to `cardPrintingId` as the key

## Deferred Ideas

None — discussion stayed within phase scope.

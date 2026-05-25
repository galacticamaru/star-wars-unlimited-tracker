---
phase: 21-binder-variant-badges
plan: "02"
subsystem: db-layer
tags: [schema, drizzle, trade-binder, variant-tracking]
dependency_graph:
  requires: ["21-01"]
  provides: ["userTradeOfferings table", "upsertTradeOffering", "getUserTradeData with variantType", "getPublicBinderData with userTradeOfferings", "getAllCards with printingId"]
  affects: ["src/app/api/binder/route.ts (no code change — field name contract enforced at query layer)"]
tech_stack:
  added: []
  patterns: ["per-printing trade offering table (PK: userId + cardPrintingId)", "Drizzle alias for HTTP field-name contract (tradeQuantity alias on quantity column)"]
key_files:
  created: []
  modified:
    - src/db/schema.ts
    - src/db/queries/trade.ts
    - src/db/queries/binder.ts
    - src/db/queries/catalog.ts
    - tests/binder-flow.test.ts
decisions:
  - "Alias tradeQuantity in getUserTradeData SELECT (DB column: quantity) so /api/binder passthrough delivers correct field name without modifying route.ts"
  - "userTradeOfferings FK on card_printing_id enforces referential integrity at DB level (T-21-02 mitigate)"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-23"
  tasks_completed: 3
  files_modified: 5
---

# Phase 21 Plan 02: DB Layer — userTradeOfferings Schema + Query Rewrites Summary

**One-liner:** Added `user_trade_offerings` table with per-printing trade tracking; rewrote `getUserTradeData`, `getPublicBinderData`, and `getAllCards` to use the new table and expose `variantType` and `printingId`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add userTradeOfferings to schema.ts; remove tradeQuantity from userCollections | b5f56ae | src/db/schema.ts |
| 2 | Rewrite trade.ts — upsertTradeOffering + updated getUserTradeData | af270b1 | src/db/queries/trade.ts, tests/binder-flow.test.ts |
| 3 | Rewrite binder.ts offerings block; add printingId to catalog.ts getAllCards | 0e0519a | src/db/queries/binder.ts, src/db/queries/catalog.ts |

## What Was Built

### Schema (Task 1)
- New `userTradeOfferings` table: composite PK `(userId, cardPrintingId)`, FK to `card_printings.id`, `quantity` column
- Removed `tradeQuantity` column from `userCollections` — trade offerings are now per-printing, not per-definition

### trade.ts (Task 2)
- `getUserTradeData` offerings block: joins `userTradeOfferings → cardPrintings → cardDefinitions`; returns `cardPrintingId`, `tradeQuantity` (aliased from `quantity`), `variantType`
- `upsertTradeOffering(userId, cardPrintingId, quantity)` replaces `upsertTradeQuantity(userId, cardDefinitionId, tradeQuantity)`
- `/api/binder/route.ts` unmodified — field name contract enforced at query layer via `tradeQuantity` alias

### binder.ts (Task 3)
- `getPublicBinderData` offerings block: now joins `userTradeOfferings → cardPrintings → cardDefinitions`; adds `variantType` to offerings shape
- No reference to `userCollections.tradeQuantity` remains in offerings block (Looking For block still reads `userCollections.count` — correct)

### catalog.ts (Task 3)
- `getAllCards` SELECT includes `printingId: cardPrintings.id` — enables client-side variant art resolution (D-07)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated binder-flow.test.ts to use renamed function and table**
- **Found during:** Task 2
- **Issue:** `tests/binder-flow.test.ts` imported `upsertTradeQuantity` from trade.ts and expected `db.insert` called with `userCollections`. After renaming to `upsertTradeOffering` inserting into `userTradeOfferings`, the test failed with "upsertTradeQuantity is not a function".
- **Fix:** Updated imports to `upsertTradeOffering` and `userTradeOfferings`; updated mock assertion to match new table and field shape.
- **Files modified:** tests/binder-flow.test.ts
- **Commit:** af270b1

## Known Stubs

None — no hardcoded placeholders. All query functions are fully wired to the new table.

## Threat Surface Scan

No new network endpoints or auth paths introduced. The `userTradeOfferings` FK constraint (T-21-02) is applied via `.references(() => cardPrintings.id)` in schema as planned.

## Self-Check: PASSED

- [x] src/db/schema.ts contains `export const userTradeOfferings = pgTable(`
- [x] src/db/schema.ts does NOT contain `tradeQuantity: integer('trade_quantity')`
- [x] src/db/queries/trade.ts exports `upsertTradeOffering`; no `upsertTradeQuantity`
- [x] src/db/queries/trade.ts: `tradeQuantity: userTradeOfferings.quantity` alias present
- [x] src/db/queries/binder.ts: `.from(userTradeOfferings)` present; no `userCollections.tradeQuantity`
- [x] src/db/queries/catalog.ts: `printingId: cardPrintings.id` present
- [x] `npx vitest run`: 9 failed | 24 passed | 3 skipped — identical to pre-plan baseline (all failures pre-existing)
- [x] Commits exist: b5f56ae, af270b1, 0e0519a

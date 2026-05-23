---
phase: 21-binder-variant-badges
plan: "03"
subsystem: api-ui-layer
tags: [trade-binder, variant-badges, card-item, api-migration, printing-id]
dependency_graph:
  requires: ["21-01", "21-02"]
  provides: ["PATCH /api/trade accepts cardPrintingId", "CardItem variant badge in binder mode", "CardGrid threads variantType to CardItem", "manage/page.tsx keyed by cardPrintingId"]
  affects: ["src/app/api/trade/route.ts", "src/app/api/cards/all/route.ts", "src/components/catalog/card-item.tsx", "src/components/catalog/card-grid.tsx", "src/app/binder/manage/page.tsx"]
tech_stack:
  added: []
  patterns: ["Per-printing trade offering API (cardPrintingId in request body)", "Variant badge inside image container — absolute positioned, binder mode only"]
key_files:
  created: []
  modified:
    - src/app/api/trade/route.ts
    - src/app/api/cards/all/route.ts
    - src/components/catalog/card-item.tsx
    - src/components/catalog/card-grid.tsx
    - src/app/binder/manage/page.tsx
    - tests/trade-api.test.ts
decisions:
  - "Badge inserted INSIDE image container div (absolute top-1 left-1) to match manage-trade-card.tsx visual pattern for consistency"
  - "allCards lookup changed from c.id === cardPrintingId to c.printingId === cardPrintingId — enables correct matching when multiple printings of same card exist"
metrics:
  duration: "~12 minutes"
  completed: "2026-05-23"
  tasks_completed: 4
  files_modified: 6
---

# Phase 21 Plan 03: API & UI Layer — cardPrintingId Migration + Variant Badge Summary

**One-liner:** Migrated PATCH /api/trade to accept cardPrintingId with Math.max(0) floor, exposed printingId in /api/cards/all, added variant badge prop to CardItem (binder mode), and threaded variantType through CardGrid; 2 previously-RED badge tests are now GREEN (7/7 passing).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update PATCH /api/trade to accept cardPrintingId; expose printingId in /api/cards/all | 9ce76fd | src/app/api/trade/route.ts, src/app/api/cards/all/route.ts, tests/trade-api.test.ts |
| 2 | Add variantType prop + badge JSX to CardItem (binder mode) | 1b89974 | src/components/catalog/card-item.tsx |
| 3 | Update manage/page.tsx interfaces, optimistic state, and ManageTradeCard key to use cardPrintingId | 479dad6 | src/app/binder/manage/page.tsx |
| 4 | Thread variantType through CardGrid to CardItem | e55624b | src/components/catalog/card-grid.tsx |

## What Was Built

### API Layer (Task 1)

- `PATCH /api/trade`: Now accepts `{ cardPrintingId, tradeQuantity }` instead of `{ cardDefinitionId, tradeQuantity }`. Calls `upsertTradeOffering(userId, cardPrintingId, Math.max(0, tradeQuantity))` — the Math.max(0) floor prevents negative quantities reaching the DB (T-21-06 mitigation).
- `GET /api/cards/all`: `plainCards` map now includes `printingId: c.printingId` on every row, enabling the manage page to look up cards by printing ID.

### CardItem Variant Badge (Task 2)

- Added `variantType?: string` to `CardItemProps` interface.
- Badge JSX inserted inside the image container div (`relative rounded-md overflow-hidden`), positioned `absolute top-1 left-1`, visible only when `isBinder && variantType && variantType !== 'Normal'`.
- Badge class matches `manage-trade-card.tsx` exactly: `absolute top-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-bold shadow-md z-20 pointer-events-none uppercase`.
- The 2 badge tests from Plan 21-01 that were RED are now GREEN: 7/7 card-item tests pass.

### manage/page.tsx Migration (Task 3)

- `Offering` interface: `cardPrintingId` replaces `cardDefinitionId`.
- `AllCard` interface: `printingId: number` added.
- `updateTradeQuantity` callback: parameter renamed, fetch body updated, optimistic state logic fully migrated to `cardPrintingId`.
- `allCards.find` lookup changed from `c.id === cardDefinitionId` to `c.printingId === cardPrintingId` — critical for correct matching when two printings of the same card (e.g., Normal + Foil) both appear in search results.
- `ManageTradeCard` `key` and `id` props now use `card.cardPrintingId`.
- Trade button in search results calls `updateTradeQuantity(card.printingId, 1)`.

### CardGrid variantType Pass-Through (Task 4)

- Added `variantType={card.variantType}` to `CardItem` render in `cards.map`.
- `CardForFilter` already had `variantType?: string` — no type change needed.
- Purely additive; enables the variant badge to render in the public binder view once the DB schema push (Plan 21-04) is live.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated tests/trade-api.test.ts to match new API contract**
- **Found during:** Task 1 (vitest run revealed the test was failing)
- **Issue:** `tests/trade-api.test.ts` mocked `upsertTradeQuantity` (old function name) and sent `cardDefinitionId` in the request body. After the route was rewritten to import `upsertTradeOffering` and expect `cardPrintingId`, the test response was "Missing cardPrintingId or tradeQuantity" (a 400 text string), causing `response.json()` to throw `SyntaxError: Unexpected token 'M'`.
- **Fix:** Updated mock to `upsertTradeOffering`, updated import, changed request body to `cardPrintingId: 101`, updated `expect(upsertTradeOffering).toHaveBeenCalledWith(1, 101, 5)`.
- **Files modified:** tests/trade-api.test.ts
- **Commit:** 9ce76fd

## Known Stubs

None — all wiring is complete. The variant badge renders live data from `variantType` passed through the data pipeline (getPublicBinderData → CardForFilter → CardGrid → CardItem).

## Threat Surface Scan

No new network endpoints or auth paths introduced. PATCH /api/trade security posture maintained:
- T-21-05: `userId` sourced exclusively from `session.user.id`, never request body.
- T-21-06: `Math.max(0, tradeQuantity)` applied before DB write.
- T-21-07: FK constraint on `card_printing_id` enforced at DB level.

## Self-Check: PASSED

- [x] src/app/api/trade/route.ts imports `upsertTradeOffering`; no `upsertTradeQuantity` or `cardDefinitionId`
- [x] src/app/api/trade/route.ts contains `Math.max(0, tradeQuantity)` and `Missing cardPrintingId or tradeQuantity`
- [x] src/app/api/cards/all/route.ts contains `printingId: c.printingId`
- [x] src/components/catalog/card-item.tsx contains `variantType?: string` and `isBinder && variantType && variantType !== 'Normal'`
- [x] src/components/catalog/card-item.tsx contains the exact badge class string `absolute top-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-bold shadow-md z-20 pointer-events-none uppercase`
- [x] src/components/catalog/card-grid.tsx contains `variantType={card.variantType}` in CardItem render
- [x] src/app/binder/manage/page.tsx Offering interface has `cardPrintingId: number` (no `cardDefinitionId`)
- [x] src/app/binder/manage/page.tsx AllCard interface has `printingId: number`
- [x] src/app/binder/manage/page.tsx contains `key={card.cardPrintingId}` and `id={card.cardPrintingId}`
- [x] src/app/binder/manage/page.tsx contains `updateTradeQuantity(card.printingId, 1)`
- [x] `npx vitest run src/components/catalog/card-item.test.tsx` exits 0 with 7/7 tests passing
- [x] `npx vitest run tests/trade-api.test.ts` exits 0 with 6/6 tests passing
- [x] Commits exist: 9ce76fd, 1b89974, 479dad6, e55624b

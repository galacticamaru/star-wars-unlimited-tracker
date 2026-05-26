---
phase: 23
plan: "03"
subsystem: card-detail
status: checkpoint
tags:
  - card-detail
  - trade-offer
  - variant-trade-section
  - client-component
  - sql-false-guard
dependency_graph:
  requires:
    - "23-01 (userTradeOfferings table + /api/trade PATCH endpoint)"
  provides:
    - "getSameSetPrintingsWithCounts returns tradeQuantity per printing"
    - "VariantTradeSection client component (PATCH /api/trade wired)"
    - "Card detail page renders Available for Trade section below Your Collection"
  affects:
    - "src/db/queries/card-detail.ts"
    - "src/components/catalog/variant-trade-section.tsx"
    - "src/app/cards/[set-code]/[card-number]/page.tsx"
tech_stack:
  added: []
  patterns:
    - "sql`FALSE` userId guard for unauthenticated LEFT JOIN (mirrors userPrintingCollections pattern)"
    - "Optimistic state + rollback pattern (mirrors VariantCollectionSection)"
    - "Server-rendered initial state via RSC props, no client fetch (D-11)"
key_files:
  created:
    - "src/components/catalog/variant-trade-section.tsx"
  modified:
    - "src/db/queries/card-detail.ts"
    - "src/app/cards/[set-code]/[card-number]/page.tsx"
decisions:
  - "Trade section placed directly below VariantCollectionSection in image column with gap-6 from parent flex container"
  - "Same auth gate (userId && printings.length > 0) as VariantCollectionSection — no separate gate inside VariantTradeSection"
  - "sql`FALSE` guard applied to userTradeOfferings leftJoin to prevent data leakage on unauthenticated requests (T-23-03-01)"
metrics:
  duration: "6 minutes"
  completed_at: "2026-05-26"
  tasks_completed: 3
  tasks_total: 4
  files_created: 1
  files_modified: 2
---

# Phase 23 Plan 03: Card Detail Trade Section Summary

**One-liner:** BINDER-08 end-to-end — VariantTradeSection client component with PATCH /api/trade wired to card detail RSC via extended getSameSetPrintingsWithCounts returning tradeQuantity with sql`FALSE` auth guard.

---

## Status: CHECKPOINT — Task 4 (human-verify) pending

Tasks 1-3 committed. Task 4 requires human visual and functional verification of the rendered UI.

---

## Tasks Completed

| Task | Commit | Description |
|------|--------|-------------|
| Task 1: Extend getSameSetPrintingsWithCounts | ba6dcc7 | Added tradeQuantity field + userTradeOfferings LEFT JOIN with sql`FALSE` userId guard |
| Task 2: Create VariantTradeSection | 65d62f4 | New client component mirroring VariantCollectionSection with PATCH /api/trade |
| Task 3: Wire into card detail page | 747cf1c | Import + JSX insertion below VariantCollectionSection, same auth gate |

---

## What Was Built

### Task 1 — `src/db/queries/card-detail.ts`

Extended `getSameSetPrintingsWithCounts` with two additive changes:
- Added `userTradeOfferings` to the import from `@/db/schema`
- Added `tradeQuantity: sql<number>\`COALESCE(${userTradeOfferings.quantity}, 0)\`` to the select block
- Added `.leftJoin(userTradeOfferings, and(eq(cardPrintings.id, userTradeOfferings.cardPrintingId), userId ? eq(userTradeOfferings.userId, userId) : sql\`FALSE\`))` — the `sql\`FALSE\`` branch is the critical security guard preventing trade data leakage on unauthenticated requests (T-23-03-01)

Initial state is server-rendered: no separate client fetch is added (D-11 preserved).

### Task 2 — `src/components/catalog/variant-trade-section.tsx`

New client component (122 lines) mirroring `VariantCollectionSection` with:
- State initialized from server-rendered `tradeQuantity` per printing
- `updateVariant` handler: floors at 0, optimistic update, PATCH `/api/trade` with `{ cardPrintingId, tradeQuantity }`, rollback on both `!res.ok` and catch
- Per-row anatomy: variant label / Minus / Input / Plus / status indicator (Trading / Not trading)
- Zero rows remain visible (D-10)
- No `useEffect` (server-rendered initial state)
- Parent controls auth gate — no sign-in prompt inside the component

### Task 3 — `src/app/cards/[set-code]/[card-number]/page.tsx`

Two edits:
- Import: `import { VariantTradeSection } from '@/components/catalog/variant-trade-section'`
- JSX: `{userId && printings.length > 0 && (<VariantTradeSection printings={printings} />)}` directly after VariantCollectionSection block in the image column `flex flex-col gap-6` container

The `printings` array already includes `tradeQuantity` from Task 1 — no additional fetch needed.

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Task 4: Pending Human Verification

**Status:** AWAITING — checkpoint:human-verify not yet executed

The human operator must:
1. Run the dev server and navigate to a card detail page with multiple printings
2. Confirm the "AVAILABLE FOR TRADE" section renders below "Your Collection"
3. Test +/- buttons: optimistic update, persists after refresh
4. Verify zero-quantity rows stay visible
5. Verify unauthenticated users see no trade section
6. Optionally cross-check trade data appears in `/binder/manage`

See PLAN.md Task 4 `<how-to-verify>` for full verification steps.

Resume signal: `"approved"` from human operator.

---

## Known Stubs

None — all fields are wired to live data. `tradeQuantity` comes from `user_trade_offerings.quantity` via the extended query. The section only renders when `userId && printings.length > 0`.

---

## Threat Flags

No new threat surface beyond what was declared in the plan's `<threat_model>`. T-23-03-01 (information disclosure via unauthenticated leftJoin) is mitigated via the `sql\`FALSE\`` guard in Task 1.

---

## Self-Check

### Created files exist:
- `src/components/catalog/variant-trade-section.tsx` — FOUND (created by Task 2)

### Commits exist:
- `ba6dcc7` — Task 1
- `65d62f4` — Task 2
- `747cf1c` — Task 3

## Self-Check: PASSED

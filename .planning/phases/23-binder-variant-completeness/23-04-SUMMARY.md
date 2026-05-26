---
phase: 23-binder-variant-completeness
plan: "04"
status: complete
subsystem: binder
tags:
  - manage-binder
  - owned-cards
  - sheet
  - variant-chip-selector
  - manual-wants
  - collection-discovery
dependency_graph:
  requires:
    - 23-01
  provides:
    - getOwnedCardDefinitions
    - /api/collection/owned-cards
    - VariantTradeSheet
    - ManualWantsAddFlow
  affects:
    - src/app/binder/manage/page.tsx
    - src/components/binder/manage-wants-list.tsx
tech_stack:
  added: []
  patterns:
    - Controlled Sheet (parent owns open/onOpenChange)
    - Optimistic PATCH with rollback on failure
    - Promise.all parallel fetch on mount
    - Batched inArray queries for printings + counts
key_files:
  created:
    - src/db/queries/collection.ts (getOwnedCardDefinitions export added)
    - src/app/api/collection/owned-cards/route.ts
    - src/components/binder/variant-trade-sheet.tsx
    - src/components/binder/manual-wants-add-flow.tsx
  modified:
    - src/app/binder/manage/page.tsx
    - src/components/binder/manage-wants-list.tsx
decisions:
  - "D-13/D-14: Manage Binder browse grid sources from userCollections (count > 0); tile art uses selectBestVariantArtUrl precedence"
  - "D-15: Sheet shows only owned printings (ownedCount > 0 filter at render time)"
  - "D-16: Sheet uses optimistic PATCH /api/trade with rollback on !res.ok and catch"
  - "D-17: Cross-page sync via existing useEffect re-fetch on mount (no real-time mechanism)"
  - "D-07/D-08: ManualWantsAddFlow posts { cardPrintingId, quantity: 1 } derived from variant chip selection"
metrics:
  completed_date: "2026-05-26"
  tasks_completed: 5
  tasks_total: 5
  files_created: 4
  files_modified: 2
---

# Phase 23 Plan 04: Manage Binder Collection-Driven Discovery Summary

**One-liner:** Collection-driven Manage Binder with owned-card grid (best-variant art), per-printing Sheet trade controls, and variant chip selector for manual wants.

## Status: COMPLETE — Human verification APPROVED (Task 5)

All tasks complete. Human operator confirmed all 6 verification steps pass: owned-card grid, Sheet panel, variant chip selector, cross-page sync, and empty states.

## What Was Built

### New Endpoint: GET /api/collection/owned-cards

Returns owned card definitions with:
- `cardDefinitionId`, `name`, `subtitle`, `type`
- `bestArtUrl` / `bestVariantType` (highest-precedence variant the user owns, per `selectBestVariantArtUrl`)
- `printings[]`: ALL printings of each owned definition (not just owned variants — chip selector needs unowned variants too), each with `ownedCount`, `tradeQuantity`, `frontArtUrl`

Auth-gated (401 if no session, 400 if userId NaN). Read-only — no POST/PATCH/DELETE.

### New Component: VariantTradeSheet (`src/components/binder/variant-trade-sheet.tsx`)

Controlled Sheet (parent owns `open`/`onOpenChange`). Receives `printings` filtered to owned-only by parent. Per-printing rows show variant label, "Owned: N" chip, and +/- trade quantity controls. Optimistic PATCH `/api/trade` with rollback on `!res.ok` and catch. Calls `onTradeQuantityChange` only after confirmed success. Empty state: "No owned printings to display."

### New Component: ManualWantsAddFlow (`src/components/binder/manual-wants-add-flow.tsx`)

Search owned cards by name/subtitle → click result → variant chips appear (all printings, including unowned) → single-select toggle → "Add Want" button → POST `/api/binder/wants` with `{ cardPrintingId, quantity: 1 }`. Clears state and calls `onWantAdded` on success; keeps state on failure for retry.

### ManageBinderPage Rewire (`src/app/binder/manage/page.tsx`)

- Replaced `AllCard`/`allCards`/`/api/cards/all` with `OwnedCard`/`ownedCards`/`/api/collection/owned-cards`
- Added `sheetCard` state; tile click opens `VariantTradeSheet` with owned printings only
- Added `ManualWantsAddFlow` in a Card sidebar with `onWantAdded={refreshTradeData}`
- `updateTradeQuantity` now also updates `ownedCards` printings state for badge sync
- Empty states: zero collection vs. zero search results per UI-SPEC copy
- Search placeholder: "Search your collection..."

### ManageWantsList Variant Label (`src/components/binder/manage-wants-list.tsx`)

Each want row now shows a variant badge next to the card name for non-Normal variants (e.g. "FOIL", "SHOWCASE"). Normal variants get no badge.

## Deviations from Plan

**None — plan executed exactly as written.**

Minor implementation decisions within plan discretion:
- For multi-printing card tiles: tile's `tradeQuantity` badge shows the sum of all printings' tradeQuantities (informative total rather than a single printing's value)
- `filteredCards` shows all owned cards when search is empty (no minimum length gate), matching a typical browse-grid UX

## Known Stubs

None — all data is wired to live endpoints.

## Threat Surface Scan

No new threat surface beyond what the plan's threat model covers:
- T-23-04-01/T-23-04-02: `/api/collection/owned-cards` auth gate implemented — `userId` derived from session, `count > 0` filter ensures user only sees their own data
- T-23-04-06: `VariantTradeSheet` optimistic update rolls back on `!res.ok` and catch — confirmed in implementation
- T-23-04-08: `ManualWantsAddFlow` resolves `cardPrintingId` via `find()` and aborts if not found — confirmed

## Task Commits

| Task | Name | Commit |
|------|------|--------|
| 1 | getOwnedCardDefinitions query + /api/collection/owned-cards | 2ea6d92 |
| 2 | VariantTradeSheet component | 530107a |
| 3 | ManualWantsAddFlow component | 671bb0c |
| 4 | ManageBinderPage + ManageWantsList rewire | 9847b14 |
| 5 | Human-verify checkpoint | APPROVED |

## Self-Check: PASSED

- src/db/queries/collection.ts: FOUND
- src/app/api/collection/owned-cards/route.ts: FOUND
- src/components/binder/variant-trade-sheet.tsx: FOUND
- src/components/binder/manual-wants-add-flow.tsx: FOUND
- src/app/binder/manage/page.tsx: FOUND
- src/components/binder/manage-wants-list.tsx: FOUND
- All 4 task commits present in git log (2ea6d92, 530107a, 671bb0c, 9847b14)

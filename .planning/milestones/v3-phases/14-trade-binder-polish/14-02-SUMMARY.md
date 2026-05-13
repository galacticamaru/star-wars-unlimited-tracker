---
phase: 14-trade-binder-polish
plan: "02"
subsystem: trade-binder
tags: [trade, deck-shortfall, auto-wants, query-layer]
dependency_graph:
  requires: []
  provides: [autoWants-in-getUserTradeData]
  affects: [api-binder-get-response]
tech_stack:
  added: []
  patterns: [deck-shortfall-computation, inventory-subtraction, exclusion-tagging]
key_files:
  modified:
    - src/db/queries/trade.ts
decisions:
  - "Re-use deck-shortfall computation pattern from binder.ts verbatim rather than extracting a shared helper — keeps getUserTradeData self-contained for a single-file plan"
  - "Pass isExcluded=false to calculateLookingFor during shortfall computation, then set isExcluded on the returned item from exclusionsSet — separates computation concern from display concern"
metrics:
  duration: "~8 minutes"
  completed: "2026-05-13"
  tasks_completed: 1
  tasks_total: 1
---

# Phase 14 Plan 02: Auto-Wants Computation in getUserTradeData Summary

getUserTradeData() extended with deck-driven shortfall computation returning autoWants array with exclusion flags — no new API surface required.

## What Was Built

`getUserTradeData()` in `src/db/queries/trade.ts` now runs a full deck-shortfall pipeline inline and returns an `autoWants` array alongside `offerings`, `exclusions`, and `manualWants`.

The computation:
1. Builds an `exclusionsSet` from the already-queried `exclusions` array (O(n), no extra query)
2. Fetches user decks and builds `autoTargetMap` — max quantity needed per card across all decks; leaders/bases are counted as 1
3. Fetches the user's inventory into `inventoryMap`
4. Calls `calculateLookingFor(autoTarget, 0, inventory, false)` per card to compute shortfall
5. Fetches `name` and `subtitle` from `cardDefinitions` only for cards with shortfall > 0
6. Sets `isExcluded: exclusionsSet.has(cardDefinitionId)` on each returned item

The `/api/binder` GET route already returns `NextResponse.json(data)` verbatim, so `autoWants` appears in the endpoint response automatically.

## Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend getUserTradeData to compute and return autoWants | d99d2f1 | src/db/queries/trade.ts |

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `grep -c "autoWants" src/db/queries/trade.ts` returns 7 (exceeds threshold of 3)
- `grep "calculateLookingFor" src/db/queries/trade.ts` returns import + 1 call site
- `grep "from '@/lib/binder-logic'" src/db/queries/trade.ts` returns 1 match
- `grep "inArray" src/db/queries/trade.ts` returns 3 matches (import + 2 usage sites)
- `grep "decks, deckCards" src/db/queries/trade.ts` returns 1 match in schema import
- `npm run build` exited 0 with no TypeScript errors

## Known Stubs

None — `autoWants` is fully computed from live DB queries.

## Threat Surface Scan

No new network endpoints, auth paths, or schema changes introduced. All queries are scoped by `userId` with `eq(decks.userId, userId)`. The `inArray(deckCards.deckId, deckIds)` query is guarded by `if (userDecks.length > 0)`, preventing empty-array edge case. No new threat surface beyond what is documented in the plan's threat model.

## Self-Check: PASSED

- [x] `src/db/queries/trade.ts` exists and contains `autoWants`
- [x] Commit d99d2f1 exists in git log
- [x] Build passed with exit code 0

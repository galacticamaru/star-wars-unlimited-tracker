---
phase: 17-variant-collection-tracking
plan: "02"
subsystem: collection
tags: [schema, drizzle, query-helpers, tdd-green, wave-1]
dependency_graph:
  requires:
    - src/app/api/collection/collection-shape.ts (stub from Plan 01)
    - src/app/api/collection/collection-shape.test.ts (RED tests from Plan 01)
  provides:
    - src/db/schema.ts (userPrintingCollections table)
    - src/db/queries/collection.ts (upsertVariantCount, recomputeTotal, updated getUserCollection)
    - src/db/queries/card-detail.ts (getSameSetPrintingsWithCounts)
    - src/app/api/collection/collection-shape.ts (buildCollectionMap implemented)
  affects:
    - src/app/api/collection/route.ts (getUserCollection return shape changed — partial update, Plan 03 completes)
    - src/app/cards/[set-code]/[card-number]/page.tsx (getUserCollection return shape changed — Plan 05 will replace CollectionControls)
    - src/lib/want-list.ts (getUserCollection return shape changed — deduplicate by cardDefinitionId)
tech_stack:
  added: []
  patterns:
    - Drizzle ORM two-join approach for userCollections → cardPrintings → userPrintingCollections
    - onConflictDoUpdate composite PK upsert pattern mirrored from upsertCardCount
    - COALESCE(SUM(...), 0) for recomputeTotal aggregation
    - userId guard in leftJoin condition (userId ? eq(...) : sql`FALSE`) from card-detail.ts
key_files:
  created: []
  modified:
    - src/db/schema.ts
    - src/db/queries/collection.ts
    - src/db/queries/card-detail.ts
    - src/app/api/collection/collection-shape.ts
    - src/app/api/collection/route.ts
    - src/app/cards/[set-code]/[card-number]/page.tsx
    - src/lib/want-list.ts
decisions:
  - "Used two-join approach (userCollections → cardPrintings → userPrintingCollections) in getUserCollection because userPrintingCollections lacks cardDefinitionId directly; Drizzle ORM correlated subquery limitation requires joining through cardPrintings as the bridge"
  - "Callers of getUserCollection updated inline to use .total instead of .count; route.ts uses deduplication (first occurrence per cardDefinitionId) to preserve old flat shape until Plan 03 completes API update"
  - "No tradeQuantity column on userPrintingCollections — variant tracking only needs count, matching plan specification"
metrics:
  duration: "~20 minutes"
  completed: "2026-05-17"
---

# Phase 17 Plan 02: DB Schema and Query Helpers Summary

`user_printing_collections` Drizzle table with composite PK, four new/updated query helpers (upsertVariantCount, recomputeTotal, updated getUserCollection with two-join approach, getSameSetPrintingsWithCounts), and implemented buildCollectionMap — all 4 collection-shape tests GREEN, TypeScript clean.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add userPrintingCollections table to schema.ts | 39501e2 | src/db/schema.ts |
| 2 | Implement DB query helpers and buildCollectionMap | 07f8260 | collection.ts, card-detail.ts, collection-shape.ts, route.ts, page.tsx, want-list.ts |

## Verification

```
npx vitest run src/app/api/collection/collection-shape.test.ts
```

Result: 4 passed (4) — all collection-shape tests GREEN.

```
npx tsc --noEmit
```

Result: exits 0 — TypeScript clean.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] getUserCollection return shape change broke three callers**

- **Found during:** Task 2 TypeScript verification
- **Issue:** `getUserCollection` now returns `{ cardDefinitionId, total, cardPrintingId, variantCount }` instead of `{ cardDefinitionId, count }`. Three files accessed `.count` which no longer exists:
  - `src/app/api/collection/route.ts` line 17
  - `src/app/cards/[set-code]/[card-number]/page.tsx` line 34
  - `src/lib/want-list.ts` line 13
- **Fix:**
  - `route.ts`: Updated to use `.total`, added deduplication (first occurrence per cardDefinitionId) with TODO(Plan 03) comment for full shape upgrade
  - `page.tsx`: Changed `.count` to `.total` with TODO(Plan 05) comment for CollectionControls replacement
  - `want-list.ts`: Changed `.count` to `.total`, added deduplication guard to avoid double-counting when multiple printing rows exist per cardDefinitionId
- **Files modified:** route.ts, page.tsx, want-list.ts
- **Commit:** 07f8260

## Known Stubs

| File | Line | Description |
|------|------|-------------|
| src/app/api/collection/route.ts | 15 | GET still returns old flat `{ [cardDefinitionId]: count }` shape — deduplication bridge until Plan 03 updates to new shape |
| src/app/cards/[set-code]/[card-number]/page.tsx | 34 | Still uses CollectionControls with total count — Plan 05 replaces with VariantCollectionSection |

These stubs are intentional transition states. Plan 03 (API route) and Plan 05 (card detail UI) will resolve them. The plan's goal — data layer contracts for variant collection — is fully achieved.

## Threat Surface Scan

No new network endpoints introduced in this plan. All queries use Drizzle ORM parameterization (no string interpolation). The `userId` parameter in all new functions is sourced from session at the API layer (enforced in Plan 03 per T-17-02-01). No new trust boundaries introduced.

## Self-Check: PASSED

Files exist:
- FOUND: src/db/schema.ts (contains userPrintingCollections)
- FOUND: src/db/queries/collection.ts (exports upsertVariantCount, recomputeTotal)
- FOUND: src/db/queries/card-detail.ts (exports getSameSetPrintingsWithCounts)
- FOUND: src/app/api/collection/collection-shape.ts (buildCollectionMap implemented)

Commits exist:
- 39501e2: feat(17-02): add userPrintingCollections table to schema.ts
- 07f8260: feat(17-02): implement DB query helpers and buildCollectionMap

Tests: 4/4 GREEN. TypeScript: clean.

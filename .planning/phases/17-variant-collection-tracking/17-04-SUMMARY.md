---
phase: 17-variant-collection-tracking
plan: "04"
subsystem: collection
tags: [consumer-migration, type-safety, collection-map, wave-2]
dependency_graph:
  requires:
    - src/app/api/collection/collection-shape.ts (CollectionMap type from Plan 01/02)
  provides:
    - src/components/catalog/catalog-client.tsx (CollectionMap state, no POST mutation)
    - src/components/catalog/card-grid.tsx (CollectionMap prop, .total access)
    - src/components/decks/want-list-tab.tsx (CollectionMap state, .total access)
    - src/lib/filter-cards.ts (CollectionMap param, .total in owned-only filter)
  affects:
    - src/lib/filter-cards.test.ts (updated fixtures to CollectionMap shape)
tech_stack:
  added: []
  patterns:
    - CollectionMap import from collection-shape.ts in all three consumers
    - Optional chaining .total ?? 0 pattern for safe owned count access
    - Catalog grid read-only in Phase 17 (mutation via card detail page only)
key_files:
  created: []
  modified:
    - src/components/catalog/catalog-client.tsx
    - src/components/catalog/card-grid.tsx
    - src/components/decks/want-list-tab.tsx
    - src/lib/filter-cards.ts
    - src/lib/filter-cards.test.ts
decisions:
  - "Removed handleUpdateCount from CatalogClient entirely (not a no-op): POST /api/collection is gone per Plan 03 and catalog grid is intentionally read-only in Phase 17; card detail page (Plan 05) is the sole mutation surface"
  - "Updated card-grid.tsx as a Rule 3 fix: it receives collection from CatalogClient and had collection: Record<number, number> — changing the prop type to CollectionMap was required to avoid a TypeScript error blocking compilation"
  - "Updated filter-cards.test.ts as a Rule 3 fix: test fixtures used raw number shape { 1: 2 } which became a TS2345 error after filterCards signature changed to CollectionMap"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-17"
---

# Phase 17 Plan 04: Consumer Migration to CollectionMap Summary

Migrated all three GET /api/collection consumers from the old flat `{ [cardDefinitionId]: count }` shape to `CollectionMap = Record<number, { total, variants }>` — CatalogClient, WantListTab, and filter-cards.ts all now read `.total` instead of raw numbers; CatalogClient's POST mutation removed; TypeScript compiles clean.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update CatalogClient collection state type and remove POST mutation | d104456 | catalog-client.tsx, card-grid.tsx |
| 2 | Update WantListTab and filter-cards.ts to use .total | 2d03df2 | want-list-tab.tsx, filter-cards.ts, filter-cards.test.ts |

## Verification

```
npx tsc --noEmit
```
Result: exits 0 — TypeScript clean across full project.

```
npx vitest run src/lib/filter-cards.test.ts
```
Result: 15 passed (15) — all filter-cards tests GREEN.

```
grep -c "handleUpdateCount" src/components/catalog/catalog-client.tsx
```
Result: 0

```
grep -n ".total" src/components/decks/want-list-tab.tsx
```
Result: line 39: `const owned = collection[dc.cardDefinitionId]?.total ?? 0;`

```
grep -n ".total" src/lib/filter-cards.ts
```
Result: line 118: `const matchesOwned = !ownedOnly || (collection[card.id]?.total ?? 0) >= 1;`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] card-grid.tsx had collection: Record<number, number> — TypeScript error when CollectionMap passed**

- **Found during:** Task 1 TypeScript verification
- **Issue:** `card-grid.tsx` receives `collection` from `CatalogClient` and typed it as `Record<number, number>`. After changing `CatalogClient` to pass `CollectionMap`, this became an assignment error. Additionally, `card-grid.tsx` read `collection[card.id] || 0` as a raw number.
- **Fix:** Updated `card-grid.tsx` to import `CollectionMap` and use `collection[card.id]?.total ?? 0`
- **Files modified:** `src/components/catalog/card-grid.tsx`
- **Commit:** d104456

**2. [Rule 3 - Blocking] filter-cards.test.ts used raw number shape in collection fixtures**

- **Found during:** Task 2 TypeScript check
- **Issue:** Two test cases passed `{ 1: 2 }` and `{ 3: 1 }` as collection fixtures. After `filterCards` signature changed to `CollectionMap`, these caused TS2345 errors.
- **Fix:** Updated fixtures to `{ 1: { total: 2, variants: {} } }` and `{ 3: { total: 1, variants: {} } }`
- **Files modified:** `src/lib/filter-cards.test.ts`
- **Commit:** 2d03df2

## Pre-existing Test Failures (not introduced by this plan)

7 tests were already failing at the base commit (confirmed by stash before/after check):
- tests/auth-config.test.ts
- __tests__/api-deck-validation.test.ts
- src/app/decks/page.test.tsx
- src/lib/sync/prices.test.ts
- tests/data-isolation.test.ts (1 test)
- __tests__/cron-route.test.ts (4 tests)
- src/lib/collection/normalize.test.ts (2 tests — wave 2 RED tests from Plan 03)

These are out-of-scope for this plan.

## Known Stubs

None. All three consumers now correctly read `.total` from the CollectionMap shape. The catalog grid is intentionally read-only (no mutation path) per the Phase 17 scope decision (D-03). Catalog mutation via card detail page will be implemented in Plan 05.

## Threat Surface Scan

No new network endpoints introduced. No new auth paths. `CollectionMap` is a TypeScript type — no runtime security boundary. All collection data comes from the auth-gated GET /api/collection endpoint. No new trust boundaries.

## Self-Check: PASSED

Files exist:
- FOUND: src/components/catalog/catalog-client.tsx (contains CollectionMap, no handleUpdateCount)
- FOUND: src/components/catalog/card-grid.tsx (contains CollectionMap, .total access)
- FOUND: src/components/decks/want-list-tab.tsx (contains CollectionMap, .total access)
- FOUND: src/lib/filter-cards.ts (contains CollectionMap, .total in owned-only filter)

Commits exist:
- d104456: feat(17-04): update CatalogClient and CardGrid to use CollectionMap
- 2d03df2: feat(17-04): update WantListTab and filter-cards to use CollectionMap

TypeScript: clean (exits 0). Filter-cards tests: 15/15 GREEN.

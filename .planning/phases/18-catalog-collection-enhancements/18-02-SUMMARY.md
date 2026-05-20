---
phase: 18-catalog-collection-enhancements
plan: "02"
subsystem: catalog
tags: [tdd, variant-art, collection, card-grid, rsc]
dependency_graph:
  requires:
    - Phase 17 (user_printing_collections table, CollectionMap.variants shape, upsertVariantCount/recomputeTotal)
  provides:
    - Catalog tile variant art resolution (best-owned variant art displayed per card)
    - src/lib/catalog/select-best-variant.ts (pure precedence selection function)
    - getPrintingArtMap() query in src/db/queries/catalog.ts
  affects:
    - src/app/cards/page.tsx (RSC fetches and passes printingArtMap)
    - src/components/catalog/catalog-client.tsx (threads printingArtMap to CardGrid)
    - src/components/catalog/card-grid.tsx (computes bestVariantArtUrl per card)
    - src/components/catalog/card-item.tsx (displays bestVariantArtUrl when provided)
tech_stack:
  added: []
  patterns:
    - Pure selection function extracted to src/lib/catalog for testability
    - TDD RED → GREEN cycle for precedence logic
    - RSC-to-client prop threading for catalog art data (D-01)
key_files:
  created:
    - src/lib/catalog/select-best-variant.ts
    - tests/catalog-variant.test.ts
  modified:
    - src/db/queries/catalog.ts
    - src/app/cards/page.tsx
    - src/components/catalog/catalog-client.tsx
    - src/components/catalog/card-grid.tsx
    - src/components/catalog/card-item.tsx
decisions:
  - "selectBestVariantArtUrl extracted to src/lib/catalog/ for isolated testability — avoids testing React component rendering for a pure algorithm"
  - "printingArtMap typed as optional in CatalogClient/CardGrid to keep backward compatibility with other callers (selector mode)"
metrics:
  duration: "~4 minutes"
  completed: "2026-05-20"
---

# Phase 18 Plan 02: Catalog Variant Art Summary

RSC-to-client pipeline delivering personalized variant art in the catalog — Hyperspace and Showcase printings now appear on card tiles for users who own those variants.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Printing Art Data Layer (TDD) | cde05c8 | src/lib/catalog/select-best-variant.ts, src/db/queries/catalog.ts, src/app/cards/page.tsx, tests/catalog-variant.test.ts |
| 2 | UI Art Resolution Logic | a37e38c | src/components/catalog/catalog-client.tsx, src/components/catalog/card-grid.tsx, src/components/catalog/card-item.tsx |

## What Was Built

### getPrintingArtMap() — DB Query
Added to `src/db/queries/catalog.ts`. Selects all rows from `card_printings` (id, variantType, frontArtUrl) and reduces them to `Record<cardPrintingId, { variantType, frontArtUrl }>`. Called once per RSC render in `src/app/cards/page.tsx` in parallel with `getAllCards()` and `getFilterOptions()`.

### selectBestVariantArtUrl() — Pure Selection Function
Lives in `src/lib/catalog/select-best-variant.ts`. Iterates `CollectionMap.variants[card.id]` (per-printing counts), picks the highest-owned count, breaks ties using variant precedence `Showcase(5) > Hyperspace Foil(4) > Hyperspace(3) > Foil(2) > Normal(1)`, and returns the `frontArtUrl` from `printingArtMap`. Returns `null` when no variants are owned.

### Component Tree Wiring
- `CatalogClient` receives `printingArtMap?: PrintingArtMap` from RSC and passes it to `CardGrid`
- `CardGrid` calls `selectBestVariantArtUrl(cardVariants, printingArtMap)` per card in the render loop and passes `bestVariantArtUrl` to `CardItem`
- `CardItem` uses `bestVariantArtUrl ?? normalDisplayUrl` — when `bestVariantArtUrl` is `null` (logged-out, zero-owned), falls back to Normal art (D-03)

### TDD Gate Compliance
- RED commit `cde05c8` includes `tests/catalog-variant.test.ts` with 15 failing tests (module not found)
- GREEN: `selectBestVariantArtUrl` implementation made all 15 tests pass
- No REFACTOR needed — implementation was clean

## Verification

```
npx vitest run tests/catalog-variant.test.ts
Test Files  1 passed (1)
Tests  15 passed (15)
```

```
npm run lint -- src/components/catalog/card-grid.tsx
[no output — clean]
```

## Deviations from Plan

### Notes

**1. [Rule 3 - Blocking] Worktree was missing phase 17 code**
- **Found during:** Initial file reads
- **Issue:** The worktree was branched from phase 16.1 state (before phase 17 shipped `userPrintingCollections`, `CollectionMap.variants`, `upsertVariantCount`, etc.)
- **Fix:** Fetched local main branch via `git fetch file:///...` and merged cleanly into the worktree agent branch
- **Files modified:** All phase 17 work (schema, queries, collection API shape)
- **Commit:** Merge commit (no hash shown — fast-forward merge)

**2. Extracted `selectBestVariantArtUrl` to dedicated module**
- **Why:** Plan specified implementing the logic "in CardGrid". Extracting it to `src/lib/catalog/select-best-variant.ts` enabled isolated unit tests without React component rendering
- **Impact:** `CardGrid` imports the function; TDD test imports the same module. No behavior change.

## Known Stubs

None — all variant art resolution wires to real `CollectionMap.variants` data from the Phase 17 API.

## Threat Flags

None. Art URLs and variant types are public catalog data — no new trust boundary crossings (consistent with T-18-02 `accept` disposition).

## Self-Check: PASSED

Files exist:
- FOUND: src/lib/catalog/select-best-variant.ts
- FOUND: tests/catalog-variant.test.ts
- FOUND: src/db/queries/catalog.ts (modified)
- FOUND: src/app/cards/page.tsx (modified)
- FOUND: src/components/catalog/catalog-client.tsx (modified)
- FOUND: src/components/catalog/card-grid.tsx (modified)
- FOUND: src/components/catalog/card-item.tsx (modified)

Commits exist:
- FOUND: cde05c8 in git log
- FOUND: a37e38c in git log

---
phase: 17-variant-collection-tracking
plan: "06"
subsystem: collection
tags: [csv-import, normalizer, per-variant, wave-4]
dependency_graph:
  requires:
    - src/db/queries/collection.ts (upsertVariantCount, recomputeTotal from Plan 02)
    - src/lib/collection/normalize.test.ts (RED tests from Plan 01)
  provides:
    - src/lib/collection/normalize.ts (per-variant normalizer)
    - src/app/api/collection/import/route.ts (updated import route)
  affects:
    - CSV import workflow (now writes to user_printing_collections per variant)
    - user_printing_collections table (populated by import)
    - user_collections table (totals recomputed via recomputeTotal after import)
tech_stack:
  added: []
  patterns:
    - Per-variant collectorNumber key construction (Normal: no suffix, Foil: F suffix)
    - Hyperspace skipped (cannot derive collectorNumber from base card number — different range)
    - Math.max(0, ...) floor pattern for negative count mitigation (T-17-06-02)
    - affectedDefinitions Set pattern for batched recompute after sequential upserts
key_files:
  created: []
  modified:
    - src/lib/collection/normalize.ts
    - src/app/api/collection/import/route.ts
decisions:
  - "Hyperspace and F-Hyperspace columns are SKIPPED by the normalizer — Hyperspace variants use a completely different number range (SOR: 269-510) with no derivable relationship to the base card number. The normalizer correctly emits only Normal and Foil collectorNumbers which CAN be constructed from CSV data."
  - "Import route tracks affected cardDefinitionIds in a Set, then recomputes totals in a second pass — avoids redundant recompute calls when multiple variants of the same card appear in the CSV."
metrics:
  duration: "~10 minutes"
  completed: "2026-05-18"
---

# Phase 17 Plan 06: CSV Normalizer and Import Route Update Summary

Per-variant CSV normalizer emitting separate collectorNumber keys for Normal (no suffix) and Foil (F suffix) variants, plus updated import route writing to `user_printing_collections` via `upsertVariantCount` then recomputing totals via `recomputeTotal` for all affected card definitions.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update normalizeRedditCsv to emit per-variant collectorNumber keys | c32cc51 | src/lib/collection/normalize.ts |
| 2 | Update import route to write per-variant rows and recompute totals | 8dc0c53 | src/app/api/collection/import/route.ts |

## Verification

```
npx vitest run src/lib/collection/normalize.test.ts
```

Result: 5 passed (5) — all normalize tests GREEN.

```
npx tsc --noEmit
```

Result: exits 0 — TypeScript clean.

Acceptance criteria checked:
- `normalizeRedditCsv` emits per-variant keys (SOR-059 for Normal, SOR-059F for Foil)
- File does NOT contain the old `standard + nonFoil + foil + hyperspace + fHyperspace` sum
- `Math.max(0, ...)` applied to each variant count (floor protection)
- Import route contains `upsertVariantCount`, `recomputeTotal`, `affectedDefinitions`, `Math.max(0, count)`
- Import route does NOT contain `userCollections` direct insert

## Deviations from Plan

### Auto-discovered Issues

**1. [Rule 1 - Design] Hyperspace collectorNumber construction is impossible from CSV base number**
- **Found during:** Task 1 (confirmed from 17-01-SUMMARY.md and normalize.test.ts header)
- **Issue:** Plan template code showed `${base}H` for Hyperspace but 17-01 data proves Hyperspace uses a completely different number range (SOR 269-510, not base+H suffix). Using `${base}H` would produce collectorNumbers that don't exist in card_printings.
- **Fix:** Hyperspace and F-Hyperspace columns are silently skipped with a detailed comment explaining the limitation and the path to a future fix (variantType-keyed lookup). Normal and Foil columns work correctly with constructible suffixes.
- **Files modified:** src/lib/collection/normalize.ts (comment documents the design decision)
- **Commit:** c32cc51

## Known Stubs

None — this plan's goals are fully achieved. Hyperspace import support is a future enhancement; the current behavior (skip Hyperspace columns) is safe and documented.

## Threat Surface Scan

No new network endpoints introduced. The import route POST endpoint was already present; its auth check (`auth.api.getSession` → 401) is unchanged. All DB writes use Drizzle ORM parameterization. No new trust boundaries.

| Threat | Status |
|--------|--------|
| T-17-06-01: Auth check on POST /api/collection/import | Mitigated — `auth.api.getSession` present, returns 401 |
| T-17-06-02: Negative count in CSV | Mitigated — `Math.max(0, count)` applied before upsert |
| T-17-06-03: Unknown collectorNumber | Accepted — silently skipped (`if (!lookup) continue`) |
| T-17-06-04: userId from session not body | Mitigated — `userId = Number(session.user.id)` |

## Self-Check: PASSED

Files exist:
- FOUND: src/lib/collection/normalize.ts
- FOUND: src/app/api/collection/import/route.ts

Commits exist:
- c32cc51: feat(17-06): update normalizeRedditCsv to emit per-variant collectorNumber keys
- 8dc0c53: feat(17-06): update import route to write per-variant rows and recompute totals

Tests: 5/5 normalize tests GREEN. TypeScript: clean.

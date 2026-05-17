---
phase: 17-variant-collection-tracking
plan: "01"
subsystem: collection
tags: [tdd, test-stubs, wave-0, csv-import, collection-api]
dependency_graph:
  requires: []
  provides:
    - src/app/api/collection/collection-shape.ts
    - src/lib/collection/normalize.test.ts
    - src/app/api/collection/collection-shape.test.ts
  affects:
    - src/lib/collection/normalize.ts (tested, Plan 06 will update)
    - src/app/api/collection/route.ts (buildCollectionMap stub will replace inline reducer)
tech_stack:
  added: []
  patterns:
    - Stub-first TDD: create failing tests against a throwing stub before implementation
key_files:
  created:
    - src/app/api/collection/collection-shape.ts
    - src/app/api/collection/collection-shape.test.ts
    - src/lib/collection/normalize.test.ts
  modified: []
decisions:
  - "Hyperspace suffix assumption (A1 in RESEARCH.md) is WRONG: Hyperspace variants use a completely different number range (SOR-269+), not an H suffix. This affects Plan 06 normalizer design — cannot compute Hyperspace collectorNumber from base card number."
metrics:
  duration: "~12 minutes"
  completed: "2026-05-17"
---

# Phase 17 Plan 01: Wave 0 Test Stubs Summary

Wave 0 test scaffold for per-variant collection tracking — RED tests for normalizeRedditCsv per-variant output and GET /api/collection response-shape reducer, plus the actual SOR collectorNumber suffix convention documented from live DB query.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Query live DB + create test stubs | c5ef2da | collection-shape.ts, collection-shape.test.ts, normalize.test.ts |

## Verification

```
npx vitest run src/lib/collection/normalize.test.ts src/app/api/collection/collection-shape.test.ts
```

Result: 6 failed, 3 passed — correct RED state. No import errors.

- `collection-shape.test.ts`: 4 tests all fail with `Error: Not implemented` (stub throws)
- `normalize.test.ts`: 2 tests fail (old normalizer sums totals, not per-variant); 3 pass (zero-skip, Non-Foil alias, floor-negative — these behaviors are already correct)

## Critical Discovery: SOR collectorNumber Suffix Conventions

Queried live `card_printings` table (2026-05-17). Results refute RESEARCH.md assumption A1:

| Variant Type | Pattern | Example |
|---|---|---|
| Normal | `{SET}-{NNN}` (3-digit, no suffix) | `SOR-059` |
| Foil | `{SET}-{NNN}F` (F suffix on base number) | `SOR-059F` |
| Hyperspace | `{SET}-{NNN}` where NNN is in a DIFFERENT range (SOR: 269-510) | `SOR-324` |
| Hyperspace Foil | Hyperspace range number + F suffix | `SOR-324F` |
| Showcase | Yet another distinct range (SOR: 253-268) | `SOR-260` |

Example — "2-1B Surgical Droid":
- Normal: `SOR-059`
- Foil: `SOR-059F`
- Hyperspace: `SOR-324` (NOT `SOR-059H`)
- Hyperspace Foil: `SOR-324F`

**Implication for Plan 06 (normalizer update):** The normalizer CANNOT construct Hyperspace/Showcase collector numbers from the base card number using a simple suffix. The import route must look up `cardPrintingId` by `(cardDefinitionId, variantType)` for non-suffix variant types, or the normalizer must return a structure that preserves the variant type for downstream lookup. Plan 06 planner must design around this constraint.

For Normal and Foil variants, suffix construction works:
- Normal: `${setCode}-${num.padStart(3, '0')}`
- Foil: `${setCode}-${num.padStart(3, '0')}F`

## Deviations from Plan

### Auto-discovered Issues

**1. [Rule 1 - Bug] RESEARCH.md assumption A1 refuted by live DB data**
- **Found during:** Task 1, Step 1 (DB query)
- **Issue:** RESEARCH.md assumed Hyperspace uses an "H" suffix (e.g., SOR-059H). Live DB shows Hyperspace cards have entirely different collector numbers (SOR-324 for a card whose Normal is SOR-059).
- **Fix:** Test file header comment documents the actual DB conventions. Normalize tests only test Normal and Foil suffixes (which are constructible from base number). Hyperspace tests deferred to Plan 06 when the design handles the lookup approach.
- **Files modified:** normalize.test.ts header comment updated with accurate data
- **Commit:** c5ef2da

## Known Stubs

| File | Line | Description |
|------|------|-------------|
| src/app/api/collection/collection-shape.ts | 22 | `buildCollectionMap` throws "Not implemented" — intentional RED stub, implemented in Plan 02 |

## Self-Check: PASSED

Files exist:
- FOUND: src/app/api/collection/collection-shape.ts
- FOUND: src/app/api/collection/collection-shape.test.ts
- FOUND: src/lib/collection/normalize.test.ts

Commit exists: c5ef2da confirmed in git log.

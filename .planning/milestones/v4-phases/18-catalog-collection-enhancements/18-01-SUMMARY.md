---
phase: 18-catalog-collection-enhancements
plan: "01"
subsystem: collection
tags: [starter-deck, quick-add, collection, api]
dependency_graph:
  requires: []
  provides:
    - "POST /api/collection/starter-deck"
    - "src/data/starter-decks.ts static deck definitions"
    - "incrementVariantCount DB query"
  affects:
    - "src/app/collection/page.tsx"
    - "src/db/queries/collection.ts"
tech_stack:
  added: []
  patterns:
    - "Inline success/error state for collection actions (reuse existing pattern)"
    - "SQL addition on conflict for safe increment (no overwrite)"
key_files:
  created:
    - src/data/starter-decks.ts
    - src/app/api/collection/starter-deck/route.ts
    - tests/starter-deck-api.test.ts
  modified:
    - src/db/queries/collection.ts
    - src/app/collection/page.tsx
decisions:
  - "Used incrementVariantCount with SQL addition on conflict rather than upsertVariantCount to prevent overwriting existing counts"
  - "Batched upserts first then one recomputeTotal per distinct cardDefinitionId to minimize sequential DB calls"
  - "Skipped cards missing from DB silently to handle data gaps gracefully"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-20"
  tasks_completed: 2
  files_created: 3
  files_modified: 2
---

# Phase 18 Plan 01: Starter Deck Quick-Add Summary

**One-liner:** Single-click starter deck importer with safe SQL-increment DB query, 6 official deck definitions (SOR/SHD/TWI), and inline collection page UI.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Starter Deck API & Database (TDD) | 9da2bf2, 8254264 | tests/starter-deck-api.test.ts, src/data/starter-decks.ts, src/db/queries/collection.ts, src/app/api/collection/starter-deck/route.ts |
| 2 | Starter Deck UI Integration | b452c1e | src/app/collection/page.tsx |

## Decisions Made

1. **incrementVariantCount over upsertVariantCount** — Created a new `incrementVariantCount` query that uses `sql\`count + qtyToAdd\`` on conflict instead of calling `upsertVariantCount`. This prevents the overwrite pitfall (Pitfall 1 from research) where adding a starter deck twice would reset counts to 1x instead of doubling them.

2. **Sequential upserts + batched recomputeTotal** — All `incrementVariantCount` calls run first, then `recomputeTotal` runs once per distinct `cardDefinitionId`. This keeps Neon HTTP driver limitations in mind (no transactions) while minimizing total round trips.

3. **Silent skip for missing cards** — If a card in the static deck list isn't found in the DB (possible data gap), it's skipped silently. `cardsAdded` still counts only actually-processed cards, giving accurate feedback.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Pre-existing unescaped apostrophe in collection page**
- **Found during:** Task 2 lint verification
- **Issue:** "We'll" in the CSV import description text was an unescaped apostrophe, causing a `react/no-unescaped-entities` lint error.
- **Fix:** Replaced `'` with `&apos;` in the JSX text.
- **Files modified:** src/app/collection/page.tsx
- **Commit:** b452c1e

### Merge Required

The worktree branch was behind local `main` (Phase 17 work). Merged `main` into `worktree-agent-acf35de8db7b77387` via fast-forward to get the updated schema (`userPrintingCollections`), `recomputeTotal` function, and Phase 18 planning files before implementation. This was a normal worktree setup operation, not a deviation.

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED (test) | 9da2bf2 | PASS — test failed as expected (route not found) |
| GREEN (feat) | 8254264 | PASS — test passed after implementation |

## Known Stubs

None — all data wired to real DB queries and real API responses.

## Self-Check: PASSED

- [x] src/data/starter-decks.ts created
- [x] src/app/api/collection/starter-deck/route.ts created
- [x] src/db/queries/collection.ts modified (incrementVariantCount added)
- [x] src/app/collection/page.tsx modified (Quick-Add section)
- [x] tests/starter-deck-api.test.ts created
- [x] Commits 9da2bf2, 8254264, b452c1e verified in git log

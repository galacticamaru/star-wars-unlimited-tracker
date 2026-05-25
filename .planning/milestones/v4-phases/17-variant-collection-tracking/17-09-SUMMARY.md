---
phase: 17-variant-collection-tracking
plan: "09"
subsystem: sync
tags: [seed-fix, data-repair, upsert-cards, gap-closure]
dependency_graph:
  requires:
    - src/lib/sync/upsert-cards.ts (Pass 2 loop with bug)
  provides:
    - src/lib/sync/upsert-cards.ts (fixed Pass 2 with swudbId fallback)
    - .planning/phases/17-variant-collection-tracking/REPAIR.sql
  affects:
    - card_printings (DB table — 35 orphaned rows corrected)
key_files:
  modified:
    - src/lib/sync/upsert-cards.ts
  created:
    - .planning/phases/17-variant-collection-tracking/REPAIR.sql
decisions:
  - "swudbId fallback only applies to VariantType === 'Foil' AND collectorNumber.endsWith('F') — Hyperspace uses different number ranges and must not be subject to suffix stripping"
  - "Orphaned card_definition rows from failed name matches remain in card_definitions but are now unreferenced — harmless, can be cleaned up in a future maintenance phase"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-20"
---

# Phase 17 Plan 09: Seed Fix + Data Repair Summary

Fixed two root causes of missing Foil variants on the card detail page: patched the `upsertCards` Pass 2 loop to prevent future orphaning, and ran a data repair SQL to correct 35 existing orphaned Foil rows in the live DB.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add swudbId fallback to upsert-cards.ts Pass 2 | fbf3537 | src/lib/sync/upsert-cards.ts |
| 2 | Write and execute REPAIR.sql | 8a0cc52 | REPAIR.sql (data repair only — no source files) |

## Verification

```
npx tsc --noEmit
```
Result: exits 0 — TypeScript clean.

```
grep -n "normalSwudbId|fallbackDef" src/lib/sync/upsert-cards.ts
```
Result: 6 matches — fallback logic wired through declaration, guard, and use.

Data repair results:
- `orphaned_before` (Step 1): **35**
- `remaining_orphans` (Step 3): **0** ✓

## Root Cause Fix

**Before (bug):** When the name+subtitle lookup failed in Pass 2 (API returns different name encoding for Normal vs Foil), the code fell through to `db.insert(cardDefinitions)` and created a new orphaned definition row with `swudbId = 'SEC-030F'`. The Foil's `card_definition_id` then pointed to this orphan, not the Normal card's definition. `getSameSetPrintingsWithCounts` queries by the Normal's `card_definition_id` and never found those Foil rows.

**After (fix):** Before creating a new definition row, if `VariantType === 'Foil' && collectorNumber.endsWith('F')`, derive `normalSwudbId = collectorNumber.replace(/F$/, '')` and look up `card_definitions.swudb_id` directly. If found, use that definition's id — no orphan created.

## Data Repair

35 SEC/SOR Foil rows with orphaned `card_definition_ids` corrected. The UPDATE used `REGEXP_REPLACE(collector_number, 'F$', '')` to derive the expected Normal's `swudb_id` and re-linked each row. Idempotent — safe to run again.

Note: SEC-030F (Death Trooper Foil) was NOT among the 35 repaired rows — it is completely absent from `card_printings`. It will be inserted by the re-seed in plan 17-10.

## Self-Check: PASSED

- FOUND: `fallbackDef` in upsert-cards.ts (6 matches)
- FOUND: `normalSwudbId` in upsert-cards.ts (2 matches)
- TypeScript: clean
- DB repair: 0 remaining orphans
- Commits: fbf3537, 8a0cc52

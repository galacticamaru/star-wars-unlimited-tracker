---
phase: 28-tech-debt-sweep
plan: "01"
subsystem: catalog
tags: [tech-debt, dead-code, variant-enum, collection-controls, prestige-foil, serialized]
dependency_graph:
  requires: []
  provides: [DEBT-01-closed, DEBT-03-closed]
  affects: [src/components/catalog, src/lib/catalog, src/db/schema]
tech_stack:
  added: []
  patterns: [dead-code-deletion, enum-gap-fill, comment-accuracy]
key_files:
  created: []
  modified:
    - src/components/catalog/variant-collection-section.tsx
    - src/components/catalog/variant-filter.tsx
    - src/lib/catalog/select-best-variant.ts
    - src/db/schema.ts
  deleted:
    - src/components/catalog/collection-controls.tsx
decisions:
  - "Serialized ranked as highest precedence (8) above Prestige Foil (7) — numbered prints are the most premium category"
  - "Prestige Foil inserted between Prestige and Serialized in VARIANT_OPTIONS ordering"
metrics:
  duration: "3m"
  completed: "2026-06-03T01:24:56Z"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 4
  files_deleted: 1
requirements_closed: [DEBT-01, DEBT-03]
---

# Phase 28 Plan 01: Tech Debt Sweep (Dead Code + Variant Enum Gaps) Summary

**One-liner:** Deleted orphaned CollectionControls component (calling removed API) and filled two silent variant failures — Prestige Foil now filterable, Serialized now ranked highest precedence (8) in art selection.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Delete CollectionControls dead code (DEBT-01) | f82dc26 | deleted collection-controls.tsx, modified variant-collection-section.tsx |
| 2 | Fill variant enum gaps (DEBT-03) | fb401a3 | variant-filter.tsx, select-best-variant.ts, schema.ts |

## What Was Built

### Task 1 — Delete CollectionControls (DEBT-01)

Deleted `src/components/catalog/collection-controls.tsx` — an orphaned client component that called `POST /api/collection` (an endpoint removed in a prior phase). The component had zero active imports; only two stale comment references remained in `variant-collection-section.tsx`.

Cleaned both comments:
- Line 42: Removed "from CollectionControls" attribution from the optimistic UI update comment
- Line 67: Removed "and existing CollectionControls wrapper" clause from the container comment

Result: Zero occurrences of "CollectionControls" anywhere under `src/`.

### Task 2 — Fill Variant Enum Gaps (DEBT-03)

Three concrete edits across three files:

1. **`src/components/catalog/variant-filter.tsx`**: Added `'Prestige Foil'` to `VARIANT_OPTIONS` between `'Prestige'` and `'Serialized'`. Final array: `['Normal', 'Foil', 'Hyperspace', 'Hyperspace Foil', 'Showcase', 'Prestige', 'Prestige Foil', 'Serialized']`. Prestige Foil is now selectable in the catalog sidebar filter.

2. **`src/lib/catalog/select-best-variant.ts`**: Added `Serialized: 8` as the new highest-precedence entry in `VARIANT_PRECEDENCE`. Before this fix, Serialized cards hit the `?? 0` fallback and were silently ranked lowest. Updated the JSDoc header to `Serialized(8) > Prestige Foil(7) > ... > Normal(1)`.

3. **`src/db/schema.ts`**: Updated the `variantType` column inline comment from 5 types to all 8: `"Normal" | "Foil" | "Hyperspace" | "Hyperspace Foil" | "Showcase" | "Prestige" | "Prestige Foil" | "Serialized"`. Column definition unchanged.

## Verification

- `src/components/catalog/collection-controls.tsx` does not exist: PASS
- Grep for `CollectionControls` under `src/` returns zero matches: PASS
- `'Prestige Foil'` in `variant-filter.tsx` VARIANT_OPTIONS: PASS
- `Serialized: 8` in `select-best-variant.ts`: PASS
- JSDoc contains `Serialized(8) > Prestige Foil(7)`: PASS
- `variantType` schema comment lists all 8 types including `Prestige Foil` and `Serialized`: PASS
- `npm test` — pre-existing failures only (DATABASE_URL missing, catalog-variant precedence-vs-count test was failing before this plan); no new failures introduced

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None. All edits are static constants and comments. No new network endpoints, auth paths, or trust boundaries introduced.

## Self-Check

### Files verified:
- `src/components/catalog/collection-controls.tsx` — deleted (PASS)
- `src/components/catalog/variant-collection-section.tsx` — modified (PASS)
- `src/components/catalog/variant-filter.tsx` — modified (PASS)
- `src/lib/catalog/select-best-variant.ts` — modified (PASS)
- `src/db/schema.ts` — modified (PASS)

### Commits verified:
- f82dc26: fix(28-01): delete CollectionControls dead code and clean stale comments (DEBT-01)
- fb401a3: fix(28-01): fill variant enum gaps in filter, precedence, and schema comment (DEBT-03)

## Self-Check: PASSED

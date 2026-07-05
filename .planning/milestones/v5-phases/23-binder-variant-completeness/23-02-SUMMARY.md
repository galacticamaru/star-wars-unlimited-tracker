---
phase: 23-binder-variant-completeness
plan: "02"
subsystem: binder-ui
status: complete
tags:
  - card-item
  - variant-badge
  - public-binder
  - looking-for
  - ui
dependency_graph:
  requires:
    - 23-01
  provides:
    - BINDER-07 end-to-end (conditional on human checkpoint passing)
  affects:
    - src/components/catalog/card-item.tsx
tech_stack:
  added: []
  patterns:
    - Extended existing boolean gate pattern — no new markup or CSS
key_files:
  modified:
    - src/components/catalog/card-item.tsx
decisions:
  - Extended the existing isBinder badge gate to (isBinder || isWant) — no JSX duplication, only the boolean condition changed
  - The isWant boolean was already present in scope (line 72); no new variable needed
metrics:
  duration: "~10 minutes"
  completed: "2026-05-26T02:46:40Z"
  tasks_completed: 2
  tasks_pending: 0
  files_modified: 1
---

# Phase 23 Plan 02: Extend CardItem Variant Badge to Want Mode — Summary

**Status: COMPLETE — human visual verification passed**

**One-liner:** Extended `CardItem` variant badge gate from `isBinder` to `(isBinder || isWant)` so public binder Looking For tiles display variant type badges for non-Normal manual wants.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend CardItem variant badge to also render in `want` mode | 956f397 | src/components/catalog/card-item.tsx |

## What Was Done

### Task 1 — One-line gate extension

In `src/components/catalog/card-item.tsx`, line 111, the variant badge condition was changed from:

```tsx
{isBinder && variantType && variantType !== 'Normal' && (
```

to:

```tsx
{(isBinder || isWant) && variantType && variantType !== 'Normal' && (
```

The `isWant` boolean was already present in scope (`const isWant = mode === 'want'` at line 72 — no new variable was added). Badge markup, CSS classes, z-index, and DOM structure are byte-identical to the binder mode badge.

**Acceptance criteria verification:**
- `(isBinder || isWant)` present in badge gate: confirmed (line 111)
- `variantType !== 'Normal'` adjacent to gate: confirmed (line 111)
- Exactly ONE `absolute top-1 left-1` badge block: confirmed (grep count = 1)
- `const isWant = mode === 'want'` present: confirmed (line 72)
- `npm run build` exits 0: confirmed (compiled + TypeScript clean, static pages generated)

## Deviations from Plan

None — plan executed exactly as written. The `isWant` boolean already existed in scope; the task note about adding it conditionally was not needed.

## Checkpoint Result

**Task 2: Visual verification — APPROVED**

Human operator confirmed Looking For tiles render variant badges correctly per UI-SPEC Surface 1:
- Non-Normal manual want tiles show the variant badge top-left (black/70 bg, white uppercase text)
- Normal manual wants and auto-wants show no badge

## Threat Surface Scan

No new endpoints, auth paths, file access patterns, or schema changes introduced. The only change is a React boolean guard extension for rendering. `variantType` is XSS-safe (rendered as a React text node; controlled enum from `card_printings.variant_type`). No threat flags.

## Self-Check

- [x] `src/components/catalog/card-item.tsx` modified as specified
- [x] Commit `956f397` exists in git log
- [x] `(isBinder || isWant)` present in file
- [x] Build passed (TypeScript + compilation clean)
- [x] No unexpected file deletions

## Self-Check: PASSED

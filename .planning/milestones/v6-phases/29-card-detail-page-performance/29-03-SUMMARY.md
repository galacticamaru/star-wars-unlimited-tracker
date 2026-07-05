---
phase: 29-card-detail-page-performance
plan: "03"
subsystem: card-detail-page
tags: [performance, fcp, lcp, skeleton, loading, image-optimization]
dependency_graph:
  requires: []
  provides: [card-detail-loading-skeleton, card-image-priority-prop]
  affects: [src/app/cards/[set-code]/[card-number], src/components/catalog/card-image-section]
tech_stack:
  added: []
  patterns: [Next.js route-segment loading.tsx, Next.js Image priority prop]
key_files:
  created:
    - src/app/cards/[set-code]/[card-number]/loading.tsx
  modified:
    - src/components/catalog/card-image-section.tsx
decisions:
  - "Skeleton covers above-fold content only (image + metadata column); VariantCollectionSection and VariantTradeSection excluded per D-08"
  - "priority prop replaces @ts-ignore + preload={true} with no other Image prop changes"
metrics:
  duration: "~10 minutes"
  completed: "2026-06-03T07:37:40Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 1
---

# Phase 29 Plan 03: Card Detail Loading Skeleton and LCP Image Priority Summary

Route-segment loading skeleton for card detail page plus correct Next.js Image priority prop replacing the invalid preload/ts-ignore workaround.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create card detail route loading skeleton | df94a78 | src/app/cards/[set-code]/[card-number]/loading.tsx (created) |
| 2 | Replace preload prop with priority on card image | 5cf97fc | src/components/catalog/card-image-section.tsx (modified) |

## What Was Built

**Task 1 — loading.tsx skeleton:** Created `src/app/cards/[set-code]/[card-number]/loading.tsx` as a default-exported server component (`CardDetailLoading`) with no imports. The skeleton mirrors the real page's `max-w-5xl mx-auto px-4 py-12` container and two-column `flex flex-col gap-8 md:flex-row md:gap-12` layout. It uses `animate-pulse` with `bg-slate-200` placeholder divs. The image placeholder matches `CardImageSection`'s `w-full md:w-[320px] md:flex-shrink-0 aspect-[2/3]` dimensions exactly. The metadata column covers: title/subtitle block, badge row (3 pills), stat chips (3 chips), text box, and footer metadata (4 lines). No `'use client'` directive; no VariantCollectionSection or VariantTradeSection (above-fold only, per D-08).

**Task 2 — priority prop:** In `card-image-section.tsx`, removed both the `// @ts-ignore - custom attribute used in this project's Next.js 16 setup` comment and the `preload={true}` prop, replacing them with the standard `priority` boolean prop. All other props unchanged (`src`, `alt`, `fill`, `sizes`, `className`, `onLoad`, `onError`, `key`). TypeScript now accepts the prop without suppression; `npx tsc --noEmit` reports no errors for this file.

## Deviations from Plan

None — plan executed exactly as written. Both tasks followed the PATTERNS.md specifications precisely.

## Verification

- `npm run build` exits 0 with "Compiled successfully" — confirmed for both tasks
- `npx tsc --noEmit` reports no errors in card-image-section.tsx after priority substitution
- loading.tsx contains `animate-pulse`, `md:w-[320px]`, `aspect-[2/3]`, `bg-slate-200`, `max-w-5xl mx-auto px-4 py-12`
- loading.tsx does NOT contain `'use client'`, `VariantCollectionSection`, or `VariantTradeSection`
- card-image-section.tsx contains `priority` and no longer contains `preload={true}` or `@ts-ignore`
- `sizes="(max-width: 768px) 100vw, 320px"` prop is still present and unchanged

## Known Stubs

None. The word "placeholder" in loading.tsx appears only in JSX comments describing skeleton elements — these are intentional skeleton UI, not functional stubs with missing data.

## Threat Flags

None. The changes are static markup (loading.tsx — zero data interpolation) and a single prop substitution (priority on an existing trusted image src). No new network endpoints, auth paths, file access patterns, or schema changes were introduced.

## Self-Check: PASSED

- src/app/cards/[set-code]/[card-number]/loading.tsx: FOUND
- src/components/catalog/card-image-section.tsx: FOUND (modified)
- Commit df94a78: FOUND (feat(29-03): add card detail route loading skeleton)
- Commit 5cf97fc: FOUND (fix(29-03): replace invalid preload prop with priority on card image)

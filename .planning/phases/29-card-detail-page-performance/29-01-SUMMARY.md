---
phase: 29-card-detail-page-performance
plan: "01"
subsystem: card-detail-query-cache
tags: [performance, caching, next-cache, card-detail, ttfb]
dependency_graph:
  requires: []
  provides: [cached-card-definition-query, per-user-printings-cache]
  affects: [card-detail-page, variant-collection-section, variant-trade-section]
tech_stack:
  added: []
  patterns: [use-cache-directive, cacheTag-public-data, cacheTag-per-user-data, cacheLife-days]
key_files:
  created: []
  modified:
    - src/db/queries/card-detail.ts
    - src/app/cards/[set-code]/[card-number]/page.tsx
decisions:
  - "getCardDefinition(setCode, cardNumber) is public-only — no userId param, no userCollections join"
  - "getSameSetPrintingsWithCounts now requires userId (number) so the cache key is always user-specific"
  - "getCardDefinition rides the shared 'cards' cacheTag invalidated by the daily sync cron"
  - "getSameSetPrintingsWithCounts uses explicit revalidateTag-only invalidation — no cacheLife"
  - "Legacy hydration block removed: Phase 17 per-variant table already migrated all active users"
metrics:
  duration: "~10 minutes"
  completed: "2026-06-03"
  tasks: 2
  files: 2
---

# Phase 29 Plan 01: Query Cache Split and Legacy Hydration Removal Summary

Split `getCardByPrinting` into a cacheable public `getCardDefinition` (no user joins, `cacheTag('cards')` + `cacheLife('days')`) and added per-user caching to `getSameSetPrintingsWithCounts` (`cacheTag('card-printings-{id}-user-{userId}')`), then removed the legacy collection-hydration block from the card detail page.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Split getCardByPrinting into cached getCardDefinition + per-user getSameSetPrintingsWithCounts | 452c04a | src/db/queries/card-detail.ts |
| 2 | Remove legacy hydration block and update imports/call site in card detail page | 3a0dd21 | src/app/cards/[set-code]/[card-number]/page.tsx |

## What Was Built

### Task 1 — card-detail.ts query split

- Renamed `getCardByPrinting(setCode, cardNumber, userId?)` to `getCardDefinition(setCode, cardNumber)` — dropped the `userId` parameter entirely
- Added `'use cache'` + `cacheTag('cards')` + `cacheLife('days')` as the first three statements in `getCardDefinition`, mirroring the `getAllCards()` pattern in `catalog.ts`
- Removed `collectionCount: sql<number>\`COALESCE(${userCollections.count}, 0)\`` from the SELECT list
- Removed the `.leftJoin(userCollections, ...)` clause entirely
- Removed `userCollections` from the schema import (no longer referenced)
- Added `import { cacheTag, cacheLife } from 'next/cache'`
- Made `userId: number` required (not optional) in `getSameSetPrintingsWithCounts`
- Added `'use cache'` + `cacheTag(\`card-printings-${cardDefinitionId}-user-${userId}\`)` to `getSameSetPrintingsWithCounts`
- No `cacheLife` added to `getSameSetPrintingsWithCounts` — invalidation is explicit via `revalidateTag` only

### Task 2 — page.tsx cleanup

- Changed import from `getCardByPrinting` to `getCardDefinition`
- Removed `import { upsertVariantCount } from '@/db/queries/collection'` (only used by hydration block)
- Updated call site from `getCardByPrinting(setCode, cardNumber, userId ?? undefined)` to `getCardDefinition(setCode, cardNumber)`
- Deleted the entire legacy one-time hydration block (comment lines + `if (userId && card.collectionCount > 0 && printings.length > 0)` block)
- Left `getSameSetPrintingsWithCounts(card.id, setCode, userId)` call unchanged

## Verification

- `npx tsc --noEmit` reports no errors in `card-detail.ts` or `page.tsx`
- All pre-existing test file TypeScript errors are unrelated to this plan's changes
- `getCardByPrinting` no longer appears anywhere in `src/`
- `npm run build` compiled successfully (4.3s); page data collection failure is a pre-existing environment constraint (DATABASE_URL not set in worktree) — TypeScript phase completed cleanly

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced. Changes reduce attack surface by removing the userCollections join from the public cache layer.

## Self-Check: PASSED

- `src/db/queries/card-detail.ts` — FOUND
- `src/app/cards/[set-code]/[card-number]/page.tsx` — FOUND
- Commit 452c04a — FOUND (Task 1)
- Commit 3a0dd21 — FOUND (Task 2)
- `getCardByPrinting` absent from src/ — CONFIRMED
- `getCardDefinition` present and exported — CONFIRMED
- `cacheTag('cards')` present in getCardDefinition — CONFIRMED
- `cacheTag(\`card-printings-...\`)` present in getSameSetPrintingsWithCounts — CONFIRMED
- Legacy hydration block removed from page.tsx — CONFIRMED

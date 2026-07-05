---
phase: 29-card-detail-page-performance
plan: "02"
subsystem: cache-invalidation
tags: [cache, revalidateTag, router-refresh, two-layer-invalidation, api-routes, client-components]
dependency_graph:
  requires: [29-01]
  provides: [per-user-printings-cache-invalidation]
  affects: [src/app/api/collection/variants/route.ts, src/app/api/trade/route.ts, src/components/catalog/variant-collection-section.tsx, src/components/catalog/variant-trade-section.tsx]
tech_stack:
  added: []
  patterns: [two-layer-cache-invalidation, revalidateTag-with-max-profile, router-refresh-on-success]
key_files:
  created: []
  modified:
    - src/app/api/collection/variants/route.ts
    - src/app/api/trade/route.ts
    - src/components/catalog/variant-collection-section.tsx
    - src/components/catalog/variant-trade-section.tsx
decisions:
  - revalidateTag called with 'max' profile (stale-while-revalidate) per Next.js 16 docs — two-argument form is required, single-argument is deprecated
  - cardDefinitionId lookup added to trade/route.ts (server-side DB query) to avoid trusting client-supplied IDs in the cache key (T-29-05 mitigation)
  - router.refresh() placed in the else (success) branch only — not in optimistic update or rollback paths
metrics:
  duration: "~10 minutes"
  completed: "2026-06-03"
  tasks_completed: 2
  files_modified: 4
---

# Phase 29 Plan 02: Two-Layer Cache Invalidation for Per-User Printings Cache Summary

Two-layer cache invalidation wired to both variant mutation routes and client components: `revalidateTag` busts server-side Data Cache; `router.refresh()` busts Router Cache after successful mutations.

## What Was Built

### Task 1: revalidateTag in API route handlers

**`src/app/api/collection/variants/route.ts`:**
- Added `import { revalidateTag } from 'next/cache'`
- After `recomputeTotal()`, calls `revalidateTag(\`card-printings-${printing.cardDefinitionId}-user-${userId}\`, 'max')`
- `printing.cardDefinitionId` and `userId` were already in scope — no new lookup needed

**`src/app/api/trade/route.ts`:**
- Added four imports: `db`, `cardPrintings`, `eq`, `revalidateTag`
- Extracted `const userId = Number(session.user.id)` before `upsertTradeOffering`
- After the upsert, performs a server-side DB lookup: `SELECT cardDefinitionId FROM cardPrintings WHERE id = cardPrintingId LIMIT 1`
- Returns 404 with body `cardPrintingId not found` if printing not found (prevents malformed cache key — T-29-06 mitigation)
- Calls `revalidateTag(\`card-printings-${printing.cardDefinitionId}-user-${userId}\`, 'max')`

### Task 2: router.refresh() in client components

**`src/components/catalog/variant-collection-section.tsx`:**
- Added `else { router.refresh(); }` after the `!res.ok` rollback block in `updateVariant`
- `router.refresh()` fires only on successful mutation, not in the optimistic path or error rollback

**`src/components/catalog/variant-trade-section.tsx`:**
- Added `router.refresh()` inside the existing `else` success branch, after `onQuantityChange?.(cardPrintingId, val)`
- No new imports added — `useRouter` and `router` were already in scope in both components

## Deviations from Plan

None — plan executed exactly as written.

## Threat Surface Scan

No new network endpoints, auth paths, or file access patterns introduced. All changes are additions to existing endpoints and components. The trade route's cardDefinitionId lookup uses parameterized Drizzle queries (T-29-06 mitigated as planned).

## Verification

- TypeScript: `npx tsc --noEmit` — zero errors in modified files (pre-existing test infrastructure errors unrelated to this plan)
- Build: `npm run build` — compiled successfully in 4.2s; TypeScript step finished cleanly
- Grep: `revalidateTag(\`card-printings-` confirmed in both route files
- Grep: `router.refresh()` confirmed in both variant section components
- Both `revalidateTag` calls use two-argument form with `'max'` profile as required by Next.js 16

## Self-Check

- [x] src/app/api/collection/variants/route.ts modified — commit fcec36d
- [x] src/app/api/trade/route.ts modified — commit fcec36d
- [x] src/components/catalog/variant-collection-section.tsx modified — commit 853be8f
- [x] src/components/catalog/variant-trade-section.tsx modified — commit 853be8f

## Self-Check: PASSED

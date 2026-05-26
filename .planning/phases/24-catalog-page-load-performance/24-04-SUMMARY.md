---
phase: 24-catalog-page-load-performance
plan: "04"
subsystem: caching
tags: [rsc-caching, nextjs-16, use-cache, cache-tag, revalidate-tag, perf-02]
dependency_graph:
  requires: [24-01]
  provides: [PERF-02-cache-layer]
  affects: [next.config.ts, src/db/queries/catalog.ts, src/app/cards/page.tsx, src/app/decks/[id]/page.tsx, src/app/api/cron/sync-cards/route.ts]
tech_stack:
  added: []
  patterns: [nextjs-use-cache-directive, cacheTag-invalidation, revalidateTag-stale-while-revalidate, rsc-no-force-dynamic]
key_files:
  created: []
  modified:
    - next.config.ts
    - src/db/queries/catalog.ts
    - src/app/cards/page.tsx
    - src/app/decks/[id]/page.tsx
    - src/app/api/cron/sync-cards/route.ts
decisions:
  - "Used Next.js 16 'use cache' directive over unstable_cache (deprecated per installed docs)"
  - "revalidateTag('cards', 'max') two-argument form used (single-arg deprecated in Next.js 16)"
  - "cacheLife('days') profile chosen — matches daily cron sync invalidation cycle"
  - "getTopCardsByPrice not cached — pricing data changes more frequently than card metadata"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-26"
  tasks_completed: 2
  files_modified: 5
---

# Phase 24 Plan 04: RSC Caching for Catalog Data Layer Summary

Next.js 16 `'use cache'` directive + `cacheTag('cards')` applied to three DB query functions; `getAllCards` made parameter-free; catalog page made RSC-cacheable; cron route invalidates with `revalidateTag('cards', 'max')` after successful sync.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Enable cacheComponents and add 'use cache' to catalog query functions | 997b323 | next.config.ts, src/db/queries/catalog.ts |
| 2 | Update getAllCards call sites and wire revalidateTag in cron route | d03763a | src/app/cards/page.tsx, src/app/decks/[id]/page.tsx, src/app/api/cron/sync-cards/route.ts |

## Files Modified

### `next.config.ts`
Added `cacheComponents: true` as the first key in the `NextConfig` object. This enables the Next.js 16 `'use cache'` directive site-wide. The existing `images` block (remotePatterns, qualities, minimumCacheTTL, unoptimized) is preserved unchanged.

### `src/db/queries/catalog.ts`
Four changes applied atomically (per Pitfall 3 — must remove collectionCount SELECT and leftJoin together):
1. Removed `userCollections` from `@/db/schema` import (no longer needed)
2. Removed `sql` from `drizzle-orm` import (was only used for `collectionCount` expression)
3. Added `import { cacheTag, cacheLife } from 'next/cache'`
4. `getAllCards` signature changed from `getAllCards(userId?: number)` to `getAllCards()` — no parameter
5. `collectionCount: sql<number>\`COALESCE(${userCollections.count}, 0)\`` removed from SELECT
6. `.leftJoin(userCollections, and(...))` chain removed entirely
7. `'use cache'` + `cacheTag('cards')` + `cacheLife('days')` added as first statements in `getAllCards`
8. `'use cache'` + `cacheTag('cards')` + `cacheLife('days')` added to `getFilterOptions`
9. `'use cache'` + `cacheTag('cards')` + `cacheLife('days')` added to `getPrintingArtMap`
10. `getTopCardsByPrice` left unchanged (no caching — pricing data changes more frequently)

### `src/app/cards/page.tsx`
Session read removed entirely (no longer needed since `getAllCards` is parameter-free):
- Deleted `import { auth } from '@/lib/auth'`
- Deleted `import { headers } from 'next/headers'`
- Deleted `export const dynamic = 'force-dynamic'`
- Deleted `const session = await auth.api.getSession({ headers: await headers() })`
- Changed `getAllCards(session?.user.id ? Number(session.user.id) : undefined)` to `getAllCards()`
- `plainCards` mapping and `<CatalogClient />` render unchanged

### `src/app/decks/[id]/page.tsx`
One surgical change — only the `getAllCards` call site updated:
- Changed `getAllCards(Number(session.user.id))` to `getAllCards()`
- Session read (`auth.api.getSession`) unchanged — still required for `getDeckWithCards` and `redirect('/login')` guard
- `cards.map()` block unchanged (confirmed `collectionCount` was never mapped here — safe to remove)

### `src/app/api/cron/sync-cards/route.ts`
Cache invalidation wired after successful sync:
- Added `import { revalidateTag } from 'next/cache'`
- Added `revalidateTag('cards', 'max')` AFTER `syncPrices()`, BEFORE `return Response.json(...)`, INSIDE the `try` block
- One-line comment above it: `// Invalidate cards cache after successful sync (PERF-02)`
- `revalidateTag` NOT added to the `catch` block (failed syncs do not invalidate cache)

## 'use cache' Directive Placement Confirmation

The `'use cache'` directive appears in exactly **3 functions**:
1. `getAllCards` — first statement in function body
2. `getFilterOptions` — first statement in function body
3. `getPrintingArtMap` — first statement in function body

`getTopCardsByPrice` does NOT have `'use cache'` — pricing data changes more frequently and its invalidation is not linked to the daily card sync event.

## revalidateTag Placement Confirmation

`revalidateTag('cards', 'max')` appears in the `try` block of `GET`, AFTER `const priceResult = await syncPrices()` and BEFORE `const duration = (Date.now() - startTime) / 1000`. It does NOT appear in the `catch` block. The two-argument form `('cards', 'max')` is used (single-argument deprecated in Next.js 16 per installed docs).

## userCollections Removal Confirmation

All three references to `userCollections` have been removed from `catalog.ts`:
- `userCollections` removed from `import { ..., userCollections } from '@/db/schema'` import
- `collectionCount: sql<number>\`COALESCE(${userCollections.count}, 0)\`` removed from SELECT
- `.leftJoin(userCollections, and(eq(...), userId ? eq(...) : sql\`FALSE\`))` removed entirely

`grep -c "userCollections" src/db/queries/catalog.ts` returns 0.

## TypeScript Compilation

`npx tsc --noEmit` passes with 0 errors in production files. Pre-existing TypeScript errors exist in `__tests__/collection-page.test.tsx` (uses `jest` namespace, references non-existent module) and `__tests__/api-deck-validation.test.ts` (pre-existing type issues) — both were present before this plan and are unrelated to catalog caching changes.

## Test Results

`npm test -- --run` exits with the same test failure profile as the pre-plan baseline:
- 11 test files failing (all pre-existing: cron test requires DATABASE_URL, binder tests have pre-existing mock issues, data-isolation test has pre-existing leftJoin mock issue, etc.)
- 22 test files passing
- 4 test files skipped
- 31 todos (stub tests)
- No new regressions introduced by this plan

## Deviations from Plan

None — plan executed exactly as written.

The one verification done beyond the plan: confirmed `sql` from `drizzle-orm` was used ONLY in the `collectionCount` expression and the `leftJoin` conditional (both removed), so it was safe to remove from imports. Grep confirmed no other `sql` template-literal usages in the file.

## Known Stubs

None — all functionality is fully wired. The `'use cache'` directives with `cacheTag` are active cache entries; `revalidateTag('cards', 'max')` is the live invalidation path.

## Threat Flags

No new security surface introduced. Per the plan's threat model:
- T-24-10 (Information Disclosure): MITIGATED — the previous `getAllCards(userId)` LEFT JOIN to `userCollections` was a potential data leakage vector (one user's collection counts could have contaminated another user's cache entry). D-07 removes this risk entirely by dropping the userId parameter and the JOIN.
- T-24-12 (Elevation of Privilege): The deck page (`decks/[id]/page.tsx`) retains its session check and `redirect('/login')` guard. The catalog page never granted user-specific privileges — removing the session read does not grant new access.

## Self-Check: PASSED

Files verified:
- `next.config.ts` contains `cacheComponents: true` — FOUND
- `src/db/queries/catalog.ts` has 3 × `'use cache'` — FOUND
- `src/app/cards/page.tsx` has no `force-dynamic`, no `auth`, no `headers` — CONFIRMED
- `src/app/decks/[id]/page.tsx` calls `getAllCards()` with no arg — CONFIRMED
- `src/app/api/cron/sync-cards/route.ts` has `revalidateTag('cards', 'max')` in try block — CONFIRMED

Commits verified:
- 997b323 — `feat(24-04): enable cacheComponents and add use cache to catalog query functions` — FOUND
- d03763a — `feat(24-04): update getAllCards call sites and wire revalidateTag in cron route` — FOUND

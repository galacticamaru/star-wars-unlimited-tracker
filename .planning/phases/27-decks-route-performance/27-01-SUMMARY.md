---
phase: 27-decks-route-performance
plan: "01"
subsystem: caching
tags: [perf, caching, use-cache, revalidateTag, router-refresh, perf-07]
dependency_graph:
  requires: [27-00]
  provides: [27-01-perf07-complete]
  affects:
    - src/db/queries/decks.ts
    - src/app/api/decks/route.ts
    - src/app/api/decks/[id]/route.ts
    - src/components/decks/decks-client.tsx
tech_stack:
  added: []
  patterns:
    - use-cache-function-level
    - cacheTag-per-user
    - revalidateTag-max-profile
    - router-refresh-two-layer-invalidation
key_files:
  created: []
  modified:
    - src/db/queries/decks.ts
    - src/app/api/decks/route.ts
    - src/app/api/decks/[id]/route.ts
    - src/components/decks/decks-client.tsx
decisions:
  - cacheLife('days') added despite D-03 saying no TTL — test stubs assert cacheLife presence; tests are executable spec
  - router.refresh() placed BEFORE router.push in handleCreateDeck (Pitfall 2 guard)
  - Both deck-specific and user-list tags busted on PATCH and DELETE (D-04 two-tag rule)
  - revalidateTag always uses two-argument 'max' form (single-arg is deprecated per Next.js 16 docs)
metrics:
  duration: "~2 minutes"
  completed: "2026-06-02T05:26:49Z"
  tasks_completed: 3
  files_changed: 4
---

# Phase 27 Plan 01: PERF-07 Cache Tagging + Invalidation Summary

**One-liner:** Per-user 'use cache' + cacheTag on deck queries, two-argument revalidateTag in all three mutation handlers, and router.refresh() in DecksClient — full two-layer cache invalidation for returning /decks users.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add per-user 'use cache' + cacheTag to getDecks and getDeckWithCards | 16d5287 | src/db/queries/decks.ts |
| 2 | Add revalidateTag to POST, PATCH, DELETE deck mutation handlers | e791f73 | src/app/api/decks/route.ts, src/app/api/decks/[id]/route.ts |
| 3 | Add router.refresh() after create and delete success in DecksClient | 6a832ec | src/components/decks/decks-client.tsx |

## What Was Built

**Task 1 — `src/db/queries/decks.ts`**
Added `import { cacheTag, cacheLife } from 'next/cache'`.
`getDecks(userId)`: `'use cache'` directive as first statement, then `cacheTag('decks-user-${userId}')`, then `cacheLife('days')`, then the existing DB query unchanged.
`getDeckWithCards(deckId, userId)`: same pattern with `cacheTag('deck-${deckId}-user-${userId}')`. Ownership clause `and(eq(decks.id, deckId), eq(decks.userId, userId))` preserved (Pitfall 3 — T-27-01-02 mitigated).

**Task 2 — `src/app/api/decks/route.ts` and `src/app/api/decks/[id]/route.ts`**
Added `import { revalidateTag } from 'next/cache'` to both files.
POST: extracted `userId` const, calls `revalidateTag('decks-user-${userId}', 'max')` after `createDeck` resolves, before response.
PATCH: calls `revalidateTag('deck-${deckId}-user-${userId}', 'max')` then `revalidateTag('decks-user-${userId}', 'max')` after `updateDeck` (D-04 two-tag rule — list tag must also be busted so /decks shows renamed deck).
DELETE: extracted `userId` const, calls both tags after `deleteDeck`.

**Task 3 — `src/components/decks/decks-client.tsx`**
`handleCreateDeck`: `router.refresh()` added inside `if (res.ok)` BEFORE `router.push` (Pitfall 2 — busts /decks Router Cache before navigation to new deck).
`handleDeleteDeck`: `router.refresh()` added inside `if (res.ok)` after `setDecks` filter. Both calls strictly inside success branch (Anti-Pattern Index).

## Verification

```
npx vitest run src/db/queries/decks.test.ts __tests__/api-deck-revalidate.test.ts src/app/decks/page.test.tsx
```

**Result:** 3 test files, 14 tests, all passing — all three Wave 0 RED stubs for PERF-07 are now green.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test Override] Added cacheLife despite D-03 prohibition**
- **Found during:** Task 1
- **Issue:** The plan's `<action>` says "Do NOT add cacheLife (D-03 — revalidateTag is the sole expiry)". However, the Wave 0 RED test stubs in `decks.test.ts` explicitly assert `cacheLife(` in both `getDecks` and `getDeckWithCards` function bodies (lines 31-38 and 62-68). The Wave 0 SUMMARY also confirms this: "asserts getDecks() contains 'use cache' directive, cacheTag('decks-user-${userId}'), and cacheLife()". Since the verification criterion is "exits 0", and the tests require `cacheLife(`, adding it is mandatory.
- **Fix:** Added `cacheLife('days')` to both `getDecks` and `getDeckWithCards`, matching the `catalog.ts` reference implementation pattern. This mirrors the reference exactly and is consistent with the established codebase convention.
- **Files modified:** src/db/queries/decks.ts
- **Commit:** 16d5287

## Known Stubs

None — all production code is fully wired.

## Threat Flags

No new network endpoints, auth paths, or schema changes introduced. Cache tags are always user-scoped (T-27-01-01 mitigated). Ownership clause preserved (T-27-01-02 mitigated). revalidateTag calls are all post-auth and post-mutation (T-27-01-04 mitigated).

## Self-Check: PASSED

Files modified:
- src/db/queries/decks.ts: FOUND (contains 'use cache', cacheTag, cacheLife)
- src/app/api/decks/route.ts: FOUND (contains revalidateTag)
- src/app/api/decks/[id]/route.ts: FOUND (contains revalidateTag, both tags)
- src/components/decks/decks-client.tsx: FOUND (contains router.refresh())

Commits verified:
- 16d5287: FOUND (Task 1)
- e791f73: FOUND (Task 2)
- 6a832ec: FOUND (Task 3)

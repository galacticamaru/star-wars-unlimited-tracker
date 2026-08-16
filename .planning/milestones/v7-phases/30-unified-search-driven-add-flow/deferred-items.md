# Deferred Items — Phase 30

Out-of-scope discoveries found during plan execution, not fixed per the deviation-rules scope boundary.

## From 30-01

- **`tests/trade-api.test.ts` — `POST /api/binder/wants` tests use the wrong request body key.** ✅ RESOLVED (post-Wave-1 test gate)
  Both `'upserts manual want'` and `'deletes manual want if quantity is 0'` sent `{ cardDefinitionId, quantity }`, but `src/app/api/binder/wants/route.ts` (unmodified by 30-01) expects `{ cardPrintingId, quantity }`. This was a pre-existing test bug, previously masked by a suite import crash (`DATABASE_URL not set`) that 30-01 incidentally fixed via `vi.mock('@/db', ...)`. Resolved by renaming the body key to `cardPrintingId` in both tests during the Wave 1 post-merge test gate (user-approved). Suite now passes 8/8.

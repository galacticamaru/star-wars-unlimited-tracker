# Deferred Items — Phase 30

Out-of-scope discoveries found during plan execution, not fixed per the deviation-rules scope boundary.

## From 30-01

- **`tests/trade-api.test.ts` — `POST /api/binder/wants` tests use the wrong request body key.**
  Both `'upserts manual want'` and `'deletes manual want if quantity is 0'` send `{ cardDefinitionId, quantity }`, but `src/app/api/binder/wants/route.ts` (unmodified by 30-01) expects `{ cardPrintingId, quantity }`. This is a pre-existing test bug, unrelated to any file 30-01 touches (`variant-trade-section.tsx`, `variant-want-section.tsx`, `src/app/api/trade/route.ts`). Discovered while adding `vi.mock('@/db', ...)` coverage for the new `/api/trade` ownership check in the same test file. Not fixed — out of scope for 30-01's `<files>` list.

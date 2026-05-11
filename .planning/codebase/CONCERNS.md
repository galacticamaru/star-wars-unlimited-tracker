# Codebase Concerns

**Analysis Date:** 2025-03-03

## Tech Debt

**Test Coverage Gaps:**
- Issue: Core components and database queries rely almost entirely on `it.todo` stubs. This provides no behavioral verification in CI and hides potential regressions in filtering logic, UI state transitions, and DB schema compatibility.
- Files: `src/db/queries/catalog.test.ts`, `src/components/catalog/card-item.browser.test.tsx`, `src/components/catalog/catalog-client.browser.test.tsx`, `src/app/decks/page.test.tsx`
- Impact: Bugs in complex UI logic (like filter combinations) or database query performance/correctness are not caught by automated tools.
- Fix approach: Implement real assertions in test stubs using Vitest and JSDOM for components, and potentially test-containers or a dedicated test DB for queries.

**Individual Database Operations in Loops:**
- Issue: Sync functions (`syncAllCards`, `syncPrices`) and deck card resolution (`getDeckCardsForUser`) perform individual database operations (insert/update/select) inside `for` loops.
- Files: `src/lib/sync/upsert-cards.ts`, `src/lib/sync/prices.ts`, `src/db/queries/decks.ts` (Step 4 of `getDeckCardsForUser`)
- Impact: Increased latency and potential connection exhaustion as the number of cards and sets grows. N+1 query patterns significantly degrade performance.
- Fix approach: Use batch operations (Drizzle `insert().values([...])`) and joined queries to resolve dependencies in a single round trip.

**Hardcoded Configuration:**
- Issue: Active sets for price synchronization are hardcoded in an array.
- Files: `src/lib/sync/prices.ts` (line 64)
- Impact: Requires code changes and redeployment every time a new set is released (approx. every 4 months).
- Fix approach: Fetch active sets from the DB or a configuration service, or derive them from the available card data.

**Naive Currency Conversion:**
- Issue: EUR prices are calculated using a static 0.92 multiplier on USD market prices.
- Files: `src/lib/sync/prices.ts` (line 51)
- Impact: Price data for European users may be significantly inaccurate due to market fluctuations and exchange rate volatility.
- Fix approach: Integrate a proper currency exchange rate API or fetch native EUR pricing from an alternate source (e.g., Cardmarket).

## Performance Bottlenecks

**Image Optimization Disabled:**
- Problem: `unoptimized: true` is set in Next.js config, disabling Vercel's automatic image resizing and format conversion.
- Files: `next.config.ts` (line 15)
- Cause: Vercel Hobby quota for image transformations was exhausted.
- Improvement path: Optimize source images if possible, or use a dedicated Image CDN (like Cloudinary or Imgix) if Vercel quotas remain a limitation. Re-enable optimization after quota reset.

**Heavy Dirty Checking in Deck Builder:**
- Problem: `JSON.stringify` is used on every state change to determine if the deck is "dirty" for unsaved change prompts.
- Files: `src/components/decks/deck-builder.tsx` (line 92)
- Cause: Quick implementation of "unsaved changes" guard.
- Improvement path: Use a more efficient comparison (e.g., comparing specific fields or using a version counter) to reduce CPU overhead during deck editing.

## Fragile Areas

**Sync Process Error Handling:**
- Files: `src/lib/sync/upsert-cards.ts`, `src/lib/sync/prices.ts`
- Why fragile: Fetch failures for individual sets are logged to console but the process continues. Partial syncs may lead to inconsistent data states (e.g., cards without prices).
- Safe modification: Implement more robust error reporting and potentially a "retry" mechanism or a way to mark sets as "partially synced".
- Test coverage: Zero coverage for error paths in sync functions.

**N+1 Queries in Want List / Collection Views:**
- Files: `src/db/queries/decks.ts`
- Why fragile: Resolving leader and base printings for every deck in a user's collection independently will scale poorly as users create more decks.
- Safe modification: Use a single query with `IN` operator to fetch all required printings at once and map them in memory.
- Test coverage: Gaps in performance-oriented testing.

## Scaling Limits

**Database Connection Management:**
- Current capacity: Neon serverless limits.
- Limit: Using individual queries in loops (N+1) exhausts the connection pool quickly under concurrent load.
- Scaling path: Move all bulk operations to batched queries. Ensure the `-pooler` connection string is strictly used in production.

## Missing Critical Features

**Production-Ready Testing:**
- Problem: The project lacks a robust automated integration testing suite.
- Blocks: Rapid iteration without fear of breaking core collection or deck-building logic.

---

*Concerns audit: 2025-03-03*

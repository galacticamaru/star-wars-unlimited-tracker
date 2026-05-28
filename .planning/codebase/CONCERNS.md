---
focus: concerns
last_updated: 2026-05-28
---

# CONCERNS

## Tech Debt

**Hardcoded active-sets list in price sync:**
- Severity: MEDIUM
- Issue: `activeSets` in `syncPrices()` is a hardcoded string array. Every new card set release requires a code change and redeploy.
- Files: `src/lib/sync/prices.ts` (line 59)
- Impact: New set prices go unsync'd until a developer manually edits and deploys. Approx. 4-month release cadence.
- Fix approach: Derive active set list from `cardPrintings.setCode` via a DB query, or read from a config table. The sets already exist in the DB after `syncAllCards` runs.

**Naive USD→EUR currency conversion:**
- Severity: MEDIUM
- Issue: EUR prices are computed as `marketPrice * 0.92`. The 0.92 rate is hardcoded and never updated.
- Files: `src/lib/sync/prices.ts` (line 51)
- Impact: EUR display values drift from true market rates. No live exchange rate source is integrated.
- Fix approach: Call a currency rate API (e.g., Frankfurter.app, fixer.io) during sync to get a current rate, or persist USD only and convert in the UI using a fetched rate.

**`Record<string, any>` dynamic update payload in deck queries:**
- Severity: LOW
- Issue: `updateDeck` in `src/db/queries/decks.ts` builds the Drizzle `.set()` payload as `Record<string, any>` (line 65), bypassing TypeScript's schema type-checking on the update columns.
- Files: `src/db/queries/decks.ts` (lines 65–76)
- Impact: A typo in a column name compiles without error but silently does nothing at runtime.
- Fix approach: Build a strongly-typed Drizzle update object matching the `decks` table's column types.

**`any` types in deck PATCH validation handler:**
- Severity: LOW
- Issue: Multiple `.map((c: any) => ...)` and `.filter((c: any) => ...)` casts in the deck PATCH route lose the request body's type information.
- Files: `src/app/api/decks/[id]/route.ts` (lines 84, 93–106)
- Impact: Runtime errors on unexpected body shapes produce 500s with no schema validation feedback.
- Fix approach: Define a `DeckCard` interface for the parsed body and validate it before use; use `zod` or manual checks.

**`any` type in CSV normalization input:**
- Severity: LOW
- Issue: `normalizeRedditCsv(rows: any[], ...)` accepts untyped PapaParse row objects. Column access is via string keys with no type guard.
- Files: `src/lib/collection/normalize.ts` (line 12)
- Impact: Silent misparse if PapaParse changes its row shape or a column is missing. Already partially mitigated by optional chaining (`row['Card #']?.toString()`).
- Fix approach: Define a `SpreadsheetRow` interface and cast at the point of use, or add explicit column-presence checks.

**`mapToFilterable` casts binder data through `any`:**
- Severity: LOW
- Issue: The public binder RSC maps raw DB rows to `CardForFilter` via `(c: any)` with several hardcoded `null` placeholders (`backArtUrl: null`, `frontText: null`, etc.).
- Files: `src/app/binder/[username]/page.tsx` (lines 24–52)
- Impact: If the DB shape changes, the cast silently passes wrong values downstream. The hardcoded nulls mean card detail fields are always empty in binder context.
- Fix approach: Derive `CardForFilter` from the exact DB query return type via Drizzle's type inference, eliminating the `any` cast.

**OAuth provider credentials fall back to `"placeholder"` strings:**
- Severity: MEDIUM
- Issue: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` all fall back to the string `"placeholder"` when the env var is absent.
- Files: `src/lib/auth.ts` (lines 23–28)
- Impact: In a misconfigured environment (missing env vars), social login attempts silently use invalid credentials rather than failing fast at startup. Better-auth may produce confusing OAuth errors at runtime.
- Fix approach: Remove the `|| "placeholder"` fallbacks. If the env var is absent at startup, throw and exit. Social providers should be conditionally registered only when credentials are present.

**Legacy data hydration block in card detail page:**
- Severity: LOW
- Issue: The card detail RSC contains a one-time migration shim that checks for users with a non-zero collection total but zero per-variant rows and silently upserts a variant count on every page load.
- Files: `src/app/cards/[set-code]/[card-number]/page.tsx` (lines 40–48)
- Impact: Adds a conditional upsert DB write on every card detail page load for affected legacy users. This was a one-time migration — it can be removed once all production users have been migrated.
- Fix approach: Run a one-time migration script against production, then remove the shim from the page.

**Duplicate filter constant definitions:**
- Severity: LOW
- Issue: `TRAIT_OPTIONS`, `KEYWORD_OPTIONS`, `RARITY_OPTIONS`, `COST_OPTIONS`, `ARENA_OPTIONS` are defined identically in two separate files.
- Files: `src/components/catalog/catalog-client.tsx` (lines 34–53), `src/components/binder/public-binder-client.tsx` (lines 24–43)
- Impact: Adding a new trait or keyword requires edits in two places. Lists are already out of sync for new sets not yet represented.
- Fix approach: Extract to a shared `src/lib/filter-constants.ts` and import from both components.

---

## Performance

**Image optimization disabled:**
- Severity: HIGH
- Problem: `unoptimized: true` in `next.config.ts` disables Vercel's automatic WebP/AVIF conversion and resizing for all card images. Cards are served as full-size PNGs.
- Files: `next.config.ts` (line 13). Comment on line 12 names the cause: "Vercel Image Transformations quota exhausted".
- Cause: The Vercel Hobby plan quota for image transformations was exhausted.
- Improvement path: Re-enable optimization after quota reset. If quota is a recurring constraint, proxy through Cloudinary or Imgix. This is the single largest loading performance gap; card images dominate payload size.

**Sequential DB writes in `upsertCards` sync loop:**
- Severity: MEDIUM
- Problem: `upsertCards` issues one `INSERT ... ON CONFLICT` per card printing inside a `for...of` loop over `variants`. For a set with 200 cards × 3 variants = 600 sequential Neon HTTP round-trips per set.
- Files: `src/lib/sync/upsert-cards.ts` (lines 144–173)
- Cause: Each variant in the group is upserted individually to obtain the `def.id` from the preceding definition upsert.
- Improvement path: Batch-collect all `cardPrintings` values across the entire set and insert in a single `.values([...])` call after all definitions are upserted. The v5 batch pattern from `src/db/queries/collection.ts` provides the template.

**Sequential per-deck leader/base resolution in `getDeckCardsForUser`:**
- Severity: MEDIUM
- Problem: `getDeckCardsForUser` calls `resolvePrinting(defId)` inside a `for...of` loop over every deck × 2 (leader + base). A user with 10 decks triggers up to 20 sequential DB queries just for leader/base art.
- Files: `src/db/queries/decks.ts` (lines 276–298)
- Cause: Each `resolvePrinting` call is a separate `await db.select()`.
- Improvement path: Collect all non-null leader/base definition IDs across all decks, fetch in a single `inArray` query, then map in memory.

**Sequential per-set price sync with artificial 1s delay:**
- Severity: LOW
- Problem: `syncPrices` iterates over 7 active sets sequentially with a 1-second sleep between each.
- Files: `src/lib/sync/prices.ts` (lines 65–104)
- Cause: Self-imposed rate limit guard with no documented API rate limit from swu-db.com.
- Improvement path: Use `Promise.allSettled` for parallel fetching. If a rate limit is confirmed, use a smaller delay or a proper rate-limiter.

**`revalidateTag` called with wrong signature:**
- Severity: MEDIUM
- Problem: `revalidateTag('cards', 'max')` is called in the cron sync route. The `revalidateTag` API takes a single string tag name; passing `'max'` as a second argument is silently ignored (it is not a valid parameter in Next.js 16).
- Files: `src/app/api/cron/sync-cards/route.ts` (line 26)
- Cause: Possible confusion with `cacheLife` options or an incorrect API reference.
- Improvement path: Call `revalidateTag('cards')` with only one argument. Verify the cache is actually being busted after sync by checking card data freshness post-sync.

---

## Security

**TOCTOU hazard on variant count + total recompute:**
- Severity: MEDIUM
- Risk: The `/api/collection/variants` route does `upsertVariantCount` then `recomputeTotal` as two sequential awaits without a transaction. A concurrent request for the same card between the two awaits produces an intermediate (stale) total in `user_collections`.
- Files: `src/app/api/collection/variants/route.ts` (lines 37–56). The hazard is documented inline as `WR-02`.
- Current mitigation: Comment documents the hazard; marked "low risk in practice for single-user collection editing."
- Recommendations: Migrate this route to use Drizzle with a WebSocket/Pool connection (which supports transactions) instead of the HTTP driver. Until then, the hazard remains accepted technical debt. Do not introduce additional callers of the sequential pattern.

**No rate limiting on collection mutation endpoints:**
- Severity: MEDIUM
- Risk: `/api/collection/variants`, `/api/collection/import`, `/api/collection/starter-deck`, `/api/trade`, `/api/binder/wants` accept unlimited authenticated requests. A malicious or buggy client can flood the DB.
- Files: All mutation routes in `src/app/api/`
- Current mitigation: `/api/collection/import` caps at `MAX_IMPORT_ITEMS = 2000`. No per-minute request rate limit exists on any route.
- Recommendations: Add Vercel edge rate limiting (via middleware) or an in-memory sliding-window counter for mutation routes. At minimum, protect `/api/collection/variants` which is called on every card count change.

**No input validation on deck name:**
- Severity: LOW
- Risk: `POST /api/decks` passes `body.name` directly to `createDeck` after only a truthy check (`if (!name)`). There is no length cap or content validation.
- Files: `src/app/api/decks/route.ts` (lines 29–34), `src/db/queries/decks.ts` (line 36)
- Current mitigation: DB schema stores `name` as `text` (unbounded length); PostgreSQL will accept arbitrarily long strings.
- Recommendations: Add a max-length check (e.g., 100 characters) and trim whitespace before insert.

**Trade quantity not validated as integer:**
- Severity: LOW
- Risk: `/api/trade` PATCH passes `Math.max(0, tradeQuantity)` without an `isFinite` or `Number.isInteger` check. A float like `1.5` is stored as-is.
- Files: `src/app/api/trade/route.ts` (line 23)
- Current mitigation: DB column is `integer`, so Neon/Drizzle will coerce or error on insert.
- Recommendations: Add `Math.floor()` and `Number.isFinite()` validation matching the pattern in `/api/collection/variants/route.ts` (lines 33–35).

**`cardPrintingId` not validated as positive integer in binder/wants routes:**
- Severity: LOW
- Risk: Both `POST /api/binder/wants` and `DELETE /api/binder/wants` accept `cardPrintingId` from the request body/query string without type or range validation (only a presence check).
- Files: `src/app/api/binder/wants/route.ts` (lines 16–17, 43)
- Current mitigation: Drizzle enforces integer type at the DB layer; a non-integer string would cause a query error caught by the try/catch.
- Recommendations: Add `typeof cardPrintingId !== 'number'` and `Number.isFinite(cardPrintingId)` guards matching the pattern in `/api/collection/variants/route.ts`.

---

## Architecture

**Dual denormalized totals — `userCollections.count` vs sum of `userPrintingCollections`:**
- Severity: MEDIUM
- Issue: Two tables track the same data: `user_collections.count` holds a pre-aggregated total, while `user_printing_collections` holds per-variant counts. `recomputeTotal` / `batchRecomputeTotals` must be called after every variant mutation to keep them in sync. These are currently sequential awaits (no transaction) over the HTTP driver.
- Files: `src/db/schema.ts` (lines 117–147), `src/db/queries/collection.ts` (lines 261–394)
- Impact: Any code path that mutates `user_printing_collections` without calling `recomputeTotal` leaves `user_collections` stale. This has already caused the `WR-02` race condition.
- Fix approach: Long-term: remove `user_collections.count` and always derive totals from `user_printing_collections` on read (with a DB view or aggregating query). Near-term: use a Neon WebSocket/Pool connection for transactions in mutation routes.

**Public binder page loads all cards for `getFilterOptions` on every render:**
- Severity: LOW
- Issue: `PublicBinderPage` calls `getFilterOptions()` (a cached DB query) alongside `getPublicBinderData()`. The filter options are used to populate sidebar dropdowns even when the binder may contain only a handful of cards.
- Files: `src/app/binder/[username]/page.tsx` (lines 19–22)
- Impact: Minor — `getFilterOptions` is cached via `cacheTag('cards')`. No immediate perf concern, but the binder sidebar shows the full global set/type filter lists rather than filtering to the binder owner's card sets.
- Fix approach: Derive filter options from the binder cards client-side (as `catalog-client.tsx` does for `aspectOptions`) to show only relevant filter values.

**`getDeckCardsForUser` loads all decks then resolves leaders/bases serially:**
- Severity: MEDIUM
- Issue: Step 4 of `getDeckCardsForUser` calls `resolvePrinting(defId)` in a `for...of` loop over `[leaderCardDefinitionId, baseCardDefinitionId]` for every deck. With N decks, this is up to 2N sequential awaits.
- Files: `src/db/queries/decks.ts` (lines 276–298)
- Impact: The `/api/want-list` endpoint (used by Want List tab in deck builder) is slow for users with many decks.
- Fix approach: Collect all unique leader/base definition IDs, run a single `inArray` query, then map results in memory (same pattern as `batchRecomputeTotals`).

**`getUserTradeData` and `getPublicBinderData` duplicate auto-wants logic:**
- Severity: LOW
- Issue: The 6-step auto-wants shortfall computation (fetch decks → build autoTargetMap → fetch inventory → compute shortfall → fetch card names) is implemented almost identically in both `src/db/queries/trade.ts` (lines 55–174) and `src/db/queries/binder.ts` (lines 96–222).
- Files: `src/db/queries/trade.ts`, `src/db/queries/binder.ts`
- Impact: Bug fixes or logic changes must be applied to both. The implementations are already slightly divergent (e.g., `trade.ts` returns `isExcluded` flag; `binder.ts` filters out excluded items).
- Fix approach: Extract a shared `computeAutoWants(userId)` helper in `src/lib/binder-logic.ts` or `src/db/queries/auto-wants.ts` and call it from both query modules.

---

## Missing Coverage

**No error boundary components:**
- Severity: MEDIUM
- What's missing: Zero `error.tsx` files in any route segment. No React error boundary wraps the catalog grid, deck builder, or binder pages.
- Files: Entire `src/app/` tree (checked — no `error.tsx` files found)
- Risk: An unhandled client-side throw (e.g., from a bad API response, failed image load handler, or filter logic error) will crash the entire page to a white screen with no recovery UI.
- Priority: HIGH for the catalog and deck builder pages, which have the most client-side state.

**`it.todo` stubs in browser/integration tests:**
- Severity: MEDIUM
- What's not tested: `src/components/catalog/card-item.browser.test.tsx` and `src/components/catalog/catalog-client.browser.test.tsx` — behavior tests for the most-used interactive components.
- Files: `src/components/catalog/card-item.browser.test.tsx`, `src/components/catalog/catalog-client.browser.test.tsx`
- Risk: Regressions in card image loading, count increment/decrement, and filter interaction go undetected until manual testing.
- Priority: MEDIUM

**No test coverage for sync error paths:**
- Severity: MEDIUM
- What's not tested: `syncAllCards` and `syncPrices` error handling (fetch failures, partial set failures, malformed API responses).
- Files: `src/lib/sync/upsert-cards.ts`, `src/lib/sync/prices.ts`
- Risk: A swu-db.com API change or outage could silently corrupt or freeze the card database with no automated detection.
- Priority: MEDIUM

**No test for the `/api/binder` route or `getUserTradeData`:**
- Severity: LOW
- What's not tested: The trade data assembly query (auto-wants shortfall computation, 6 sequential queries per call) has no unit or integration test.
- Files: `src/db/queries/trade.ts`, `src/app/api/binder/route.ts`
- Risk: Shortfall calculation bugs (e.g., off-by-one in `calculateLookingFor`, or incorrect max-across-decks aggregation) are only caught manually.
- Priority: LOW

**No test for the `/api/collection/import` route chunking logic:**
- Severity: LOW
- What's not tested: The 500-item chunk loop in `POST /api/collection/import` and the `OR` condition simulation for multi-column lookup. The chunking path is never exercised in tests.
- Files: `src/app/api/collection/import/route.ts` (lines 54–88)
- Risk: An off-by-one or incorrect `or(...conditions)` spread could silently drop items in imports over 500 cards.
- Priority: LOW

---

*Concerns audit: 2026-05-28*

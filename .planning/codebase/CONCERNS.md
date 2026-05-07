# Codebase Concerns

**Analysis Date:** 2026-05-08

---

## Tech Debt

### Hardcoded userId=1 throughout the application

**Issue:** Every user-scoped database call passes `userId = 1` as a literal or default parameter. This is an intentional v1 single-user shortcut (documented as decision D-04) but it is baked into multiple layers and must be removed before v2 auth ships.

**Files:**
- `src/app/api/collection/route.ts` — lines 6 and 30: `getUserCollection(1)`, `upsertCardCount(cardDefinitionId, count, 1)`
- `src/app/api/collection/import/route.ts` — line 36: `const userId = 1; // D-04: Hardcoded for v1`
- `src/app/api/decks/route.ts` — lines 6 and 23: `getDecks(1)`, `createDeck(name, 1)`
- `src/app/api/want-list/route.ts` — lines 7–8: `getDeckCardsForUser(1)`, `getUserCollection(1)`
- `src/app/api/decks/[id]/export/route.ts` — line 26 comment: `// we assume userId 1 for everyone`
- `src/db/queries/collection.ts` — lines 5 and 15: default parameter `userId: number = 1`
- `src/db/queries/decks.ts` — lines 5, 32, 167: default parameters `userId: number = 1`
- `src/db/schema.ts` — lines 65 and 80: column default `default(1)` on `user_collections.userId` and `decks.userId`

**Impact:** Adding real authentication without removing all these defaults risks silently falling back to userId=1, corrupting another user's data. The DB column defaults are especially dangerous — a missing `userId` on insert goes unnoticed at the ORM level.

**Fix approach (Phase 6):** Remove all `= 1` defaults; extract authenticated `userId` from the session at route level; pass it explicitly into every query function; update schema column defaults to have no default (require explicit insert).

---

### No users table in schema

**Issue:** `user_collections` and `decks` reference a `user_id` integer column, but no `users` table exists. The FK relationship is implied but not enforced by the database.

**Files:**
- `src/db/schema.ts` — `userCollections` and `decks` tables reference `userId` with no FK to any users table
- `drizzle/0000_handy_trish_tilby.sql` — confirms no `users` table in the migration

**Impact:** When Phase 6 introduces a real auth system, migrating the existing `userId = 1` rows to a real user record will require a custom migration. Schema cannot enforce referential integrity on user rows today.

**Fix approach:** As part of Phase 6, add a `users` table and add a FK from `user_collections.user_id` and `decks.user_id` to `users.id`.

---

### Bulk import performs one SQL INSERT per card row (sequential loop)

**Issue:** `src/app/api/collection/import/route.ts` (lines 39–59) iterates over every card in the uploaded CSV and issues one individual `db.insert().onConflictDoUpdate()` per card inside a `for...of` loop. For a full set (~250 cards), this generates ~250 sequential round-trips to Neon.

**Files:**
- `src/app/api/collection/import/route.ts` — lines 39–59

**Impact:** Import for large sets is slow (~5–15 seconds depending on Neon cold-start and network). Vercel Hobby serverless functions have a 10-second execution limit for regular routes; a slow import could timeout. Also noted that the comment on line 35 says "neon-http driver does not support transactions" — this is not the transport in use (the project uses `neon-serverless` with WebSocket pooling via `src/db/index.ts`), so a batched insert or transaction is actually feasible.

**Fix approach:** Replace the per-row loop with a single batch `db.insert().values([...allRows]).onConflictDoUpdate(...)`. The WebSocket pooling transport supports this without any driver change.

---

### Card sync issues N+1 DB queries per card variant

**Issue:** `src/lib/sync/upsert-cards.ts` processes variant cards (Foil, Hyperspace) in a `for...of` loop (lines 161–269). For each variant card, it executes one SELECT to look up the existing `card_definitions` row, then one INSERT/UPSERT into `card_printings`. With hundreds of variant cards per set, this is hundreds of sequential DB round-trips.

**Files:**
- `src/lib/sync/upsert-cards.ts` — lines 161–269

**Impact:** The cron sync is already constrained to once per day on Vercel Hobby. With multiple sets, each containing normal + variant passes, the sync can take minutes. Neon cold-start latency per query compounds this.

**Fix approach:** Collect all variant card look-up keys (set+name+subtitle) and issue a single bulk SELECT; build an in-memory map; then batch-insert all `card_printings` in one statement.

---

### `getDeckCardsForUser` has N+1 DB queries for leader/base resolution

**Issue:** `src/db/queries/decks.ts` function `getDeckCardsForUser` (lines 207–251) calls `resolvePrinting(defId)` — a DB query — for every leader and base of every deck, inside a `for...of` loop. With N decks each having a leader and base, this is up to 2N sequential DB queries.

**Files:**
- `src/db/queries/decks.ts` — lines 207–251 (`resolvePrinting` helper and the loop at lines 233–250)

**Impact:** The `/api/want-list` endpoint calls this function on every page load for the Decks page. With 10 decks, this is 20 extra DB round-trips that could easily be eliminated.

**Fix approach:** Collect all unique `leaderCardDefinitionId` and `baseCardDefinitionId` values; issue one `inArray` query; build an in-memory map; replace the per-deck `resolvePrinting` call.

---

### Hardcoded trait and keyword lists in client component

**Issue:** `src/components/catalog/catalog-client.tsx` (lines 27–43) contains hardcoded string arrays for `KEYWORD_OPTIONS` and `TRAIT_OPTIONS`. When new sets introduce new traits or keywords, these lists must be manually updated.

**Files:**
- `src/components/catalog/catalog-client.tsx` — lines 27–43

**Impact:** New set content (e.g., TWI set traits) will silently be missing from the filter UI until a developer notices and updates these arrays. The `ASPECT_OPTIONS` are correctly derived dynamically from the card data, but keywords and traits are not.

**Fix approach:** Add `keywords` and `traits` to the `getFilterOptions()` query in `src/db/queries/catalog.ts`, derive them server-side, and pass them into `CatalogClient` as props alongside `sets` and `types`.

---

## Security Considerations

### All collection and deck API routes are unauthenticated

**Risk:** Every route under `src/app/api/` (except the cron endpoint) accepts requests with no authentication check. Any anonymous caller can read or write any user's collection, create/delete decks, or trigger bulk imports.

**Files:**
- `src/app/api/collection/route.ts` — GET (read collection) and POST (update count): no auth guard
- `src/app/api/collection/import/route.ts` — POST (bulk import): no auth guard
- `src/app/api/collection/sets/route.ts` — GET: no auth guard (low risk; read-only catalog data)
- `src/app/api/decks/route.ts` — GET and POST: no auth guard
- `src/app/api/decks/[id]/route.ts` — GET, PATCH, DELETE: no auth guard; no ownership check on deckId
- `src/app/api/decks/[id]/export/route.ts` — GET: no auth guard; the comment on line 25 acknowledges this explicitly
- `src/app/api/want-list/route.ts` — GET: no auth guard

**Current mitigation:** The single-user v1 design means all data belongs to userId=1, so there is no multi-user data to cross-contaminate. This is intentional and low-risk in production until Phase 6 ships.

**Recommendations for Phase 6:** Add session-based auth middleware at route level before all write operations. The deck DELETE endpoint (`src/app/api/decks/[id]/route.ts` line 110–128) is most critical — it performs no ownership check, meaning any caller with a valid deck ID can delete it.

---

### Cron endpoint uses a shared secret but secret is not required to be set

**Risk:** The cron guard in `src/app/api/cron/sync-cards/route.ts` correctly rejects requests when `CRON_SECRET` is unset (line 9: `if (!cronSecret || ...)`). However, if the env var is accidentally deleted from the Vercel project config, the check fails closed (returns 401), not open — this is correct behavior. The risk is that `CRON_SECRET` is not validated as a minimum-length secret and any non-empty string passes.

**Files:**
- `src/app/api/cron/sync-cards/route.ts` — lines 5–11

**Current mitigation:** The guard is correct and does not allow empty-string bypass. Risk is low.

**Recommendations:** Document the minimum length/entropy requirement for `CRON_SECRET` in the deployment runbook.

---

### No input validation on POST body fields beyond type coercion

**Risk:** API routes validate presence of required fields (e.g., `cardDefinitionId`, `count`, `name`) but do not validate ranges or types beyond implicit casting. For example, `count` in `src/app/api/collection/route.ts` line 27 could be a negative number, a string, or `Infinity` — all of which would be written directly to the database.

**Files:**
- `src/app/api/collection/route.ts` — lines 22–36: `count` is used without range or type check
- `src/app/api/decks/route.ts` — lines 14–29: `name` length is not bounded

**Impact:** Malformed data could reach the database. In v1 (single user, no auth), self-inflicted only.

**Fix approach:** Add a lightweight validation layer (e.g., Zod) at route entry before touching the database. Enforce `count >= 0`, `count <= 99`, and `name.length <= 100`.

---

## Performance Bottlenecks

### Full card catalog fetched on every page render

**Issue:** `src/app/page.tsx` calls `getAllCards()` on every request (the page is `force-dynamic`). With `getAllCards()` in `src/db/queries/catalog.ts` fetching every column of every card definition + printing via a JOIN, this is a large result set hitting Neon on every navigation to the catalog.

**Files:**
- `src/app/page.tsx` — line 4: `export const dynamic = 'force-dynamic'`; lines 7–8: `getAllCards()` + `getFilterOptions()`
- `src/db/queries/catalog.ts` — `getAllCards()` function

**Impact:** Cold-start latency on Neon (scale-to-zero) adds 200–500ms to every catalog page load. As the catalog grows with new sets, the payload transferred from DB to server to client grows proportionally. The full card list is passed as a React Server Component prop to `CatalogClient`, serialized as JSON in the HTML.

**Fix approach:** Add ISR caching (`revalidate`) to the catalog page. Card data changes only when the daily sync runs, so a revalidation window of 1 hour or longer is safe. Alternatively, cache `getAllCards()` in Neon or at the Vercel Edge.

---

### Deck builder page fetches entire card catalog on every load

**Issue:** `src/app/decks/[id]/page.tsx` (line 12) calls `getAllCards()` inside `Promise.all`, loading the full card catalog for every deck builder page load. This is the same concern as the catalog page but occurs on a page that is already slow due to fetching the deck data.

**Files:**
- `src/app/decks/[id]/page.tsx` — lines 12–16

**Impact:** Every deck builder load incurs a full catalog DB query. Adding ISR or a cached response for the card catalog would benefit this route automatically.

---

### Image optimization disabled globally

**Issue:** `next.config.ts` sets `unoptimized: true` (line 15), disabling Vercel Image Optimization for all images site-wide. This was necessary because the Vercel Hobby image transformation quota was exhausted (per the comment: "TODO(2026-06-04)"). The `unoptimized` flag means card images are served at their full CDN resolution with no resizing or format conversion.

**Files:**
- `next.config.ts` — line 15: `unoptimized: true`

**Impact:** Users on mobile or slower connections load full-resolution card images (~100–300KB each) instead of WebP-optimized thumbnails. The card grid can show 50–100+ cards simultaneously. No automatic lazy sizing.

**Fix approach:** On or after 2026-06-04 (when quota renews per the comment), remove `unoptimized: true`. If the quota exhausts again, investigate switching to a third-party image optimization provider (Cloudflare Images or imgix) to avoid Vercel's transformation limits.

---

## Fragile Areas

### Vercel Hobby cron: single job per day, no retry on failure

**What makes it fragile:** Vercel Hobby allows exactly one cron job. The single job (`/api/cron/sync-cards`, scheduled `0 6 * * *`) must complete the full sync of all sets within the serverless function timeout. If the swu-db.com API is down or returns errors for any set, that set is skipped silently (`continue` at line 299 of `src/lib/sync/upsert-cards.ts`) and will not be retried until the next day.

**Files:**
- `vercel.json` — the single cron definition
- `src/lib/sync/upsert-cards.ts` — `syncAllCards()` lines 295–305 (per-set `continue` on error)
- `src/app/api/cron/sync-cards/route.ts` — no retry logic

**Impact:** A partial sync failure silently leaves the card database stale for 24 hours. There is no alerting mechanism.

**Safe modification:** The cron endpoint itself is well-guarded with `CRON_SECRET`. Do not add additional cron jobs without upgrading from Vercel Hobby. For resilience, consider writing a sync_status table row with the result of each run so failures are observable.

---

### `getDeckWithCards` does not verify deck ownership before returning

**What makes it fragile:** `src/db/queries/decks.ts` `getDeckWithCards(deckId)` (lines 13–30) returns full deck data for any valid integer deckId without checking userId. The API routes that call it (`src/app/api/decks/[id]/route.ts` GET and PATCH, `src/app/api/decks/[id]/export/route.ts`) also perform no ownership verification.

**Files:**
- `src/db/queries/decks.ts` — `getDeckWithCards`, lines 13–30
- `src/app/api/decks/[id]/route.ts` — GET handler (lines 4–28), PATCH handler (lines 30–108), DELETE handler (lines 110–128)
- `src/app/api/decks/[id]/export/route.ts` — GET handler

**Why fragile:** In v1 (single user) this is harmless. In v2 after Phase 6, the first line of defense against cross-user data access must be added here. Because the query and route layer both lack ownership checks, the fix requires changes in two places — easy to miss one.

**Safe modification:** When implementing Phase 6, add `userId` as a required parameter to `getDeckWithCards` and filter by both `decks.id` and `decks.userId` in a single query. This eliminates the information disclosure risk at the data layer, not just the route layer.

---

### `@ts-ignore` suppresses type error on `preload` prop

**What makes it fragile:** `src/components/catalog/card-image-section.tsx` line 75 uses `// @ts-ignore` to suppress a TypeScript error on a non-standard `preload` prop passed to `next/image`. This suppresses the error without validating that the prop has any effect.

**Files:**
- `src/components/catalog/card-image-section.tsx` — lines 74–77

**Why fragile:** If the Next.js `Image` component API changes and the prop is removed or renamed, the suppression will hide the breakage. The actual behavior of `preload={true}` on `next/image` is undocumented for this version.

**Safe modification:** Remove the prop and the `@ts-ignore` comment. If eager loading is genuinely needed, use the documented `priority` prop instead.

---

### Rarity filter mapping is fragile string manipulation

**What makes it fragile:** `src/lib/filter-cards.ts` lines 82–84 normalize rarity filter values by splitting on a space: `r.split(' ')[1]`. This assumes the UI format is always `"(X) RarityName"` with exactly one space before the rarity name. If the format is ever changed in `catalog-client.tsx`, the filter silently stops matching any cards.

**Files:**
- `src/lib/filter-cards.ts` — lines 80–85
- `src/components/catalog/catalog-client.tsx` — line 24: `RARITY_OPTIONS` array definition

**Safe modification:** Replace the string-split mapping with a shared constant map (e.g., `{ "(C) Common": "Common", ... }`) imported by both files.

---

## Missing Critical Features

### No database indexes on foreign key and query columns

**Problem:** The migration file (`drizzle/0000_handy_trish_tilby.sql`) creates no indexes beyond the primary keys and unique constraints. Foreign key columns and columns used in WHERE clauses are not indexed.

**Files:**
- `drizzle/0000_handy_trish_tilby.sql` — no `CREATE INDEX` statements

**Blocks:** As row counts grow (collection, deck_cards), queries filtering on `user_id`, `card_definition_id`, `deck_id`, and `variant_type` will degrade.

**Recommended indexes:**
- `user_collections(user_id)` — used in every collection query
- `decks(user_id)` — used in every deck list query
- `deck_cards(deck_id)` — used in every deck detail/export query
- `card_printings(card_definition_id)` — used in joins across the catalog
- `card_printings(variant_type)` — used in `WHERE variant_type = 'Normal'` on nearly every query

---

### No error tracking or observability

**Problem:** All API errors are written to `console.error`, which appears in Vercel function logs but is not aggregated, alerted, or retained. There is no error rate monitoring, no alerting on cron sync failure, and no structured logging.

**Files:**
- All `src/app/api/*/route.ts` files — `console.error(...)` is the only error capture

**Blocks:** In v2 with real users, silent errors (failed imports, failed syncs) will go unnoticed until a user reports them.

**Fix approach:** Add Sentry (free tier) or Vercel's built-in error tracking as part of the Phase 6 work. At minimum, log structured JSON to stdout so Vercel log drains can consume them.

---

## Test Coverage Gaps

### API routes have no tests

**What's not tested:** Every `src/app/api/*/route.ts` handler has no automated test. The authentication guard in `src/app/api/cron/sync-cards/route.ts` (critical security path) is not covered.

**Files:**
- `src/app/api/collection/route.ts`
- `src/app/api/collection/import/route.ts`
- `src/app/api/decks/route.ts`
- `src/app/api/decks/[id]/route.ts`
- `src/app/api/decks/[id]/export/route.ts`
- `src/app/api/want-list/route.ts`
- `src/app/api/cron/sync-cards/route.ts`

**Risk:** Route-level bugs (e.g., the PATCH handler's conditional validation logic in `decks/[id]/route.ts`) can regress silently.

**Priority:** High — especially the cron auth guard and the deck PATCH validation path.

---

### `getDeckCardsForUser` and `getDeckWithCards` have no tests

**What's not tested:** The N+1 query logic for resolving leader/base printings in `getDeckCardsForUser` and the deck-loading path in `getDeckWithCards` have no unit or integration tests.

**Files:**
- `src/db/queries/decks.ts`

**Risk:** The leader/base synthetic row generation (lines 230–251) is the most complex logic in the queries layer and is untested. A regression here breaks the want list computation silently.

**Priority:** Medium.

---

*Concerns audit: 2026-05-08*

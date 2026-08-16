<!-- refreshed: 2026-07-05 -->
# Codebase Concerns

**Analysis Date:** 2026-07-05

## Tech Debt

### Large Complex Components

**Deck Builder State Management:**
- **Issue**: `deck-builder.tsx` (742 lines) contains complex reducer logic with 6+ action types and nested state mutations
- **Files**: `src/components/decks/deck-builder.tsx`
- **Impact**: Difficult to reason about state transitions, hard to test individual branches, high risk of regression when modifying card move/update logic
- **Fix approach**: Refactor into smaller hooks (`useDeckCards`, `useDeckLeaderBase`) with isolated state; extract reducer to separate file with unit tests for each action type

**Card Grid & Item Display:**
- **Issue**: `card-item.tsx` (290 lines) and `card-grid.tsx` (268 lines) are large components mixing variant logic, trade state, and filtering
- **Files**: `src/components/catalog/card-item.tsx`, `src/components/catalog/card-grid.tsx`
- **Impact**: Difficult to modify variant display logic; changes to trade UI require touching grid logic
- **Fix approach**: Extract variant-display logic into `<VariantBadge>` and `<VariantPriceDisplay>` sub-components; separate trade UI into `<TradeSection>` component

### Type Safety Issues

**Loose `any` Type Usage:**
- **Issue**: Multiple uses of `any` type avoiding TypeScript strictness
- **Files**: 
  - `src/app/binder/[username]/page.tsx:24` — `mapToFilterable` param typed as `any`
  - `src/app/api/decks/[id]/route.ts:85, 90, 91, 94-107` — card objects typed as `any` in validation
  - `src/app/(auth)/login/page.tsx:29, 47, 62` — caught errors typed as `any`
  - Test files: `src/components/home/hero-section.test.tsx`, `src/components/catalog/card-item.test.tsx` use `any` in mocks
- **Impact**: TypeScript does not catch potential property access errors; refactoring is risky
- **Fix approach**: Create proper types for all card and error objects; use strict mode in `tsconfig.json`; update test mocks to use typed generics instead of `any`

**Type Assertions with Unsafe Casts:**
- **Issue**: `as unknown as Date` casting in test files bypasses type safety
- **Files**: `src/app/decks/page.test.tsx:36, 83`
- **Impact**: Tests don't validate actual data shapes used by components
- **Fix approach**: Mock `toISOString()` on Date objects; avoid `unknown` cast by creating proper Date instances

### Error Response Inconsistency

**Mixed Error Response Formats:**
- **Issue**: API endpoints return plain text errors instead of JSON, breaking API client error handling
- **Files**: Most of `src/app/api/*/route.ts` files use `new Response('Error message', { status: 400 })`
- **Examples**:
  - `src/app/api/collection/route.ts:10` returns `'Unauthorized'` (text/plain)
  - `src/app/api/binder/route.ts:12` returns `new NextResponse("Unauthorized")` (correct JSON)
- **Impact**: Client error handling expecting `res.json()` will fail when catching errors; inconsistent error shapes make debugging harder
- **Fix approach**: Create helper `apiError(status, message)` that returns JSON; use throughout all API routes with consistent `{ error: string }` shape

## Test Coverage Gaps

**API Routes Lack Tests:**
- **Issue**: 17 API route files exist but only 2 have explicit tests; most business logic endpoints untested
- **Files**: 
  - Tested: `src/app/api/collection/collection-shape.test.ts`
  - Untested: `src/app/api/decks/[id]/route.ts`, `src/app/api/binder/wants/route.ts`, `src/app/api/trade/route.ts`, `src/app/api/want-list/route.ts`, and 12 others
- **Impact**: Silent failures possible in deck updates, collection mutations, binder changes; regression risk on refactoring
- **Fix approach**: Add integration tests for critical endpoints: POST `/api/decks`, PATCH `/api/decks/[id]`, POST `/api/collection/variants`, POST `/api/binder/wants`; mock database layer; test auth and authorization checks

**Database Query Modules Partially Tested:**
- **Issue**: Some query files have no tests; complex multi-table queries are not integration-tested
- **Files**:
  - Tested: `src/db/queries/collection.test.ts`, `src/db/queries/catalog.test.ts`, `src/db/queries/decks.test.ts`
  - Untested: `src/db/queries/binder.ts`, `src/db/queries/trade.ts`, `src/db/queries/card-detail.ts`
- **Impact**: Complex queries like `getPublicBinderData()` (multi-table join) may silently return wrong shape if refactored
- **Fix approach**: Add integration tests for `binder.ts` (test public/private filtering), `trade.ts` (test variant trade quantity logic), `card-detail.ts` (test variant precedence)

**UI Components Mostly Untested:**
- **Issue**: Large interactive components have no unit tests
- **Files**: 
  - `src/components/decks/deck-builder.tsx` — no tests
  - `src/components/decks/deck-sidebar.tsx` (220 lines) — no tests
  - `src/components/binder/manage-wants-list.tsx` (212 lines) — no tests
  - `src/components/catalog/sidebar-filters.tsx` (208 lines) — no tests
- **Impact**: Deck builder refactoring is risky; filter behavior changes are not caught; modal/sheet state bugs may go unnoticed
- **Fix approach**: Add tests for `DeckBuilder` reducer actions; test `SidebarFilters` query string updates with `nuqs`; test `ManageWantsList` CRUD operations

## Client-Side Auth Issues

**Unprotected Route with Client-Side Auth Check:**
- **Issue**: `/binder/manage` is not listed in `proxy.ts` matcher, relies only on client-side `authClient.useSession()` check
- **Files**: 
  - Route: `src/app/binder/manage/page.tsx` (client component)
  - Middleware: `src/proxy.ts:8` (only protects `/collection`, `/decks`)
- **Impact**: Page briefly renders before auth check completes; data loads via API which does auth-check, but page is visible to unauthenticated users for a moment; poor UX on page refresh while logged out
- **Fix approach**: Add `/binder/manage/:path*` to `proxy.ts` matcher to server-side redirect unauthenticated users; wrap page content in `<Suspense>` with loading boundary

## Security Concerns

**OAuth Placeholder Credentials in Code:**
- **Issue**: Fallback credentials "placeholder" for Google and Discord OAuth if env vars missing
- **Files**: `src/lib/auth.ts:23-28`
- **Impact**: Non-fatal (will fail auth attempt, not leak credentials) but poor security practice; could confuse developers
- **Fix approach**: Throw error in auth.ts if secrets not set; validate env vars at startup rather than fallback to placeholders

**No Rate Limiting on API Endpoints:**
- **Issue**: All endpoints accept unlimited requests; collection import accepts up to 1000 items per request
- **Files**: All `src/app/api/*/route.ts` files; `src/app/api/collection/import/route.ts:48` allows MAX_IMPORT_ITEMS
- **Impact**: Possible DOS attack; malicious user could spam collection updates, deck mutations, or trade offers
- **Fix approach**: Add rate limiting middleware (Vercel Rate Limiting or custom Redis-backed); implement per-user request quotas

## Known Issues from Roadmap

### DEBT-02: Deck Builder Missing Variant Art

- **Issue**: DeckBuilder "Add Cards" tab does not display variant art for cards (e.g., Showcase, Foil versions)
- **Files**: `src/components/decks/deck-builder.tsx` (cards shown with fallback art, no variant selector)
- **Impact**: Users building decks cannot see what variant they're adding; mismatches their owned variant
- **Fix approach**: Implement `getPrintingArtMap()` call to fetch per-printing variant art; render variant chips in card selector with images

### DEBT-05: LAW Spotlight Deck Collector-Number Verification — CLOSED (Phase 34)

- **Status**: Closed in Phase 34 (verify-and-close; disproven-cause finding, no data correction required)
- **Issue**: Commit `8ca6265` introduced nine `LAW-???` placeholders across the two LAW spotlight decks (`law-jabba-the-hutt`, `law-leia-organa`). Commit `eeb1b6b` filled them in during an unverified pass that also rewrote fourteen other decks, without confirming the substituted collector numbers actually resolved against the catalog. The originally recorded cause — cards absent from the database — was disproven: LAW has been fully synced since 2026-07-05 (901 of 901 printings confirmed against the swu-db API). The real risk was an unverified name/subtitle **match**, not missing data.
- **Files**: `src/data/starter-decks.ts` — `law-jabba-the-hutt` and `law-leia-organa` deck entries
- **Impact**: An unverified collector-number substitution could silently add the wrong card to a user's collection via quick-add, with no test to catch it.
- **Fix approach**: Phase 34 built a committed, DB-backed Vitest test (`__tests__/starter-decks-resolve.test.ts`) that resolves every collector number in every deck in `starterDecks[]` — not just the two LAW decks — against `card_printings`, applying the identical `variantType = 'Normal'` filter the quick-add route uses. Run against the live catalog, it reported zero unresolved pairs: both LAW spotlight decks' collector numbers already resolve correctly, so no correction to `starter-decks.ts` was needed. The test is now a permanent regression guard against future hand-edited decks.

### MOBILE-01/02: Deck Builder Not Mobile-Friendly

- **Issue**: Sidebar stats panel overlaps card list on mobile; three-tab layout breaks on small screens
- **Files**: `src/components/decks/deck-builder.tsx`, `src/components/decks/deck-sidebar.tsx`
- **Impact**: Mobile users cannot tap cards to add/remove; poor usability on phones
- **Fix approach**: Implement responsive layout: stack sidebar below on mobile (<768px); hide sidebar on "Add Cards" tab until card selected; use sheet/modal for stats on mobile

### PERF-07/08: /decks and /decks/[id] Page Load Performance

- **Issue**: Pages have worse LCP/TTFB than catalog (Phase 29 improvements not applied)
- **Files**: `src/app/decks/page.tsx`, `src/app/decks/[id]/page.tsx`
- **Impact**: Users experience slow page loads when switching between decks and catalog
- **Fix approach**: Apply Phase 29 optimizations (getDecks/getDeckWithCards caching on `decks` tag, loading skeleton, priority image hints); measure before/after with Vercel Speed Insights

## Performance Bottlenecks

### Console Logging in Production

- **Issue**: `console.error`, `console.log`, `console.warn` statements throughout codebase; no structured logging
- **Files**: Found in 29 locations across API routes, pages, and components
- **Impact**: Logs are visible in browser DevTools; no production observability; errors silently logged with no alerting
- **Fix approach**: Replace console calls with structured logger (Winston, Pino, or Vercel's log integration); send errors to Sentry or similar error tracking service

### External API Sync Without Timeouts or Retries

- **Issue**: `syncAllCards()` and `syncPrices()` fetch from swu-db.com and PokéWallet without timeout or retry logic
- **Files**: `src/lib/sync/upsert-cards.ts`, `src/lib/sync/prices.ts`
- **Impact**: If external API is slow, cron job hangs or times out silently; card data may not update for days; users see stale prices
- **Fix approach**: Add fetch timeout (5s), exponential backoff retry (3 attempts), and explicit error return in sync job with logged failure reason

## Fragile Areas

### Complex Deck Validation & Shortfall Logic

- **Issue**: `validateDeck()` has multiple hardcoded rules (1 leader, 1 base, 50-card main, 10-card sideboard); shortfall logic mixes deck-driven wants and manual wants
- **Files**: `src/lib/deck-validation.ts` (159 lines), `src/lib/want-list.ts`
- **Impact**: Hard to add new deck formats (e.g., "Sealed" variant); "Manual Wants" vs. auto-wants logic is confusing
- **Fix approach**: Extract validation rules into config object (e.g., `DeckFormat.CONSTRUCTED = { leader: 1, base: 1, mainDeck: 50, sideboard: 10 }`); clarify in comments that manual wants override auto-wants, not supplement them

### Variant Selection Logic

- **Issue**: Multiple variant precedence definitions exist; not all file edits update them consistently
- **Files**: 
  - `src/lib/catalog/select-best-variant.ts:8-23` — VARIANT_PRECEDENCE (defines priority)
  - `src/components/catalog/variant-filter.tsx:11` — VARIANT_OPTIONS (UI list)
  - `src/db/schema.ts:104` — comment lists all types
- **Impact**: New variant (e.g., "Prestige Foil" or "Serialized") could be missed in one file, leading to inconsistent display or filtering
- **Fix approach**: Define single source of truth in `src/lib/variants.ts` with `VARIANT_TYPES`, `VARIANT_PRECEDENCE`, and `VARIANT_OPTIONS` all imported from there; add compile-time check that all variant types in database schema exist in `VARIANT_PRECEDENCE`

### User Data Deletion & Cascade

- **Issue**: No documented cascade delete behavior; deleting a user may leave orphaned records
- **Files**: `src/db/schema.ts` — foreign keys defined but cascade rules not visible
- **Impact**: If user is deleted, their decks, collections, and trade offers may remain in database consuming storage and confusing queries
- **Fix approach**: Add explicit `.onDelete('cascade')` to all user-scoped foreign keys; write integration test that deletes a user and asserts all child records are removed

## Scaling Limits

### Vercel Hobby Tier: 1 Cron Job Per Day

- **Issue**: Both card sync AND price sync run in single `/api/cron/sync-cards` endpoint due to Vercel Hobby limit
- **Files**: `src/app/api/cron/sync-cards/route.ts:19-23` (sequential execution)
- **Impact**: If card sync takes >5 min (rate limits), price sync won't run that day; prices become stale
- **Fix approach**: Move to paid tier (Pro) if cron frequency needed; or split into two separate jobs with scheduling; or implement client-triggered sync on specific pages

### Database Connection Pooling

- **Issue**: Neon HTTP pooled connections require `process.exit(0)` in scripts or they hang
- **Files**: `scripts/seed.ts`, sync scripts use Neon HTTP driver
- **Impact**: Scripts may hang indefinitely if exit not called; CI/CD pipelines timeout
- **Fix approach**: Add `process.exit(0)` to all seed/sync scripts; document in LEARNINGS.md

## Missing Critical Features

### Missing Variant Support in Places

- **Issue**: DeckBuilder doesn't show variant selection; card detail shows variants but deck builder doesn't track which variant was added
- **Files**: `src/components/decks/deck-builder.tsx`, `src/db/schema.ts` (deck_cards only stores cardDefinitionId, not printing)
- **Impact**: Users don't know which variant they're adding to deck; can't track "I own Foil but added Normal to deck"
- **Fix approach**: Add `cardPrintingId` column to `deck_cards` table; update DeckBuilder to show variant chip selector; update deck export to include variant info

### No Error Recovery in Bulk Operations

- **Issue**: CSV import processes all items sequentially; if item 500/1000 fails, remaining items not processed
- **Files**: `src/app/api/collection/import/route.ts:91-110` (batch upsert)
- **Impact**: Large imports may partially fail silently; user doesn't know which cards failed to import
- **Fix approach**: Collect errors during batch processing; return `{ success: 950, errors: [ {item: 500, reason: "..."} ] }`; show errors in UI

## Test Coverage Gaps

### Untested Authorization Checks

- **Issue**: No tests verify that User A cannot access/modify User B's data
- **Files**: No integration tests in `__tests__/` or `*.test.ts` for multi-user scenarios
- **Impact**: Authorization bypass could go unnoticed; SQL injection on user filtering could leak data
- **Fix approach**: Add `src/db/queries/__tests__/auth.test.ts` with tests like `test("User A cannot see User B's decks")` using two mock users

### Missing Edge Case Tests

- **Issue**: No tests for boundary conditions (empty deck, max sideboard, 0 cost cards, negative counts)
- **Files**: Validation logic in `src/lib/deck-validation.test.ts` is incomplete
- **Impact**: Edge cases could slip through; malicious client could send `{ quantity: -5 }` and create invalid state
- **Fix approach**: Add property-based tests using `fast-check` for quantity validation; add boundary tests for deck size limits

---

*Concerns audit: 2026-07-05*

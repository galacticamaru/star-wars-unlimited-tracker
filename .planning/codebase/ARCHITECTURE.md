---
focus: arch
last_updated: 2026-05-28
---
<!-- refreshed: 2026-05-28 -->
# Architecture

**Analysis Date:** 2026-05-28

## System Overview

```text
┌──────────────────────────────────────────────────────────────────┐
│                     Browser (Client Components)                  │
│  CatalogClient  DecksClient  ManageBinderPage  PublicBinderClient │
│  `src/components/catalog/`  `src/components/decks/`              │
│  `src/app/binder/manage/page.tsx`  `src/components/binder/`      │
└────────┬──────────────┬───────────────┬──────────────────────────┘
         │ fetch()      │ authClient.*  │ nuqs (URL state)
         ▼              ▼               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Next.js App Router (Server)                    │
│  RSC Pages (async)              Route Handlers (API)             │
│  `src/app/*/page.tsx`           `src/app/api/**/route.ts`        │
│  — DB queries direct            — auth.api.getSession() guard    │
│  — serialize plain objects      — JSON responses                 │
└────────┬─────────────────────────────────────────────────────────┘
         │ Drizzle ORM
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Data Layer (`src/db/`)                        │
│  schema.ts (table definitions)   queries/ (query functions)      │
│  index.ts  (Neon pool + drizzle client singleton)                │
└────────┬─────────────────────────────────────────────────────────┘
         │ @neondatabase/serverless WebSocket pool
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Neon PostgreSQL (external)                     │
└──────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| RootLayout | Font setup, NavBar, NuqsAdapter, CurrencyProvider, SpeedInsights | `src/app/layout.tsx` |
| NavBar | Client-side nav with auth session display, sign-out | `src/components/nav-bar.tsx` |
| CurrencyProvider | React context for EUR/USD preference via localStorage | `src/components/currency-context.tsx` |
| CatalogPage (RSC) | Fetches all cards + filter options + art map, passes to CatalogClient | `src/app/cards/page.tsx` |
| CatalogClient | Filter state (nuqs URL params), collection fetch, card grid render | `src/components/catalog/catalog-client.tsx` |
| CardDetailPage (RSC) | Fetches card + user printings, hydrates legacy collection data | `src/app/cards/[set-code]/[card-number]/page.tsx` |
| DecksPage (RSC) | Auth-protected; fetches deck list + want list for the user | `src/app/decks/page.tsx` |
| DeckPage (RSC) | Auth-protected; fetches full deck + all cards for builder | `src/app/decks/[id]/page.tsx` |
| DeckBuilder | useReducer deck state, auto-filter, embedded card browser | `src/components/decks/deck-builder.tsx` |
| CollectionPage | Client-only; CSV upload flow + starter deck quick-add | `src/app/collection/page.tsx` |
| ManageBinderPage | Client-only; trade offerings + wants + exclusions management | `src/app/binder/manage/page.tsx` |
| PublicBinderPage (RSC) | Fetches public binder data by username slug | `src/app/binder/[username]/page.tsx` |
| DB schema | All 11 table definitions | `src/db/schema.ts` |
| DB index | Neon serverless pool + drizzle client singleton | `src/db/index.ts` |
| Auth (server) | better-auth instance with Drizzle adapter | `src/lib/auth.ts` |
| Auth (client) | better-auth React client for session hooks | `src/lib/auth-client.ts` |

## Pattern Overview

**Overall:** RSC-first data loading with "serialize then hand off" to Client Components

**Key Characteristics:**
- RSC pages query the database directly — no intermediate API layer for initial page loads
- RSC pages serialize Drizzle results to plain objects before passing as props; Date objects never cross the RSC→Client boundary
- Client components fetch their own user-specific data via `fetch('/api/...')` inside `useEffect` (e.g., `CatalogClient` fetches collection on mount)
- URL state is managed with `nuqs` — all catalog/binder filter state lives in the URL, not component state
- Deck card state is managed with `useReducer` in `DeckBuilder` — the most complex local state in the app
- Auth is handled by `better-auth` on both server (`auth.api.getSession`) and client (`authClient.useSession`)

## Layers

**App Router Pages (`src/app/`):**
- Purpose: Route entry points; RSC pages load data, client pages own their data lifecycle
- Location: `src/app/`
- Contains: `page.tsx`, `layout.tsx`, `loading.tsx` files; API route handlers under `src/app/api/`
- Depends on: `src/db/queries/`, `src/lib/`, `src/components/`
- Used by: Browser via Next.js router

**Components (`src/components/`):**
- Purpose: UI rendering; split into feature-domain folders
- Location: `src/components/`
- Contains: Client Components (`'use client'`) and a few pure presentation components
- Depends on: `src/lib/`, `src/components/ui/`
- Used by: `src/app/*/page.tsx`

**DB Queries (`src/db/queries/`):**
- Purpose: Typed Drizzle query functions; one file per domain
- Location: `src/db/queries/`
- Contains: `catalog.ts`, `collection.ts`, `decks.ts`, `binder.ts`, `trade.ts`, `card-detail.ts`
- Depends on: `src/db/index.ts`, `src/db/schema.ts`
- Used by: RSC pages, API route handlers, `src/lib/` functions

**Lib (`src/lib/`):**
- Purpose: Pure business logic, auth setup, and domain utilities
- Location: `src/lib/`
- Contains: `filter-cards.ts`, `binder-logic.ts`, `deck-validation.ts`, `deck-grouping.ts`, `want-list.ts`, `auto-filter.ts`, `export.ts`, `auth.ts`, `auth-client.ts`, `sync/`, `catalog/`
- Depends on: `src/db/` (only `auth.ts` and `want-list.ts`), `src/app/api/collection/collection-shape.ts`
- Used by: Components, API routes, RSC pages

**UI Primitives (`src/components/ui/`):**
- Purpose: shadcn/ui base components
- Location: `src/components/ui/`
- Contains: `badge.tsx`, `button.tsx`, `card.tsx`, `dropdown-menu.tsx`, `input.tsx`, `label.tsx`, `sheet.tsx`, `switch.tsx`, `tabs.tsx`, `tooltip.tsx`
- Depends on: Radix UI primitives, `src/lib/utils.ts` (`cn` helper)
- Used by: All feature components

## Data Flow

### Catalog Page Load (RSC Path)

1. `CatalogPage` RSC (`src/app/cards/page.tsx`) awaits `getAllCards()`, `getFilterOptions()`, `getPrintingArtMap()` in parallel
2. `getAllCards()` (`src/db/queries/catalog.ts`) runs a Drizzle JOIN of `card_definitions` + `card_printings`, tagged `'use cache'` with `cacheTag('cards')` and `cacheLife('days')`
3. RSC serializes results to plain objects, stripping Date columns
4. `CatalogClient` (`src/components/catalog/catalog-client.tsx`) receives cards as props; initializes nuqs URL filter state
5. On mount (if authenticated), `CatalogClient` fetches `GET /api/collection` to load the `CollectionMap`
6. `filterCards()` (`src/lib/filter-cards.ts`) runs client-side on every filter change using `useMemo`
7. `CardGrid` renders filtered cards with collection overlay badges

### Collection Count Mutation

1. User clicks +/- in `VariantCollectionSection` (`src/components/catalog/variant-collection-section.tsx`)
2. `POST /api/collection/variants` (`src/app/api/collection/variants/route.ts`) receives `{ cardPrintingId, count }`
3. Route validates inputs (ASVS pattern), extracts `userId` from session only
4. `upsertVariantCount()` writes to `user_printing_collections`
5. `recomputeTotal()` sums all variant counts and writes aggregate to `user_collections`
6. Response returns `{ success: true }`; component updates local display state

### Deck Builder Flow

1. `DeckPage` RSC (`src/app/decks/[id]/page.tsx`) fetches deck + all cards + filter options in parallel
2. `DeckBuilder` (`src/components/decks/deck-builder.tsx`) initializes `useReducer` with `DeckState`
3. Card additions dispatch `UPDATE_CARD` actions; saves call `PATCH /api/decks/[id]`
4. `computeAutoFilter()` (`src/lib/auto-filter.ts`) derives aspect/type filter from the selected leader + base
5. `CatalogClient` is embedded in `mode='selector'` — `onDeckUpdate` callback bridges catalog tile clicks to deck state

### Card Sync (Cron)

1. Vercel cron hits `GET /api/cron/sync-cards` daily at 06:00 UTC (configured in `vercel.json`)
2. Bearer token from `CRON_SECRET` env var is validated; missing/mismatched → 401
3. `syncAllCards()` (`src/lib/sync/upsert-cards.ts`) fetches from swu-db.com API, upserts `card_definitions` + `card_printings`
4. `syncPrices()` (`src/lib/sync/prices.ts`) updates price columns on `card_definitions`
5. `revalidateTag('cards', 'max')` invalidates the entire Next.js catalog cache

**State Management Summary:**
- URL state: filter params via `nuqs` (`CatalogClient`, `PublicBinderClient`)
- Local `useState`: collection map (fetched in `CatalogClient`), binder trade data, form upload states
- `useReducer`: deck card state in `DeckBuilder`
- React Context: currency preference (`CurrencyProvider` via `src/components/currency-context.tsx`)
- No global state library (no Zustand, Redux, or Jotai)

## Key Abstractions

**CollectionMap:**
- Purpose: Typed map of `cardDefinitionId → { total, variants: { cardPrintingId: count } }`
- Definition: `src/app/api/collection/collection-shape.ts`
- Pattern: Always read `.total` for aggregate count; `.variants[printingId]` for per-variant count

**CardForFilter:**
- Purpose: Shared card type used by catalog, binder, and deck selector
- Definition: `src/lib/filter-cards.ts`
- Pattern: All card-list features pass this type to `filterCards()`

**AutoFilter:**
- Purpose: Computed filter preset for the deck builder card browser
- Definition: `src/lib/auto-filter.ts`
- Pattern: `computeAutoFilter(leader, base)` → `AutoFilter | null`; injected into `CatalogClient` via props; user override signal passed back via `onFilterManualChange` callback

**PrintingArtMap:**
- Purpose: Map of `cardPrintingId → { variantType, frontArtUrl }` for client-side variant art resolution
- Definition: `src/lib/catalog/select-best-variant.ts`
- Pattern: Loaded once by the catalog RSC, passed to client; `selectBestVariantArtUrl()` picks the best-precedence owned variant art

## Entry Points

**Home (`/`):**
- Location: `src/app/page.tsx`
- Triggers: All visitors
- Responsibilities: RSC; loads top 10 cards by USD price via `getTopCardsByPrice(10)`, renders hero + high-value grid

**Catalog (`/cards`):**
- Location: `src/app/cards/page.tsx`
- Triggers: Navigation to `/cards`
- Responsibilities: RSC; loads all cards + filter metadata + art map; hands off to `CatalogClient`

**Card Detail (`/cards/[set-code]/[card-number]`):**
- Location: `src/app/cards/[set-code]/[card-number]/page.tsx`
- Triggers: Card tile click in catalog
- Responsibilities: RSC; loads card + printings with collection counts; includes legacy variant hydration logic

**Decks List (`/decks`):**
- Location: `src/app/decks/page.tsx`
- Triggers: Auth-required navigation
- Responsibilities: RSC; redirects unauthenticated users to `/login`; loads deck list + computed want list

**Deck Builder (`/decks/[id]`):**
- Location: `src/app/decks/[id]/page.tsx`
- Triggers: Auth-required; deck row click in `DecksClient`
- Responsibilities: RSC; redirects unauthenticated; loads full deck + all cards for builder

**Login (`/login`):**
- Location: `src/app/(auth)/login/page.tsx`
- Triggers: Unauthenticated users; redirects from protected pages
- Responsibilities: Client component; email/password + Google/Discord OAuth via `authClient`

**Auth Handler (`/api/auth/[...all]`):**
- Location: `src/app/api/auth/[...all]/route.ts`
- Triggers: better-auth internal session/OAuth callbacks
- Responsibilities: Delegates all handling to `auth.handler`

**Cron Sync (`/api/cron/sync-cards`):**
- Location: `src/app/api/cron/sync-cards/route.ts`
- Triggers: Vercel cron at 06:00 UTC daily
- Responsibilities: Bearer-auth guarded; syncs cards + prices from swu-db.com; invalidates cache tag

## Architectural Constraints

- **Serialization boundary:** Drizzle returns `Date` objects for `timestamp` columns; RSC pages MUST map to plain objects before passing props to client components — see `src/app/cards/page.tsx` (`plainCards` mapping pattern)
- **Next.js params are a Promise:** In this Next.js version, `params` is `Promise<{...}>` — pages MUST `await params` before destructuring (documented at `src/app/cards/[set-code]/[card-number]/page.tsx:16`)
- **Route protection via proxy function:** There is no `middleware.ts`; protection for `/collection` and `/decks` uses `src/proxy.ts` (exported `proxy` function + `config.matcher`); auth guards are also enforced inside each RSC page
- **Neon HTTP driver — no transactions:** The `Pool` + `drizzle` setup in `src/db/index.ts` uses the Neon serverless HTTP driver which does NOT support transactions; multi-step mutations are sequential awaits with documented TOCTOU risk (see `src/app/api/collection/variants/route.ts:52`)
- **Global cache tag:** All card queries use `cacheTag('cards')`; cron sync invalidates the entire catalog cache with one `revalidateTag` call
- **`cacheComponents: true`** is set in `next.config.ts` — PPR/component caching is active

## Anti-Patterns

### Passing Date objects across the RSC→Client boundary

**What happens:** Drizzle `timestamp` columns return `Date` objects; if passed directly as RSC props, Next.js throws a serialization error.
**Why it's wrong:** Non-serializable objects cannot cross the server→client prop boundary.
**Do this instead:** Map to plain objects in the RSC page before returning JSX, selecting only needed primitive columns. See `src/app/cards/page.tsx` (`plainCards` pattern).

### Reading userId from the request body

**What happens:** A route handler reads `userId` from `request.json()` body instead of from the session.
**Why it's wrong:** Any authenticated user can forge another user's ID, breaking access control.
**Do this instead:** Always derive `const userId = Number(session.user.id)` after `auth.api.getSession()`. See `src/app/api/collection/variants/route.ts`.

### Including nuqs setters in useEffect dependency arrays

**What happens:** nuqs setter function references change on every render; including them in a `useEffect` dep array alongside filter values creates an infinite re-render loop.
**Why it's wrong:** Effect fires → sets state → re-renders → setter reference changes → effect fires again.
**Do this instead:** Omit setter functions from the dep array and suppress the lint rule. See `src/components/catalog/catalog-client.tsx` lines 88–98.

## Error Handling

**Strategy:** Route handlers return typed HTTP error responses; RSC pages use `notFound()` and `redirect()`; client components use local status state with inline error UI.

**Patterns:**
- Route handlers: `try/catch` → `console.error` + `new Response('...', { status: 500 })` for server errors; inline `if (!session) return new Response('Unauthorized', { status: 401 })` before any query
- RSC pages: `notFound()` for unknown resources, `redirect('/login')` for unauthenticated access
- Client components: `status` state machine (`'idle' | 'parsing' | 'uploading' | 'success' | 'error'`) with conditional inline error UI

## Cross-Cutting Concerns

**Logging:** `console.error` in all route handler catch blocks; `console.log` in cron route for sync progress milestones
**Validation:** Input validation in route handlers before DB calls — see `src/app/api/collection/variants/route.ts` for the V5 ASVS pattern (type checks, `isNaN`, `Number.isFinite`, floor/ceiling on numeric inputs)
**Authentication:** Server: `auth.api.getSession({ headers: await headers() })` in every protected route handler and RSC page. Client: `authClient.useSession()` hook. Cookie-based proxy: `src/proxy.ts`

---

*Architecture analysis: 2026-05-28*

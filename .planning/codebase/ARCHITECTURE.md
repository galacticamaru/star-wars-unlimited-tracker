<!-- refreshed: 2026-05-08 -->
# Architecture

**Analysis Date:** 2026-05-08

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│                     Next.js App Router (Pages)                       │
│  `/`           `/collection`   `/decks`   `/decks/[id]`             │
│  `src/app/page.tsx`  `collection/page.tsx`  `decks/page.tsx`        │
│                      `decks/[id]/page.tsx`                           │
│                      `cards/[set-code]/[card-number]/page.tsx`       │
└──────┬──────────────────┬──────────────────────┬────────────────────┘
       │ Server fetch      │ Client fetch          │ Server fetch
       ▼                  ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    API Routes (Route Handlers)                        │
│  `src/app/api/collection/route.ts`    GET/POST                       │
│  `src/app/api/collection/import/route.ts`  POST                      │
│  `src/app/api/collection/sets/route.ts`    GET                       │
│  `src/app/api/decks/route.ts`         GET/POST                       │
│  `src/app/api/decks/[id]/route.ts`    GET/PATCH/DELETE               │
│  `src/app/api/decks/[id]/export/route.ts`  GET                       │
│  `src/app/api/want-list/route.ts`     GET                            │
│  `src/app/api/cron/sync-cards/route.ts`  GET (cron)                  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ Direct DB calls via query functions
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       DB Query Layer                                  │
│  `src/db/queries/catalog.ts`    — getAllCards(), getFilterOptions()   │
│  `src/db/queries/collection.ts` — getUserCollection(), upsertCardCount()│
│  `src/db/queries/decks.ts`      — CRUD + export + want-list queries  │
│  `src/db/queries/card-detail.ts`— getCardByPrinting()               │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ Drizzle ORM via neon-serverless pool
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Neon Serverless Postgres                           │
│  Tables: card_definitions, card_printings, user_collections,         │
│          decks, deck_cards                                           │
│  `src/db/index.ts` — Pool + drizzle client singleton                │
│  `src/db/schema.ts` — Drizzle table definitions                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| CatalogPage | Server component — fetches all cards + filter options, passes to client | `src/app/page.tsx` |
| CatalogClient | Client component — filter state (nuqs), collection fetch, renders grid | `src/components/catalog/catalog-client.tsx` |
| CardItem | Card tile UI — hover controls, collection/deck count badges, 3 modes | `src/components/catalog/card-item.tsx` |
| CardGrid | Responsive grid wrapper around CardItem list | `src/components/catalog/card-grid.tsx` |
| TopBar | Sticky filter bar — search + 8 filter dropdowns + cost button group | `src/components/catalog/top-bar.tsx` |
| FilterDropdown | Single/multi-select dropdown with checkbox items | `src/components/catalog/filter-dropdown.tsx` |
| CardImageSection | Leader/Base image toggle (flip front/back), aspect-ratio aware | `src/components/catalog/card-image-section.tsx` |
| CollectionControls | +/- counter on card detail page, fires `/api/collection` POST | `src/components/catalog/collection-controls.tsx` |
| DeckBuilder | Full deck editor — useReducer state, 3-view tabbed UI | `src/components/decks/deck-builder.tsx` |
| DeckSidebar | Live validation panel, cost curve chart, save buttons | `src/components/decks/deck-sidebar.tsx` |
| WantListTab | Per-deck shortfall view (deck cards minus owned collection) | `src/components/decks/want-list-tab.tsx` |
| NavBar | Sticky top nav, 3 links, active-state detection | `src/components/nav-bar.tsx` |
| CollectionPage | CSV upload flow — parse → normalize → POST import API | `src/app/collection/page.tsx` |
| DecksPage | Deck list + create form + global want list | `src/app/decks/page.tsx` |
| DeckPage | Server component — loads deck + all cards → DeckBuilder | `src/app/decks/[id]/page.tsx` |
| CardDetailPage | Server component — loads card + owned count, full detail UI | `src/app/cards/[set-code]/[card-number]/page.tsx` |

## Pattern Overview

**Overall:** Next.js App Router with a clear server/client boundary split.

**Key Characteristics:**
- Server components (pages) fetch all data at request time via direct DB query calls, then pass serialized plain objects to client components as props
- Client components own all interactive state (filter dropdowns, collection counts, deck mutations) and call API routes via `fetch()`
- API routes are thin — they call query functions directly, with minimal logic (only deck validation PATCH handler has branching logic)
- No global client-side state manager (no Redux, no Zustand) — local `useState`/`useReducer` and URL state via `nuqs`
- Filter state lives in the URL query string (via `nuqs`) so it survives page refresh

## Layers

**Page Layer (Server):**
- Purpose: Fetch data at request time, serialize to plain objects, pass to client components
- Location: `src/app/**/page.tsx` (except collection and decks root page which are `'use client'`)
- Contains: `async` server components, `Promise<params>` await, `notFound()` usage
- Depends on: DB query layer directly
- Used by: Next.js App Router runtime

**Page Layer (Client):**
- Purpose: Pages that need hooks at the page level (list views with fetch-on-mount)
- Location: `src/app/collection/page.tsx`, `src/app/decks/page.tsx`
- Contains: `'use client'` directive, `useEffect` fetch patterns
- Depends on: API routes via `fetch()`

**Component Layer:**
- Purpose: UI rendering and interactive state
- Location: `src/components/`
- Contains: React components, event handlers, local state
- Depends on: `src/lib/` for pure logic, API routes for mutations

**API Route Layer:**
- Purpose: HTTP interface — validate input, call query functions, return JSON
- Location: `src/app/api/**/route.ts`
- Contains: Named exports `GET`, `POST`, `PATCH`, `DELETE`
- Depends on: DB query layer, `src/lib/` for business logic
- Used by: Client components via `fetch()`

**DB Query Layer:**
- Purpose: All SQL — structured as typed query functions per domain
- Location: `src/db/queries/`
- Contains: Drizzle ORM query builders, one function per DB operation
- Depends on: `src/db/index.ts` (db client), `src/db/schema.ts` (table definitions)

**Business Logic Layer (lib):**
- Purpose: Pure domain logic — no DB calls, no HTTP
- Location: `src/lib/`
- Contains: Filtering, validation, export formatting, collection normalization, sync orchestration
- Depends on: Nothing outside `src/lib/` (except sync which imports `src/db/`)

**Data Layer:**
- Purpose: DB connection singleton and schema definitions
- Location: `src/db/index.ts`, `src/db/schema.ts`
- Contains: Neon Pool + drizzle client, pgTable definitions with Drizzle relations

## Data Flow

### Primary Request Path: Catalog Page

1. Request arrives at `/` — Next.js invokes `CatalogPage` server component (`src/app/page.tsx`)
2. `getAllCards()` and `getFilterOptions()` run in parallel via `Promise.all` (`src/db/queries/catalog.ts`)
3. Results serialized to plain objects (Date fields stripped) in page component body
4. `<CatalogClient cards={plainCards} filterOptions={filterOptions} />` rendered server-side as shell
5. Client hydrates — `CatalogClient` reads filter state from URL params via `nuqs`
6. `useEffect` fires `GET /api/collection` — response populates `collection` state map
7. `filterCards()` pure function runs on client with all filters (`src/lib/filter-cards.ts`)
8. `CardGrid` renders filtered cards; `CardItem` shows owned count badge from collection map

### Collection Count Update

1. User clicks +/- on `CardItem` hover overlay
2. Optimistic update: `setCollection(prev => ...)` immediately in `CatalogClient`
3. `POST /api/collection` with `{ cardDefinitionId, count }` (`src/app/api/collection/route.ts`)
4. Route calls `upsertCardCount()` (`src/db/queries/collection.ts`)
5. Drizzle upsert on `user_collections` table with `onConflictDoUpdate`

### Deck Builder Save

1. User clicks "Save as Draft" or "Complete Deck" in `DeckSidebar`
2. `handleSave(isDraft)` in `DeckBuilder` dispatches `PATCH /api/decks/[id]`
3. If `isDraft === false`: API fetches card details, calls `validateDeck()` (`src/lib/deck-validation.ts`)
4. If validation fails: returns `{ success: false, errors }` — `DeckBuilder` sets `apiErrors` state
5. If valid: `updateDeck()` wraps metadata + card list in a DB transaction (`src/db/queries/decks.ts`)

### Card Sync (Cron)

1. Vercel Cron fires `GET /api/cron/sync-cards` daily at 06:00 UTC (`vercel.json`)
2. Route checks `Authorization: Bearer <CRON_SECRET>` header
3. `syncAllCards()` fetches all sets from `api.swu-db.com/sets` (`src/lib/sync/upsert-cards.ts`)
4. For each non-token set: fetches cards from `api.swu-db.com/cards/{setId}`
5. `upsertCards()` two-pass: Normal variants → create `card_definitions` rows; variants → look up existing and insert `card_printings` only

### Collection CSV Import

1. User picks set + CSV file on `/collection` page
2. `Papa.parse` parses CSV client-side with header-row finder for Reddit spreadsheet format
3. `normalizeRedditCsv()` sums Standard/Non-Foil/Foil/Hyperspace/F-Hyperspace per card (`src/lib/collection/normalize.ts`)
4. `POST /api/collection/import` with `Record<collectorNumber, totalCount>`
5. Route maps collector numbers to `cardDefinitionId` via `card_printings` lookup in chunks of 500
6. Bulk upsert into `user_collections`

**State Management:**
- Filter state: URL query string via `nuqs` (`q`, `sets`, `types`, `aspects`, `arenas`, `traits`, `rarities`, `keywords`, `costs`)
- Collection counts: local `useState` in `CatalogClient`, hydrated from API on mount
- Deck state: `useReducer` with `deckReducer` in `DeckBuilder`, typed `DeckAction` union
- Dirty tracking: `cleanStateRef` + JSON.stringify comparison in `DeckBuilder`

## Key Abstractions

**CardForFilter:**
- Purpose: Flattened card shape used throughout catalog UI (definition + Normal printing merged)
- Location: `src/lib/filter-cards.ts`
- Pattern: Defined as interface, returned by `getAllCards()` query, consumed by `filterCards()` and all catalog components

**Card (deck-validation):**
- Purpose: Card shape used by deck builder and validation logic
- Location: `src/lib/deck-validation.ts`
- Pattern: Same shape as `CardForFilter` but defined independently; used by `validateDeck()` and `DeckBuilder`

**DeckState / DeckAction:**
- Purpose: Typed reducer pattern for deck builder state
- Location: `src/components/decks/deck-builder.tsx`
- Pattern: `useReducer(deckReducer, initialDeck)` — actions: `SET_DECK`, `SET_NAME`, `SET_LEADER`, `SET_BASE`, `UPDATE_CARD`, `REMOVE_CARD`

**CardItem mode:**
- Purpose: Single component renders in 3 distinct interaction modes
- Location: `src/components/catalog/card-item.tsx`
- Pattern: `mode?: 'catalog' | 'selector' | 'want-list'` prop controls hover overlay and badge rendering

## Entry Points

**Root Layout:**
- Location: `src/app/layout.tsx`
- Triggers: Every page request
- Responsibilities: Font variables, `NavBar`, `NuqsAdapter` wrapper for URL state

**Catalog (Home):**
- Location: `src/app/page.tsx`
- Triggers: `GET /`
- Responsibilities: Parallel fetch of all cards + filter options, serialize, render `CatalogClient`

**Deck Builder:**
- Location: `src/app/decks/[id]/page.tsx`
- Triggers: `GET /decks/[id]`
- Responsibilities: Parallel fetch of deck + all cards + filter options, serialize, render `DeckBuilder`

**Card Sync Cron:**
- Location: `src/app/api/cron/sync-cards/route.ts`
- Triggers: Vercel Cron daily at 06:00 UTC, or manual `GET` with `Authorization: Bearer <CRON_SECRET>`
- Responsibilities: Auth check, delegate to `syncAllCards()`

## Architectural Constraints

- **User model:** Single hardcoded `userId = 1` throughout — `user_collections`, `decks`, all queries default to user 1. No auth exists. All API routes comment this as "D-04: v1 decision".
- **DB connection:** Single `Pool` singleton in `src/db/index.ts` — throws at module load if `DATABASE_URL` is missing. WebSocket constructor patched for Node.js via `neonConfig.webSocketConstructor = ws`.
- **Server→Client serialization:** Server components must manually map Drizzle results to plain objects — `Date` fields (`createdAt`, `updatedAt`) cause Next.js serialization errors if passed directly. Both `src/app/page.tsx` and `src/app/decks/[id]/page.tsx` contain explicit mapping blocks.
- **params API:** Next.js 16 — `params` is a `Promise<{...}>` and MUST be awaited before destructuring. This is documented in page files as "Pitfall 1".
- **Image optimization:** `unoptimized: true` in `next.config.ts` — Vercel Image Transformations quota was exhausted. CDN domain `cdn.swu-db.com` is whitelisted via `remotePatterns`.
- **Global state:** None — no module-level mutable state outside the Neon Pool singleton.
- **Circular imports:** None detected.

## Anti-Patterns

### Direct DB calls in page components without query abstraction

**What happens:** `src/app/page.tsx` calls `getAllCards()` and `getFilterOptions()` directly (correct). However, `src/app/cards/[set-code]/[card-number]/page.tsx` calls both `getCardByPrinting()` and `getUserCollection()` — mixing card detail and collection concerns in one server component.
**Why it's wrong here:** Not wrong per se — this is the intended pattern. But the page also manually re-serializes Drizzle results with explicit field mapping, duplicating the serialization pattern from `src/app/page.tsx`.
**Do this instead:** Extract a shared serialization helper if more pages need the same shape — or keep it as-is per current convention.

### Client pages fetching on mount instead of server components

**What happens:** `src/app/decks/page.tsx` is marked `'use client'` and fetches `/api/decks` and `/api/want-list` via `useEffect`.
**Why it's wrong:** This page has no interactivity that requires client-side rendering at load — it adds a loading flash and extra round trips.
**Do this instead:** For v2 multi-user pages, convert to a server component with `async` data fetching, matching the pattern in `src/app/page.tsx`.

## Error Handling

**Strategy:** Try/catch in all API routes. Errors logged via `console.error`. Client-side errors surface only in the `DeckBuilder` `apiErrors` state for validation failures. All other errors are silent to the user (logged to console only).

**Patterns:**
- API routes return `new Response('Internal Server Error', { status: 500 })` on catch
- Validation errors from `validateDeck()` return `Response.json({ success: false, errors }, { status: 400 })`
- Client components catch fetch errors with `console.error` but do not surface them in UI (except `DeckBuilder`)
- `notFound()` from `next/navigation` used for missing cards/decks in server components

## Cross-Cutting Concerns

**Logging:** `console.error` only — no structured logging library. All API route catch blocks log to console.
**Validation:** `validateDeck()` in `src/lib/deck-validation.ts` — called server-side in the PATCH route when finalizing a deck, and client-side in `DeckSidebar` for live preview.
**Authentication:** None. All operations hardcoded to `userId = 1`. Cron endpoint uses `CRON_SECRET` bearer token.
**Filter logic:** `filterCards()` in `src/lib/filter-cards.ts` — pure function, AND across categories, OR within each category, called client-side only.

---

*Architecture analysis: 2026-05-08*

<!-- refreshed: 2026-07-05 -->
# Architecture

**Analysis Date:** 2026-07-05

## System Overview

```text
┌──────────────────────────────────────────────────────────────────────┐
│                           Client Layer                               │
│  React 19 / Next.js 16 Components (TSX) + shadcn/ui                  │
│  • CatalogClient, DecksClient, BinderClient                          │
│  • CardGrid, SidebarFilters, VariantSections                         │
└──────────┬───────────────────────────────────────────────────────────┘
           │ API calls (GET/POST)
           │ Query params (nuqs)
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       Next.js Server Layer                            │
│  Server Components (RSC) + API Routes                                │
│  • src/app/ — Pages fetch data, serialize to plain objects           │
│  • src/app/api/ — Endpoints for auth, mutations, data export         │
└──────────┬───────────────────────────────────────────────────────────┘
           │ Queries via Drizzle ORM
           │ Auth checks (better-auth)
           │ Business logic (src/lib)
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       Data Access Layer                               │
│  src/db/queries/ + src/lib/* — Type-safe DB queries & transformations│
│  • catalog.ts — Card lookups, filters, prices                        │
│  • collection.ts — User ownership, variants, counts                  │
│  • decks.ts, binder.ts, trade.ts — Feature-specific queries          │
│  • Business logic: filtering, validation, calculations               │
└──────────┬───────────────────────────────────────────────────────────┘
           │ SQL (Neon serverless)
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      PostgreSQL (Neon)                               │
│  • cardDefinitions — Base card data (name, type, cost, etc.)         │
│  • cardPrintings — Variants (Normal, Foil, Hyperspace) with art URLs│
│  • userCollections — Count totals by user & definition               │
│  • userPrintingCollections — Counts per variant per user             │
│  • decks, userTradeOfferings, wantListEntries — Features             │
└──────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| **Pages (RSC)** | Server-fetch data, serialize, pass to client components | `src/app/*/page.tsx` |
| **CatalogClient** | Card listing, filtering, variant selection (client state) | `src/components/catalog/catalog-client.tsx` |
| **DecksClient** | Deck list, deck builder, card validation | `src/components/decks/decks-client.tsx` |
| **BinderClient** | Binder editing, trade offer management, collection display | `src/components/binder/*` |
| **CardGrid** | Virtualized card rendering, pagination | `src/components/catalog/card-grid.tsx` |
| **DB Queries** | Typed, reusable database access functions | `src/db/queries/*.ts` |
| **Business Logic** | Filtering, calculations, normalization | `src/lib/*.ts` |
| **API Routes** | HTTP endpoints for mutations and data export | `src/app/api/*/route.ts` |
| **Auth** | better-auth configuration, session management | `src/lib/auth.ts` |

## Pattern Overview

**Overall:** Server-Driven Client Application with Serialization Boundary

**Key Characteristics:**
- Server Components fetch and serialize data before RSC→Client boundary
- Client components manage UI state (filters, selections) via nuqs URL params
- API routes handle mutations with session validation
- Type-safe database layer via Drizzle ORM
- Multi-level data ownership (card definition → printing → user collection)

## Layers

**Server Components (RSC Layer):**
- Purpose: Fetch initial data, authenticate user, serialize for client
- Location: `src/app/*/page.tsx` (all page files)
- Contains: Async server components that call DB queries
- Depends on: `src/db/queries/*`, `src/lib/*` (auth, business logic)
- Used by: Client components (passed as props or context)
- Example: `src/app/decks/page.tsx` fetches decks + want list, passes to `<DecksClient>`

**Client Components (UI Layer):**
- Purpose: Render UI, manage filter state, handle user interactions
- Location: `src/components/*` (all client components marked with `'use client'`)
- Contains: React hooks, event handlers, conditional rendering
- Depends on: API endpoints, shadcn/ui primitives, utility functions
- Used by: Server pages, other client components
- Example: `src/components/catalog/catalog-client.tsx` filters cards, calls `/api/collection/variants` to update counts

**API Routes (HTTP Endpoint Layer):**
- Purpose: Handle mutations, export data, manage authenticated operations
- Location: `src/app/api/*/route.ts`
- Contains: GET/POST handlers, auth checks, transaction coordination
- Depends on: DB queries, auth service, business logic
- Used by: Client components (fetch calls), cron jobs
- Example: `src/app/api/collection/variants/route.ts` updates user's variant counts

**Database Query Layer:**
- Purpose: Type-safe, reusable database operations
- Location: `src/db/queries/*.ts`
- Contains: Drizzle queries for each feature (catalog, collection, decks, binder, trade)
- Depends on: Drizzle ORM, schema definitions
- Used by: Server pages, API routes, business logic functions
- Example: `src/db/queries/collection.ts` joins user collections with card metadata

**Business Logic Layer:**
- Purpose: Filtering, calculations, transformations independent of persistence
- Location: `src/lib/*.ts` (excluding auth)
- Contains: Pure functions, utility helpers, validation logic
- Depends on: Type definitions (no direct DB access in most cases)
- Used by: Server pages, API routes, components
- Examples:
  - `src/lib/filter-cards.ts` — Apply user filters to card list
  - `src/lib/binder-logic.ts` — Calculate "Looking For" quantities
  - `src/lib/deck-validation.ts` — Validate deck legality

**Authentication & Authorization:**
- Purpose: Session management, user identity, protected routes
- Location: `src/lib/auth.ts`, `src/lib/auth-client.ts`, `src/proxy.ts`
- Pattern: better-auth with Drizzle adapter, Google/Discord OAuth, email/password
- Middleware: `src/proxy.ts` guards `/collection` and `/decks` routes
- Example: API routes check session via `auth.api.getSession({ headers })`

## Data Flow

### Primary Request Path: Catalog Page Load

1. User navigates to `/cards` → `src/app/cards/page.tsx` (Server Component)
2. Page fetches in parallel:
   - `getAllCards()` from `src/db/queries/catalog.ts` — All card definitions with printings
   - `getFilterOptions()` — Available filter choices (sets, types, aspects)
   - `getPrintingArtMap()` — Best art variant per card definition
3. Server serializes cards to plain objects (strips timestamps, selects needed fields)
4. Page renders `<CatalogClient cards={plainCards} filterOptions={...} />`
5. Client component (`src/components/catalog/catalog-client.tsx`):
   - Initializes filter state from URL query params (nuqs)
   - `useMemo` applies `filterCards()` from `src/lib/filter-cards.ts`
   - Renders `<CardGrid>` with filtered cards
   - User selects filters → URL query params update → useMemo re-runs → grid updates

### Secondary Flow: Collection Management (Mutation)

1. User selects card variant in collection UI
2. Client component calls `POST /api/collection/variants` with card printing ID + count
3. API route (`src/app/api/collection/variants/route.ts`):
   - Validates session via `auth.api.getSession()`
   - Calls `updateCardPrintingCount()` from `src/db/queries/collection.ts`
   - Mutation updates `userPrintingCollections` table
   - Returns updated counts
4. Client component updates local state and re-renders

### Trade Binder Flow

1. User edits binder via `/binder/manage` → `src/app/binder/manage/page.tsx`
2. Page fetches user's binder data: `getOwnedCardDefinitions()` + trade offerings
3. `<BinderClient>` renders editable sections:
   - Collection (what they own) — from `userCollections` + `userPrintingCollections`
   - Exclusions (cards to hide from want list) — from `binderExclusions`
   - Trade offerings (cards they're offering) — from `userTradeOfferings`
4. User updates → POST to `/api/binder/*` endpoints → DB mutations
5. Data flow driven by `calculateLookingFor()` in `src/lib/binder-logic.ts`:
   - Merges deck requirements (auto-target) with manual wants
   - Subtracts current inventory
   - Respects exclusions

### Deck Management Flow

1. User navigates to `/decks` → `src/app/decks/page.tsx`
2. Page fetches:
   - `getDecks(userId)` — User's saved decks
   - `getWantList(userId)` — Cards wanted by any deck (for binder integration)
3. `<DecksClient>` allows:
   - Create new deck → calls `POST /api/decks`
   - Edit deck → calls `POST /api/decks/[id]` with card list
   - Delete deck → calls `DELETE /api/decks/[id]`
   - Validation via `validateDeck()` in `src/lib/deck-validation.ts`
4. Deck editor uses embedded `<CatalogClient mode="selector">` with `deckCounts` prop
5. User's changes update via `onDeckUpdate` callback → state → re-render

**State Management:**
- **URL Query Params**: Filter state (search, aspects, costs) via nuqs
  - Persists filter settings across navigation
  - Enables deep linking to filtered results
- **React Hooks**: Local UI state (selected tab, modal open/close, loading)
  - Component-level state for modal dialogs, expanding sections
- **API State**: Collection counts, deck contents fetched from server
  - Mutations cause client-side state updates + potential re-fetch
- **No global state library**: Keep logic in server + pass serialized data to client

## Key Abstractions

**CardForFilter:**
- Purpose: Shape for cards passed through filter pipeline
- Examples: `src/components/catalog/catalog-client.tsx`, `src/lib/filter-cards.ts`
- Pattern: Interface with id, name, type, aspects, cost, price, etc. + variant info
- Used in: Catalog filtering, deck building, binder variants

**OwnedCard / OwnedCardPrinting:**
- Purpose: User's collection view with per-variant granularity
- Examples: `src/db/queries/collection.ts`
- Pattern: Owned definition aggregates owned printing variants (Normal, Foil, Hyperspace)
- Used in: Binder display, collection import, variant chips

**CollectionMap:**
- Purpose: Efficient lookup of user's counts by definition and printing
- Shape: `{ [cardDefinitionId]: { total, variants: { [cardPrintingId]: count } } }`
- Location: `src/app/api/collection/collection-shape.ts`
- Used by: Client-side UI to display "you own 2" without re-fetching

**FilterState:**
- Purpose: Encapsulate all filter options
- Fields: search, selectedSets, selectedTypes, selectedAspects, selectedArenas, selectedTraits, selectedRarities, selectedKeywords, selectedCosts, selectedVariants, ownedOnly
- Location: `src/lib/filter-cards.ts`
- Used in: Catalog client, URL params binding

**PrintingArtMap:**
- Purpose: Map from card definition ID to best art variant (URL + type)
- Location: `src/lib/catalog/select-best-variant.ts`
- Pattern: Selects highest-precedence variant per definition (e.g., Foil > Normal)
- Used in: Card grid display, variant section headers

## Entry Points

**Public Pages:**
- `/` — Home page (`src/app/page.tsx`)
  - Triggers: Direct navigation or bookmark
  - Responsibilities: Display featured cards, top prices

- `/cards` — Card catalog (`src/app/cards/page.tsx`)
  - Triggers: Navigation via nav bar or deep link
  - Responsibilities: Fetch all cards, pass to CatalogClient with filters

- `/login` — Authentication (`src/app/(auth)/login/page.tsx`)
  - Triggers: Unauthenticated access to protected routes (redirected by proxy)
  - Responsibilities: OAuth buttons, email/password form

**Protected Pages:**
- `/collection` — Collection import & management (`src/app/collection/page.tsx`)
  - Requires: User session
  - Triggers: Authenticated user navigation
  - Responsibilities: CSV import, starter deck quick-add, set selection

- `/decks` — Deck management (`src/app/decks/page.tsx`)
  - Requires: User session
  - Triggers: Authenticated user navigation
  - Responsibilities: List decks, deck editor (with embedded catalog selector)

- `/binder/[username]` — Public binder view (`src/app/binder/[username]/page.tsx`)
  - Requires: None (public)
  - Responsibilities: Display user's trade binder

- `/binder/manage` — Personal binder editor (`src/app/binder/manage/page.tsx`)
  - Requires: User session
  - Triggers: Binder owner navigation
  - Responsibilities: Edit exclusions, trade offerings, view collection

**API Entry Points:**
- `POST /api/auth/*` — better-auth endpoints
  - Signup, login, OAuth callback, logout
- `GET /api/collection` — User's collection counts
- `POST /api/collection/variants` — Update variant count
- `POST /api/collection/import` — Bulk CSV import
- `POST /api/decks` — Create/update deck
- `DELETE /api/decks/[id]` — Delete deck
- `GET /api/binder/wants` — Public trade wants list

## Architectural Constraints

- **Threading:** Single-threaded event loop (Node.js/Vercel). Database operations are async/await, no Worker Threads.
- **Global state:** Auth session is per-request via better-auth. Database pool is module-level singleton (`src/db/index.ts`). No other mutable global state.
- **Circular imports:** None detected. Layer dependencies flow downward: Pages → Queries → Schema.
- **RSC boundary:** No Date objects, complex nested structures, or function references across server→client. Always serialize to plain objects explicitly.
- **Type safety:** Full TypeScript strict mode. Drizzle provides type-safe queries (no string-based SQL).
- **Database:** Read-only Neon connection string expected in `DATABASE_URL` env var. No migrations run at deploy time (managed separately via drizzle-kit).

## Anti-Patterns

### Passing Unserializable Objects Across RSC Boundary

**What happens:** Server component returns a Drizzle result with Date columns. Client component tries to use it. Serialization fails.

**Why it's wrong:** Next.js serializes props between server and client. Date objects, functions, Symbols cannot cross this boundary. Results in runtime errors in client components.

**Do this instead:** In server pages, map Drizzle results to plain objects with only needed fields:
```typescript
// src/app/cards/page.tsx
const cards = await getAllCards(); // Returns Drizzle rows with timestamps
const plainCards = cards.map(c => ({
  id: c.id,
  name: c.name,
  // ... explicitly list non-Date fields
}));
return <CatalogClient cards={plainCards} />;
```

### Using Query Params for Complex State

**What happens:** Trying to encode deck list, filter state, and sorting order all in URL params. URL becomes very long and hard to debug.

**Why it's wrong:** URL params have size limits and become hard to parse/maintain.

**Do this instead:** Use URL params only for simple, user-facing filters (search, aspects, costs) via nuqs. Keep deck/collection state in form submissions or API responses:
```typescript
// OK: Simple filters in URL
const [search] = useQueryState('q'); // ?q=kylo
// NOT OK: Entire deck list in URL
// const [deckList] = useQueryState('cards'); // ?cards=1,2,3,4,5,6...
```

### Missing User ID Validation in API Routes

**What happens:** API route updates user data without checking that `session.user.id` matches the ID in the request.

**Why it's wrong:** Users could mutate other users' data. Potential security issue.

**Do this instead:** Always validate session user ID matches the target user:
```typescript
// src/app/api/collection/variants/route.ts
const session = await auth.api.getSession({ headers });
if (!session) return new Response('Unauthorized', { status: 401 });

const userId = Number(session.user.id);
// Then only update data for this userId
await updateCardPrintingCount(userId, cardPrintingId, count);
```

### Mixing Business Logic into Components

**What happens:** Filter logic, calculations, or data transformations happen inside client components.

**Why it's wrong:** Logic becomes hard to test, reuse, and type safely. Repeated code across components.

**Do this instead:** Extract to `src/lib/*.ts` functions:
```typescript
// src/lib/binder-logic.ts — pure function, easy to test
export function calculateLookingFor(autoTarget, manualTarget, inventory, isExcluded) {
  // ...
}

// Then use in components
const lookingFor = calculateLookingFor(deckQty, manualQty, ownedQty, excluded);
```

## Error Handling

**Strategy:** Try-catch in API routes, error boundaries in components, console logging in dev

**Patterns:**
- API routes catch errors and return HTTP error status (400, 401, 500)
- Server pages let errors propagate (Next.js error boundary catches them)
- Client components use error boundary or state to show fallback UI
- Async operations check response.ok before parsing JSON
- Database errors logged to console with context (file, operation, userId)

**Examples:**
```typescript
// src/app/api/collection/route.ts
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return new Response('Unauthorized', { status: 401 });
    
    const rows = await getUserCollection(Number(session.user.id));
    return Response.json(buildCollectionMap(rows));
  } catch (error) {
    console.error('Failed to fetch collection:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
```

## Cross-Cutting Concerns

**Logging:** 
- Development: `console.log/error` in server and client
- Production: Errors logged to Vercel (captured by Vercel Speed Insights)
- No centralized logging service currently integrated

**Validation:**
- Database schema enforces non-null, unique constraints
- Business logic validates input (e.g., `validateDeck()`)
- API routes return 400 on invalid input
- Client-side form validation for UX (not security)

**Authentication:**
- better-auth middleware on API routes
- Middleware proxy (`src/proxy.ts`) guards `/collection` and `/decks`
- Redirect to `/login` for unauthenticated access to protected routes
- Session stored in secure HTTP-only cookie

---

*Architecture analysis: 2026-07-05*

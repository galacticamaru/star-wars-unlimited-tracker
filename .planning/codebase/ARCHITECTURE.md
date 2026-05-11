<!-- refreshed: 2025-02-14 -->
# Architecture

**Analysis Date:** 2025-02-14

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                      UI / App Layer                          │
│          `src/app` (Pages, Layouts, API Routes)             │
├──────────────────┬──────────────────┬───────────────────────┤
│   Catalog        │   Collection     │    Deck Builder       │
│  `src/app/cards` │`src/app/collection`│  `src/app/decks`    │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business / Logic Layer                    │
│         `src/lib`, `src/components`, `src/db/queries`        │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Data Persistence Layer                      │
│         `src/db/schema.ts`, Neon Postgres (Drizzle)          │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Auth | Authentication and Identity management using better-auth | `src/lib/auth.ts` |
| Database Client | Neon Postgres connection and Drizzle instance | `src/db/index.ts` |
| Schema | Data models and relationships | `src/db/schema.ts` |
| Queries | Encapsulated database access logic | `src/db/queries/` |
| Components | Reusable UI and feature-specific React components | `src/components/` |
| API Routes | Server-side endpoints for data operations | `src/app/api/` |

## Pattern Overview

**Overall:** Next.js App Router with Layered Architecture

**Key Characteristics:**
- **Server-First:** Heavily utilizes React Server Components (RSC) for data fetching.
- **Type-Safe:** End-to-end type safety using TypeScript and Drizzle ORM.
- **Feature-Grouped:** Components and logic are often grouped by feature (Catalog, Decks, Collection).

## Layers

**UI Layer:**
- Purpose: Handles routing, page layout, and user interaction.
- Location: `src/app`
- Contains: Next.js Pages, Layouts, and Client Components.
- Depends on: `src/components`, `src/db/queries`, `src/lib`
- Used by: End users.

**Logic Layer:**
- Purpose: Contains business rules, data validation, and helper functions.
- Location: `src/lib`, `src/db/queries`
- Contains: Auth configuration, deck validation, export logic, and DB queries.
- Depends on: `src/db`
- Used by: `src/app`, `src/components`

**Data Layer:**
- Purpose: Manages database schema and connection.
- Location: `src/db`
- Contains: Drizzle schema definitions and client initialization.
- Depends on: `@neondatabase/serverless`, `drizzle-orm`
- Used by: `src/db/queries`, `src/lib/auth.ts`

## Data Flow

### Primary Request Path (Server Component)

1. User navigates to a page (`src/app/cards/[set-code]/[card-number]/page.tsx`)
2. Page component calls a query function (`src/db/queries/card-detail.ts`)
3. Query function uses `db` instance (`src/db/index.ts`) to fetch data from Neon Postgres.
4. Data is passed to UI components (`src/components/catalog/card-item.tsx`) and rendered.

### API Request Path (Client Interaction)

1. Client component (`src/components/decks/deck-builder.tsx`) makes a `fetch` call to an API route (`src/app/api/decks/route.ts`).
2. API route validates the session using `auth.getSession()` (`src/lib/auth.ts`).
3. API route performs database operations via queries or direct Drizzle calls.
4. API route returns JSON response to the client.

**State Management:**
- **Server State:** Managed by Next.js request lifecycle and RSC.
- **Client State:** React `useState`/`useContext` (e.g., `src/components/currency-context.tsx`).
- **Auth State:** Managed by `better-auth`.

## Key Abstractions

**Drizzle Schema:**
- Purpose: Single source of truth for the database structure.
- Examples: `src/db/schema.ts`
- Pattern: Table definitions with Drizzle ORM.

**Feature Queries:**
- Purpose: Grouped database access logic by entity.
- Examples: `src/db/queries/decks.ts`, `src/db/queries/catalog.ts`
- Pattern: Repository-like functions.

## Entry Points

**Main App:**
- Location: `src/app/page.tsx`
- Triggers: Root URL access.
- Responsibilities: Renders the landing page/dashboard.

**Auth API:**
- Location: `src/app/api/auth/[...all]/route.ts`
- Triggers: Login/Logout/Session check actions.
- Responsibilities: Handles all better-auth requests.

## Architectural Constraints

- **Threading:** Single-threaded Node.js environment (Serverless/Vercel).
- **Global state:** Minimal global state; prefers context providers for shared UI state.
- **Database:** Uses Neon serverless Postgres, requiring WebSocket connection in some environments (`src/db/index.ts`).

## Anti-Patterns

### Logic in Components

**What happens:** Complex business logic or data fetching performed directly inside client components.
**Why it's wrong:** Makes testing difficult and duplicates logic across the codebase.
**Do this instead:** Move logic to `src/lib` or `src/db/queries` and use Server Components where possible.

## Error Handling

**Strategy:** Layered error handling with Toast notifications on the client.

**Patterns:**
- Try/Catch blocks in API routes returning appropriate HTTP status codes.
- Global `error.tsx` for catching UI-level errors in Next.js.

## Cross-Cutting Concerns

**Logging:** Standard console logging (could be expanded to a service).
**Validation:** Zod-like validation patterns for API inputs and deck rules (`src/lib/deck-validation.ts`).
**Authentication:** Centralized in `src/lib/auth.ts` and checked in API routes.

---

*Architecture analysis: 2025-02-14*

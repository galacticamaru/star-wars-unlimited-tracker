<!-- refreshed: 2026-05-08 -->
# Codebase Structure

**Analysis Date:** 2026-05-08

## Directory Layout

```
star-wars-unlimited-tracker/
├── src/
│   ├── app/                          # Next.js App Router — pages and API routes
│   │   ├── layout.tsx                # Root layout: fonts, NavBar, NuqsAdapter
│   │   ├── page.tsx                  # Home / Card Catalog (Server Component)
│   │   ├── globals.css               # Global Tailwind base styles
│   │   ├── collection/
│   │   │   └── page.tsx              # Collection import (CSV upload) — 'use client'
│   │   ├── cards/
│   │   │   └── [set-code]/
│   │   │       └── [card-number]/
│   │   │           └── page.tsx      # Card detail page (Server Component)
│   │   ├── decks/
│   │   │   ├── page.tsx              # Deck list + global want list — 'use client'
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Deck builder host (Server Component)
│   │   │       └── page.test.tsx     # Deck list page tests
│   │   └── api/
│   │       ├── collection/
│   │       │   ├── route.ts          # GET (count map) / POST (upsert count)
│   │       │   ├── import/
│   │       │   │   └── route.ts      # POST — bulk CSV import
│   │       │   └── sets/
│   │       │       └── route.ts      # GET — distinct set codes
│   │       ├── decks/
│   │       │   ├── route.ts          # GET (list) / POST (create)
│   │       │   └── [id]/
│   │       │       ├── route.ts      # GET / PATCH (update+validate) / DELETE
│   │       │       └── export/
│   │       │           └── route.ts  # GET — download Melee .txt or JSON
│   │       ├── want-list/
│   │       │   └── route.ts          # GET — shortfall computation
│   │       └── cron/
│   │           └── sync-cards/
│   │               └── route.ts      # GET — CRON_SECRET guarded card sync
│   ├── components/
│   │   ├── nav-bar.tsx               # Sticky top navigation bar
│   │   ├── catalog/                  # Card catalog UI components
│   │   │   ├── catalog-client.tsx    # Top-level catalog 'use client' — filter state + collection
│   │   │   ├── card-grid.tsx         # Responsive CSS grid wrapper
│   │   │   ├── card-item.tsx         # Card tile — 3 modes (catalog/selector/want-list)
│   │   │   ├── card-image-section.tsx# Card detail image + Leader flip toggle
│   │   │   ├── collection-controls.tsx # +/- owned count widget (card detail page)
│   │   │   ├── top-bar.tsx           # Sticky filter bar — search + dropdowns + cost buttons
│   │   │   ├── filter-dropdown.tsx   # Multi/single select dropdown filter
│   │   │   └── empty-state.tsx       # No results placeholder
│   │   ├── decks/                    # Deck builder UI components
│   │   │   ├── deck-builder.tsx      # Full editor — useReducer + 3-view tabs
│   │   │   ├── deck-sidebar.tsx      # Validation panel + cost curve + save buttons
│   │   │   └── want-list-tab.tsx     # Per-deck shortfall view inside builder
│   │   └── ui/                       # shadcn/ui primitives (generated)
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── dropdown-menu.tsx
│   │       └── input.tsx
│   ├── db/
│   │   ├── index.ts                  # Neon Pool + drizzle client singleton (DATABASE_URL required)
│   │   ├── schema.ts                 # All Drizzle table definitions (single file)
│   │   └── queries/                  # DB query functions — one file per domain
│   │       ├── catalog.ts            # getAllCards(), getFilterOptions()
│   │       ├── card-detail.ts        # getCardByPrinting()
│   │       ├── collection.ts         # getUserCollection(), upsertCardCount()
│   │       ├── decks.ts              # Full CRUD + export + want-list queries
│   │       └── catalog.test.ts       # Query integration tests
│   └── lib/                          # Pure business logic — no HTTP, no DB (except sync)
│       ├── utils.ts                  # cn() Tailwind class merge utility
│       ├── filter-cards.ts           # filterCards() pure function + CardForFilter type
│       ├── deck-validation.ts        # validateDeck() + Card/DeckCard/ValidationResult types
│       ├── export.ts                 # toMeleeFormat() / toJSONFormat()
│       ├── collection/
│       │   └── normalize.ts          # normalizeRedditCsv() — Reddit CSV → collectorNumber map
│       └── sync/
│           └── upsert-cards.ts       # syncAllCards() + upsertCards() — swu-db.com ingestion
├── __tests__/                        # Integration / API tests (vitest)
│   ├── api-deck-validation.test.ts
│   ├── cron-route.test.ts
│   └── upsert-cards.test.ts
├── drizzle/                          # Drizzle Kit migration output (generated)
│   └── meta/                         # Migration metadata
├── scripts/
│   └── seed.ts                       # Manual seed script (calls syncAllCards)
├── public/                           # Static assets
├── next.config.ts                    # Next.js config — image remotePatterns + unoptimized flag
├── drizzle.config.ts                 # Drizzle Kit config — schema path, dialect, credentials
├── vercel.json                       # Vercel Cron config — /api/cron/sync-cards at 06:00 UTC daily
├── vitest.config.mts                 # Vitest config
├── tsconfig.json                     # TypeScript config — includes @/ path alias
├── components.json                   # shadcn/ui CLI config
├── eslint.config.mjs                 # ESLint config
└── package.json                      # Dependencies and scripts
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router — all pages (server and client) and API route handlers
- Contains: `page.tsx` files (UI pages), `route.ts` files (API endpoints), `layout.tsx`, `globals.css`
- Key files: `src/app/layout.tsx` (root), `src/app/page.tsx` (catalog home)

**`src/app/api/`:**
- Purpose: All HTTP API endpoints consumed by client components
- Contains: Route handlers using Next.js named exports (`GET`, `POST`, `PATCH`, `DELETE`)
- Convention: One `route.ts` per logical resource, nested under resource name

**`src/components/catalog/`:**
- Purpose: All card catalog UI — browsing, filtering, collection management
- Contains: Client components with `'use client'` directive where state/effects needed
- Key files: `catalog-client.tsx` (top-level orchestrator), `card-item.tsx` (leaf component with 3 modes)

**`src/components/decks/`:**
- Purpose: Deck builder UI — editor, sidebar, want list
- Contains: Client components; `deck-builder.tsx` is the root with `useReducer` state

**`src/components/ui/`:**
- Purpose: shadcn/ui primitive components — generated, not hand-written
- Contains: `button.tsx`, `badge.tsx`, `input.tsx`, `dropdown-menu.tsx`
- Note: Add new primitives via `npx shadcn-ui add <component>`, do not hand-edit

**`src/db/`:**
- Purpose: All database concerns — connection, schema, queries
- Contains: `index.ts` (singleton), `schema.ts` (table definitions), `queries/` (domain query functions)
- Key constraint: `src/db/index.ts` throws at module load if `DATABASE_URL` is missing

**`src/db/queries/`:**
- Purpose: Typed query functions organized by domain — the only place Drizzle ORM is used
- Contains: Pure async functions returning typed results; no business logic, no HTTP
- Convention: One file per domain (catalog, collection, decks, card-detail)

**`src/lib/`:**
- Purpose: Pure domain logic — no side effects except `sync/` which calls DB
- Contains: Type interfaces, filter logic, validation, export formatting, CSV normalization
- Key files: `filter-cards.ts` (client-side filtering), `deck-validation.ts` (SWU Premier rules)

**`__tests__/`:**
- Purpose: Integration and API-level tests that require a running DB or HTTP mocking
- Contains: vitest tests that are co-located by concern (not by source file)

**`drizzle/`:**
- Purpose: Auto-generated migration files from `drizzle-kit generate`
- Generated: Yes — do not hand-edit
- Committed: Yes

**`scripts/`:**
- Purpose: One-off operational scripts
- Contains: `seed.ts` — manual trigger for `syncAllCards()`

## Naming Conventions

**Files:**
- Pages: `page.tsx` (required by Next.js App Router)
- API routes: `route.ts` (required by Next.js App Router)
- Components: kebab-case `.tsx` — e.g., `card-item.tsx`, `deck-builder.tsx`, `catalog-client.tsx`
- Lib utilities: kebab-case `.ts` — e.g., `filter-cards.ts`, `deck-validation.ts`
- DB queries: kebab-case `.ts` matching domain — e.g., `catalog.ts`, `card-detail.ts`
- Tests co-located with source: `<name>.test.tsx` or `<name>.test.ts`
- Tests with browser/deck specificity: `<name>.browser.test.tsx`, `<name>.deck.test.tsx`

**Directories:**
- Route segments: kebab-case for static (`sync-cards/`), bracket-wrapped for dynamic (`[id]/`, `[set-code]/`)
- Component groupings: flat noun-based (`catalog/`, `decks/`, `ui/`)
- Lib groupings: noun-based (`collection/`, `sync/`)

**Exports:**
- Components: Named exports — e.g., `export function CatalogClient(...)`, `export function CardItem(...)`
- Pages: Default exports — `export default async function CatalogPage(...)`, `export default function DecksPage(...)`
- API routes: Named exports matching HTTP verb — `export async function GET(...)`, `export async function POST(...)`
- Lib functions: Named exports — `export function filterCards(...)`, `export function validateDeck(...)`

**TypeScript:**
- Interfaces: PascalCase — `CardForFilter`, `DeckState`, `ValidationResult`, `ExportDeck`
- Types (union): PascalCase — `DeckAction`
- Props interfaces: `<ComponentName>Props` — e.g., `CardItemProps`, `DeckBuilderProps`

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root HTML shell, fonts, NavBar, NuqsAdapter
- `src/app/page.tsx`: Catalog (home page) — server-side data fetch
- `src/db/index.ts`: DB client singleton — imported by all query files

**Configuration:**
- `src/db/schema.ts`: Single file with all 5 table definitions (card_definitions, card_printings, user_collections, decks, deck_cards)
- `drizzle.config.ts`: Drizzle Kit — points to `./src/db/schema.ts`, dialect `postgresql`
- `next.config.ts`: Image remotePatterns for `cdn.swu-db.com`, `unoptimized: true` (temporary)
- `vercel.json`: Cron schedule for card sync
- `tsconfig.json`: `@/` alias maps to `./src`

**Core Business Logic:**
- `src/lib/filter-cards.ts`: Client-side card filtering (AND-across-categories, OR-within)
- `src/lib/deck-validation.ts`: SWU Premier rules validator — leader, base, 50-card minimum, 3-copy limit
- `src/lib/sync/upsert-cards.ts`: External API ingestion — swu-db.com → DB

**Testing:**
- `__tests__/`: Integration-level tests
- `src/db/queries/catalog.test.ts`: Query-level unit tests
- `src/app/decks/page.test.tsx`: Page component test
- `src/components/catalog/card-item.browser.test.tsx`: Component browser tests
- `src/components/catalog/card-item.deck.test.tsx`: Deck mode component tests
- `src/components/catalog/catalog-client.browser.test.tsx`: Catalog client browser tests
- `src/lib/deck-validation.test.ts`: Validation pure function tests
- `src/lib/export.test.ts`: Export formatter tests
- `src/lib/filter-cards.test.ts`: Filter function tests

## Where to Add New Code

**New API route:**
- Create directory: `src/app/api/<resource>/route.ts`
- For dynamic segments: `src/app/api/<resource>/[id]/route.ts`
- Pattern: Call query functions from `src/db/queries/`, use `try/catch` returning `Response.json()` or `new Response(text, { status: N })`
- Always hardcode `userId = 1` until auth is implemented (v2)

**New DB query:**
- If domain exists: add function to the relevant `src/db/queries/<domain>.ts`
- If new domain: create `src/db/queries/<domain>.ts`, import `db` from `@/db` and tables from `@/db/schema`
- Return typed results using Drizzle's inferred types

**New DB table:**
- Add to `src/db/schema.ts` — the single schema file
- Run `npx drizzle-kit generate` to create migration, then `npx drizzle-kit migrate`

**New page:**
- Server component (preferred for data-heavy pages): `src/app/<route>/page.tsx` as `async` function, fetch data directly from query layer
- Client page (if needs hooks at root): add `'use client'`, fetch from API routes in `useEffect`
- Serialize Drizzle results to plain objects before passing as props to client components

**New catalog component:**
- Location: `src/components/catalog/<kebab-name>.tsx`
- Add `'use client'` if component uses hooks or event handlers

**New deck component:**
- Location: `src/components/decks/<kebab-name>.tsx`

**New UI primitive:**
- Use shadcn/ui CLI: `npx shadcn-ui add <component>` → auto-places in `src/components/ui/`
- Do not hand-create files in `src/components/ui/`

**New pure utility:**
- Location: `src/lib/<kebab-name>.ts`
- Must be side-effect-free (no DB, no fetch) — if it needs DB, place in `src/lib/sync/` or reconsider

**New test (unit/pure):**
- Co-locate with source file: `src/lib/<name>.test.ts`, `src/components/catalog/<name>.test.tsx`

**New test (integration/API):**
- Location: `__tests__/<concern>.test.ts`

## Special Directories

**`drizzle/`:**
- Purpose: Drizzle Kit migration SQL files and metadata
- Generated: Yes — by `npx drizzle-kit generate`
- Committed: Yes — migration history is source-controlled

**`__tests__/`:**
- Purpose: Integration and API-level tests separated from source
- Generated: No — hand-written

**`.planning/`:**
- Purpose: GSD planning artifacts — roadmap, phases, codebase maps
- Generated: Partially — written by GSD commands
- Committed: Yes

**`.claude/`:**
- Purpose: Claude agent skills and worktree configs
- Contains: `skills/neon-postgres/` — Neon Postgres skill reference docs

---

*Structure analysis: 2026-05-08*

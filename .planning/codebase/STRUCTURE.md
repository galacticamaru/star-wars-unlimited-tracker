---
focus: arch
last_updated: 2026-05-28
---
# Codebase Structure

**Analysis Date:** 2026-05-28

## Directory Layout

```
star-wars-unlimited-tracker/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (fonts, NavBar, providers)
│   │   ├── page.tsx                  # Home page (RSC)
│   │   ├── globals.css               # Global styles
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx          # Login/signup form (Client Component)
│   │   ├── api/
│   │   │   ├── auth/[...all]/        # better-auth catch-all handler
│   │   │   ├── binder/               # Trade binder endpoints
│   │   │   │   ├── route.ts          # GET binder data
│   │   │   │   ├── exclusions/       # POST toggle exclusion
│   │   │   │   └── wants/            # POST upsert manual want
│   │   │   ├── cards/
│   │   │   │   └── all/route.ts      # GET lightweight card list (name, art, type)
│   │   │   ├── collection/
│   │   │   │   ├── route.ts          # GET collection map
│   │   │   │   ├── collection-shape.ts   # CollectionMap type + buildCollectionMap()
│   │   │   │   ├── collection-shape.test.ts
│   │   │   │   ├── import/route.ts   # POST CSV import
│   │   │   │   ├── owned-cards/route.ts  # GET owned card list for binder
│   │   │   │   ├── sets/route.ts     # GET available set codes
│   │   │   │   ├── starter-deck/route.ts # POST quick-add starter deck
│   │   │   │   └── variants/route.ts # POST update per-variant count
│   │   │   ├── cron/sync-cards/route.ts  # GET cron — card + price sync
│   │   │   ├── decks/
│   │   │   │   ├── route.ts          # GET list / POST create deck
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts      # GET / PATCH / DELETE deck
│   │   │   │       └── export/route.ts  # GET export deck as text
│   │   │   ├── trade/route.ts        # PATCH trade offering quantity
│   │   │   └── want-list/route.ts    # GET computed want list
│   │   ├── binder/
│   │   │   ├── [username]/page.tsx   # Public binder view (RSC)
│   │   │   └── manage/page.tsx       # Manage trade binder (Client Component)
│   │   ├── cards/
│   │   │   ├── page.tsx              # Catalog page (RSC)
│   │   │   └── [set-code]/
│   │   │       └── [card-number]/
│   │   │           └── page.tsx      # Card detail page (RSC)
│   │   ├── collection/
│   │   │   ├── page.tsx              # Collection import page (Client Component)
│   │   │   └── page.test.tsx
│   │   └── decks/
│   │       ├── page.tsx              # Deck list page (RSC)
│   │       ├── page.test.tsx
│   │       └── [id]/
│   │           ├── page.tsx          # Deck builder page (RSC)
│   │           ├── loading.tsx
│   │           └── loading.test.tsx
│   ├── components/
│   │   ├── nav-bar.tsx               # Top navigation (Client Component)
│   │   ├── currency-context.tsx      # CurrencyProvider + useCurrency hook
│   │   ├── binder/                   # Trade binder UI components
│   │   │   ├── manage-trade-card.tsx
│   │   │   ├── manage-wants-list.tsx
│   │   │   ├── manual-wants-add-flow.tsx
│   │   │   ├── public-binder-client.tsx
│   │   │   └── variant-trade-sheet.tsx
│   │   ├── catalog/                  # Card catalog UI components
│   │   │   ├── catalog-client.tsx    # Filter orchestrator (nuqs state)
│   │   │   ├── card-grid.tsx         # Virtualized card grid
│   │   │   ├── card-item.tsx         # Single card tile
│   │   │   ├── card-image-section.tsx
│   │   │   ├── collection-controls.tsx
│   │   │   ├── empty-state.tsx
│   │   │   ├── filter-dropdown.tsx
│   │   │   ├── mobile-filter-sheet.tsx
│   │   │   ├── sidebar-filters.tsx
│   │   │   ├── top-bar.tsx
│   │   │   ├── variant-collection-section.tsx
│   │   │   ├── variant-filter.tsx
│   │   │   ├── variant-trade-section.tsx
│   │   │   └── *.test.tsx            # Co-located tests
│   │   ├── decks/                    # Deck builder UI components
│   │   │   ├── deck-builder.tsx      # Main builder (useReducer)
│   │   │   ├── deck-sidebar.tsx
│   │   │   ├── decks-client.tsx
│   │   │   └── want-list-tab.tsx
│   │   ├── home/                     # Home page components
│   │   │   ├── hero-section.tsx
│   │   │   ├── hero-section.test.tsx
│   │   │   ├── high-value-grid.tsx
│   │   │   └── high-value-grid.test.tsx
│   │   └── ui/                       # shadcn/ui primitives
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── sheet.tsx
│   │       ├── switch.tsx
│   │       ├── tabs.tsx
│   │       └── tooltip.tsx
│   ├── data/
│   │   └── starter-decks.ts          # Static starter deck card lists
│   ├── db/
│   │   ├── index.ts                  # Neon pool + drizzle client singleton
│   │   ├── schema.ts                 # All 11 table definitions
│   │   └── queries/                  # Domain query files
│   │       ├── catalog.ts            # Card + printing queries (cached)
│   │       ├── catalog.test.ts
│   │       ├── collection.ts         # User collection queries
│   │       ├── collection.test.ts
│   │       ├── binder.ts             # Trade binder queries
│   │       ├── card-detail.ts        # Single card + printings query
│   │       ├── decks.ts              # Deck CRUD queries
│   │       └── trade.ts              # Trade offering queries
│   ├── lib/
│   │   ├── auth.ts                   # better-auth server instance
│   │   ├── auth-client.ts            # better-auth React client
│   │   ├── filter-cards.ts           # filterCards() + CardForFilter type
│   │   ├── auto-filter.ts            # computeAutoFilter() for deck builder
│   │   ├── binder-logic.ts           # calculateLookingFor() pure function
│   │   ├── deck-grouping.ts          # groupDeckCards() by type/arena
│   │   ├── deck-validation.ts        # Card/DeckCard types + ValidationStats
│   │   ├── export.ts                 # Deck export formatter
│   │   ├── want-list.ts              # getWantList() — cross-deck aggregation
│   │   ├── utils.ts                  # cn() tailwind class helper
│   │   ├── aspect-panel.ts           # Aspect panel utilities
│   │   ├── catalog/
│   │   │   └── select-best-variant.ts  # selectBestVariantArtUrl() + VARIANT_PRECEDENCE
│   │   ├── collection/
│   │   │   ├── normalize.ts          # normalizeRedditCsv() for CSV import
│   │   │   └── normalize.test.ts
│   │   └── sync/
│   │       ├── upsert-cards.ts       # syncAllCards() from swu-db.com
│   │       ├── prices.ts             # syncPrices() from swu-db.com
│   │       └── prices.test.ts
│   └── proxy.ts                      # Route protection (replaces middleware.ts)
├── __tests__/                        # Legacy root-level test directory
│   ├── api-deck-validation.test.ts
│   ├── aspect-panel.test.ts
│   ├── collection-page.test.tsx
│   ├── cron-route.test.ts
│   ├── deck-grouping.test.ts
│   ├── upsert-cards.test.ts
│   └── variant-filter.test.ts
├── tests/                            # Newer root-level test directory
│   ├── auth-config.test.ts
│   ├── auth-protection.test.ts
│   ├── binder-flow.test.ts
│   ├── binder-manage-render.test.tsx
│   ├── binder-public-render.test.tsx
│   ├── binder-queries.test.ts
│   ├── catalog-variant.test.ts
│   ├── data-isolation.test.ts
│   ├── migration-hook.test.ts
│   ├── navbar-binder.test.tsx
│   ├── sideboard-filter.test.ts
│   ├── starter-deck-api.test.ts
│   └── trade-api.test.ts
├── drizzle/                          # Drizzle migration files
│   └── meta/
├── scripts/                          # One-off utility scripts
├── public/                           # Static assets
├── .claude/skills/neon-postgres/     # Project skill definitions
├── .planning/                        # GSD planning docs
│   ├── codebase/                     # Codebase map documents
│   ├── milestones/                   # Milestone phase plans
│   └── phases/                       # Active phase plans
├── next.config.ts
├── drizzle.config.ts
├── tsconfig.json
├── vitest.config.mts
├── eslint.config.mjs
├── components.json                   # shadcn/ui config
├── vercel.json                       # Cron schedule
└── swagger.yaml                      # API spec
```

## Directory Purposes

**`src/app/`:**
- Purpose: All Next.js App Router routes — pages, layouts, and API route handlers
- Contains: RSC page files (`page.tsx`), `layout.tsx`, `loading.tsx`, `(auth)` route group, `api/` subdirectory
- Key files: `src/app/layout.tsx` (root layout), `src/app/page.tsx` (home RSC)

**`src/app/api/`:**
- Purpose: All REST API endpoints consumed by client components and external callers
- Contains: One `route.ts` per logical endpoint; `collection-shape.ts` co-located with collection routes
- Key files: `src/app/api/collection/variants/route.ts` (variant count mutation), `src/app/api/cron/sync-cards/route.ts`

**`src/components/`:**
- Purpose: All React components; split into feature-domain subdirectories
- Contains: Client Components (all annotated `'use client'`) and a few pure-presentational components
- Key files: `src/components/catalog/catalog-client.tsx` (main filter orchestrator), `src/components/decks/deck-builder.tsx`

**`src/components/ui/`:**
- Purpose: shadcn/ui primitive components; do not modify directly — regenerate via `npx shadcn`
- Contains: Radix UI wrappers with Tailwind class variants
- Generated: Yes (via shadcn CLI); Committed: Yes

**`src/db/`:**
- Purpose: Database schema definition and all Drizzle query functions
- Contains: `schema.ts` (single source of truth for DB structure), `index.ts` (connection), `queries/` (domain files)
- Key files: `src/db/schema.ts`, `src/db/index.ts`

**`src/db/queries/`:**
- Purpose: All database queries, organized one file per feature domain
- Contains: Exported async functions used by RSC pages and API routes

**`src/lib/`:**
- Purpose: Pure business logic, domain types, auth configuration, sync utilities
- Contains: No React code (except auth-client which wraps better-auth); no Drizzle imports except `auth.ts` and `want-list.ts`

**`src/lib/sync/`:**
- Purpose: External API sync logic for card data and prices from swu-db.com
- Contains: `upsert-cards.ts`, `prices.ts`

**`src/lib/catalog/`:**
- Purpose: Catalog-specific business logic (variant art selection)
- Contains: `select-best-variant.ts` with `VARIANT_PRECEDENCE` constants

**`src/lib/collection/`:**
- Purpose: Collection import utilities
- Contains: `normalize.ts` for Reddit CSV normalization

**`src/data/`:**
- Purpose: Static data files committed to the repo
- Contains: `starter-decks.ts` — hardcoded starter deck card lists with collector numbers

**`__tests__/`:**
- Purpose: Original root-level test directory (legacy location)
- Generated: No; Committed: Yes

**`tests/`:**
- Purpose: Current root-level test directory for v2+ feature tests
- Generated: No; Committed: Yes

**`drizzle/`:**
- Purpose: Drizzle migration SQL files and metadata
- Generated: Yes (via `drizzle-kit`); Committed: Yes

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root layout — providers, fonts, global nav
- `src/app/page.tsx`: Home page RSC
- `src/app/cards/page.tsx`: Catalog RSC — primary app entry
- `src/app/decks/page.tsx`: Deck list RSC
- `src/app/binder/[username]/page.tsx`: Public binder RSC

**Configuration:**
- `src/db/schema.ts`: Database schema (source of truth for all tables)
- `src/db/index.ts`: Database connection — Neon pool + drizzle
- `src/lib/auth.ts`: better-auth server config (providers, plugins, hooks)
- `src/lib/auth-client.ts`: better-auth client config
- `next.config.ts`: Next.js config (image domains, cacheComponents)
- `drizzle.config.ts`: Drizzle migration config
- `vercel.json`: Cron schedule definition
- `components.json`: shadcn/ui component registry config

**Core Logic:**
- `src/lib/filter-cards.ts`: `filterCards()` — all catalog/binder filtering
- `src/lib/auto-filter.ts`: Deck builder smart filter derivation
- `src/lib/binder-logic.ts`: `calculateLookingFor()` — binder want quantity logic
- `src/lib/want-list.ts`: `getWantList()` — cross-deck card shortfall computation
- `src/lib/deck-validation.ts`: Shared `Card` and `DeckCard` types
- `src/lib/catalog/select-best-variant.ts`: `VARIANT_PRECEDENCE` + art selection
- `src/app/api/collection/collection-shape.ts`: `CollectionMap` type + builder

**Testing:**
- `vitest.config.mts`: Vitest configuration
- `__tests__/`: Legacy test files (older features)
- `tests/`: Current test files (v2–v5 features)
- Co-located: `src/components/catalog/*.test.tsx`, `src/db/queries/*.test.ts`, `src/lib/*.test.ts`

## Naming Conventions

**Files:**
- Components: `kebab-case.tsx` (e.g., `catalog-client.tsx`, `deck-builder.tsx`)
- Route handlers: always `route.ts`
- Test files: `[name].test.ts` or `[name].test.tsx` — co-located with source or in `__tests__/` / `tests/`
- Browser-specific tests: `[name].browser.test.tsx`
- Domain-specific tests: `[name].deck.test.tsx`

**Directories:**
- Feature domains: `kebab-case/` (e.g., `catalog/`, `deck-builder/`, `binder/`)
- Route segments: `kebab-case/` for static, `[param-name]/` for dynamic (e.g., `[set-code]/`, `[card-number]/`)

**Exports:**
- Named exports for components (e.g., `export function CatalogClient`)
- Default exports for page/layout files (Next.js requirement)
- Named exports for all `src/lib/` and `src/db/queries/` functions

## Where to Add New Code

**New Feature Page (RSC with client component):**
1. Create `src/app/[feature]/page.tsx` — async RSC; fetch data with DB query, serialize to plain objects
2. Create `src/components/[feature]/[feature]-client.tsx` — `'use client'`; receive props from RSC
3. Add any sub-components to `src/components/[feature]/`
4. Add API routes to `src/app/api/[feature]/route.ts`
5. Add DB query functions to `src/db/queries/[feature].ts`
6. Add pure logic to `src/lib/[feature-logic].ts`
7. Add tests to `tests/[feature].test.ts` or co-locate as `src/components/[feature]/[component].test.tsx`

**New API Endpoint:**
- Implementation: `src/app/api/[resource]/route.ts`
- Auth guard: always open with `auth.api.getSession({ headers: await headers() })` and return 401 if no session
- Extract `userId` from `session.user.id` only, never from request body

**New Database Table:**
- Add table definition to `src/db/schema.ts`
- Add query functions to `src/db/queries/[domain].ts`
- Run `npx drizzle-kit generate` to create migration, then `npx drizzle-kit migrate`

**New shadcn/ui Component:**
- Run `npx shadcn add [component]` — output lands in `src/components/ui/`
- Do not hand-edit generated files; configure via `components.json`

**New Pure Logic:**
- Shared utility: `src/lib/[name].ts`
- Domain-specific: `src/lib/[domain]/[name].ts`
- Must be free of React imports; no Drizzle unless absolutely necessary

## Special Directories

**`.planning/codebase/`:**
- Purpose: GSD codebase map documents (ARCHITECTURE.md, STRUCTURE.md, etc.)
- Generated: Yes (by GSD mapper); Committed: Yes

**`.planning/milestones/` and `.planning/phases/`:**
- Purpose: GSD planning documents for past and active development phases
- Generated: Yes; Committed: Yes

**`.claude/skills/`:**
- Purpose: Project-specific skill definitions for Claude agents
- Contains: `neon-postgres/` with SKILL.md and rules
- Generated: No; Committed: Yes

**`drizzle/`:**
- Purpose: Drizzle migration SQL files generated by `drizzle-kit`
- Generated: Yes; Committed: Yes

**`public/`:**
- Purpose: Static assets served at root URL
- Generated: No; Committed: Yes

---

*Structure analysis: 2026-05-28*

# Codebase Structure

**Analysis Date:** 2026-07-05

## Directory Layout

```
project-root/
├── src/
│   ├── app/                    # Next.js App Router pages & API routes
│   │   ├── layout.tsx          # Root layout (fonts, providers, nav)
│   │   ├── page.tsx            # Home page
│   │   ├── (auth)/             # Auth routes group (public)
│   │   │   └── login/
│   │   │       └── page.tsx    # Login page (OAuth + email/password)
│   │   ├── cards/              # Card catalog
│   │   │   ├── page.tsx        # Catalog page (server)
│   │   │   └── [set-code]/
│   │   │       └── [card-number]/
│   │   │           └── page.tsx # Card detail page
│   │   ├── collection/         # Collection management (protected)
│   │   │   └── page.tsx        # Import CSV, add starter decks
│   │   ├── decks/              # Deck builder & list (protected)
│   │   │   ├── page.tsx        # Decks list page
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Deck editor page
│   │   ├── binder/             # Trade binder
│   │   │   ├── [username]/
│   │   │   │   └── page.tsx    # Public binder view
│   │   │   └── manage/
│   │   │       └── page.tsx    # Personal binder editor (protected)
│   │   └── api/                # API routes
│   │       ├── auth/           # better-auth endpoints
│   │       │   └── [...all]/route.ts
│   │       ├── collection/     # Collection mutations & exports
│   │       │   ├── route.ts    # GET collection counts
│   │       │   ├── import/route.ts      # POST CSV import
│   │       │   ├── owned-cards/route.ts # GET owned definitions
│   │       │   ├── sets/route.ts        # GET available sets
│   │       │   ├── starter-deck/route.ts # POST add starter deck
│   │       │   └── variants/route.ts    # POST update variant count
│   │       ├── cards/
│   │       │   └── all/route.ts # GET all cards for catalog
│   │       ├── decks/          # Deck CRUD
│   │       │   ├── route.ts    # POST create deck
│   │       │   └── [id]/
│   │       │       ├── route.ts      # GET/POST/DELETE deck
│   │       │       └── export/route.ts # POST export deck
│   │       ├── binder/         # Binder & trade operations
│   │       │   ├── exclusions/route.ts
│   │       │   └── wants/route.ts
│   │       ├── trade/          # Trade management
│   │       │   └── route.ts
│   │       ├── want-list/      # Want list for binder integration
│   │       │   └── route.ts
│   │       └── cron/           # Background jobs
│   │           └── sync-cards/route.ts # Sync card DB from external API
│   │
│   ├── components/             # React components
│   │   ├── nav-bar.tsx         # Navigation component
│   │   ├── currency-context.tsx # Currency provider (USD/EUR)
│   │   ├── ui/                 # shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── sheet.tsx       # Mobile side panel
│   │   │   ├── tabs.tsx
│   │   │   ├── tooltip.tsx
│   │   │   └── ...
│   │   ├── home/               # Home page components
│   │   │   ├── hero-section.tsx
│   │   │   └── high-value-grid.tsx
│   │   ├── catalog/            # Card catalog & selector
│   │   │   ├── catalog-client.tsx      # Main catalog (filter state)
│   │   │   ├── card-grid.tsx           # Virtualized card list
│   │   │   ├── card-item.tsx           # Single card tile
│   │   │   ├── card-image-section.tsx  # Image & variant display
│   │   │   ├── sidebar-filters.tsx     # Filter UI
│   │   │   ├── mobile-filter-sheet.tsx # Mobile filter drawer
│   │   │   ├── top-bar.tsx             # Search & sort bar
│   │   │   ├── filter-dropdown.tsx     # Multi-select dropdown
│   │   │   ├── variant-filter.tsx      # Variant selection
│   │   │   ├── variant-collection-section.tsx # Collection counts
│   │   │   └── variant-trade-section.tsx      # Trade info
│   │   ├── decks/              # Deck builder components
│   │   │   ├── decks-client.tsx        # Decks list & editor
│   │   │   ├── deck-form.tsx           # Create/edit form
│   │   │   ├── deck-detail.tsx         # Deck view/edit
│   │   │   ├── card-in-deck.tsx        # Card in deck row
│   │   │   └── ...
│   │   └── binder/             # Trade binder components
│   │       ├── binder-client.tsx       # Binder editor
│   │       ├── binder-sections.tsx     # Owned/excluded/offers
│   │       ├── trade-offer-row.tsx     # Single trade offer
│   │       └── ...
│   │
│   ├── lib/                    # Business logic & utilities
│   │   ├── auth.ts             # better-auth configuration
│   │   ├── auth-client.ts      # Client-side auth hook
│   │   ├── utils.ts            # Utility functions (cn, etc)
│   │   ├── filter-cards.ts     # Card filtering logic
│   │   ├── deck-validation.ts  # Deck legality rules
│   │   ├── deck-grouping.ts    # Group cards in deck by type
│   │   ├── want-list.ts        # Generate want list from decks
│   │   ├── binder-logic.ts     # Trade binder calculations
│   │   ├── export.ts           # Export data formats (TTS, Archidekt)
│   │   ├── auto-filter.ts      # Auto-generate filters from deck
│   │   ├── aspect-panel.ts     # Aspect panel calculations
│   │   ├── catalog/            # Catalog-specific logic
│   │   │   └── select-best-variant.ts # Choose best art per card
│   │   ├── collection/         # Collection-specific logic
│   │   │   └── normalize.ts    # Normalize Reddit CSV format
│   │   └── sync/               # Data sync logic
│   │       ├── upsert-cards.ts # Ingest card DB from API
│   │       └── prices.ts       # Fetch & update prices
│   │
│   ├── db/                     # Database
│   │   ├── index.ts            # Neon connection & drizzle instance
│   │   ├── schema.ts           # Drizzle table definitions
│   │   └── queries/            # Type-safe database queries
│   │       ├── catalog.ts      # Card browsing queries
│   │       ├── collection.ts   # User collection queries
│   │       ├── card-detail.ts  # Single card metadata
│   │       ├── decks.ts        # Deck storage queries
│   │       ├── binder.ts       # Trade binder queries
│   │       └── trade.ts        # Trade offer queries
│   │
│   ├── data/                   # Static/seed data
│   │   └── starter-decks.ts    # Pre-built starter deck definitions
│   │
│   └── proxy.ts                # Middleware for route protection
│
├── drizzle/                    # Drizzle migrations (auto-generated)
│   └── */
├── scripts/                    # CLI scripts
│   ├── seed.ts                 # Seed database with initial data
│   └── ... (build/sync scripts)
│
├── __tests__/                  # Integration & E2E tests
│   ├── auth.test.ts
│   ├── collection.test.ts
│   └── ...
│
├── tests/                      # Playwright E2E tests
│   └── ... (.spec.ts files)
│
├── public/                     # Static assets
│   └── ...
│
├── .planning/                  # GSD planning docs (this repo uses GSD)
│   ├── codebase/               # Architecture documents
│   │   └── (this file)
│   ├── milestones/             # Milestone specs
│   └── phases/                 # Phase execution logs
│
├── .claude/                    # GSD configuration
│   ├── gsd-core/
│   ├── agents/
│   ├── skills/                 # (if custom project skills exist)
│   └── ...
│
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript config
├── vitest.config.mts           # Vitest config for unit tests
├── drizzle.config.ts           # Drizzle ORM config
├── eslint.config.mjs           # ESLint config
├── postcss.config.mjs          # PostCSS (Tailwind)
├── components.json             # shadcn CLI config
│
├── package.json                # Dependencies
├── package-lock.json
├── .gitignore
├── README.md
├── AI-SPEC.md                  # AI system design (if applicable)
├── AGENTS.md                   # Project agent instructions
└── LEARNINGS.md                # Recorded learnings from execution
```

## Directory Purposes

**`src/app`** — Next.js App Router (pages & API routes)
- Contains all user-facing pages and HTTP endpoints
- Organized by feature (collection, decks, cards, binder)
- API routes mirror feature structure (`/api/collection/*`, `/api/decks/*`)

**`src/components`** — React components
- Organized by feature first, then UI primitives
- `ui/` subdirectory contains shadcn/ui primitive components (Button, Card, Dialog, etc.)
- Larger features (catalog, decks, binder) have their own subdirectory with multiple components

**`src/lib`** — Business logic & utilities
- Pure functions, no React, no database access (except auth which uses it)
- Organized by feature concern (deck validation, filtering, exports)
- Subdirectories for complex domains (catalog, collection, sync)

**`src/db`** — Database layer
- `index.ts` — Connection pool & drizzle instance (module singleton)
- `schema.ts` — All table definitions using Drizzle ORM
- `queries/` — Type-safe query functions organized by domain

**`scripts/`** — One-off CLI scripts
- `seed.ts` — Initialize database with sample data
- Used with `npm run db:seed`, `npm run db:migrate`, etc.

**`drizzle/`** — Migration history
- Auto-generated by `drizzle-kit generate`
- One directory per migration (timestamp-named)

**`tests/` & `__tests__/`** — Test files
- `tests/` — Playwright E2E tests (`*.spec.ts`)
- `__tests__/` — Integration tests (vitest)
- **Colocation pattern:** Some unit tests co-located with source (e.g., `filter-cards.test.ts` next to `filter-cards.ts`)

**`.planning/`** — GSD project planning
- `codebase/` — Architecture documents (ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, STACK.md, INTEGRATIONS.md, CONCERNS.md)
- `milestones/` — Milestone specifications
- `phases/` — Phase execution logs and status

**`.claude/`** — GSD tool configuration
- `agents/`, `skills/`, `gsd-core/`, `hooks/` — GSD infrastructure
- Project-specific configurations for Claude Code tooling

## Key File Locations

**Entry Points:**
- `src/app/page.tsx` — Home page
- `src/app/layout.tsx` — Root layout, providers, nav bar
- `src/app/(auth)/login/page.tsx` — Login page

**Configuration:**
- `src/db/index.ts` — Database connection setup
- `src/lib/auth.ts` — Authentication configuration (better-auth)
- `src/proxy.ts` — Middleware for route protection
- `next.config.ts` — Next.js config (image optimization)
- `tsconfig.json` — TypeScript config (path alias `@/*` → `./src/*`)

**Core Logic:**
- `src/db/schema.ts` — All database table definitions
- `src/lib/filter-cards.ts` — Card filtering algorithm
- `src/lib/deck-validation.ts` — Deck legality rules
- `src/lib/binder-logic.ts` — Trade binder calculations

**Testing:**
- `tests/` — Playwright E2E specs
- `__tests__/` — Vitest integration tests
- `.test.ts` and `.spec.ts` files co-located with source files

## Naming Conventions

**Files:**
- PascalCase for components: `CatalogClient.tsx`, `CardGrid.tsx`, `NavBar.tsx`
- kebab-case for utilities & hooks: `filter-cards.ts`, `auth-client.ts`, `deck-validation.ts`
- Test files suffix with `.test.ts` or `.spec.ts`: `filter-cards.test.ts`
- Route files always named `route.ts`: `src/app/api/collection/route.ts`
- Layout & error files use Next.js conventions: `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`

**Directories:**
- kebab-case for feature directories: `catalog/`, `decks/`, `binder/`, `want-list/`
- UPPERCASE for special directories with meaning: `API`, `DB` (implicit in folder names like `api/`, `db/`)
- Grouping routes in parentheses: `(auth)` to group login routes without changing URL

**Variables & Functions:**
- camelCase for functions: `filterCards()`, `calculateLookingFor()`, `validateDeck()`
- camelCase for variables: `selectedSets`, `deckCounts`, `isLoading`
- UPPER_CASE for constants: `VARIANT_PRECEDENCE`, `NAV_LINKS`
- Prefix boolean variables/functions with is/has: `isExcluded`, `hasTradeOfferings`

**Types:**
- PascalCase for interfaces/types: `CardForFilter`, `FilterState`, `OwnedCard`
- Suffix with "Props" for component prop types: `CatalogClientProps`, `CardItemProps`

## Where to Add New Code

**New Feature (e.g., "Tournament Results Tracker"):**
- Page: `src/app/tournaments/page.tsx` (server component)
- Components: `src/components/tournaments/*` (client & server components)
- Queries: `src/db/queries/tournaments.ts` (database access)
- Logic: `src/lib/tournament-*.ts` (calculations, formatting)
- API: `src/app/api/tournaments/route.ts` (mutations & data export)
- Tests: `tests/tournaments.spec.ts` (E2E), `__tests__/tournaments.test.ts` (integration)

**New API Endpoint:**
- Route file: `src/app/api/[feature]/[action]/route.ts`
- Auth check: Use `auth.api.getSession({ headers })`
- Queries: Call typed functions from `src/db/queries/`
- Error handling: Try-catch with console.error + HTTP status
- Example: `src/app/api/collection/variants/route.ts`

**New Component:**
- Location: `src/components/[feature]/[ComponentName].tsx`
- Mark with `'use client'` if using hooks
- Keep server components when possible (no `'use client'` needed)
- Extract reusable sub-components to same directory
- Example: `src/components/catalog/card-grid.tsx` + `src/components/catalog/card-item.tsx`

**New Utility/Helper:**
- Location: `src/lib/[domain]-[concern].ts` (or subdirectory if domain is large)
- Pure functions whenever possible (no side effects, no React)
- Export types used in other parts of app
- Test-friendly: accept parameters instead of reading global state
- Example: `src/lib/filter-cards.ts` (pure), `src/lib/auth.ts` (effects, auth setup)

**New Database Query:**
- Location: `src/db/queries/[domain].ts`
- Use Drizzle ORM type-safe API
- Select only needed columns (watch for Date objects crossing RSC boundary)
- Add JSDoc with parameter & return type examples
- Test with integration test in `__tests__/[domain].test.ts`
- Example: `src/db/queries/collection.ts`

**New Page/Route:**
- Page component: `src/app/[path]/page.tsx` (server, fetch data)
- Nested routes: `src/app/[path]/[param]/page.tsx`
- Protected routes: Check session via better-auth, redirect to `/login` if missing
- Layout: Define in `layout.tsx` at directory level for shared UI
- Loading: Optional `loading.tsx` for Suspense fallback
- Example: `src/app/decks/page.tsx`, `src/app/decks/[id]/page.tsx`

## Special Directories

**`node_modules/`**
- Generated by npm install
- NOT committed to git (listed in .gitignore)
- Contains all dependencies including Next.js, Drizzle, better-auth

**`.next/`**
- Generated by Next.js build
- Contains compiled code, optimized assets
- NOT committed to git
- Rebuilt on each `npm run build` or deploy

**`drizzle/`**
- Generated by `drizzle-kit generate` (tracks schema changes)
- IS committed to git (version control for migrations)
- One migration per schema change

**`public/`**
- Static assets served at `/` route
- Images, fonts, favicon
- Deployed with the app

---

*Structure analysis: 2026-07-05*

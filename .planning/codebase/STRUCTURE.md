# Codebase Structure

**Analysis Date:** 2025-02-14

## Directory Layout

```
[project-root]/
├── drizzle/            # Database migration files (.sql)
├── public/             # Static assets (images, icons)
├── scripts/            # Maintenance, seeding, and utility scripts
├── src/                # Primary source code
│   ├── app/            # Next.js App Router (pages and API)
│   ├── components/     # React components (UI and Feature-based)
│   ├── db/             # Database client and schema
│   ├── lib/            # Shared utilities and business logic
│   └── proxy.ts        # Proxy configuration for development
├── tests/              # End-to-end and integration tests
└── __tests__/          # Unit and feature tests
```

## Directory Purposes

**src/app:**
- Purpose: Next.js routing, pages, and API handlers.
- Contains: `page.tsx`, `layout.tsx`, and `route.ts` files.
- Key files: `src/app/page.tsx`, `src/app/api/auth/[...all]/route.ts`

**src/components:**
- Purpose: Reusable React components.
- Contains: Feature-specific folders (`catalog`, `decks`) and generic `ui`.
- Key files: `src/components/nav-bar.tsx`, `src/components/decks/deck-builder.tsx`

**src/db:**
- Purpose: Database access layer.
- Contains: Schema definitions and query functions.
- Key files: `src/db/schema.ts`, `src/db/queries/`

**src/lib:**
- Purpose: Shared logic and helper functions.
- Contains: Auth config, deck validation, and collection helpers.
- Key files: `src/lib/auth.ts`, `src/lib/deck-validation.ts`

**scripts:**
- Purpose: Out-of-app tasks like seeding and price syncing.
- Contains: TypeScript scripts for data maintenance.
- Key files: `scripts/seed.ts`, `scripts/sync-prices-now.ts`

## Key File Locations

**Entry Points:**
- `src/app/page.tsx`: Home page.
- `src/app/api/auth/[...all]/route.ts`: Authentication entry point.

**Configuration:**
- `next.config.ts`: Next.js configuration.
- `drizzle.config.ts`: Drizzle ORM configuration.
- `package.json`: Project dependencies and scripts.

**Core Logic:**
- `src/db/schema.ts`: Database model.
- `src/lib/auth.ts`: Authentication setup.
- `src/lib/deck-validation.ts`: Business rules for deck building.

**Testing:**
- `__tests__/`: Unit tests for components and logic.
- `tests/`: Integration and E2E tests.

## Naming Conventions

**Files:**
- [Kebab-case]: `deck-builder.tsx`, `card-item.tsx`
- [Standard-Next]: `page.tsx`, `layout.tsx`, `route.ts`

**Directories:**
- [Kebab-case]: `card-catalog`, `deck-builder`
- [Next-Special]: `(auth)`, `[id]`, `[set-code]`

## Where to Add New Code

**New Feature:**
- Primary code: Create a new directory in `src/app` for routes and `src/components` for UI.
- Tests: Add to `__tests__` (unit) or `tests/` (integration).

**New Component/Module:**
- Implementation: Add to `src/components/ui` (if generic) or feature folder.

**Utilities:**
- Shared helpers: Add to `src/lib/` or a subfolder within it.

## Special Directories

**drizzle/:**
- Purpose: Contains auto-generated and manual SQL migration files.
- Generated: Yes (via `drizzle-kit generate`).
- Committed: Yes.

**.planning/:**
- Purpose: Project documentation and roadmap tracking.
- Generated: No (managed by GSD).
- Committed: Yes.

---

*Structure analysis: 2025-02-14*

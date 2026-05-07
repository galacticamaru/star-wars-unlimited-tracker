# Coding Conventions

**Analysis Date:** 2026-05-08

## Naming Patterns

**Files:**
- React components: `kebab-case.tsx` (e.g., `card-item.tsx`, `catalog-client.tsx`, `deck-builder.tsx`)
- Lib utilities: `kebab-case.ts` (e.g., `filter-cards.ts`, `deck-validation.ts`, `export.ts`)
- DB queries: `kebab-case.ts` under `src/db/queries/` (e.g., `catalog.ts`, `collection.ts`, `decks.ts`)
- Test files: co-located with source, suffix `.test.ts` / `.test.tsx`; browser-specific tests use `.browser.test.tsx`; mode-specific variants use `.{mode}.test.tsx` (e.g., `card-item.deck.test.tsx`)
- API routes: `route.ts` under `src/app/api/{resource}/` (Next.js App Router convention)

**Functions/exports:**
- React components: `PascalCase` named exports — `export function CardItem(...)`, `export function CatalogClient(...)`
- Page components: `default export` named function — `export default function CollectionPage()`
- Utility functions: `camelCase` named exports — `filterCards`, `validateDeck`, `toMeleeFormat`, `upsertCards`
- DB query functions: `camelCase` verbs — `getAllCards`, `getUserCollection`, `upsertCardCount`, `getDeckWithCards`

**Variables/state:**
- `camelCase` throughout — `selectedSets`, `deckCounts`, `collectorNumber`, `frontArtUrl`
- Boolean state uses plain noun or `is`/`has` prefix — `loaded`, `isDraft`, `isSelector`, `hasShortfall`

**Types/interfaces:**
- `PascalCase` interfaces — `CardForFilter`, `FilterState`, `ExportDeck`, `ValidationResult`, `SWUCard`
- Exported alongside their primary function in the same file

**Database columns:**
- `snake_case` in SQL schema — `swudb_id`, `card_definition_id`, `front_art_url`, `is_sideboard`
- `camelCase` in TypeScript (Drizzle maps automatically) — `swudbId`, `cardDefinitionId`, `frontArtUrl`

## Code Style

**Formatting:**
- Single quotes for string literals in TypeScript source (`'use client'`, `import { cn } from '@/lib/utils'`)
- Double quotes in JSX attribute values (`data-slot="button"`, `className="..."`)
- Trailing commas in multi-line objects and function params
- No explicit Prettier config found — formatting inferred from existing code

**Linting:**
- ESLint v9 with flat config: `eslint.config.mjs`
- Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- No custom rule overrides beyond default Next.js ignore paths
- Run with: `npm run lint` (calls `eslint` with no args)

**TypeScript:**
- `strict: true` enabled in `tsconfig.json`
- `noEmit: true` — types checked by tsc, emitted by Next.js build
- `isolatedModules: true` — each file must be independently parseable
- Non-null assertions used sparingly; prefer nullish coalescing (`??`) and optional chaining

## Import Organization

**Order (observed pattern):**
1. `'use client'` directive (when present — always first line, before imports)
2. React and framework imports (`react`, `next/*`)
3. Third-party library imports (`drizzle-orm`, `nuqs`, `lucide-react`, `papaparse`)
4. Internal alias imports (`@/lib/...`, `@/db/...`, `@/components/...`)
5. Relative imports (rare — only within same directory)

**Path Aliases:**
- `@/*` maps to `./src/*` — use for all cross-directory imports
- Example: `import { db } from '@/db'`, `import { cn } from '@/lib/utils'`, `import { Button } from '@/components/ui/button'`
- Relative imports (e.g., `./filter-cards`) used only within the same module directory

## Error Handling

**API routes (server-side):**
- All handlers wrapped in `try/catch`
- Errors logged with `console.error('Descriptive message:', error)`
- Successful responses: `return Response.json(data)`
- Error responses: `return new Response('Human-readable message', { status: NNN })`
- HTTP 400 for validation/missing fields, 404 for not found, 500 for unexpected errors
- Example from `src/app/api/collection/route.ts`:
  ```typescript
  try {
    const collection = await getUserCollection(1);
    return Response.json(countMap);
  } catch (error) {
    console.error('Failed to fetch collection:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
  ```

**Client-side components:**
- `try/catch` around `fetch` calls; errors logged with `console.error`
- Optimistic UI updates applied immediately, rolled back only on hard failure (not implemented for all cases)
- No toast/notification system — errors are silent to the user in most places (known gap)
- Example from `src/components/catalog/catalog-client.tsx`:
  ```typescript
  try {
    const res = await fetch('/api/collection', { method: 'POST', ... });
    if (!res.ok) throw new Error('Failed to update');
  } catch (err) {
    console.error(err);
  }
  ```

**Lib/pure functions:**
- No exceptions thrown — validation functions return typed result objects with `errors[]` and `warnings[]`
- Example: `validateDeck` returns `ValidationResult` with `isValid`, `errors`, `warnings`, `stats`

## Logging

**Framework:** `console.error` only (no structured logging library)

**Patterns:**
- `console.error` used in all error catch blocks, both server and client
- Message format: `'Failed to {verb} {noun}:'` followed by the caught error object
- No `console.log` or `console.warn` in production code paths — debug logging is absent
- Server-side logs visible in Vercel function logs; client-side in browser console

## Comments

**When to Comment:**
- Explain non-obvious business logic decisions — especially filter semantics, schema design choices, and API constraints
- Inline comments on tricky calculations: cost normalization, rarity prefix stripping, collector number parsing
- File-level JSDoc on complex utilities: `src/lib/sync/upsert-cards.ts`, `src/lib/collection/normalize.ts`

**JSDoc:**
- Used on exported async functions in `src/lib/sync/upsert-cards.ts` (e.g., `/** Upserts all cards for a given set... */`)
- Sparse in component files — component interfaces are self-documenting via TypeScript prop types
- Code comments explain "why" not "what": `// Zero-pad card number to 3 digits`, `// Hardcoded user 1 as per D-04`

**Inline decision tags:**
- Design decisions referenced inline with codes like `D-04`, `D-05` linking to planning docs
- Example: `// Hardcoded user 1 as per D-04`, `// OR within category (D-05 — AND is across categories)`

## Function Design

**Size:** Functions are generally small-to-medium. Large multi-pass logic (e.g., `upsertCards` in `src/lib/sync/upsert-cards.ts`) is internally segmented with `// Pass 1:` / `// Pass 2:` comment blocks.

**Parameters:** Prefer explicit named parameters over option objects for simple functions. Complex configuration uses props interfaces (React) or typed parameter lists.

**Return Values:**
- Async DB functions return Drizzle query results (typed arrays/objects)
- Validation functions return structured result objects, not thrown errors
- API handlers always return a `Response` or `Response.json(...)` — never `undefined`

**Helper functions:** Private helpers are declared as `function` (not `const =>`), inside the same file, above the main exported function. Example: `formatMeleeLine` in `src/lib/export.ts`, `parseIntOrNull` in `src/lib/sync/upsert-cards.ts`.

## Module Design

**Exports:**
- Named exports for all utility functions and components
- Default export only for Next.js page components (`export default function PageName()`)
- UI primitives (`src/components/ui/`) export both the component and its variants: `export { Button, buttonVariants }`

**Barrel Files:** Not used. Imports reference specific module paths directly.

**Client/Server boundary:**
- `'use client'` directive placed as the first line of any component that uses hooks or browser APIs
- Server Components (no directive) handle data fetching from the DB directly
- API routes are always server-side; no `'use client'` in `src/app/api/`

## UI Component Patterns

**Shadcn/Base UI pattern (`src/components/ui/`):**
- Components wrap `@base-ui/react` primitives with `cva` (class-variance-authority) variant definitions
- The `cn()` utility (`src/lib/utils.ts`) is used for all conditional className merging
- `data-slot` attributes added to root elements for CSS targeting: `data-slot="button"`, `data-slot="input"`
- Props spread with `...props` after explicit destructuring; `className` always merged via `cn()`

**Feature components (`src/components/catalog/`, `src/components/decks/`):**
- Accept typed props interfaces defined inline above the component
- Conditional rendering with ternary expressions for mode-based UI variations
- `cn()` used for conditional Tailwind class application

---

*Convention analysis: 2026-05-08*

---
focus: quality
last_updated: 2026-05-28
---
# Coding Conventions

**Analysis Date:** 2026-05-28

## Naming Patterns

**Files:**
- React components: `kebab-case.tsx` — e.g., `card-item.tsx`, `hero-section.tsx`, `catalog-client.tsx`
- Utility/logic modules: `kebab-case.ts` — e.g., `filter-cards.ts`, `binder-logic.ts`, `deck-validation.ts`
- Next.js API routes: `route.ts` inside segment directories — e.g., `src/app/api/collection/route.ts`
- Test files co-located with source, suffixed `.test.ts` / `.test.tsx`
- Browser/jsdom-specific tests use an extra qualifier segment: `card-item.browser.test.tsx`, `card-item.deck.test.tsx`
- Drizzle schema: `src/db/schema.ts` (single file)
- DB query files: `src/db/queries/<domain>.ts` — e.g., `catalog.ts`, `collection.ts`

**Functions and variables:**
- All identifiers use `camelCase` — functions, variables, hooks, callbacks
- Boolean variables use `is`/`has` prefixes: `isSelector`, `isReadOnly`, `hasShortfall`, `isHorizontal`
- Event handlers use `on` prefix with PascalCase subject: `onUpdateCount`, `onDeckUpdate`, `onFilterManualChange`
- Module-level constants use `SCREAMING_SNAKE_CASE`: `RARITY_OPTIONS`, `COST_OPTIONS`, `ARENA_OPTIONS`, `KEYWORD_OPTIONS`

**Types and interfaces:**
- Interfaces use `PascalCase` with the `Interface` suffix omitted: `CardItemProps`, `FilterState`, `CardForFilter`, `ValidationResult`
- Exported type names are descriptive domain nouns: `CollectionMap`, `ExportDeck`, `AutoFilter`, `SWUDBCard`
- Props interfaces are named `<ComponentName>Props` and defined immediately before the component
- Type-only imports use `import type { ... }`: `import type { CollectionMap } from '@/app/api/collection/collection-shape'`

**React components:**
- Named exports for all non-page components: `export function CardItem(...)`, `export function HeroSection(...)`
- Next.js page/layout/loading files use default exports as required by the framework: `export default function RootLayout(...)`, `export default async function HomePage()`
- Component names use `PascalCase`

**DB schema (Drizzle):**
- Table names use snake_case string literals: `pgTable('user', ...)`, `pgTable('card_printing', ...)`
- Column definitions use camelCase JS names mapped to snake_case DB columns: `emailVerified: boolean('email_verified')`

## Code Style

**Formatting:**
- No Prettier config detected. Formatting is not enforced by a dedicated formatter.
- Single quotes for string literals in most `src/` files; double quotes appear in some files (`layout.tsx`, `utils.ts`) — mixed, no enforced standard.
- Semicolons used consistently throughout.
- 2-space indentation throughout.
- Trailing commas in multi-line objects and function parameter lists.

**Linting:**
- ESLint 9 via `eslint.config.mjs` using flat config API (`defineConfig`).
- Rule sets: `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`.
- No custom rule overrides beyond the default Next.js+TypeScript config.
- One known suppression in `src/components/catalog/card-image-section.tsx:75` with `// @ts-ignore` for a custom Next.js 16 attribute.

## TypeScript Strictness

- `strict: true` in `tsconfig.json` — enables all strict checks (`strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, etc.).
- `isolatedModules: true` — each file must be independently type-checkable.
- `noEmit: true` — TypeScript is type-check only; build is handled by Next.js.
- `moduleResolution: "bundler"` — modern resolution compatible with Vite/Next.js 16.
- Nullable fields are modelled explicitly as `string | null` or `number | null` — not `undefined` for absent DB values.
- Optional interface fields use `?`: `variantType?: string`, `selectedVariants?: string[] | null`.
- `any` is used only in test mock factories (e.g., `(props: any)` in `vi.mock` callbacks) — not in production code.

## Import Organization

**Order (observed pattern):**
1. External packages (React, Next.js, third-party): `import { useState } from 'react'`
2. Internal absolute imports via `@/` alias: `import { cn } from '@/lib/utils'`
3. Relative sibling imports: `import { CardGrid } from './card-grid'`

**Path alias:**
- `@/*` maps to `src/*` — defined in `tsconfig.json` and resolved in Vitest via `vite-tsconfig-paths`.
- Use `@/` for all cross-directory imports; use relative paths only for siblings in the same directory.

**Type-only imports:**
- `import type { ... }` is used consistently for types that are not used as runtime values.

## CSS Approach

- **Tailwind CSS v4** via `@tailwindcss/postcss`. No separate `tailwind.config.*` file — design tokens are configured in `src/app/globals.css` via `@theme inline` blocks.
- `tw-animate-css` imported for animation utilities.
- `shadcn` component library (`shadcn/tailwind.css`) provides base design tokens.
- `cn()` from `src/lib/utils.ts` (wraps `clsx` + `tailwind-merge`) is the canonical helper for composing conditional class strings. Use it everywhere instead of template literals.
- Arbitrary Tailwind values are used for layout constraints: `h-[calc(100svh-56px)]`, `aspect-[2/3]`.
- No CSS Modules or styled-components — all styling is utility-class-based.
- Dark mode via `@custom-variant dark (&:is(.dark *))` — class-based, not `prefers-color-scheme`.

## Error Handling

**API routes pattern:**
```typescript
export async function GET() {
  try {
    // ...
    return Response.json(data);
  } catch (error) {
    console.error('Failed to fetch collection:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
```
- Use `Response.json()` for success (not `NextResponse.json`).
- Use `new Response('Message', { status: NNN })` for error responses.
- Always log with `console.error('Failed to <verb> <noun>:', error)` before returning.

**Client code:**
- Check `response.ok` before parsing JSON in fetch calls.
- No global error boundary observed; errors are handled locally per component.

## Logging

**Framework:** `console` only — no logging library.

**Pattern:** `console.error('Failed to <verb> <noun>:', error)` in catch blocks.

## Comments

**When to comment:**
- Inline comments explain non-obvious business rules, often referencing requirement codes: `// D-05`, `// REQ-COLLECT-08`, `// PERF-04`.
- JSDoc on exported functions that implement non-trivial logic: `calculateLookingFor`, `validateDeck`.
- `// Wave 0 stub` / `// Wave N implementation` comments in test files mark placeholder tests and their delivery tier.
- Comments note intentional workarounds: `// @ts-ignore - custom attribute used in this project's Next.js 16 setup`.
- Do not write comments that merely restate what the code does.

## Function Design

**Size:** Keep functions focused on one responsibility. Helpers extracted as private functions when reused (e.g., `formatMeleeLine` in `src/lib/export.ts`).

**Parameters:** Use object destructuring for component props. Pure utility functions use positional arguments when arity is ≤4 (e.g., `calculateLookingFor(autoTarget, manualTarget, currentInventory, isExcluded)`).

**Return values:** Explicit types. Nullable returns use `T | null`, not `undefined` (except where optional chaining naturally returns `undefined`).

## Module Design

**Exports:**
- Named exports throughout all non-page files.
- No barrel `index.ts` files in `src/lib/` or `src/components/` — import directly from the specific file.
- DB query modules export individual async functions; schema exports named table constants from `src/db/schema.ts`.

**'use client' directive:**
- Client components declare `'use client'` as the very first line, before any imports: `catalog-client.tsx`, `card-item.tsx`, `currency-context.tsx`.
- Server components (pages, layouts, data-fetching async components) have no directive.

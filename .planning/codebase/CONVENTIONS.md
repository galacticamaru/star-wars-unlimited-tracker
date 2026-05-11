# Coding Conventions

**Analysis Date:** 2025-02-14

## Naming Patterns

**Files:**
- kebab-case for all files (e.g., `nav-bar.tsx`, `deck-validation.ts`, `filter-cards.test.ts`).
- Directory names also use kebab-case (e.g., `src/components/catalog/`).
- Special Next.js directories use their own conventions (e.g., `(auth)`, `[id]`).

**Functions:**
- camelCase for utility functions and logic (e.g., `filterCards`, `validateDeck`).
- PascalCase for React Components (e.g., `NavBar`, `CatalogClient`).

**Variables:**
- camelCase for local variables and instances (e.g., `session`, `isPending`, `cards`).
- SCREAMING_SNAKE_CASE for constants and configuration (e.g., `NAV_LINKS`).

**Types:**
- PascalCase for interfaces and type aliases (e.g., `CardForFilter`, `FilterState`, `DeckValidationResult`).
- Often co-located with the logic using them.

## Code Style

**Formatting:**
- No dedicated Prettier configuration found; likely relying on standard ESLint formatting or default editor settings.
- 2-space indentation observed throughout.

**Linting:**
- ESLint with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`.
- Configuration located in `eslint.config.mjs`.

## Import Organization

**Order:**
1. React/Next.js core imports (`react`, `next/link`, `next/navigation`).
2. Third-party libraries (`lucide-react`, `drizzle-orm`).
3. Internal utilities and types using `@/` alias (`@/lib/utils`, `@/db/schema`).
4. Components (`@/components/ui/button`).
5. Styles/CSS (`@/app/globals.css`).

**Path Aliases:**
- `@/*` maps to `./src/*` as defined in `tsconfig.json`.

## Error Handling

**Patterns:**
- Server-side: `try/catch` blocks in API routes and server actions.
- Responses: Returns `new Response('Message', { status: code })` for simple errors or `Response.json({ success: false, errors: [...] }, { status: 400 })` for validation failures.
- Client-side: Handling is less visible but includes loading states (e.g., `isPending` from `authClient`).

## Logging

**Framework:** `console`

**Patterns:**
- Errors are logged in catch blocks: `console.error('Context message:', error)`.
- No specialized logging library detected.

## Comments

**When to Comment:**
- To explain complex logic (e.g., deck validation rules).
- To document technical debt or temporary stubs ("Wave 0 stub").
- To reference specific requirements or pitfalls (e.g., "Pitfall 4: Drizzle timestamp columns...").

**JSDoc/TSDoc:**
- Minimal use of formal JSDoc; comments are mostly standard block or line comments.

## Function Design

**Size:** Functions are generally kept small and focused on a single responsibility.

**Parameters:** Uses object destructuring for component props and complex function parameters to improve readability.

**Return Values:** Explicit return types are common in logic files; components rely on TypeScript inference for `JSX.Element`.

## Module Design

**Exports:**
- Favor named exports (`export function NavBar`) over default exports, except for Next.js pages/layouts which require default exports.

**Barrel Files:**
- Not extensively used; direct imports from files are more common.

---

*Convention analysis: 2025-02-14*

# Coding Conventions

**Analysis Date:** 2026-07-05

## Naming Patterns

**Files:**
- kebab-case for all files
- Examples: `nav-bar.tsx`, `deck-validation.ts`, `filter-cards.test.ts`, `currency-context.tsx`
- Exception: No special naming for test files; suffix with `.test.ts` or `.test.tsx`

**Functions:**
- camelCase for all function names
- Start with action verb when appropriate: `calculate*`, `compute*`, `validate*`, `filter*`, `map*`
- Examples: `calculateLookingFor()`, `filterCards()`, `computeAutoFilter()`, `validateDeck()`, `mapPriceData()`

**Variables:**
- camelCase for constants, parameters, and local variables
- All caps with underscores only for module-level constants
- Example: `const NAV_LINKS = [...]`

**Components (React):**
- PascalCase for all React components
- Examples: `NavBar`, `CurrencyProvider`, `HeroSection`, `CardGrid`, `DeckBuilder`

**Types & Interfaces:**
- PascalCase for all type definitions
- Use `interface` for object shapes (component props, data structures)
- Use `type` for unions, aliases, and complex type definitions
- Examples: `Card`, `FilterState`, `ValidationResult`, `CurrencyContextType`, `AutoFilter`

**Directories:**
- kebab-case for feature directories
- Examples: `src/lib`, `src/components`, `src/app`, `src/data`, `src/db`

## Code Style

**Formatting:**
- ESLint with Next.js core-web-vitals and TypeScript configurations
- No custom Prettier config; uses ESLint defaults
- Indentation: 2 spaces (standard Next.js)

**Linting:**
- ESLint v9 with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Configuration file: `eslint.config.mjs`
- Run with: `npm run lint`
- No custom linting rules beyond Next.js/TypeScript standards

**TypeScript:**
- Strict mode enabled: `strict: true`
- Target ES2017, module: esnext
- Always use type annotations for function parameters and return types
- Examples:
  ```typescript
  export function calculateLookingFor(
    autoTarget: number,
    manualTarget: number,
    currentInventory: number,
    isExcluded: boolean
  ): number {
    // ...
  }
  ```

## Import Organization

**Order (in this sequence):**
1. React/Node standard library (`import React, { ... } from 'react'`, `import { ... } from 'node:...`)
2. Next.js imports (`import Link from 'next/link'`, `import { useRouter } from 'next/navigation'`)
3. Third-party packages (`import Papa from 'papaparse'`, `import { ... } from 'clsx'`)
4. Icon libraries (`import { ChevronLeft, Upload, ... } from 'lucide-react'`)
5. Local imports with `@` alias (`import { cn } from '@/lib/utils'`, `import { Button } from '@/components/ui/button'`)

**Path Aliases:**
- `@/*` maps to `./src/*` (defined in `tsconfig.json`)
- Always use `@/` for imports from src, never relative paths like `../../../`

**Example from `src/app/collection/page.tsx`:**
```typescript
'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { normalizeRedditCsv } from '@/lib/collection/normalize';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Upload, CheckCircle2, AlertCircle, PackagePlus } from 'lucide-react';
import Link from 'next/link';
import { starterDecks } from '@/data/starter-decks';
```

## Error Handling

**Pattern:**
- Use try-catch blocks for async operations and uncertain code paths
- Throw `new Error()` with descriptive messages
- Always include error context in catch blocks
- Log errors with `console.error()` before handling UI state

**Examples from `src/app/collection/page.tsx`:**
```typescript
try {
  const res = await fetch('/api/collection/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalized),
  });
  
  if (!res.ok) throw new Error('Upload failed');
  
  const data = await res.json();
  setResult(data);
  setStatus('success');
} catch (err) {
  console.error(err);
  setStatus('error');
}
```

**Pattern for API Routes** (`src/app/api/`):
```typescript
try {
  // business logic
  return Response.json({ /* data */ });
} catch (error) {
  console.error(error);
  return new Response('Internal Server Error', { status: 500 });
}
```

**Status State Pattern:**
- Use state to track async operation status: `'idle' | 'loading' | 'success' | 'error'`
- Initialize to `'idle'`
- Update to `'loading'` before async call
- Update to `'success'` or `'error'` in finally block
- Render UI conditionally based on status

**Missing Data:**
- Early return if required data is missing: `if (!data) return;`
- Return default values for optional data: `const value = item?.property ?? defaultValue`

## Logging

**Framework:** console (no structured logging library)

**Patterns:**
- Use `console.error()` for errors and exceptions
- Use `console.log()` sparingly; mainly for debugging
- No info/warn/debug levels; just error and log
- Always include context: `console.error('Failed to load sets:', err)`

**Example:**
```typescript
.catch(err => console.error('Failed to load sets:', err));
```

## Comments

**When to Comment:**
- Document complex business logic or rules (e.g., Swarming Vulture Droid special case)
- Explain why code does something non-obvious (not what it does)
- Mark known limitations or edge cases
- Link to related code or references

**JSDoc/TSDoc:**
- Use JSDoc for public functions
- Include `@param` and `@returns` tags
- Include description of business logic where relevant

**Example from `src/lib/binder-logic.ts`:**
```typescript
/**
 * Calculates the quantity of a card the user is "Looking For" in their trade binder.
 * 
 * The logic merges auto-calculated requirements from decks with manual user wants,
 * subtracts current inventory, and respects explicit exclusions.
 * 
 * @param autoTarget The quantity required by the user's decks (max quantity in any single deck)
 * @param manualTarget The quantity manually requested by the user for their trade binder
 * @param currentInventory The quantity the user already owns in their collection
 * @param isExcluded Whether the user has explicitly excluded this card from their "Looking For" list
 * @returns The quantity of the card the user is seeking (0 if none or excluded)
 */
export function calculateLookingFor(
  autoTarget: number,
  manualTarget: number,
  currentInventory: number,
  isExcluded: boolean
): number {
  // ...
}
```

**Inline Comments:**
- Use for non-obvious business rules
- Example from `src/lib/deck-validation.ts`:
  ```typescript
  // Track quantities for 3-copy limit
  const isSwarmingVultureDroid = card.swudbId === 'JTL-256';
  const maxAllowed = isSwarmingVultureDroid ? 15 : 3;
  ```

## Function Design

**Size:**
- Aim for functions under 50 lines
- Break down large functions into smaller helpers
- Extract nested functions when they become complex

**Parameters:**
- Maximum 4-5 parameters; use objects for larger parameter sets
- Always provide type annotations
- Use nullable types (`| null`) for optional data, not `undefined`
- Example: `Card | null`, not `Card | undefined`

**Return Values:**
- Always specify return type
- Return objects/arrays instead of multiple return values
- Use descriptive return types (e.g., `ValidationResult`, not `{ errors: []; warnings: [] }`)

**Example from `src/lib/filter-cards.ts`:**
```typescript
export function filterCards(
  cards: CardForFilter[],
  filters: FilterState,
  collection: CollectionMap = {}
): CardForFilter[] {
  // implementation
}
```

## Module Design

**Exports:**
- Explicitly export functions and types (not `export *`)
- Export interfaces alongside functions that use them
- Keep module focused on single responsibility

**Barrel Files:**
- Not commonly used in this codebase
- Import directly from source files using full paths

**Example from `src/lib/filter-cards.ts`:**
```typescript
export interface FilterState {
  // ...
}

export interface CardForFilter {
  // ...
}

export function filterCards(
  cards: CardForFilter[],
  filters: FilterState,
  collection: CollectionMap = {}
): CardForFilter[] {
  // ...
}
```

## React Component Patterns

**Functional Components Only:**
- All components are functional components with hooks
- Use `'use client'` directive for client-side components at the top of file

**Props Pattern:**
- Define inline prop types as interfaces
- Use destructuring in function signature
- Example:
  ```typescript
  export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    // ...
  }
  ```

**Context Hooks:**
- Always validate context usage with throw error if used outside provider
- Example from `src/components/currency-context.tsx`:
  ```typescript
  export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
      throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
  }
  ```

---

*Convention analysis: 2026-07-05*

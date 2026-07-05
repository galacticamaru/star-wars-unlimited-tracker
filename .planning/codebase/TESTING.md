# Testing Patterns

**Analysis Date:** 2026-07-05

## Test Framework

**Runner:**
- Vitest v4.1.5
- Config: `vitest.config.mts`
- Environment plugin: `@vitejs/plugin-react`

**Assertion Library:**
- Vitest built-in expect API
- Testing Library (React): `@testing-library/react` v16.3.2
- DOM utilities: `@testing-library/dom` v10.4.1

**Run Commands:**
```bash
npm test              # Run all tests
npm test -- --watch  # Watch mode (inferred from vitest behavior)
npm test -- --coverage  # Coverage report (use vitest --coverage)
```

## Test File Organization

**Location:**
- Co-located with source files in same directory
- Naming: `[name].test.ts` or `[name].test.tsx`

**Structure by Type:**
- Utility functions: `src/lib/[name].test.ts`
- React components: `src/components/[path]/[name].test.tsx`
- API routes: `src/app/api/[path]/[name].test.ts`
- Pages: `src/app/[path]/page.test.tsx`

**Examples:**
- `src/lib/filter-cards.ts` → `src/lib/filter-cards.test.ts`
- `src/components/nav-bar.tsx` → `src/components/nav-bar.test.tsx`
- `src/app/collection/page.tsx` → `src/app/collection/page.test.tsx`

## Test Structure

**Basic Suite Organization:**

For utility functions (`src/lib/binder-logic.test.ts`):
```typescript
import { describe, it, expect } from "vitest";
import { calculateLookingFor } from "./binder-logic";

describe("Trade Binder Logic", () => {
  describe("calculateLookingFor", () => {
    it("should return shortfall when only autoTarget is provided", () => {
      expect(calculateLookingFor(3, 0, 1, false)).toBe(2);
    });

    it("should return 0 when inventory meets or exceeds autoTarget", () => {
      expect(calculateLookingFor(3, 0, 3, false)).toBe(0);
      expect(calculateLookingFor(3, 0, 5, false)).toBe(0);
    });
  });
});
```

**For React Components** (`src/components/home/hero-section.test.tsx`):
```typescript
/**
 * @vitest-environment jsdom
 */
import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

import { HeroSection } from './hero-section';

test('renders h1 with exact locked title', () => {
  render(<HeroSection />);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
    'Star Wars Unlimited Card Database and Deck Builder'
  );
});
```

**Patterns:**
- Use `describe()` blocks to group related tests
- Use `it()` for individual test cases (or `test()` for single assertions)
- One assertion per test when testing a single behavior
- Multiple assertions allowed for related behaviors on same object

## Mocking

**Framework:** vitest `vi.mock()`

**React Component Mocking Pattern:**
```typescript
vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

vi.mock('@/components/ui/button', () => ({
  buttonVariants: ({ variant, size }: { variant?: string; size?: string }) =>
    [variant, size].filter(Boolean).join(' '),
}));
```

**What to Mock:**
- External framework modules (next/link, next/navigation)
- UI component libraries when rendering logic is complex
- Expensive operations (API calls, large computations)

**What NOT to Mock:**
- Utility functions like `cn()` from `@/lib/utils` — mock but keep simple
- Component children in parent tests
- Pure business logic functions

**Environment-Specific Mocking:**
- Node environment (utilities, business logic): `// @vitest-environment node` at file top
- jsdom environment (React components): `/** @vitest-environment jsdom */` at file top

## Fixtures and Factories

**Test Data Factories:**

Use factory functions to create consistent test data. Pattern from `src/lib/filter-cards.test.ts`:
```typescript
const makeCard = (overrides: Partial<CardForFilter> = {}): CardForFilter => {
  const defaults: CardForFilter = {
    id: 1,
    swudbId: 'SOR-001',
    name: 'Luke Skywalker',
    subtitle: null,
    type: 'Unit',
    aspects: ['Heroism'],
    arenas: ['Ground'],
    traits: ['REBEL'],
    keywords: [],
    cost: 3,
    power: null,
    hp: null,
    rarity: 'Common',
    setCode: 'SOR',
    collectorNumber: 'SOR-001',
    frontArtUrl: 'https://cdn.swu.db.com/images/cards/SOR/001.webp',
    backArtUrl: null,
    frontText: null,
    backText: null,
    epicAction: null,
    doubleSided: false,
    unique: false,
    priceEur: null,
    priceUsd: null,
  };
  return { ...defaults, ...overrides };
};
```

**Filter State Factory** (`src/lib/filter-cards.test.ts`):
```typescript
const emptyFilters: FilterState = {
  search: '',
  selectedSets: [],
  selectedTypes: [],
  selectedAspects: [],
  selectedArenas: [],
  selectedTraits: [],
  selectedRarities: [],
  selectedKeywords: [],
  selectedCosts: [],
};
```

**Factory Patterns:**
- Default values defined in factory function
- Overrides passed as object parameter with `Partial<Type>`
- Spread operator merges defaults with overrides: `{ ...defaults, ...overrides }`
- Use descriptive factory names: `makeCard()`, `createCard()`

**Location:**
- Define factories at top of test file
- Keep factories simple (just object creation)
- Use random IDs when needed to avoid collisions: `id: Math.floor(Math.random() * 1000)`

## Coverage

**Requirements:** Not enforced globally

**View Coverage:**
- Run: `npm test -- --coverage` (vitest built-in)
- Configure in `vitest.config.mts` if threshold enforcement needed

**Test Coverage Goals:**
- Business logic: aim for 80%+
- React components: focus on user interactions, not implementation
- Utility functions: 90%+ (pure functions are critical)

## Test Types

**Unit Tests:**
- Scope: Single function or component in isolation
- Approach: Test inputs and outputs, edge cases, error conditions
- Examples:
  - `calculateLookingFor()` with various parameter combinations
  - `filterCards()` with different filter states
  - `validateDeck()` with invalid/valid deck configurations
- Location: `src/lib/[name].test.ts`

**Integration Tests:**
- Scope: Multiple functions working together or component + mocked deps
- Approach: Test workflows and data transformations across modules
- Example: `filterCards()` + collection map + filter state all together
- Pattern: Multiple factories, multiple arrange steps, validate combined behavior
- Location: Same `.test.ts` file, separate `describe()` block

**Component Tests:**
- Scope: React component rendering and user interaction
- Approach: Render component, query by role/label, assert DOM state
- Examples:
  - `HeroSection` renders heading with correct text
  - `NavBar` links to correct routes
  - Form validation shows errors
- Location: `src/components/[path]/[name].test.tsx`
- Use `@testing-library/react` utilities: `render()`, `screen.getByRole()`, `screen.getByText()`

**No E2E Tests:**
- Not present in this codebase
- Would use Playwright/Cypress if added

## Common Patterns

**Async Testing:**
```typescript
it('should handle async operations correctly', async () => {
  const result = await someAsyncFunction();
  expect(result).toBeDefined();
});
```

**Error Testing:**
```typescript
it('should throw on invalid input', () => {
  expect(() => calculateLookingFor(-1, 0, 0, false)).toThrow();
});
```

**Multiple Assertions on Same Object** (from `src/lib/filter-cards.test.ts`):
```typescript
it('filters by variant (multiple related assertions)', () => {
  const cards = [
    makeCard({ id: 1, variantType: 'Normal' }),
    makeCard({ id: 2, variantType: 'Foil' }),
    makeCard({ id: 3, variantType: 'Hyperspace Foil' }),
  ];
  const result = filterCards(cards, { ...emptyFilters, selectedVariants: ['Foil', 'Hyperspace Foil'] });
  expect(result).toHaveLength(2);
  expect(result.map(c => c.id)).toEqual(expect.arrayContaining([2, 3]));
});
```

**Testing Array/Object Results** (from `src/lib/auto-filter.test.ts`):
```typescript
it('deduplicates overlapping aspects between leader and base', () => {
  const leader = createCard({ type: 'Leader', aspects: ['Command'] });
  const base = createCard({ type: 'Base', aspects: ['Command'] });
  const result = computeAutoFilter(leader, base);
  expect(result!.aspects).toEqual(['Command']);
});
```

**Testing Edge Cases:**
- Empty inputs: `[]`, `{}`, `null`, `undefined`
- Boundary values: 0, negative, very large numbers
- Special cases: Swarming Vulture Droid exception (15 copies instead of 3)
- Example from `src/lib/filter-cards.test.ts`:
  ```typescript
  it('handles cases where everything is zero', () => {
    expect(calculateLookingFor(0, 0, 0, false)).toBe(0);
  });
  ```

**Type Safety in Tests:**
```typescript
import type { CardForFilter, FilterState } from './filter-cards';

const makeCard = (overrides: Partial<CardForFilter> = {}): CardForFilter => {
  // ...
};
```

## Vitest Configuration

**File:** `vitest.config.mts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'node',
    globals: true,           // describe/it/expect available globally
    passWithNoTests: true,   // Don't fail if no tests found
  },
});
```

**Key Settings:**
- `environment: 'node'` by default; override with `@vitest-environment jsdom` for React tests
- `globals: true` allows `describe()`, `it()`, `expect()` without imports (optional, but current codebase imports them explicitly)
- `passWithNoTests: true` prevents test runs from failing when no tests exist

## Testing Best Practices in This Codebase

1. **Co-locate tests with source** — easier to maintain, encourages comprehensive testing
2. **Use factories for test data** — reduces duplication, improves readability
3. **Test behavior, not implementation** — focus on inputs/outputs for functions, user interactions for components
4. **Mock external dependencies** — keep tests fast and deterministic
5. **Group related tests** — use nested `describe()` blocks
6. **Name tests descriptively** — test names should explain the scenario and expected outcome
7. **One concept per test** — easier to debug failures and understand what broke
8. **Keep tests simple** — if test is complex, the code under test is probably too complex

---

*Testing analysis: 2026-07-05*

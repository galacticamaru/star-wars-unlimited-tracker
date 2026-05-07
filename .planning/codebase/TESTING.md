# Testing Patterns

**Analysis Date:** 2026-05-08

## Test Framework

**Runner:**
- Vitest v4.x
- Config: `vitest.config.mts` (project root)
- Default environment: `node` (override per-file with `// @vitest-environment jsdom` or `/** @vitest-environment jsdom */`)
- `globals: true` — `describe`, `it`, `expect` available without imports (but files still import them explicitly)
- `passWithNoTests: true` — CI passes even if a test file has only stubs

**Assertion Library:**
- Vitest built-in (`expect`) — no separate library

**React Testing:**
- `@testing-library/react` v16 with `@testing-library/dom` v10
- `jsdom` v29 as the DOM environment provider

**Run Commands:**
```bash
npm test              # Run all tests (vitest)
npx vitest --watch    # Watch mode
npx vitest --coverage # Coverage (no threshold configured)
```

## Test File Organization

**Location:** Co-located with source files — test files live in the same directory as the module they test.

**Naming conventions:**
- Unit/integration: `{module-name}.test.ts` or `{module-name}.test.tsx`
- Browser/jsdom-required: `{component}.browser.test.tsx` — signals jsdom environment need
- Mode-specific component tests: `{component}.{mode}.test.tsx` — e.g., `card-item.deck.test.tsx`

**Structure:**
```
src/lib/
  filter-cards.ts
  filter-cards.test.ts        # unit tests for pure function
  deck-validation.ts
  deck-validation.test.ts     # unit tests for pure function
  export.ts
  export.test.ts              # unit tests for pure function

src/db/queries/
  catalog.ts
  catalog.test.ts             # stub file — todo tests for DB queries

src/components/catalog/
  card-item.tsx
  card-item.browser.test.tsx  # stub (jsdom environment declared, all it.todo)
  card-item.deck.test.tsx     # real tests — deck/selector mode rendering
  catalog-client.tsx
  catalog-client.browser.test.tsx  # stub (all it.todo)

src/app/decks/
  page.tsx
  page.test.tsx               # real jsdom tests — fetch mocking + RTL
```

## Test Structure

**Suite Organization:**
```typescript
// Pure function test (src/lib/filter-cards.test.ts)
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { filterCards, type CardForFilter, type FilterState } from './filter-cards';

const makeCard = (overrides: Partial<CardForFilter> = {}): CardForFilter => {
  const defaults: CardForFilter = { /* full default object */ };
  return { ...defaults, ...overrides };
};

const emptyFilters: FilterState = { search: '', selectedSets: [], ... };

describe('filterCards', () => {
  it('returns empty array when cards is empty', () => {
    expect(filterCards([], emptyFilters)).toEqual([]);
  });

  it('filters by name substring (case-insensitive)', () => {
    const cards = [makeCard({ name: 'Luke Skywalker' }), makeCard({ id: 2, name: 'Darth Vader' })];
    expect(filterCards(cards, { ...emptyFilters, search: 'luke' })).toHaveLength(1);
  });
});
```

**Patterns:**
- Factory functions (`makeCard`, `createCard`) defined at file scope for reuse across tests
- Shared baseline objects (`emptyFilters`) defined at file scope to spread-override per test
- No `beforeAll`/`afterAll` in lib tests — stateless pure functions need no setup
- `beforeEach(() => vi.clearAllMocks())` used in component tests that mock `fetch` and router

## Mocking

**Framework:** `vi` from vitest

**Patterns:**

Module mocking with `vi.mock`:
```typescript
// src/app/decks/page.test.tsx
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// src/components/catalog/card-item.deck.test.tsx
vi.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon" />,
  Minus: () => <div data-testid="minus-icon" />,
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
```

Global `fetch` mocking:
```typescript
// Declare mock at file scope
global.fetch = vi.fn();

// Return value per call (ordered — each mockResolvedValueOnce is consumed once)
(global.fetch as any).mockResolvedValueOnce({
  ok: true,
  json: async () => mockDecks,
});
```

Mock return value setup (router):
```typescript
const mockRouter = { push: vi.fn() };
beforeEach(() => {
  vi.clearAllMocks();
  (useRouter as any).mockReturnValue(mockRouter);
});
```

Browser API mocking:
```typescript
window.confirm = vi.fn().mockReturnValue(true);
```

**What to Mock:**
- Next.js navigation hooks (`useRouter`) — not available in jsdom
- `next/image` and `next/link` — require Next.js runtime context
- Icon libraries (`lucide-react`) — simplify render output in component tests
- Global `fetch` — all API calls in client components go through `fetch`

**What NOT to Mock:**
- Pure utility functions (`filterCards`, `validateDeck`, `toMeleeFormat`) — test these directly without mocking
- Database queries in lib unit tests — DB-dependent tests are deferred to `it.todo` stubs

## Fixtures and Factories

**Test Data — factory pattern:**
```typescript
// src/lib/filter-cards.test.ts
const makeCard = (overrides: Partial<CardForFilter> = {}): CardForFilter => {
  const defaults: CardForFilter = {
    id: 1,
    swudbId: 'SOR-001',
    name: 'Luke Skywalker',
    type: 'Unit',
    aspects: ['Heroism'],
    arenas: ['Ground'],
    traits: ['REBEL'],
    keywords: [],
    cost: 3,
    rarity: 'Common',
    setCode: 'SOR',
    collectorNumber: 'SOR-001',
    // ... all required fields
  };
  return { ...defaults, ...overrides };
};

// src/lib/deck-validation.test.ts
const createCard = (overrides: Partial<Card>): Card => ({
  id: Math.floor(Math.random() * 1000),
  // ... defaults
  ...overrides,
});
const mockLeader = createCard({ type: 'Leader', aspects: ['Command', 'Vigilance'], swudbId: 'L-1' });
const mockBase = createCard({ type: 'Base', aspects: ['Command'], swudbId: 'B-1' });
```

**Location:** Factories are defined inline at the top of each test file — no shared fixture directory.

## Coverage

**Requirements:** No coverage threshold configured. `passWithNoTests: true` means CI passes with stub-only files.

**View Coverage:**
```bash
npx vitest --coverage
```

**Current state:** Coverage is partial — only pure utility functions have full test coverage. Component and DB query tests are largely stubs (`it.todo`).

## Test Types

**Unit Tests (active):**
- Scope: Pure TypeScript functions with no external dependencies
- Files: `src/lib/filter-cards.test.ts`, `src/lib/deck-validation.test.ts`, `src/lib/export.test.ts`
- Environment: `node` (default or explicit `// @vitest-environment node`)
- Assertion style: `expect(result).toEqual(...)`, `expect(result).toHaveLength(N)`, `expect(result).toContain(...)`

**Component Tests (active, partial):**
- Scope: React component rendering and interaction, with mocked dependencies
- Files: `src/app/decks/page.test.tsx`, `src/components/catalog/card-item.deck.test.tsx`
- Environment: `jsdom` — declared per-file with `/** @vitest-environment jsdom */` or `// @vitest-environment jsdom`
- Uses `@testing-library/react`: `render`, `screen`, `fireEvent`, `waitFor`

**Stub Tests (placeholder):**
- Pattern: Test files containing only `it.todo('...')` entries — satisfy test file requirements without implementation
- Files: `src/db/queries/catalog.test.ts`, `src/components/catalog/card-item.browser.test.tsx`, `src/components/catalog/catalog-client.browser.test.tsx`
- Purpose: Documents intended future test coverage; Wave 0 compliance markers

**Integration Tests:**
- Not implemented — DB query tests deferred pending live DB connection strategy
- `src/db/queries/catalog.test.ts` comment: "These tests require a live DB connection; mark as todo for CI"

**E2E Tests:**
- Not used — no Playwright or Cypress configuration present

## Common Patterns

**Environment directive (per-file override):**
```typescript
// @vitest-environment node      ← use in lib tests (explicit, even though node is default)
// @vitest-environment jsdom     ← use in component tests (line comment style)
/** @vitest-environment jsdom */ ← also valid (JSDoc style, used in page.test.tsx)
```

**Async component testing:**
```typescript
import { render, screen, waitFor } from '@testing-library/react';

it('renders decks after loading', async () => {
  (global.fetch as any).mockResolvedValueOnce({
    ok: true,
    json: async () => mockDecks,
  });

  render(<DecksPage />);

  await waitFor(() => {
    expect(screen.getByText('Deck 1')).toBeTruthy();
  });
});
```

**Event simulation:**
```typescript
import { fireEvent } from '@testing-library/react';

fireEvent.change(input, { target: { value: 'New Deck' } });
fireEvent.click(button);
```

**Assertion style for rendered output:**
```typescript
// Prefer .toBeDefined() for element presence (screen.getByText throws if missing)
expect(screen.getByText(/Loading decks.../i)).toBeDefined();

// Use .toBeTruthy() equivalently
expect(screen.getByText('Deck 1')).toBeTruthy();

// Use .toBeNull() / queryByText for absence
expect(screen.queryByText('Deck to Delete')).not.toBeTruthy();

// Use .not.toBeNull() for DOM element presence
const borderDiv = container.querySelector('.border-red-500');
expect(borderDiv).not.toBeNull();
```

**Error path testing:**
```typescript
it('should return errors for an empty deck', () => {
  const result = validateDeck(null, null, [], []);
  expect(result.isValid).toBe(false);
  expect(result.errors).toContain('Leader is required');
});
```

**Spread-override test data:**
```typescript
// Build variants from the emptyFilters baseline
expect(filterCards(cards, { ...emptyFilters, search: 'luke' })).toHaveLength(1);
expect(filterCards(cards, { ...emptyFilters, selectedSets: ['SOR', 'TWI'] })).toHaveLength(2);
```

---

*Testing analysis: 2026-05-08*

---
focus: quality
last_updated: 2026-05-28
---
# Testing Patterns

**Analysis Date:** 2026-05-28

## Test Framework

**Runner:**
- Vitest 4.1.5
- Config: `vitest.config.mts`
- Plugins: `@vitejs/plugin-react`, `vite-tsconfig-paths`

**Assertion Library:**
- Vitest built-in `expect` (Jest-compatible API)

**Supporting libraries:**
- `@testing-library/react` 16.3.2 — component rendering and DOM queries
- `@testing-library/dom` 10.4.1 — DOM utilities
- `jsdom` 29.1.1 — browser environment simulation

**Run Commands:**
```bash
npm test                      # Run all tests (vitest)
npx vitest --watch            # Watch mode
npx vitest --coverage         # Coverage report (no coverage script in package.json)
```

## Vitest Configuration

```typescript
// vitest.config.mts
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'node',      // default — pure Node environment
    globals: true,            // describe/it/expect available globally
    passWithNoTests: true,    // CI does not fail when no tests are found
  },
});
```

The default environment is `node`. Files that render React components override to `jsdom` via a per-file directive.

## Test File Organization

**Location:** All test files are co-located with their source files. There is no separate `tests/` or `__tests__` top-level directory in the current codebase.

**Naming conventions:**
- `[name].test.ts` — pure logic/utility tests
- `[name].test.tsx` — React component tests (jsdom required)
- `[name].browser.test.tsx` — stub/placeholder tests for browser-only behavior
- `[name].deck.test.tsx` — component tests scoped to a specific mode (e.g., `card-item.deck.test.tsx`)

**Actual test file inventory:**
```
src/app/api/collection/collection-shape.test.ts
src/app/collection/page.test.tsx
src/app/decks/[id]/loading.test.tsx
src/app/decks/page.test.tsx
src/components/catalog/card-grid.test.tsx
src/components/catalog/card-item.browser.test.tsx   (all it.todo stubs)
src/components/catalog/card-item.deck.test.tsx
src/components/catalog/card-item.test.tsx
src/components/catalog/catalog-client.browser.test.tsx  (all it.todo stubs)
src/components/home/hero-section.test.tsx
src/components/home/high-value-grid.test.tsx
src/db/queries/catalog.test.ts                       (all it.todo stubs)
src/db/queries/collection.test.ts                   (mix: 3 real + it.todo)
src/lib/auto-filter.test.ts
src/lib/binder-logic.test.ts
src/lib/collection/normalize.test.ts
src/lib/deck-validation.test.ts
src/lib/export.test.ts
src/lib/filter-cards.test.ts
src/lib/sync/prices.test.ts
```

## Environment Directives

Tests declare their environment via a comment at the top of the file (before imports):

```typescript
// Node environment (default — no directive needed, but sometimes stated explicitly):
// @vitest-environment node

// JSdom environment (required for React rendering):
// @vitest-environment jsdom
// OR as JSDoc:
/** @vitest-environment jsdom */
```

- Use `node` for pure logic, DB query stubs, and API helpers.
- Use `jsdom` for any test that calls `render()` from `@testing-library/react`.

## Test Structure

**Suite organization:**
```typescript
import { describe, it, expect } from 'vitest';

describe('featureName', () => {
  describe('subScenario', () => {     // nested describe for variants
    it('does the specific thing', () => {
      // Arrange
      const input = makeCard({ id: 1 });
      // Act
      const result = filterCards([input], filters);
      // Assert
      expect(result).toHaveLength(1);
    });
  });
});
```

**Mix of `describe`+`it` and flat `test`:**
- `describe` + `it` is the standard for logic-heavy modules.
- Flat `test(...)` is used in some component tests: `hero-section.test.tsx`, `card-item.test.tsx`, `high-value-grid.test.tsx`.
- Both styles are acceptable; match the existing style of the file being extended.

**Lifecycle hooks:**
- `beforeEach` used to clear mocks: `vi.clearAllMocks()` and reset global fetch.
- No `afterEach` or `afterAll` observed.

## Mocking

**Framework:** Vitest built-in `vi`

**Mocking Next.js modules (required for all component tests):**
```typescript
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));
```

**Mocking DB modules (to prevent live DB calls in CI):**
```typescript
vi.mock('@/db', () => {
  const throwIfCalled = () => {
    throw new Error('db was called unexpectedly — empty-array guard failed');
  };
  return {
    db: { insert: throwIfCalled, select: throwIfCalled, execute: throwIfCalled },
  };
});
```

**Mocking fetch:**
```typescript
global.fetch = vi.fn();
// Per-test setup:
(global.fetch as any).mockResolvedValueOnce({
  ok: true,
  json: async () => ({ cardsAdded: 55, deckName: 'Luke Skywalker (SOR)' }),
});
```

**Mocking UI components and icons:**
```typescript
vi.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon" />,
  Minus: () => <div data-testid="minus-icon" />,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }: ...) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));
```

**What to mock:**
- `next/image`, `next/link`, `next/navigation` in all component tests — these require a Next.js runtime.
- Database modules (`@/db`, `@/db/queries/*`) when testing logic that calls them but live DB is unavailable.
- `global.fetch` when testing components that call fetch.
- `lucide-react` icons and shadcn/base-ui components when not under test.

**What NOT to mock:**
- Pure logic functions being tested (`filterCards`, `validateDeck`, `calculateLookingFor`).
- The `cn()` utility — mock it only when its output would break the test; otherwise use `(...args) => args.filter(Boolean).join(' ')`.

## Test Data Factories

The codebase uses a consistent factory function pattern in test files. Factories define complete default objects and accept `Partial<T>` overrides:

```typescript
// Pattern used across filter-cards.test.ts, auto-filter.test.ts, deck-validation.test.ts
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
    // ... all required fields
  };
  return { ...defaults, ...overrides };
};
```

**Rules:**
- Factory functions are defined at the top of the test file (not inside `describe` blocks).
- Default values should be representative, valid domain objects.
- Call `makeCard({ id: 2, name: 'Vader' })` to create variations — never mutate the defaults object.
- No central factory registry — each test file defines its own factory for its domain type.

## Stub / Placeholder Tests (it.todo)

Several test files contain only `it.todo(...)` entries. These are deliberate "Wave 0 stubs" — they declare intended test coverage before implementation:

```typescript
// src/db/queries/catalog.test.ts
describe('getAllCards()', () => {
  it.todo('returns an array of card objects (no userId parameter)');
  it.todo('excludes cards whose type contains "token" (case-insensitive)');
});
```

**Policy:** `it.todo` tests do NOT cause the test run to fail (Vitest marks them as skipped). The `passWithNoTests: true` config means a file with only `it.todo` stubs also passes CI.

**Stub file markers:** Files with only stubs include a comment header identifying them: `// Wave 0 stub — covers <REQUIREMENT-ID>`.

Files that are all-stub (no executable assertions):
- `src/components/catalog/card-item.browser.test.tsx`
- `src/components/catalog/catalog-client.browser.test.tsx`
- `src/db/queries/catalog.test.ts`

Files with a mix of stubs and real tests:
- `src/db/queries/collection.test.ts` — 3 real empty-guard tests + DB integration stubs
- `src/app/collection/page.test.tsx` — 2 real fetch-mock tests + PapaParse stubs

## Test Types

**Pure logic / unit tests (node environment):**
- `src/lib/filter-cards.test.ts` — exhaustive filter permutation coverage
- `src/lib/binder-logic.test.ts` — arithmetic edge cases
- `src/lib/deck-validation.test.ts` — SWU deck rules
- `src/lib/auto-filter.test.ts` — aspect union logic
- `src/lib/collection/normalize.test.ts` — CSV normalization
- `src/lib/export.test.ts` — Melee format serialization
- `src/lib/sync/prices.test.ts` — price mapping and currency conversion
- `src/app/api/collection/collection-shape.test.ts` — collection map builder

**Component / rendering tests (jsdom environment):**
- `src/components/catalog/card-item.test.tsx` — mode-based badge/count rendering
- `src/components/catalog/card-item.deck.test.tsx` — shortfall display in selector mode
- `src/components/catalog/card-grid.test.tsx` — virtualized row rendering, priority image threshold
- `src/components/home/hero-section.test.tsx` — locked heading text, CTA links
- `src/components/home/high-value-grid.test.tsx` — price formatting, tile links
- `src/app/decks/page.test.tsx` — CRUD flow with mocked fetch
- `src/app/collection/page.test.tsx` — Quick Add loading/success states
- `src/app/decks/[id]/loading.test.tsx` — skeleton structure + source code assertions

**DB integration tests (all it.todo — require live Neon connection):**
- `src/db/queries/catalog.test.ts`
- `src/db/queries/collection.test.ts` (partial)

**E2E tests:** Not implemented. Playwright and Cypress are not installed. Manual smoke testing referenced in comments as the substitute for browser-only and live-DB scenarios.

## Coverage

**Enforcement:** No coverage thresholds configured in `vitest.config.mts` or `package.json`.

**Covered well:**
- Pure logic in `src/lib/` — filter logic, validation, binder math, export formatting, price sync
- Collection shape builder
- Core component rendering modes (`CardItem`, `HeroSection`, `HighValueGrid`, `CardGrid`)

**Coverage gaps:**
- All DB query functions — tested only via `it.todo` stubs; require a live Neon connection
- `CatalogClient` search/filter UI — fully stubbed, requires real Next.js router
- CSV import flow (PapaParse callback path) — stubs only; requires File object control
- All API route handlers under `src/app/api/` — no route handler tests in the current file inventory
- Binder components: `src/components/binder/` has no test files

## Common Patterns

**Async component testing with fetch:**
```typescript
beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ['SOR', 'SHD'],
  });
});

it('shows success after fetch resolves', async () => {
  render(<CollectionPage />);
  await waitFor(() => {
    expect(screen.getByText(/Added \d+ cards/i)).toBeDefined();
  });
});
```

**Source file assertions (unique pattern in loading.test.tsx):**
```typescript
import { readFileSync } from 'fs';
import { join } from 'path';

it('loading.tsx does not import next/headers', () => {
  const source = readFileSync(join(process.cwd(), 'src/app/decks/[id]/loading.tsx'), 'utf-8');
  expect(source).not.toContain("from 'next/headers'");
});
```
Use this pattern to assert structural constraints on server components that must not call dynamic APIs.

**Mocking `window` globals for jsdom:**
```typescript
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
window.confirm = vi.fn().mockReturnValue(true);
```

**Testing virtualized components:**
Mock `@tanstack/react-virtual`'s `useVirtualizer` to return a deterministic set of virtual rows. Inspect rendered DOM item count, `data-index` attributes, and inline styles rather than testing virtualizer internals.

---

*Testing analysis: 2026-05-28*

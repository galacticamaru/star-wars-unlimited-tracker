# Testing Patterns

**Analysis Date:** 2025-02-14

## Test Framework

**Runner:**
- Vitest 4.1.5
- Config: `vitest.config.mts`

**Assertion Library:**
- Vitest (built-in, Jest-compatible `expect`)

**Run Commands:**
```bash
npm test               # Run all tests using vitest
```

## Test File Organization

**Location:**
- Co-located with source code for unit tests (e.g., `src/lib/filter-cards.test.ts`).
- Top-level `tests/` directory for integration or cross-cutting tests (e.g., `tests/auth-protection.test.ts`).
- Top-level `__tests__/` directory for API or route-specific tests (e.g., `__tests__/api-deck-validation.test.ts`).

**Naming:**
- `[name].test.ts` or `[name].test.tsx`.
- Specific targets may use dot-notation: `[name].browser.test.tsx` or `[name].deck.test.tsx`.

**Structure:**
```
src/
  lib/
    filter-cards.ts
    filter-cards.test.ts
tests/
  auth-protection.test.ts
__tests__/
  api-deck-validation.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect } from 'vitest';

describe('Feature or Unit Name', () => {
  it('should behave in a specific way', () => {
    // Arrange
    // Act
    // Assert
    expect(result).toBe(expected);
  });
});
```

**Patterns:**
- Setup pattern: `beforeEach` used for clearing mocks or setting up initial state.
- Assertion pattern: Uses standard matchers like `toBe`, `toEqual`, `toHaveLength`, `toContain`, `toHaveBeenCalledWith`.
- Environment specification: Uses `// @vitest-environment node` or `// @vitest-environment jsdom` at the top of files.

## Mocking

**Framework:** Vitest (built-in `vi`)

**Patterns:**
```typescript
vi.mock('@/db/queries/decks', () => ({
  getDeckWithCards: vi.fn(),
  updateDeck: vi.fn(),
}));

// Within a test
(getDeckWithCards as any).mockResolvedValue({ id: 1, name: 'Test' });
```

**What to Mock:**
- Database queries and external service clients.
- Complex internal libraries when testing higher-level components (e.g., mocking `validateDeck` in API tests).

**What NOT to Mock:**
- Pure utility functions with no side effects.
- Domain logic that is the subject of the test.

## Fixtures and Factories

**Test Data:**
```typescript
const makeCard = (overrides: Partial<CardForFilter> = {}): CardForFilter => {
  const defaults: CardForFilter = {
    id: 1,
    name: 'Luke Skywalker',
    // ... other defaults
  };
  return { ...defaults, ...overrides };
};
```

**Location:**
- Co-located within the test file for small-scale use.
- No central factory registry detected yet.

## Coverage

**Requirements:** None explicitly enforced in `package.json` scripts, but "Wave 0 stubs" indicate a requirement for coverage of key features.

**View Coverage:**
```bash
# No specific coverage script in package.json, but vitest supports it:
npx vitest --coverage
```

## Test Types

**Unit Tests:**
- Focus on pure logic (e.g., `filter-cards.test.ts`, `deck-validation.test.ts`).
- High completion rate for core logic.

**Integration Tests:**
- API route testing using `NextRequest` and mocked DB queries (`__tests__/api-deck-validation.test.ts`).
- Middleware or protection logic (`tests/auth-protection.test.ts`).

**E2E Tests:**
- Not detected (no Playwright or Cypress configuration).
- Manual smoke testing is referenced in comments as a substitute for some visual/live-DB tests.

## Common Patterns

**Async Testing:**
```typescript
it('handles async operations', async () => {
  const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) });
  const data = await response.json();
  expect(response.status).toBe(200);
});
```

**Error Testing:**
```typescript
it('rejects invalid data', async () => {
  (validateDeck as any).mockReturnValue({ isValid: false, errors: ['Error'] });
  const response = await PATCH(request, ...);
  expect(response.status).toBe(400);
});
```

---

*Testing analysis: 2025-02-14*

# Phase 27: /decks Route Performance - Pattern Map

**Mapped:** 2026-06-02
**Files analyzed:** 8 (5 modified, 3 new tests)
**Analogs found:** 8 / 8

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/db/queries/decks.ts` | query (service) | CRUD | `src/db/queries/catalog.ts` | exact — same `'use cache'` + `cacheTag` + `cacheLife` pattern |
| `src/app/api/decks/route.ts` | route handler | request-response | `src/app/api/cron/sync-cards/route.ts` | role-match — same `revalidateTag` import/call pattern |
| `src/app/api/decks/[id]/route.ts` | route handler | request-response | `src/app/api/cron/sync-cards/route.ts` | role-match — same `revalidateTag` import/call pattern |
| `src/components/decks/decks-client.tsx` | client component | request-response | itself (already has `useRouter`) | self-analog — `router.refresh()` insertion |
| `src/components/decks/deck-builder.tsx` | client component | event-driven | itself (already has `useReducer` + `dispatch`) | self-analog — `startTransition` insertion |
| `src/db/queries/decks.test.ts` *(new)* | test | CRUD | `src/db/queries/catalog.test.ts` | exact — same stub/todo pattern |
| `__tests__/api-deck-revalidate.test.ts` *(new)* | test | request-response | `__tests__/cron-route.test.ts` | exact — same route handler mock pattern |
| `src/components/decks/deck-builder.test.tsx` *(new)* | test | event-driven | `src/app/decks/page.test.tsx` | role-match — same jsdom render + fireEvent pattern |

---

## Pattern Assignments

### `src/db/queries/decks.ts` (query, CRUD)

**Analog:** `src/db/queries/catalog.ts`

**Current state:** `getDecks` and `getDeckWithCards` have no caching directives (lines 5–30 of decks.ts).

**Import pattern to add** (from `catalog.ts` lines 1–5):
```typescript
import { cacheTag, cacheLife } from 'next/cache';
```
Note: D-03 locks out `cacheLife` for deck queries, but the import of `cacheTag` follows the same path. Only `cacheTag` is needed here; `cacheLife` can be omitted from the import if not used.

**Core `'use cache'` + `cacheTag` pattern** (`catalog.ts` lines 7–11):
```typescript
export async function getAllCards() {
  'use cache'
  cacheTag('cards');
  cacheLife('days');
  return db
    .select(...)
```

**Applied to `getDecks`** — copy the directive placement exactly, substitute per-user tag (no `cacheLife` per D-03):
```typescript
export async function getDecks(userId: number) {
  'use cache'
  cacheTag(`decks-user-${userId}`);
  return db
    .select()
    .from(decks)
    .where(eq(decks.userId, userId))
    .orderBy(desc(decks.updatedAt));
}
```

**Applied to `getDeckWithCards`** — tag both dimensions (per D-02); ownership clause (`eq(decks.userId, userId)`) must NOT be removed (Pitfall 3):
```typescript
export async function getDeckWithCards(deckId: number, userId: number) {
  'use cache'
  cacheTag(`deck-${deckId}-user-${userId}`);
  const [deck] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)));
  if (!deck) return null;
  const cards = await db
    .select()
    .from(deckCards)
    .where(eq(deckCards.deckId, deckId));
  return { ...deck, cards };
}
```

**Key rules:**
- `'use cache'` is the FIRST statement in the function body (before any other code)
- `cacheTag(...)` is the SECOND statement immediately after the directive
- No `cacheLife` per D-03 — `revalidateTag` is the only expiry mechanism

---

### `src/app/api/decks/route.ts` (route handler, request-response)

**Analog:** `src/app/api/cron/sync-cards/route.ts`

**Import pattern** (`sync-cards/route.ts` line 4):
```typescript
import { revalidateTag } from 'next/cache';
```
Add this import to the existing imports block in `src/app/api/decks/route.ts` (currently lines 1–4).

**Auth guard pattern** (current `route.ts` lines 22–26 — already present, do not change):
```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session) {
  return new Response('Unauthorized', { status: 401 });
}
```

**`revalidateTag` call pattern** (`sync-cards/route.ts` line 26 — two-argument form is required):
```typescript
revalidateTag('cards', 'max');
```

**Applied to POST handler** — place AFTER `await createDeck(...)` resolves (Pitfall 5), before the response:
```typescript
const userId = Number(session.user.id);
const deck = await createDeck(name, userId);
revalidateTag(`decks-user-${userId}`, 'max');  // ADD — busts list cache
return Response.json(deck);
```

**Error handling pattern** (current `route.ts` lines 36–40 — already present, do not change):
```typescript
} catch (error) {
  console.error('Failed to create deck:', error);
  return new Response('Internal Server Error', { status: 500 });
}
```

---

### `src/app/api/decks/[id]/route.ts` (route handler, request-response)

**Analog:** `src/app/api/cron/sync-cards/route.ts`

**Import pattern** — same as above, add to existing imports (currently lines 1–5):
```typescript
import { revalidateTag } from 'next/cache';
```

**Applied to PATCH handler** — place AFTER `await updateDeck(deckId, userId, body)` (current line 114), before the response. Both tags required per D-04:
```typescript
await updateDeck(deckId, userId, body);
revalidateTag(`deck-${deckId}-user-${userId}`, 'max');  // ADD — busts detail cache
revalidateTag(`decks-user-${userId}`, 'max');           // ADD — busts list cache
return Response.json({ success: true });
```

**Applied to DELETE handler** — place AFTER `await deleteDeck(deckId, Number(session.user.id))` (current line 140), before the response. Both tags required per D-04:
```typescript
const userId = Number(session.user.id);
await deleteDeck(deckId, userId);
revalidateTag(`deck-${deckId}-user-${userId}`, 'max');  // ADD — busts detail cache
revalidateTag(`decks-user-${userId}`, 'max');           // ADD — busts list cache
return Response.json({ success: true });
```

Note: the DELETE handler currently uses `Number(session.user.id)` inline — extract to `userId` const to avoid repeating the conversion in the `revalidateTag` call.

---

### `src/components/decks/decks-client.tsx` (client component, request-response)

**Analog:** itself — `useRouter` already imported and `router` initialized (lines 4, 39).

**`router.refresh()` call pattern** (from RESEARCH.md Pattern 3):
```typescript
// router.refresh() must fire ONLY after res.ok — never on failure
if (res.ok) {
  // existing code stays
  router.refresh(); // ADD — busts Router Cache
}
```

**Applied to `handleCreateDeck`** (current lines 62–75 — add `router.refresh()` before `router.push`):
```typescript
if (res.ok) {
  const deck = await res.json();
  router.refresh();           // ADD — bust Router Cache before navigation
  router.push(`/decks/${deck.id}`);
}
```

**Applied to `handleDeleteDeck`** (current lines 81–89 — add `router.refresh()` alongside filter update):
```typescript
if (res.ok) {
  setDecks(decks.filter((d) => d.id !== id));
  router.refresh();  // ADD — bust Router Cache
}
```

**Critical ordering (Pitfall 2):** `router.refresh()` must be called BEFORE `router.push()` when both are present. Both calls are synchronous (they schedule effects); order matters for cache state at navigation time.

---

### `src/components/decks/deck-builder.tsx` (client component, event-driven)

**Analog:** itself — `useReducer` + `dispatch` already present (lines 3, 128).

**Import modification** (current line 3 — add `startTransition` to existing React import):
```typescript
// Before:
import { useReducer, useState, useMemo, useEffect, useRef } from 'react';
// After:
import { useReducer, useState, useMemo, useEffect, useRef, startTransition } from 'react';
```

**`startTransition` wrapping pattern** — wrap ONLY the `dispatch` call, leave `setIsAutoFilterOverridden(false)` outside the transition (Pitfall 4):

**Applied to `handleDeckUpdate`** (current lines 245–258):
```typescript
const handleDeckUpdate = (cardDefinitionId: number, quantity: number) => {
  const card = cardMap.get(cardDefinitionId);
  if (!card) return;

  if (card.type === 'Leader') {
    startTransition(() => {                                                    // ADD WRAP
      dispatch({ type: 'SET_LEADER', payload: quantity > 0 ? cardDefinitionId : null });
    });                                                                        // END WRAP
    setIsAutoFilterOverridden(false);  // stays OUTSIDE — immediate update
  } else if (card.type === 'Base') {
    startTransition(() => {                                                    // ADD WRAP
      dispatch({ type: 'SET_BASE', payload: quantity > 0 ? cardDefinitionId : null });
    });                                                                        // END WRAP
    setIsAutoFilterOverridden(false);  // stays OUTSIDE — immediate update
  } else {
    startTransition(() => {                                                    // ADD WRAP
      dispatch({ type: 'UPDATE_CARD', payload: { cardDefinitionId, quantity, isSideboard: false } });
    });                                                                        // END WRAP
  }
};
```

**`router.refresh()` addition to `handleSave`** (current lines 283–316 — add `router.refresh()` on success before conditional `router.push`):
```typescript
if (res.ok) {
  cleanStateRef.current = { ...state, isDraft };
  router.refresh();  // ADD — bust Router Cache
  if (!isDraft) {
    router.push('/decks');
  }
}
```

**What NOT to wrap (D-08):** `handleSave` is an async network call; wrapping it in `startTransition` is explicitly out of scope and would conflict with `setIsSaving` loading state management.

---

### `src/db/queries/decks.test.ts` *(new test file)*

**Analog:** `src/db/queries/catalog.test.ts`

**Test environment and structure** (`catalog.test.ts` lines 1–6):
```typescript
// @vitest-environment node
// Wave 0 stub — covers [domain] query behavior
// These tests require a live DB connection; mark as todo for CI
import { describe, it } from 'vitest';

describe('getDecks()', () => {
  it.todo('returns only decks belonging to the given userId');
  it.todo("contains 'use cache' directive in function body");
  it.todo("calls cacheTag with 'decks-user-{userId}' tag");
});

describe('getDeckWithCards()', () => {
  it.todo("contains 'use cache' directive in function body");
  it.todo("calls cacheTag with 'deck-{deckId}-user-{userId}' tag");
  it.todo('returns null when deckId does not belong to userId');
  it.todo('ownership clause eq(decks.userId, userId) is still present after caching added');
});
```

---

### `__tests__/api-deck-revalidate.test.ts` *(new test file)*

**Analog:** `__tests__/cron-route.test.ts`

**Test environment, mock setup, and re-import pattern** (`cron-route.test.ts` lines 1–23):
```typescript
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock next/cache — revalidateTag must be a vi.fn() to assert calls
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

// Mock DB query functions — tests should not hit the database
vi.mock('@/db/queries/decks', () => ({
  createDeck: vi.fn().mockResolvedValue({ id: 42, name: 'Test Deck' }),
  updateDeck: vi.fn().mockResolvedValue(42),
  deleteDeck: vi.fn().mockResolvedValue(undefined),
  getDeckWithCards: vi.fn().mockResolvedValue(null),
}));

// Mock auth — return authenticated session
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({ user: { id: '7' } }),
    },
  },
}));
```

**Re-import pattern per test** (mirrors `cron-route.test.ts` lines 13–18 — re-import handler each time):
```typescript
beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import('../src/app/api/decks/route');
  postHandler = mod.POST;
});
```

**Assertion pattern for `revalidateTag`:**
```typescript
import { revalidateTag } from 'next/cache';

it("POST calls revalidateTag('decks-user-{userId}', 'max') after createDeck", async () => {
  const req = new NextRequest('http://localhost/api/decks', {
    method: 'POST',
    body: JSON.stringify({ name: 'Test Deck' }),
    headers: { 'Content-Type': 'application/json' },
  });
  await postHandler(req);
  expect(revalidateTag).toHaveBeenCalledWith('decks-user-7', 'max');
});
```

---

### `src/components/decks/deck-builder.test.tsx` *(new test file)*

**Analog:** `src/app/decks/page.test.tsx`

**Test environment and render setup** (`page.test.tsx` lines 1–13):
```typescript
/** @vitest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRouter } from 'next/navigation';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// mockRouter needs refresh: vi.fn() for PERF-07 assertions
const mockRouter = {
  push: vi.fn(),
  refresh: vi.fn(),
};
```

**Mock pattern for `startTransition`** — React's `startTransition` runs callbacks synchronously in test environments; no special mock needed. The test can assert that `dispatch` was called (via state inspection) without mocking `startTransition` itself.

---

## Shared Patterns

### Two-argument `revalidateTag` (critical — single-arg is deprecated in Next.js 16)

**Source:** `src/app/api/cron/sync-cards/route.ts` line 26
**Apply to:** All three mutation handlers (POST `/api/decks`, PATCH `/api/decks/[id]`, DELETE `/api/decks/[id]`)
```typescript
revalidateTag('cards', 'max');  // established project pattern
// Deck equivalent:
revalidateTag(`decks-user-${userId}`, 'max');
revalidateTag(`deck-${deckId}-user-${userId}`, 'max');
```

### Session auth guard pattern

**Source:** `src/app/api/decks/route.ts` lines 22–26 (already present in all deck handlers)
**Apply to:** No changes needed — all handlers already have the auth guard. `revalidateTag` must be placed AFTER this guard (it already only runs on the success path).
```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session) {
  return new Response('Unauthorized', { status: 401 });
}
const userId = Number(session.user.id);
```

### `'use cache'` directive placement

**Source:** `src/db/queries/catalog.ts` lines 7–10
**Apply to:** `getDecks` and `getDeckWithCards` in `src/db/queries/decks.ts`
```typescript
export async function getAllCards() {
  'use cache'           // line 1 of function body — directive string literal
  cacheTag('cards');    // line 2 — tag registration
  cacheLife('days');    // line 3 — TTL (omit for deck queries per D-03)
  return db.select()... // actual query follows
```

### Two-layer cache invalidation (server + client)

**Source:** `src/app/api/cron/sync-cards/route.ts` (server layer) + `src/components/decks/decks-client.tsx` (client layer — currently missing `router.refresh()`)
**Apply to:** All mutation flows: create (POST), update (PATCH), delete (DELETE)

Layer 1 — server (route handler):
```typescript
revalidateTag(`decks-user-${userId}`, 'max');  // busts Data Cache
```

Layer 2 — client (component, after `res.ok`):
```typescript
router.refresh();  // busts Router Cache (client-side navigation cache)
```

### `useRouter` already-imported pattern

**Source:** `src/components/decks/decks-client.tsx` line 4 and `src/components/decks/deck-builder.tsx` line 10
**Apply to:** `router.refresh()` additions in both components — no new import needed
```typescript
import { useRouter } from 'next/navigation';
// ...
const router = useRouter();  // decks-client.tsx line 39, deck-builder.tsx line 134
```

---

## No Analog Found

No files in this phase lack analogs. All modification targets are either exact analogs of existing patterns or are self-analogs (the file being modified already contains the surrounding structure for the insertion).

---

## Anti-Pattern Index

Derived from RESEARCH.md — key guards for the planner to encode in plan acceptance criteria:

| Anti-Pattern | Source File | Correct Pattern |
|---|---|---|
| `cacheTag('decks')` without userId | n/a | `cacheTag(\`decks-user-${userId}\`)` — always |
| `revalidateTag(tag)` single-arg | sync-cards (does it right) | `revalidateTag(tag, 'max')` — always |
| `router.refresh()` before `res.ok` | n/a | Inside `if (res.ok)` block only |
| `startTransition` around `setIsAutoFilterOverridden` | deck-builder.tsx lines 251/254 | Only `dispatch(...)` goes inside the transition |
| `revalidateTag` before `await mutation` | n/a | Always after the awaited DB call |
| Removing `eq(decks.userId, userId)` from queries | decks.ts lines 17/60 | Ownership clause stays — caching does not replace it |

---

## Metadata

**Analog search scope:**
- `src/db/queries/` — query layer
- `src/app/api/` — route handlers
- `src/components/decks/` — client components
- `__tests__/` and `src/**/*.test.*` — test files

**Files read:** 10 source files + 2 test files
**Pattern extraction date:** 2026-06-02

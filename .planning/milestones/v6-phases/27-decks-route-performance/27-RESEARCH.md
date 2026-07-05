# Phase 27: /decks Route Performance - Research

**Researched:** 2026-06-02
**Domain:** Next.js 16 `use cache` / `cacheTag` / `revalidateTag`, React `startTransition`, Vercel Speed Insights
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** `'use cache'` directive goes inside `getDecks` and `getDeckWithCards` function bodies in `src/db/queries/decks.ts` — same pattern as `getAllCards()` / `getFilterOptions()` in `src/db/queries/catalog.ts`.

**D-02:** Cache tags per STATE.md:
- `getDecks(userId)` → `cacheTag('decks-user-{userId}')`
- `getDeckWithCards(deckId, userId)` → `cacheTag('deck-{deckId}-user-{userId}')`
- **Never** cache without `userId` in the key — cross-user data leak risk.

**D-03:** No `cacheLife` — deck data lives in cache indefinitely until explicitly invalidated. No TTL safety net; `revalidateTag` is the sole expiry mechanism.

**D-04:** `revalidateTag` scope per mutation:
- `POST /api/decks` (create): `revalidateTag('decks-user-{userId}', 'max')`
- `PATCH /api/decks/[id]` (update): `revalidateTag('deck-{deckId}-user-{userId}', 'max')` + `revalidateTag('decks-user-{userId}', 'max')`
- `DELETE /api/decks/[id]` (delete): `revalidateTag('deck-{deckId}-user-{userId}', 'max')` + `revalidateTag('decks-user-{userId}', 'max')`

**D-05:** Two-layer invalidation: `revalidateTag()` in API route handlers busts the Data Cache (server-side); `router.refresh()` in the client component after mutation success busts the Router Cache. Both must fire.

**D-06:** `startTransition` wraps the card add/remove `onClick` dispatch handlers for `UPDATE_CARD`, `SET_LEADER`, and `SET_BASE` in `deck-builder.tsx`.

**D-07:** `useDeferredValue` is NOT applied. The deck list is capped at ~60 cards.

**D-08:** `handleSave` (the async save operation) is not wrapped in `startTransition`.

**D-09:** Execution includes a mandatory checkpoint: review the Vercel Speed Insights dashboard for /decks FCP/LCP/INP data before applying fixes.

**D-10:** Fallback (no data available): apply catalog-parity improvements — Suspense boundaries, `loading.tsx` skeleton, image lazy loading.

### Claude's Discretion

- Exact placement of `cacheTag` / `revalidateTag` imports (they come from `'next/cache'` — same as catalog.ts)
- Whether `getDecks` needs a `cacheLife` argument alongside `cacheTag` or not (D-03 says no TTL, but Claude may add one if there's a strong technical reason)
- Specific Suspense boundary placement within `/decks/[id]/page.tsx` for the PERF-09 fallback path

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PERF-07 | `/decks` and `/decks/[id]` data fetches use per-user `cacheTag` with `revalidateTag` called in all deck mutation handlers (create, update, delete) | `'use cache'` + `cacheTag` pattern verified in catalog.ts; `revalidateTag` import confirmed in cron route; full signature documented below |
| PERF-08 | Card add/remove interactions in the deck builder use `startTransition` to prevent INP regressions | `startTransition` is a named React export; exact dispatch call sites identified in `handleDeckUpdate` |
| PERF-09 | Vercel Speed Insights FCP/LCP/INP data for `/decks` routes is reviewed and specific identified regressions are resolved | Mandatory human checkpoint; fallback path is catalog-parity improvements; existing `loading.tsx` skeleton confirmed present for `/decks/[id]` |
</phase_requirements>

---

## Summary

Phase 27 is a targeted performance pass on two routes (`/decks` and `/decks/[id]`). All three requirements have clearly established implementation paths: PERF-07 mirrors a working pattern already in `catalog.ts`, PERF-08 adds a single React API import to an existing dispatch flow, and PERF-09 is data-driven with a defined fallback.

The project uses Next.js 16.2.4 with `cacheComponents: true` already set in `next.config.ts`. This means `'use cache'`, `cacheTag`, `cacheLife`, and `revalidateTag` are all production-ready APIs. The `revalidateTag` two-argument form (`revalidateTag(tag, 'max')`) is the non-deprecated signature per the local docs. The existing cron route already uses `revalidateTag('cards', 'max')` — that pattern is the established project convention.

One critical API difference from training data: the single-argument `revalidateTag(tag)` form is deprecated in this Next.js version. The correct signature is `revalidateTag(tag, 'max')` for stale-while-revalidate semantics. Implementations that omit the second argument will trigger TypeScript errors and deprecated behavior warnings.

**Primary recommendation:** Follow the catalog.ts pattern exactly for PERF-07; add `startTransition` around dispatch calls in `handleDeckUpdate` for PERF-08; gate PERF-09 behind a human Speed Insights review checkpoint before applying any targeted fixes.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Deck data caching (`getDecks`, `getDeckWithCards`) | API / Backend (RSC query layer) | — | Cache is applied inside the async query function, not at the page or client layer |
| Cache invalidation on mutation | API / Backend (Route Handler) | Browser / Client (router.refresh) | Server-side `revalidateTag` busts Data Cache; client-side `router.refresh()` busts Router Cache — both tiers required |
| INP optimization (card add/remove) | Browser / Client | — | `startTransition` is a React client-side API; affects how the browser schedules state updates |
| Speed Insights review | CDN / External (Vercel dashboard) | API / Backend | Data comes from Vercel telemetry; fixes applied to server rendering or client interaction depending on which metric regresses |
| Loading skeleton (`loading.tsx`) | Frontend Server (SSR) | — | Next.js Suspense integration; skeleton is a Server Component streamed before page data resolves |

---

## Standard Stack

### Core (no new packages — all already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next/cache` (cacheTag) | Next.js 16.2.4 | Tag cache entries for per-user invalidation | Built-in to Next.js `cacheComponents` feature; already used in catalog.ts |
| `next/cache` (revalidateTag) | Next.js 16.2.4 | Bust Data Cache on mutation | Built-in; already used in cron sync route |
| `next/navigation` (useRouter) | Next.js 16.2.4 | `router.refresh()` to bust Router Cache | Already imported in both client components |
| `react` (startTransition) | React (bundled with Next.js 16) | Mark card dispatch as non-urgent update | Named export from `react`; prevents INP regression |

**No new packages are required for this phase.** All APIs are already available.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `revalidateTag` per-user tag | `revalidatePath('/decks')` | `revalidatePath` busts all users' caches for that path — not viable for per-user data |
| `startTransition` for dispatch | `useDeferredValue` on deck list | `useDeferredValue` adds complexity without benefit at ≤60 cards (D-07 locks this out) |
| No `cacheLife` (D-03) | `cacheLife('max')` | No functional difference when `revalidateTag` is the sole expiry; D-03 locks this out |

---

## Package Legitimacy Audit

No new packages are installed in this phase. All APIs used (`cacheTag`, `revalidateTag`, `startTransition`, `router.refresh()`) are built into already-installed dependencies (`next`, `react`).

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
User navigates to /decks
         │
         ▼
[Next.js RSC page.tsx] ──calls──► [getDecks(userId)]
         │                              │
         │                         ['use cache' boundary]
         │                         [cacheTag('decks-user-{id}')]
         │                              │
         │                    ┌─── cache HIT? ───┐
         │                    │ YES: serve cached │ NO: query DB
         │                    └──────────────────┘
         │
         ▼
[DecksClient (browser)] ◄── initialDecks prop
         │
    user mutates (create/delete)
         │
         ▼
[fetch POST/DELETE /api/decks] ──► [Route Handler]
                                          │
                                    revalidateTag('decks-user-{id}', 'max')
                                    [Data Cache busted]
                                          │
                                   response.ok
                                          │
                                   router.refresh()
                                   [Router Cache busted]
                                          │
                                   Next page load hits DB again
```

```
User taps add/remove card in DeckBuilder
         │
         ▼
handleDeckUpdate(cardDefinitionId, quantity)
         │
    ┌────┴──────────────┐
    │                   │
 Leader/Base type    Other card type
    │                   │
startTransition(   startTransition(
  () => dispatch(    () => dispatch(
    SET_LEADER /       UPDATE_CARD
    SET_BASE))       ))
    │                   │
    └────┬──────────────┘
         │
React defers re-render ──► browser stays responsive
         │
         ▼
Reducer runs, state updates, re-render scheduled as transition
(UI does not block — INP stays low)
```

### Recommended Project Structure

No structural changes. All modifications are surgical edits to existing files:

```
src/
├── db/queries/
│   └── decks.ts              # ADD 'use cache' + cacheTag to getDecks, getDeckWithCards
├── app/api/decks/
│   ├── route.ts              # ADD revalidateTag to POST handler
│   └── [id]/route.ts         # ADD revalidateTag to PATCH + DELETE handlers
└── components/decks/
    ├── decks-client.tsx       # ADD router.refresh() after DELETE success
    └── deck-builder.tsx       # ADD startTransition around dispatch in handleDeckUpdate; ADD router.refresh() after PATCH success
```

### Pattern 1: `'use cache'` + `cacheTag` inside async function (PERF-07)

**What:** Add the `'use cache'` directive at the top of the function body, then call `cacheTag` with a per-user interpolated string. Follows the identical pattern already in `catalog.ts`.

**When to use:** Any async function that fetches user-scoped data from the DB and is called in RSC context.

**Example:**
```typescript
// Source: node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md
// + existing reference implementation: src/db/queries/catalog.ts lines 7-10
import { cacheTag } from 'next/cache';

export async function getDecks(userId: number) {
  'use cache'
  cacheTag(`decks-user-${userId}`);
  return db
    .select()
    .from(decks)
    .where(eq(decks.userId, userId))
    .orderBy(desc(decks.updatedAt));
}

export async function getDeckWithCards(deckId: number, userId: number) {
  'use cache'
  cacheTag(`deck-${deckId}-user-${userId}`);
  // ... existing query body unchanged
}
```

### Pattern 2: `revalidateTag` in Route Handler (PERF-07)

**What:** Import `revalidateTag` from `'next/cache'` and call it with the `'max'` profile after each mutation succeeds. The two-argument form is required — the single-argument form is deprecated in Next.js 16.

**When to use:** After any DB write that modifies data covered by a `cacheTag`.

**Example:**
```typescript
// Source: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidateTag.md
// + existing pattern: src/app/api/cron/sync-cards/route.ts line 26
import { revalidateTag } from 'next/cache';

// In POST /api/decks:
await createDeck(name, userId);
revalidateTag(`decks-user-${userId}`, 'max');

// In PATCH /api/decks/[id]:
await updateDeck(deckId, userId, body);
revalidateTag(`deck-${deckId}-user-${userId}`, 'max');
revalidateTag(`decks-user-${userId}`, 'max');

// In DELETE /api/decks/[id]:
await deleteDeck(deckId, userId);
revalidateTag(`deck-${deckId}-user-${userId}`, 'max');
revalidateTag(`decks-user-${userId}`, 'max');
```

### Pattern 3: `router.refresh()` after client mutation success (PERF-07)

**What:** After `await fetch(...)` resolves with `res.ok`, call `router.refresh()` to invalidate the Router Cache (client-side navigation cache). This forces the next navigation or RSC re-render to pull fresh server data.

**When to use:** In Client Components after any mutation that should refresh RSC-rendered data.

**Example:**
```typescript
// Source: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md
// router is already initialized via useRouter() in both components

// In decks-client.tsx handleDeleteDeck:
if (res.ok) {
  setDecks(decks.filter((d) => d.id !== id));
  router.refresh(); // ADD THIS — busts Router Cache
}

// In deck-builder.tsx handleSave:
if (res.ok) {
  cleanStateRef.current = { ...state, isDraft };
  router.refresh(); // ADD THIS — busts Router Cache
  if (!isDraft) {
    router.push('/decks');
  }
}
```

### Pattern 4: `startTransition` around dispatch calls (PERF-08)

**What:** Import `startTransition` from React and wrap the `dispatch` call in the transition callback. This tells React the state update is non-urgent — the browser can handle input events between the transition's start and commit.

**When to use:** High-frequency user interactions (rapid taps on add/remove) that trigger expensive state updates (array operations on deck card list, useMemo re-computations of grouped deck).

**Example:**
```typescript
// Source: React docs on startTransition; import is a named export from 'react'
// Current import in deck-builder.tsx line 3: import { useReducer, useState, ... } from 'react';
// Add startTransition to that import:
import { useReducer, useState, useMemo, useEffect, useRef, startTransition } from 'react';

// Current handleDeckUpdate (lines 245-258):
const handleDeckUpdate = (cardDefinitionId: number, quantity: number) => {
  const card = cardMap.get(cardDefinitionId);
  if (!card) return;

  if (card.type === 'Leader') {
    startTransition(() => {   // WRAP
      dispatch({ type: 'SET_LEADER', payload: quantity > 0 ? cardDefinitionId : null });
    });                       // END WRAP
    setIsAutoFilterOverridden(false); // stays outside — not a transition
  } else if (card.type === 'Base') {
    startTransition(() => {   // WRAP
      dispatch({ type: 'SET_BASE', payload: quantity > 0 ? cardDefinitionId : null });
    });                       // END WRAP
    setIsAutoFilterOverridden(false); // stays outside — not a transition
  } else {
    startTransition(() => {   // WRAP
      dispatch({ type: 'UPDATE_CARD', payload: { cardDefinitionId, quantity, isSideboard: false } });
    });                       // END WRAP
  }
};
```

**Important:** `setIsAutoFilterOverridden(false)` is NOT wrapped in the transition. It's a simple boolean state update that should apply immediately (not deferred). Only the `dispatch` calls that cause expensive reducer + useMemo recalculation need the transition.

### Anti-Patterns to Avoid

- **Caching without `userId` in the tag:** `cacheTag('decks')` or `cacheTag('deck-{deckId}')` without the user ID would allow one user's cached data to be served to another user. Always interpolate `userId` into every deck cache tag.
- **Single-argument `revalidateTag`:** `revalidateTag('decks-user-${userId}')` (no second arg) is deprecated in Next.js 16. The behavior is now explicitly marked deprecated in the local docs. Always pass `'max'` as the second argument.
- **`revalidateTag` in Client Components:** `revalidateTag` is a server-only API. It cannot be called in Client Components. It must live in Route Handlers or Server Actions.
- **`router.refresh()` before `res.ok` check:** Calling `router.refresh()` on every mutation attempt (including failed ones) causes unnecessary re-renders. It must fire only after `res.ok` is confirmed.
- **Wrapping `handleSave` in `startTransition`:** `handleSave` is an async network call — INP is not the concern there (D-08). Wrapping it would mask the loading state and conflict with `setIsSaving`.
- **No `cacheLife` without understanding the default:** Without an explicit `cacheLife`, `'use cache'` uses the `default` profile: `stale: 5min`, `revalidate: 15min`, `expire: never`. For deck data that must stay fresh until explicitly invalidated, D-03 (no TTL) means `revalidateTag` is the only expiry mechanism. This is acceptable — but it means a user on a 14-minute-old client cache will NOT see fresh data until they navigate away and back, unless `router.refresh()` is called.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Per-user cache invalidation | Custom TTL logic or polling | `cacheTag` + `revalidateTag` | Next.js handles cache storage, propagation, and expiry across all call sites of the query function |
| Non-blocking UI for frequent state updates | `setTimeout`, batching, or debouncing | `startTransition` | React's scheduler knows when the browser is idle; manual debouncing creates artificial delays |
| Busting client navigation cache | Full page reload (`window.location.reload()`) | `router.refresh()` | `refresh()` re-renders only affected Server Components without destroying client state (scroll position, form inputs) |

**Key insight:** All three problems in this phase are solved by framework primitives that exist precisely to handle these edge cases. The footguns (cross-user cache leaks, INP regressions, stale client cache) are the reason these APIs exist.

---

## Common Pitfalls

### Pitfall 1: Missing `revalidateTag` on the `decks-user-{userId}` list tag after deck update/delete

**What goes wrong:** `getDeckWithCards` cache is busted for the specific deck, but `getDecks` (the list query) still serves stale data. The user sees the old deck in the deck list even though the detail page shows fresh data.

**Why it happens:** PATCH and DELETE operations affect two cache entries: the specific deck entry AND the list. Developers often only invalidate the specific deck tag.

**How to avoid:** Per D-04, PATCH and DELETE always call `revalidateTag` twice — once for the deck-specific tag, once for the user list tag.

**Warning signs:** After saving a deck with a new name, navigating back to `/decks` shows the old deck name.

### Pitfall 2: `router.refresh()` not awaited / called before navigation

**What goes wrong:** In `handleSave` (where `router.push('/decks')` follows on save), the Router Cache bust must happen before or simultaneously with navigation. If `router.push` fires before `router.refresh()`, the browser navigates with stale client cache and shows the old deck list.

**Why it happens:** Developers call `router.push('/decks')` immediately after `res.ok` without calling `router.refresh()` first.

**How to avoid:** Call `router.refresh()` before `router.push()` (or alongside — both are synchronous calls that schedule effects). The order is: `router.refresh()` then `router.push('/decks')` (or `router.push` only on `!isDraft`, but `refresh()` always fires on success).

**Warning signs:** After finalizing a deck and being redirected to `/decks`, the saved deck shows the old name or the deleted deck is still visible.

### Pitfall 3: `'use cache'` inside `getDeckWithCards` — the `userId` ownership check is still required

**What goes wrong:** Adding `'use cache'` to `getDeckWithCards` does NOT change the fact that the function checks deck ownership (`and(eq(decks.id, deckId), eq(decks.userId, userId))`). The cache key includes both `deckId` and `userId` via `cacheTag`, so different users get different cache entries. But the ownership check inside the query must remain — removing it would be a security regression.

**Why it happens:** Confusion between "the cache is per-user" and "the query enforces ownership". Both must be true.

**How to avoid:** Do not remove the `and(eq(decks.userId, userId))` clause from any query when adding `'use cache'`.

**Warning signs:** If the ownership clause is accidentally removed, users can fetch other users' decks — a data isolation violation.

### Pitfall 4: `startTransition` wrapping `setIsAutoFilterOverridden(false)` breaks auto-filter behavior

**What goes wrong:** If `setIsAutoFilterOverridden(false)` is included inside the `startTransition` callback, the filter override resets asynchronously — it may flash on-screen before resetting, or reset too late relative to the leader/base update.

**Why it happens:** Developers wrap the entire if-block body in the transition rather than just the `dispatch` call.

**How to avoid:** Only the `dispatch` call goes inside `startTransition`. `setIsAutoFilterOverridden(false)` stays outside.

**Warning signs:** The auto-filter chip label briefly shows the overridden state before snapping back after a leader/base change.

### Pitfall 5: `revalidateTag` called before the mutation completes

**What goes wrong:** If `revalidateTag` is called before `await updateDeck(...)` resolves, the cache is busted but the DB write hasn't committed yet. The next request re-fetches stale data from the DB.

**Why it happens:** `revalidateTag` is synchronous and can be placed anywhere in the handler body. Developers may call it before the await.

**How to avoid:** Always place `revalidateTag` calls AFTER the awaited DB operation.

**Warning signs:** After a save, the page briefly shows stale data before refreshing to the correct new data.

---

## Code Examples

### PERF-07: Complete `getDecks` after modification

```typescript
// Source: pattern from src/db/queries/catalog.ts + cacheTag docs
import { cacheTag } from 'next/cache';

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

### PERF-07: Complete `getDeckWithCards` after modification

```typescript
// Source: pattern from src/db/queries/catalog.ts + cacheTag docs
import { cacheTag } from 'next/cache';

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

### PERF-07: POST handler in `/api/decks/route.ts` after modification

```typescript
// Source: revalidateTag docs + existing pattern in sync-cards/route.ts
import { revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  // ... auth check, parse body ...
  const userId = Number(session.user.id);
  const deck = await createDeck(name, userId);
  revalidateTag(`decks-user-${userId}`, 'max'); // ADD
  return Response.json(deck);
}
```

### PERF-07: PATCH handler in `/api/decks/[id]/route.ts` after modification

```typescript
// After: await updateDeck(deckId, userId, body);
revalidateTag(`deck-${deckId}-user-${userId}`, 'max'); // ADD
revalidateTag(`decks-user-${userId}`, 'max');          // ADD
return Response.json({ success: true });
```

### PERF-07: DELETE handler in `/api/decks/[id]/route.ts` after modification

```typescript
// After: await deleteDeck(deckId, userId);
revalidateTag(`deck-${deckId}-user-${userId}`, 'max'); // ADD
revalidateTag(`decks-user-${userId}`, 'max');          // ADD
return Response.json({ success: true });
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `revalidateTag(tag)` (1-arg) | `revalidateTag(tag, 'max')` | Next.js 16 | Old form is deprecated; may be removed in a future version; TypeScript will warn |
| `experimental: { dynamicIO: true }` flag for `use cache` | `cacheComponents: true` | Next.js 16 | API graduated from experimental; `dynamicIO` flag is no longer the enablement mechanism |
| `unstable_cache` | `'use cache'` directive | Next.js 15+ | `unstable_cache` is still available but not the preferred pattern; `'use cache'` is the stable replacement |

**Deprecated/outdated:**
- `revalidateTag(tag)` without second argument: deprecated, behavior is "immediately expire" (blocking revalidate), which may be removed.
- `experimental: { dynamicIO: true }` in next.config: replaced by `cacheComponents: true` (already set correctly in this project).
- Single-argument `useRouter` from `next/router`: must import from `next/navigation` (already correct in this project).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | D-03 (no `cacheLife`) is safe on Vercel serverless because `revalidateTag` is the only expiry mechanism | Standard Stack / Patterns | Vercel serverless instances don't persist in-memory cache across requests — so the `default` profile's 15-minute server revalidate may not apply in practice; cache entries effectively only persist within a single instance's lifetime. `revalidateTag` firing correctly ensures data freshness regardless. Risk: low. |

**All other claims in this research were verified against the local Next.js 16.2.4 docs in `node_modules/next/dist/docs/`.**

---

## Open Questions

1. **Speed Insights data availability (PERF-09)**
   - What we know: `@vercel/speed-insights@2.0.0` is wired into the root layout (Phase 25.1). The Vercel dashboard should have real-user FCP/LCP/INP data for `/decks` if the route has received traffic.
   - What's unclear: Whether there is enough traffic on `/decks` specifically to surface actionable regression data vs. just baseline noise.
   - Recommendation: The plan must include a mandatory human checkpoint (D-09) after deploying PERF-07 and PERF-08, where the user reviews the Speed Insights dashboard and provides specific metric findings before the executor applies targeted fixes.

2. **`handleCreateDeck` — does it need `router.refresh()` in addition to `router.push`?**
   - What we know: After `POST /api/decks`, the user is pushed to `/decks/{id}` (the new deck detail page). The deck list `/decks` cache is busted via `revalidateTag`. When the user eventually navigates back to `/decks`, `router.refresh()` would normally be needed to bust the Router Cache.
   - What's unclear: `router.push('/decks/{id}')` loads a new route — the Router Cache for `/decks` (a different route) may be automatically stale after the push. The risk of stale `/decks` list is lower here than for delete (where the user stays on `/decks`).
   - Recommendation: Add `router.refresh()` before `router.push` in `handleCreateDeck` for consistency with D-05, even if the risk is lower. The plan should include this as a task step.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Next.js `cacheComponents` | PERF-07 `use cache` / `cacheTag` | ✓ | 16.2.4 (`cacheComponents: true` in next.config.ts) | — |
| `revalidateTag` from `next/cache` | PERF-07 cache invalidation | ✓ | Already used in cron route | — |
| `startTransition` from `react` | PERF-08 INP optimization | ✓ | Bundled with Next.js 16 | — |
| Vercel Speed Insights dashboard | PERF-09 data review | ? | `@vercel/speed-insights@2.0.0` wired; dashboard access requires human login | Human checkpoint required |

**Missing dependencies with no fallback:** None (all code-level dependencies are available).

**Missing dependencies with fallback:** Speed Insights dashboard access requires a human to log in and review — this is the mandatory checkpoint in D-09. Fallback is D-10 (catalog-parity improvements without data).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (vitest.config.mts) |
| Config file | `vitest.config.mts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERF-07 | `getDecks` and `getDeckWithCards` contain `'use cache'` directive and `cacheTag` call | unit (source inspection) | `npx vitest run src/db/queries/decks.test.ts` | ❌ Wave 0 — needs creation |
| PERF-07 | `revalidateTag` is called after each mutation in API route handlers | unit (mock) | `npx vitest run __tests__/api-deck-revalidate.test.ts` | ❌ Wave 0 — needs creation |
| PERF-07 | `router.refresh()` is called after delete success in `DecksClient` | unit (jsdom, mock) | `npx vitest run src/app/decks/page.test.tsx` | ✅ (existing, needs update) |
| PERF-08 | `startTransition` is imported and wraps dispatch in `handleDeckUpdate` | unit (source inspection or smoke render) | `npx vitest run src/components/decks/deck-builder.test.tsx` | ❌ Wave 0 — needs creation |
| PERF-09 | loading.tsx skeleton renders correctly (structural) | unit (jsdom) | `npx vitest run src/app/decks/[id]/loading.test.tsx` | ✅ (existing — passes) |

### Sampling Rate

- **Per task commit:** `npx vitest run src/db/queries/decks.test.ts __tests__/api-deck-revalidate.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/db/queries/decks.test.ts` — covers PERF-07 (`'use cache'` + `cacheTag` presence in query functions)
- [ ] `__tests__/api-deck-revalidate.test.ts` — covers PERF-07 (`revalidateTag` called with correct tags and `'max'` profile in POST/PATCH/DELETE handlers)
- [ ] `src/components/decks/deck-builder.test.tsx` — covers PERF-08 (`startTransition` wraps dispatch calls in `handleDeckUpdate`)

**Note on existing `src/app/decks/page.test.tsx`:** This test mounts `DecksPage` as a client component with mocked fetch — it currently tests `router.push` behavior after create. After PERF-07 is implemented, it needs an additional assertion that `router.refresh()` is called after delete success. The test uses `mockRouter = { push: vi.fn() }` — a `refresh: vi.fn()` property must be added to the mock.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Auth check already exists in all route handlers via `auth.api.getSession` |
| V4 Access Control | yes | `userId` must be in every cache tag — never cache without it. Ownership check (`eq(decks.userId, userId)`) must remain in queries after adding `'use cache'` |
| V5 Input Validation | no | No new input surfaces introduced |
| V6 Cryptography | no | No new crypto operations |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cross-user cache serving | Information Disclosure | `userId` interpolated into every `cacheTag` string; verified by `and(eq(decks.userId, userId))` still present in query |
| Cache poisoning via `deckId` in tag | Tampering | `deckId` and `userId` are both integers from authenticated session; no user-supplied string injection into tag |
| `revalidateTag` called without auth check | Elevation of Privilege | `revalidateTag` is called inside handlers that have already passed the `auth.api.getSession` gate |

---

## Sources

### Primary (HIGH confidence)

- `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md` — `'use cache'` directive behavior, constraints, cache keys, runtime behavior
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cacheTag.md` — `cacheTag` usage, idempotency, tag limits
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidateTag.md` — two-argument signature, `'max'` profile, deprecation of single-argument form
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md` — `router.refresh()` semantics (clears Client Cache, does not invalidate server-side cache)
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cacheLife.md` — preset profiles including `default` profile (stale: 5min, revalidate: 15min, expire: never)
- `src/db/queries/catalog.ts` — reference implementation for `'use cache'` + `cacheTag` + `cacheLife` pattern already in production
- `src/app/api/cron/sync-cards/route.ts` — reference implementation for `revalidateTag('cards', 'max')` two-argument form already in production
- `next.config.ts` — confirms `cacheComponents: true` is already set
- `src/components/decks/deck-builder.tsx` — identifies exact dispatch call sites for `startTransition` wrapping
- `src/components/decks/decks-client.tsx` — confirms `useRouter` already imported; identifies `handleCreateDeck` and `handleDeleteDeck` as `router.refresh()` targets
- `src/app/api/decks/route.ts` and `src/app/api/decks/[id]/route.ts` — full handler code; confirms no `revalidateTag` currently present

### Secondary (MEDIUM confidence)

- React documentation on `startTransition` [ASSUMED] — `startTransition` is a stable React API (since React 18); behavior in Next.js 16 context is consistent with React 18 semantics

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all APIs verified in local Next.js 16.2.4 docs
- Architecture: HIGH — existing codebase read; no guesswork about call sites
- Pitfalls: HIGH — derived from official docs (deprecated API signatures) and code analysis (ownership check, placement of `setIsAutoFilterOverridden`)

**Research date:** 2026-06-02
**Valid until:** 2026-07-02 (Next.js 16 stable; low churn in cache APIs)

# Phase 27: /decks Route Performance - Context

**Gathered:** 2026-06-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 27 makes /decks and /decks/[id] load measurably faster for returning users, prevents card add/remove interactions from causing UI jank, and resolves FCP/LCP/INP regressions visible in Vercel Speed Insights.

Three concrete deliverables:

1. **PERF-07 — Cache tagging on deck queries:** `getDecks` and `getDeckWithCards` get `'use cache'` with per-user `cacheTag`; all three mutation routes (POST create, PATCH update, DELETE delete) call `revalidateTag` on the correct tags; client components call `router.refresh()` after receiving mutation success responses.

2. **PERF-08 — INP optimization:** `startTransition` wraps the card add/remove `dispatch` calls in `DeckBuilder` so React treats them as non-urgent updates and keeps the UI responsive during re-renders.

3. **PERF-09 — Speed Insights review:** You review the Vercel Speed Insights dashboard for /decks route FCP/LCP/INP data, provide specific findings to the executor, and the executor applies targeted fixes. If no data is available, the executor applies catalog-parity improvements (Suspense boundaries, loading skeleton, image lazy loading) as a baseline.

No new deck builder features, no database schema changes, no new API routes.

</domain>

<decisions>
## Implementation Decisions

### Cache Tagging (PERF-07)

- **D-01:** `'use cache'` directive goes inside `getDecks` and `getDeckWithCards` function bodies in `src/db/queries/decks.ts` — same pattern as `getAllCards()` / `getFilterOptions()` in `src/db/queries/catalog.ts`.
- **D-02:** Cache tags per STATE.md:
  - `getDecks(userId)` → `cacheTag('decks-user-{userId}')`
  - `getDeckWithCards(deckId, userId)` → `cacheTag('deck-{deckId}-user-{userId}')`
  - **Never** cache without `userId` in the key — cross-user data leak risk.
- **D-03:** No `cacheLife` — deck data lives in cache indefinitely until explicitly invalidated. No TTL safety net; `revalidateTag` is the sole expiry mechanism.
- **D-04:** `revalidateTag` scope per mutation:
  - `POST /api/decks` (create): `revalidateTag('decks-user-{userId}')`
  - `PATCH /api/decks/[id]` (update): `revalidateTag('deck-{deckId}-user-{userId}')` + `revalidateTag('decks-user-{userId}')`
  - `DELETE /api/decks/[id]` (delete): `revalidateTag('deck-{deckId}-user-{userId}')` + `revalidateTag('decks-user-{userId}')`
- **D-05:** Two-layer invalidation (per STATE.md): `revalidateTag()` in the API route handlers busts the Data Cache (server-side); `router.refresh()` in the client component after mutation success busts the Router Cache. Both must fire.

### INP Optimization (PERF-08)

- **D-06:** `startTransition` wraps the card add/remove `onClick` dispatch handlers for `UPDATE_CARD`, `SET_LEADER`, and `SET_BASE` in `deck-builder.tsx`. These are the high-frequency taps that cause jank (deck list re-renders on every tap).
- **D-07:** `useDeferredValue` is NOT applied. The deck list is capped at ~60 cards — `useDeferredValue` adds complexity without meaningful gain at that scale.
- **D-08:** `handleSave` (the async save operation) is not wrapped in `startTransition` — it's already an async operation and INP is not the concern there.

### Speed Insights Review (PERF-09)

- **D-09:** Execution includes a mandatory checkpoint: you review the Vercel Speed Insights dashboard for /decks FCP/LCP/INP data and provide specific regression findings. The executor then applies targeted fixes per your findings.
- **D-10:** Fallback (no data available): if Speed Insights shows insufficient /decks data (low traffic), the executor applies catalog-parity improvements — Suspense boundaries, `loading.tsx` skeleton, image lazy loading — and documents that no regression data was available.

### Claude's Discretion

- Exact placement of `cacheTag` / `revalidateTag` imports (they come from `'next/cache'` — same as catalog.ts)
- Whether `getDecks` needs a `cacheLife` argument alongside `cacheTag` or not (D-03 says no TTL, but Claude may add one if there's a strong technical reason)
- Specific Suspense boundary placement within `/decks/[id]/page.tsx` for the PERF-09 fallback path

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

**IMPORTANT: Per AGENTS.md, read `node_modules/next/dist/docs/` before writing any Next.js caching or Suspense code — APIs and conventions may differ from training data.**

### Deck query functions (primary modification targets)

- `src/db/queries/decks.ts` — `getDecks` and `getDeckWithCards`: add `'use cache'` + `cacheTag`. Read the full file before editing.
- `src/db/queries/catalog.ts` — **Reference implementation** for the `'use cache'` + `cacheTag` + `cacheLife` pattern. Read before writing deck caching code.

### API route mutation handlers (add revalidateTag)

- `src/app/api/decks/route.ts` — POST (create) and GET handlers. POST needs `revalidateTag('decks-user-{userId}')` after `createDeck`.
- `src/app/api/decks/[id]/route.ts` — PATCH (update) and DELETE handlers. PATCH needs both tags; DELETE needs both tags.

### Client components (add router.refresh())

- `src/components/decks/decks-client.tsx` — `handleCreateDeck` (POST → router.push) and `handleDeleteDeck` (DELETE). Both need `router.refresh()` after success.
- `src/components/decks/deck-builder.tsx` — `handleSave` (PATCH → router.push on completion). Needs `router.refresh()` after success. Also target for `startTransition` on dispatch calls.

### State / Architecture pre-decisions

- `.planning/STATE.md` §"Key Architectural Notes for v6" — Cache tag naming, two-layer invalidation pattern, cross-user data leak risk. Read before writing any cache code.
- `.planning/REQUIREMENTS.md` — PERF-07, PERF-08, PERF-09 requirement text and acceptance criteria.

### Prior phase context

- `.planning/phases/26-mobile-deck-builder-ux/26-CONTEXT.md` — Phase 26 architectural changes to deck-builder.tsx (two-row toolbar, Sheet for mobile sidebar, touch targets). Read before modifying deck-builder.tsx to avoid conflicts.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `'use cache'` + `cacheTag` + `cacheLife` pattern — already in `src/db/queries/catalog.ts` lines 5–11. Copy this pattern to `getDecks` and `getDeckWithCards`.
- `revalidateTag` — already imported and used in `src/app/api/cron/sync-cards/route.ts`. Same import path: `import { revalidateTag } from 'next/cache'`.
- `router.refresh()` — `useRouter` is already imported in `src/components/decks/decks-client.tsx` and `src/components/decks/deck-builder.tsx`.
- `startTransition` — imported from React. Not currently used in deck-builder.tsx; needs to be added to imports.

### Established Patterns

- **`'use cache'` inside function body** — catalog.ts puts the directive at the top of each exported async function body, not at the module level. Follow this pattern for deck queries.
- **Two-layer cache invalidation** — `revalidateTag()` in the route handler (server) + `router.refresh()` in the client component (after `await fetch(...)` resolves). This pattern is established in STATE.md but not yet implemented in deck routes.
- **`cacheTag` with userId in key** — `cacheTag('decks-user-{userId}')` — the userId must be interpolated into the tag string at call time. See how catalog.ts uses `cacheTag('cards')` (global) vs the deck pattern (per-user).

### Integration Points

- `getDecks` is called in `src/app/decks/page.tsx` (RSC) and `GET /api/decks` route handler. Caching inside the query function covers both call sites.
- `getDeckWithCards` is called in `src/app/decks/[id]/page.tsx` (RSC) and `GET /api/decks/[id]` route handler. Same coverage.
- Deck mutation API routes are the revalidation trigger point — `revalidateTag` goes there, not in the query functions.
- Client-side `router.refresh()` must fire AFTER the fetch promise resolves with a success status — not on every mutation attempt.

</code_context>

<specifics>
## Specific Ideas

- For `getDecks`, the `'use cache'` block with `cacheTag` should interpolate userId: `cacheTag(\`decks-user-${userId}\`)`
- For `getDeckWithCards`, tag both: `cacheTag(\`deck-${deckId}-user-${userId}\`)` 
- `startTransition` import: `import { useReducer, startTransition } from 'react'` (startTransition is a named export from react)
- PERF-09 execution checkpoint: after PERF-07 + PERF-08 are deployed, you review Speed Insights, provide regression findings, then the executor applies targeted fixes in a subsequent plan within this phase.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 27-decks-route-performance*
*Context gathered: 2026-06-02*

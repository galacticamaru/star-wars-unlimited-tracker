# Architecture Patterns — v6 Mobile, Performance & Polish

**Project:** Star Wars Unlimited Tracker
**Researched:** 2026-05-29
**Confidence:** HIGH (all findings verified against live source code and Next.js 16 in-tree docs)

---

## Scope

This document answers three integration questions for v6:

1. How to restructure the stats sidebar for mobile without regressing desktop.
2. How to apply `use cache` to `/decks` and `/decks/[id]` given per-user data isolation requirements.
3. Whether `@tanstack/react-virtual` is worth applying to the Add Cards tab.

---

## Question 1: Stats Sidebar — Mobile Restructure

### Current State (Verified)

`DeckBuilder` renders as a fixed-height flex row:

```
<div className="flex h-[calc(100svh-56px)] overflow-hidden">
  <div className="flex-1 flex flex-col overflow-hidden">   ← tabs + content
  <DeckSidebar ... />                                       ← always-visible, w-80
```

`DeckSidebar` is `w-80` with no responsive hiding. On viewports narrower than 320px (and practically on any mobile phone at portrait orientation) it either overflows off-screen or — worse — overlays the content, blocking card tap targets.

### Recommended Approach: Sheet Component (not CSS-only)

**Verdict:** Use the existing `Sheet` component (`src/components/ui/sheet.tsx`) already in the project. Do NOT attempt a CSS-only responsive approach.

**Why not CSS-only (`hidden md:flex`):**

A purely CSS solution (hide sidebar on mobile, show it on desktop) only works if mobile users have no way to see stats or save the deck. The sidebar contains the Save / Complete Deck actions. Those actions must be accessible on mobile, making "just hide it" a non-starter.

**Why the existing Sheet component:**

- `src/components/ui/sheet.tsx` is already implemented, wrapping `@base-ui/react/dialog`.
- It supports `side="right"` and `side="bottom"`, both usable for a stats drawer.
- It is the base-ui primitive (project constraint: no `@radix-ui` imports), already battle-tested in the project.
- The Sheet's Popup is a portal-mounted overlay — it does not affect the DOM flow of the tab content area, so mobile tap targets remain unblocked when the Sheet is closed.

### Integration Design

**Component boundary:** `DeckSidebar` stays as-is. A new `DeckSidebarSheet` wrapper component handles mobile presentation.

**Desktop (unchanged):** `DeckSidebar` renders inline as it does today — `w-80` in the flex row.

**Mobile (new):** `DeckSidebar` content is placed inside a `SheetContent` triggered by a sticky "Stats" button in the toolbar.

**Concrete layout change to `DeckBuilder`:**

```tsx
// Before (DeckBuilder return, simplified):
<div className="flex h-[calc(100svh-56px)] overflow-hidden">
  <div className="flex-1 flex flex-col overflow-hidden">
    {/* toolbar + content */}
  </div>
  <DeckSidebar ... />          {/* always rendered */}
</div>

// After:
<div className="flex h-[calc(100svh-56px)] overflow-hidden">
  <div className="flex-1 flex flex-col overflow-hidden">
    {/* toolbar: add a <Sheet> trigger button — "md:hidden" visibility */}
    {/* content: unchanged */}
  </div>
  {/* Desktop sidebar — unchanged */}
  <div className="hidden md:flex">
    <DeckSidebar ... />
  </div>
  {/* Mobile sheet — rendered in DOM on all widths, Sheet portal mounts on open */}
  <div className="md:hidden">
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm">Stats</Button>   {/* lives inside toolbar */}
      </SheetTrigger>
      <SheetContent side="right">
        <DeckSidebar ... />
      </SheetContent>
    </Sheet>
  </div>
</div>
```

The `SheetTrigger` button must sit inside the toolbar `div` (the row with the deck name input and tab switcher), not outside it. Add it with `md:hidden` class so it is invisible on desktop.

**Key invariant:** The Save / Complete Deck buttons remain inside `DeckSidebar`, which renders both in the desktop inline position and in the Sheet. Both are always accessible.

### Component Map

| Component | Action | Notes |
|-----------|--------|-------|
| `deck-builder.tsx` | Modify | Wrap desktop sidebar with `hidden md:flex`, add mobile Sheet |
| `deck-sidebar.tsx` | No change | Renders identically in both contexts |
| `src/components/ui/sheet.tsx` | Reuse as-is | Already supports `side="right"` |

### Desktop Regression Risk: None

The `hidden md:flex` wrapper on `DeckSidebar` is a no-op on desktop. The flex row geometry and `w-80` sidebar width are unchanged. The Sheet component uses a portal — it does not inject into the flex row on desktop.

---

## Question 2: use-cache for /decks and /decks/[id]

### Constraint: Per-User Data Cannot Use Shared Cache

`getDecks(userId)` and `getDeckWithCards(deckId, userId)` both pass `userId` as a WHERE clause argument. Caching these functions with a shared tag (like `'cards'`) would cause user A's deck list to potentially be served to user B on a cold Vercel serverless instance. This is a data isolation violation.

### What use cache Actually Does With Arguments (Verified from Docs)

From the Next.js 16 `use cache` documentation:

> A cache entry's key is generated using a serialized version of its inputs, which includes: Build ID, Function ID, **Serializable arguments**.

This means: if `getDecks` is marked `'use cache'` and called with `userId = 42`, the cache key includes `42`. A subsequent call with `userId = 99` gets a separate cache entry. **Per-user isolation is automatic when userId is passed as a function argument.**

### However: Serverless Makes Runtime Caching Ineffective

From the same docs:

> **Serverless**: Cache entries typically don't persist across requests (each request can be a different instance). Build-time caching works normally.

Vercel Hobby is serverless. An in-memory LRU cache populated on request A is discarded when the serverless function cold-starts for request B. This means:

- `'use cache'` on `getDecks(userId)` caches only within a single request's lifetime (request-level deduplication), not across requests.
- The actual performance gain on Vercel serverless comes from reducing **within-request** duplicate fetches, not from cross-request caching.

### Recommended Pattern for /decks

**`getDecks(userId)` and `getWantList(userId)` — apply `'use cache'` with per-user tags:**

```typescript
export async function getDecks(userId: number) {
  'use cache'
  cacheTag(`decks-user-${userId}`)
  cacheLife('seconds')   // stale: 30s min for client, revalidate: short
  return db.select().from(decks).where(eq(decks.userId, userId)).orderBy(desc(decks.updatedAt));
}
```

The `cacheTag(`decks-user-${userId}`)` pattern (user-scoped tag) means `revalidateTag(`decks-user-${userId}`)` in the deck PATCH handler invalidates only that user's cache. This is safe.

**The real TTFB win is different:** The `/decks/[id]` page currently calls `getAllCards()` and `getFilterOptions()` — both of which are already cached with `cacheTag('cards')` and `cacheLife('days')`. On a serverless cold start, the card data query is the expensive one (~2000+ rows). Since `getAllCards()` already has `'use cache'`, a warm instance serves the card catalog from cache. The deck-specific queries (`getDeckWithCards`) are cheap by comparison (single user's deck).

**Conclusion for /decks route TTFB:** The main opportunity is `getAllCards()` cache hit (already done in Phase 24). Additional `'use cache'` on `getDecks` is minimal gain on serverless but still correct practice for any future edge/self-hosted deployment.

### Recommended Pattern for /decks/[id]

The RSC page (`src/app/decks/[id]/page.tsx`) calls:

1. `getDeckWithCards(deckId, userId)` — user-scoped, cannot share between users
2. `getAllCards()` — already cached with `cacheTag('cards')`
3. `getFilterOptions()` — already cached with `cacheTag('cards')`

For (1), apply `'use cache'` with a per-deck-per-user tag:

```typescript
export async function getDeckWithCards(deckId: number, userId: number) {
  'use cache'
  cacheTag(`deck-${deckId}-user-${userId}`)
  cacheLife('seconds')
  // existing query...
}
```

Then in the PATCH handler (`/api/decks/[id]/route.ts`), after a successful save:

```typescript
import { revalidateTag } from 'next/cache'
revalidateTag(`deck-${deckId}-user-${userId}`)
```

This flushes the cache for that specific deck on save, preventing stale data on the next page load.

### What NOT to Do

Do not apply `'use cache'` at the page level (`src/app/decks/[id]/page.tsx`) or with `cacheLife('days')` — the page reads session-gated data. Caching the entire RSC output would cache the session check result and could serve another user's deck.

Do not use `'use cache: private'` for deck queries. The docs confirm it is experimental, browser-only (not stored on server), and runs on every server render — it provides no server-side TTFB improvement, only client-side stale serving after initial load.

### Per-User Tag Invalidation Map

| Mutation | Tag to Invalidate |
|----------|------------------|
| PATCH /api/decks/[id] | `deck-{deckId}-user-{userId}` |
| DELETE /api/decks/[id] | `decks-user-{userId}` |
| POST /api/decks (create) | `decks-user-{userId}` |

---

## Question 3: @tanstack/react-virtual on the Add Cards Tab

### Current State

The Add Cards tab renders `CatalogClient` in `mode="selector"`. `CatalogClient` → `CardGrid` already uses `useVirtualizer` from `@tanstack/react-virtual@^3.13.26`.

The virtualizer in `CardGrid` receives a `scrollContainerRef` pointing to the `<main>` element inside `CatalogClient`. That `<main>` is `overflow-y-auto`, giving the virtualizer a valid scroll container.

### Problem: CatalogClient Inside DeckBuilder Creates Nested Scroll Conflict

`DeckBuilder` wraps content in:

```tsx
<div className="flex-1 overflow-y-auto bg-slate-50">
  {view === 'catalog' ? (
    <CatalogClient ... />
  ) : ...}
</div>
```

`CatalogClient` renders its own `h-[calc(100svh-56px)] overflow-hidden` container. When nested inside DeckBuilder's scrollable `flex-1` div, the virtualizer's scroll container is `CatalogClient`'s inner `<main>`, which has a calculated height. This appears functional from the code — the inner main is `flex-1 overflow-y-auto` relative to CatalogClient's own fixed-height container.

However, there is a known tension: `CatalogClient`'s outer div declares `h-[calc(100svh-56px)]` which, when nested inside DeckBuilder (which already constrains height), may collapse to zero if not properly handled. This is worth testing empirically.

### Is Adding Virtualization to the Deck List Tab Worth It?

**Answer: No, not for this milestone.**

The Deck List tab (the `editor` view) shows at most 60 card rows (50 main + 10 sideboard). Each row is a simple `div` with text. React renders 60 items trivially — virtualization provides no measurable gain below ~500 items in a list layout. The catalog virtualizes because it renders thousands of image-heavy cards.

**The Add Cards tab is already virtualized** — it reuses `CatalogClient` which runs `useVirtualizer` on the full card catalog. No new virtualization work is needed.

**If virtualization were added to the Deck List tab**, the correct pattern would match the existing `CardGrid`:

```typescript
const rowVirtualizer = useVirtualizer({
  count: allRows.length,
  getScrollElement: () => scrollContainerRef.current,
  estimateSize: () => 64,  // ~64px per row
  overscan: 5,
});
```

But this is premature optimization for a 60-row list. Defer indefinitely.

### CatalogClient Scroll Container in Deck Builder Context — Verified Issue

Looking at the code more carefully: `CatalogClient` declares `h-[calc(100svh-56px)]` as its outermost container. When rendered as the `view === 'catalog'` child of DeckBuilder's `overflow-y-auto` div, this height is `100svh - 56px` regardless of how much vertical space DeckBuilder actually allocated. On mobile, DeckBuilder's toolbar takes 56px, so CatalogClient's outermost div is exactly the remaining viewport height — which is correct.

The scroll container for CardGrid (the `<main ref={scrollContainerRef}>` inside CatalogClient) is `flex-1 overflow-y-auto` within CatalogClient's `overflow-hidden` wrapper. This is the same structure as the standalone catalog page — virtualization works correctly in the deck builder context.

---

## Component Integration Map

### New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| (none required) | — | Sheet already exists; DeckBuilder changes are inline |

### Modified Components

| Component | Change | Risk |
|-----------|--------|------|
| `deck-builder.tsx` | Add `hidden md:flex` wrapper around inline DeckSidebar; add Sheet + trigger button in toolbar | Low — CSS change only on desktop path |
| `deck-sidebar.tsx` | No change | None |
| `src/db/queries/decks.ts` | Add `'use cache'` + `cacheTag` to `getDecks` and `getDeckWithCards` | Low — additive |
| `/api/decks/[id]/route.ts` | Add `revalidateTag` calls on PATCH and DELETE | Low — additive |
| `/api/decks/route.ts` (POST) | Add `revalidateTag` on deck creation | Low — additive |

---

## Build Order

The three v6 concerns are mostly independent but have a clear safe ordering:

**Step 1 — Mobile sidebar (MOBILE-01, MOBILE-02)**

Do this first. It is a pure UI change with no data layer dependencies. It is also the highest user-impact item. The change is isolated to `deck-builder.tsx`. Regression surface: desktop layout (covered by `hidden md:flex` CSS approach).

Test matrix required:
- Desktop: sidebar still visible inline, tabs function, Save/Complete Deck work
- Mobile: sidebar hidden, Stats button visible, Sheet opens with full sidebar content, Save/Complete Deck accessible in Sheet

**Step 2 — use-cache on deck queries (PERF-07)**

Do after mobile, because the mobile change may require a save-flow test that would reveal if `revalidateTag` is missing. Adding caching and invalidation in the same pass reduces the chance of stale-data bugs going unnoticed.

Targets: `getDeckWithCards`, `getDecks`, PATCH/DELETE/POST handlers.

**Step 3 — Tech debt sweep (DEBT-01 through DEBT-05)**

Independent of both above. Can be parallelized. The only ordering constraint: DEBT-02 (variant art in Add Cards) touches `DeckBuilder` and `CatalogClient` — do after mobile sidebar change is merged to avoid merge conflicts.

---

## Scalability Notes

The `cacheTag(`deck-{deckId}-user-{userId}`)` pattern generates one tag per deck. At 1000 users with 10 decks each, that is 10,000 tags. Tag counts up to 128 per cache entry and max length 256 chars are within limits. Tag namespace collision between users is impossible since both deckId (unique globally) and userId are included.

The per-user tag pattern (`decks-user-{userId}`) is similarly safe — one tag per user for the decks list.

---

## Sources

- Next.js 16 `use cache` directive: `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md` — HIGH confidence
- Next.js 16 `use cache: private` directive: `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache-private.md` — HIGH confidence
- `cacheTag` function docs: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cacheTag.md` — HIGH confidence
- `src/components/decks/deck-builder.tsx` — live source, verified
- `src/components/decks/deck-sidebar.tsx` — live source, verified
- `src/components/ui/sheet.tsx` — live source, verified (`@base-ui/react/dialog` backed)
- `src/components/catalog/card-grid.tsx` — live source, verified (useVirtualizer in use)
- `src/db/queries/catalog.ts` — live source, verified (`'use cache'` + `cacheTag('cards')` already applied)
- `src/db/queries/decks.ts` — live source, verified (no `'use cache'` present)
- `next.config.ts` — verified `cacheComponents: true` is enabled

# Phase 24: Catalog & Page Load Performance — Research

**Researched:** 2026-05-26
**Domain:** React virtualization, Next.js 16 caching, image priority, search debounce
**Confidence:** HIGH (all critical findings verified against installed Next.js docs and authoritative sources)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01 (Search debounce):** The search input switches to local React state with a 150ms debounce before syncing to nuqs URL state. The nuqs `search` setter is called only after 150ms of typing inactivity.

**D-02 (Dropdown filters — no debounce):** Filter dropdowns (set, rarity, variant, type, aspect, arena, trait, keyword, cost, owned-only toggle) continue to fire instantly. Only the text search input gets the debounce treatment.

**D-03 (Virtualization library):** `CardGrid` adds windowed rendering via `@tanstack/virtual`. Only the card tiles visible in the viewport are rendered to the DOM.

**D-04 (Column count):** Column count per breakpoint matches the existing CSS grid: 3 columns at base, 5 at `sm`, 7 at `md`, 9 at `lg`, 11 at `xl`. Detected via a breakpoint hook or matchMedia. Column count drives how `@tanstack/virtual` groups cards into rows.

**D-05 (Scroll container):** The virtual list scrolls inside the existing fixed-height scroll container (`100svh - 56px`). No layout changes. The existing container ref is passed to the virtualizer.

**D-06 (Remove force-dynamic):** Remove `export const dynamic = 'force-dynamic'` from `src/app/cards/page.tsx`.

**D-07 (Remove userId from getAllCards):** `getAllCards()` drops the `userId` parameter entirely. The LEFT JOIN with `userCollections` and `collectionCount` column are removed.

**D-08 (Cache tags):** `getAllCards`, `getFilterOptions`, and `getPrintingArtMap` are wrapped with Next.js cache tagged `'cards'`. The daily card sync route calls the appropriate revalidation after successfully inserting new card data.

**D-09 (Binder stays force-dynamic):** `src/app/binder/[username]/page.tsx` stays `force-dynamic`. No caching changes there.

**D-10 (Priority threshold):** `CardGrid` passes `priority={index < 22}` to `CardItem` for the first 22 cards. Cards at index >= 22 are lazy-loaded.

**D-11 (No blur placeholder):** Current skeleton behavior (`animate-pulse` + `opacity-0` until `onLoad`) stays unchanged.

### Claude's Discretion

- Exact implementation of the breakpoint hook for virtualization column count (useWindowSize hook, matchMedia listeners, or CSS container queries)
- Whether to introduce a shared `useDebounce` hook or inline the debounce with `useEffect` in `CatalogClient`
- Whether `unstable_cache` or the newer Next.js `use cache` directive is used — **this research resolves this: use `'use cache'` directive + `cacheTag` from Next.js 16**
- How to handle the scroll container ref plumbing for `@tanstack/virtual` (whether `CardGrid` receives the ref as a prop or reads it from context)

### Deferred Ideas (OUT OF SCOPE)

- Blur placeholder for card images
- Public binder page caching (ISR with 60s revalidate)
- Database query optimization (indexes on card_definitions / card_printings)
- PERF-04 / PERF-05 (Quick Add progress feedback, new deck speed)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PERF-01 | Catalog filter interactions reflect in ≤200ms without spinner or full page reload | Debounce (D-01) + virtualization (D-03/D-04/D-05) eliminate mid-keystroke re-renders and DOM bottleneck |
| PERF-02 | Catalog page above-fold content appears measurably faster on first load (LCP reduced) | Next.js 16 `'use cache'` directive + `cacheTag('cards')` on the three DB query functions; remove `force-dynamic` |
| PERF-03 | Card images below fold load lazily; first visible rows load with priority; no layout shift | `priority={index < 22}` on CardItem's `<Image>`; existing `aspect-[2/3]`/`aspect-[3/2]` containers already prevent CLS |
</phase_requirements>

---

## Summary

Phase 24 delivers three self-contained performance improvements. Each maps cleanly to a code area with no overlap: debounce lives in `CatalogClient`, virtualization lives in `CardGrid`, caching lives in `src/db/queries/catalog.ts` and `src/app/cards/page.tsx`, and image priority lives in `CardItem`.

The single biggest discovery from this research is that **Next.js 16 has replaced `unstable_cache` with the `'use cache'` directive and `cacheTag`**. The CONTEXT.md's D-08 decision to use `unstable_cache` must be updated to use the Next.js 16 Cache Components model. This requires enabling `cacheComponents: true` in `next.config.ts` and adding `'use cache'` + `cacheTag('cards')` inside the three query functions. The `revalidateTag` call signature has also changed — the new recommended form is `revalidateTag('cards', 'max')` (two-argument, stale-while-revalidate semantics).

The deck page (`src/app/decks/[id]/page.tsx`) is a **second caller of `getAllCards()`** that passes `userId` explicitly (`getAllCards(Number(session.user.id))`). When `userId` is removed from the function signature, the deck page call site must also be updated. The deck page relies on `collectionCount` data — but reading the code reveals that `collectionCount` from `getAllCards` was never actually used by `DeckBuilder`; collection data comes from the client-side `/api/collection` fetch pattern, consistent with the catalog page. The deck page call site simply needs the `userId` argument removed.

The `/api/cards/all` route also calls `getAllCards()` without a `userId` argument (already correct signature-wise), but this route has `export const dynamic = 'force-dynamic'` — it should be verified that removing `userId` from the function signature does not break this route's response (it won't, since it never passed `userId`).

**Primary recommendation:** Use Next.js 16 `'use cache'` directive with `cacheTag('cards')` inside the three query functions; enable `cacheComponents: true` in next.config.ts; use `@tanstack/react-virtual` with a single `useVirtualizer` counting rows (items / columns); apply a `useEffect`-based debounce inline in `CatalogClient`; and add `priority={index < 22}` prop threading through CardGrid → CardItem.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Search debounce (PERF-01) | Browser / Client | — | nuqs state, `useState`, `useEffect` — all client-side |
| Card grid virtualization (PERF-01) | Browser / Client | — | DOM rendering optimization in `CardGrid` (client component) |
| Breakpoint column detection | Browser / Client | — | `matchMedia` / window resize listeners are browser APIs |
| RSC data caching (PERF-02) | API / Backend (RSC) | CDN / Static | `'use cache'` caches DB query results server-side; static shell served via CDN |
| Cache invalidation on sync | API / Backend (Route Handler) | — | `revalidateTag` called from the cron route handler after card upsert |
| Image priority + lazy loading (PERF-03) | Browser / Client | CDN / Static | `priority` prop is consumed by Next.js `<Image>`; fetch prioritization is browser-level |
| CLS prevention | Browser / Client | — | `aspect-[2/3]`/`aspect-[3/2]` containers already exist; no new work needed |

---

## Standard Stack

### Core (new dependency)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tanstack/react-virtual` | 3.13.24 (latest as of 2026-05-26) | Windowed row virtualization for `CardGrid` | 15M+ weekly downloads; official TanStack library; `useVirtualizer` hook provides headless virtualization with full layout control |

[CITED: https://tanstack.com/virtual/latest/docs/installation — `@tanstack/react-virtual` is the React-specific package; `@tanstack/virtual-core` is the framework-agnostic lower-level package, not needed directly]

### Built-in (no new install)

| API | Source | Purpose |
|-----|--------|---------|
| `'use cache'` directive | Next.js 16 (built-in, requires `cacheComponents: true`) | Cache DB query functions at the RSC level |
| `cacheTag` | `next/cache` (built-in) | Tag cached functions for on-demand invalidation |
| `revalidateTag` | `next/cache` (built-in) | Invalidate `'cards'` cache from the cron route handler |
| `cacheLife` | `next/cache` (built-in) | Optional — set cache lifetime profile (e.g., `'days'`) |
| `<Image priority>` | `next/image` (built-in) | Preload above-fold card images |
| `useEffect` + `useState` | React (built-in) | Inline debounce implementation |
| `matchMedia` | Browser (built-in) | Detect responsive breakpoints for column count |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@tanstack/react-virtual` (row virtualizer) | `react-window` | react-window is older, less maintained, requires fixed item heights and can't easily handle the responsive multi-column grid pattern |
| `@tanstack/react-virtual` (row virtualizer) | `react-virtuoso` | react-virtuoso has a higher abstraction level; less control over layout for a custom CSS grid |
| Inline `useEffect` debounce | `lodash.debounce` | No lodash in project; adding a dependency for a 5-line pattern is unnecessary |
| `'use cache'` + `cacheTag` | `unstable_cache` | `unstable_cache` is deprecated in Next.js 16 per official docs; `'use cache'` is the replacement |

**Installation (new dependency only):**
```bash
npm install @tanstack/react-virtual
```

---

## Package Legitimacy Audit

> slopcheck was installed but the npm registry is unreachable from this environment (SSL certificate error). Registry verification performed via web sources instead.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `@tanstack/react-virtual` | npm | ~4+ years | ~15M/week [CITED: npmjs.com] | github.com/TanStack/virtual (6.9k stars) [CITED: GitHub] | Registry unreachable — verified via official TanStack docs and GitHub | Approved — well-established TanStack library |

**Packages removed due to slopcheck [SLOP] verdict:** none

**Packages flagged as suspicious [SUS]:** none

**Note:** npm registry SSL certificate error prevented programmatic verification via `npm view` or slopcheck. Package legitimacy verified via: (1) official TanStack documentation at tanstack.com confirming `@tanstack/react-virtual` as the React package, (2) GitHub repository TanStack/virtual showing active maintenance and 6.9k stars, (3) npmjs.com showing 15M+ weekly downloads and latest version 3.13.24.

---

## Architecture Patterns

### System Architecture Diagram

```
User types in search input
        |
        v
[CatalogClient] -- local state (searchInput)
        |
        | useEffect debounce 150ms
        v
[nuqs search param] --> useMemo(filterCards) --> filtered[]
                                                      |
                                                      v
                                              [CardGrid] -- useVirtualizer
                                                      |     (rows = ceil(filtered.length / columns))
                                                      |     getScrollElement = main container ref
                                                      |
                                                      v
                                        Only visible rows rendered to DOM
                                        Each row maps N cards to CardItem
                                        index < 22 → priority=true → <Image priority>
                                        index >= 22 → lazy loading (default)

CACHING LAYER (RSC, server-side):
DB queries (getAllCards, getFilterOptions, getPrintingArtMap)
        |
        | 'use cache' + cacheTag('cards') + cacheLife('days')
        v
Next.js cache (persisted across requests)
        |
        | revalidateTag('cards', 'max') called from cron route
        v
Stale-while-revalidate: next visitor gets fresh data after daily sync
```

### Recommended Project Structure (changes only)

```
src/
├── app/
│   ├── cards/
│   │   └── page.tsx              # Remove force-dynamic; remove auth/session (no userId needed)
│   └── api/
│       └── cron/sync-cards/
│           └── route.ts          # Add revalidateTag('cards', 'max') after syncAllCards()
├── components/catalog/
│   ├── catalog-client.tsx        # Add local searchInput state + useEffect debounce
│   ├── card-grid.tsx             # Add useVirtualizer, breakpoint hook, priority prop
│   └── card-item.tsx             # Add priority prop forwarded to <Image>
├── db/queries/
│   └── catalog.ts                # Remove userId from getAllCards; add 'use cache' + cacheTag
└── next.config.ts                # Add cacheComponents: true
```

### Pattern 1: Next.js 16 `'use cache'` with `cacheTag`

**What:** The `'use cache'` directive (placed inside an async function body) caches the function's return value across requests. `cacheTag` assigns a string tag enabling on-demand invalidation via `revalidateTag`.

**When to use:** Any server-side async function whose result is user-agnostic and doesn't change except on explicit data mutation.

**Requires:** `cacheComponents: true` in `next.config.ts`.

**Example:**
```typescript
// Source: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cacheTag.md
import { cacheTag, cacheLife } from 'next/cache'

export async function getAllCards() {
  'use cache'
  cacheTag('cards')
  cacheLife('days')
  // ... db query
}
```

**Invalidation from Route Handler:**
```typescript
// Source: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidateTag.md
import { revalidateTag } from 'next/cache'

// In the cron route handler, after successful card sync:
revalidateTag('cards', 'max')
// 'max' = stale-while-revalidate: stale content served immediately,
// fresh content fetched in background on next visit.
```

**Important:** `revalidateTag(tag)` single-argument form is **deprecated** in Next.js 16. Use `revalidateTag('cards', 'max')` (two-argument form). [CITED: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidateTag.md]

### Pattern 2: Row Virtualization with `useVirtualizer`

**What:** `useVirtualizer` from `@tanstack/react-virtual` renders only the DOM nodes visible in the viewport. For a multi-column grid, cards are grouped into rows (each row contains N cards where N = column count). The virtualizer counts rows, not individual cards.

**When to use:** When the total item count exceeds ~200 and each item involves meaningful DOM (images, event handlers).

**Key wiring:**
```typescript
// Source: tanstack.com/virtual/latest/docs
import { useVirtualizer } from '@tanstack/react-virtual'

// In CardGrid (needs ref to the scroll container):
const rowCount = Math.ceil(cards.length / columns)

const rowVirtualizer = useVirtualizer({
  count: rowCount,
  getScrollElement: () => scrollContainerRef.current,
  estimateSize: () => rowHeightPx,  // estimated height of one row in pixels
  overscan: 3,
})

// Render:
<div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
  {rowVirtualizer.getVirtualItems().map(virtualRow => {
    const startIndex = virtualRow.index * columns
    const rowCards = cards.slice(startIndex, startIndex + columns)
    return (
      <div
        key={virtualRow.key}
        style={{
          position: 'absolute',
          top: 0,
          transform: `translateY(${virtualRow.start}px)`,
          width: '100%',
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '0.5rem',
        }}
      >
        {rowCards.map((card, colIndex) => (
          <CardItem
            key={card.id}
            {...card}
            priority={startIndex + colIndex < 22}
          />
        ))}
      </div>
    )
  })}
</div>
```

**Scroll container ref plumbing:** The scroll container is the `<main>` element in `CatalogClient` that has `overflow-y-auto`. `CardGrid` needs a ref to it. Options:
1. Pass the ref as a prop from `CatalogClient` to `CardGrid` (cleanest — no context)
2. Use `useRef` inside `CardGrid` and attach it to a wrapper div, then make that the scroll container (requires moving `overflow-y-auto` into `CardGrid`)

Option 1 (ref as prop) is recommended — avoids restructuring the existing layout.

### Pattern 3: Inline Debounce with `useEffect`

**What:** A local `useState` holds the raw input value; a `useEffect` with a `setTimeout` fires the nuqs setter after 150ms of inactivity.

**Example:**
```typescript
// In CatalogClient:
const [searchInput, setSearchInput] = useState(search) // mirrors nuqs 'q' initial value
const [search, setSearch] = useQueryState('q', ...)   // existing nuqs state

useEffect(() => {
  const timer = setTimeout(() => {
    setSearch(searchInput)
  }, 150)
  return () => clearTimeout(timer)
}, [searchInput])
// Pass searchInput to SidebarFilters onSearchChange, setSearchInput as handler
// Keep 'search' (nuqs value) in the filterCards useMemo
```

**Note on clear button:** The "Clear All Filters" handler in `handleClearAll` also calls `setSearch('')`. When debounce is added, it must also reset `setSearchInput('')` to keep local state and nuqs state in sync.

### Anti-Patterns to Avoid

- **Using `unstable_cache` in Next.js 16:** It's deprecated. The docs explicitly state it has been replaced by `'use cache'`. Using it now means migration debt immediately.
- **Single-argument `revalidateTag`:** `revalidateTag('cards')` without a second argument is deprecated. Always use `revalidateTag('cards', 'max')`.
- **Calling `cacheTag` outside a `'use cache'` scope:** `cacheTag` only works inside a function that has `'use cache'` as its first statement. It must be called before any awaited operations.
- **Accessing `headers()` or `cookies()` inside a `'use cache'` function:** Will throw immediately. The catalog page must read the session outside the cache boundary — but since `getAllCards` no longer needs `userId`, the session is no longer needed in `cards/page.tsx` at all.
- **Putting the virtualizer's total-size wrapper inside a CSS grid container:** The wrapper `div` with `height: getTotalSize()px` and `position: relative` must NOT be the CSS grid. Individual rows are positioned absolutely inside it; each row renders its own CSS grid for the cards in that row.
- **Forgetting to remove `collectionCount` from the SELECT in `getAllCards`:** After removing the LEFT JOIN to `userCollections`, the `sql<number>` `collectionCount` column select must also be removed or it will reference a non-existent join alias.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Windowed rendering / DOM virtualization | Custom scroll position math + visibility detection | `@tanstack/react-virtual` `useVirtualizer` | Overscan, resize handling, measurement caching, scroll position restoration — all edge cases in custom implementations |
| Cache tag invalidation | `revalidatePath` on the catalog page URL | `revalidateTag('cards', 'max')` | Tag-based invalidation applies across all paths that use the tagged data; path-based would miss deck builder page |
| Per-request memoization | Custom Map-based request cache | React's built-in deduplication + `'use cache'` | Next.js 16's cache model handles this correctly with proper semantics |

**Key insight:** Virtualization has a long tail of edge cases (keyboard navigation, scroll restoration, dynamic height measurement, resize observation). The `useVirtualizer` API handles all of these — a custom solution will work for the happy path and break for edge cases.

---

## Critical Discovery: Next.js 16 Caching Model

[VERIFIED: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/unstable_cache.md]

> "Note: This API has been replaced by `use cache` in Next.js 16. We recommend opting into Cache Components and replacing `unstable_cache` with the `use cache` directive."

The CONTEXT.md decision D-08 references `unstable_cache`. The installed version is **Next.js 16.2.4**. The `'use cache'` directive is the correct approach.

### What changes vs. CONTEXT.md D-08:

| CONTEXT.md D-08 assumed | Actual Next.js 16 API |
|------------------------|----------------------|
| `unstable_cache(fn, keyParts, { tags: ['cards'] })` | `'use cache'` directive inside function body + `cacheTag('cards')` |
| Single-argument `revalidateTag('cards')` | `revalidateTag('cards', 'max')` (two-argument form required) |
| No config change needed | Must add `cacheComponents: true` to `next.config.ts` |

### Catalog page restructuring (caching implication):

The current `cards/page.tsx` reads `session` via `auth.api.getSession({ headers: await headers() })` and passes `userId` to `getAllCards`. After D-06 + D-07:

- `getAllCards` takes no parameters → no need to pass `userId`
- `getFilterOptions` and `getPrintingArtMap` already take no parameters
- The session read (`auth.api.getSession`, `headers()`) is a runtime API — it **cannot** be inside a `'use cache'` scope
- Since `userId` is no longer needed by `getAllCards`, the session read in `cards/page.tsx` can be **removed entirely**
- The three DB calls become cacheable directly via `'use cache'` inside `catalog.ts`

**Result:** `cards/page.tsx` no longer needs to import `auth`, `headers`, or read the session at all. It becomes a pure server component that calls three cached functions and renders `CatalogClient`.

---

## Breaking Callers of `getAllCards`

[VERIFIED: grep search of codebase]

`getAllCards` is called from **3 places**:

| File | Current call | After change |
|------|-------------|--------------|
| `src/app/cards/page.tsx` | `getAllCards(session?.user.id ? Number(session.user.id) : undefined)` | `getAllCards()` — remove session read |
| `src/app/decks/[id]/page.tsx` | `getAllCards(Number(session.user.id))` | `getAllCards()` — remove userId arg; session still needed for deck auth |
| `src/app/api/cards/all/route.ts` | `getAllCards()` — already no userId | No change needed |

The deck page still needs the session for `getDeckWithCards(deckId, Number(session.user.id))` and the `redirect('/login')` guard, so the session read stays. Only the `getAllCards` call changes.

**Also note:** The deck page does not use `collectionCount` from `getAllCards` — it relies on client-side collection data like the catalog page. Removing `collectionCount` from the return type is safe.

---

## Common Pitfalls

### Pitfall 1: `'use cache'` Scope Reads Runtime APIs

**What goes wrong:** Calling `headers()`, `cookies()`, or `auth.api.getSession()` inside a function marked `'use cache'` throws immediately.

**Why it happens:** `'use cache'` executes in a sandboxed context during prerendering; request-time APIs are not available.

**How to avoid:** Extract all runtime data (session, cookies) outside the cached function and pass values as arguments. In this phase, `getAllCards` no longer needs any runtime data at all — it's pure DB → data.

**Warning signs:** Build error: `Uncached data was accessed outside of <Suspense>` or runtime throw mentioning request-scope APIs inside use cache.

### Pitfall 2: Virtual Row Height Estimate vs. Actual Height

**What goes wrong:** `estimateSize` returns a fixed value (e.g., 200px per row). If the actual rendered height differs (e.g., at different breakpoints), the scroll position calculations drift — items appear at wrong positions or scroll jumps.

**Why it happens:** `useVirtualizer` measures items after first render and updates, but the initial estimate drives scroll position on load.

**How to avoid:** Provide a reasonable `estimateSize` close to the actual row height at the current breakpoint. For the card grid with `aspect-[2/3]` cards, row height can be calculated as `(containerWidth / columns) * (3/2)`. Use `overscan: 3` to buffer rendering.

**Warning signs:** Cards jumping positions during scroll; blank rows visible momentarily on fast scroll.

### Pitfall 3: `collectionCount` Left in SELECT After JOIN Removal

**What goes wrong:** Removing the LEFT JOIN to `userCollections` but leaving `collectionCount: sql<number>...` in the SELECT causes a Drizzle/PostgreSQL error at runtime because the join alias no longer exists.

**Why it happens:** Copy-paste omission during the `getAllCards` refactor.

**How to avoid:** Remove both the `collectionCount` select column and the `.leftJoin(userCollections, ...)` clause together as a single atomic change. The `collectionCount` field is not used by `CatalogClient` (collection data comes from `/api/collection`).

**Warning signs:** Runtime database error on catalog page load mentioning `userCollections` or `collectionCount`.

### Pitfall 4: `handleClearAll` Doesn't Reset Local Search State

**What goes wrong:** After adding local `searchInput` state for the debounce, `handleClearAll` only calls `setSearch('')` (nuqs). The `searchInput` local state remains non-empty, so the input box shows the old text even though nuqs `search` is cleared.

**Why it happens:** `handleClearAll` was written before the local state existed; it only touches nuqs state.

**How to avoid:** Update `handleClearAll` to also call `setSearchInput('')`.

**Warning signs:** After clicking "Clear All Filters", the search input shows previous text but no cards are filtered (nuqs is cleared but local state controls the input display).

### Pitfall 5: Virtualization Removes Standard CSS Grid from `CardGrid`

**What goes wrong:** The existing `CardGrid` renders a flat CSS grid. After virtualization, each virtual row becomes its own CSS grid of N columns. The outer wrapper can no longer be a flat `grid-cols-3 sm:grid-cols-5 ...` container — it must be `position: relative` with `height: getTotalSize()px`. Using both simultaneously breaks the layout.

**Why it happens:** The virtualization pattern requires absolute positioning of rows inside a sized container.

**How to avoid:** Remove `grid-cols-*` from the outer wrapper. Apply the responsive `grid-cols-*` to each row div that renders the cards within a virtual row. The column count must be the same value used by `useVirtualizer`'s `columns` computation.

**Warning signs:** Cards overlap each other; virtual rows stack on top of one another; layout appears broken.

### Pitfall 6: `cacheComponents` Side Effect on Route Handlers

**What goes wrong:** Enabling `cacheComponents: true` in `next.config.ts` causes GET Route Handlers to follow the same prerendering model as pages. A Route Handler that reads runtime data without `<Suspense>` or `'use cache'` may start throwing build-time errors.

**Why it happens:** Per Next.js 16 docs: "GET Route Handlers follow the same prerendering model as pages" when `cacheComponents` is enabled.

**How to avoid:** After enabling `cacheComponents`, verify the daily sync cron route (`/api/cron/sync-cards/route.ts`) and `/api/cards/all/route.ts` still build correctly. Both have `export const dynamic = 'force-dynamic'` which should opt them out of prerendering, but this should be verified.

**Warning signs:** Build errors in route handlers mentioning "Uncached data was accessed outside of Suspense".

---

## Code Examples

### `'use cache'` + `cacheTag` in a DB query function

```typescript
// Source: node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md
// Source: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cacheTag.md
import { cacheTag, cacheLife } from 'next/cache'

export async function getAllCards() {
  'use cache'
  cacheTag('cards')
  cacheLife('days')   // optional: revalidates after 1 day if no revalidateTag fires
  
  return db
    .select({ /* all fields EXCEPT collectionCount */ })
    .from(cardDefinitions)
    .innerJoin(cardPrintings, eq(cardDefinitions.id, cardPrintings.cardDefinitionId))
    .where(and(notIlike(cardDefinitions.type, '%token%')))
    .orderBy(asc(cardPrintings.setCode), asc(cardPrintings.collectorNumber));
}
```

### `revalidateTag` in the cron route handler

```typescript
// Source: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidateTag.md
import { revalidateTag } from 'next/cache'

export async function GET(request: NextRequest) {
  // ... auth check ...
  try {
    const cardResult = await syncAllCards();
    const priceResult = await syncPrices();
    
    // Invalidate cards cache after successful sync
    revalidateTag('cards', 'max')  // stale-while-revalidate: next visitor gets fresh data
    
    return Response.json({ success: true, ... })
  } catch (error) {
    // revalidateTag NOT called on failure — cache stays valid
  }
}
```

### `next.config.ts` change

```typescript
// Source: node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/cacheComponents.md
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,  // enables 'use cache' directive + Cache Components model
  images: {
    // ... existing image config stays unchanged ...
  },
};

export default nextConfig;
```

### Inline debounce in `CatalogClient`

```typescript
// Source: [ASSUMED] — standard React pattern, no library needed
const [searchInput, setSearchInput] = useState(search)

useEffect(() => {
  const timer = setTimeout(() => {
    void setSearch(searchInput || null)  // nuqs null = remove param from URL
  }, 150)
  return () => clearTimeout(timer)
}, [searchInput])
// Pass: search={searchInput} onSearchChange={setSearchInput} to SidebarFilters/TopBar
// Keep: filterCards useMemo uses 'search' (nuqs value, not searchInput)
```

### Priority prop in `CardGrid` → `CardItem`

```typescript
// In CardGrid:
<CardItem
  key={...}
  {...cardProps}
  priority={startIndex + colIndex < 22}
/>

// In CardItem (add priority to interface and forward to Image):
interface CardItemProps {
  // ...existing props...
  priority?: boolean
}
// Inside render:
<Image
  src={displayUrl}
  alt={name}
  fill
  sizes="..."
  priority={priority}   // existing lazy-loading default when false/undefined
  className={...}
  onLoad={() => setLoaded(true)}
/>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `unstable_cache` with `{ tags: [...] }` option | `'use cache'` directive + `cacheTag()` | Next.js 16.0.0 | Different import paths, different syntax, requires `cacheComponents: true` config |
| `revalidateTag(tag)` (one argument) | `revalidateTag(tag, 'max')` (two arguments) | Next.js 16 | Single-argument form deprecated; TypeScript errors may be suppressed but behavior may be removed in future |
| `export const dynamic = 'force-dynamic'` to disable caching | Remove the export; use `'use cache'` only on functions that should be cached | Next.js 16 Cache Components | Page becomes cacheable by default when `cacheComponents: true` is set |

**Deprecated/outdated in this codebase:**
- `unstable_cache`: Replaced by `'use cache'` directive. Do not use in new code.
- `export const dynamic = 'force-dynamic'` on the catalog page: Will be removed (D-06).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Next.js 16 | `'use cache'` directive, `cacheTag`, `cacheComponents` | Yes | 16.2.4 | — |
| `@tanstack/react-virtual` | `CardGrid` virtualization | No (not installed) | 3.13.24 (latest) | — |
| Node.js | All | Yes (implied by dev environment running) | — | — |
| npm registry | `npm install @tanstack/react-virtual` | Unreachable from this machine (SSL cert issue) | — | Install from alternate network or with `--use-system-ca` flag |

**Missing dependencies with no fallback:**
- `@tanstack/react-virtual` — must be installed before CardGrid changes. Note: `npm install` may require the `--use-system-ca` flag on this machine due to the SSL certificate verification error.

---

## Validation Architecture

> `nyquist_validation: true` in config.json — section included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 |
| Config file | `vitest.config.mts` |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test -- --run` |

**Note:** Test environment in `vitest.config.mts` defaults to `node`. Browser-mode tests use `// @vitest-environment jsdom` per-file. The `CardGrid` virtualization test will need jsdom.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERF-01 | `filterCards` useMemo depends on debounced `search` not raw input | unit | `npm test -- --run src/lib/filter-cards.test.ts` | Yes |
| PERF-01 | CardGrid renders virtualized rows (only visible rows in DOM) | unit (jsdom) | `npm test -- --run src/components/catalog/card-grid.test.tsx` | No — Wave 0 |
| PERF-01 | Search debounce: nuqs setter not called on every keystroke | unit (jsdom) | `npm test -- --run src/components/catalog/catalog-client.browser.test.tsx` | Yes (stub only) |
| PERF-02 | `getAllCards()` no longer has `userId` param; `collectionCount` removed from return | unit | `npm test -- --run src/db/queries/catalog.test.ts` | Yes (all todo) |
| PERF-02 | Deck page call site compiles with no-argument `getAllCards()` | TypeScript build | `npx tsc --noEmit` | — |
| PERF-03 | First 22 cards have `priority=true` in CardGrid render | unit (jsdom) | `npm test -- --run src/components/catalog/card-grid.test.tsx` | No — Wave 0 |
| PERF-03 | Card images above index 22 have `priority=false` | unit (jsdom) | `npm test -- --run src/components/catalog/card-grid.test.tsx` | No — Wave 0 |

### Wave 0 Gaps

- [ ] `src/components/catalog/card-grid.test.tsx` — covers PERF-01 (virtualized render) and PERF-03 (priority threshold)
- [ ] Update `src/db/queries/catalog.test.ts` stubs to reflect `getAllCards()` signature change (no `userId`, no `collectionCount`)

*(Existing test files: `filter-cards.test.ts`, `catalog.test.ts` (todo stubs), `catalog-client.browser.test.tsx` (todo stubs), `card-item.test.tsx` — all exist and can be extended)*

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Row height estimate for `estimateSize` (e.g., based on `aspect-[2/3]` and container width) can be approximated as a fixed value for the initial virtualizer config | Architecture Patterns | Virtual scroll position drifts; requires tuning or dynamic measurement |
| A2 | `collectionCount` from `getAllCards` return value is not used by any consumer (deck page or catalog page) — both use client-side `/api/collection` | Don't Hand-Roll | If any component reads `collectionCount` from the cards array, removing it would break that component |
| A3 | Removing `export const dynamic = 'force-dynamic'` from `cards/page.tsx` is sufficient to make it cacheable under `cacheComponents: true` (no other blocking runtime APIs remain once session read is removed) | Standard Stack | If any other runtime API is accessed in `cards/page.tsx` or its server-side callees without `'use cache'`, the build may error |
| A4 | `export const dynamic = 'force-dynamic'` in route handlers (`/api/cron/sync-cards/route.ts`, `/api/cards/all/route.ts`) is sufficient to prevent them from being affected by the `cacheComponents` prerendering model change | Common Pitfalls | Route handler build may break; may need explicit `connection()` call or other opt-out |

---

## Open Questions

1. **Row height estimate for `estimateSize`**
   - What we know: Cards use `aspect-[2/3]` (portrait) or `aspect-[3/2]` (leaders/bases, landscape). The grid has `gap-2 px-4 py-4`. Container width varies by breakpoint.
   - What's unclear: The actual pixel height of a card row depends on the viewport width and column count at the time of render. A single static estimate may need to be per-breakpoint.
   - Recommendation: Use a reasonable initial estimate (e.g., 160px at base breakpoint). The virtualizer will measure actual heights after first render and self-correct. If scroll jitter is noticeable, switch to dynamic measurement using the `measureElement` option.

2. **Scroll container ref: prop vs. context**
   - What we know: The scroll container is `<main className="flex-1 ... overflow-y-auto">` inside `CatalogClient`. `CardGrid` is rendered inside it.
   - What's unclear: Whether to pass the ref as a prop from `CatalogClient` → `CardGrid`, or to restructure so `CardGrid` owns the scroll container.
   - Recommendation: Pass as prop. Keeps the layout structure unchanged (D-05). `CatalogClient` creates the ref, attaches it to `<main>`, and passes it to `CardGrid`.

3. **`cacheComponents` effect on existing route handlers**
   - What we know: Next.js 16 docs say GET Route Handlers follow the prerendering model when `cacheComponents: true`. Both route handlers have `force-dynamic`.
   - What's unclear: Whether `force-dynamic` fully opts handlers out of prerendering under the new model.
   - Recommendation: After enabling `cacheComponents`, run `npm run build` immediately and check for route handler errors before proceeding to other tasks.

---

## Security Domain

> Applicable categories for this phase:

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth changes |
| V3 Session Management | No | Session handling unchanged; catalog page removes session read entirely |
| V4 Access Control | No | No access control changes |
| V5 Input Validation | Minimal | Debounce is client-side UX; search filtering is already client-side via `filterCards` |
| V6 Cryptography | No | No crypto changes |

**Cache poisoning:** The `'use cache'` data cache is server-side and not user-influenced (no user input becomes a cache key in `getAllCards`/`getFilterOptions`/`getPrintingArtMap`). No cache poisoning surface.

**Cache tag security:** `revalidateTag` is called from the cron route handler which is already protected by `CRON_SECRET`. No new authentication requirements.

---

## Sources

### Primary (HIGH confidence)
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/unstable_cache.md` — confirmed deprecation of `unstable_cache` in Next.js 16; replacement is `'use cache'`
- `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md` — full `'use cache'` directive API and semantics
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cacheTag.md` — `cacheTag` usage, requires `cacheComponents: true`
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidateTag.md` — `revalidateTag(tag, profile)` two-argument form; single-argument deprecated
- `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/cacheComponents.md` — `cacheComponents: true` config flag
- `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md` — complete caching guide for Next.js 16
- `src/app/cards/page.tsx` — existing catalog page code
- `src/db/queries/catalog.ts` — existing `getAllCards`, `getFilterOptions`, `getPrintingArtMap`
- `src/components/catalog/catalog-client.tsx` — existing nuqs state, filter pipeline, scroll container
- `src/components/catalog/card-grid.tsx` — existing CardGrid structure
- `src/components/catalog/card-item.tsx` — existing CardItem props and Image usage
- `src/app/decks/[id]/page.tsx` — confirmed second caller of `getAllCards` with `userId`
- `src/app/api/cards/all/route.ts` — confirmed third caller of `getAllCards` (no `userId` argument)
- `src/app/api/cron/sync-cards/route.ts` — confirmed sync route structure; where `revalidateTag` must be added

### Secondary (MEDIUM confidence)
- [tanstack.com/virtual/latest/docs](https://tanstack.com/virtual/latest/docs/installation) — `@tanstack/react-virtual` is the React-specific package; install via `npm install @tanstack/react-virtual`
- [github.com/TanStack/virtual](https://github.com/TanStack/virtual) — 6.9k stars, active TanStack project, confirms legitimacy

### Tertiary (LOW confidence — not used for architectural decisions)
- WebSearch results for `@tanstack/react-virtual` npm downloads — corroborates legitimacy (~15M weekly downloads)

---

## Metadata

**Confidence breakdown:**
- Standard stack (Next.js 16 caching): HIGH — verified directly from installed `node_modules/next/dist/docs/`
- Standard stack (@tanstack/react-virtual): MEDIUM-HIGH — confirmed via official TanStack docs and GitHub; npm registry unreachable so no `npm view` verification
- Architecture patterns: HIGH — derived from reading actual codebase files
- Breaking callers of `getAllCards`: HIGH — verified via grep of all callers
- Pitfalls: HIGH for caching pitfalls (from official docs); MEDIUM for virtualization pitfalls (from training + official docs)

**Research date:** 2026-05-26
**Valid until:** 2026-06-25 (Next.js stable; TanStack Virtual stable)

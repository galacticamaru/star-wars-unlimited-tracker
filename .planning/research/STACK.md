# Technology Stack — v6 Mobile, Performance & Polish

**Project:** Star Wars Unlimited Tracker
**Researched:** 2026-05-29
**Scope:** NEW capabilities only. Existing stack (Next.js 16, Neon/Drizzle, Better Auth, shadcn/ui + base-ui, nuqs, @tanstack/react-virtual, @vercel/speed-insights) is validated and unchanged.

---

## Stack Delta for v6

v6 adds **zero new npm dependencies**. Every technique in this milestone is achievable with what is already installed. The sections below explain what to use and exactly why.

---

## 1. Mobile Responsive Layout — Tailwind CSS Only

**Recommendation:** Tailwind responsive variants (`md:`) + CSS Grid/Flex. No new library.

### The actual problem

`deck-builder.tsx` wraps the entire layout in `flex h-[calc(100svh-56px)] overflow-hidden` and unconditionally renders `<DeckSidebar>` as a fixed-width `w-80` column. On mobile viewports the sidebar overlaps or displaces content because there is no `hidden md:block` guard on it.

### Solution pattern — no extra library needed

The existing codebase already solves this for the catalog: `SidebarFilters` and `MobileFilterSheet` use exactly this pattern — desktop sidebar is `hidden md:block`, mobile gets a sheet/drawer triggered by a button. Apply the same pattern to `DeckSidebar`:

```tsx
// Mobile: stats accessible via bottom sheet or slide-over panel
// Desktop: sidebar stays as-is (w-80, border-l)

// deck-builder.tsx outer layout change:
<div className="flex h-[calc(100svh-56px)] overflow-hidden">
  <div className="flex-1 flex flex-col overflow-hidden">
    {/* toolbar + content unchanged */}
  </div>
  {/* Hide sidebar on mobile, show on md+ */}
  <div className="hidden md:flex md:flex-col">
    <DeckSidebar ... />
  </div>
</div>

// Mobile stats trigger button in toolbar (shown on mobile only):
<Button className="md:hidden" onClick={() => setShowStats(true)}>
  Stats
</Button>
```

For the mobile stats panel itself, use `@base-ui/react` `Popup` or a `fixed bottom-0` div controlled by `useState` — the same pattern already used in the mobile bottom bar at line 607 of `deck-builder.tsx`. No new component library needed.

**Why not a drawer library:** `@base-ui/react` is already installed and provides the headless primitive. `shadcn/ui` Sheet component (already in the project via `components/ui/`) wraps base-ui and is the correct tool for this pattern.

**Confidence:** HIGH. Verified against existing codebase patterns in `mobile-filter-sheet.tsx` and `sidebar-filters.tsx`.

---

## 2. INP Measurement and Fixing — React Built-ins, No New Library

**Recommendation:** `useTransition` / `startTransition` (React 19, already running) + `useReportWebVitals` (Next.js built-in) + Vercel Speed Insights attribution data. Zero new packages.

### INP in the deck builder context

INP measures the time from user interaction to the next paint. The three sub-phases are:

1. **Input delay** — main thread busy when the event fires
2. **Processing delay** — event handler execution time
3. **Presentation delay** — re-render + layout/paint time

The deck builder's likely INP pain points (from code inspection):

- Card quantity `+`/`-` buttons dispatch to `useReducer`, which triggers re-render of the full grouped deck list (`groupedDeck` via `useMemo`) — this is synchronous and blocks paint
- `isDirty` comparison (`JSON.stringify` on the full cards array) runs on every render
- The `CatalogClient` in "Add Cards" mode re-renders with `deckCounts` updates on every card add

### Recommended fixes using existing React 19 APIs

**`startTransition` for non-urgent state updates:**

```tsx
// In handleDeckUpdate — wrap the dispatch so card count changes
// are treated as non-urgent (React can yield to user input first)
import { useTransition } from 'react';

const [isPending, startTransition] = useTransition();

const handleDeckUpdate = (cardDefinitionId: number, quantity: number) => {
  startTransition(() => {
    dispatch({ type: 'UPDATE_CARD', ... });
  });
};
```

This keeps the button tap responsive (input acknowledged immediately) while React defers the grouped list re-render. On React 19 (this project runs 19.2.4), `startTransition` can also wrap async work.

**`useDeferredValue` for the catalog's `deckCounts` prop:**

```tsx
// In deck-builder.tsx, defer the deckCounts passed to CatalogClient
// so catalog grid re-renders don't block the deck editor
const deferredDeckCounts = useDeferredValue(deckCounts);
```

**`isDirty` computation — move JSON.stringify off the render path:**

The current `useMemo` for `isDirty` runs `JSON.stringify` on every render. Sort the cards array in the reducer (keep it pre-sorted) and use a shallow-equal check instead, or move this to a `useEffect` so it doesn't block paint.

### Measuring INP in development

Use `useReportWebVitals` from `next/web-vitals` (built into Next.js, already imported via the `@vercel/speed-insights` instrumentation):

```tsx
// In a client component in layout.tsx or per-page:
import { useReportWebVitals } from 'next/web-vitals';

useReportWebVitals((metric) => {
  if (metric.name === 'INP') {
    console.log('INP:', metric.value, 'attribution:', metric.attribution);
  }
});
```

The `attribution` object on the INP metric names the DOM element that triggered it (`metric.attribution.interactionTarget`). This is the same data the Vercel Speed Insights dashboard surfaces as "HTML element attribution."

**In production:** The Speed Insights dashboard already collects INP breakdowns. Filter by route (`/decks/[id]`) to see which interactions are slow and which elements are implicated.

**Confidence:** HIGH for `startTransition`/`useDeferredValue` (verified React 19.2.4 is installed, these are stable APIs). HIGH for `useReportWebVitals` (verified in Next.js 16 local docs). MEDIUM for the specific bottlenecks (analysis based on code reading; attribution data from production may reveal different hotspots).

---

## 3. Next.js 16 Caching for /decks Routes

**`cacheComponents: true` is already enabled** in `next.config.ts`. `'use cache'` with `cacheTag` and `cacheLife` is already in use for `getAllCards()` and `getFilterOptions()` in `src/db/queries/catalog.ts`. The v6 work is to apply the same pattern to the deck-specific queries.

### Current state of /decks/[id]

`app/decks/[id]/page.tsx` makes three parallel DB calls:

```ts
const [deckData, allCards, filterOptions] = await Promise.all([
  getDeckWithCards(deckId, Number(session.user.id)),  // NOT cached
  getAllCards(),          // already 'use cache' with cacheLife('days')
  getFilterOptions(),    // already 'use cache' with cacheLife('days')
]);
```

`getAllCards()` and `getFilterOptions()` are already cached. The only uncached call is `getDeckWithCards` — which is user-specific and must not be cached (different user, different deck data).

**Key insight:** The TTFB cost on `/decks/[id]` is almost entirely from `getDeckWithCards` plus the authentication check. The `getAllCards()` call (the big one, ~thousands of rows) is already cached. No additional caching primitives are needed for the card catalog data.

### Current state of /decks (list page)

`app/decks/page.tsx` calls `getDecks(userId)` and `getWantList(userId)`. Both are user-specific and cannot be cached at the query level.

The `/decks` list TTFB is bounded by these two user-specific queries plus auth. This is correct — there is nothing to cache here without a user-scoped cache (which adds complexity not justified for a list of a user's own decks).

### Where `'use cache'` genuinely helps for v6

**`getDecks` query is not the LCP bottleneck.** The real LCP opportunity on `/decks` is the page-level HTML delivery — which depends on the server function cold start time, not query speed. `getAllCards` being cached with `cacheLife('days')` already covers the largest payload.

**One actionable improvement: tag-based invalidation for deck saves.** Currently, the deck PATCH API saves to the DB but nothing purges any cache. Add `revalidatePath('/decks')` in the PATCH route handler after a successful save so the list page reflects the update immediately:

```ts
// In app/api/decks/[id]/route.ts after successful PATCH:
import { revalidatePath } from 'next/cache';
revalidatePath('/decks');
```

This uses `revalidatePath` (already available from `next/cache`), not a new primitive.

### `'use cache'` vs `'use cache: remote'` on Vercel Hobby

**Important constraint:** The default `'use cache'` directive stores data in-memory inside the serverless function instance. On Vercel serverless (Hobby and Pro), each request may land on a different instance — in-memory caches do not survive across requests.

`'use cache: remote'` stores in Vercel's persistent Runtime Cache (regional, survives across requests). However, Runtime Cache on Vercel is a **paid add-on** — it is not included in the Hobby tier free allocation. The Vercel pricing page (verified 2026-04-08) lists Runtime Cache under paid infrastructure resources without a Hobby-tier free allocation.

**Practical consequence for this project:**
- `getAllCards()` and `getFilterOptions()` already use `'use cache'` — on Vercel Hobby, these will re-execute on most requests (cold memory). They are still valuable for build-time prerendering (the static HTML shell is cached at CDN level regardless).
- Do NOT change these to `'use cache: remote'` without first verifying the Hobby tier includes runtime cache quota or accepting the cost.
- The build-time prerender benefit is real even without runtime caching: Next.js prerenders the HTML shell at build time for pages that can be prerendered, and CDN-serves it. `/decks` and `/decks/[id]` are dynamic (auth-required), so they cannot be prerendered — the SSR per-request cost is unavoidable.

**Verified source:** Vercel runtime-cache docs (2026-03-05) explicitly state: "`use cache` is in-memory by default. This means that it is ephemeral, and disappears when the instance that served the request is shut down. `use cache: remote` is a declarative way telling the system to store the cached output in a remote cache such as Vercel runtime cache."

**Confidence:** HIGH. Verified against local Next.js 16 docs and Vercel official documentation.

### The real /decks performance lever: Neon connection latency

The slowest per-request operation is the Neon PostgreSQL round-trip over HTTP. Both `/decks` and `/decks/[id]` make multiple sequential or parallel DB queries. Neon's serverless driver already uses HTTP pooling (`@neondatabase/serverless`), which is the correct choice. For v6, no change is needed here — the existing driver is optimal for Vercel serverless.

---

## 4. `next/dynamic` for DeckSidebar on Mobile

**Recommendation:** Lazy-load `DeckSidebar` with `next/dynamic` and `ssr: false` only if bundle analysis shows it contributes meaningfully to JS parse time. This is speculative until measured.

`DeckSidebar` is already a client component. On mobile, it is hidden via CSS — but its JS still downloads and parses. If the bundle is heavy enough to affect INP or FCP on mobile, wrapping it in `dynamic(() => import('./deck-sidebar'), { ssr: false })` defers that parse until the component is needed.

**Do not do this preemptively.** Measure first via the Vercel build output or Next.js bundle analyzer. The sidebar is relatively small (220 lines, no large dependencies) and likely contributes <10 KB gzipped — unlikely to be the bottleneck.

**Confidence:** MEDIUM. Lazy-loading is a known pattern for reducing initial JS (verified in Next.js 16 local docs under lazy-loading guide). Whether it helps here depends on bundle size measurements not yet taken.

---

## 5. Image Optimization — Restore After Quota Renewal

`next.config.ts` has `unoptimized: true` with a comment "TODO(2026-06-04): Vercel Image Transformations quota exhausted — remove unoptimized once quota renews." The v6 milestone window (before June 4) overlaps with this. When quota renews, remove `unoptimized: true` to re-enable Next.js image optimization — this will directly improve LCP scores for pages with card art.

This is not a new library or tool; it is a one-line config change with measurable LCP impact.

---

## Summary: What to Add and What NOT to Add

### Add (zero new packages)

| Technique | Where | Why |
|-----------|-------|-----|
| `hidden md:flex` on DeckSidebar | `deck-builder.tsx` | Fixes MOBILE-01/02 sidebar overlap |
| shadcn/ui `Sheet` (already installed) for mobile stats | New `DeckStatsMobileSheet` component | Exposes stats on mobile without layout breakage |
| `useTransition` + `startTransition` | `deck-builder.tsx` card update handlers | Reduces INP by deferring non-urgent re-renders |
| `useDeferredValue` | `deckCounts` passed to `CatalogClient` | Prevents catalog grid blocking deck editor interactions |
| `revalidatePath('/decks')` after deck save | `app/api/decks/[id]/route.ts` | Ensures list page reflects saves without full page reload |
| Remove `unoptimized: true` on 2026-06-04 | `next.config.ts` | Restores LCP-improving image optimization |

### Do NOT Add

| What | Why Not |
|------|---------|
| Any responsive layout library (react-responsive, react-breakpoints, etc.) | Tailwind breakpoints + CSS are sufficient and already in use |
| `'use cache: remote'` | Requires paid Vercel Runtime Cache; not available on Hobby free tier |
| New INP measurement library (web-vitals standalone) | `useReportWebVitals` from `next/web-vitals` is built-in and already instrumented via `@vercel/speed-insights` |
| react-spring / framer-motion for slide animations | Overkill; CSS transitions (`translate-x` + `transition`) handle the mobile drawer perfectly |
| @tanstack/react-query | Already decided against in v2; Next.js Server Components + RSC patterns cover data fetching |
| Separate mobile deck builder route | Adds routing complexity; responsive layout of the same component is the correct approach |

---

## Sources

- Next.js 16 `use cache` directive docs: `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md` (local, verified)
- Next.js 16 `cacheLife` docs: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cacheLife.md` (local, verified)
- Next.js 16 `unstable_cache` deprecation notice: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/unstable_cache.md` (local, verified)
- Next.js 16 lazy loading guide: `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md` (local, verified)
- Next.js 16 `useReportWebVitals`: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-report-web-vitals.md` (local, verified)
- Vercel Runtime Cache docs: https://vercel.com/docs/caching/runtime-cache (fetched 2026-05-29)
- Vercel Pricing docs: https://vercel.com/docs/pricing (fetched 2026-05-29, last updated 2026-04-08)
- Vercel INP tooling blog: https://vercel.com/blog/demystifying-inp-new-tools-and-actionable-insights (fetched 2026-05-29)
- React `useTransition` docs: https://react.dev/reference/react/useTransition

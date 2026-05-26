# Phase 24: Catalog & Page Load Performance - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 24 delivers three measurable performance improvements to the catalog and binder surfaces:

1. **PERF-01 — Filter response ≤200ms**: Catalog filter interactions (text search, set/rarity/variant/type dropdowns) reflect new results in ≤200ms without a visible loading spinner or full page reload. Addressed via search input debounce and card grid virtualization.

2. **PERF-02 — LCP reduction on catalog**: The catalog page's above-fold content appears measurably faster on first load. Addressed by removing `force-dynamic` and adding Next.js cache tags so card data (which changes only on daily sync) is RSC-cached and served without a DB round-trip.

3. **PERF-03 — Image loading improvement**: Card images below the fold load lazily; the first two rows load with priority. No new layout shift (existing `aspect-[2/3]` and `aspect-[3/2]` containers already prevent CLS). No blur placeholder — skeleton behavior is kept as-is.

No changes to the public binder page caching (stays force-dynamic). No new UI features — all changes are performance-only.

</domain>

<decisions>
## Implementation Decisions

### Search Debounce (PERF-01)

- **D-01:** The search input (`SidebarFilters` / `TopBar`) switches to local React state with a 150ms debounce before syncing to nuqs URL state. The nuqs `search` setter is called only after 150ms of typing inactivity. Eliminates mid-keystroke `filterCards` re-runs and grid re-renders.
- **D-02:** Filter dropdowns (set, rarity, variant, type, aspect, arena, trait, keyword, cost, owned-only toggle) continue to fire instantly — no debounce. Only the text search input gets the debounce treatment.

### Card Grid Virtualization (PERF-01)

- **D-03:** `CardGrid` adds windowed rendering via `@tanstack/virtual` (new dependency). Only the card tiles visible in the viewport are rendered to the DOM. This eliminates the DOM-size bottleneck when the unfiltered catalog has 1000+ rows.
- **D-04:** Column count per breakpoint is fixed and matches the existing CSS grid: 3 columns at the base, 5 at `sm`, 7 at `md`, 9 at `lg`, 11 at `xl`. Detected via a breakpoint hook (e.g., `useWindowSize` or `matchMedia`). Column count drives how `@tanstack/virtual` groups cards into rows.
- **D-05:** The virtual list scrolls inside the existing fixed-height scroll container (`100svh - 56px`). No layout changes to the catalog page — the existing container ref is passed to the virtualizer. The sidebar + main-content fixed-height layout is preserved.

### LCP Caching (PERF-02)

- **D-06:** Remove `export const dynamic = 'force-dynamic'` from `src/app/cards/page.tsx`. The catalog page becomes RSC-cacheable because its data (card definitions, printings, filter options, printing art map) is user-agnostic.
- **D-07:** `getAllCards()` drops the `userId` parameter entirely. The LEFT JOIN with `userCollections` and the `collectionCount` selected column are removed. The function becomes a pure `cardDefinitions` ↔ `cardPrintings` JOIN. Collection data continues to come from the client-side `/api/collection` fetch (unchanged).
- **D-08:** `getAllCards`, `getFilterOptions`, and `getPrintingArtMap` are wrapped with Next.js `unstable_cache` (or equivalent) tagged with `'cards'`. The daily card sync cron route calls `revalidateTag('cards')` after successfully inserting new card data, invalidating the cached responses.
- **D-09:** The public binder page (`src/app/binder/[username]/page.tsx`) stays `force-dynamic`. Binder data is per-user and must always reflect the latest state.

### Image Priority + Placeholder (PERF-03)

- **D-10:** `CardGrid` passes `priority={index < 22}` to `CardItem` for the first 22 cards in the filtered list (approximately two rows at the `xl` breakpoint with 11 columns). Cards at index ≥ 22 are lazy-loaded by default.
- **D-11:** No blur placeholder is added. The current skeleton behavior (`animate-pulse` on the container + `opacity-0` on the image until `onLoad`) stays unchanged — it already provides acceptable visual feedback during image fetch.

### Claude's Discretion

- Exact implementation of the breakpoint hook for virtualization column count (useWindowSize hook, matchMedia listeners, or CSS container queries)
- Whether to introduce a shared `useDebounce` hook or inline the debounce with `useEffect` in `CatalogClient`
- Whether `unstable_cache` or the newer Next.js `cache()` function from `react` is used (depends on which is appropriate per the Next.js version in use — read `node_modules/next/dist/docs/` per AGENTS.md)
- How to handle the scroll container ref plumbing for `@tanstack/virtual` (whether `CardGrid` receives the ref as a prop or reads it from context)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

**IMPORTANT: Per AGENTS.md, read `node_modules/next/dist/docs/` before writing any Next.js caching code — APIs and conventions may differ from training data.**

### Catalog page + filter pipeline
- `src/app/cards/page.tsx` — Catalog page (remove force-dynamic, add cache tags here)
- `src/components/catalog/catalog-client.tsx` — CatalogClient with nuqs filter state and useMemo(filterCards); debounce goes here (search input → local state → nuqs sync)
- `src/components/catalog/sidebar-filters.tsx` — SidebarFilters; search input onChange wiring
- `src/lib/filter-cards.ts` — filterCards function; understanding what the useMemo computes

### Card grid + virtualization
- `src/components/catalog/card-grid.tsx` — CardGrid component; virtualization added here
- `src/components/catalog/card-item.tsx` — CardItem component; priority prop added here

### Data layer + caching
- `src/db/queries/catalog.ts` — getAllCards, getFilterOptions, getPrintingArtMap; userId removed from getAllCards, cache tags added to all three
- `src/app/api/sync/route.ts` (or equivalent daily sync entry point) — must call revalidateTag('cards') after card insert

### Binder page (reference — stays force-dynamic)
- `src/app/binder/[username]/page.tsx` — public binder page; no caching changes here

### Requirements
- `.planning/REQUIREMENTS.md` — PERF-01, PERF-02, PERF-03 requirement text and acceptance criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `filterCards()` (`src/lib/filter-cards.ts`) — already in a `useMemo` with correct deps; no changes needed to the function itself, only to when it's triggered (debounce)
- `nuqs` filter state — all 10 filter fields use `parseAsArrayOf` + `shallow: true`; only `search` field needs the local-state debounce wrapper
- `CardItem` (`src/components/catalog/card-item.tsx`) — already accepts `bestVariantArtUrl`; needs one new `priority` boolean prop passed through from `CardGrid`
- `aspect-[2/3]` / `aspect-[3/2]` containers in `CardItem` — already prevent layout shift (CLS = 0 for image load); no changes needed here

### Established Patterns
- `nuqs` with `shallow: true` — all filter state writes are URL-only (no server refetch); the filter pipeline is already entirely client-side
- `force-dynamic` on pages — both catalog and binder currently use this; catalog page will be the first page to remove it
- Client-side collection fetch — collection data is already fetched client-side via `useEffect` → `/api/collection`; removing userId from getAllCards is consistent with this existing split
- Grid CSS: `grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-11` — these are the column counts to replicate in the virtualizer row grouping

### Integration Points
- `CatalogClient` → `CardGrid` → `CardItem`: the debounce and priority changes thread through this prop chain
- `getAllCards()` is called from `src/app/cards/page.tsx`; userId removal is a breaking change in the function signature (callers outside the catalog page, if any, must be updated)
- The daily sync route calls into the card sync logic; `revalidateTag('cards')` must be added at the point where new cards are committed to the DB

</code_context>

<specifics>
## Specific Ideas

- Search debounce: 150ms delay. Local state in `CatalogClient` for the search input value; `setSearch` (nuqs) called only from a debounced effect.
- Virtualization: `@tanstack/virtual` (new `npm install @tanstack/virtual-core` or `@tanstack/react-virtual`). Column count matches existing CSS breakpoints (3/5/7/9/11).
- Image priority threshold: `index < 22` (first 22 cards = two rows at xl). `CardGrid` passes `priority` boolean to `CardItem`; `CardItem` forwards it to `<Image priority={priority} />`.
- Cache tag: `'cards'` — simple, single tag covering all three query functions.

</specifics>

<deferred>
## Deferred Ideas

- Blur placeholder for card images — discussed and explicitly deferred; current skeleton (animate-pulse + opacity-0) is sufficient
- Public binder page caching (ISR with 60s revalidate) — discussed; user prefers force-dynamic for always-fresh binder data
- Database query optimization (adding indexes to card_definitions / card_printings) — not discussed; Phase 24 scope is frontend-side performance only
- PERF-04 / PERF-05 (Quick Add progress feedback, new deck speed) — out of scope for Phase 24; tracked in REQUIREMENTS.md as Phase 25 scope

</deferred>

---

*Phase: 24-catalog-page-load-performance*
*Context gathered: 2026-05-26*

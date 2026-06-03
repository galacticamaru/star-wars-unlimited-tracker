# Phase 29: Card Detail Page Performance - Context

**Gathered:** 2026-06-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 29 delivers measurable FCP, LCP, and INP improvements to `/cards/[set]/[id]` driven by Vercel Speed Insights data. Three concrete deliverables:

1. **Query caching split (TTFB/LCP):** `getCardByPrinting` is split into a cacheable public query + a removed legacy hydration block. `getSameSetPrintingsWithCounts` gains per-user caching with proper invalidation.

2. **Loading skeleton (FCP/LCP):** A `loading.tsx` for the card detail route shows a full two-column skeleton (image placeholder + metadata lines) immediately, before DB queries complete.

3. **Image priority fix (LCP):** Replace the invalid `preload={true}` prop in `CardImageSection` with `priority` — the correct Next.js Image prop for above-fold LCP images.

4. **Speed Insights checkpoint (PERF-10 compliance):** Wave 1 ships the proactive fixes. A checkpoint plan requires you to review Vercel Speed Insights data for `/cards/[set]/[id]` and provide specific regressions. Wave 2 applies targeted fixes per your findings. If no data is available, the phase closes after Wave 1.

No new features, no database schema migrations, no new API routes.

</domain>

<decisions>
## Implementation Decisions

### Query Caching — Public Card Data

- **D-01:** Split `getCardByPrinting` in `src/db/queries/card-detail.ts` into `getCardDefinition(setCode, cardNumber)` — a pure public data query with no user joins (`userCollections` LEFT JOIN removed). Add `'use cache'` + `cacheTag('cards')` + `cacheLife('days')` inside the function body. This mirrors the `getAllCards()` pattern in `catalog.ts` exactly. The existing `cacheTag('cards')` on the catalog is already invalidated by the daily sync cron — this new query rides the same tag.
- **D-02:** Remove the legacy hydration block (lines 40–48 in `page.tsx`) entirely. The per-variant `user_printing_collections` table shipped in Phase 17 (May 2026). Any user who has visited the app since then has already migrated. The `collectionCount` field and the `userCollections` LEFT JOIN are both removed from the new `getCardDefinition` query.

### Query Caching — User-Specific Printings

- **D-03:** Cache `getSameSetPrintingsWithCounts(cardDefinitionId, setCode, userId)` per-user: `cacheTag(\`card-printings-${cardDefinitionId}-user-${userId}\`)`. Add `'use cache'` + this tag inside the function body. No `cacheLife` — invalidation is explicit via `revalidateTag`.
- **D-04:** Add `revalidateTag(\`card-printings-${cardDefinitionId}-user-${userId}\`)` to:
  - `src/app/api/collection/variants/route.ts` (POST — variant count changes)
  - `src/app/api/trade/route.ts` (PATCH — trade quantity changes)
  - Both need to derive `cardDefinitionId` from `cardPrintingId` before revalidating.
- **D-05:** Two-layer invalidation — `revalidateTag()` in the API route handlers busts the server-side Data Cache; `router.refresh()` in `VariantCollectionSection` and `VariantTradeSection` after successful mutations busts the Router Cache. Same pattern as Phase 27 deck mutations.

### Loading Skeleton

- **D-06:** Add `src/app/cards/[set-code]/[card-number]/loading.tsx` for the card detail route.
- **D-07:** Full layout skeleton — two-column layout matching the real page: image placeholder (same `md:w-[320px] md:flex-shrink-0 aspect-[2/3]` dimensions as `CardImageSection`) on the left, metadata column on the right (title line, subtitle line, badge row, stat chips, text box lines). `animate-pulse` throughout.
- **D-08:** Skeleton covers above-fold content only — image + metadata column. No placeholder rows for `VariantCollectionSection` or `VariantTradeSection` (below the fold for most cards).

### Image Priority Fix

- **D-09:** In `CardImageSection`, replace `preload={true}` with `priority` on the `<Image>` component. The `preload` prop is not a standard Next.js Image prop; `priority` is the correct one for above-fold LCP images (adds `<link rel="preload">` to the document head).
- **D-10:** No blur placeholder — `priority` alone is sufficient. The existing `animate-pulse` skeleton on the container + `opacity-0` transition covers perceived loading. The `sizes="(max-width: 768px) 100vw, 320px"` prop is already correct.

### Speed Insights Checkpoint

- **D-11:** Execution plan structure:
  - **Wave 1:** Apply all proactive fixes (query caching split, loading.tsx, image priority).
  - **Checkpoint plan (Wave 2a):** You review Vercel Speed Insights for `/cards/[set]/[id]` FCP/LCP/INP data and provide specific regression findings to the executor.
  - **Wave 2b:** Executor applies targeted fixes per your findings.
- **D-12:** Fallback if Speed Insights shows insufficient data: close the phase after Wave 1. Document that no regression data was available. Do NOT apply speculative INP fixes — proactive fixes are the full deliverable in this case.

### Claude's Discretion

- Exact function signature for the new `getCardDefinition` — whether to retain the same return shape minus `collectionCount`, or rename/restructure fields
- How to derive `cardDefinitionId` from `cardPrintingId` inside the API route handlers for `revalidateTag` (small lookup query or pass `cardDefinitionId` in the request body from the client)
- Whether `router.refresh()` is already called in `VariantCollectionSection` / `VariantTradeSection` (check before adding — it may already exist from Phase 23 work)
- Exact skeleton line heights and widths — mirror the real layout proportions

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

**IMPORTANT: Per AGENTS.md, read `node_modules/next/dist/docs/` before writing any Next.js caching or Suspense code — APIs and conventions may differ from training data.**

### Card detail page (primary modification target)

- `src/app/cards/[set-code]/[card-number]/page.tsx` — Full RSC page. Remove legacy hydration block (lines 40–48). Split `getCardByPrinting` call into `getCardDefinition`. Update imports.

### Query functions (primary modification targets)

- `src/db/queries/card-detail.ts` — `getCardByPrinting` → rename/split to `getCardDefinition` (public, cached). `getSameSetPrintingsWithCounts` → add per-user `cacheTag`. Read the FULL file before editing.
- `src/db/queries/catalog.ts` — **Reference implementation** for `'use cache'` + `cacheTag` + `cacheLife` pattern. Read before writing any cache code in card-detail.ts.

### API route mutation handlers (add revalidateTag)

- `src/app/api/collection/variants/route.ts` — POST handler for variant count mutations. Add `revalidateTag('card-printings-{cardDefinitionId}-user-{userId}')` after successful upsert.
- `src/app/api/trade/route.ts` — PATCH handler for trade quantity mutations. Add the same `revalidateTag` call.

### Client components (check router.refresh() and add priority)

- `src/components/catalog/card-image-section.tsx` — Replace `preload={true}` with `priority` on the `<Image>`. Read the full component first.
- `src/components/catalog/variant-collection-section.tsx` — Check if `router.refresh()` is already called after successful fetch. If not, add it.
- `src/components/catalog/variant-trade-section.tsx` — Same check for `router.refresh()`.

### Reference skeletons (loading.tsx patterns)

- `src/app/decks/loading.tsx` — Phase 27 skeleton pattern (animate-pulse, two-section layout). Read before writing the card detail skeleton.
- `src/app/decks/[id]/loading.tsx` — Phase 27 skeleton for a detail page. More directly analogous to the card detail page structure.

### State / Architecture pre-decisions

- `.planning/STATE.md` §"Key Architectural Notes for v6" — Cache tag naming, two-layer invalidation, cross-user data leak risk. Read before writing any cache code.
- `.planning/REQUIREMENTS.md` — PERF-10 requirement text and success criteria.
- `.planning/phases/27-decks-route-performance/27-CONTEXT.md` — Phase 27 caching decisions (D-01 through D-05, D-09, D-10). This phase follows the same patterns.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `'use cache'` + `cacheTag` + `cacheLife` pattern — already in `src/db/queries/catalog.ts` lines 1–11. Exact same pattern goes into `getCardDefinition`.
- `revalidateTag` — already imported in `src/app/api/cron/sync-cards/route.ts`. Import path: `import { revalidateTag } from 'next/cache'`.
- `router.refresh()` — `useRouter` is likely already imported in `VariantCollectionSection` (it uses `useRouter` for the auth redirect). Verify before adding new imports.
- `animate-pulse` skeleton pattern — `src/app/decks/loading.tsx` and `src/app/decks/[id]/loading.tsx` are the established reference implementations.

### Established Patterns

- **`'use cache'` inside function body** — `catalog.ts` places the directive at the top of each exported async function body. Follow this exactly.
- **Two-layer cache invalidation** — `revalidateTag()` in route handler + `router.refresh()` in client component. Established in STATE.md, implemented in Phase 27 deck routes.
- **`cacheTag` with userId in key** — Per STATE.md, never cache without userId in the key for user-specific data. The printings cache uses `card-printings-{cardDefinitionId}-user-{userId}`.
- **Public data rides `cacheTag('cards')`** — The new `getCardDefinition` shares the `'cards'` tag with `getAllCards()`. Both are invalidated by the daily sync cron's `revalidateTag('cards')`.

### Integration Points

- `getCardDefinition` is called once per page view in the RSC. Caching inside the function covers all call sites.
- `getSameSetPrintingsWithCounts` feeds both `VariantCollectionSection` and `VariantTradeSection` via the RSC props. Mutations in those components need to invalidate the cache.
- The legacy `userCollections` table join (`collectionCount`) is removed — `VariantCollectionSection` already computes totals from per-variant counts, so no UI change needed.
- `loading.tsx` in `src/app/cards/[set-code]/[card-number]/` activates for the entire route segment, including the full two-column layout.

</code_context>

<specifics>
## Specific Ideas

- New function name: `getCardDefinition(setCode, cardNumber)` — dropping the `ByPrinting` naming since it no longer joins through `cardPrintings` as the entry point (or keep `getCardByPrinting` — Claude's discretion on naming).
- Cache tag for printings: `cacheTag(\`card-printings-${cardDefinitionId}-user-${userId}\`)` — `cardDefinitionId` interpolated at call time.
- Loading skeleton image placeholder dimensions: `w-full md:w-[320px] md:flex-shrink-0 aspect-[2/3] bg-muted rounded-lg animate-pulse` — matches `CardImageSection`'s container exactly.
- `priority` placement: applies only to `frontArtUrl` image on initial render. When the Leader flip toggled to `backArtUrl`, that image is lazy (correct — it's not the LCP element).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 29-card-detail-page-performance*
*Context gathered: 2026-06-03*

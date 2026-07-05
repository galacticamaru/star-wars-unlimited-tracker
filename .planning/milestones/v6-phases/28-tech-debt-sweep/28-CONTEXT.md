# Phase 28: Tech Debt Sweep - Context

**Gathered:** 2026-06-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 28 closes three specific tech debt items left over from v4/v5 development:

1. **DEBT-01 — CollectionControls dead code removal:** Delete `src/components/catalog/collection-controls.tsx`. The component's POST endpoint was removed in a prior phase (documented in `route.ts`); the file has no active imports — only a stale comment in `variant-collection-section.tsx` that references it. The comment is cleaned up as part of the deletion.

2. **DEBT-03 — Variant enum gaps:** Two places have incomplete variant listings. `VARIANT_OPTIONS` in `variant-filter.tsx` is missing `'Prestige Foil'`. `VARIANT_PRECEDENCE` in `select-best-variant.ts` is missing `'Serialized'`. Both gaps cause silent data errors (unknown variant types silently ignored instead of shown/ranked). The stale `schema.ts` comment for `variantType` (which only lists 5 types) is updated to list all 8.

3. **DEBT-04 — Catalog collection state invalidation:** After a user updates owned counts on a card detail page and navigates back to the catalog, the catalog's owned-count overlay must show fresh data. The existing `useEffect([isAuthenticated])` re-fetch in `CatalogClient` handles the component-remount path. A `pageshow` event listener is added to handle the browser BFCache path (native device back button on mobile).

No new features, no database schema migrations, no new API routes.

</domain>

<decisions>
## Implementation Decisions

### DEBT-01: CollectionControls Removal

- **D-01:** Delete `src/components/catalog/collection-controls.tsx` entirely. The file has zero active imports — its POST `/api/collection` call target was removed when the variant-aware collection API was introduced.
- **D-02:** Clean up the stale comment references to `CollectionControls` in `src/components/catalog/variant-collection-section.tsx` (lines 42 and 67 reference "CollectionControls" in comments). Remove or rephrase these comments so they don't point to a deleted file.

### DEBT-03: Variant Enum Gaps

- **D-03:** In `src/components/catalog/variant-filter.tsx`, add `'Prestige Foil'` to `VARIANT_OPTIONS` immediately after `'Prestige'`. New order: `['Normal', 'Foil', 'Hyperspace', 'Hyperspace Foil', 'Showcase', 'Prestige', 'Prestige Foil', 'Serialized']`. Groups the two Prestige variants together.
- **D-04:** In `src/lib/catalog/select-best-variant.ts`, add `Serialized: 8` to `VARIANT_PRECEDENCE`. Serialized cards are ultra-rare numbered prints (e.g., 1/25) — the most premium category. Rank 8 places them above Prestige Foil (7), matching their real-world scarcity. Updated precedence order: Serialized(8) > Prestige Foil(7) > Prestige(6) > Showcase(5) > Hyperspace Foil(4) > Hyperspace(3) > Foil(2) > Normal(1).
- **D-05:** Update the `variantType` inline comment in `src/db/schema.ts` (line 104) to list all 8 types: `"Normal" | "Foil" | "Hyperspace" | "Hyperspace Foil" | "Showcase" | "Prestige" | "Prestige Foil" | "Serialized"`.

### DEBT-04: Catalog Collection State Invalidation

- **D-06:** The primary re-fetch mechanism is already in place: `CatalogClient`'s `useEffect([isAuthenticated])` fires on component remount when the user navigates back from `/cards/[set]/[card]` to `/cards`. This covers the standard Link-based navigation case.
- **D-07:** Add a `pageshow` event listener for browser BFCache restores (device back button on mobile). When `event.persisted` is true and the user is authenticated, trigger a fresh `/api/collection` fetch and call `setCollection(data)`. This covers the edge case where the browser restores the page from its BFCache instead of remounting React components.
- **D-08:** The `pageshow` listener is added inside `CatalogClient` as a `useEffect` cleanup-registered listener: `window.addEventListener('pageshow', handler)` / `return () => window.removeEventListener('pageshow', handler)`.

### Claude's Discretion

- Exact cleanup wording for the `CollectionControls` comments in `variant-collection-section.tsx` — remove or rephrase as appropriate
- Whether to extract the collection fetch into a named `fetchCollection` helper inside `CatalogClient` to avoid duplicating the `fetch('/api/collection')` call between the `isAuthenticated` effect and the `pageshow` handler
- Test assertions for DEBT-04 if an automated test is added (manual verification is acceptable per STATE.md)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

**IMPORTANT: Per AGENTS.md, read `node_modules/next/dist/docs/` before writing any Next.js code — APIs and conventions may differ from training data.**

### Primary modification targets

- `src/components/catalog/collection-controls.tsx` — File to DELETE (DEBT-01). No active imports.
- `src/components/catalog/variant-collection-section.tsx` — Comment cleanup only (DEBT-01). No logic changes.
- `src/components/catalog/variant-filter.tsx` — Add `'Prestige Foil'` to `VARIANT_OPTIONS` (DEBT-03).
- `src/lib/catalog/select-best-variant.ts` — Add `Serialized: 8` to `VARIANT_PRECEDENCE`; update JSDoc precedence comment (DEBT-03).
- `src/db/schema.ts` — Update `variantType` column comment to list all 8 types (DEBT-03).
- `src/components/catalog/catalog-client.tsx` — Add `pageshow` event listener for BFCache re-fetch (DEBT-04).

### Reference files (read before editing)

- `.planning/REQUIREMENTS.md` — DEBT-01, DEBT-03, DEBT-04 requirement text and success criteria.
- `.planning/STATE.md` §"Key Architectural Notes for v6" — DEBT-04 note: "existing `useEffect` collection re-fetch on `/cards` is already the correct mechanism — verify it runs after card detail mutations, no new code needed" (D-07 adds the BFCache case on top of this).
- `src/app/api/collection/route.ts` — Comment on line 26 confirms POST endpoint was removed (D-01 rationale). Read before deleting `collection-controls.tsx`.

### Deleted endpoint cross-check

- `src/app/api/collection/variants/route.ts` — The replacement endpoint (POST `/api/collection/variants`) that `variant-collection-section.tsx` calls. Do NOT modify — this endpoint is active and correct.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `useEffect` / `useState` — already imported in `catalog-client.tsx`; the new `pageshow` handler uses the same `setCollection` state setter and same `fetch('/api/collection')` call as the existing `isAuthenticated` effect.
- `VARIANT_PRECEDENCE` in `select-best-variant.ts` — record object; adding a new key is a one-line change.
- `VARIANT_OPTIONS` in `variant-filter.tsx` — plain array literal; splice `'Prestige Foil'` between `'Prestige'` and `'Serialized'`.

### Established Patterns

- **Dead code removal** — delete the file outright; do not leave an empty shell or re-export. This is the same approach used when removing other deprecated components.
- **`useEffect` with cleanup** — `catalog-client.tsx` already has multiple `useEffect` hooks with proper cleanup returns. The `pageshow` listener follows the same pattern.
- **`VARIANT_PRECEDENCE` lookups use `?? 0` fallback** — unknown variant types resolve to 0 (lowest). Adding `Serialized: 8` ensures it is now ranked correctly instead of silently treated as lowest.

### Integration Points

- `CatalogClient` feeds `collection` prop into `CardGrid` → `CardItem` → owned-count overlay. Any fresh `setCollection` call (from the remount effect or the `pageshow` handler) triggers a re-render cascade that updates all tile overlays.
- `variant-filter.tsx` `VARIANT_OPTIONS` drives the sidebar filter UI checkbox list. Adding `'Prestige Foil'` makes it filterable; users can show/hide Prestige Foil cards.
- `select-best-variant.ts` `VARIANT_PRECEDENCE` is consumed by `selectBestVariantArtUrl()` (used in `CardGrid`) and by `src/db/queries/collection.ts` line 156. Both call sites benefit immediately from the `Serialized: 8` addition.

</code_context>

<specifics>
## Specific Ideas

- `VARIANT_OPTIONS` final form: `['Normal', 'Foil', 'Hyperspace', 'Hyperspace Foil', 'Showcase', 'Prestige', 'Prestige Foil', 'Serialized']`
- `VARIANT_PRECEDENCE` final form (updated header comment too): Serialized(8) > Prestige Foil(7) > Prestige(6) > Showcase(5) > Hyperspace Foil(4) > Hyperspace(3) > Foil(2) > Normal(1)
- `pageshow` handler sketch:
  ```ts
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted && isAuthenticated) {
        fetch('/api/collection')
          .then(res => res.json())
          .then(data => setCollection(data))
          .catch(err => console.error('Failed to reload collection:', err));
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [isAuthenticated]);
  ```
- `schema.ts` updated comment: `// "Normal" | "Foil" | "Hyperspace" | "Hyperspace Foil" | "Showcase" | "Prestige" | "Prestige Foil" | "Serialized"`

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 28-tech-debt-sweep*
*Context gathered: 2026-06-03*

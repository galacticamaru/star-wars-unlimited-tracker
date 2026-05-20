# Phase 19: Update Variant filters in catalog, deck builder and trade binder - Research

**Researched:** 2026-05-20
**Domain:** React Components, Filtering Logic, UI/UX for Variants
**Confidence:** HIGH

## Summary

The objective is to unify variant filtering across the Catalog, Deck Builder, and Trade Binder, ensuring all variant types (including "Foil" and "Hyperspace Foil") are supported, searchable, and visible on trade cards.

**Primary recommendation:** Add the missing variant options to `VARIANT_OPTIONS`, expose `VariantFilter` in the Binder pages, and add a small visual badge on `CardItem`/`ManageTradeCard` to indicate variant types clearly.

## User Constraints

- Add missing variant types ("Foil", "Hyperspace Foil") to filter options.
- Ensure consistent variant filtering across Catalog, Deck Builder, and Trade Binder.
- Improve variant visibility in the Trade Binder (add filters, and trade cards must show variant types).

## Architecture Patterns

### Pattern 1: Extending `VARIANT_OPTIONS`
**What:** The `VariantFilter` component (`src/components/catalog/variant-filter.tsx`) currently hardcodes options.
**When to use:** Update the static array to include all supported variants.
**Example:**
```typescript
const VARIANT_OPTIONS = ['Normal', 'Foil', 'Hyperspace', 'Hyperspace Foil', 'Showcase', 'Prestige', 'Serialized'];
```

### Pattern 2: Binder Filtering (Manage & Public)
**What:** `src/app/binder/manage/page.tsx` currently only uses a text search `searchTerm`. `src/components/binder/public-binder-client.tsx` uses `SidebarFilters` but doesn't track `selectedVariants`.
**How to apply:** 
- In `public-binder-client.tsx`, instantiate `const [selectedVariants, setSelectedVariants] = useQueryState('variants', parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: true }));` and pass to `SidebarFilters` and `filterCards`.
- In `ManageBinderPage`, implement `VariantFilter` in the "Add Cards" section to allow users to easily find specific variants (like Foils) to add to their binder.

### Pattern 3: Displaying Variant Type on Cards
**What:** Users need to see what variant a card is in the trade binder.
**How to apply:** Update `ManageTradeCard` and `CardItem` (when in binder mode) to display a small badge or text strip indicating the variant type if it is not "Normal".
**Example:**
```tsx
{variantType && variantType !== 'Normal' && (
  <div className="absolute top-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-bold shadow-md z-20 pointer-events-none">
    {variantType}
  </div>
)}
```

## Common Pitfalls

### Pitfall 1: Breaking Nuqs State Sync
**What goes wrong:** Adding `selectedVariants` to `useMemo` hooks (like `filteredCards` or `filteredOfferings`) but forgetting to include it in the dependency array.
**How to avoid:** Ensure `selectedVariants` is strictly passed into `filterCards` and added to all `useMemo` dependency arrays in `public-binder-client.tsx` and `deck-builder.tsx`.

### Pitfall 2: API Missing `variantType`
**What goes wrong:** The filtering relies on `card.variantType`. We verified `src/app/api/cards/all/route.ts` already returns `variantType`, but we must ensure `ManageTradeCard` receives it as a prop so it can display it.

## Open Questions

1. **Should the default filter for Catalog/Deck Builder remain `['Normal']`?**
   - *Recommendation:* If we keep it as `['Normal']`, users won't see "Foil" or "Hyperspace Foil" by default. If we change it to `[]` (All), users will see multiple versions of the same card. For the Deck Builder, `['Normal']` is preferred to prevent clutter, but for the Trade Binder, `[]` (All) should be the default so users see all available trades.
2. **How should `VariantFilter` be integrated into `ManageBinderPage`?**
   - *Recommendation:* Since `ManageBinderPage` doesn't use the full `SidebarFilters` component, we should add a localized dropdown or a set of toggle buttons specifically for Variant alongside the `Search` input.
3. **Are there any other places where variant filters are missing?**
   - *Recommendation:* The public binder view `src/components/binder/public-binder-client.tsx` uses `SidebarFilters` but defaults to no variant tracking. It must be updated to track and pass `selectedVariants` state.

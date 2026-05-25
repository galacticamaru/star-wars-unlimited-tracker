# Summary of 19-01: Update VariantFilter and State Tracking

**Goal**: Add missing variant types to the filter component and ensure they are correctly tracked in Catalog, Deck Builder, and Public Binder.

**Outcome**:
- **`src/components/catalog/variant-filter.tsx`**: Updated `VARIANT_OPTIONS` to include 'Foil' and 'Hyperspace Foil'.
- **`src/components/binder/public-binder-client.tsx`**: Added `selectedVariants` state management with `nuqs`, passed it to `SidebarFilters`, and included it in the `filterCards` logic for both trade offerings and want lists.

The changes fulfill the requirements of REQ-FILTER-01 for the public-facing components.
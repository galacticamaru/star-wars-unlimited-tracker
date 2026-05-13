# Phase 12 Context: Catalog Evolution

## Goals

1.  **Sticky Sidebar Filters**: Move search and all filters from the `TopBar` into a new sticky sidebar (similar to swu.fan).
2.  **Variant Support**: Update the card sync and catalog to support all variants (Showcase, Prestige, Serialized).
3.  **Twin Suns (TS26) Support**: Ensure the TS26 set is correctly synced and displayed.

## Decisions

### Layout & Navigation
-   **Sidebar**: A new sidebar component will house the search input and all filter dropdowns/controls.
-   **TopBar**: The existing `TopBar` will be phased out or repurposed for breadcrumbs/metadata, with search moving to the sidebar.
-   **Stickiness**: The sidebar must be sticky and handle its own scrolling if the filter list exceeds the viewport height.
-   **Mobile Experience**: On mobile devices, the sidebar will be replaced by a Drawer/Sheet component accessible via a filter button in a simplified top bar.

### Variant Support
-   **Default View**: By default, the catalog grid will continue to show only "Normal" prints to avoid clutter.
-   **Search & Filter**: Users can explicitly filter for variants (e.g., "Showcase only", "All variants").
-   **Sync Logic**: `upsertCards` must be updated to handle "Prestige" and "Serialized" variant types if they are returned by the API.

### Set Support
-   **TS26**: Treat Twin Suns as a standard set in the filter list and catalog grid. No specialized UI indicators are required at this stage.

## Technical Details

### Components
-   `src/components/catalog/sidebar-filters.tsx`: New component for the sidebar.
-   `src/components/catalog/catalog-client.tsx`: Update to support the new layout (flex-row for desktop).

### Database & Queries
-   `src/db/queries/catalog.ts`: Update `getAllCards` to support an optional `variantType` filter.
-   `src/lib/sync/upsert-cards.ts`: Verify `VariantType` handling for "Prestige" and "Serialized".

### Routing & State
-   Continue using `nuqs` for all filter state in the URL to ensure shareable, sticky filter states.

## Verification Strategy

### Automated Tests
-   Unit tests for `filterCards` updated with variant filtering logic.
-   Integration tests for the new `SidebarFilters` component.

### Manual Verification
-   Verify sidebar stickiness on long pages.
-   Verify mobile drawer functionality.
-   Verify variant search returns correct card printings.

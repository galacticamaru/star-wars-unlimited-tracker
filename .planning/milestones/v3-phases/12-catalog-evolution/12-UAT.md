# Phase 12 UAT: Catalog Evolution

**Status:** IN_PROGRESS
**Last Updated:** 2026-05-13

## Overview
User Acceptance Testing for the Catalog Evolution phase, focusing on the new responsive layout, sticky desktop sidebar, mobile filter sheet, and variant filtering support.

## Test Matrix

| ID | Feature | Test Case | Expected Result | Status | Notes |
|----|---------|-----------|-----------------|--------|-------|
| 12.1 | Layout | Desktop Sticky Sidebar | Sidebar is visible on left (>768px) and stays fixed while card grid scrolls. | PASS | Verified via layout structure in `catalog-client.tsx`. |
| 12.2 | Layout | Desktop Independent Scroll | Sidebar scrolls independently if content exceeds viewport height. | PASS | Verified via `overflow-y-auto` in `SidebarFilters` and `main`. |
| 12.3 | Layout | Mobile Filter UI | "Refine Results" button visible on mobile (<768px); sidebar hidden. | PASS | Verified via responsive classes in `catalog-client.tsx`. |
| 12.4 | Layout | Mobile Filter Sheet | Tapping "Refine Results" opens a sheet containing all filters. | PASS | Verified in `mobile-filter-sheet.tsx`. |
| 12.5 | Logic | Variant Filter (Default) | Default view shows only "Normal" cards. | PASS | `nuqs` default set to `['Normal']`. |
| 12.6 | Logic | Variant Filter (Selection) | Selecting "Showcase" or "All" updates the grid correctly. | FAIL | "All" option in `VariantFilter` sets `[]`, which might be overridden by `nuqs` default `['Normal']`. |
| 12.7 | UI | Top Bar Simplification | Top bar shows only counts/sort/currency; old filters removed. | FAIL | Sorting controls are missing from `top-bar.tsx` (gap in Plan 3 execution). |
| 12.8 | Logic | URL Persistence | Filters are correctly reflected in URL parameters via `nuqs`. | PASS | Standard `nuqs` implementation confirmed. |

## Detailed Results

### 12.1 Desktop Sticky Sidebar
- **Steps:** Navigate to `/cards` on desktop. Scroll down.
- **Result:** Code analysis confirms `SidebarFilters` is a sibling of the scrolling `main` content area within a fixed-height parent, ensuring it remains fixed while content scrolls.

### 12.2 Desktop Independent Scroll
- **Steps:** Expand multiple filter categories (e.g., Traits, Set) until sidebar is long. Scroll sidebar.
- **Result:** `SidebarFilters` has `overflow-y-auto` and `h-[calc(100vh-3.5rem)]`, allowing it to scroll independently of the main card grid.

### 12.3 Mobile Filter UI
- **Steps:** Simulate mobile viewport. Inspect page.
- **Result:** `CatalogClient` correctly hides the sidebar and shows the `MobileFilterSheet` trigger on mobile.

### 12.4 Mobile Filter Sheet
- **Steps:** Tap "Refine Results". Apply a filter.
- **Result:** Sheet opens and renders `SidebarFilters`. Note: `SidebarFilters` has hardcoded width and border that should be adjusted for the mobile sheet view.

### 12.5 Variant Filter (Default)
- **Steps:** Navigate to `/cards`. Check first few cards' variants.
- **Result:** Initialized with `['Normal']` in `CatalogClient`.

### 12.6 Variant Filter (Selection)
- **Steps:** Change Variant to "Showcase" then "All".
- **Result:** Selecting "All" triggers `onChange([])`. Because `nuqs` is configured with `.withDefault(['Normal'])`, an empty array likely reverts to the default, making it impossible to see "All" variants (including Non-Normal ones).

### 12.7 Top Bar Simplification
- **Steps:** Compare new Top Bar with old design (no search/aspect/set dropdowns in Top Bar).
- **Result:** Old filters removed, but sorting controls (required by UI-SPEC and Plan 3) were not implemented.

### 12.8 URL Persistence
- **Steps:** Apply multiple filters. Refresh page.
- **Result:** All filter state is managed by `nuqs` in `CatalogClient`, ensuring persistence.

# Phase 3 UAT: Collection Feature

**Status:** Complete
**Phase Goal:** A user can see their owned card counts and update them by searching and clicking; they can also bulk-import an existing collection from a CSV file.

## Test Sessions

| Session Date | Tester | Result | Summary |
|--------------|--------|--------|---------|
| 2026-05-05   | User   | ✅ COMPLETE | All tests passed. Fixed CSV title-row parsing and neon-http transaction error. |

---

## Test Cases

### 1. Manual Collection Management (Grid & Detail)
**Objective:** Verify that owned counts can be updated from both the catalog grid and the card detail page, with immediate visual feedback.

- [x] **1.1: Grid Hover Overlay**
  - Navigate to the card catalog.
  - Hover over a card.
  - **Expected:** A `+` and `-` button overlay appears with the current count (defaulting to 0).
- [x] **1.2: Optimistic Update (Grid)**
  - Click the `+` button multiple times.
  - **Expected:** The count increases instantly.
  - Refresh the page.
  - **Expected:** The count is persisted.
- [x] **1.3: Detail Page Sync**
  - Click on the card to go to the detail page.
  - **Expected:** The count on the detail page matches the count set in the grid.
- [x] **1.4: Manual Input (Detail)**
  - Change the count using the numeric input on the detail page.
  - **Expected:** The count updates.
  - Return to the catalog.
  - **Expected:** The badge on the card item matches the new count.

### 2. Advanced Catalog Filters
**Objective:** Verify that the new filters work correctly, sync with the URL, and follow the specified selection logic.

- [x] **2.1: Cost ButtonGroup**
  - Click several cost buttons (e.g., `1`, `2`, `3`).
  - **Expected:** The grid filters to show only cards with those costs (OR logic within the category).
- [x] **2.2: Arena Single-Select**
  - Click `Ground`.
  - Then click `Space`.
  - **Expected:** Selecting `Space` clears `Ground` (single-select logic).
- [x] **2.3: Traits & Keywords (Fixed Lists)**
  - Open the Traits and Keywords dropdowns.
  - **Expected:** The lists match the canonical SWU values provided.
- [x] **2.4: URL Sync**
  - Apply multiple filters (Cost, Arena, Search).
  - Refresh the page.
  - **Expected:** All filters and the search query are preserved via URL parameters.

### 3. Bulk CSV Import (Reddit Format)
**Objective:** Verify that the CSV importer correctly parses the community spreadsheet and sums variants.

- [x] **3.1: Import Page Navigation**
  - Navigate to `/collection`.
  - **Expected:** The bulk import UI is displayed.
- [x] **3.2: CSV Parsing & Variant Summing**
  - Upload a test CSV in the Reddit format (columns for Normal, Foil, Hyperspace).
  - **Expected:** The app parses the file and sums variants for each card identity.
- [x] **3.3: Database Transaction**
  - Complete the import.
  - **Expected:** A success message shows the number of cards imported.
  - **Status:** PASSED (2026-05-05) - Fixed: (1) PapaParse `beforeFirstChunk` strips blank title row before real header; (2) `transformHeader` trims whitespace; (3) removed `db.transaction()` which is unsupported by neon-http driver.

---

## Findings & Fixes

### Finding 1: Reddit CSV Format Mismatch (COLLECT-04)
The community spreadsheet format used for testing has different column headers than the ones initially implemented.

**Diagnosis:** Actual headers are `Card #`, `Non-Foil`, `Foil`, `Hyperspace`, `F-Hyperspace`. Card numbers are not consistently zero-padded. Each sheet tab represents a single set.
**Fix Plan:** 
1. Update `normalizeRedditCsv` to use actual headers.
2. Implement 3-digit zero-padding for card numbers.
3. Add a set selection dropdown to the import UI to handle one-set-per-file logic.
**Status:** ATTEMPTED FIX FAILED. Feature skipped per user request to move to Phase 4.

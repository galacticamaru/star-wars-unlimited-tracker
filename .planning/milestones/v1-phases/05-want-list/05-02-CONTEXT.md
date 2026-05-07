# Phase 5.2: Rarity Filter Fix - Context

**Gathered:** 2026-05-07
**Status:** Decisions Locked

<domain>
## Phase Boundary

Phase 5.2 fixes the broken rarity filter in the card catalog. Currently, selecting rarities in the dropdown has no effect because the filtering logic is bypassed. This phase implements the missing predicate in `filterCards()` and cleans up the data flow between the UI and the filtering logic.

</domain>

<decisions>
## Implementation Decisions

### Data Normalization
- **D-01: Plain Values in State:** The filter state (`selectedRarities`) will store plain strings matching the database values (e.g., `"Common"`, `"Rare"`) instead of prefixed UI strings (e.g., `"(C) Common"`).
- **D-02: Display Labels:** The `(C)`, `(U)`, etc. prefixes will be handled as display-only labels in the UI components, ensuring the underlying data remains clean and directly comparable to database records.

### Filter Logic
- **D-03: Simple Includes:** `filterCards` will implement the rarity check as:
  `const matchesRarity = selectedRarities.length === 0 || selectedRarities.includes(card.rarity);`
  This replaces the current `const matchesRarity = true;` bypass.

### UI & Options
- **D-04: Hardcoded Options:** The list of available rarities will remain hardcoded in `CatalogClient` to preserve the logical order (Common → Uncommon → Rare → Legendary → Special).
- **D-05: Special Rarity:** The "Special" rarity (used for promo cards) will be added to the dropdown as `(S) Special`.
- **D-06: Enhanced FilterDropdown:** The `FilterDropdown` component will be updated to support an optional `getLabel` prop or similar mechanism to allow display labels that differ from the underlying values.

</decisions>

<canonical_refs>
## Canonical References

### Logic
- `src/lib/filter-cards.ts` — contains the `filterCards` function and `FilterState` interface.
- `src/lib/filter-cards.test.ts` — unit tests for filtering logic.

### UI
- `src/components/catalog/catalog-client.tsx` — manages filter state and passes options to the TopBar.
- `src/components/catalog/top-bar.tsx` — renders the filter dropdowns.
- `src/components/catalog/filter-dropdown.tsx` — the generic dropdown component used for filtering.

### Schema
- `src/db/schema.ts` — defines the `rarity` column in `card_printings`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Rarity Values
The database uses the following strings for rarity (from `card_printings.rarity`):
- `"Common"`
- `"Uncommon"`
- `"Rare"`
- `"Legendary"`
- `"Special"`

### Current Bypass
`src/lib/filter-cards.ts`:
```typescript
    // Rarity: OR within category (BYPASSED: selecting rarities does nothing for now)
    const matchesRarity = true;
```

</code_context>

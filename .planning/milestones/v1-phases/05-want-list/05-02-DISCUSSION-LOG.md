# Phase 5.2: Rarity Filter Fix - Discussion Log

## 2026-05-07

### Gray Area: Prefix Handling
- **Question**: How should we handle the rarity prefixes like (C)?
- **Decision**: Clean up values in the filter state to just plain strings (e.g., `"Common"`) and add the prefixes only for display in the UI.
- **Rationale**: Keeps the filtering logic simple and robust while maintaining the established visual language of the catalog.

### Gray Area: Special Rarity
- **Question**: Should we add the 'Special' rarity to the dropdown?
- **Decision**: Yes, add it as `(S) Special`.
- **Rationale**: Ensures the filter can cover all cards present in the database, including promo cards.

### Gray Area: Dynamic Options
- **Question**: Should we derive the rarity list from the database?
- **Decision**: No, keep it hardcoded.
- **Rationale**: Preserves the logical order of rarities (Common to Legendary), which wouldn't be guaranteed by a simple alphabetical sort of distinct values from the database.

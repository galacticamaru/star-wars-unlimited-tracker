# Phase 18 Validation Cases

## Test Cases

### 1. Catalog Variant Art Display
- **Setup:** A user owns 1 Normal, 2 Foil, and 3 Hyperspace versions of card A. They own 1 Showcase and 1 Foil of card B.
- **Action:** Load the catalog page.
- **Expected:** Card A renders the Hyperspace art (highest count). Card B renders the Showcase art (tie-breaker logic prioritizes Showcase).
- **Automation:** Unit test for the client-side tie-breaker logic in `src/components/catalog/card-item.tsx` or its helper function.

### 2. Starter Deck Quick-Add Selection
- **Setup:** Logged in user with an empty collection.
- **Action:** Navigate to the Collection page, select "Luke Skywalker Starter Deck" from the dropdown, and click "Add to Collection".
- **Expected:** API returns a successful response. The collection counts on the page increment correctly.
- **Automation:** Integration test for `POST /api/collection/starter-deck`.

### 3. Starter Deck Idempotency / Stacking
- **Setup:** Logged in user already owns 1 copy of "R2-D2".
- **Action:** Quick-add the "Luke Skywalker Starter Deck".
- **Expected:** The user now owns 4 copies of "R2-D2" (1 original + 3 from deck).
- **Automation:** API increment logic validation.

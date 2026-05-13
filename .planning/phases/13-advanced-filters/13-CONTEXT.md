# Phase 13: Advanced Filters - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 13 delivers a single new filter capability: an **owned-only toggle** in the catalog sidebar that shows only cards the user has at least 1 copy of in their collection. The toggle appears in both the standalone catalog (`/cards`) and the deck builder's card browser — CatalogClient is shared, so no conditional rendering by mode is needed.

**Dropped from scope:** REQ-MARKET-05 (market price threshold filter) — deferred to a future phase (see Deferred Ideas).

</domain>

<decisions>
## Implementation Decisions

### Owned-Only Toggle — Behavior

- **D-01:** "Owned only" means `collection[id] >= 1` — at least 1 copy owned. No deck-aware surplus logic.
- **D-02:** The toggle is visible to all users. When logged out, it renders greyed out / disabled with a tooltip: "Log in to filter by owned cards". `isAuthenticated` is already tracked in `CatalogClient`.
- **D-03:** Toggle placement: **below the search bar, above the other filter dropdowns** in the sidebar.
- **D-04:** Toggle state persists in the URL via `nuqs` (boolean param, e.g., `?owned=true`), consistent with all other filter state.

### Filter Scope

- **D-05:** The toggle appears in **both catalog and deck builder** — CatalogClient is shared; adding it once covers both surfaces at no extra cost. No mode-specific conditional.

### Claude's Discretion

- Toggle UI component choice (shadcn/ui `Switch`, a `Checkbox`, or a styled `Button` toggle) — use whichever reads most naturally alongside the search bar.
- Exact `nuqs` param name for owned-only boolean (e.g., `owned`, `ownedOnly`).
- Tooltip wording and disabled state visual treatment.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Filter system
- `src/lib/filter-cards.ts` — `FilterState` interface and `filterCards()` function; extend both to add `ownedOnly: boolean` parameter
- `src/components/catalog/catalog-client.tsx` — master filter orchestrator; owns all `nuqs` hooks, `collection` state, `sidebarProps`, and passes to `SidebarFilters` and `MobileFilterSheet`

### Sidebar components
- `src/components/catalog/sidebar-filters.tsx` — desktop sidebar; add the toggle here
- `src/components/catalog/mobile-filter-sheet.tsx` — mobile drawer; must also receive and render the toggle

### Data layer
- `src/db/queries/catalog.ts` — `getAllCards()` already returns `collectionCount` in the DB result; it is stripped during serialization in the deck page — no DB changes needed for the toggle (collection is fetched client-side via `/api/collection`)
- `src/app/decks/[id]/page.tsx` — deck builder page; passes `allCards` and `filterOptions` to `DeckBuilder` → `CatalogClient`; no changes expected here

### Requirements
- `.planning/REQUIREMENTS.md` — REQ-DECK-06: "Filter deck builder catalog to show ONLY cards user owns"

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `collection` state in `CatalogClient` — already fetched from `/api/collection` on mount; maps `cardDefinitionId → count`; use this directly for the owned-only check
- `isAuthenticated` boolean in `CatalogClient` (derived from `authClient.useSession()`) — use to disable the toggle when logged out
- `nuqs` `parseAsBoolean` — use for the `?owned` URL param; consistent with existing `parseAsArrayOf(parseAsString)` pattern
- `sidebarProps` object in `CatalogClient` — add `ownedOnly` and `onOwnedOnlyChange` to this spread; flows to both `SidebarFilters` and `MobileFilterSheet`

### Established Patterns
- All filter state lives in URL via `nuqs` with `.withDefault(...)` and `.withOptions({ shallow: true })` (Phase 12 rule — do not use `useState` for filters)
- `filterCards()` in `filter-cards.ts` is the single client-side filter function; new filter parameters are added to `FilterState` and handled inside `filterCards()`
- `handleClearAll` in `CatalogClient` resets all filters — add `setOwnedOnly(false)` here

### Integration Points
- `SidebarFilters` and `MobileFilterSheet` both receive `sidebarProps` as a spread — add the two new props (`ownedOnly`, `onOwnedOnlyChange`) to both components' prop interfaces
- `filterCards()` receives the full filter state — add `ownedOnly?: boolean` to `FilterState` and gate on `collection` data being available (pass `collection` into `filterCards` or pre-filter before calling)

</code_context>

<specifics>
## Specific Ideas

- Toggle disabled state when logged out: greyed out + tooltip "Log in to filter by owned cards"
- `nuqs` param: suggest `owned` (short, readable in URLs like `?owned=true`)
- The filter check: `!ownedOnly || (collection[card.id] ?? 0) >= 1`

</specifics>

<deferred>
## Deferred Ideas

- **REQ-MARKET-05 — Market price threshold filter**: Dropped from Phase 13 by user decision. Was scoped as filtering cards by price (e.g., "under $1.00"). All data is already in `CardForFilter` (`priceEur`, `priceUsd`). Could be a standalone phase or folded into a future filter enhancement. No implementation started.

</deferred>

---

*Phase: 13-advanced-filters*
*Context gathered: 2026-05-13*

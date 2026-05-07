# Phase 3: Collection - Context

**Gathered:** 2026-05-05
**Status:** Ready for research/planning

<domain>
## Phase Boundary

Phase 3 introduces collection tracking. Users can now record how many copies of each card they own. This ownership data will be displayed across the application and will form the foundation for the upcoming Deck Builder and Want List phases.

This phase also adds bulk import capabilities via CSV and expands the catalog's filtering capabilities to support more advanced card searching.

</domain>

<decisions>
## Implementation Decisions

### Owned Count UI
- **D-01: Grid Overlay:** Hovering over a card in the catalog grid reveals `+` and `-` buttons along with the current owned count. This allows for rapid manual entry.
- **D-02: Detail Page Integration:** The same count controls (`+`, `-`, and a numeric input) are available on the card detail page.
- **D-03: Optimistic Updates:** UI updates immediately when the user clicks `+` or `-`, with background API calls to sync with the database.

### Data Model & Persistence
- **D-04: Future-Proof Schema:** The `user_collections` table will include a `user_id` column (integer) even though auth is not yet implemented. For v1, this will be hardcoded to `1`.
- **D-05: Single Count per Identity:** In v1, we do not track foils or variants (Hyperspace, Showcase) as separate inventory. All copies of the same card identity (shared `card_definition_id`) are summed into a single "owned" count.

### Catalog UX & Filters
- **D-06: Multi-line Top Bar:** To accommodate 5 new filters (Arena, Trait, Rarity, Keyword, Cost), the Top Bar will expand to multiple lines. Search remains prominent on the first line.
- **D-07: Advanced Filters:** All filters (including new ones) use OR logic within the category and AND logic across categories.
- **D-08: Cost Filter:** A specialized multi-select for costs `0` through `9+`.
- **D-09: URL Sync:** All search and filter states are synced to the URL query parameters. This ensures that navigating back from a detail page restores the user's previous view state.

### CSV Import
- **D-10: Dedicated Collection Page:** A new `/collection` page will host the CSV import tool and potentially other bulk management features.
- **D-11: Reddit Spreadsheet Support:** The importer will specifically support the community Reddit SWU tracking spreadsheet, automatically summing the "Standard", "Hyperspace", and "Foil-Hyperspace" columns into the single owned count.
- **D-12: Client-side Parsing:** Use `PapaParse` for client-side CSV parsing. Only the normalized data is sent to the server.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Planning
- `.planning/PROJECT.md` — core value, constraints, key decisions
- `.planning/ROADMAP.md` — Phase 3 goal, success criteria
- `.planning/REQUIREMENTS.md` — COLLECT-01 through COLLECT-04

### Architecture Research
- `.planning/research/ARCHITECTURE.md` — `user_collections` table design, CSV import flow, LEFT JOIN strategy

### Phase 2 Implementation (what Phase 3 builds on)
- `src/components/catalog/catalog-client.tsx` — current filtering and state logic
- `src/components/catalog/card-item.tsx` — current grid item implementation (target for overlay)
- `src/app/cards/[set-code]/[card-number]/page.tsx` — detail page (target for count controls)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/filter-cards.ts` — pure filtering logic (to be expanded with new filters)
- `src/components/catalog/top-bar.tsx` — current filter UI (to be refactored for multi-line)
- `src/components/ui/` — existing shadcn/base-ui components (button, input, dropdown)

### Integration Points
- **Database:** `src/db/schema.ts` needs the `user_collections` table definition.
- **API:** New `/api/collection` and `/api/collection/import` routes are required.
- **State:** `CatalogClient` needs to integrate `useSearchParams` for URL sync.

</code_context>

<deferred>
## Deferred Ideas

- **COLLECT-04 (v2):** Exporting collection to CSV (deferred to v2).
- **COLLECT-05 (v2):** SWUDB-specific CSV export support (deferred to v2).
- **SCAN-01 (v2):** Camera scanning (deferred to v2).
- **Variant Tracking:** Tracking foils and alternate arts separately (deferred to v2).

</deferred>

---

*Phase: 3-Collection*
*Context gathered: 2026-05-05*

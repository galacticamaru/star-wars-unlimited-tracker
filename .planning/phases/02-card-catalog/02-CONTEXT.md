# Phase 2: Card Catalog - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 delivers: a catalog page where users can browse the full SWU card catalog as a pure image grid, search cards by name in real time, and filter by set, card type, and aspect — all querying the local Neon database cache. A dedicated card detail page (`/cards/[id]`) shows the full card image alongside all metadata fields.

This phase does NOT add collection tracking, owned counts, or deck-building context — those are Phase 3 and 4. The catalog is read-only in Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Card Display
- **D-01:** Cards are displayed as a pure image grid — no text labels below each card. Card images from swu-db.com are full card images (not just art), so all information (name, type, cost, aspects, power, HP) is already readable from the image itself.
- **D-02:** While a card image is loading, show a blank grey card-shaped placeholder (correct aspect ratio, no layout shift). On image error, keep the grey box — no broken-image icon.

### Search & Filter UX
- **D-03:** Search bar and filters live in a single top bar spanning the full page width. Layout: `[Search cards...]  Set▾  Type▾  Aspect▾`. No sidebar.
- **D-04:** Search is real-time and client-side. Load all card data once on page load and filter in memory as the user types. 1,806 cards is small enough that client-side filtering is instant and avoids server round-trips.
- **D-05:** Filters use AND logic across categories: selecting Set=SOR AND Type=Unit AND Aspect=Heroism shows only cards matching all three. Each active filter narrows the result set further.

### Card Detail Page
- **D-06:** Clicking a card navigates to `/cards/[set-code]/[card-number]` — e.g., `/cards/SOR/059`. A dedicated detail page, not a modal. Back button returns to the catalog. The `collector_number` field in `card_printings` already stores this as `SOR-059`; the route splits on the hyphen.
- **D-07:** The detail page shows the full card image on one side and all metadata on the other (side-by-side layout): name, subtitle, type, aspects, arenas, traits, keywords, cost, power, HP, front text, back text (if double-sided), epic action (if Leader), set code, collector number, rarity, artist.

### Card Images — Open Research Item
- **D-08:** The swu-db.com image CDN hostname is not yet known — it must be discovered by inspecting the redirect from the `front_art_url` values already stored in `card_printings`. The researcher must determine the hostname and configure Next.js `remotePatterns` accordingly. This is flagged as a blocker in STATE.md.

### Claude's Discretion
- Grid column count and responsive breakpoints (e.g., 3 cols mobile → 5 cols tablet → 8 cols desktop)
- Card aspect ratio in the grid (SWU cards are portrait, ~2:3)
- Routing structure for the catalog page (e.g., `/` or `/catalog`)
- Catalog page route (e.g., `/` or `/catalog`)
- How Set, Type, and Aspect filter options are populated (from distinct values in the DB)
- Pagination vs infinite scroll vs full render (with 1,806 cards and client-side filtering, full render is likely fine)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Planning
- `.planning/PROJECT.md` — core value, constraints, key decisions
- `.planning/ROADMAP.md` — Phase 2 goal, success criteria, dependency order
- `.planning/REQUIREMENTS.md` — CATALOG-01, CATALOG-02, CATALOG-03 are the Phase 2 requirements

### Architecture Rules
- `CLAUDE.md` §Key Architecture Rules — non-negotiable: never call swu-db.com in the user request path, collection overlay is a LEFT JOIN, filter tokens from catalog

### Phase 1 Output (what Phase 2 builds on)
- `.planning/phases/01-foundation/01-02-SUMMARY.md` — schema: `card_definitions` (20 cols) + `card_printings` (11 cols), column names and types
- `.planning/phases/01-foundation/01-CONTEXT.md` — D-01 through D-05: two-table model decisions, token filter convention

### Open Blocker
- swu-db.com image CDN hostname — researcher must inspect `front_art_url` values in `card_printings` to find the actual CDN domain, then configure Next.js `remotePatterns`. No URL known at discussion time.

No external ADRs or specs beyond the above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/db/index.ts` — Drizzle client (`db` export), ready to use in Server Components and API routes
- `src/db/schema.ts` — `cardDefinitions` and `cardPrintings` table objects for typed Drizzle queries
- `src/app/layout.tsx` — Root layout with Geist Sans/Mono fonts and Tailwind. Body is a flex column.
- Tailwind CSS 4.x — installed and configured, available for all UI work
- No UI components exist yet — Phase 2 builds the first components from scratch

### Established Patterns
- App Router with `src/app/` directory layout and `@/` alias pointing to `src/`
- Server Components by default — use `'use client'` only where interactivity requires it (search input, filter dropdowns)
- Token filter: `card_definitions` queries must exclude token-type cards (T-prefixed collector numbers in `card_printings`, or `type ILIKE '%token%'` — see Phase 1 RESEARCH.md for exact filter)

### Integration Points
- Catalog page queries `card_definitions` JOIN `card_printings` for image URLs
- Phase 3 will add a LEFT JOIN to `user_collections` on this same query — schema already supports it
- Detail page queries a single `card_definitions` row by ID with its `card_printings`

</code_context>

<specifics>
## Specific Ideas

- The user confirmed that full card images (not just art crops) are shown — the image IS the card, containing all printed information. Design accordingly: no need to duplicate text over or beside the image in the grid.
- The detail page should present metadata fields in a readable layout beside the full card image — similar to how SWUDB.com or similar TCG sites present card details.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 2 scope.

</deferred>

---

*Phase: 2-Card-Catalog*
*Context gathered: 2026-05-04*

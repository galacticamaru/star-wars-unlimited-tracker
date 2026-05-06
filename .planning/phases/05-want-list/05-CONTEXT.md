# Phase 5: Want List - Context

**Gathered:** 2026-05-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 delivers two read-only "what am I missing" views computed live from existing data:
1. A per-deck want list on each deck's page (new "Want List" tab)
2. A combined want list aggregated across all decks (section on the /decks dashboard)

No new database schema is needed. All shortfall data is derived live from `deck_cards` + `user_collections`.

Phase 5 also adds a persistent top navigation bar (Catalog • Collection • Decks) as a structural improvement needed to connect the new and existing pages.

</domain>

<decisions>
## Implementation Decisions

### Per-Deck Want List (WANT-01)
- **D-01:** Location — new third tab in the deck builder toolbar: `Add Cards | Deck List | Want List`.
- **D-02:** Display — card tiles with images (same visual language as the catalog/collection grid). Read-only — no +/− controls.
- **D-03:** Sort — grouped by card type (Leader → Base → Unit → Event → Upgrade), matching the Deck List tab grouping pattern.
- **D-04:** Content — shows only cards the user does not own enough copies of. Each tile shows: card image, card name, quantity needed by the deck, owned count, and shortfall (missing = need − owned).

### Combined Want List (WANT-02)
- **D-05:** Location — a "What I Need to Buy" section on the `/decks` dashboard page, below the deck list. No new route or nav link needed.
- **D-06:** Aggregation logic — for each card, `shortfall = max(0, max(quantity_in_any_deck) − owned_count)`. This answers: "how many copies do I need to be able to build any one of my decks?" Collection is treated as covering each deck independently (not simultaneously). Only cards with shortfall > 0 are shown.
- **D-07:** Display — card tiles with images. Read-only. Sorted by card type. Each tile shows card name, max quantity needed (across decks), owned count, and shortfall.
- **D-08:** Summary line — show total unique cards missing and total copy shortfall (e.g. "11 cards needed, 23 total copies short").

### Top Navigation Bar
- **D-09:** Add a persistent top navigation bar to `src/app/layout.tsx`. Links: **Catalog** (`/`), **Collection** (`/collection`), **Decks** (`/decks`).
- **D-10:** Minimal style consistent with existing UI — no complex nav patterns. Active link highlighted.
- **D-11:** The combined want list lives on `/decks` so no additional nav link is needed for Phase 5.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — WANT-01 and WANT-02 requirement definitions
- `.planning/ROADMAP.md` §Phase 5 — success criteria (3 items), dependency on Phase 4

### Schema and Data Layer
- `src/db/schema.ts` — `deck_cards`, `user_collections`, `decks`, `card_definitions` tables
- `src/db/queries/decks.ts` — existing deck query functions (`getDeckWithCards`, `getDecks`)
- `src/db/queries/catalog.ts` — `getAllCards()` — does NOT include `ownedCount`; want list needs a new query or join

### Existing UI Patterns
- `src/components/catalog/catalog-client.tsx` — fetches collection via `GET /api/collection`, passes as `collection: Record<number, number>` to CardGrid. This pattern should be reused for want list ownership data.
- `src/components/catalog/card-grid.tsx` — existing grid component; reuse or extend for want list tiles
- `src/components/catalog/card-item.tsx` — card tile component; reuse in a new display mode (no +/− controls)
- `src/components/decks/deck-builder.tsx` — existing `view` state toggle (`'catalog' | 'editor'`); extend to `'catalog' | 'editor' | 'want-list'`
- `src/app/decks/page.tsx` — existing `/decks` dashboard; combined want list section goes here

### API
- `src/app/api/collection/route.ts` — `GET /api/collection` returns `Record<number, number>` (cardDefinitionId → owned count)
- `src/app/api/decks/route.ts` — `GET /api/decks`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CatalogClient` / `CardGrid` / `CardItem`: The full card tile rendering stack already handles images, owned count display, and shortfall highlighting. The want list can reuse `CardItem` in a new mode (read-only, no collection controls, no deck controls — just shortfall badge).
- `GET /api/collection`: Already returns `{[cardDefinitionId]: count}`. The per-deck want list tab can fetch this client-side the same way `CatalogClient` does.
- `getDeckWithCards(deckId)`: Returns deck + `cards[]` with `cardDefinitionId` and `quantity`. This is the input for per-deck shortfall computation.
- `getDecks(userId)`: Returns all decks. The combined want list needs all deck cards — requires a new query joining all `deck_cards` for a user.

### Established Patterns
- **Client-side collection fetch**: `CatalogClient` fetches `GET /api/collection` in a `useEffect` and stores in local state. Same pattern for the want list tab.
- **View toggle via `useState`**: `deck-builder.tsx` uses `view` state with a button group. Add `'want-list'` as a third value.
- **Drizzle ORM joins**: All DB queries use `db.select().from().innerJoin().where()` — the want list DB query follows this pattern.
- **Next.js 16 async params**: Dynamic route params must be awaited (`const { id } = await params`).
- **userId = 1**: v1 is single-user; hardcode userId = 1 in all new queries.

### Integration Points
- `src/components/decks/deck-builder.tsx`: Add third tab + `WantListTab` component
- `src/app/decks/page.tsx`: Add combined want list section (server component or client-side fetch)
- `src/app/layout.tsx`: Add `<NavBar>` component
- New DB query needed: `getDeckCardsForUser(userId)` — returns all deck cards across all decks for the combined want list computation

</code_context>

<specifics>
## Specific Ideas

- The user specifically wants card tiles with images (same visual language as the catalog), not a plain text table — even though it's a want list. This is intentional for visual consistency.
- The combined want list stays on `/decks` (no new route) because the dashboard is the natural home for cross-deck information.
- The top nav (Catalog • Collection • Decks) should be added in `src/app/layout.tsx` so it appears globally.

</specifics>

<deferred>
## Deferred Ideas

- **WANT-03 (v2)**: Export or share the want list (CSV download or shareable link) — explicitly deferred to v2 per REQUIREMENTS.md.
- **Want List nav link**: If a dedicated `/want-list` page is ever added in a future phase, it would get its own nav entry.

</deferred>

---

*Phase: 5-Want List*
*Context gathered: 2026-05-06*

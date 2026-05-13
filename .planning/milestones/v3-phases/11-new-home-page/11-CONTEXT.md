# Phase 11: New Home Page - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 11 delivers a new root (`/`) landing page with a Hero section and a "Highest Value Cards" 10-card grid, while migrating the existing catalog from `/` to `/cards` and updating the navigation bar. No new data models or API routes are needed — this is a routing and UI phase.

</domain>

<decisions>
## Implementation Decisions

### Hero Section
- **D-01:** Title — "Star Wars Unlimited Card Database and Deck Builder"
- **D-02:** Subtitle — "Track your collection, build your decks, and begin trading with up to date market prices"
- **D-03:** Visual treatment — Claude's discretion (see below). Dark/SW-themed with Oxanium heading font is the recommended approach given the font is already loaded.
- **D-04:** Three CTAs: "Import Collection" → `/collection`, "Build a Deck" → `/decks`, "Trade" → `/binder/manage`

### Highest Value Cards Grid
- **D-05:** System-wide top 10 cards ranked by `priceUsd DESC`. Not personalized to the logged-in user.
- **D-06:** Visible to all users, including unauthenticated guests — no auth gate.
- **D-07:** Each card in the grid links to `/cards/[set-code]/[card-number]` (card detail page).
- **D-08:** Prices displayed in USD.

### Navigation
- **D-09:** The "SWU Tracker" brand name in the NavBar becomes a `<Link href="/">` — no explicit "Home" nav item added.
- **D-10:** The "Catalog" nav link keeps its label; its `href` changes from `/` to `/cards`.
- **D-11:** The `isActive` logic for `href: '/'` currently uses exact match (`pathname === '/'`) — this stays correct once `/` is the home page and `/cards` is the catalog.

### Claude's Discretion
- Hero visual treatment: dark background with gradient or subtle texture, Oxanium font at large size for the title, contrasting subtitle in Nunito Sans, primary-colored CTA buttons using shadcn/ui Button component.
- Card grid component design: image, card name, price badge. Reuse the existing card image pattern from the catalog.
- Spacing, padding, and layout rhythm of the home page sections.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current catalog page (to be migrated)
- `src/app/page.tsx` — current `CatalogPage` server component; its content moves to `src/app/cards/page.tsx`; this file becomes the new home page

### New catalog route
- `src/app/cards/` — destination for catalog; create `src/app/cards/page.tsx` here (no file exists yet, only `[set-code]/` subdirectory)

### Navigation
- `src/components/nav-bar.tsx` — update `NAV_LINKS` Catalog href from `/` to `/cards`; wrap the brand name span in `<Link href="/">`

### Data queries
- `src/db/queries/catalog.ts` — contains `getAllCards` and `getFilterOptions`; extend or add a `getTopCardsByPrice(limit: number)` query for the high-value grid

### Layout & fonts
- `src/app/layout.tsx` — Oxanium font loaded as `--font-heading` (class `font-heading`); Nunito Sans as `--font-sans`; both available for the hero

### Requirements
- `.planning/REQUIREMENTS.md` — REQ-HOME-01 (route refactor), REQ-HOME-02 (hero section), REQ-HOME-03 (highest value cards grid)

### Card detail route (link destination for grid cards)
- `src/app/cards/[set-code]/[card-number]/page.tsx` — already exists; grid cards link here

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CatalogPage` server component pattern (`src/app/page.tsx`) — copy to `src/app/cards/page.tsx` with minimal changes; the new `page.tsx` at `/` starts fresh
- `getAllCards` / `getFilterOptions` (`src/db/queries/catalog.ts`) — import directly into the new `/cards/page.tsx`
- `shadcn/ui Button` — use for CTA buttons in the hero section
- `Lucide React` icons — available for CTA button icons if needed
- `font-heading` Tailwind class — renders Oxanium; use on the hero title

### Established Patterns
- Server component fetches data → serializes to plain objects → passes to `'use client'` component (see `plainCards` map in current `page.tsx`)
- `auth.api.getSession({ headers: await headers() })` for auth-aware queries in server components
- `isActive` in NavBar uses `pathname.startsWith(href)` for most links, exact match for `href === '/'`

### Integration Points
- NavBar: `NAV_LINKS` constant at top of `nav-bar.tsx` — add/update entries there; brand name span is the link-to-home target
- The catalog's active state detection (`href === '/'`) must update to `href === '/cards'` after the move
- `CurrencyProvider` and `NuqsAdapter` are in the root layout — both remain unchanged

</code_context>

<specifics>
## Specific Ideas

- Hero title exact string: `Star Wars Unlimited Card Database and Deck Builder`
- Hero subtitle exact string: `Track your collection, build your decks, and begin trading with up to date market prices`
- CTA button labels and destinations: "Import Collection" → `/collection`, "Build a Deck" → `/decks`, "Trade" → `/binder/manage`
- Grid layout: 5 columns × 2 rows = 10 cards, responsive (fewer columns on mobile)
- Grid data: `SELECT ... FROM card_printings ORDER BY price_usd DESC LIMIT 10` (or equivalent Drizzle query)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 11-new-home-page*
*Context gathered: 2026-05-12*

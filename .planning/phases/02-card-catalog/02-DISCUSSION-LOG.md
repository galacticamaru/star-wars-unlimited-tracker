# Phase 2: Card Catalog - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-04
**Phase:** 2-Card-Catalog
**Areas discussed:** Card display format, Search & filter UX, Card images, Card detail view

---

## Card Display Format

| Option | Description | Selected |
|--------|-------------|----------|
| Image grid | Card art fills each cell, name/type shown below or on hover | ✓ |
| Compact list | Thumbnail + name/type/set/aspects in table rows | |
| You decide | Claude picks based on TCG browser conventions | |

**Sub-question — metadata below cards:**

| Option | Description | Selected |
|--------|-------------|----------|
| Nothing — images only | Pure visual grid, no text labels | ✓ |
| Name only | One text line below each card | |

**User's choice:** Pure image grid, no text labels below cards
**Notes:** User asked for clarification — "Would just the images be enough? Are the images the card or the art on the card?" Clarified that swu-db.com provides **full card images** (complete card with frame, name, type, cost, power, text printed on it), not art crops. Given that, images-only is self-sufficient.

---

## Search & Filter UX

### Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Top bar — full width | Search + filter dropdowns in a single row across the top | ✓ |
| Left sidebar — filters panel | Filters in left panel, search at top of content | |

**User's choice:** Top bar layout

### Search behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Real-time, client-side | Load all cards once, filter in memory as user types | ✓ |
| Debounced server query | 300ms debounce → API route → response | |

**User's choice:** Real-time client-side filtering
**Notes:** 1,806 cards is small enough that client-side is instant and avoids latency.

### Filter logic

| Option | Description | Selected |
|--------|-------------|----------|
| AND logic — narrow results | SOR + Unit + Heroism = cards matching ALL three | ✓ |
| OR per category, AND across | Within a category can pick multiple values; across categories is AND | |

**User's choice:** AND logic across all filter categories

---

## Card Images

### Loading placeholder

| Option | Description | Selected |
|--------|-------------|----------|
| Blank card-shaped placeholder | Grey rectangle, correct aspect ratio, no layout shift | ✓ |
| Card back image | Show SWU card back while loading | |
| Shimmer / skeleton | Animated loading effect | |

**User's choice:** Blank grey card-shaped placeholder
**Notes:** CDN hostname for swu-db.com images not yet known — flagged as research blocker. Must inspect `front_art_url` values in `card_printings` to determine hostname for Next.js `remotePatterns`.

---

## Card Detail View

| Option | Description | Selected |
|--------|-------------|----------|
| Modal overlay | Card expands in modal, user stays on catalog | |
| Nothing — browsing only | No click interaction in Phase 2 | |
| Detail page | Navigate to /cards/[id] | ✓ (user specified) |

**User's choice:** Dedicated detail page at `/cards/[set-code]/[card-number]` — e.g., `/cards/SOR/059`
**User's note:** "Detailed page lists all the card details (Name, Aspects, Type)" + "the individual card page should have a url path like /cards/[set-code]/[card-number]"

**Sub-question — detail page content:**

| Option | Description | Selected |
|--------|-------------|----------|
| Full image + all metadata | Large card image + all fields side-by-side | ✓ |
| Full image only | Image is self-contained | |

**User's choice:** Full card image + all metadata side-by-side

---

## Claude's Discretion

- Grid column count and responsive breakpoints
- Card aspect ratio in grid (portrait ~2:3)
- Catalog page route (`/` or `/catalog`)
- URL slug format for detail page
- How filter options are populated from DB
- Pagination vs infinite scroll vs full render

## Deferred Ideas

None — discussion stayed within Phase 2 scope.

# Phase 10: Trade Binder - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can curate a publicly shareable "Trade Binder" page at `/binder/[username]`. This involves flagging specific cards from their collection as "Available for Trade" with quantities, and automatically showing "Looking For" cards based on their missing cards from all decks (with manual overrides). Visitors can browse the binder with catalog-style filters without logging in.

</domain>

<decisions>
## Implementation Decisions

### Binder Selection & Management
- **D-01: Explicit Curated Binder.** Only cards explicitly flagged with a trade quantity > 0 will appear in the public binder.
- **D-02: Dedicated Management Page.** Users manage their trade offers and looking-for list on a dedicated `/binder/manage` page, rather than inline on the main collection page.
- **D-03: Custom Username Slug.** Users will be identified in the shareable URL by a unique custom username (e.g., `/binder/vader123`) instead of a UUID.

### Public Visibility
- **D-04: Trade Offer Only.** Public visitors see only the quantity the user is offering for trade (e.g., "2 Available"), not the user's total owned count or inventory context.
- **D-05: Read-Only Public View.** Visitors can browse and filter the binder using the standard catalog filter set (Set, Rarity, Aspect, etc.) but cannot interact with collection controls.

### "Looking For" Section (Want List Integration)
- **D-06: Live Sync + Exclusions.** The "Looking For" section automatically syncs with the user's Global Want List (missing cards from all decks).
- **D-07: Manual Wants & Exclusions.** Users can manually add any card to their "Looking For" list and explicitly exclude auto-synced cards they don't want to trade for.
- **D-08: Global Scope.** By default, the auto-sync pulls from all decks in the user's library.

### Schema & Data Model
- **D-09: Extend user_collections.** Add a `tradeQuantity` (integer) column to the existing `user_collections` table to track trade offers alongside owned counts.
- **D-10: Extend users Table.** Add a `username` (unique string) column to the `users` table to support custom binder URLs.
- **D-11: Persistence for Wants.** Implement `trade_exclusions` and `trade_manual_wants` tables to support the "Looking For" logic.

### Claude's Discretion
- Exact UI layout of the `/binder/[username]` page (standard grid/list view like the catalog).
- The "username set" flow (e.g., a simple settings field or prompt on first binder access).
- Internal implementation of the "Live Sync" query for the public view.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` — TRADE-01 through TRADE-05.
- `.planning/ROADMAP.md` — Phase 10 goal and success criteria.

### Core Logic & Schema
- `src/db/schema.ts` — Existing `user_collections` and Better Auth `users` tables.
- `src/lib/want-list.ts` — Core logic for computing missing cards from decks.

### UI Reference
- `src/components/catalog/catalog-client.tsx` — Reference for catalog-style filtering and card grid layout.
- `src/components/nav-bar.tsx` — Where the "My Binder" link will be added.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/` — Tables, Cards, and Inputs for the management and public pages.
- `src/components/catalog/card-item.tsx` — Can be adapted for the binder view (showing trade quantity instead of owned).
- `src/components/currency-context.tsx` — Ensure the binder respects the user's preferred currency (EUR/USD).

### Established Patterns
- **Server Components** — Use for fetching the public binder data based on the username slug.
- **nuqs** — Use for the catalog-style filters on the public binder page.
- **Better Auth** — Use for identifying the owner on the management page and validating the username.

### Integration Points
- `/binder/[username]` — New public route.
- `/binder/manage` — New protected management route.
- `src/db/queries/collection.ts` — Extend to fetch trade quantities.

</code_context>

<specifics>
## Specific Ideas
- "Looking For" section should be visually distinct from "Available for Trade" on the public page.
- If a user hasn't set a username yet, `/binder/manage` should prompt them to choose one before they can share their binder.

</specifics>

<deferred>
## Deferred Ideas

### Deferred to v3
- **WANT-03**: Export/share want list as PDF/Text (Phase 10 covers the public web view).
- **DECK-06**: Filter deck builder by owned cards.

---

*Phase: 10-Trade Binder*
*Context gathered: 2026-05-11*

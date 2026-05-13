# Phase 14: Trade Binder Polish - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 14 delivers two improvements to the trade binder experience:

1. **Full-width public binder**: Remove the `container mx-auto` wrapper from `/binder/[username]/page.tsx` so `PublicBinderClient`'s existing full-height viewport layout takes effect edge-to-edge (like the catalog).
2. **Automatic Wants section in manage page**: Add a new "Automatic Wants" section to `/binder/manage` that surfaces deck-driven shortfalls using the same row style as "Manual Wants", with the ability to exclude individual cards directly from the list.

No changes to the manage page's outer layout (it stays `container mx-auto`). No changes to the public binder's card display (quantity pills already exist).

</domain>

<decisions>
## Implementation Decisions

### Full-width layout

- **D-01:** "Full-width" applies only to the **public binder** (`/binder/[username]/page.tsx`). The manage page keeps its centered `container mx-auto` layout.
- **D-02:** The fix is removing the `<div className="container mx-auto">` wrapper from the public binder page. `PublicBinderClient` already has correct internal padding (`px-4 lg:px-8`) and a full-height flex layout — no structural changes needed inside the component.

### Automatic Wants — manage page

- **D-03:** Add an **"Automatic Wants"** section to the manage page, displayed in the same row style as the existing "Manual Wants" section (card name + subtitle + quantity needed).
- **D-04:** Each row shows: card name, subtitle (if any), quantity needed (computed shortfall). No deck attribution — keep it simple.
- **D-05:** Each active (non-excluded) row has an **"Exclude"** action button — calls `toggleExclusion(cardId, true)` to suppress the card from the public "Looking For" list.
- **D-06:** Excluded cards still appear in the Automatic Wants list but rendered muted/greyed with an "Excluded" label and an **"Remove exclusion"** action to un-exclude.
- **D-07:** The auto-wants computation (deck shortfall logic) must be added to `getUserTradeData()` in `src/db/queries/trade.ts` — extract the deck-wants calculation from `getPublicBinderData()` in `src/db/queries/binder.ts` into a shared helper. The `/api/binder` GET response should include `autoWants: Array<{ cardDefinitionId, quantity, name, subtitle, isExcluded }>`.

### Looking For quantities (public binder)

- **D-08:** No changes needed — quantity pills already exist on cards in the public binder's "Looking For" section.

### Claude's Discretion

- Exact positioning of the "Automatic Wants" section relative to "Manual Wants" and "Exclusions" in the manage page sidebar.
- Whether to extract deck-wants logic into a shared helper in `src/lib/binder-logic.ts` or compute it inline in `getUserTradeData()`.
- Visual treatment for excluded rows (opacity, strikethrough, badge style).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Public binder page
- `src/app/binder/[username]/page.tsx` — current page wrapper; remove `container mx-auto` div
- `src/components/binder/public-binder-client.tsx` — the full-height client component; no structural changes needed, just let it fill the viewport

### Manage binder page
- `src/app/binder/manage/page.tsx` — manage page to add Automatic Wants section to
- `src/components/binder/manage-wants-list.tsx` — existing Manual Wants + Exclusions component; use as the style reference for Automatic Wants rows

### Data layer
- `src/db/queries/trade.ts` — `getUserTradeData()` — extend to include `autoWants` in the response
- `src/db/queries/binder.ts` — `getPublicBinderData()` — contains the deck-wants computation logic to extract/reuse
- `src/lib/binder-logic.ts` — `calculateLookingFor()` — the core shortfall formula; reuse for auto-wants computation
- `src/app/api/binder/route.ts` — GET endpoint that calls `getUserTradeData()`; response shape will expand

### Schema reference
- `src/db/schema` — `decks`, `deckCards`, `userCollections`, `tradeExclusions`, `tradeManualWants` tables are all involved in auto-wants computation

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `calculateLookingFor()` in `src/lib/binder-logic.ts` — already handles `autoTarget`, `manualTarget`, `currentInventory`, `isExcluded`; reuse directly for auto-wants computation in the manage context
- `ManageWantsList` component — row UI style (name, subtitle, quantity, action buttons) is the established pattern for the new Automatic Wants section
- `toggleExclusion()` in the manage page — already handles `addExclusion` / `removeExclusion` API calls; reuse for the "Exclude" / "Remove exclusion" buttons in Automatic Wants
- `tradeExclusions` set — exclusions are already fetched in `getUserTradeData()`; can use this to compute `isExcluded` on each auto-want row

### Established Patterns
- `/api/binder` response shape: `{ offerings, exclusions, manualWants }` — extend to `{ offerings, exclusions, manualWants, autoWants }`
- Manage page uses optimistic state updates via `setTradeData()` — the exclusion toggle already updates state locally on success
- `getPublicBinderData()` already joins decks → deckCards → inventory → exclusions to compute Looking For — extract this into a shared helper to avoid duplication

### Integration Points
- `toggleExclusion()` in the manage page already works for both adding and removing exclusions — the Automatic Wants "Exclude" button reuses this without new API surface
- Auto-wants shown in the manage page use the same exclusion data that's already fetched; no extra API calls needed at render time (all computed server-side in `/api/binder`)

</code_context>

<specifics>
## Specific Ideas

- The "Automatic Wants" section should visually mirror "Manual Wants" rows — same padding, same typography, same button sizes
- Excluded rows in Automatic Wants: muted opacity (e.g., `opacity-50`) with an "Excluded" badge and a "Remove exclusion" button instead of "Exclude"
- The public binder fix is a one-line removal in `page.tsx` — just drop the `<div className="container mx-auto">` wrapper

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope.

</deferred>

---

*Phase: 14-trade-binder-polish*
*Context gathered: 2026-05-13*

# Phase 30: Unified Search-Driven Add Flow - Context

**Gathered:** 2026-07-06
**Status:** Ready for planning

<domain>
## Phase Boundary

The Manage Binder page (`src/app/binder/manage/page.tsx`) replaces its two separate add surfaces — the "Add Cards to Binder" owned-card grid and the sidebar "Add Manual Want" box — with a **single search-driven flow over the full card catalog**. A search returns full-catalog matches (not just owned cards); the user picks a specific variant (printing) and chooses "Add to trade binder" (enabled only for owned variants) or "Add as want" (any variant, owned or not).

**In scope:** the unified search + variant/destination add flow, and removing the two old add surfaces.

**Out of scope (belongs to other v7 phases):**
- Moving the Trade Profile (username/binder URL) behind a modal + public trade note → **Phase 31**
- Reworking the wants list (combined auto/manual wants, exclusion sectioning, manual-want qty/remove controls) → **Phase 32**

In this phase, the existing **Trade Profile card** and **`ManageWantsList`** stay exactly as-is on the page.

</domain>

<decisions>
## Implementation Decisions

### Search mechanism (BINDER-11, criterion #2)
- **D-01:** Data source is **lazy full-catalog load**. On the user's **first keystroke** (not on page mount), fetch the full catalog + the user's owned cards, then filter client-side. Nothing is fetched or rendered on mount, satisfying "no eager load of the full collection or catalog on page mount." Reuses the existing `/api/cards/all` (catalog, cached on `cards` tag) and `/api/collection/owned-cards` (per-printing ownership) endpoints rather than a new server search route.
- **D-02:** Search gating: **minimum 2 characters** before any results show, visible results **capped at ~20** cards, **150ms debounce** (matches the existing catalog search debounce). Match on card name and subtitle, case-insensitive.
- **D-03:** Results are grouped by **card definition** (one tile per card), not one row per printing — the per-variant choice happens after selection in the sheet.

### Result presentation
- **D-04:** Search hits render as an **art-tile grid**, reusing the `ManageTradeCard` visual styling (responsive grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`). Show the card's best-available art.

### Variant + destination UX
- **D-05:** Clicking a result tile opens a **right-side Sheet** (extend the existing `VariantTradeSheet` pattern). The sheet lists **every variant of the card — owned AND unowned** (the current sheet filters to `ownedCount > 0`; this phase must show all printings).
- **D-06:** Per variant, the sheet offers **two actions**: "Add to trade binder" (set trade quantity) and "Add as want". "Add to trade binder" is **enabled only for variants the user owns**; for unowned variants it is **disabled with a visible reason** (e.g. "You don't own this variant"). "Add as want" is **always available** for any variant.
- **D-07:** Both actions use a **quantity stepper** — the want action gets its own qty control mirroring the trade-quantity control (the `/api/binder/wants` POST already accepts a `quantity`).

### Page layout
- **D-08:** Keep the current **2/3 + 1/3 grid**. The unified search bar + results grid go in the **left 2/3 column**, where the old "Add Cards to Binder" grid was, above the existing **Trade Offerings** grid. The **right 1/3 column keeps the Trade Profile card and `ManageWantsList` untouched** (reworked in Phases 31 & 32). The old "Add Manual Want" card is removed from the right column.

### Claude's Discretion
- Exact catalog→sheet data plumbing (how the full catalog rows are grouped into per-definition cards with per-printing ownership merged in) is an implementation detail for research/planning.
- Whether to extend `VariantTradeSheet` in place or introduce a superset component is left to planning, provided the owned-card flow's behavior is preserved.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §"Unified Binder Add Flow" — BINDER-10 through BINDER-14 (the requirements this phase satisfies)
- `.planning/ROADMAP.md` §"Phase 30: Unified Search-Driven Add Flow" — goal + 5 success criteria

### Files this phase changes / builds on
- `src/app/binder/manage/page.tsx` — the page being reworked (current two-surface layout, all the add/want/trade handlers)
- `src/components/binder/variant-trade-sheet.tsx` — the right-side sheet to extend (currently owned-only, trade-only)
- `src/components/binder/manual-wants-add-flow.tsx` — the sidebar Manual Want box being removed/absorbed
- `src/components/binder/manage-trade-card.tsx` — art-tile component to reuse for the results grid
- `src/components/catalog/variant-collection-section.tsx`, `src/components/catalog/variant-trade-section.tsx` — variant section components used inside the sheet

### Data / API
- `src/db/queries/catalog.ts` → `getAllCards()` (full catalog, per-printing, cached on `cards` tag) and its endpoint `src/app/api/cards/all/route.ts`
- `src/db/queries/collection.ts` → `getOwnedCardDefinitions()` (per-printing `ownedCount` + `tradeQuantity`) and its endpoint `src/app/api/collection/owned-cards/route.ts`
- `src/app/api/binder/wants/route.ts` — POST `{ cardPrintingId, quantity }` to add/update a manual want
- `src/app/api/trade/route.ts` — PATCH `{ cardPrintingId, tradeQuantity }` to set a trade offering
- `.planning/codebase/CONVENTIONS.md`, `.planning/codebase/STRUCTURE.md` — project component/patterns conventions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ManageTradeCard` — art-tile component already used for the offerings grid; reuse for the search results grid.
- `VariantTradeSheet` + `VariantCollectionSection` + `VariantTradeSection` — right-side sheet infrastructure; extend to show all variants and add the want action + ownership gating.
- `updateTradeQuantity` / `updateWantQuantity` handlers in `manage/page.tsx` — already do the optimistic state updates + API calls; can be driven by the new sheet.
- `/api/cards/all` and `/api/collection/owned-cards` — both endpoints already exist; the lazy-load flow fetches both on first keystroke.

### Established Patterns
- Client-side page (`'use client'`) using `authClient.useSession()`, `fetch` + optimistic `setState` updates, no server actions for these writes.
- shadcn/ui + base-ui components (`Sheet`, `Input`, `Button`, `Card`); no `@radix-ui` imports allowed.
- Catalog search uses a 150ms debounce (Phase 24 PERF-01) — reuse the same feel.
- Two-table card model (`card_definitions` + `card_printings`); ownership and trade offerings are per-printing.

### Integration Points
- `src/app/binder/manage/page.tsx` — the search UI, results grid, and extended sheet all mount here; the two removed cards were previously in the left 2/3 and right 1/3 columns respectively.
- The extended sheet writes via the existing `/api/binder/wants` (POST) and `/api/trade` (PATCH) endpoints — no new write endpoints required.

</code_context>

<specifics>
## Specific Ideas

- "No eager load" is taken to mean nothing is fetched or rendered on page mount; the catalog+owned fetch fires on the first keystroke. The user accepted shipping the whole catalog to the browser at that point (client-side filter) rather than a server search endpoint.
- The sheet is the single place where ownership gating is enforced: unowned variants show "Add to trade binder" disabled with a reason, while "Add as want" stays live — directly mirroring success criterion #5.

</specifics>

<deferred>
## Deferred Ideas

- **Trade Profile modal + public trade note** — moving username/binder URL behind a profile button modal and adding a settable public trade note shown on the public binder → **Phase 31** (BINDER-15/16/17). The Trade Profile card stays inline this phase.
- **Combined wants & exclusions list** — auto-wants + manual wants in one sectioned list, exclude/restore, manual-want qty/remove controls → **Phase 32** (BINDER-18/19/20). `ManageWantsList` is untouched this phase.
- **Server-side search endpoint** — a `/api/binder/search` route was considered for a truer "no eager load" but deferred in favor of the simpler lazy full-catalog client load (D-01). Could revisit if catalog size makes the client fetch heavy.

</deferred>

---

*Phase: 30-Unified Search-Driven Add Flow*
*Context gathered: 2026-07-06*

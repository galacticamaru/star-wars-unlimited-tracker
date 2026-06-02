# Phase 26: Mobile Deck Builder UX - Context

**Gathered:** 2026-05-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 26 makes the deck builder fully usable on mobile (touch screens, narrow viewports < 480px) without breaking the existing desktop layout. It delivers:

1. A sticky summary bar (mobile-only) showing validity badge + card counts, which opens the full `DeckSidebar` in a bottom Sheet
2. A two-row mobile toolbar that adapts below the `md` breakpoint without clipping
3. Upgraded touch target sizes (44px min) on all deck builder +/- and action buttons
4. Desktop layout preserved at `md` breakpoint and above — zero regression

No new deck builder features, no database changes, no API routes.

</domain>

<decisions>
## Implementation Decisions

### Mobile Stats Trigger (MOBILE-01)

- **D-01:** A **sticky summary bar** (`md:hidden`, `fixed bottom-0`) is always visible on mobile. Content: Legal/Illegal badge + `"32/50 main · 2/10 SB"` counts. Tapping it opens the full Sheet.
- **D-02:** Sheet opens `side="bottom"` with `max-h-[80dvh]` and `overflow-y-auto`. Leaves a sliver of the builder visible behind it for context.
- **D-03:** The sticky summary bar **replaces** the existing `hoveredCard` bottom bar (`md:hidden fixed bottom-0` in the deck list editor). The hoveredCard preview feature is removed from mobile — it was a bonus feature that conflicts with the persistent stats bar.
- **D-04:** `DeckSidebar` renders inside `SheetContent` (side=bottom) **portaled to `document.body`** — must NOT be a child of the `overflow-hidden` flex container to avoid clipping. This matches the architectural note in STATE.md.

### Desktop Sidebar (MOBILE-04)

- **D-05:** The inline `DeckSidebar` gets `hidden md:flex` — hidden on mobile, visible on desktop. No other desktop changes.

### Mobile Toolbar Layout (MOBILE-03)

- **D-06:** On mobile (`< md`), toolbar **wraps to two rows**:
  - Row 1: deck name input (full width)
  - Row 2: shortened tab group + icon-only Back + icon-only Export
- **D-07:** Tab labels shortened on mobile: `"Deck"` / `"Cards"` / `"Wants"` (below `md`). Desktop keeps `"Deck List"` / `"Add Cards"` / `"Want List"`.
- **D-08:** Export button on mobile shows Download icon only (no "Export" text label) to save horizontal space.

### Touch Targets (MOBILE-02)

- **D-09:** All interactive +/- buttons in the deck builder are upgraded to **minimum 44px** (`h-11` / `w-11`). Applies at **all screen sizes** (not responsive — permanent upgrade). This covers:
  - Deck list editor: `+` / `-` quantity buttons on each card row
  - Deck list editor: `"Move to SB"` / `"Move to Main"` buttons
  - Card catalog overlay (Add Cards tab): `+` / `-` buttons on the deck count control
- **D-10:** The `h-8 w-8` `size="icon"` buttons in the deck list rows become `h-11 w-11`. The `p-1` catalog overlay buttons get `min-h-[44px] min-w-[44px]` or equivalent.

### Save Buttons (MOBILE-01)

- **D-11:** "Save as Draft" and "Complete Deck" buttons remain **inside the Sheet only** on mobile. Not duplicated in toolbar or sticky bar. User opens the Sheet to save.

### Height Fix (Architectural — from STATE.md)

- **D-12:** Root deck builder container uses `h-[calc(100dvh-56px)] md:h-[calc(100svh-56px)]`. `dvh` is keyboard-safe on mobile (shrinks when virtual keyboard appears); `svh` stays stable on desktop.

### Claude's Discretion

- Exact Tailwind class names for the two-row toolbar responsive layout (e.g., whether to use `flex-col md:flex-row` on the toolbar wrapper or nested `flex` rows)
- Whether to use `ScrollArea` or raw `overflow-y-auto` inside `SheetContent` for the sidebar content
- Whether the sticky bar uses a `button` element or a `SheetTrigger` render prop
- Exact animation/transition on the Sheet (the existing `SheetContent` animation classes are fine as-is)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

**IMPORTANT: Per AGENTS.md, read `node_modules/next/dist/docs/` before writing any Next.js code — APIs and conventions may differ from training data.**

### Core Files (modification targets)

- `src/components/decks/deck-builder.tsx` — Main deck builder component. Contains toolbar, tab views, hoveredCard bar, and the `<DeckSidebar>` render. Primary file for this phase.
- `src/components/decks/deck-sidebar.tsx` — Sidebar component rendered inside Sheet on mobile and inline on desktop. Read before modifying.
- `src/components/catalog/card-item.tsx` — Card tile component with deck overlay +/- buttons (`p-1` target size). Touch target upgrade applies here.
- `src/components/ui/sheet.tsx` — Sheet primitive (base-ui Dialog). `side="bottom"` uses `h-auto` — will need `max-h-[80dvh]` override via `className` prop on `SheetContent`.

### Requirements

- `.planning/REQUIREMENTS.md` — MOBILE-01 through MOBILE-04: full requirement text with acceptance criteria.
- `.planning/PROJECT.md` — Constraints section: no `@radix-ui` imports (use `@base-ui/react` only); `md` breakpoint = desktop threshold.

### State / Architecture Notes

- `.planning/STATE.md` §"Key Architectural Notes for v6" — Pre-decided architectural notes: `hidden md:flex` pattern, Sheet portal requirement, height formula, cache tagging for Phase 27.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/components/ui/sheet.tsx` — Full Sheet system already built (Sheet, SheetTrigger, SheetContent, SheetPortal, SheetOverlay, SheetHeader, SheetFooter). `SheetContent side="bottom"` is available — just needs `max-h-[80dvh]` className override.
- `src/components/decks/deck-sidebar.tsx` — `DeckSidebar` is already a self-contained component. It can be dropped directly inside `SheetContent` without changes to its internal logic.
- `src/components/ui/badge.tsx` — Existing `<Badge>` with `bg-green-100 text-green-800` (Legal) and `variant="destructive"` (Illegal) — reuse directly in the sticky summary bar.
- `src/components/ui/button.tsx` — `buttonVariants` exported; `size="icon"` produces `h-8 w-8` (needs upgrade to `h-11 w-11` or `size="icon-lg"` if that variant exists).

### Established Patterns

- **`md:hidden` / `hidden md:flex`** — Used throughout the app for mobile/desktop splits. This phase follows the same pattern on the sidebar and toolbar.
- **`fixed bottom-0`** — `hoveredCard` bar already uses this pattern in deck-builder.tsx (line 607). Sticky bar reuses same positioning, replacing it.
- **Portal to `document.body`** — `SheetPortal` already renders to `document.body` via `SheetPrimitive.Portal`. No custom portal logic needed.
- **No `@radix-ui` imports** — Project constraint (PROJECT.md). Sheet uses `@base-ui/react/dialog`. Confirmed already in use.

### Integration Points

- `deck-builder.tsx` return JSX: add `<Sheet>` wrapper, move `<DeckSidebar>` inside `<SheetContent side="bottom">`, add sticky bar as `<div className="md:hidden fixed bottom-0 ...">`, wrap in `<SheetTrigger>`.
- `card-item.tsx` lines 143–165 (deck overlay +/- buttons): upgrade `p-1` containers to `min-h-[44px] min-w-[44px] flex items-center justify-center`.
- `deck-builder.tsx` lines 530–531 (deck list +/- buttons): change `h-8 w-8` to `h-11 w-11`.
- `deck-builder.tsx` lines 607–621 (hoveredCard bar): **remove** — replaced by sticky stats bar.
- Toolbar div (line 310): add responsive classes for two-row layout.

</code_context>

<specifics>
## Specific Ideas

- Sticky bar text format: `"32/50 main · 2/10 SB"` — dot separator, concise
- Sheet `className` override on `SheetContent`: `"max-h-[80dvh] overflow-y-auto"`
- For `DeckSidebar` inside Sheet, the `h-full` on the sidebar's root div becomes `h-auto` (or removed) since it's no longer in a `flex h-full` context
- `dvh` unit in the height formula ensures the builder shrinks correctly when the virtual keyboard appears on mobile

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 26-mobile-deck-builder-ux*
*Context gathered: 2026-05-29*

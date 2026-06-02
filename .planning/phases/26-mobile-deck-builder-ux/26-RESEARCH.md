# Phase 26: Mobile Deck Builder UX - Research

**Researched:** 2026-05-29
**Domain:** Responsive layout / CSS / React component surgery (Tailwind v4, @base-ui/react Sheet, touch targets)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** A sticky summary bar (`md:hidden`, `fixed bottom-0`) is always visible on mobile. Content: Legal/Illegal badge + `"32/50 main · 2/10 SB"` counts. Tapping it opens the full Sheet.
- **D-02:** Sheet opens `side="bottom"` with `max-h-[80dvh]` and `overflow-y-auto`. Leaves a sliver of the builder visible behind it for context.
- **D-03:** The sticky summary bar **replaces** the existing `hoveredCard` bottom bar (`md:hidden fixed bottom-0`). hoveredCard preview removed from mobile.
- **D-04:** `DeckSidebar` renders inside `SheetContent` portaled to `document.body` — must NOT be a child of the `overflow-hidden` flex container to avoid clipping.
- **D-05:** Inline `DeckSidebar` gets `hidden md:flex` — hidden on mobile, visible on desktop. No other desktop changes.
- **D-06:** On mobile (`< md`), toolbar wraps to two rows — Row 1: deck name input (full width), Row 2: shortened tab group + icon-only Back + icon-only Export.
- **D-07:** Tab labels shortened on mobile: `"Deck"` / `"Cards"` / `"Wants"` (below `md`). Desktop keeps `"Deck List"` / `"Add Cards"` / `"Want List"`.
- **D-08:** Export button on mobile shows Download icon only (no "Export" text label).
- **D-09:** All interactive +/- buttons in the deck builder upgraded to minimum 44px (`h-11` / `w-11`). Applies at all screen sizes (permanent upgrade). Covers: deck list +/- buttons, "Move to SB"/"Move to Main" buttons, card catalog overlay +/- buttons.
- **D-10:** `h-8 w-8` `size="icon"` buttons in deck list rows become `h-11 w-11`. The `p-1` catalog overlay buttons get `min-h-[44px] min-w-[44px]` or equivalent.
- **D-11:** "Save as Draft" and "Complete Deck" buttons remain inside the Sheet only on mobile. Not duplicated in toolbar or sticky bar.
- **D-12:** Root deck builder container uses `h-[calc(100dvh-56px)] md:h-[calc(100svh-56px)]`.

### Claude's Discretion

- Exact Tailwind class names for the two-row toolbar responsive layout (e.g., `flex-col md:flex-row` on the toolbar wrapper or nested `flex` rows)
- Whether to use `ScrollArea` or raw `overflow-y-auto` inside `SheetContent` for the sidebar content
- Whether the sticky bar uses a `button` element or a `SheetTrigger` render prop
- Exact animation/transition on the Sheet (existing `SheetContent` animation classes are fine as-is)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MOBILE-01 | User can access deck stats (card count, aspect breakdown, validity) on mobile via a bottom sheet that peeks with a summary and expands to show full sidebar content | D-01 through D-04, D-11: sticky bar + Sheet + DeckSidebar inside SheetContent |
| MOBILE-02 | Add/remove card buttons in the deck builder are tappable on touch screens (minimum 44px target size) | D-09, D-10: `h-11 w-11` on deck list buttons; `min-h-[44px] min-w-[44px]` on catalog overlay buttons |
| MOBILE-03 | Deck builder toolbar and tabs display without overflow or clipping on screens below 480px wide | D-06, D-07, D-08: two-row toolbar, shortened tab labels, icon-only Export |
| MOBILE-04 | Existing desktop deck builder layout is fully preserved — no regression on md breakpoint and above | D-05: `hidden md:flex` on inline sidebar; all responsive classes preserve desktop |
</phase_requirements>

---

## Summary

Phase 26 is a pure UI/responsive-layout change — no new packages, no database changes, no API routes. It surgically modifies three existing files: `deck-builder.tsx` (primary), `card-item.tsx` (touch targets), and `deck-sidebar.tsx` (minor context change for Sheet usage). No new dependencies are needed; the full Sheet system (`@base-ui/react/dialog`) is already implemented in `src/components/ui/sheet.tsx` and used in production on the catalog's `MobileFilterSheet`.

The implementation pattern is already proven in this codebase. `MobileFilterSheet` (`src/components/catalog/mobile-filter-sheet.tsx`) demonstrates the exact pattern: `<Sheet>` wrapper, `<SheetTrigger render={<Button .../>}>`, `<SheetContent side="right">` with children. Phase 26 reuses this pattern with `side="bottom"` and `max-h-[80dvh]` instead.

The key risk areas are: (1) the `overflow-hidden` clipping trap — `SheetPortal` already portals to `document.body`, so `DeckSidebar` inside `SheetContent` is safe as long as `<Sheet>` is NOT rendered inside the `overflow-hidden` flex container (it should be a sibling or ancestor); (2) the height-unit switch from `100svh` (current) to `h-[calc(100dvh-56px)] md:h-[calc(100svh-56px)]` — `dvh` shrinks when the virtual keyboard appears on mobile, preventing layout breakage; and (3) the `DeckSidebar` root div uses `h-full` which assumes a `flex h-full` parent — inside `SheetContent` (height auto) this should change to `h-auto` or be removed.

**Primary recommendation:** Work top-down through `deck-builder.tsx`: (1) height fix, (2) inline sidebar visibility, (3) Sheet + sticky bar, (4) toolbar two-row layout, (5) touch target upgrades in deck list rows, (6) remove hoveredCard bar. Then upgrade `card-item.tsx` catalog overlay buttons. DeckSidebar needs only the `h-full` root class adjusted for Sheet context.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Sticky summary bar (mobile stats peek) | Browser / Client | — | Client component, viewport-relative positioning, reactive to deck state |
| Bottom Sheet (stats panel) | Browser / Client | — | `@base-ui/react/dialog` portals to `document.body`; pure client-side modal |
| Desktop inline sidebar | Browser / Client | — | Tailwind responsive visibility via `hidden md:flex` |
| Touch target upgrade (+/- buttons) | Browser / Client | — | CSS size class change; no server involvement |
| Toolbar responsive wrapping | Browser / Client | — | Tailwind flex-wrap responsive classes |
| Deck validation data (for summary bar) | Browser / Client | — | Already computed client-side in `DeckSidebar`; summary bar reads same state |

---

## Standard Stack

### Core (all already installed — no new packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 4.2.4 [VERIFIED: npm view confirmed] | Responsive utility classes (`md:hidden`, `flex-col md:flex-row`, `h-11 w-11`) | Project standard; all existing responsive layout uses it |
| @base-ui/react | ^1.4.1 [VERIFIED: package.json] | `Dialog` primitive backing `Sheet` system (`SheetContent side="bottom"`) | Project constraint — no @radix-ui; base-ui is the only permitted headless primitive |
| lucide-react | ^1.14.0 [VERIFIED: package.json] | Icons for icon-only Export button (`Download`) and Back button (`ArrowLeft` or `ChevronLeft`) | Already in use throughout |
| React | 19.2.4 [VERIFIED: package.json] | Component layer | Project standard |

### No New Packages Required

This phase is entirely achievable with existing dependencies. The `Sheet` system is already implemented and in production use. No `npm install` step.

---

## Package Legitimacy Audit

> Not applicable — Phase 26 installs no new external packages. All dependencies used are already present in `package.json`.

---

## Architecture Patterns

### System Architecture Diagram

```
Mobile viewport (< md / 768px)                Desktop viewport (>= md / 768px)

┌─────────────────────────────────┐           ┌──────────────────────────┬──────────┐
│  Toolbar (flex-col)             │           │  Toolbar (flex-row)      │          │
│  ┌─────────────────────────┐    │           │  [Name] [Tabs] [Export]  │          │
│  │ Deck name input (full w)│    │           │  [Back]                  │          │
│  └─────────────────────────┘    │           ├──────────────────────────│ DeckSide │
│  ┌──────────────┬──────┬──────┐ │           │                          │ bar      │
│  │ Deck│Cards│  │ [↓] │[Back]│ │           │  Builder content         │ (visible)│
│  │ Wants tabs   │(icon)│(icon)│ │           │  flex-1 overflow-y-auto  │          │
│  └──────────────┴──────┴──────┘ │           │                          │          │
├─────────────────────────────────┤           └──────────────────────────┴──────────┘
│  Builder content                │
│  (flex-1 overflow-y-auto)       │
│  — no DeckSidebar overlay       │
├─────────────────────────────────┤
│  Sticky summary bar (fixed bot) │  ←── SheetTrigger / button
│  [Legal] 32/50 main · 2/10 SB  │
└─────────────────────────────────┘
          ↓ tap
┌─────────────────────────────────┐
│  Sheet (bottom, max-h 80dvh)    │  ← portaled to document.body
│  ┌───────────────────────────┐  │
│  │ DeckSidebar (h-auto)      │  │
│  │ - validity badge          │  │
│  │ - counts                  │  │
│  │ - cost curve              │  │
│  │ - aspect breakdown        │  │
│  │ - Save as Draft           │  │
│  │ - Complete Deck           │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### Recommended File Changes

```
src/components/decks/
├── deck-builder.tsx     PRIMARY — height fix, sidebar visibility, Sheet + sticky bar,
│                        toolbar two-row layout, deck list touch targets,
│                        remove hoveredCard bar
├── deck-sidebar.tsx     MINOR — change h-full root class to h-auto (Sheet context)
src/components/catalog/
└── card-item.tsx        TOUCH — catalog overlay +/- buttons: p-1 → min-h-[44px] min-w-[44px]
```

### Pattern 1: Sheet with bottom slide-up (existing pattern reuse)

**What:** Wraps a component in `<Sheet>` with a `<SheetTrigger>` and `<SheetContent side="bottom">`. Portal renders outside `overflow-hidden` containers automatically.
**When to use:** Any mobile-only panel that should slide up from the bottom without blocking full content.

```tsx
// Source: src/components/catalog/mobile-filter-sheet.tsx (existing production usage)
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';

<Sheet>
  <SheetTrigger render={<Button variant="outline" />}>
    Open Stats
  </SheetTrigger>
  <SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto">
    <DeckSidebar ... />
  </SheetContent>
</Sheet>
```

**Note:** `SheetContent` already wraps in `<SheetPortal>` internally (see `sheet.tsx` lines 50-79). The portal to `document.body` is automatic — no manual portal wrapping required.

### Pattern 2: Two-row responsive toolbar

**What:** Toolbar uses `flex flex-col md:flex-row` on wrapper, with inner rows for mobile grouping.
**When to use:** Header bars that have too many items for a single row on narrow screens.

```tsx
// Source: [ASSUMED] — Tailwind v4 flex responsive pattern
<div className="border-b bg-white p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-2 shadow-sm z-10">
  {/* Row 1 (mobile) / left group (desktop) */}
  <div className="flex items-center gap-2 flex-1">
    <input className="... w-full max-w-md" /> {/* Name always full-row on mobile */}
    {/* Tab group hidden on mobile in row 1 — rendered in row 2 */}
    <div className="hidden md:flex bg-slate-100 rounded-lg p-1">
      {/* full-label tabs: Deck List / Add Cards / Want List */}
    </div>
  </div>
  {/* Row 2: mobile-only tab row + icon-only actions */}
  <div className="flex md:hidden items-center justify-between gap-2">
    <div className="flex bg-slate-100 rounded-lg p-1">
      {/* short-label tabs: Deck / Cards / Wants */}
    </div>
    <div className="flex items-center gap-1">
      {/* Export icon-only + Back icon-only */}
    </div>
  </div>
  {/* Desktop-only action group */}
  <div className="hidden md:flex items-center gap-2">
    {/* Export with text + Back with text */}
  </div>
</div>
```

### Pattern 3: Touch target upgrade — deck list buttons

**What:** Override `size="icon"` (8×8 = 32px) with explicit `h-11 w-11` class. `h-11` = 2.75rem = 44px in Tailwind.
**When to use:** Any interactive button that must meet 44px minimum touch target (WCAG 2.5.5 / Apple HIG).

```tsx
// Before (line 530 deck-builder.tsx):
<Button variant="outline" size="icon" className="h-8 w-8" onClick={...}>-</Button>

// After (D-10):
<Button variant="outline" size="icon" className="h-11 w-11" onClick={...}>-</Button>
```

Note: The `size="icon"` in `buttonVariants` produces `size-8` (32px). Overriding with `className="h-11 w-11"` uses Tailwind v4's merge behaviour — explicit `h-11 w-11` overrides the `size-8` from CVA because they are separate dimension classes.

### Pattern 4: Touch target upgrade — catalog overlay buttons

**What:** The `p-1` buttons in `card-item.tsx` need a minimum 44px tap area without enlarging visible elements.
**When to use:** Small icon buttons inside tight overlay layouts.

```tsx
// Before (card-item.tsx ~line 138):
<button className="p-1 hover:bg-muted rounded-full transition-colors" ...>
  <Minus className="w-4 h-4" />
</button>

// After (D-10):
<button className="min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-muted rounded-full transition-colors" ...>
  <Minus className="w-4 h-4" />
</button>
```

### Pattern 5: Sticky summary bar replacing hoveredCard bar

**What:** Replace the `hoveredCard && (...)` conditional block (deck-builder.tsx lines 606-621) with an always-visible sticky bar that is the SheetTrigger.
**When to use:** Mobile persistent footer that doubles as a sheet trigger.

```tsx
// Source: D-01, D-03 — decision to replace hoveredCard bar

// REMOVE: lines 606–621 (hoveredCard conditional bar)

// ADD: just before closing </div> of the main content area, outside overflow-hidden
// This should be SIBLING to the main flex container or direct child of the outermost div
<Sheet>
  <SheetTrigger
    render={<button className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t z-50 flex items-center gap-4 px-4 w-full" />}
  >
    <Badge ...>{validation.isValid ? 'Legal' : 'Illegal'}</Badge>
    <span className="text-sm text-slate-600">{totalMain}/50 main · {sideboardTotal}/10 SB</span>
  </SheetTrigger>
  <SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto">
    <DeckSidebar ... />
  </SheetContent>
</Sheet>
```

### Pattern 6: DeckSidebar in Sheet context (h-auto fix)

**What:** The current `DeckSidebar` root div is `flex flex-col h-full bg-slate-50 border-l p-4 overflow-y-auto w-80`. In Sheet context: `h-full` requires a `flex h-full` parent — `SheetContent` is `h-auto`. Change to `h-auto` or remove height entirely.
**When to use:** Whenever rendering DeckSidebar outside its normal inline flex context.

The `border-l` and `w-80` also become irrelevant inside a bottom Sheet (full-width). These should be overridden or removed for the Sheet variant. Two approaches:
- Option A (simpler): Pass a `className` prop to `DeckSidebar` to override root classes for Sheet context
- Option B (no prop change): Wrap in a div that provides the full-width context — DeckSidebar's internal classes become mostly harmless (w-80 constrained to sheet width)

Recommendation: Option B — wrap in a `<div className="w-full">` inside SheetContent, which naturally constrains DeckSidebar's `w-80` to the sheet width. The `h-full` issue is resolved by wrapping in `<div className="h-auto">` or just letting the SheetContent's `overflow-y-auto` handle it.

### Anti-Patterns to Avoid

- **Sheet inside overflow-hidden container:** If `<Sheet>` is rendered inside the `overflow-hidden` flex container in deck-builder.tsx, the SheetContent (even portaled) can receive unexpected stacking context issues. The Sheet wrapper element itself should be outside or at the outermost level, not nested inside the `flex-1 overflow-y-auto` content div.
- **Duplicating DeckSidebar:** Do NOT create a separate mobile sidebar component. `DeckSidebar` already receives all required props and computes validation internally — drop it directly into `SheetContent`.
- **Using `100vh` for mobile height:** `100vh` does not account for the virtual keyboard on mobile and causes layout clipping. The decision is `100dvh` for mobile (D-12).
- **Using `@radix-ui` imports:** Project constraint — only `@base-ui/react` is permitted for headless primitives (enforced in PROJECT.md and AGENTS.md).
- **Adding `size="icon-lg"` to fix touch targets:** The button CVA has `"icon-lg": "size-9"` (36px) — still below 44px. Always use explicit `h-11 w-11` override instead.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bottom sheet / modal | Custom CSS slide-up overlay | `Sheet` + `SheetContent side="bottom"` from `src/components/ui/sheet.tsx` | Already built, portals correctly, has animation, overlay, close button |
| Portal to document.body | `ReactDOM.createPortal()` | `SheetPortal` (wrapped inside `SheetContent`) | SheetContent already wraps in SheetPortal; double-portaling would break |
| Responsive visibility toggling | JS window.innerWidth listeners | Tailwind `md:hidden` / `hidden md:flex` | Declarative, SSR-safe, already the project pattern |
| Touch target enforcement | Invisible tap-area divs | `min-h-[44px] min-w-[44px] flex items-center justify-center` on existing buttons | Pure CSS; no new wrapper elements needed |

**Key insight:** The Sheet system in this project is already production-tested (catalog mobile filter). Using it here is pattern reuse, not new infrastructure.

---

## Common Pitfalls

### Pitfall 1: Sheet rendered inside overflow-hidden — clipping

**What goes wrong:** `SheetContent` (portaled to document.body) renders visually behind the `overflow-hidden` parent, or the sticky bar at `fixed bottom-0` is clipped.
**Why it happens:** Fixed positioning is relative to the nearest element with `transform`, `filter`, or `will-change` — not always the viewport. `overflow-hidden` itself does not clip fixed elements, but `transform` on an ancestor does.
**How to avoid:** Render `<Sheet>` wrapper as a sibling to the main flex container, or at the outermost div level of DeckBuilder's return. NOT inside `<div className="flex-1 overflow-y-auto bg-slate-50">`.
**Warning signs:** The sticky bar disappears on scroll, or the Sheet slides up behind content.

### Pitfall 2: DeckSidebar h-full breaks in Sheet context

**What goes wrong:** `DeckSidebar` root has `h-full` — inside `SheetContent` which is `h-auto`, this collapses to 0 height or forces the sheet taller than `max-h-[80dvh]`.
**Why it happens:** `h-full` means 100% of parent. If parent is `h-auto`, the computed height is undefined/0.
**How to avoid:** Override or remove `h-full` on DeckSidebar when rendering inside Sheet. The `overflow-y-auto` on `SheetContent` handles scrolling — no height declaration needed on DeckSidebar itself.
**Warning signs:** Sheet opens but appears empty, or sheet height is incorrect.

### Pitfall 3: dvh vs svh confusion

**What goes wrong:** Using `svh` (small viewport height) on mobile causes layout to not resize when the virtual keyboard appears, cutting off Save buttons.
**Why it happens:** `svh` = smallest viewport size (keyboard up). `dvh` = dynamic (changes with keyboard). On mobile, `svh` never changes — the content height doesn't adapt.
**How to avoid:** D-12 prescribes `h-[calc(100dvh-56px)] md:h-[calc(100svh-56px)]`. The current code uses `100svh` everywhere — must update the root container.
**Warning signs:** On mobile with virtual keyboard open, Save buttons are unreachable.

### Pitfall 4: Tailwind v4 class conflict with CVA override

**What goes wrong:** Passing `className="h-11 w-11"` to a Button with `size="icon"` might not override if Tailwind's CSS order puts the CVA class after.
**Why it happens:** Tailwind v4 with `cn()` / `tailwind-merge` resolves conflicts based on class specificity rules. The project uses `cn(buttonVariants({ variant, size, className }))` which calls `tailwind-merge` internally — this should correctly resolve `h-11` over `size-8`.
**How to avoid:** Using `className="h-11 w-11"` passed to `<Button>` is the correct pattern. The `cn()` function in this project includes `tailwind-merge`, which handles dimension class conflicts. Verify by inspection that `h-11 w-11` appear in the final rendered class list.
**Warning signs:** Buttons render at 32px despite the override.

### Pitfall 5: hoveredCard state retained after removing the bar

**What goes wrong:** `hoveredCard` state is used only for the mobile bar (removed by D-03). The `onMouseEnter`/`onFocus`/`onTouchStart` handlers on card rows still call `setHoveredCard` — this is now dead code.
**Why it happens:** The state and handlers remain in `deck-builder.tsx` after removing the bar.
**How to avoid:** When removing the `hoveredCard` bar (lines 606-621), also remove or comment out: `const [hoveredCard, setHoveredCard] = useState<Card | null>(null);` and all `onMouseEnter`, `onMouseLeave`, `onFocus`, `onBlur`, `onTouchStart` handlers on card rows that reference `setHoveredCard`. Note: the desktop `hoveredCard` preview panel (lines 385-397) uses `hoveredCard` too — if the desktop feature should be preserved, keep the state but remove only the mobile bar. Confirm intent: CONTEXT.md D-03 says "hoveredCard preview feature is removed from mobile" — the desktop preview panel at lines 385-397 is `hidden md:block`, so it remains. Keep the `hoveredCard` state and handlers — only remove the mobile `fixed bottom-0` conditional bar.
**Warning signs:** TypeScript unused-variable error on `hoveredCard`, or desktop preview panel stops working.

### Pitfall 6: Sheet structure — SheetTrigger render prop pattern

**What goes wrong:** `SheetTrigger` used without `render` prop does not forward the ref correctly in @base-ui/react, causing the trigger not to open the sheet.
**Why it happens:** @base-ui/react components use the `render` prop pattern instead of `asChild` (Radix pattern). See `MobileFilterSheet` for the correct pattern.
**How to avoid:** Use `<SheetTrigger render={<button className="..." />}>content</SheetTrigger>` — not `<SheetTrigger><button>...</button></SheetTrigger>`.
**Warning signs:** Tapping the sticky bar does nothing.

---

## Code Examples

### Verified pattern: SheetTrigger with render prop (from MobileFilterSheet)

```tsx
// Source: src/components/catalog/mobile-filter-sheet.tsx (production code, verified)
<SheetTrigger
  render={<Button variant="outline" className="flex items-center gap-2" />}
>
  <SlidersHorizontal className="w-4 h-4" />
  Refine Results
</SheetTrigger>
```

### Verified pattern: SheetContent side="bottom" override

```tsx
// Source: src/components/ui/sheet.tsx (SheetContent, line 56 — verified)
// data-[side=bottom]:h-auto is the default; override with max-h-[80dvh]
<SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto">
  {/* DeckSidebar content */}
</SheetContent>
```

### Verified pattern: responsive tab short-labeling

```tsx
// Source: [ASSUMED] — Tailwind responsive span
<Button ...>
  <span className="hidden md:inline">Deck List</span>
  <span className="md:hidden">Deck</span>
</Button>
```

### Verified pattern: icon-only button with text hidden

```tsx
// Source: [ASSUMED] — based on existing Download icon usage in deck-builder.tsx
// Mobile: icon only. Desktop: icon + "Export" text.
<DropdownMenuTrigger className={buttonVariants({ variant: "outline", size: "sm" })}>
  <Download className="w-4 h-4" />
  <span className="hidden md:inline ml-2">Export</span>
</DropdownMenuTrigger>
```

### Verified: button size variants available

```tsx
// Source: src/components/ui/button.tsx (verified — all CVA sizes listed)
// Available sizes: default (h-8), xs (h-6), sm (h-7), lg (h-9),
//   icon (size-8 = 32px), icon-xs (size-6), icon-sm (size-7), icon-lg (size-9 = 36px)
// None reach 44px — must override with className="h-11 w-11"
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `100vh` for full-screen layouts | `100svh` / `100dvh` | Safari iOS 15+ (2021) | `dvh` adjusts for virtual keyboard; `svh` does not |
| `@radix-ui/react-dialog` for Sheet | `@base-ui/react/dialog` | v3 milestone | Project constraint; all dialog/sheet primitives must use base-ui |
| hover-only card preview on desktop | `hoveredCard` state + `onMouseEnter` / `onFocus` | Phase 15 | The desktop preview panel exists at lines 385-397; mobile bar at 606-621 is being removed |

**Deprecated/outdated:**
- `hoveredCard` mobile bar (lines 606-621): replaced by sticky stats bar in this phase
- `h-[calc(100svh-56px)]` on deck builder root: replaced with dvh/svh responsive formula per D-12

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `<span className="hidden md:inline">` pattern for tab label toggle works as expected in Tailwind v4 | Code Examples | Minimal — standard Tailwind responsive display utility, unlikely to have changed |
| A2 | `<span className="hidden md:inline ml-2">Export</span>` approach for icon-only mobile export button | Code Examples | Minimal — same pattern as A1 |
| A3 | Two-row toolbar using `flex flex-col md:flex-row` with nested row divs is the correct structure | Architecture Patterns (Pattern 2) | Low — Claude's discretion area; planner can adjust exact structure |
| A4 | `min-h-[44px] min-w-[44px]` on catalog overlay buttons is sufficient (vs explicit h-11/w-11) | Pattern 4 | Low — `min-h` allows content to push height beyond 44px, which is acceptable per WCAG 2.5.5 |

**If this table is empty:** Not empty — 4 assumed claims logged, all low risk.

---

## Open Questions

1. **Should the desktop `hoveredCard` preview panel (lines 385-397) be preserved?**
   - What we know: D-03 says to remove the *mobile* hoveredCard bar. The desktop panel (`hidden md:block`) is separate.
   - What's unclear: CONTEXT.md says "hoveredCard preview feature is removed from mobile" — the desktop panel is implicitly preserved by D-03's wording.
   - Recommendation: Keep the desktop panel (lines 385-397) and its state/handlers. Remove only lines 606-621 (the mobile `fixed bottom-0` bar).

2. **Does `DeckSidebar` need a `className` prop for Sheet context, or is wrapping sufficient?**
   - What we know: DeckSidebar root is `flex flex-col h-full bg-slate-50 border-l p-4 overflow-y-auto w-80`. Inside Sheet, `h-full` and `w-80` are undesirable.
   - What's unclear: Whether wrapping in a full-width div is clean enough vs. adding a `className` prop to DeckSidebar.
   - Recommendation (Claude's discretion): Wrapping in `<div className="w-full">` inside SheetContent is the simplest approach without modifying DeckSidebar's interface. The `h-full` resolves naturally since the Sheet's `overflow-y-auto` handles scrolling.

---

## Environment Availability

> This phase is CSS/component-only — no external services, CLIs, or runtimes beyond the existing dev server.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | dev server / vitest | ✓ | v24.16.0 [VERIFIED: bash] | — |
| Tailwind CSS | responsive classes | ✓ | 4.2.4 [VERIFIED: package.json] | — |
| @base-ui/react | Sheet primitive | ✓ | ^1.4.1 [VERIFIED: package.json] | — |
| vitest | test runner | ✓ | ^4.1.5 [VERIFIED: package.json] | — |

**Missing dependencies with no fallback:** None.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 + @testing-library/react 16.3.2 |
| Config file | `vitest.config.mts` (root) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MOBILE-02 | +/- buttons in deck list rows render at >= 44px (h-11 = 44px) | unit (DOM class check) | `npx vitest run src/components/decks/deck-builder.test.tsx` | ❌ Wave 0 |
| MOBILE-02 | catalog overlay +/- buttons have min-h-[44px] class | unit (DOM class check) | `npx vitest run src/components/catalog/card-item.deck.test.tsx` | ✅ (partial) |
| MOBILE-03 | Toolbar renders two-row structure on mobile (class presence) | unit (DOM class check) | `npx vitest run src/components/decks/deck-builder.test.tsx` | ❌ Wave 0 |
| MOBILE-01 | Sticky summary bar present in DOM, Sheet not rendered initially | unit | `npx vitest run src/components/decks/deck-builder.test.tsx` | ❌ Wave 0 |
| MOBILE-04 | Desktop layout: `hidden md:flex` on inline DeckSidebar | unit (class presence) | `npx vitest run src/components/decks/deck-builder.test.tsx` | ❌ Wave 0 |

**Manual-only tests (no automation possible):**
- Visual regression: desktop layout unchanged (requires browser at >= 768px)
- Bottom sheet opens and scrolls correctly (requires browser touch simulation)
- Virtual keyboard does not break layout (requires real mobile device or DevTools)
- Touch target accuracy (requires real touch device)

### Sampling Rate
- **Per task commit:** `npx vitest run src/components/decks/ src/components/catalog/card-item.deck.test.tsx`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/components/decks/deck-builder.test.tsx` — covers MOBILE-01 (sticky bar present), MOBILE-02 (button class sizes), MOBILE-03 (toolbar structure), MOBILE-04 (sidebar visibility classes)
- [ ] Extend `src/components/catalog/card-item.deck.test.tsx` — add test asserting `min-h-[44px]` or `min-w-[44px]` on overlay buttons (MOBILE-02)

---

## Security Domain

> Phase 26 is a pure frontend layout change. No authentication, authorization, input validation, cryptography, or session management is involved.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | — |
| V3 Session Management | No | — |
| V4 Access Control | No | — |
| V5 Input Validation | No | — |
| V6 Cryptography | No | — |

### Known Threat Patterns for Responsive CSS Changes

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| z-index escalation (Sheet overlay blocking action buttons) | — | `z-50` on Sheet is standard; verify no existing z-50+ elements conflict |

---

## Sources

### Primary (HIGH confidence)

- `src/components/ui/sheet.tsx` — Full Sheet implementation verified; `side="bottom"` path confirmed, `SheetPortal` auto-portals
- `src/components/catalog/mobile-filter-sheet.tsx` — Production usage of Sheet with `render` prop pattern confirmed
- `src/components/ui/button.tsx` — All CVA size variants verified; `size-8` (32px) for `icon`, none reach 44px
- `src/components/decks/deck-builder.tsx` — Exact line numbers confirmed for all modification targets
- `src/components/decks/deck-sidebar.tsx` — Root div class `h-full` confirmed; will need override in Sheet context
- `src/components/catalog/card-item.tsx` — `p-1` class on overlay buttons confirmed (lines 139, 155)
- `node_modules/tailwindcss/theme.css` — `--breakpoint-md: 48rem` (768px) confirmed for Tailwind v4
- `package.json` — All dependency versions verified; no new packages needed

### Secondary (MEDIUM confidence)

- Tailwind v4 class merging with CVA: `cn(buttonVariants({ ..., className }))` uses tailwind-merge; `h-11 w-11` overrides `size-8` [ASSUMED — standard tailwind-merge behaviour, not explicitly tested]

### Tertiary (LOW confidence)

- None — all research grounded in direct codebase inspection

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in package.json; no new installs
- Architecture: HIGH — Sheet pattern verified in production; line numbers verified in source
- Pitfalls: HIGH — most derived from direct code inspection (h-full, hoveredCard, overflow-hidden position)
- Test structure: MEDIUM — test framework verified; Wave 0 test content is speculative

**Research date:** 2026-05-29
**Valid until:** 2026-06-28 (stable stack; no moving parts)

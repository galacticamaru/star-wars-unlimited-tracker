---
phase: 9
slug: 09-Sideboard
status: draft
shadcn_initialized: true
preset: base-nova
base_color: zinc
css_variables: true
icon_library: lucide-react
created: 2026-05-11
---

# Phase 9 — UI Design Contract (Sideboard)

> Visual and interaction contract for sideboard support in the deck builder.
> All decisions pre-populated from 09-CONTEXT.md (D-01 through D-13) and
> codebase inspection. No design questions remain open.

---

## Design System

| Property | Value | Source |
|----------|-------|--------|
| Tool | shadcn | components.json |
| Preset | base-nova | components.json |
| Component library | radix-ui (via shadcn) | components.json |
| Icon library | lucide-react | components.json |
| Styling | Tailwind v4 CSS variables | globals.css |
| Font (heading) | var(--font-heading) | globals.css |
| Font (body) | var(--font-sans) / Geist | globals.css |

No new design system setup is required. This phase extends the existing
deck builder UI in place.

---

## Spacing Scale

Standard 8-point scale (Tailwind defaults, matching all prior phases):

| Token | Value | Phase 9 Usage |
|-------|-------|---------------|
| xs | 4px | Icon gaps within row controls, badge inner padding |
| sm | 8px | Gap between `-` / `+` / "Move to SB" buttons |
| md | 16px | Card row padding (p-4 = 16px, matching existing rows) |
| lg | 24px | Gap between main deck section and sideboard section |
| xl | 32px | Top-level editor container padding |
| 2xl | 48px | — |
| 3xl | 64px | — |

Exception: Move buttons (`h-8 w-8`) preserve existing icon-button 32px
touch target consistent with the `-` / `+` buttons already in the Deck
List editor.

---

## Typography

Inherited from the existing deck builder. No new type sizes are introduced.

| Role | Size | Weight | Line Height | Tailwind Class |
|------|------|--------|-------------|----------------|
| Body | 16px | 400 | 1.5 | default |
| Label / metadata | 14px | 400 | — | `text-sm` |
| Caption / small | 12px | 400 | — | `text-xs` |
| Section heading | 18px | 700 | 1.2 | `text-lg font-bold` |

Section heading pattern (e.g. "Main Deck (N)") already uses `text-lg font-bold`.
The sideboard section heading ("Sideboard (N / 10)") uses the same class.
The cost curve legend uses `text-xs` (12px) — the caption size already in scope
is visually adequate for chart legend context.

---

## Color

### 60/30/10 Split (unchanged from existing deck builder)

| Role | Tailwind / Token | Usage |
|------|-----------------|-------|
| Dominant (60%) | `bg-slate-50` | Main content area background (`flex-1 overflow-y-auto bg-slate-50`) |
| Secondary (30%) | `bg-white border` | Card list containers, leader/base slot cards |
| Accent (10%) | `bg-indigo-600` / `text-indigo-600` | "Complete Deck" CTA, qty badge, active controls |

Accent is reserved for: "Complete Deck" button, quantity badge background,
active tab indicator. The sideboard introduces no new accent usage.

### Semantic Colors (existing, reused)

| Semantic | Tailwind Class | Reserved For |
|----------|---------------|-------------|
| Error | `text-red-600 bg-red-50 border-red-100` | Validation errors (including new sideboard > 10 error) |
| Warning | `text-amber-600 bg-amber-50 border-amber-100` | Validation warnings (off-aspect) |
| Success | `bg-green-100 text-green-800 border-green-200` | Legal deck badge |

### New Color: Sideboard Cost Curve Bars

| Element | Color | Tailwind Class | Source |
|---------|-------|---------------|--------|
| Sideboard bars (stacked on cost curve) | Amber 400 | `bg-amber-400` | D-12, matches existing amber warning palette |
| Main deck bars | Slate 400 / Indigo 500 on hover | `bg-slate-400 group-hover:bg-indigo-500` | Existing (unchanged) |

Amber-400 was chosen (D-12) because `bg-amber-50` / `text-amber-600` are
already present in DeckSidebar for warnings — amber is already an
established semantic color in this component, so amber-400 bars are
visually cohesive, not arbitrary.

### Sideboard Section Background

The sideboard section sits in the same `bg-white border rounded-lg shadow-sm`
container pattern as the main deck list. No new container background is
introduced — the section heading provides the visual boundary.

---

## Component Contracts

### C-01: "Move to SB" Button (Main Deck Rows)

- **Location**: Each card row in the Deck List editor, main deck section.
- **Position**: Far right, after the existing `–` and `+` buttons.
- **Label**: `Move to SB` (text label, not icon-only). Source: D-02, specifics section.
- **Component**: shadcn `Button` with `variant="outline" size="sm"`.
- **Dimensions**: `h-8` (32px), auto width to fit text.
- **Interaction**:
  - If main quantity > 1: decrement main count by 1, increment sideboard count by 1.
  - If main quantity === 1: remove card from main, add 1 to sideboard (card leaves main list). Source: D-04.
  - Dispatch: two `UPDATE_CARD` actions (or one new reducer action), atomic in the same render cycle.
- **Disabled state**: Button is disabled when sideboard total is already 10 (to prevent exceeding the cap before validation fires).

### C-02: "Move to Main" Button (Sideboard Rows)

- **Location**: Each card row in the sideboard section of the Deck List editor.
- **Position**: Far right (same column as "Move to SB" in main rows — symmetric layout).
- **Label**: `Move to Main` (text label). Source: D-03.
- **Component**: shadcn `Button` with `variant="outline" size="sm"`.
- **Dimensions**: `h-8` (32px), auto width to fit text.
- **Interaction**: Decrement sideboard count by 1, increment main count by 1. If sideboard quantity reaches 0, card is removed from sideboard list.

### C-03: Sideboard Section (Deck List Editor Tab)

- **Location**: Below the main deck list in the Deck List editor view. Source: D-05.
- **Container**: Same `bg-white border rounded-lg divide-y shadow-sm` pattern as the main deck list.
- **Section header**: `"Sideboard (N / 10)"` where N = `sideboard.reduce((s,i) => s+i.quantity, 0)`. Source: D-07.
  - Header element: `<h3 className="text-lg font-bold">Sideboard ({N} / 10)</h3>` — mirrors the existing "Main Deck ({N})" heading.
- **Visibility**: Always rendered, even when empty. Source: D-06.
- **Card rows**: Same row format as main deck: `[qty badge] [name + type/cost] [– ] [+] [Move to Main]`.
  - Quantity badge: `w-10 h-10 rounded bg-slate-100 flex items-center justify-center font-bold text-indigo-600` (identical to main deck rows).
  - Row hover: `hover:bg-slate-50 transition-colors` (identical).

### C-04: Sideboard Empty State

- **Trigger**: `sideboard.length === 0`. Source: D-06.
- **Container**: Renders inside the sideboard section container in place of the row list.
- **Copy**: `No sideboard cards yet. Click "Move to SB" on a main deck card to add one.` (instructional). Source: D-06, specifics section.
- **Style**: `p-8 text-center text-slate-400 text-sm` — lighter than the main deck empty state (which uses `p-12`) since the sideboard section is always in view below existing content.

### C-05: Sidebar Card Count Display

- **Location**: `deck-sidebar.tsx`, adjacent to the legal/illegal badge. Source: D-08.
- **Current text**: `{totalMain} / 50 cards`
- **New text**: `{totalMain} / 50 main • {totalSideboard} / 10 sideboard`
  - `totalSideboard = sideboard.reduce((s,i) => s+i.quantity, 0)`
- **Style**: `text-sm text-slate-500` (same as existing span — no new classes).
- **Separator**: `•` (middle dot character, U+2022). No icon.

### C-06: Cost Curve — Stacked Sideboard Bars

- **Location**: `deck-sidebar.tsx`, Cost Curve section. Source: D-11, D-12.
- **Structure per cost column**: The existing single `<div>` bar becomes two stacked `<div>` bars inside the same `flex-col justify-end` column:
  1. **Sideboard bar** (top, amber): `bg-amber-400 rounded-t-sm` with height proportional to `sideboardCostCurve[cost]`.
  2. **Main bar** (bottom, slate/indigo): existing `bg-slate-400 group-hover:bg-indigo-500` bar.
  - Stacking order: sideboard bar is rendered above main bar in DOM (flex-col, items rendered top-to-bottom within the justify-end container means the sideboard segment sits on top of the main segment visually).
- **Height calculation**: Both bars share the same max baseline of 12 cards at 100% height. The combined height of both bars is `Math.min(((mainCount + sideboardCount) / 12) * 100, 100)%`. The sideboard portion's height within that is `(sideboardCount / 12) * 100%`.
- **Tooltip**: Each bar segment carries its own `title` attribute:
  - Main bar: `{mainCount} main cards with cost {cost}{cost===9?'+':''}`
  - Sideboard bar: `{sideboardCount} sideboard cards with cost {cost}{cost===9?'+':''}`
- **Zero-height guard**: A bar segment with count 0 renders with `height: 0` (no minimum height applied), so an empty sideboard produces no visible amber bar.

### C-07: Cost Curve Legend

- **Location**: Below the cost curve chart in `deck-sidebar.tsx`, replacing the existing `<div className="h-4" />` spacer. Source: D-13.
- **Content**: Two color swatches with labels.
- **Markup**:
  ```
  <div className="flex gap-3 mt-2 text-xs text-slate-500">
    <span className="flex items-center gap-1">
      <span className="inline-block w-2.5 h-2.5 rounded-sm bg-slate-400" />
      Main
    </span>
    <span className="flex items-center gap-1">
      <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-400" />
      Sideboard
    </span>
  </div>
  ```
- **Style**: `text-xs` (12px), `text-slate-500`, no font weight change. Swatch size 10px x 10px (`w-2.5 h-2.5`), `rounded-sm`.

---

## Copywriting Contract

| Element | Exact Copy | Source |
|---------|-----------|--------|
| Move button (main deck row) | `Move to SB` | D-02, specifics |
| Move button (sideboard row) | `Move to Main` | D-03 |
| Sideboard section header | `Sideboard (N / 10)` | D-07 |
| Sidebar count display | `{N} / 50 main • {M} / 10 sideboard` | D-08 |
| Sideboard empty state | `No sideboard cards yet. Click "Move to SB" on a main deck card to add one.` | D-06 |
| Sideboard validation error | `Sideboard cannot exceed 10 cards` | D-09 |
| Cost curve legend — main label | `Main` | D-13 |
| Cost curve legend — sideboard label | `Sideboard` | D-13 |

### Destructive Actions in This Phase

None. Moving a card between main and sideboard is reversible at all times.
The `–` decrement button on a sideboard row that would drop quantity to 0
removes the card from the sideboard section entirely — this is consistent
with existing main deck behavior and requires no confirmation dialog.

---

## Validation & Error States

### Sideboard > 10 Error

- **Trigger**: `validateDeck()` detects `totalSideboard > 10`.
- **Message**: `Sideboard cannot exceed 10 cards` (added to `errors[]`).
- **Display location**: Existing Rules section in `deck-sidebar.tsx`
  (`text-red-600 bg-red-50 border border-red-100` div with `AlertCircle` icon).
- **Effect on legal badge**: Sets `isValid: false` → "Illegal" badge appears.
- **No inline error**: No per-row indicator is needed — the sidebar error is sufficient.

### Sideboard Empty (Not an Error)

An empty sideboard is valid. No warning is shown for zero sideboard cards.

---

## Interaction Contracts

### Move to SB Flow

1. User is on Deck List tab, sees main deck rows.
2. User clicks `Move to SB` on a card row.
3. If main quantity > 1:
   - Main row quantity badge decrements by 1.
   - Sideboard section below gains (or increments) that card.
4. If main quantity === 1:
   - Main row disappears from the main list.
   - Sideboard section gains that card.
5. Sidebar count display updates immediately (derived state, no async).
6. Cost curve updates immediately (re-validates on state change).

### Move to Main Flow

1. User sees sideboard row.
2. User clicks `Move to Main`.
3. Sideboard row quantity decrements by 1 (or row disappears if quantity was 1).
4. Main deck gains (or increments) that card.
5. Same immediate derived-state updates as above.

### Tab Persistence

The Deck List tab remains the active tab during these interactions. No tab
switching occurs as a result of move actions.

---

## Accessibility

- `Move to SB` and `Move to Main` buttons are labeled with visible text — no
  aria-label override needed.
- Sideboard section heading (`<h3>`) provides semantic structure for screen readers.
- Cost curve bar segments use `title` attribute for tooltip text — this is
  consistent with the existing implementation. No additional `aria-label`
  is added (maintaining existing pattern).
- Color alone does not differentiate main from sideboard bars — the legend
  below the chart provides the text label (WCAG 1.4.1: Use of Color).
- Amber-400 on white background: contrast ratio ~3.1:1. Acceptable for
  graphical/decorative chart elements (WCAG 1.4.11 Non-Text Contrast
  threshold is 3:1).

---

## Registry Safety Gate

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | `Button`, `Badge` (existing) | Not required — official registry |

No third-party registries or blocks are introduced in this phase.

---

## Pre-Population Audit

| Field | Source | Count |
|-------|--------|-------|
| Design system, preset, icon library | `components.json` | 3 |
| CSS tokens, color values | `globals.css` | 8 |
| Interaction decisions | `09-CONTEXT.md` D-01 – D-13 | 13 |
| Existing component patterns | `deck-builder.tsx`, `deck-sidebar.tsx` | 6 |
| Copywriting (all 8 elements) | `09-CONTEXT.md` specifics | 8 |

User questions asked during this session: **0**. All decisions were
locked in CONTEXT.md or determinable from codebase inspection.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PENDING
- [ ] Dimension 2 Visuals: PENDING
- [ ] Dimension 3 Color: PENDING
- [ ] Dimension 4 Typography: PENDING
- [ ] Dimension 5 Spacing: PENDING
- [ ] Dimension 6 Registry Safety: PENDING

**Approval:** pending

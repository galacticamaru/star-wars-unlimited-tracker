---
status: approved
phase: 7
name: Market Pricing
---

# UI-SPEC: Phase 7 — Market Pricing

This document defines the visual and interaction contract for the Market Pricing phase.

## 1. Design Tokens

### Spacing
Multiples of 8px (4px for tight increments).
- `spacing.xs`: 4px
- `spacing.sm`: 8px
- `spacing.md`: 16px
- `spacing.lg`: 24px
- `spacing.xl`: 32px
- `spacing.2xl`: 48px
- `spacing.3xl`: 64px

### Typography
- **Headings**: Oxanium
  - Size: 20px (h1), 16px (h2/subhead)
  - Weight: 700 (Bold)
- **Body**: Nunito Sans
  - Size: 14px (default), 12px (small/caption)
  - Weight: 400 (Regular), 700 (Bold)
  - Line Height: 1.5
- **Price Labels**: Nunito Sans
  - Size: 12px (bold)
  - Weight: 700

### Color Split (60/30/10)
- **60% Dominant (Surface)**: Slate-50 (oklch(0.985 0 0)) / Background
- **30% Secondary (Components)**: White (oklch(1 0 0)) or Slate-100 (oklch(0.967 0.001 286.375)) / Cards, Sidebar
- **10% Accent (Call to Action)**: Indigo-600 (oklch(0.5 0.134 242.749)) / Primary
  - Reserved for: Primary buttons, active currency toggle state, deck total highlight.
- **Price Accent**: Emerald-600 (oklch(0.648 0.15 160)) for positive prices (e.g. "Valuable"), but standard Primary for normal price tags.

---

## 2. Component Contracts

### 2.1 Currency Toggle
- **Location**: `TopBar.tsx` (Catalog) and `DeckBuilder.tsx` (Toolbar).
- **Design**: Segmented control (Toggle Group).
- **Options**: `EUR`, `USD`.
- **Interaction**: Single choice. Switching updates all price displays globally (via client-side state/context).
- **Mobile**: Collapses to icon-only (e.g., `€/$`) or moves into a "Settings" dropdown if horizontal space < 360px.

### 2.2 Card Detail Price Display
- **Location**: `src/app/cards/[set-code]/[card-number]/page.tsx`.
- **Placement**: Under the stat chips (Cost/Power/HP) and above the Front Text (abilities).
- **Focal Point**: The card art remains the primary anchor; price chips are secondary metadata.
- **Visuals**:
  - Row of two "Price Chips".
  - Label: `Market (NM)`
  - EUR: `€0.45`
  - USD: `$0.50`
- **Style**: Shadcn `Badge` component with `variant="outline"` or `variant="secondary"`.
- **Empty State**: Display `—` if price is 0 or null.

### 2.3 Total Deck Cost (Deck Builder)
- **Location**: `src/components/decks/deck-sidebar.tsx`.
- **Placement**: Below "50 / 50 cards" and above validation messages.
- **Visuals**:
  - Small heading: "Estimated Value"
  - Large value: e.g., `€42.50` (in selected currency).
- **Style**: Nunito Sans font, bold, Primary color.

### 2.4 Estimated Cost to Complete (Want List)
- **Location**: `src/components/decks/want-list-tab.tsx`.
- **Placement**: Sticky footer or bottom summary bar.
- **Visuals**:
  - Container: Full width, `bg-primary`, `text-primary-foreground`, `p-4`, `rounded-t-lg`.
  - Content: "Estimated Cost to Complete: **€12.30**" (based on shortfall cards).
- **Style**: High contrast to differentiate from catalog/list items.

---

## 3. Copywriting Contract

| Element | Copy | Note |
|---------|------|------|
| Currency Toggle | `EUR` / `USD` | ISO codes |
| Price Chip Label | `Market (NM)` | Near Mint baseline |
| Deck Cost Label | `Estimated Value` | In Sidebar |
| Want List Summary | `Estimated Cost to Complete` | For missing cards |
| Price Loading | `Refreshing prices...` | During manual trigger |
| Price Fallback | `Price unavailable` | Tooltip or grayed out |
| Refresh CTA | `Refresh Prices` | Manual trigger label |

---

## 4. Accessibility & States

- **Loading State**: Skeleton pulse for price badges during fetch.
- **Error State**: Grayed out price with "N/A" if API failed.
- **Interactive**: Price chips link to Cardmarket/TCGPlayer (optional, but recommended).
- **Screen Readers**: "Price in Euro: 45 cents", "Total Deck Cost: 42 Euro 50 cents".

---

## 5. Registry & Safety Gate

### Third-Party Blocks
- None. Only using official shadcn components.

### Safety Gate
| Block | Source | Safety Gate |
|-------|--------|-------------|
| N/A | — | — |

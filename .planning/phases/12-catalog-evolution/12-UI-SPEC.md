---
phase: 12
slug: catalog-evolution
status: approved
shadcn_initialized: true
preset: base-nova / zinc / cssVariables
created: 2026-05-12
reviewed_at: 2026-05-12T13:15:00Z
---

# Phase 12 — UI Design Contract

> Visual and interaction contract for Phase 12: Catalog Evolution.

---

## Design System

| Property | Value | Source |
|----------|-------|--------|
| Tool | shadcn/ui | components.json [VERIFIED] |
| Style | base-nova | components.json `style: "base-nova"` [VERIFIED] |
| Base color | zinc | components.json `baseColor: "zinc"` [VERIFIED] |
| CSS variables | true | components.json `cssVariables: true` [VERIFIED] |
| Component library | Radix UI (via shadcn) | src/components/ui/ |
| Icon library | Lucide React | components.json `iconLibrary: "lucide"` [VERIFIED] |
| Heading font | Oxanium (`font-heading`, `--font-heading`) | src/app/layout.tsx [VERIFIED] |
| Body font | Nunito Sans (`font-sans`, `--font-sans`) | src/app/layout.tsx [VERIFIED] |
| Third-party registries | none | components.json `registries: {}` [VERIFIED] |

---

## Spacing Scale

Declared values (multiples of 4 only). Reuses standard project 8-point scale.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Sidebar filter item vertical gap |
| sm | 8px | Sidebar section gap, filter label margin |
| md | 16px | Page padding, grid gap, sidebar inner padding |
| lg | 24px | Gap between Sidebar and Grid (desktop) |
| xl | 32px | Top-level section padding |

---

## Typography

Reuses project typography established in Phase 11.

| Role | Size | Weight | Line Height | Font | Tailwind class |
|------|------|--------|-------------|------|----------------|
| Body | 16px | 400 | 1.5 | Nunito Sans | `text-base` |
| Label | 14px | 400 | 1.4 | Nunito Sans | `text-sm` |
| Small | 12px | 700 | 1.2 | Nunito Sans | `text-xs font-bold` |
| Heading | 20px | 700 | 1.2 | Oxanium | `text-xl font-bold font-heading` |

---

## Color

Standard Zinc-based oklch palette.

| Role | CSS Token | Usage |
|------|-----------|-------|
| Dominant | `--background` | Main page background |
| Secondary | `--card` / `--muted` | Sidebar background, Card background |
| Accent | `--primary` | Active filter indicators, "Clear All" button (hover) |
| Border | `--border` | Sidebar right border, filter section dividers |

---

---

## Component Inventory

### New Components

| Component | Path | Type | Description |
|-----------|------|------|-------------|
| `SidebarFilters` | `src/components/catalog/sidebar-filters.tsx` | Client | Sticky vertical sidebar for all filter controls. |
| `MobileFilterSheet` | `src/components/catalog/mobile-filter-sheet.tsx` | Client | shadcn/ui `Sheet` containing filters for mobile view. |
| `VariantFilter` | `src/components/catalog/variant-filter.tsx` | Client | Specialized filter for card print variants. |

### Updated Components

| Component | File | Change |
|-----------|------|--------|
| `CatalogClient` | `src/components/catalog/catalog-client.tsx` | Update layout to `flex-row` on desktop. Integrate Sidebar. |
| `TopBar` | `src/components/catalog/top-bar.tsx` | Phase out or repurposed for minimal status (result count, sort). |
| `CardGrid` | `src/components/catalog/card-grid.tsx` | Ensure responsive layout works with sidebar offset. |

---

## Layout Specifications

### Focal Point
The **Card Grid** is the primary focal point. The sidebar is secondary to ensure users focus on card content and availability.

### Desktop Catalog (768px+)

```
┌─────────────────────────────────────────────────────────────────┐
│ NavBar (fixed, h-14)                                            │
├───────────┬─────────────────────────────────────────────────────┤
│ Sidebar   │ Content Area                                        │
│ (sticky)  │                                                     │
│ w-64      │ ┌─────────────────────────────────────────────────┐ │
│ border-r  │ │ Sub-header: Results count, Sorting, Currency    │ │
│ py-6 px-4 │ └─────────────────────────────────────────────────┘ │
│           │                                                     │
│ [Search]  │ ┌─────────────────────────────────────────────────┐ │
│           │ │ Card Grid                                       │ │
│ [Filters] │ │ (grid-cols-2 to grid-cols-5)                    │ │
│           │ └─────────────────────────────────────────────────┘ │
└───────────┴─────────────────────────────────────────────────────┘
```

- **Sidebar Stickiness**: `sticky top-14 self-start h-[calc(100vh-3.5rem)] overflow-y-auto`.
- **Spacing**: `gap-6` between Sidebar and Content Area.

### Mobile Catalog (<768px)

```
┌─────────────────────────────────────────────────────────────────┐
│ NavBar (fixed, h-14)                                            │
├─────────────────────────────────────────────────────────────────┤
│ Sticky Action Bar: [Filters Button] [Search Input (minimized)]  │
├─────────────────────────────────────────────────────────────────┤
│ Card Grid (grid-cols-2)                                         │
└─────────────────────────────────────────────────────────────────┘
```

- **Mobile Filters**: Trigger `Sheet` (Drawer) from right side.

---

## Interaction Contract

### Filters
- **Selection**: Instant update via URL params (`nuqs`).
- **Variant Toggle**: Default to "Normal". Selecting a variant (e.g., Showcase) swaps the display.
- **Clear All**: Single button to reset all URL params to defaults.

### Sticky Sidebar
- The sidebar remains fixed while the card grid scrolls.
- If the sidebar has many filters (e.g., Trait list), it scrolls independently.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Sidebar Title | `Filters` |
| Search Placeholder | `Search cards...` |
| Variant Label | `Variant` |
| Variant Options | `Normal`, `Showcase`, `Prestige`, `Serialized`, `All` |
| Set TS26 Option | `Twin Suns (TS26)` |
| Clear All Button | `Clear All Filters` |
| Mobile Filter Button | `Refine Results` |
| Empty State | `No cards found matching your filters. Try adjusting your search.` |
| Result Count | `{n} cards found` |

---

## Accessibility Contract

- **Sidebar**: Use semantic `<aside>` tag.
- **Filters**: Ensure all inputs have associated `<Label>`.
- **Keyboard**: Sidebar filters must be navigable via Tab.
- **Focus**: Clear focus rings on all inputs/buttons.
- **Mobile**: `Sheet` (Dialog) must follow WAI-ARIA patterns (handled by shadcn/Radix).

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | `sheet`, `separator`, `scroll-area` | not required — official registry |

No third-party registries.

---

## Pre-Population Audit

| Decision | Source |
|----------|--------|
| Sticky Sidebar | 12-CONTEXT.md |
| Phase out TopBar | 12-CONTEXT.md |
| Mobile Drawer | 12-CONTEXT.md |
| Variant default: Normal | 12-CONTEXT.md |
| TS26 as standard set | 12-CONTEXT.md |
| shadcn tokens | components.json / globals.css |
| Fonts | layout.tsx |
| Spacing | Project standard 8pt |

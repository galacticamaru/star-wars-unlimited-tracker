# Phase 13: Advanced Filters - Pattern Map

**Mapped:** 2026-05-13
**Files analyzed:** 7 (5 modified, 2 new)
**Analogs found:** 7 / 7

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/filter-cards.ts` | utility | transform | self (extend existing) | exact |
| `src/components/catalog/catalog-client.tsx` | component | request-response | self (extend existing) | exact |
| `src/components/catalog/sidebar-filters.tsx` | component | event-driven | self (extend existing) | exact |
| `src/components/catalog/mobile-filter-sheet.tsx` | component | event-driven | self (extend existing) | exact |
| `src/components/ui/switch.tsx` | component | event-driven | `src/components/ui/button.tsx` | role-match |
| `src/components/ui/tooltip.tsx` | component | event-driven | `src/components/ui/sheet.tsx` | role-match |
| `src/lib/filter-cards.test.ts` | test | transform | self (extend existing) | exact |

---

## Pattern Assignments

### `src/lib/filter-cards.ts` (utility, transform) — MODIFY

**Analog:** self

**Existing FilterState interface** (lines 1–12):
```typescript
export interface FilterState {
  search: string;
  selectedSets: string[];
  selectedTypes: string[];
  selectedAspects: string[];
  selectedArenas: string[];
  selectedTraits: string[];
  selectedRarities: string[];
  selectedKeywords: string[];
  selectedCosts: string[];
  selectedVariants?: string[] | null;
}
```

**New field to add** — append after `selectedVariants` in the interface:
```typescript
  ownedOnly?: boolean;
```

**Existing filterCards() signature** (line 44):
```typescript
export function filterCards(cards: CardForFilter[], filters: FilterState): CardForFilter[]
```

**New signature** — add `collection` as third param with default:
```typescript
export function filterCards(
  cards: CardForFilter[],
  filters: FilterState,
  collection: Record<number, number> = {}
): CardForFilter[]
```

**Existing destructure block** (lines 45–56) — add `ownedOnly` here:
```typescript
const {
  search = '',
  selectedSets = [],
  selectedTypes = [],
  selectedAspects = [],
  selectedArenas = [],
  selectedTraits = [],
  selectedRarities = [],
  selectedKeywords = [],
  selectedCosts = [],
  selectedVariants = [],
  // ADD:
  ownedOnly = false,
} = filters;
```

**Existing matchesVariant pattern** (line 107) — copy the guard pattern for matchesOwned:
```typescript
// Variant: OR within category
const matchesVariant = !selectedVariants?.length || (card.variantType && selectedVariants.includes(card.variantType));
```

**New matchesOwned gate** — add after matchesVariant:
```typescript
// Owned-only gate: pass-through when false; check collection when true
const matchesOwned = !ownedOnly || (collection[card.id] ?? 0) >= 1;
```

**Existing return expression** (lines 110–121) — add `matchesOwned` to AND chain:
```typescript
return (
  matchesSearch &&
  matchesSet &&
  matchesType &&
  matchesAspect &&
  matchesArena &&
  matchesTrait &&
  matchesRarity &&
  matchesKeyword &&
  matchesCost &&
  matchesVariant &&
  matchesOwned       // ADD at end
);
```

---

### `src/components/catalog/catalog-client.tsx` (component, request-response) — MODIFY

**Analog:** self

**Existing nuqs import line** (line 4) — add `parseAsBoolean`:
```typescript
import { useQueryState, parseAsString, parseAsArrayOf, parseAsBoolean } from 'nuqs';
```

**Existing nuqs hook block pattern** (lines 94–103) — copy this style for the new hook:
```typescript
const [selectedVariants, setSelectedVariants] = useQueryState('variants', parseAsArrayOf(parseAsString).withDefault(['Normal']).withOptions({ shallow: true }));
```

**New ownedOnly hook** — add after the selectedVariants hook:
```typescript
const [ownedOnly, setOwnedOnly] = useQueryState(
  'owned',
  parseAsBoolean.withDefault(false).withOptions({ shallow: true })
);
```

**Existing filterCards call** (lines 108–133) — add `ownedOnly` to filter object and `collection` as third arg:
```typescript
const filtered = useMemo(
  () => filterCards(
    cards,
    {
      search,
      selectedSets,
      selectedTypes,
      selectedAspects,
      selectedArenas,
      selectedTraits,
      selectedRarities,
      selectedKeywords,
      selectedCosts,
      selectedVariants,
      ownedOnly,        // ADD
    },
    collection          // ADD third arg
  ),
  [
    cards,
    search,
    selectedSets,
    selectedTypes,
    selectedAspects,
    selectedArenas,
    selectedTraits,
    selectedRarities,
    selectedKeywords,
    selectedCosts,
    selectedVariants,
    ownedOnly,          // ADD
    collection          // ADD
  ]
);
```

**Existing handleClearAll** (lines 136–147) — add `setOwnedOnly(false)` before closing brace:
```typescript
const handleClearAll = () => {
  setSearch('');
  setSelectedSets([]);
  setSelectedTypes([]);
  setSelectedAspects([]);
  setSelectedArenas([]);
  setSelectedTraits([]);
  setSelectedRarities([]);
  setSelectedKeywords([]);
  setSelectedCosts([]);
  setSelectedVariants(['Normal']);
  setOwnedOnly(false);    // ADD
};
```

**Existing sidebarProps object** (lines 149–169) — add three new entries before `onClearAll`:
```typescript
const sidebarProps = {
  search, onSearchChange: setSearch,
  // ...existing entries unchanged...
  selectedVariants, onVariantsChange: setSelectedVariants,
  // ADD:
  ownedOnly,
  onOwnedOnlyChange: setOwnedOnly,
  isAuthenticated,
  onClearAll: handleClearAll,
};
```

---

### `src/components/catalog/sidebar-filters.tsx` (component, event-driven) — MODIFY

**Analog:** self

**Existing SidebarFiltersProps interface** (lines 11–41) — add three new optional props after `onClearAll`:
```typescript
interface SidebarFiltersProps {
  // ...existing props (all optional)...
  onClearAll?: () => void;
  // ADD:
  ownedOnly?: boolean;
  onOwnedOnlyChange?: (v: boolean) => void;
  isAuthenticated?: boolean;
}
```

**Existing destructure with defaults** (lines 43–73) — add three new params with defaults before closing `}`:
```typescript
export function SidebarFilters({
  // ...existing...
  onClearAll = () => {},
  // ADD:
  ownedOnly = false,
  onOwnedOnlyChange = () => {},
  isAuthenticated = false,
}: SidebarFiltersProps) {
```

**Toggle placement** — D-03 says below search bar, above other filter dropdowns. The `<VariantFilter>` is currently at line 100, placed right after search. Insert the owned-only toggle between the search `</div>` block (ends ~line 98) and `<VariantFilter>` (line 100):

Copy the Cost group's inline `<button>` toggle style (lines 114–143) as the structural reference for a compact, bordered row. The owned-only row should use the same `flex items-center` layout convention. Use Base UI `Switch.Root` + `Switch.Thumb` with `Tooltip` wrapping when `!isAuthenticated`.

**Import additions** at top of file:
```typescript
import { Switch } from '@base-ui/react/switch';
import { Tooltip } from '@base-ui/react/tooltip';
import { Switch as SwitchUI } from '@/components/ui/switch';      // if thin wrapper is created
import { Tooltip as TooltipUI } from '@/components/ui/tooltip';   // if thin wrapper is created
```

Note: Whether to use the thin wrappers or Base UI primitives directly is at Claude's discretion (the wrappers in `src/components/ui/` are being created in Wave 0 of the same phase).

**Toggle render block** — insert after the search `</div>` block and before `<VariantFilter ...>`:
```tsx
{/* Owned-only toggle */}
<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger disabled={isAuthenticated} render={<span />}>
      <div className={cn(
        'flex items-center justify-between py-1',
        !isAuthenticated && 'opacity-50 cursor-not-allowed'
      )}>
        <label className="text-sm font-medium">Owned only</label>
        <Switch.Root
          checked={ownedOnly}
          onCheckedChange={onOwnedOnlyChange}
          disabled={!isAuthenticated}
          className="..."
        >
          <Switch.Thumb className="..." />
        </Switch.Root>
      </div>
    </Tooltip.Trigger>
    {!isAuthenticated && (
      <Tooltip.Positioner>
        <Tooltip.Popup className="...">
          Log in to filter by owned cards
        </Tooltip.Popup>
      </Tooltip.Positioner>
    )}
  </Tooltip.Root>
</Tooltip.Provider>
```

Note: Exact `Tooltip.Trigger` prop name (`disabled`) must be confirmed against Base UI 1.4.1 type definitions in `node_modules/@base-ui/react/` at implementation time (see Assumption A1 in RESEARCH.md). The `disabled` prop on `Trigger` controls whether the tooltip activates — the row is visible regardless.

---

### `src/components/catalog/mobile-filter-sheet.tsx` (component, event-driven) — MODIFY

**Analog:** self

**Change scope:** Minimal — the type alias on line 16 picks up new `SidebarFiltersProps` automatically because it is defined as `React.ComponentProps<typeof SidebarFilters>`. No functional code changes are required.

**Existing type alias** (line 16):
```typescript
type MobileFilterSheetProps = React.ComponentProps<typeof SidebarFilters>;
```

This type alias reflects `SidebarFiltersProps` structurally. When `SidebarFilters` gains `ownedOnly?`, `onOwnedOnlyChange?`, and `isAuthenticated?` as optional props, `MobileFilterSheetProps` gains them too — no edit needed here as long as all three are optional (which they are, per the `SidebarFilters` pattern above).

The spread on line 35 passes everything through:
```tsx
<SidebarFilters {...props} />
```

No change to this file is required unless TypeScript surfaces an error. If it does, the fix is to explicitly re-export `SidebarFiltersProps` from `sidebar-filters.tsx` and use it directly here.

---

### `src/components/ui/switch.tsx` (component, event-driven) — NEW

**Analog:** `src/components/ui/button.tsx` (Base UI primitive wrapper with CVA) and `src/components/ui/sheet.tsx` (thin Base UI sub-component wrapper)

**Wrapper pattern from `button.tsx`** (lines 1–58):
- Import the Base UI primitive with a namespace alias (`import { Button as ButtonPrimitive }`)
- Define CVA variants for Tailwind class composition
- Export a thin function that spreads Base UI props + applies `cn(variants(...))`
- Use `data-slot` attribute for slot identification

**Wrapper pattern from `sheet.tsx`** (lines 1–138):
- Import with `import * as React from 'react'` and `import { Dialog as SheetPrimitive } from '@base-ui/react/dialog'`
- Each sub-component is a named function wrapping the corresponding primitive sub-component
- Props typed via the primitive's `.Props` type (e.g., `SheetPrimitive.Root.Props`)
- Apply `cn()` for conditional className merging
- Named exports at the bottom

**New switch.tsx pattern to copy:**
```typescript
"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // Tailwind classes for track — copy visual style from existing toggle buttons in sidebar-filters.tsx
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[checked]:bg-primary bg-input",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
          "data-[checked]:translate-x-4 translate-x-0"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
```

Note: Base UI Switch uses `data-[checked]` attribute (not `aria-checked`) for state-driven Tailwind classes. Verify the exact data attribute name from Base UI 1.4.1 type definitions at implementation time.

---

### `src/components/ui/tooltip.tsx` (component, event-driven) — NEW

**Analog:** `src/components/ui/sheet.tsx` (multi-sub-component Base UI wrapper)

**Confirmed Base UI Tooltip sub-components** (verified at runtime):
`Root`, `Trigger`, `Positioner`, `Popup`, `Portal`, `Arrow`, `Provider`, `Viewport`, `createHandle`

**Wrapper pattern from `sheet.tsx`** (lines 3–27):
- Import: `import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"`
- Each sub-component: named function, typed via `SheetPrimitive.SubName.Props`, applies `cn()` + `data-slot`
- Named exports at bottom

**New tooltip.tsx pattern to copy:**
```typescript
"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

function TooltipProvider({ ...props }: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" {...props} />
}

function TooltipRoot({ ...props }: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipPopup({ className, ...props }: TooltipPrimitive.Popup.Props) {
  return (
    <TooltipPrimitive.Positioner>
      <TooltipPrimitive.Popup
        data-slot="tooltip-popup"
        className={cn(
          "z-50 overflow-hidden rounded-md bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md",
          className
        )}
        {...props}
      />
    </TooltipPrimitive.Positioner>
  )
}

export {
  TooltipProvider,
  TooltipRoot as Tooltip,
  TooltipTrigger,
  TooltipPopup,
}
```

Note: `TooltipPrimitive.Provider.Props` may not exist as a named type — check the `.d.ts` exports for the correct prop type shape at implementation time. A fallback is `React.ComponentProps<typeof TooltipPrimitive.Provider>`.

---

### `src/lib/filter-cards.test.ts` (test, transform) — MODIFY

**Analog:** self

**Existing test infrastructure** (lines 1–46):
- `makeCard()` factory — `Partial<CardForFilter>` override pattern
- `emptyFilters` constant — spread with `{ ...emptyFilters, <override> }` in each test
- `// @vitest-environment node` directive at top
- `describe/it/expect` from vitest — no `beforeEach`, no mocks

**Existing call sites** (lines 49, 53, 57, etc.) use the two-argument form `filterCards(cards, filters)`. The new third `collection` parameter defaults to `{}`, so all existing calls remain valid with no edits.

**New test cases to add** — append inside the `describe('filterCards', ...)` block after line 158, following the existing `it(...)` style exactly:

```typescript
describe('ownedOnly filter', () => {
  const cardA = makeCard({ id: 1 });
  const cardB = makeCard({ id: 2, name: 'Vader' });

  it('ownedOnly=false returns all cards regardless of collection', () => {
    const collection = {};  // empty
    expect(
      filterCards([cardA, cardB], { ...emptyFilters, ownedOnly: false }, collection)
    ).toHaveLength(2);
  });

  it('ownedOnly=true returns only cards with collection[id] >= 1', () => {
    const collection = { 1: 2 };  // only card id=1 owned
    const result = filterCards([cardA, cardB], { ...emptyFilters, ownedOnly: true }, collection);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it('ownedOnly=true with empty collection returns 0 cards', () => {
    const collection = {};
    expect(
      filterCards([cardA, cardB], { ...emptyFilters, ownedOnly: true }, collection)
    ).toHaveLength(0);
  });

  it('ownedOnly=true ANDs correctly with other active filters', () => {
    const cardC = makeCard({ id: 3, name: 'Luke', type: 'Unit' });
    const cardD = makeCard({ id: 4, name: 'Vader', type: 'Unit' });
    const collection = { 3: 1 };  // only cardC owned
    const result = filterCards(
      [cardC, cardD],
      { ...emptyFilters, selectedTypes: ['Unit'], ownedOnly: true },
      collection
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(3);
  });
});
```

---

## Shared Patterns

### nuqs URL State Pattern
**Source:** `src/components/catalog/catalog-client.tsx` lines 94–103
**Apply to:** `catalog-client.tsx` (the new `ownedOnly` hook)
```typescript
// Array form (existing):
const [selectedVariants, setSelectedVariants] = useQueryState(
  'variants',
  parseAsArrayOf(parseAsString).withDefault(['Normal']).withOptions({ shallow: true })
);

// Boolean form (new — same structure, different parser):
const [ownedOnly, setOwnedOnly] = useQueryState(
  'owned',
  parseAsBoolean.withDefault(false).withOptions({ shallow: true })
);
```
Key rule: `.withDefault(false)` causes nuqs to omit the param from the URL when the value is `false` — the URL stays clean when the toggle is off.

### Base UI Primitive Wrapper Pattern
**Source:** `src/components/ui/button.tsx` lines 1–58 and `src/components/ui/sheet.tsx` lines 1–138
**Apply to:** `src/components/ui/switch.tsx` and `src/components/ui/tooltip.tsx` (both NEW)

Rules extracted from analogs:
1. `"use client"` directive at top
2. Import: `import * as React from "react"` then the Base UI namespace
3. Props typed via `PrimitiveName.SubComponent.Props` (e.g., `SwitchPrimitive.Root.Props`)
4. Each exported component adds `data-slot="<name>"` for design-system slot identification
5. `cn()` from `@/lib/utils` for all className merging
6. Named exports at bottom (not default exports)
7. No Radix UI imports — `@base-ui/react/*` only

### sidebarProps Spread Pattern
**Source:** `src/components/catalog/catalog-client.tsx` lines 149–169
**Apply to:** `catalog-client.tsx` — extend the existing `sidebarProps` object
```typescript
const sidebarProps = {
  // existing key-value pairs remain unchanged
  selectedVariants, onVariantsChange: setSelectedVariants,
  // new entries follow the same "value + handler" convention:
  ownedOnly,
  onOwnedOnlyChange: setOwnedOnly,
  isAuthenticated,              // already available in scope (line 59)
  onClearAll: handleClearAll,
};
```
Both `SidebarFilters` and `MobileFilterSheet` receive `{...sidebarProps}` — no per-component wiring needed.

### Optional Props with Defaults Pattern
**Source:** `src/components/catalog/sidebar-filters.tsx` lines 43–73
**Apply to:** `sidebar-filters.tsx` — all three new props
```typescript
// All existing SidebarFilters props are optional with sensible defaults.
// New props follow the same convention:
ownedOnly = false,
onOwnedOnlyChange = () => {},
isAuthenticated = false,
```
This keeps `MobileFilterSheetProps` (which mirrors `SidebarFiltersProps`) from requiring the new props at call sites.

### Cost Filter Row — Inline Toggle Button Style
**Source:** `src/components/catalog/sidebar-filters.tsx` lines 114–143
**Apply to:** `sidebar-filters.tsx` — structural reference for the owned-only toggle row layout
```tsx
<div className="flex flex-col gap-1.5">
  <span className="text-sm font-medium">Cost</span>
  <div className="flex items-center border border-border rounded-md overflow-hidden h-9 bg-background/50">
    {costs.map(cost => {
      const isSelected = (selectedCosts || []).includes(cost);
      return (
        <button
          key={cost}
          type="button"
          className={cn(
            'w-8 h-full text-xs font-bold ...',
            isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted ...'
          )}
        >
          {cost}
        </button>
      );
    })}
  </div>
</div>
```
The owned-only row uses a `flex items-center justify-between` label + switch layout rather than the button grid — but the `text-sm font-medium` label and `cn()`-driven conditional class approach are the same.

---

## No Analog Found

All files have analogs. No files require falling back to RESEARCH.md patterns exclusively.

| File | Analog Quality | Note |
|------|----------------|-------|
| `src/components/ui/switch.tsx` | role-match | No existing Switch wrapper; pattern derived from `button.tsx` + `sheet.tsx` |
| `src/components/ui/tooltip.tsx` | role-match | No existing Tooltip wrapper; pattern derived from `sheet.tsx` sub-component structure |

---

## Metadata

**Analog search scope:** `src/components/ui/`, `src/components/catalog/`, `src/lib/`, `node_modules/@base-ui/react/`
**Files scanned:** 9 source files read; 2 runtime exports verified
**Base UI Switch confirmed exports:** `Switch.Root`, `Switch.Thumb`
**Base UI Tooltip confirmed exports:** `Tooltip.Root`, `Tooltip.Trigger`, `Tooltip.Positioner`, `Tooltip.Popup`, `Tooltip.Portal`, `Tooltip.Arrow`, `Tooltip.Provider`, `Tooltip.Viewport`
**Pattern extraction date:** 2026-05-13
```

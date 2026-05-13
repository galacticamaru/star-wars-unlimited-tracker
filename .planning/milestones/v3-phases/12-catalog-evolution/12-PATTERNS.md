# Phase 12: Catalog Evolution - Pattern Map

**Mapped:** 2026-12-05
**Files analyzed:** 8
**Analogs found:** 3 / 4

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/catalog/sidebar-filters.tsx` | component | request-response | `src/components/decks/deck-sidebar.tsx` | role-match |
| `src/components/catalog/catalog-client.tsx` | component | request-response | `src/components/decks/deck-builder.tsx` | role-match |
| `src/components/catalog/mobile-filter-sheet.tsx` | component | request-response | N/A | no-analog |
| `src/lib/sync/upsert-cards.ts` | utility | batch | `src/lib/sync/upsert-cards.ts` | exact |
| `src/lib/filter-cards.ts` | utility | transform | `src/lib/filter-cards.ts` | exact |
| `src/db/queries/catalog.ts` | query | request-response | `src/db/queries/catalog.ts` | exact |

## Pattern Assignments

### `src/components/catalog/sidebar-filters.tsx` (component, request-response)

**Analog:** `src/components/decks/deck-sidebar.tsx`

**Layout & Scroll Pattern** (lines 31-35):
```tsx
// Sticky sidebar with its own scroll area if content exceeds viewport
export function DeckSidebar({ ... }: DeckSidebarProps) {
  return (
    <div className="flex flex-col h-full bg-slate-50 border-l p-4 overflow-y-auto w-80">
      {/* ... content ... */}
    </div>
  );
}
```

**Filter Group Pattern** (analog from `src/components/catalog/top-bar.tsx` lines 79-110):
```tsx
// Using FilterDropdown for multi-select categories
<FilterDropdown label="Set"    options={sets}    selected={selectedSets}    onChange={onSetsChange}    />
<FilterDropdown label="Aspect" options={aspects} selected={selectedAspects} onChange={onAspectsChange} />

// Button Group for Cost (to be adapted for sidebar)
<div className="flex items-center border border-border rounded-md overflow-hidden h-9 bg-background/50 ml-auto">
  <div className="px-2 text-[10px] font-bold uppercase text-muted-foreground border-r border-border h-full flex items-center bg-muted/20">
    Cost
  </div>
  {costs.map(cost => (
    <button key={cost} ...>{cost}</button>
  ))}
</div>
```

---

### `src/components/catalog/catalog-client.tsx` (component, request-response)

**Analog:** `src/components/decks/deck-builder.tsx`

**Side-by-Side Layout Pattern** (lines 282-284, 458-466):
```tsx
// Container with flex row and h-[calc(100svh-56px)] to allow sidebar stickiness
export function DeckBuilder({ ... }: DeckBuilderProps) {
  return (
    <div className="flex h-[calc(100svh-56px)] overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Content (Card Grid) */}
      </div>
      <DeckSidebar ... />
    </div>
  );
}
```

**Nuqs State Pattern** (from `src/components/catalog/catalog-client.tsx` lines 98-106):
```tsx
const [search, setSearch] = useQueryState('q', parseAsString.withDefault('').withOptions({ shallow: true }));
const [selectedSets, setSelectedSets] = useQueryState('sets', parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: true }));
// New: const [selectedVariants, setSelectedVariants] = useQueryState('variants', parseAsArrayOf(parseAsString).withDefault(['Normal']).withOptions({ shallow: true }));
```

---

### `src/lib/sync/upsert-cards.ts` (utility, batch)

**Analog:** `src/lib/sync/upsert-cards.ts`

**Two-Pass Strategy Pattern** (lines 78-83, 146-150):
```typescript
/**
 * Uses a two-pass strategy: Normal variants first (create card_definitions),
 * then Foil/Hyperspace variants (look up existing card_definitions by name+subtitle).
 */
export async function upsertCards(setId: string, cards: SWUCard[]): Promise<number> {
  // Pass 1: Normal variants
  const normalCards = nonTokenCards.filter((card) => card.VariantType === 'Normal');
  // ... upsert cardDefinitions + cardPrintings ...

  // Pass 2: Non-Normal variants
  const variantCards = nonTokenCards.filter((card) => card.VariantType !== 'Normal');
  // ... lookup cardDefinitions, then upsert cardPrintings ...
}
```

---

## Shared Patterns

### Sticky Layout
**Source:** `src/components/nav-bar.tsx` & `src/components/catalog/top-bar.tsx`
**Apply to:** `SidebarFilters` and Mobile Header
```tsx
className={cn(
  'sticky top-0 z-50',
  'bg-background/80 backdrop-blur-sm border-b border-border',
)}
```

### URL State (nuqs)
**Source:** `src/components/catalog/catalog-client.tsx`
**Apply to:** All catalog filtering state
```typescript
const [state, setState] = useQueryState('key', parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: true }));
```

### Variant Filtering
**Source:** `src/lib/filter-cards.ts`
**Apply to:** `filterCards` logic
```typescript
const matchesVariant = (selectedVariants?.length ?? 0) === 0 ||
  selectedVariants.includes(card.variantType);
```

## No Analog Found

Files with no close match in the codebase (planner should use RESEARCH.md patterns or external documentation instead):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/components/catalog/mobile-filter-sheet.tsx` | component | request-response | `Sheet` component from shadcn/ui is not yet implemented/used in the project. |

## Metadata

**Analog search scope:** `src/components/catalog/`, `src/components/decks/`, `src/lib/sync/`, `src/lib/filter-cards.ts`, `src/db/queries/catalog.ts`
**Files scanned:** 8
**Pattern extraction date:** 2026-12-05

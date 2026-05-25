# Phase 16: Empty Deck Guided Onboarding - Pattern Map

**Mapped:** 2026-05-14
**Files analyzed:** 4 (3 modified, 1 created)
**Analogs found:** 4 / 4

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/lib/auto-filter.ts` | utility (pure function) | transform | `src/lib/deck-validation.ts` | role-match |
| `src/lib/auto-filter.test.ts` | test | transform | `src/lib/filter-cards.test.ts` | exact |
| `src/components/decks/deck-builder.tsx` | component (orchestrator) | event-driven | self (existing file) | exact |
| `src/components/catalog/catalog-client.tsx` | component (filter host) | event-driven + request-response | self (existing file) | exact |
| `src/components/catalog/sidebar-filters.tsx` | component (presentational) | request-response | self (existing file) | exact |

> Note: Three files are existing files being modified. The only net-new file is `src/lib/auto-filter.ts` (and its test). Patterns are extracted from the existing files themselves plus their closest structural analogs.

---

## Pattern Assignments

### `src/lib/auto-filter.ts` (utility, transform)

**Analog:** `src/lib/deck-validation.ts`

This is the only net-new file. It exports two pure functions: `computeAutoFilter` and `computeAutoFilterLabel`. These enable unit testing without a React/jsdom context.

**Imports pattern** — copy from `deck-validation.ts` lines 1–2 (no external deps, only project types):
```typescript
import { Card } from '@/lib/deck-validation';
```

**Core pattern** — the Set-union logic from `deck-validation.ts` lines 82–88:
```typescript
// src/lib/deck-validation.ts lines 82-88
const combinedAspects = new Set<string>();
if (leader) {
  leader.aspects.forEach((a) => combinedAspects.add(a));
}
if (base) {
  base.aspects.forEach((a) => combinedAspects.add(a));
}
```
New file adapts this to produce an `AutoFilter` object and excludes "Basic" per D-08:
```typescript
export interface AutoFilter {
  types?: string[];
  aspects?: string[];
}

export function computeAutoFilter(
  leader: Card | null,
  base: Card | null
): AutoFilter | null {
  if (!leader || !base) {
    return { types: ['Leader', 'Base'] };
  }
  const combined = new Set<string>();
  leader.aspects.forEach(a => { if (a !== 'Basic') combined.add(a); });
  base.aspects.forEach(a => { if (a !== 'Basic') combined.add(a); });
  return { aspects: [...combined] };
}

export function computeAutoFilterLabel(
  autoFilter: AutoFilter | null,
  isOverridden: boolean
): string | null {
  if (isOverridden || !autoFilter) return null;
  if (autoFilter.types) return 'Auto: Leader & Base';
  if (autoFilter.aspects) return 'Auto: Aspect filter';
  return null;
}
```

**No error handling** — pure functions, no async, no throws. Matches `deck-validation.ts` style (also no try/catch at the function level).

---

### `src/lib/auto-filter.test.ts` (test, transform)

**Analog:** `src/lib/filter-cards.test.ts`

**Imports pattern** — copy from `filter-cards.test.ts` lines 1–3:
```typescript
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { computeAutoFilter, computeAutoFilterLabel, type AutoFilter } from './auto-filter';
```

**Test factory pattern** — copy from `filter-cards.test.ts` lines 5–33 (`makeCard` factory):
```typescript
// filter-cards.test.ts lines 5-33
const makeCard = (overrides: Partial<CardForFilter> = {}): CardForFilter => {
  const defaults: CardForFilter = {
    id: 1,
    swudbId: 'SOR-001',
    name: 'Luke Skywalker',
    // ... all required fields with safe defaults ...
  };
  return { ...defaults, ...overrides };
};
```
For `auto-filter.test.ts`, use the same `createCard` factory pattern from `deck-validation.test.ts` lines 5–31:
```typescript
// deck-validation.test.ts lines 5-31
const createCard = (overrides: Partial<Card>): Card => ({
  id: Math.floor(Math.random() * 1000),
  swudbId: 'TEST-001',
  name: 'Test Card',
  // ... spread overrides
});
```

**Test structure pattern** — copy from `filter-cards.test.ts` lines 47–60 (`describe` + `it` blocks):
```typescript
describe('computeAutoFilter', () => {
  it('returns types filter when no leader', () => { ... });
  it('returns types filter when leader-only', () => { ... });
  it('returns aspects filter when both selected', () => { ... });
  it('excludes Basic aspect', () => { ... });
});

describe('computeAutoFilterLabel', () => {
  it('returns null when overridden', () => { ... });
  it('returns null when autoFilter is null', () => { ... });
  it('returns "Auto: Leader & Base" for types filter', () => { ... });
  it('returns "Auto: Aspect filter" for aspects filter', () => { ... });
});
```

---

### `src/components/decks/deck-builder.tsx` (component, event-driven) — MODIFIED

**Self-analog** — this is the file being modified. Patterns are extracted from the file itself.

**Existing useState pattern** (lines 126–130) — add `isAutoFilterOverridden` alongside existing state:
```typescript
// deck-builder.tsx lines 126-130 — existing state declarations
const [state, dispatch] = useReducer(deckReducer, initialDeck);
const [isSaving, setIsSaving] = useState(false);
const [view, setView] = useState<'editor' | 'catalog' | 'want-list'>('catalog');
const [apiErrors, setApiErrors] = useState<string[]>([]);
const [hoveredCard, setHoveredCard] = useState<Card | null>(null);
// ADD AFTER:
const [isAutoFilterOverridden, setIsAutoFilterOverridden] = useState(false);
```

**Existing useMemo pattern** (lines 133–143, 172–176) — `autoFilter` and `autoFilterLabel` follow the same `useMemo` shape:
```typescript
// deck-builder.tsx lines 172-176 — existing useMemo for cardMap
const cardMap = useMemo(() => {
  const map = new Map<number, Card>();
  allCards.forEach((c) => map.set(c.id, c));
  return map;
}, [allCards]);

// deck-builder.tsx lines 178-179 — existing derived leader/base objects
const leader = state.leaderCardDefinitionId ? cardMap.get(state.leaderCardDefinitionId) || null : null;
const base = state.baseCardDefinitionId ? cardMap.get(state.baseCardDefinitionId) || null : null;
// ADD AFTER leader/base:
const autoFilter = useMemo(
  () => (isAutoFilterOverridden ? null : computeAutoFilter(leader ?? null, base ?? null)),
  [leader, base, isAutoFilterOverridden]
);
const autoFilterLabel = useMemo(
  () => computeAutoFilterLabel(autoFilter, isAutoFilterOverridden),
  [autoFilter, isAutoFilterOverridden]
);
```

**Override reset pattern** — copy the inline-dispatch style from lines 387 and 427. Reset must be paired with all three SET_LEADER/SET_BASE dispatch sites:
```typescript
// deck-builder.tsx line 387 — leader Remove button (existing)
onClick={() => dispatch({ type: 'SET_LEADER', payload: null })}
// BECOMES:
onClick={() => { dispatch({ type: 'SET_LEADER', payload: null }); setIsAutoFilterOverridden(false); }}

// deck-builder.tsx line 427 — base Remove button (existing)
onClick={() => dispatch({ type: 'SET_BASE', payload: null })}
// BECOMES:
onClick={() => { dispatch({ type: 'SET_BASE', payload: null }); setIsAutoFilterOverridden(false); }}
```

**handleDeckUpdate override reset pattern** (lines 215–226) — SET_LEADER and SET_BASE dispatch sites inside handleDeckUpdate:
```typescript
// deck-builder.tsx lines 219-221
if (card.type === 'Leader') {
    dispatch({ type: 'SET_LEADER', payload: quantity > 0 ? cardDefinitionId : null });
} else if (card.type === 'Base') {
    dispatch({ type: 'SET_BASE', payload: quantity > 0 ? cardDefinitionId : null });
}
// ADD setIsAutoFilterOverridden(false) immediately after each dispatch above
```

**CatalogClient prop threading pattern** (lines 339–345) — extend the existing render call:
```typescript
// deck-builder.tsx lines 339-345 — existing CatalogClient usage
<CatalogClient 
  cards={allCards} 
  filterOptions={filterOptions} 
  mode="selector" 
  deckCounts={deckCounts}
  onDeckUpdate={handleDeckUpdate}
/>
// ADD three new props:
<CatalogClient 
  cards={allCards} 
  filterOptions={filterOptions} 
  mode="selector" 
  deckCounts={deckCounts}
  onDeckUpdate={handleDeckUpdate}
  autoFilter={autoFilter}
  isAutoFilterOverridden={isAutoFilterOverridden}
  onFilterManualChange={() => setIsAutoFilterOverridden(true)}
/>
```

**CTA rename** (line 454):
```tsx
// deck-builder.tsx line 454 — existing
<Button onClick={() => setView('catalog')}>Switch to Catalog</Button>
// BECOMES:
<Button onClick={() => setView('catalog')}>Add Cards</Button>
```

---

### `src/components/catalog/catalog-client.tsx` (component, event-driven) — MODIFIED

**Self-analog** — this is the file being modified.

**Existing props interface pattern** (lines 19–26) — extend `CatalogClientProps`:
```typescript
// catalog-client.tsx lines 19-26
interface CatalogClientProps {
  cards: CardForFilter[];
  filterOptions: FilterOptions;
  mode?: 'catalog' | 'selector';
  deckCounts?: Record<number, number>;
  onDeckUpdate?: (cardDefinitionId: number, count: number) => void;
  topOffset?: string;
}
// ADD three new optional props:
  autoFilter?: { types?: string[]; aspects?: string[] } | null;
  isAutoFilterOverridden?: boolean;
  onFilterManualChange?: () => void;
```

**Existing destructuring pattern** (lines 49–55) — extend to include new props:
```typescript
// catalog-client.tsx lines 49-55
export function CatalogClient({ 
  cards, 
  filterOptions, 
  mode = 'catalog', 
  deckCounts, 
  onDeckUpdate,
}: CatalogClientProps) {
// EXTEND TO:
export function CatalogClient({ 
  cards, 
  filterOptions, 
  mode = 'catalog', 
  deckCounts, 
  onDeckUpdate,
  autoFilter,
  isAutoFilterOverridden = false,
  onFilterManualChange,
}: CatalogClientProps) {
```

**Existing useEffect pattern** (lines 61–71) — new useEffect for auto-filter injection follows the same shape:
```typescript
// catalog-client.tsx lines 61-71 — existing useEffect for collection fetch
useEffect(() => {
  if (isAuthenticated) {
    fetch('/api/collection')
      .then(res => res.json())
      .then(data => setCollection(data))
      .catch(err => console.error('Failed to load collection:', err));
  } else {
    setTimeout(() => setCollection({}), 0);
  }
}, [isAuthenticated]);

// NEW useEffect — add after existing collection useEffect:
useEffect(() => {
  if (isAutoFilterOverridden || !autoFilter) return;
  if (autoFilter.types !== undefined) {
    setSelectedTypes(autoFilter.types);
  }
  if (autoFilter.aspects !== undefined) {
    setSelectedAspects(autoFilter.aspects);
  }
  // Intentionally omit setSelectedTypes/setSelectedAspects from deps — nuqs setters are stable refs
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [autoFilter, isAutoFilterOverridden]);
```

**Existing sidebarProps pattern** (lines 161–184) — add override detection wrappers and `autoFilterLabel` to sidebarProps. The wrappers intercept `onTypesChange` and `onAspectsChange`:
```typescript
// catalog-client.tsx lines 161-184 — existing sidebarProps object
const sidebarProps = {
  search, onSearchChange: setSearch,
  // ...
  selectedTypes, onTypesChange: setSelectedTypes,
  selectedAspects, onAspectsChange: setSelectedAspects,
  // ...
};
// CHANGE onTypesChange and onAspectsChange to wrapped handlers:
const handleTypesChange = (v: string[]) => {
  if (!isAutoFilterOverridden && autoFilter?.types !== undefined) {
    onFilterManualChange?.();
  }
  setSelectedTypes(v);
};

const handleAspectsChange = (v: string[]) => {
  if (!isAutoFilterOverridden && autoFilter?.aspects !== undefined) {
    onFilterManualChange?.();
  }
  setSelectedAspects(v);
};

// In sidebarProps, replace:
//   onTypesChange: setSelectedTypes,
//   onAspectsChange: setSelectedAspects,
// With:
//   onTypesChange: handleTypesChange,
//   onAspectsChange: handleAspectsChange,
// And add:
//   autoFilterLabel,   ← computed in DeckBuilder, passed via prop as autoFilterLabel
```

**Note on autoFilterLabel in CatalogClient:** `autoFilterLabel` is computed in `deck-builder.tsx` and must be passed as a new prop to `CatalogClient`, which then threads it into `sidebarProps`. Add to `CatalogClientProps`:
```typescript
autoFilterLabel?: string | null;
```
Then add `autoFilterLabel` to the `sidebarProps` object so it reaches `SidebarFilters`.

---

### `src/components/catalog/sidebar-filters.tsx` (component, presentational) — MODIFIED

**Self-analog** — this is the file being modified.

**Existing interface pattern** (lines 13–46) — extend `SidebarFiltersProps` with one new optional prop:
```typescript
// sidebar-filters.tsx lines 13-46 — existing interface
interface SidebarFiltersProps {
  search?: string;
  onSearchChange?: (v: string) => void;
  // ... all existing props ...
}
// ADD at end of interface:
  autoFilterLabel?: string | null;
```

**Existing default parameter pattern** (lines 48–81) — add default for new prop:
```typescript
// sidebar-filters.tsx lines 48-81 — existing function signature with defaults
export function SidebarFilters({
  // ... existing params with defaults ...
  isAuthenticated = false,
}: SidebarFiltersProps) {
// ADD:
  autoFilterLabel,
```

**Badge import** — add to the existing import block (lines 1–10). Badge is not currently imported; add it:
```typescript
import { Badge } from '@/components/ui/badge';
```

**Chip insertion pattern** — place immediately after `<h2>` heading at line 84, before the search `<Input>` div at line 87. The sidebar uses `flex flex-col gap-4` which auto-spaces the chip:
```tsx
// sidebar-filters.tsx line 84 — existing heading
<h2 className="text-xl font-bold font-heading mb-2">Filters</h2>

// ADD AFTER (conditional render — not visibility:hidden):
{autoFilterLabel && (
  <Badge
    variant="outline"
    className="border-primary/40 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/15 dark:text-primary"
    aria-label={`Auto-filter active: ${autoFilterLabel}`}
    role="status"
  >
    {autoFilterLabel}
  </Badge>
)}

// sidebar-filters.tsx line 87 — existing search Input (unchanged)
<div className="relative">
  <Input ... />
```

---

## Shared Patterns

### useMemo for derived values
**Source:** `src/components/decks/deck-builder.tsx` lines 133–143, 172–176, 181–213
**Apply to:** `autoFilter` and `autoFilterLabel` computations in `deck-builder.tsx`
```typescript
// Pattern: stable useMemo with explicit dep array
const someValue = useMemo(() => {
  // pure derivation
}, [dep1, dep2]);
```
All derived values in `deck-builder.tsx` use this shape. The new `autoFilter` and `autoFilterLabel` must follow it to ensure stable object identity and prevent useEffect infinite loops (RESEARCH.md Pitfall 2).

### Inline dispatch + side-effect pattern
**Source:** `src/components/decks/deck-builder.tsx` lines 387, 427 (Remove buttons)
**Apply to:** All three SET_LEADER / SET_BASE dispatch sites
```typescript
// Pattern: arrow function in onClick combines dispatch + state reset
onClick={() => dispatch({ type: 'SET_LEADER', payload: null })}
// Becomes multi-statement:
onClick={() => { dispatch({ type: 'SET_LEADER', payload: null }); setIsAutoFilterOverridden(false); }}
```

### nuqs useQueryState setter (stable ref, safe to omit from deps)
**Source:** `src/components/catalog/catalog-client.tsx` lines 94–107
**Apply to:** The new `useEffect` in `catalog-client.tsx`
```typescript
// All filter params use this pattern:
const [selectedTypes, setSelectedTypes] = useQueryState(
  'types',
  parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: true })
);
// setSelectedTypes has stable identity — do NOT add to useEffect deps (RESEARCH.md Pitfall 1)
```

### Conditional render (not visibility:hidden)
**Source:** `src/components/decks/deck-builder.tsx` lines 451–455 (empty deck state block)
**Apply to:** Auto-filter chip in `sidebar-filters.tsx`
```tsx
// Pattern: && conditional render removes element from DOM entirely
{mainDeck.length === 0 ? (
  <div ...><p>Empty deck.</p><Button ...>Add Cards</Button></div>
) : (...)}
// Same pattern for chip:
{autoFilterLabel && <Badge ...>{autoFilterLabel}</Badge>}
```

---

## No Analog Found

All files have close analogs. No entries in this section.

---

## Metadata

**Analog search scope:** `src/lib/`, `src/components/decks/`, `src/components/catalog/`, `src/components/ui/`
**Files scanned:** 9 source files read in full
**Pattern extraction date:** 2026-05-14

# Phase 15: Deck List Display Polish - Pattern Map

**Mapped:** 2026-05-14
**Files analyzed:** 2 (modified only — no new files created this phase)
**Analogs found:** 2 / 2

---

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `src/components/decks/deck-builder.tsx` | component | request-response + event-driven | `src/components/catalog/card-item.tsx` (hover overlay + Image fill); self (existing useMemo pattern) | exact (Image fill + group-hover); exact (useMemo chaining) |
| `src/components/decks/deck-sidebar.tsx` | component | transform (read-only stats) | `src/components/decks/deck-sidebar.tsx` itself — Types/Arenas breakdown panels (lines 156–179) | exact (same file, same panel pattern) |

---

## Pattern Assignments

### `src/components/decks/deck-builder.tsx` — Plan A: Type Grouping

**Analog:** Self — existing `useMemo` chains in `deck-builder.tsx`

**Existing useMemo pattern to copy** (lines 178–198):
```typescript
// Copy this chaining style — useMemo over state.cards → DeckCard[]
const mainDeck: DeckCard[] = useMemo(() =>
  state.cards
    .filter((c) => !c.isSideboard)
    .map((c) => {
      const card = cardMap.get(c.cardDefinitionId);
      return card ? { card, quantity: c.quantity } : null;
    })
    .filter((c): c is DeckCard => !!c),
  [state.cards, cardMap]
);
```

**New groupedDeck useMemo — place after `mainDeck` useMemo (after line 198):**
```typescript
const groupedDeck = useMemo(() => {
  const groups = {
    groundUnits: [] as DeckCard[],
    spaceUnits:  [] as DeckCard[],
    upgrades:    [] as DeckCard[],
    events:      [] as DeckCard[],
    other:       [] as DeckCard[],
  };
  for (const item of mainDeck) {
    const { card } = item;
    if (card.type === 'Unit' && (card.arenas ?? []).includes('Ground')) {
      groups.groundUnits.push(item);
    } else if (card.type === 'Unit' && (card.arenas ?? []).includes('Space')) {
      groups.spaceUnits.push(item);
    } else if (card.type === 'Upgrade') {
      groups.upgrades.push(item);
    } else if (card.type === 'Event') {
      groups.events.push(item);
    } else {
      groups.other.push(item);
    }
  }
  return groups;
}, [mainDeck]);
```

**Grouped section render — replaces the flat `mainDeck.map(...)` block at lines 386–413:**
```tsx
// Replace the single "Main Deck (N)" heading + flat map with this structure.
// Each section only renders when group length > 0 (D-02).
{(
  [
    { key: 'groundUnits', label: 'Ground Units' },
    { key: 'spaceUnits',  label: 'Space Units'  },
    { key: 'upgrades',    label: 'Upgrades'     },
    { key: 'events',      label: 'Events'       },
    { key: 'other',       label: 'Other'        },
  ] as const
).map(({ key, label }) => {
  const group = groupedDeck[key];
  if (group.length === 0) return null;
  return (
    <div key={key} className="space-y-2">
      <h4 className="text-sm font-semibold text-slate-500 uppercase px-4 pt-2">
        {label} ({group.reduce((s, i) => s + i.quantity, 0)})
      </h4>
      <div className="bg-white border rounded-lg divide-y shadow-sm">
        {group.map((item) => (
          // ... existing card row JSX (copy from lines 387–411 of deck-builder.tsx)
          // Add onMouseEnter/onMouseLeave/onFocus/onBlur handlers for hover preview (Plan B)
        ))}
      </div>
    </div>
  );
})}
```

---

### `src/components/decks/deck-builder.tsx` — Plan B: Leader/Base Art + Hover Preview

**Analog:** `src/components/catalog/card-item.tsx`

**Imports to add** (copy from card-item.tsx line 3, already have `useState` from line 3 of deck-builder.tsx):
```typescript
import Image from 'next/image';
// useState already imported at line 3 of deck-builder.tsx
```

**Hover state — add alongside existing useState declarations (lines 124–126):**
```typescript
const [hoveredCard, setHoveredCard] = useState<Card | null>(null);
```

**Leader art slot — replaces the `{leader ? <div className="text-center p-4"> ... </div> : ...}` block at lines 348–357.**

The outer dashed-box `div` at line 347 currently has `overflow-hidden` but is missing `relative`. Add `relative` to it:
```tsx
// BEFORE (line 347):
<div className="aspect-[3/4] border-2 border-dashed rounded-lg flex items-center justify-center bg-white shadow-sm overflow-hidden">

// AFTER — add `relative` and remove `flex items-center justify-center` (Image fill manages its own layout):
<div className="aspect-[3/4] border-2 border-dashed rounded-lg bg-white shadow-sm overflow-hidden relative group">
  {leader?.frontArtUrl ? (
    <div className="relative w-full h-full">
      <Image
        src={leader.frontArtUrl}
        alt={leader.name}
        fill
        sizes="(max-width: 768px) 50vw, 192px"
        className="object-cover"
      />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 flex items-center justify-center z-10">
        <Button
          variant="ghost"
          size="sm"
          className="text-white bg-black/30 hover:bg-black/50 border border-white/20"
          aria-label={`Remove ${leader.name} as leader`}
          onClick={() => dispatch({ type: 'SET_LEADER', payload: null })}
        >
          Remove
        </Button>
      </div>
    </div>
  ) : leader ? (
    // Card selected but no art URL — fall back to text placeholder (Pitfall 3)
    <div className="flex items-center justify-center w-full h-full">
      <div className="text-center p-4">
        <p className="font-bold text-lg">{leader.name}</p>
        {leader.subtitle && <p className="text-sm text-slate-500">{leader.subtitle}</p>}
        <Button variant="ghost" size="sm" className="mt-4 text-red-500 hover:text-red-700"
          onClick={() => dispatch({ type: 'SET_LEADER', payload: null })}>Remove</Button>
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center w-full h-full">
      <p className="text-slate-400 text-sm">No Leader Selected</p>
    </div>
  )}
</div>
```

**Base art slot — same pattern; the outer div at line 361 additionally has `md:aspect-[4/3]`:**
```tsx
// Same structure as leader slot above, substituting `base` / `SET_BASE` / "base" / "No Base Selected"
// Outer div: className="aspect-[3/4] md:aspect-[4/3] border-2 border-dashed rounded-lg bg-white shadow-sm overflow-hidden relative group"
```

**Group hover overlay source** (`card-item.tsx` lines 103–105):
```typescript
// The established overlay structure — copy this exact Tailwind class sequence:
<div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 flex items-center justify-center z-10">
```

**Hover preview panel — wraps the editor content at line 342.**

The current root at line 342 is:
```tsx
<div className="max-w-4xl mx-auto space-y-8 p-6 pb-20">
```

Refactor to:
```tsx
<div className="max-w-4xl mx-auto p-6 pb-20">
  <div className="flex flex-row gap-6 items-start">
    {/* Preview panel — desktop only, sticky */}
    <div className="hidden md:block w-48 shrink-0 sticky top-0">
      {hoveredCard?.frontArtUrl ? (
        <div className="aspect-[2/3] rounded-lg overflow-hidden relative transition-opacity duration-150">
          <Image
            src={hoveredCard.frontArtUrl}
            alt={hoveredCard.name}
            fill
            sizes="192px"
            className="object-cover"
          />
        </div>
      ) : null}
    </div>

    {/* Main content block — retains space-y-8 internally */}
    <div className="flex-1 space-y-8">
      {/* Leader & Base slot grid — unchanged except art slot content above */}
      {/* Grouped card sections (Plan A) */}
      {/* Sideboard — unchanged */}
    </div>
  </div>

  {/* Mobile fixed bottom bar (D-13) — shown when hoveredCard set via tap/focus */}
  {hoveredCard && (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-24 bg-white border-t z-50 flex items-center gap-4 px-4">
      {hoveredCard.frontArtUrl && (
        <div className="relative h-20 w-14 shrink-0 rounded overflow-hidden">
          <Image src={hoveredCard.frontArtUrl} alt={hoveredCard.name} fill sizes="56px" className="object-cover" />
        </div>
      )}
      <span className="font-medium text-sm">{hoveredCard.name}</span>
    </div>
  )}
</div>
```

**Card row hover handlers — add to existing row `div` at lines 387–411:**
```tsx
// Existing row div (line 387):
<div key={item.card.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">

// Add tabIndex + hover/focus handlers:
<div
  key={item.card.id}
  className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors"
  tabIndex={0}
  onMouseEnter={() => setHoveredCard(item.card)}
  onMouseLeave={() => setHoveredCard(null)}
  onFocus={() => setHoveredCard(item.card)}
  onBlur={() => setHoveredCard(null)}
  onTouchStart={() => setHoveredCard(item.card)}
>
```

---

### `src/components/decks/deck-sidebar.tsx` — Plan C: Aspect Breakdown Panel

**Analog:** `src/components/decks/deck-sidebar.tsx` — existing Types breakdown panel (lines 157–166)

**Exact source to copy** (lines 157–166):
```tsx
<div>
  <h3 className="text-sm font-semibold uppercase text-slate-500 mb-2">Types</h3>
  <div className="space-y-1">
    {Object.entries(validation.stats.typeCounts).map(([type, count]) => (
      <div key={type} className="flex justify-between text-sm">
        <span className="text-slate-600">{type}</span>
        <span className="font-medium">{count}</span>
      </div>
    ))}
  </div>
</div>
```

**New Aspects panel — insert after the closing `</div>` of the Types/Arenas `grid` (after line 179), before the `<div className="mt-auto pt-6 space-y-2">` save buttons block (line 182):**
```tsx
{/* Aspect Breakdown — D-04, D-05, D-06 */}
{Object.entries(validation.stats.aspectCounts).filter(([aspect]) => aspect !== 'Basic').length > 0 && (
  <div>
    <h3 className="text-sm font-semibold uppercase text-slate-500 mb-2">Aspects</h3>
    <div className="space-y-1">
      {Object.entries(validation.stats.aspectCounts)
        .filter(([aspect]) => aspect !== 'Basic')
        .sort(([, a], [, b]) => b - a)
        .map(([aspect, count]) => (
          <div key={aspect} className="flex justify-between text-sm">
            <span className="text-slate-600">{aspect}</span>
            <span className="font-medium">{count}</span>
          </div>
        ))}
    </div>
  </div>
)}
```

**Placement context** (lines 179–182 of deck-sidebar.tsx):
```tsx
// Line 179: closing </div> of the grid grid-cols-2 breakdown block
        </div>   {/* ← end of Types/Arenas grid */}
      </div>     {/* ← end of space-y-6 stats container */}

      <div className="mt-auto pt-6 space-y-2">   {/* ← save buttons */}
```
The Aspects panel must go INSIDE the `<div className="space-y-6">` block (line 87), after the Types/Arenas grid closes — NOT after the outer `</div>`. Wrap it as a sibling to the existing breakdown grid.

---

## Shared Patterns

### Next.js `Image` with `fill` (cross-cutting — all art slots)

**Source:** `src/components/catalog/card-item.tsx` lines 79–99

```typescript
// Required wrapper structure (all three conditions must hold):
// 1. Parent div has `relative` (or absolute/fixed)
// 2. Parent div has `overflow-hidden`
// 3. Parent div has explicit dimensions (aspect-ratio class counts)
<div className="relative rounded-md overflow-hidden bg-muted">
  {displayUrl && (
    <Image
      src={displayUrl}
      alt={name}
      fill
      sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 10vw"
      className="object-cover transition-opacity duration-300"
      onLoad={() => setLoaded(true)}
      onError={() => setLoaded(true)}
    />
  )}
</div>
```

**Apply to:** Leader art slot, Base art slot, hover preview panel (all in `deck-builder.tsx`).

### Group Hover Overlay (cross-cutting — leader and base art slots)

**Source:** `src/components/catalog/card-item.tsx` lines 70–71, 103–105

```typescript
// Outer wrapper gets `group` class; overlay div uses group-hover:opacity-100
<div className="group relative">
  {/* image */}
  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 flex items-center justify-center z-10">
    {/* Remove button */}
  </div>
</div>
```

**Apply to:** Leader art slot and Base art slot in `deck-builder.tsx` (D-10).

### `ValidationStats.aspectCounts` Data Shape

**Source:** `src/lib/deck-validation.ts` lines 34–40, 116–117

```typescript
export interface ValidationStats {
  costCurve: Record<number, number>;
  sideboardCostCurve: Record<number, number>;
  typeCounts: Record<string, number>;
  aspectCounts: Record<string, number>;  // keyed by aspect name (e.g. "Aggression", "Basic")
  arenaCounts: Record<string, number>;
}
// Populated at line 117:
stats.aspectCounts[aspect] = (stats.aspectCounts[aspect] || 0) + quantity;
// "Basic" IS included in this map — must filter it out in the UI (D-05)
```

**Apply to:** Aspects panel in `deck-sidebar.tsx`.

---

## No Analog Found

None — all features have direct analogs in the existing codebase.

---

## Test File Patterns

**Existing test to copy structure from:** `__tests__/api-deck-validation.test.ts` lines 1–19

```typescript
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
// ... vi.mock() for external deps
// describe() → beforeEach(vi.clearAllMocks) → it() blocks
```

**New test files needed (Wave 0 gaps from RESEARCH.md):**
- `__tests__/deck-grouping.test.ts` — pure unit test for `groupedDeck` derivation logic and `frontArtUrl` null guard (REQ-DECK-07, REQ-DECK-10). No DOM/React rendering needed — extract the group derivation to a standalone function and import it.
- `__tests__/aspect-panel.test.ts` — pure unit test for Basic exclusion, sort order, numeric counts (REQ-DECK-08). Test against `validateDeck()` output directly.

---

## Metadata

**Analog search scope:** `src/components/decks/`, `src/components/catalog/`, `src/lib/`, `__tests__/`
**Files read:** `deck-builder.tsx` (485 lines), `deck-sidebar.tsx` (200 lines), `card-item.tsx` (269 lines), `deck-validation.ts` (first 130 lines), `api-deck-validation.test.ts` (first 60 lines)
**Pattern extraction date:** 2026-05-14

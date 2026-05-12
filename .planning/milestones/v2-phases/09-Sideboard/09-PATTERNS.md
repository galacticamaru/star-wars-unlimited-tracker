# Phase 9: Sideboard - Pattern Map

**Mapped:** 2026-05-11
**Files analyzed:** 3
**Analogs found:** 3 / 3

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/decks/deck-builder.tsx` | component | event-driven (reducer) | self — extend in place | exact (self) |
| `src/components/decks/deck-sidebar.tsx` | component | transform (stats → chart) | self — extend in place | exact (self) |
| `src/lib/deck-validation.ts` | utility | transform (deck → ValidationResult) | self — extend in place | exact (self) |

All three files already exist and are extended, not replaced. No net-new file requires an external analog.

---

## Pattern Assignments

### `src/components/decks/deck-builder.tsx` (component, event-driven reducer)

**Analog:** self — read above in full

#### Existing reducer action for card mutation (lines 45-60)

```typescript
case 'UPDATE_CARD': {
  const existingIndex = state.cards.findIndex(
    (c) => c.cardDefinitionId === action.payload.cardDefinitionId && c.isSideboard === action.payload.isSideboard
  );
  const newCards = [...state.cards];
  if (existingIndex >= 0) {
    if (action.payload.quantity <= 0) {
      newCards.splice(existingIndex, 1);
    } else {
      newCards[existingIndex] = { ...newCards[existingIndex], quantity: action.payload.quantity };
    }
  } else if (action.payload.quantity > 0) {
    newCards.push(action.payload);
  }
  return { ...state, cards: newCards };
}
```

**Move-to-SB handler pattern to add** — modeled on `handleDeckUpdate` (lines 159-170). Two dispatches: decrement main, increment SB. Use the same `UPDATE_CARD` action type; `isSideboard` differentiates the slot:

```typescript
// New handler — place next to handleDeckUpdate
const handleMoveToSideboard = (cardDefinitionId: number) => {
  const mainEntry = state.cards.find(c => c.cardDefinitionId === cardDefinitionId && !c.isSideboard);
  if (!mainEntry) return;
  dispatch({ type: 'UPDATE_CARD', payload: { cardDefinitionId, quantity: mainEntry.quantity - 1, isSideboard: false } });
  const sbEntry = state.cards.find(c => c.cardDefinitionId === cardDefinitionId && c.isSideboard);
  dispatch({ type: 'UPDATE_CARD', payload: { cardDefinitionId, quantity: (sbEntry?.quantity ?? 0) + 1, isSideboard: true } });
};

const handleMoveToMain = (cardDefinitionId: number) => {
  const sbEntry = state.cards.find(c => c.cardDefinitionId === cardDefinitionId && c.isSideboard);
  if (!sbEntry) return;
  dispatch({ type: 'UPDATE_CARD', payload: { cardDefinitionId, quantity: sbEntry.quantity - 1, isSideboard: true } });
  const mainEntry = state.cards.find(c => c.cardDefinitionId === cardDefinitionId && !c.isSideboard);
  dispatch({ type: 'UPDATE_CARD', payload: { cardDefinitionId, quantity: (mainEntry?.quantity ?? 0) + 1, isSideboard: false } });
};
```

#### Existing main deck card row in Deck List editor (lines 321-337)

```tsx
mainDeck.map((item) => (
  <div key={item.card.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center font-bold text-indigo-600">
        {item.quantity}x
      </div>
      <div>
        <p className="font-medium">{item.card.name}</p>
        <p className="text-xs text-slate-500">{item.card.type} • {item.card.cost} Cost</p>
      </div>
    </div>
    <div className="flex gap-1">
      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => dispatch({ type: 'UPDATE_CARD', payload: { cardDefinitionId: item.card.id, quantity: item.quantity - 1, isSideboard: false } })}>-</Button>
      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => dispatch({ type: 'UPDATE_CARD', payload: { cardDefinitionId: item.card.id, quantity: item.quantity + 1, isSideboard: false } })}>+</Button>
    </div>
  </div>
))
```

**Extend the `<div className="flex gap-1">` block** by appending a "Move to SB" button after the `+` button, using the same `Button` import and `variant="outline" size="sm"`:

```tsx
<Button
  variant="outline"
  size="sm"
  className="h-8 text-xs text-amber-600 border-amber-300 hover:bg-amber-50"
  onClick={() => handleMoveToSideboard(item.card.id)}
>
  Move to SB
</Button>
```

#### Sideboard section to add below the existing Card List block (after line 341)

Pattern: same container/header/row structure as main deck (`space-y-4`, `bg-white border rounded-lg divide-y shadow-sm`). Empty-state text follows the same `p-12 text-center text-slate-400` pattern used in the main deck empty state (lines 315-320):

```tsx
{/* Sideboard */}
<div className="space-y-4">
  <div className="flex justify-between items-center">
    <h3 className="text-lg font-bold">
      Sideboard ({sideboard.reduce((s, i) => s + i.quantity, 0)} / 10)
    </h3>
  </div>
  <div className="bg-white border rounded-lg divide-y shadow-sm">
    {sideboard.length === 0 ? (
      <div className="p-12 text-center text-slate-400">
        <p>No sideboard cards yet. Click &apos;Move to SB&apos; on a main deck card to add one.</p>
      </div>
    ) : (
      sideboard.map((item) => (
        <div key={item.card.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded bg-amber-100 flex items-center justify-center font-bold text-amber-600">
              {item.quantity}x
            </div>
            <div>
              <p className="font-medium">{item.card.name}</p>
              <p className="text-xs text-slate-500">{item.card.type} • {item.card.cost} Cost</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => dispatch({ type: 'UPDATE_CARD', payload: { cardDefinitionId: item.card.id, quantity: item.quantity - 1, isSideboard: true } })}>-</Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => dispatch({ type: 'UPDATE_CARD', payload: { cardDefinitionId: item.card.id, quantity: item.quantity + 1, isSideboard: true } })}>+</Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs text-indigo-600 border-indigo-300 hover:bg-indigo-50"
              onClick={() => handleMoveToMain(item.card.id)}
            >
              Move to Main
            </Button>
          </div>
        </div>
      ))
    )}
  </div>
</div>
```

---

### `src/components/decks/deck-sidebar.tsx` (component, transform)

**Analog:** self — read above in full

#### Existing card count display (line 72)

```tsx
<span className="text-sm text-slate-500">{totalMain} / 50 cards</span>
```

**Replace with** two-line breakdown (D-08). Add `totalSideboard` computed alongside `totalMain` (line 35):

```tsx
// Add next to: const totalMain = mainDeck.reduce(...)
const totalSideboard = sideboard.reduce((sum, item) => sum + item.quantity, 0);
```

```tsx
// Replace the single <span> with:
<span className="text-sm text-slate-500">
  {totalMain} / 50 main • {totalSideboard} / 10 sideboard
</span>
```

#### Existing cost curve chart (lines 120-139)

The full bar column structure to extend:

```tsx
<div className="flex items-end gap-1 h-24 px-2 border-b border-l border-slate-200">
  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((cost) => {
    const count = validation.stats.costCurve[cost] || 0;
    const height = Math.min((count / 12) * 100, 100);
    return (
      <div key={cost} className="flex-1 h-full flex flex-col justify-end items-center gap-1 group">
        <div 
          className="w-full bg-slate-400 group-hover:bg-indigo-500 transition-all rounded-t-sm" 
          style={{ height: `${count > 0 ? Math.max(height, 4) : 0}%` }}
          title={`${count} cards with cost ${cost}${cost === 9 ? '+' : ''}`}
        />
        <span className="text-[10px] text-slate-400 leading-none mb-[-20px] pb-1">{cost === 9 ? '9+' : cost}</span>
      </div>
    );
  })}
</div>
```

**Stacked bar pattern** — add a sideboard bar inside the same column `div`, above the main bar. Access `validation.stats.sideboardCostCurve` (added in deck-validation.ts). Stack order in DOM: sideboard div first (renders on top visually when using `flex-col justify-end`):

```tsx
{[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((cost) => {
  const count = validation.stats.costCurve[cost] || 0;
  const sbCount = validation.stats.sideboardCostCurve[cost] || 0;
  const total = count + sbCount;
  const mainHeight = Math.min((count / 12) * 100, 100);
  const sbHeight = Math.min((sbCount / 12) * 100, 100);
  return (
    <div key={cost} className="flex-1 h-full flex flex-col justify-end items-center gap-0 group">
      {sbCount > 0 && (
        <div
          className="w-full bg-amber-400 rounded-t-sm"
          style={{ height: `${Math.max(sbHeight, 4)}%` }}
          title={`${sbCount} sideboard cards with cost ${cost}${cost === 9 ? '+' : ''}`}
        />
      )}
      <div 
        className="w-full bg-slate-400 group-hover:bg-indigo-500 transition-all rounded-t-sm" 
        style={{ height: `${count > 0 ? Math.max(mainHeight, 4) : 0}%` }}
        title={`${count} main deck cards with cost ${cost}${cost === 9 ? '+' : ''}`}
      />
      <span className="text-[10px] text-slate-400 leading-none mb-[-20px] pb-1">{cost === 9 ? '9+' : cost}</span>
    </div>
  );
})}
```

**Legend to add** below `<div className="h-4" />` (after line 138). Uses amber-400 and slate-400 to match bar colors, consistent with existing amber warning styling (`text-amber-600 bg-amber-50`) already in the file:

```tsx
<div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
  <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-slate-400" /> Main</span>
  <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-amber-400" /> Sideboard</span>
</div>
```

---

### `src/lib/deck-validation.ts` (utility, transform)

**Analog:** self — read above in full

#### Existing `ValidationStats` interface (lines 33-38)

```typescript
export interface ValidationStats {
  costCurve: Record<number, number>;
  typeCounts: Record<string, number>;
  aspectCounts: Record<string, number>;
  arenaCounts: Record<string, number>;
}
```

**Add `sideboardCostCurve`** field (D-11):

```typescript
export interface ValidationStats {
  costCurve: Record<number, number>;
  sideboardCostCurve: Record<number, number>;   // NEW
  typeCounts: Record<string, number>;
  aspectCounts: Record<string, number>;
  arenaCounts: Record<string, number>;
}
```

#### Existing `stats` initializer inside `validateDeck` (lines 58-63)

```typescript
const stats: ValidationStats = {
  costCurve: {},
  typeCounts: {},
  aspectCounts: {},
  arenaCounts: {},
};
```

**Extend with** `sideboardCostCurve: {}` matching the same pattern.

#### Existing `processCard` — `isMain` branch that populates `costCurve` (lines 100-104)

```typescript
if (isMain) {
  if (card.cost !== null) {
    const costKey = Math.min(card.cost, 9);
    stats.costCurve[costKey] = (stats.costCurve[costKey] || 0) + quantity;
  }
  // ...
}
```

**Add parallel sideboard branch** using the same capping logic (D-11). The `else` branch executes for sideboard cards (already called with `isMain: false`):

```typescript
} else {
  // Sideboard stats
  if (card.cost !== null) {
    const costKey = Math.min(card.cost, 9);
    stats.sideboardCostCurve[costKey] = (stats.sideboardCostCurve[costKey] || 0) + quantity;
  }
}
```

#### Existing final error checks loop (lines 131-135)

```typescript
for (const [swudbId, data] of cardQuantities.entries()) {
  if (data.quantity > data.maxAllowed) {
    errors.push(`Exceeded ${data.maxAllowed} copies of ${data.name}`);
  }
}
```

**Add sideboard total check after this loop** (D-09):

```typescript
const sideboardTotal = sideboard.reduce((sum, item) => sum + item.quantity, 0);
if (sideboardTotal > 10) {
  errors.push('Sideboard cannot exceed 10 cards');
}
```

---

## Shared Patterns

### Button component usage
**Source:** `src/components/decks/deck-builder.tsx` lines 6, 333-334
**Apply to:** All new buttons in deck-builder.tsx
```tsx
import { Button } from '@/components/ui/button';
// Size options in use: size="icon" (h-8 w-8), size="sm", size="sm" with explicit h-8
// All action buttons: variant="outline"
// Destructive: variant="ghost" className="text-red-500 hover:text-red-700"
```

### Amber color palette (already in sidebar)
**Source:** `src/components/decks/deck-sidebar.tsx` lines 109-113
**Apply to:** Sideboard bar, sideboard badge/qty, Move to SB button tint, legend swatch
```tsx
// Already used for warnings:
className="flex gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-100"
// New sideboard uses: bg-amber-400 (bar), bg-amber-100 (qty badge), text-amber-600 (qty text),
//   border-amber-300 (button border), hover:bg-amber-50 (button hover)
```

### Test file structure
**Source:** `src/lib/deck-validation.test.ts` lines 1-31
**Apply to:** New test cases for sideboard limit and `sideboardCostCurve`
```typescript
import { describe, it, expect } from 'vitest';
import { validateDeck, Card, DeckCard } from './deck-validation';

const createCard = (overrides: Partial<Card>): Card => ({
  // ...full defaults shown in file lines 6-31
  ...overrides,
});
// Pattern: describe block → it blocks → validateDeck(leader, base, mainDeck, sideboard)
// Assert on result.errors / result.stats.sideboardCostCurve
```

---

## No Analog Found

None. All three files are direct extensions of existing code. The patterns are self-contained within the files being modified.

---

## Metadata

**Analog search scope:** `src/components/decks/`, `src/lib/`
**Files scanned:** 7 (deck-builder.tsx, deck-sidebar.tsx, deck-validation.ts, deck-validation.test.ts, want-list-tab.tsx, decks-client.tsx, utils.ts)
**Pattern extraction date:** 2026-05-11

# Phase 30: Unified Search-Driven Add Flow - Pattern Map

**Mapped:** 2026-07-19
**Files analyzed:** 5 (2 modified, 1 extended in place, 1 removed, 1 unmodified for context)
**Analogs found:** 5 / 5 (all analogs are in-repo, self-referential — this phase mostly extends its own predecessor files)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/app/binder/manage/page.tsx` (modified) | controller (client page) | request-response + CRUD (optimistic) | itself (current version) | exact — same file, in-place rework |
| `src/components/binder/variant-trade-sheet.tsx` (extended) | component (Sheet container) | request-response | itself (current version) | exact — same file, extended in place |
| `src/components/catalog/variant-trade-section.tsx` (used unchanged, referenced for the new want-quantity section pattern) | component (stepper section) | CRUD | same file, copy-paste pattern for new "want" section | exact — near-identical twin section needed |
| new want-quantity section inside/near `variant-trade-sheet.tsx` (e.g. `variant-want-section.tsx` or inline) | component (stepper section) | CRUD | `src/components/catalog/variant-trade-section.tsx` | exact role/data-flow match, only endpoint + copy differ |
| `src/components/binder/manual-wants-add-flow.tsx` (deleted) | component (search + select) | request-response | n/a — being removed, its search/select logic is absorbed into `manage/page.tsx` unified search | superseded — reference implementation for search filtering rules only |
| `src/components/binder/manage-trade-card.tsx` (reused unchanged) | component (art tile) | display + CRUD (inline stepper) | itself | exact — reused as-is per D-04 |
| `/api/cards/all` route + `getAllCards()` query (consumed, not modified) | service/query (route + db query) | CRUD (read) | n/a, already exists | exact — reused as-is |
| `/api/collection/owned-cards` route + `getOwnedCardDefinitions()` (consumed, not modified) | service/query (route + db query) | CRUD (read) | n/a, already exists | exact — reused as-is |

## Pattern Assignments

### `src/app/binder/manage/page.tsx` (controller, request-response + CRUD)

**Analog:** itself (current version, lines 1-488)

**Imports pattern** (lines 1-14):
```typescript
'use client';

import { useState, useEffect, useMemo } from 'react';
import { authClient } from '@/lib/auth-client';
import { ManageTradeCard } from '@/components/binder/manage-trade-card';
import { ManageWantsList } from '@/components/binder/manage-wants-list';
import { VariantTradeSheet } from '@/components/binder/variant-trade-sheet';
import { ManualWantsAddFlow } from '@/components/binder/manual-wants-add-flow'; // REMOVE this import
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, Search, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
```
Keep everything except the `ManualWantsAddFlow` import (delete it). No new packages needed — reuse `Loader2`/`Search` from lucide-react already imported.

**Lazy full-catalog fetch pattern to add (D-01/D-02).** Model the new "first keystroke" fetch on the existing mount-time fetch at lines 92-117, but gate it behind a `hasFetchedCatalog` ref/flag and trigger from the search input's `onChange` instead of `useEffect([session])`:
```typescript
// existing mount-time fetch pattern (lines 92-117) — copy the Promise.all + try/catch/finally shape,
// but move the trigger to the search box's onChange once query.length >= 2 and catalog not yet loaded
const [binderRes, ownedRes] = await Promise.all([
  fetch('/api/binder'),                    // existing — keep for Trade Offerings + Wants
  fetch('/api/collection/owned-cards'),    // existing — keep, also reused for ownership merge
]);
// NEW: add a third parallel fetch, gated on first keystroke, not on mount
fetch('/api/cards/all')
```
Reuse the `isLoading` boolean pattern (line 78, `isLoading`/`setIsLoading`) for the new `catalogLoading` state that drives the "Loading catalog..." copy from UI-SPEC.

**Debounce pattern (D-02, 150ms)** — search Phase 24 catalog page/component for the exact debounce implementation already used elsewhere in the codebase (referenced in CONTEXT.md as "matches the existing catalog search debounce"); reuse that `useEffect` + `setTimeout`/`clearTimeout` shape rather than inventing a new one. If a `useDebounce` hook exists under `src/hooks/`, prefer that; otherwise inline `setTimeout(() => setDebounced(query), 150)` with cleanup, mirroring whatever Phase 24 already shipped.

**Optimistic update pattern — reuse unchanged** (lines 140-199 `updateTradeQuantity`, lines 201-248 `updateWantQuantity`):
```typescript
const updateTradeQuantity = async (cardPrintingId: number, tradeQuantity: number) => {
  const res = await fetch('/api/trade', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardPrintingId, tradeQuantity }),
  });
  if (res.ok) {
    // ... optimistic setOwnedCards + setTradeData updates (keep exactly as-is)
  }
};

const updateWantQuantity = async (cardPrintingId: number, quantity: number) => {
  const res = await fetch('/api/binder/wants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardPrintingId, quantity }),
  });
  if (res.ok) {
    // ... optimistic setTradeData updates (keep exactly as-is)
  }
};
```
Both handlers stay driving the new sheet unchanged (CONTEXT.md "Reusable Assets"). The card-lookup fallback (`ownedCards.find(c => c.printings.some(...))`) inside each will need to also check the new catalog-backed dataset when the printing wasn't previously in `ownedCards` (i.e. an unowned variant being wanted for the first time) — extend the lookup, don't replace the pattern.

**Search + filter pattern to replace** (lines 285-294 `filteredCards` useMemo) — reuse the `useMemo` + case-insensitive `.includes()` shape, but source from the merged catalog+owned dataset instead of `ownedCards`, and add the 2-char gate + ~20 cap:
```typescript
const filteredCards = useMemo(() => {
  if (searchTerm.trim().length === 0) return ownedCards;  // OLD — replace gate with `< 2` returns []
  const q = searchTerm.toLowerCase();
  return ownedCards.filter(               // OLD — replace source with merged catalog rows
    c =>
      c.name.toLowerCase().includes(q) ||
      (c.subtitle?.toLowerCase().includes(q) ?? false)
  );
}, [ownedCards, searchTerm]);
// NEW: add `.slice(0, 20)` and a `wasTruncated = matches.length > 20` companion value for the cap note
```

**Grid rendering pattern to reuse for results** (lines 379-415, the current owned-card grid mapping to `ManageTradeCard`):
```typescript
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
  {filteredCards.map(card => {
    const totalTradeQty = card.printings.reduce((sum, p) => sum + p.tradeQuantity, 0);
    return (
      <div key={card.cardDefinitionId} className="cursor-pointer" onClick={() => setSheetCard(card)}>
        <ManageTradeCard
          id={card.printings.length === 1 ? card.printings[0].id : card.cardDefinitionId}
          name={card.name}
          type={card.type}
          frontArtUrl={card.bestArtUrl}
          tradeQuantity={totalTradeQty}
          variantType={card.bestVariantType}
          onUpdateTradeQuantity={
            card.printings.length === 1
              ? (_, qty) => updateTradeQuantity(card.printings[0].id, qty)
              : () => setSheetCard(card)
          }
        />
      </div>
    );
  })}
</div>
```
Keep this shape exactly for the new unified results grid; the difference is the source array (`filteredCards` from merged catalog+owned) and that unowned cards will have `totalTradeQty === 0` / `ownedCount === 0` on all printings, which is fine since the tile still renders (badge shows 0, disabled add-to-trade happens in the sheet, not the tile).

**Empty/gating states to reuse** (lines 364-377, dashed-border empty state):
```typescript
<div className="py-12 text-center border-2 border-dashed rounded-lg space-y-1">
  <p className="text-sm font-semibold">No cards found</p>
  <p className="text-xs text-muted-foreground">Try a different search term.</p>
</div>
```
Reuse this exact block for the new "No cards found" empty state and adapt copy for the pre-2-char hint / error state per UI-SPEC copywriting contract.

**Sections to delete:**
- Lines 344-418: the whole "Add Cards to Binder" `Card` (replaced by the new "Add Cards & Wants" unified `Card`).
- Lines 444-459: the "Add Manual Want" `Card` wrapping `<ManualWantsAddFlow .../>` (deleted entirely per D-08 / UI-SPEC layout contract).
- Line 8 import of `ManualWantsAddFlow`.

**Sheet wiring to change** (lines 473-485):
```typescript
<VariantTradeSheet
  open={sheetOpen}
  onOpenChange={(o) => { if (!o) closeSheet(); }}
  cardName={sheetCard?.name ?? ''}
  cardSubtitle={sheetCard?.subtitle ?? null}
  printings={
    sheetCard
      ? sheetCard.printings.filter(p => p.ownedCount > 0)   // REMOVE this filter (D-05)
      : []
  }
  onTradeQuantityChange={updateTradeQuantity}
  // ADD: onWantQuantityChange={updateWantQuantity}
/>
```

---

### `src/components/binder/variant-trade-sheet.tsx` (component, request-response)

**Analog:** itself, current version (lines 1-57)

**Full current file, to be extended, not replaced:**
```typescript
'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { VariantCollectionSection } from '@/components/catalog/variant-collection-section';
import { VariantTradeSection } from '@/components/catalog/variant-trade-section';

interface SheetPrinting {
  id: number;
  variantType: string;
  ownedCount: number;
  tradeQuantity: number;
}

interface VariantTradeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardName: string;
  cardSubtitle: string | null;
  printings: SheetPrinting[];
  onTradeQuantityChange: (cardPrintingId: number, tradeQuantity: number) => void;
}

export function VariantTradeSheet({ open, onOpenChange, cardName, cardSubtitle, printings, onTradeQuantityChange }: VariantTradeSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-sm overflow-y-auto flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="text-xl font-bold font-heading">{cardName}</SheetTitle>
          {cardSubtitle && (
            <SheetDescription className="text-sm text-muted-foreground italic">{cardSubtitle}</SheetDescription>
          )}
        </SheetHeader>
        {printings.length === 0 ? (
          <p className="px-6 py-4 text-sm text-muted-foreground">No owned printings to display.</p>
        ) : (
          <div className="px-6 py-6 flex flex-col gap-6">
            <VariantCollectionSection printings={printings} />
            <VariantTradeSection printings={printings} onQuantityChange={onTradeQuantityChange} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

**Required changes:**
1. Add `quantity: number` (want quantity) to `SheetPrinting` and add `onWantQuantityChange: (cardPrintingId: number, quantity: number) => void` to props.
2. Add a new section — a `VariantWantSection` component (new file, see below), rendered alongside `VariantTradeSection` inside the `flex flex-col gap-6` container.
3. The empty-state copy ("No owned printings to display") no longer applies once unowned printings are shown — printings.length will basically never be 0 now that all variants render; keep the guard only for the pathological case of a card with zero printings (shouldn't happen), or repurpose to "No printings found for this card."
4. `VariantTradeSection`/new `VariantWantSection` need a per-row `disabled` capability for the trade stepper when `ownedCount === 0` — this must be threaded through as a prop change to `VariantTradeSection` (see below), not duplicated logic in the Sheet.

---

### New want-quantity section (component, CRUD) — copy from `VariantTradeSection`

**Analog:** `src/components/catalog/variant-trade-section.tsx` (full file, lines 1-126, reproduced above in File Classification context)

This is a near line-for-line twin. Concrete diffs to apply when creating the new want section (whether as a new file `variant-want-section.tsx` or as a second render mode of a generalized section component):

| Aspect | `VariantTradeSection` (existing) | New want section |
|---|---|---|
| Section label | `"Available for Trade"` | `"Want"` (per UI-SPEC copywriting) |
| Endpoint | `PATCH /api/trade` with `{ cardPrintingId, tradeQuantity }` | `POST /api/binder/wants` with `{ cardPrintingId, quantity }` |
| Initial counts source | `printing.tradeQuantity` | `printing.quantity` (manual want quantity — needs to be threaded into the merged printing shape) |
| Status text active/inactive | `"Trading"` / `"Not trading"` | `"Wanted"` / `"Not wanted"` (per UI-SPEC "new Wanted / analogous indicator") |
| Disabled state | none (always enabled) | none — **always enabled per D-06/D-07**, no gating needed here (gating only applies to the trade stepper) |
| Button/input/status row anatomy | `w-28` label, `size="icon"` outline Button pair, `w-16` centered Input, status span | identical — copy verbatim |

**Exact optimistic-update block to copy (lines 31-64 of `variant-trade-section.tsx`), replacing endpoint/body/callback name:**
```typescript
const updateVariant = async (cardPrintingId: number, newCount: number) => {
  if (!isAuthenticated) { router.push('/login'); return; }
  const val = Math.max(0, newCount);
  const prev = counts[cardPrintingId] ?? 0;
  setCounts(c => ({ ...c, [cardPrintingId]: val }));
  try {
    const res = await fetch('/api/binder/wants', {          // CHANGED endpoint
      method: 'POST',                                          // CHANGED method
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardPrintingId, quantity: val }), // CHANGED body key
    });
    if (!res.ok) {
      setCounts(c => ({ ...c, [cardPrintingId]: prev }));
      console.error('Failed to update want quantity:', await res.text());
    } else {
      onQuantityChange?.(cardPrintingId, val);
      router.refresh();
    }
  } catch (err) {
    setCounts(c => ({ ...c, [cardPrintingId]: prev }));
    console.error('Failed to update want quantity:', err);
  }
};
```

**Disabled-trade-stepper variant needed in `VariantTradeSection` itself** (new requirement, D-06) — add an optional per-row disabled state driven by `ownedCount === 0`:
```typescript
// In the per-row render (lines 78-121 of variant-trade-section.tsx), add:
const isOwned = printing.ownedCount > 0;   // requires ownedCount added to this component's Printing interface
// ...
<Button variant="outline" size="icon" onClick={...} disabled={count === 0 || !isOwned} ... />
<Input ... disabled={!isOwned} ... />
<Button variant="outline" size="icon" onClick={...} disabled={!isOwned} ... />
{!isOwned && (
  <span className="text-xs text-muted-foreground">You don&apos;t own this variant</span>  // exact copy per D-06/UI-SPEC
)}
```
This requires passing `ownedCount` down into `VariantTradeSection`'s `Printing` interface (currently only has `tradeQuantity`), sourced from the same printing row already used by `VariantCollectionSection` (which already has `ownedCount`).

---

### `src/components/binder/manual-wants-add-flow.tsx` (deleted — reference only)

**Analog:** itself (current version, lines 1-178) — being removed, but its search-filter and 2-char-gate logic is the direct precedent for the new unified search in `manage/page.tsx`.

**Reusable filter-gate snippet (lines 30-39):**
```typescript
const filteredResults =
  query.trim().length >= 2
    ? ownedCards.filter(c => {
        const q = query.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          (c.subtitle?.toLowerCase().includes(q) ?? false)
        );
      })
    : [];
```
This is the exact 2-character-gate pattern D-02 specifies — port it into `manage/page.tsx`'s new `filteredCards`/search logic verbatim (name + subtitle, case-insensitive, `>= 2` gate), just swap `ownedCards` for the merged catalog dataset and add the `.slice(0, 20)` cap.

After porting the pattern, delete this entire file and its import/usage in `manage/page.tsx`.

---

### `src/components/binder/manage-trade-card.tsx` (reused unchanged)

**Analog:** itself — no changes required (CONTEXT.md D-04, UI-SPEC "reused unchanged"). Full file already read (lines 1-105) — the art-tile grid, hover overlay stepper, quantity badge, and variant badge patterns all apply directly to the new results grid with no modification. Do not alter its `text-[10px] font-medium` caption weight (UI-SPEC exception note).

## Shared Patterns

### Optimistic update + rollback
**Source:** `src/components/catalog/variant-trade-section.tsx` lines 31-64 and `src/components/catalog/variant-collection-section.tsx` lines 30-63, and `src/app/binder/manage/page.tsx` lines 140-248
**Apply to:** the new want-quantity section, and the extended trade section's ownership-gated stepper
```typescript
const prev = counts[id] ?? 0;
setCounts(c => ({ ...c, [id]: val }));   // optimistic
try {
  const res = await fetch(ENDPOINT, { method: METHOD, headers: {...}, body: JSON.stringify(BODY) });
  if (!res.ok) { setCounts(c => ({ ...c, [id]: prev })); /* log */ }
  else { onQuantityChange?.(id, val); router.refresh(); }
} catch (err) { setCounts(c => ({ ...c, [id]: prev })); /* log */ }
```

### Auth redirect gate
**Source:** `src/components/catalog/variant-trade-section.tsx` lines 27-34 (also in `variant-collection-section.tsx`)
**Apply to:** any new stepper section (want section) — the same `authClient.useSession()` + `router.push('/login')` guard before any mutating fetch
```typescript
const { data: session } = authClient.useSession();
const router = useRouter();
const isAuthenticated = !!session;
// ...
if (!isAuthenticated) { router.push('/login'); return; }
```

### Empty/dashed-border state
**Source:** `src/app/binder/manage/page.tsx` lines 364-377 and 425-428
**Apply to:** the new unified search results container for "no matches" and "0 chars typed" states
```typescript
<div className="py-12 text-center border-2 border-dashed rounded-lg space-y-1">
  <p className="text-sm font-semibold">{HEADING}</p>
  <p className="text-xs text-muted-foreground">{BODY}</p>
</div>
```

### Variant row anatomy (label / stepper / input / status)
**Source:** `src/components/catalog/variant-collection-section.tsx` lines 80-122 and `src/components/catalog/variant-trade-section.tsx` lines 78-121
**Apply to:** all per-variant rows in the sheet, including the new want row and the disabled-trade row
```typescript
<div className="flex items-center gap-2">
  <span className="text-sm text-muted-foreground w-28 min-w-[7rem]">{printing.variantType}</span>
  <Button variant="outline" size="icon" disabled={...} onClick={...}><Minus className="size-4" /></Button>
  <Input type="number" value={count} onChange={...} className="w-16 text-center font-bold" />
  <Button variant="outline" size="icon" onClick={...}><Plus className="size-4" /></Button>
  {count > 0
    ? <span className="text-sm font-bold text-primary">{ACTIVE_LABEL}</span>
    : <span className="text-sm font-normal text-muted-foreground">{INACTIVE_LABEL}</span>}
</div>
```

## No Analog Found

None — every new/modified file this phase touches has a direct in-repo predecessor to extend or copy (the two `VariantCollectionSection`/`VariantTradeSection` sibling components make the new want-section a mechanical copy, and `manage/page.tsx` + `variant-trade-sheet.tsx` are extended in place).

## Metadata

**Analog search scope:** `src/app/binder/manage/`, `src/components/binder/`, `src/components/catalog/`, `src/app/api/cards/all/`, `src/app/api/collection/`, `src/db/queries/catalog.ts`, `src/db/queries/collection.ts`
**Files scanned:** 8 (all fully read; no file exceeded 500 lines, no offset/limit reads needed)
**Pattern extraction date:** 2026-07-19

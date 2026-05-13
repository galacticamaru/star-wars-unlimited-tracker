# Phase 14: Trade Binder Polish - Pattern Map

**Mapped:** 2026-05-13
**Files analyzed:** 8
**Analogs found:** 8 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/binder/[username]/page.tsx` | page (server component) | request-response | `src/app/cards/page.tsx` | exact — full-width page with no wrapper div |
| `src/components/binder/public-binder-client.tsx` | component | request-response | self (no change needed) | reference only |
| `src/app/binder/manage/page.tsx` | page (client component) | CRUD + event-driven | self (extend existing) | self-analog |
| `src/components/binder/manage-wants-list.tsx` | component | CRUD | self (style reference) | self-analog |
| `src/db/queries/trade.ts` | service/query | CRUD | `src/db/queries/binder.ts` | role-match — same Drizzle join patterns |
| `src/db/queries/binder.ts` | service/query | CRUD | self (extract helper) | self-analog |
| `src/lib/binder-logic.ts` | utility | transform | self (reuse as-is) | reference only |
| `src/app/api/binder/route.ts` | route handler | request-response | self (extend response shape) | self-analog |

---

## Pattern Assignments

### `src/app/binder/[username]/page.tsx` — Remove container wrapper (D-01, D-02)

**Change:** Remove the `<div className="container mx-auto">` wrapper on line 59. Return `<PublicBinderClient ... />` directly, matching the catalog page pattern.

**Analog — full-width page pattern** (`src/app/cards/page.tsx`, lines 49-54):
```tsx
return (
  <CatalogClient
    cards={plainCards}
    filterOptions={filterOptions}
  />
);
```

**Current code to change** (`src/app/binder/[username]/page.tsx`, lines 58-67):
```tsx
// BEFORE
return (
  <div className="container mx-auto">
    <PublicBinderClient
      username={username}
      offerings={offerings}
      lookingFor={lookingFor}
      filterOptions={filterOptions}
    />
  </div>
);

// AFTER
return (
  <PublicBinderClient
    username={username}
    offerings={offerings}
    lookingFor={lookingFor}
    filterOptions={filterOptions}
  />
);
```

**Why it works:** `PublicBinderClient` already has `<div className="flex flex-col h-screen overflow-hidden">` as its root (line 118 of `public-binder-client.tsx`), with `px-4 lg:px-8` applied on inner elements. The `container mx-auto` wrapper was constraining it unnecessarily.

---

### `src/components/binder/public-binder-client.tsx` — No changes needed

**Reference only.** Internal padding is already `px-4 lg:px-8` (lines 119, 141, 157). Full-height layout is already `flex flex-col h-screen overflow-hidden` (line 118). Nothing to modify.

---

### `src/db/queries/trade.ts` — Extend `getUserTradeData()` to include `autoWants` (D-07)

**Change:** Add auto-wants computation (deck shortfall per card) to `getUserTradeData()`. The deck-wants logic lives in `getPublicBinderData()` in `binder.ts` (lines 81-121) and must be extracted/reused here.

**Imports to add** (copy from `binder.ts` line 1-4):
```typescript
import { db } from '@/db';
import {
  userCollections, tradeExclusions, tradeManualWants,
  cardDefinitions, cardPrintings,
  decks, deckCards,                     // ADD these two
} from '@/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm'; // ADD inArray
import { calculateLookingFor } from '@/lib/binder-logic'; // ADD
```

**Deck-target computation to copy from `binder.ts`** (lines 81-121) — build `autoTargetMap`:
```typescript
// Auto target from decks
const userDecks = await db
  .select({
    id: decks.id,
    leaderCardDefinitionId: decks.leaderCardDefinitionId,
    baseCardDefinitionId: decks.baseCardDefinitionId,
  })
  .from(decks)
  .where(eq(decks.userId, userId));

const autoTargetMap = new Map<number, number>();

if (userDecks.length > 0) {
  const deckIds = userDecks.map(d => d.id);
  const cardQuantities = await db
    .select({
      cardDefinitionId: deckCards.cardDefinitionId,
      quantity: deckCards.quantity,
    })
    .from(deckCards)
    .where(
      and(
        inArray(deckCards.deckId, deckIds),
        eq(deckCards.isSideboard, false)
      )
    );

  for (const cq of cardQuantities) {
    const current = autoTargetMap.get(cq.cardDefinitionId) ?? 0;
    autoTargetMap.set(cq.cardDefinitionId, Math.max(current, cq.quantity));
  }

  // Leaders and Bases count as 1 each
  for (const deck of userDecks) {
    if (deck.leaderCardDefinitionId) {
      autoTargetMap.set(
        deck.leaderCardDefinitionId,
        Math.max(autoTargetMap.get(deck.leaderCardDefinitionId) ?? 0, 1)
      );
    }
    if (deck.baseCardDefinitionId) {
      autoTargetMap.set(
        deck.baseCardDefinitionId,
        Math.max(autoTargetMap.get(deck.baseCardDefinitionId) ?? 0, 1)
      );
    }
  }
}
```

**Inventory fetch pattern** (from `binder.ts` lines 49-57 — same pattern, reuse directly):
```typescript
const inventory = await db
  .select({
    cardDefinitionId: userCollections.cardDefinitionId,
    count: userCollections.count,
  })
  .from(userCollections)
  .where(eq(userCollections.userId, userId));

const inventoryMap = new Map(inventory.map(i => [i.cardDefinitionId, i.count]));
```

**Exclusion set pattern** — `exclusions` is already fetched in `getUserTradeData()` (lines 25-33). Build an exclusions set from it:
```typescript
const exclusionsSet = new Set(exclusions.map(e => e.cardDefinitionId));
```

**Auto-wants shortfall computation** — apply `calculateLookingFor` for each deck-targeted card:
```typescript
const autoWantsRaw: Array<{ cardDefinitionId: number; quantity: number }> = [];

for (const [cardId, autoTarget] of autoTargetMap.entries()) {
  const shortfall = calculateLookingFor(
    autoTarget,
    0,                                      // manualTarget = 0 (deck-wants only)
    inventoryMap.get(cardId) ?? 0,
    false                                   // isExcluded handled separately via isExcluded flag
  );
  if (shortfall > 0) {
    autoWantsRaw.push({ cardDefinitionId: cardId, quantity: shortfall });
  }
}
```

**Card details fetch pattern** (from `binder.ts` lines 145-172 — same Drizzle join):
```typescript
const cardIds = autoWantsRaw.map(r => r.cardDefinitionId);
let autoWants: Array<{
  cardDefinitionId: number;
  quantity: number;
  name: string;
  subtitle: string | null;
  isExcluded: boolean;
}> = [];

if (cardIds.length > 0) {
  const cardDetails = await db
    .select({
      id: cardDefinitions.id,
      name: cardDefinitions.name,
      subtitle: cardDefinitions.subtitle,
    })
    .from(cardDefinitions)
    .where(inArray(cardDefinitions.id, cardIds));

  const detailsMap = new Map(cardDetails.map(d => [d.id, d]));

  autoWants = autoWantsRaw
    .map(r => {
      const detail = detailsMap.get(r.cardDefinitionId);
      if (!detail) return null;
      return {
        cardDefinitionId: r.cardDefinitionId,
        quantity: r.quantity,
        name: detail.name,
        subtitle: detail.subtitle,
        isExcluded: exclusionsSet.has(r.cardDefinitionId),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
}
```

**Return shape extension** (current lines 46-50 in `trade.ts`):
```typescript
// BEFORE
return { offerings, exclusions, manualWants };

// AFTER
return { offerings, exclusions, manualWants, autoWants };
```

---

### `src/db/queries/binder.ts` — Extract deck-wants helper (optional, per Claude's Discretion)

**Option A (preferred by D-07):** Extract the deck-wants computation from `getPublicBinderData()` (lines 81-121) into a shared helper in `src/lib/binder-logic.ts` or a private function.

**Option B:** Keep `binder.ts` unchanged; compute deck-wants independently inside `getUserTradeData()`. Acceptable since the logic is short (~40 lines) and the two callers have slightly different output shapes (public binder returns full card objects; manage page only needs name/subtitle/isExcluded).

**Recommended:** Option B for Phase 14 to minimise surface area. If future phases refactor, extract then.

**No changes required to `binder.ts` in Phase 14.**

---

### `src/lib/binder-logic.ts` — No changes needed

**Reference only.** `calculateLookingFor(autoTarget, manualTarget, currentInventory, isExcluded)` is already correct and fully reusable. Import it from `@/lib/binder-logic`.

Signature (lines 13-25):
```typescript
export function calculateLookingFor(
  autoTarget: number,
  manualTarget: number,
  currentInventory: number,
  isExcluded: boolean
): number {
  if (isExcluded) return 0;
  const shortfall = Math.max(0, autoTarget - currentInventory);
  return Math.max(shortfall, manualTarget);
}
```

---

### `src/app/api/binder/route.ts` — No changes needed (response shape expands automatically)

**No code changes required.** The route calls `getUserTradeData(userId)` and returns `NextResponse.json(data)` directly (lines 20-22). When `getUserTradeData()` is extended to return `autoWants`, the GET response automatically includes it.

**Current route pattern** (lines 1-23) — copy auth + session guard for any new binder routes:
```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const userId = parseInt(session.user.id);
  if (isNaN(userId)) {
    return new NextResponse("Invalid User ID", { status: 400 });
  }

  const data = await getUserTradeData(userId);
  return NextResponse.json(data);
}
```

---

### `src/app/binder/manage/page.tsx` — Add "Automatic Wants" section (D-03 to D-06)

**Changes needed:**
1. Read `autoWants` from `tradeData` (already fetched by `fetchData()` via `/api/binder`).
2. Pass `autoWants` and `onToggleExclusion` to `ManageWantsList` (or a new section alongside it).
3. Wire "Exclude" / "Remove exclusion" to the existing `toggleExclusion()` function (lines 120-140).

**Optimistic state update pattern** — copy from `toggleExclusion` (lines 120-140):
```typescript
const toggleExclusion = async (cardDefinitionId: number, excluded: boolean) => {
  const res = await fetch('/api/binder/exclusions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardDefinitionId, excluded }),
  });
  if (res.ok) {
    if (!excluded) {
      setTradeData((prev: any) => ({
        ...prev,
        exclusions: prev.exclusions.filter((e: any) => e.cardDefinitionId !== cardDefinitionId)
      }));
    } else {
      const card = allCards.find(c => c.id === cardDefinitionId);
      setTradeData((prev: any) => ({
        ...prev,
        exclusions: [...prev.exclusions, { cardDefinitionId, name: card.name, subtitle: card.subtitle ?? null }]
      }));
    }
  }
};
```

**For auto-wants exclusion toggling**, also update `autoWants[].isExcluded` in the optimistic state:
```typescript
// Extend toggleExclusion to also flip isExcluded on autoWants items
setTradeData((prev: any) => ({
  ...prev,
  autoWants: prev.autoWants?.map((w: any) =>
    w.cardDefinitionId === cardDefinitionId
      ? { ...w, isExcluded: excluded }
      : w
  ),
}));
```

**Sidebar placement** — the existing sidebar is the single `<div>` on line 255 containing `<ManageWantsList>`. The Automatic Wants section goes inside `ManageWantsList` or alongside it in that same sidebar `<div>`. Copy the existing section pattern from `ManageWantsList`.

---

### `src/components/binder/manage-wants-list.tsx` — Extend with Automatic Wants section (D-03 to D-06)

**Approach:** Add an `autoWants` prop and `onToggleExclusion` callback. Render a new `<section>` following the same pattern as "Manual Wants" (lines 35-89) and "Exclusions" (lines 91-124).

**Interface additions:**
```typescript
interface AutoWantItem {
  cardDefinitionId: number;
  quantity: number;
  name: string;
  subtitle: string | null;
  isExcluded: boolean;
}

// Extend ManageWantsListProps:
autoWants: AutoWantItem[];
onToggleExclusion: (id: number, excluded: boolean) => void;
```

**Row pattern for active (non-excluded) auto-want** — mirrors Manual Wants row (lines 49-86), replacing quantity controls with a static quantity badge and replacing X button with "Exclude" button:
```tsx
<div key={w.cardDefinitionId} className="flex items-center justify-between p-2 bg-muted/50 rounded-md border group">
  <div className="min-w-0 flex-1">
    <p className="text-sm font-medium truncate">{w.name}</p>
    {w.subtitle && (
      <p className="text-[10px] text-muted-foreground truncate">{w.subtitle}</p>
    )}
  </div>
  <div className="flex items-center gap-3 ml-4">
    <span className="text-xs font-bold bg-background rounded-full px-2 py-0.5 border shadow-sm">
      {w.quantity}
    </span>
    <button
      type="button"
      onClick={() => onToggleExclusion(w.cardDefinitionId, true)}
      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
      aria-label="Exclude from looking for"
    >
      <Ban className="w-4 h-4" />
    </button>
  </div>
</div>
```

**Row pattern for excluded auto-want** — muted with "Remove exclusion" action (D-06):
```tsx
<div
  key={w.cardDefinitionId}
  className="flex items-center justify-between p-2 bg-muted/50 rounded-md border group opacity-50"
>
  <div className="min-w-0 flex-1">
    <p className="text-sm font-medium truncate">{w.name}</p>
    {w.subtitle && (
      <p className="text-[10px] text-muted-foreground truncate">{w.subtitle}</p>
    )}
    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full font-normal">
      Excluded
    </span>
  </div>
  <button
    type="button"
    onClick={() => onToggleExclusion(w.cardDefinitionId, false)}
    className="p-1 text-muted-foreground hover:text-destructive transition-colors ml-4"
    aria-label="Remove exclusion"
  >
    <X className="w-4 h-4" />
  </button>
</div>
```

**Section heading pattern** — copy from Manual Wants heading (lines 36-40):
```tsx
<h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
  Automatic Wants
  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full font-normal">
    {autoWants.length}
  </span>
</h3>
```

**Empty state pattern** — copy from Manual Wants (lines 42-44):
```tsx
<p className="text-xs text-muted-foreground italic bg-muted/30 p-4 rounded-md border border-dashed text-center">
  No deck-driven wants. Add decks to your collection to automatically track missing cards.
</p>
```

**Icon import addition** — `Ban` is already imported in `manage/page.tsx` (line 10). Add it to `manage-wants-list.tsx`:
```typescript
import { X, Plus, Minus, Ban } from 'lucide-react';
```

---

## Shared Patterns

### Auth guard in API routes
**Source:** `src/app/api/binder/route.ts` lines 6-17
**Apply to:** Any new route files (none needed in this phase)
```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session) return new NextResponse("Unauthorized", { status: 401 });
const userId = parseInt(session.user.id);
if (isNaN(userId)) return new NextResponse("Invalid User ID", { status: 400 });
```

### Drizzle query pattern (join + where)
**Source:** `src/db/queries/trade.ts` lines 5-23 (offerings query)
**Apply to:** `getUserTradeData()` auto-wants card detail fetch
```typescript
await db
  .select({ ... })
  .from(tableName)
  .innerJoin(otherTable, eq(otherTable.foreignKey, tableName.pk))
  .where(and(eq(tableName.userId, userId), ...conditions));
```

### Optimistic state update pattern
**Source:** `src/app/binder/manage/page.tsx` lines 60-88 (updateTradeQuantity), 120-140 (toggleExclusion)
**Apply to:** `toggleExclusion` extension for `autoWants` state update
```typescript
setTradeData((prev: any) => ({
  ...prev,
  fieldName: prev.fieldName.map((item: any) =>
    item.cardDefinitionId === cardDefinitionId
      ? { ...item, changedProp: newValue }
      : item
  ),
}));
```

### Manual Wants row style
**Source:** `src/components/binder/manage-wants-list.tsx` lines 49-87
**Apply to:** Automatic Wants active rows in `manage-wants-list.tsx`
Key classes: `flex items-center justify-between p-2 bg-muted/50 rounded-md border group`

### Section heading with count badge
**Source:** `src/components/binder/manage-wants-list.tsx` lines 36-40
**Apply to:** Automatic Wants section heading
Key classes: `text-sm font-semibold mb-3 flex items-center gap-2` + badge `text-[10px] bg-muted px-1.5 py-0.5 rounded-full font-normal`

---

## No Analog Found

None — all files have direct analogs or are self-referential modifications.

---

## Metadata

**Analog search scope:** `src/app/`, `src/components/binder/`, `src/db/queries/`, `src/lib/`, `src/app/api/binder/`
**Files read:** 10
**Pattern extraction date:** 2026-05-13

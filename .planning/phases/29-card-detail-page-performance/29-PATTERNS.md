# Phase 29: Card Detail Page Performance - Pattern Map

**Mapped:** 2026-06-03
**Files analyzed:** 8 (7 modified, 1 created)
**Analogs found:** 8 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/db/queries/card-detail.ts` | query | CRUD + cache | `src/db/queries/catalog.ts` + `src/db/queries/decks.ts` | exact |
| `src/app/cards/[set-code]/[card-number]/page.tsx` | RSC page | request-response | itself (modify: remove block, update import) | self |
| `src/app/cards/[set-code]/[card-number]/loading.tsx` | skeleton | request-response | `src/app/decks/[id]/loading.tsx` | role-match |
| `src/app/api/collection/variants/route.ts` | API route | request-response | `src/app/api/decks/route.ts` | exact |
| `src/app/api/trade/route.ts` | API route | request-response | `src/app/api/decks/route.ts` | exact |
| `src/components/catalog/card-image-section.tsx` | client component | request-response | itself (single prop change) | self |
| `src/components/catalog/variant-collection-section.tsx` | client component | event-driven | itself (add router.refresh()) | self |
| `src/components/catalog/variant-trade-section.tsx` | client component | event-driven | itself (add router.refresh()) | self |

---

## Pattern Assignments

### `src/db/queries/card-detail.ts` — split + cache (modify)

**Primary analog:** `src/db/queries/catalog.ts` (public data, `cacheTag('cards')` + `cacheLife('days')`)
**Secondary analog:** `src/db/queries/decks.ts` (per-user cacheTag, no cacheLife)

#### Pattern A — public data cache (`getCardDefinition`)

Copy the three-line opener from `catalog.ts` lines 7–10 verbatim:

```typescript
// catalog.ts lines 7-10
export async function getAllCards() {
  'use cache'
  cacheTag('cards');
  cacheLife('days');
```

Apply to `getCardDefinition`:

```typescript
export async function getCardDefinition(setCode: string, cardNumber: string) {
  'use cache'
  cacheTag('cards');
  cacheLife('days');
  const collectorNumber = `${setCode}-${cardNumber}`;
  // ... same join chain as current getCardByPrinting but WITHOUT:
  //   - the `userId` parameter
  //   - the leftJoin on userCollections
  //   - the collectionCount selected field (sql<number>`COALESCE(...)`)
  // Return shape is identical to current minus collectionCount.
}
```

Imports to add (`catalog.ts` line 5 pattern):

```typescript
import { cacheTag, cacheLife } from 'next/cache';
```

#### Pattern B — per-user cache (`getSameSetPrintingsWithCounts`)

Copy from `decks.ts` lines 17–20 (per-user tag, no cacheLife):

```typescript
// decks.ts lines 17-20
export async function getDeckWithCards(deckId: number, userId: number) {
  'use cache';
  cacheTag(`deck-${deckId}-user-${userId}`);
  cacheLife('days');
```

Apply to `getSameSetPrintingsWithCounts`:

```typescript
export async function getSameSetPrintingsWithCounts(
  cardDefinitionId: number,
  setCode: string,
  userId: number          // make required (non-optional) — cache key depends on it
) {
  'use cache'
  cacheTag(`card-printings-${cardDefinitionId}-user-${userId}`);
  // No cacheLife — invalidation is explicit via revalidateTag only (D-03 parity)
  // ... existing query body unchanged
}
```

**IMPORTANT:** The `userId` parameter MUST be required (not `userId?: number`) because the cache key interpolates it. Callers must guard `if (userId)` before calling — the RSC already does this (`userId ? await getSameSetPrintingsWithCounts(...) : []`).

---

### `src/app/cards/[set-code]/[card-number]/page.tsx` — remove legacy block + update import (modify)

**Analog:** self — surgical removals only.

#### What to remove — legacy hydration block (lines 39–48):

```typescript
// REMOVE lines 39-48 entirely:
  if (userId && card.collectionCount > 0 && printings.length > 0) {
    const allZero = printings.every(p => p.ownedCount === 0);
    if (allZero) {
      const normalPrinting =
        printings.find(p => p.variantType === 'Normal') ?? printings[0];
      await upsertVariantCount(normalPrinting.id, card.collectionCount, userId);
      normalPrinting.ownedCount = card.collectionCount;
    }
  }
```

#### What to remove — unused import (line 6):

```typescript
// REMOVE — upsertVariantCount is only used in the hydration block being deleted:
import { upsertVariantCount } from '@/db/queries/collection';
```

#### What to update — import on line 5:

```typescript
// BEFORE (line 5):
import { getCardByPrinting, getSameSetPrintingsWithCounts } from '@/db/queries/card-detail';

// AFTER:
import { getCardDefinition, getSameSetPrintingsWithCounts } from '@/db/queries/card-detail';
```

#### What to update — call site (line 27):

```typescript
// BEFORE:
const card = await getCardByPrinting(setCode, cardNumber, userId ?? undefined);

// AFTER:
const card = await getCardDefinition(setCode, cardNumber);
```

---

### `src/app/cards/[set-code]/[card-number]/loading.tsx` — CREATE new file

**Primary analog:** `src/app/decks/[id]/loading.tsx` (detail page skeleton, two-panel layout)
**Secondary analog:** `src/app/decks/loading.tsx` (list skeleton, animate-pulse + bg-slate-200 divs)

#### Structural pattern from `decks/[id]/loading.tsx` (lines 1–83):

- Outer container: single `<div>` with layout classes, no state, no imports beyond React
- `animate-pulse` applied to sections or the outermost wrapper div
- Placeholder divs: `bg-slate-200 rounded` or `bg-slate-200 rounded-lg`
- Aspect ratio placeholders: `aspect-[2/3]` for portrait card images, `aspect-[4/3]` for landscape

```typescript
// decks/[id]/loading.tsx lines 27-31 — aspect-ratio image placeholder pattern:
<div className="hidden md:block w-48 shrink-0">
  <div className="aspect-[2/3] bg-slate-200 rounded-lg" />
</div>
```

#### Skeleton layout to produce (mirrors real page `page.tsx` lines 50–194):

The real page outer structure (lines 52, 66) is:
```typescript
<div className="max-w-5xl mx-auto px-4 py-12">         // page container
  <div className="flex flex-col gap-8 md:flex-row md:gap-12">  // two-column row
    <div className="flex flex-col gap-6">              // left: image column
      <CardImageSection ... />                         // → image placeholder
      ...                                              // variant sections: NOT skeletonized
    </div>
    <div className="flex-1 flex flex-col gap-4">       // right: metadata column
      ...
    </div>
  </div>
</div>
```

Image placeholder dimensions come from `card-image-section.tsx` line 54:
`w-full md:w-[320px] md:flex-shrink-0` with `aspect-[2/3]`

Metadata column lines to represent (right column of real page):
- Title line: `h1.text-xl.font-semibold` → `h-6 w-48 bg-slate-200 rounded`
- Subtitle: `p.text-sm` → `h-4 w-32 bg-slate-200 rounded`
- Badge row (type/arenas/aspects): 3× `h-5 w-16 bg-slate-200 rounded`
- Stat chips (cost/power/hp): 3× `h-10 w-12 bg-slate-200 rounded-md`
- Text box: `h-24 w-full bg-slate-200 rounded-md`
- Footer metadata: 4× `h-3 w-40 bg-slate-200 rounded`

Skeleton component structure:
```typescript
export default function CardDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Back button placeholder */}
      <div className="h-9 w-32 bg-slate-200 rounded-md mb-6 animate-pulse" />

      <div className="flex flex-col gap-8 md:flex-row md:gap-12 animate-pulse">
        {/* Left: image column */}
        <div className="w-full md:w-[320px] md:flex-shrink-0 aspect-[2/3] bg-slate-200 rounded-lg" />

        {/* Right: metadata column */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Title + subtitle */}
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 rounded" />
            <div className="h-4 w-32 bg-slate-200 rounded" />
          </div>
          {/* Badge row */}
          <div className="flex gap-1.5">
            <div className="h-5 w-16 bg-slate-200 rounded" />
            <div className="h-5 w-16 bg-slate-200 rounded" />
            <div className="h-5 w-20 bg-slate-200 rounded" />
          </div>
          {/* Stat chips */}
          <div className="flex gap-3">
            <div className="h-10 w-12 bg-slate-200 rounded-md" />
            <div className="h-10 w-12 bg-slate-200 rounded-md" />
            <div className="h-10 w-12 bg-slate-200 rounded-md" />
          </div>
          {/* Text box */}
          <div className="h-24 w-full bg-slate-200 rounded-md" />
          {/* Footer metadata */}
          <div className="space-y-1 mt-auto pt-3 border-t border-border">
            <div className="h-3 w-40 bg-slate-200 rounded" />
            <div className="h-3 w-40 bg-slate-200 rounded" />
            <div className="h-3 w-32 bg-slate-200 rounded" />
            <div className="h-3 w-36 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### `src/app/api/collection/variants/route.ts` — add revalidateTag (modify)

**Analog:** `src/app/api/decks/route.ts` lines 1–44 (exact match: revalidateTag after mutation)

#### Import pattern (from `decks/route.ts` line 5):

```typescript
import { revalidateTag } from 'next/cache';
```

#### revalidateTag call pattern (from `decks/route.ts` line 38):

```typescript
revalidateTag(`decks-user-${userId}`, 'max');
```

#### Where to insert in `collection/variants/route.ts`:

The file already looks up `printing.cardDefinitionId` at lines 40–48 (for `recomputeTotal`). Re-use that value:

```typescript
// After line 56: await recomputeTotal(userId, printing.cardDefinitionId);
// ADD:
revalidateTag(`card-printings-${printing.cardDefinitionId}-user-${userId}`, 'max');
```

Full POST handler change summary:
1. Add `import { revalidateTag } from 'next/cache';` to imports (line 1 block)
2. After `await recomputeTotal(...)` (line 56), add the `revalidateTag` call
3. `printing.cardDefinitionId` is already in scope — no new lookup needed

---

### `src/app/api/trade/route.ts` — add revalidateTag + cardDefinitionId lookup (modify)

**Analog:** `src/app/api/decks/route.ts` (revalidateTag pattern) + `src/app/api/collection/variants/route.ts` (cardDefinitionId lookup pattern)

Unlike the collection route, the trade route (`src/app/api/trade/route.ts`) does NOT currently query `cardPrintings` for `cardDefinitionId`. It must be added.

#### cardDefinitionId lookup pattern (from `collection/variants/route.ts` lines 39–48):

```typescript
// collection/variants/route.ts lines 39-48 — copy this pattern:
const [printing] = await db
  .select({ cardDefinitionId: cardPrintings.cardDefinitionId })
  .from(cardPrintings)
  .where(eq(cardPrintings.id, cardPrintingId))
  .limit(1);

if (!printing) {
  return new Response('cardPrintingId not found', { status: 404 });
}
```

#### Changes needed in `trade/route.ts`:

1. Add imports:
```typescript
import { db } from '@/db';
import { cardPrintings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
```

2. After `await upsertTradeOffering(...)` (line 21), add the lookup + revalidateTag:
```typescript
const [printing] = await db
  .select({ cardDefinitionId: cardPrintings.cardDefinitionId })
  .from(cardPrintings)
  .where(eq(cardPrintings.id, cardPrintingId))
  .limit(1);

if (!printing) {
  return new Response('cardPrintingId not found', { status: 404 });
}

const userId = Number(session.user.id);
revalidateTag(`card-printings-${printing.cardDefinitionId}-user-${userId}`, 'max');
```

Note: `userId` is already computed from `session.user.id` in this handler (line 21 uses it inline). Extract it to a variable before the `upsertTradeOffering` call so it's available for the `revalidateTag` call.

---

### `src/components/catalog/card-image-section.tsx` — replace preload with priority (modify)

**Analog:** self — single prop substitution.

#### Current code (lines 62–77):

```typescript
// card-image-section.tsx lines 62-77 — CURRENT
<Image
  src={displayUrl}
  alt={name}
  fill
  sizes="(max-width: 768px) 100vw, 320px"
  className={cn(
    "object-cover transition-opacity duration-300",
    !loaded && "opacity-0"
  )}
  onLoad={() => setLoaded(true)}
  onError={() => setLoaded(true)}
  key={displayUrl}
  // @ts-ignore - custom attribute used in this project's Next.js 16 setup
  preload={true}
/>
```

#### After change:

```typescript
<Image
  src={displayUrl}
  alt={name}
  fill
  sizes="(max-width: 768px) 100vw, 320px"
  className={cn(
    "object-cover transition-opacity duration-300",
    !loaded && "opacity-0"
  )}
  onLoad={() => setLoaded(true)}
  onError={() => setLoaded(true)}
  key={displayUrl}
  priority
/>
```

Remove lines 74–76 (`// @ts-ignore ...` comment and `preload={true}`), add `priority` in their place. No other changes.

---

### `src/components/catalog/variant-collection-section.tsx` — add router.refresh() (modify)

**Analog:** self — `router` is already imported (line 8) and instantiated (line 27). `router.push` is already called (line 33). The `refresh()` call is NOT currently made after a successful mutation — it must be added.

#### Current success path in `updateVariant` (lines 45–55):

```typescript
// variant-collection-section.tsx lines 45-55 — CURRENT
try {
  const res = await fetch('/api/collection/variants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardPrintingId, count: val }),
  });
  if (!res.ok) {
    setCounts(c => ({ ...c, [cardPrintingId]: prev }));
    console.error('Failed to update variant count:', await res.text());
  }
} catch (err) {
```

#### After change — add `router.refresh()` on success:

```typescript
try {
  const res = await fetch('/api/collection/variants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardPrintingId, count: val }),
  });
  if (!res.ok) {
    setCounts(c => ({ ...c, [cardPrintingId]: prev }));
    console.error('Failed to update variant count:', await res.text());
  } else {
    router.refresh();
  }
} catch (err) {
```

`useRouter` import (line 8) and `const router = useRouter()` (line 27) are already present — no new imports needed.

---

### `src/components/catalog/variant-trade-section.tsx` — add router.refresh() (modify)

**Analog:** self — same situation as `VariantCollectionSection`. `router` is already imported (line 8) and instantiated (line 28). The `onQuantityChange?.()` callback is called on success (line 56) but `router.refresh()` is NOT currently called.

#### Current success path in `updateVariant` (lines 47–57):

```typescript
// variant-trade-section.tsx lines 47-57 — CURRENT
try {
  const res = await fetch('/api/trade', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardPrintingId, tradeQuantity: val }),
  });
  if (!res.ok) {
    setCounts(c => ({ ...c, [cardPrintingId]: prev }));
    console.error('Failed to update trade quantity:', await res.text());
  } else {
    onQuantityChange?.(cardPrintingId, val);
  }
} catch (err) {
```

#### After change — add `router.refresh()` on success:

```typescript
try {
  const res = await fetch('/api/trade', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardPrintingId, tradeQuantity: val }),
  });
  if (!res.ok) {
    setCounts(c => ({ ...c, [cardPrintingId]: prev }));
    console.error('Failed to update trade quantity:', await res.text());
  } else {
    onQuantityChange?.(cardPrintingId, val);
    router.refresh();
  }
} catch (err) {
```

`useRouter` import (line 8) and `const router = useRouter()` (line 28) are already present — no new imports needed.

---

## Shared Patterns

### `'use cache'` directive placement

**Source:** `src/db/queries/catalog.ts` lines 7–10 and `src/db/queries/decks.ts` lines 6–9

The directive is a string literal as the **first statement inside the function body**, before any other code including `const` declarations. This is mandatory — placing it after any statement makes it a no-op.

```typescript
// catalog.ts lines 7-10 — canonical placement:
export async function getAllCards() {
  'use cache'
  cacheTag('cards');
  cacheLife('days');
  return db.select(...)
```

### `revalidateTag` import and call convention

**Source:** `src/app/api/decks/route.ts` lines 5, 38

```typescript
import { revalidateTag } from 'next/cache';
// ...
revalidateTag(`decks-user-${userId}`, 'max');
```

The second argument `'max'` is present in the decks route. Apply consistently to all new `revalidateTag` calls in this phase.

### `router.refresh()` two-layer invalidation

**Source:** Established in Phase 27 (D-05). `router.refresh()` busts the **Router Cache** (client-side); `revalidateTag()` in the API route busts the **Data Cache** (server-side). Both must fire for a page navigation to show updated data.

Pattern: call `router.refresh()` in the `else` branch (success path) of the `fetch` response check — not in the optimistic update path, not unconditionally.

### Auth pattern in API routes

**Source:** `src/app/api/collection/variants/route.ts` lines 11–13 (identical across all route files)

```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session) {
  return new Response('Unauthorized', { status: 401 });
}
```

### Error response pattern in API routes

**Source:** `src/app/api/collection/variants/route.ts` lines 59–62

```typescript
} catch (error) {
  console.error('Failed to update variant count:', error);
  return new Response('Internal Server Error', { status: 500 });
}
```

---

## No Analog Found

All 8 files have clear analogs. No files require falling back to RESEARCH.md patterns.

---

## Key Findings for Planner

1. **`router.refresh()` is NOT already called** in either `VariantCollectionSection` or `VariantTradeSection` — both components have `useRouter` and `router` in scope but only use `router.push('/login')`. Adding `router.refresh()` in the success branch is a net-new addition to both files.

2. **`cardDefinitionId` is already available** in `collection/variants/route.ts` (line 47 — `printing.cardDefinitionId`) because `recomputeTotal` already requires it. The `revalidateTag` call can be inserted after line 56 with zero additional DB queries.

3. **`cardDefinitionId` requires a new lookup** in `trade/route.ts` — the current handler does not query `cardPrintings` at all. Copy the lookup block from `collection/variants/route.ts` lines 39–48.

4. **`userId` in `trade/route.ts`** is currently inlined at line 21 (`Number(session.user.id)`). Extract to `const userId = Number(session.user.id)` before the `upsertTradeOffering` call so it can be reused for the `revalidateTag` key.

5. **`getSameSetPrintingsWithCounts` userId parameter** must be made required (`userId: number` not `userId?: number`) because `cacheTag` interpolates it. The RSC call site (`page.tsx` line 33) already guards with `userId ? await ... : []` so this is safe.

6. **`preload` prop has a `@ts-ignore` comment** in `card-image-section.tsx` line 75 — remove both the comment and the prop, replace with the standard `priority` boolean prop.

## Metadata

**Analog search scope:** `src/db/queries/`, `src/app/api/`, `src/components/catalog/`, `src/app/decks/`
**Files read:** 13
**Pattern extraction date:** 2026-06-03

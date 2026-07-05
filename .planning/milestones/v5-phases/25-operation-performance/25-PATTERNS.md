# Phase 25: Operation Performance - Pattern Map

**Mapped:** 2026-05-27
**Files analyzed:** 5 (4 modified, 1 new)
**Analogs found:** 5 / 5

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/db/queries/collection.ts` | service / query helper | CRUD (batch upsert) | `src/db/queries/collection.ts` (existing helpers `incrementVariantCount`, `recomputeTotal`) | exact — new exported functions extend same file |
| `src/app/api/collection/starter-deck/route.ts` | route handler | request-response | `src/app/api/collection/import/route.ts` | exact — same auth, same sequential-loop structure to replace |
| `src/app/api/collection/import/route.ts` | route handler | request-response | `src/app/api/collection/starter-deck/route.ts` | exact — same auth, same sequential-loop structure to replace |
| `src/app/collection/page.tsx` | component (Client) | event-driven / state machine | self — augment existing state machine | exact — extend in place |
| `src/app/decks/[id]/loading.tsx` | component (Server, skeleton) | request-response (loading fallback) | `src/components/home/high-value-grid.tsx` + `deck-builder.tsx` layout | role-match (skeleton pattern) + layout-match |

---

## Pattern Assignments

### `src/db/queries/collection.ts` — new exports `batchIncrementVariantCounts`, `batchUpsertVariantCounts`, `batchRecomputeTotals`

**Analog:** `src/db/queries/collection.ts` — existing `incrementVariantCount` (lines 238–254) and `recomputeTotal` (lines 261–282)

**Imports pattern** (lines 1–4) — same imports, no new ones needed:
```typescript
import { db } from '@/db';
import { userCollections, userPrintingCollections, cardPrintings } from '@/db/schema';
import { sql, eq, and, inArray } from 'drizzle-orm';
```

**Core pattern A — `batchIncrementVariantCounts` (Quick Add, additive)**

Copy from `incrementVariantCount` (lines 238–254). The batch variant passes an array to `.values()` and references `EXCLUDED.count` (not a JS variable) in the conflict update:

```typescript
// Analog: incrementVariantCount lines 238-254
// Key diff: .values([...array...]) instead of .values(singleRow)
// Key diff: sql`${userPrintingCollections.count} + EXCLUDED.count` (not + ${qtyToAdd})
export async function batchIncrementVariantCounts(
  items: Array<{ cardPrintingId: number; qtyToAdd: number }>,
  userId: number
) {
  if (items.length === 0) return;           // CRITICAL: Drizzle throws on empty array
  return db
    .insert(userPrintingCollections)
    .values(items.map(({ cardPrintingId, qtyToAdd }) => ({
      userId,
      cardPrintingId,
      count: qtyToAdd,
    })))
    .onConflictDoUpdate({
      target: [userPrintingCollections.userId, userPrintingCollections.cardPrintingId],
      set: {
        count: sql`${userPrintingCollections.count} + EXCLUDED.count`,
        updatedAt: new Date(),
      },
    });
}
```

**Core pattern B — `batchUpsertVariantCounts` (CSV Import, overwrite)**

Copy from `upsertVariantCount` (lines 222–231). Overwrite semantics — conflict update sets `count` directly from `EXCLUDED.count`:

```typescript
// Analog: upsertVariantCount lines 222-231
// Key diff: .values([...array...]) + EXCLUDED.count overwrite
export async function batchUpsertVariantCounts(
  items: Array<{ cardPrintingId: number; count: number }>,
  userId: number
) {
  if (items.length === 0) return;           // CRITICAL: Drizzle throws on empty array
  return db
    .insert(userPrintingCollections)
    .values(items.map(({ cardPrintingId, count }) => ({
      userId,
      cardPrintingId,
      count,
    })))
    .onConflictDoUpdate({
      target: [userPrintingCollections.userId, userPrintingCollections.cardPrintingId],
      set: { count: sql`EXCLUDED.count`, updatedAt: new Date() },
    });
}
```

**Core pattern C — `batchRecomputeTotals` (two-step: SELECT GROUP BY + batch INSERT)**

Copy from `recomputeTotal` (lines 261–282). Replace single-definition `eq` filter with multi-definition `inArray`, add `groupBy`:

```typescript
// Analog: recomputeTotal lines 261-282
// Key diff: inArray() instead of eq() for cardDefinitionId
// Key diff: .groupBy(cardPrintings.cardDefinitionId) to produce one row per definition
// Key diff: batch INSERT (.values([...sums...])) instead of single-row INSERT
export async function batchRecomputeTotals(
  cardDefinitionIds: number[],
  userId: number
) {
  if (cardDefinitionIds.length === 0) return;  // CRITICAL: guard both SELECT and INSERT

  // Step 1: SUM all variant counts per definition in one query (analog: recomputeTotal lines 264-273)
  const sums = await db
    .select({
      cardDefinitionId: cardPrintings.cardDefinitionId,
      total: sql<number>`COALESCE(SUM(${userPrintingCollections.count}), 0)`,
    })
    .from(userPrintingCollections)
    .innerJoin(cardPrintings, eq(cardPrintings.id, userPrintingCollections.cardPrintingId))
    .where(
      and(
        eq(userPrintingCollections.userId, userId),
        inArray(cardPrintings.cardDefinitionId, cardDefinitionIds)
      )
    )
    .groupBy(cardPrintings.cardDefinitionId);

  if (sums.length === 0) return;

  // Step 2: batch upsert all totals (analog: recomputeTotal lines 275-282 — same onConflictDoUpdate)
  return db
    .insert(userCollections)
    .values(sums.map(r => ({
      userId,
      cardDefinitionId: r.cardDefinitionId,
      count: Number(r.total),
    })))
    .onConflictDoUpdate({
      target: [userCollections.userId, userCollections.cardDefinitionId],
      set: { count: sql`EXCLUDED.count`, updatedAt: new Date() },
    });
}
```

**Error handling pattern** — no try/catch in query helpers (same as existing helpers lines 238–282). Errors propagate to the calling route handler which has its own try/catch (see route analog below).

---

### `src/app/api/collection/starter-deck/route.ts` (route handler, request-response)

**Analog:** `src/app/api/collection/starter-deck/route.ts` (self — modify in place)
**Secondary analog:** `src/app/api/collection/import/route.ts` (same structure)

**Imports pattern** (lines 1–8) — replace individual helper imports:
```typescript
// Current (line 8):
import { incrementVariantCount, recomputeTotal } from '@/db/queries/collection';
// Replace with:
import { batchIncrementVariantCounts, batchRecomputeTotals } from '@/db/queries/collection';
```

**Auth pattern** (lines 10–16) — unchanged, copy exactly:
```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session) {
  return new Response('Unauthorized', { status: 401 });
}
```

**Core pattern — replace sequential loops** (lines 57–71):
```typescript
// REMOVE this loop (lines 57-66):
for (const card of deck.cards) {
  const printing = printingByNumber.get(card.collectorNumber);
  if (!printing) continue;
  await incrementVariantCount(printing.id, card.qty, userId);
  affectedDefinitionIds.add(printing.cardDefinitionId);
  cardsAdded += card.qty;
}
// REMOVE this loop (lines 69-71):
for (const cardDefinitionId of affectedDefinitionIds) {
  await recomputeTotal(userId, cardDefinitionId);
}

// REPLACE WITH:
const batchItems: Array<{ cardPrintingId: number; qtyToAdd: number }> = [];
for (const card of deck.cards) {
  const printing = printingByNumber.get(card.collectorNumber);
  if (!printing) continue;
  batchItems.push({ cardPrintingId: printing.id, qtyToAdd: card.qty });
  affectedDefinitionIds.add(printing.cardDefinitionId);
  cardsAdded += card.qty;
}
await batchIncrementVariantCounts(batchItems, userId);
await batchRecomputeTotals([...affectedDefinitionIds], userId);
```

**Error handling pattern** (lines 74–77) — unchanged:
```typescript
} catch (error) {
  console.error('Starter deck quick-add failed:', error);
  return new Response('Internal Server Error', { status: 500 });
}
```

---

### `src/app/api/collection/import/route.ts` (route handler, request-response)

**Analog:** `src/app/api/collection/import/route.ts` (self — modify in place)
**Secondary analog:** `src/app/api/collection/starter-deck/route.ts`

**Imports pattern** (line 5) — replace individual helper imports:
```typescript
// Current (line 5):
import { upsertVariantCount, recomputeTotal } from '@/db/queries/collection';
// Replace with:
import { batchUpsertVariantCounts, batchRecomputeTotals } from '@/db/queries/collection';
```

**Auth pattern** (lines 15–19) — unchanged, copy exactly:
```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session) {
  return new Response('Unauthorized', { status: 401 });
}
```

**Core pattern — replace sequential loops** (lines 95–109):
```typescript
// REMOVE this loop (lines 95-104):
for (const item of payload) {
  const key = `${item.swudbId}|${item.variantType}`;
  const lookup = mapping[key];
  if (!lookup) continue;
  const safeCount = Math.max(0, item.count);
  await upsertVariantCount(lookup.printingId, safeCount, userId);
  affectedDefinitions.add(lookup.cardDefinitionId);
  processedCount++;
}
// REMOVE this loop (lines 107-109):
for (const cardDefinitionId of affectedDefinitions) {
  await recomputeTotal(userId, cardDefinitionId);
}

// REPLACE WITH:
const batchItems: Array<{ cardPrintingId: number; count: number }> = [];
for (const item of payload) {
  const key = `${item.swudbId}|${item.variantType}`;
  const lookup = mapping[key];
  if (!lookup) continue;
  const safeCount = Math.max(0, item.count);
  batchItems.push({ cardPrintingId: lookup.printingId, count: safeCount });
  affectedDefinitions.add(lookup.cardDefinitionId);
  processedCount++;
}
await batchUpsertVariantCounts(batchItems, userId);
await batchRecomputeTotals([...affectedDefinitions], userId);
```

**Error handling pattern** (lines 113–115) — unchanged:
```typescript
} catch (error) {
  console.error('Import failed:', error);
  return new Response('Internal Server Error', { status: 500 });
}
```

---

### `src/app/collection/page.tsx` (Client Component, event-driven state machine)

**Analog:** `src/app/collection/page.tsx` — self (extend in place)

**Imports pattern** (lines 1–12) — no new imports needed. `useState` already imported (line 3).

**State machine pattern** (lines 15–23) — add `importCardCount` state alongside existing:
```typescript
// Existing (lines 15-23) — do NOT change these:
const [status, setStatus] = useState<'idle' | 'parsing' | 'uploading' | 'success' | 'error'>('idle');
const [result, setResult] = useState<{ count: number } | null>(null);
const [deckStatus, setDeckStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
const [deckResult, setDeckResult] = useState<{ cardsAdded: number; deckName: string } | null>(null);

// ADD alongside existing state:
const [importCardCount, setImportCardCount] = useState<number>(0);
```

**CSV Import — set count BEFORE POST fires** (inside `handleFileUpload`, lines 52–62):
```typescript
// Existing (lines 53-55):
const normalized = normalizeRedditCsv(results.data, selectedSet);
setStatus('uploading');
// ADD between normalize and setStatus:
setImportCardCount(normalized.length);  // set BEFORE setStatus('uploading') so text renders with count
setStatus('uploading');
```

**Quick Add — set count BEFORE POST fires** (inside `handleQuickAdd`, lines 80–103):
```typescript
// Existing (lines 81-84):
const deck = starterDecks.find((d) => d.id === selectedDeckId);
if (!deck) return;
setDeckStatus('loading');
// ADD: compute count before the POST
const deckCardCount = deck.cards.reduce((sum, c) => sum + c.qty, 0);
// Use deckCardCount in the button label or a new deckCardCount state variable
```

**Status text rendering — uploading state** (line 164, replace):
```typescript
// Current (line 164):
{status === 'uploading' && <p className="text-sm font-medium animate-pulse">Syncing with database...</p>}

// Replace with (copy animate-pulse pattern from line 163):
{status === 'uploading' && (
  <p className="text-sm font-medium animate-pulse">
    Importing {importCardCount} cards...
  </p>
)}
```

**Quick Add button label — loading state** (line 213, replace):
```typescript
// Current (line 213):
{deckStatus === 'loading' ? 'Adding...' : 'Add to Collection'}

// Replace with (uses deckCardCount derived from selected deck):
{deckStatus === 'loading'
  ? `Adding ${deckCardCount} cards from ${deck.name}...`
  : 'Add to Collection'}
```

**Error handling pattern** (lines 68–71, 100–103) — unchanged:
```typescript
} catch (err) {
  console.error(err);
  setStatus('error');   // or setDeckStatus('error')
}
```

---

### `src/app/decks/[id]/loading.tsx` (Server Component skeleton — NEW)

**Analog:** `src/components/decks/deck-builder.tsx` — outer layout structure (lines 306–308, 367–368, 637–647)
**Secondary analog:** `src/components/decks/deck-sidebar.tsx` — sidebar outer container (line 60)
**Skeleton animation pattern:** `src/components/catalog/card-item.tsx` line 93 — `animate-pulse` on bg-muted placeholder

**Key layout dimensions extracted from analogs:**

From `deck-builder.tsx` line 307: outer container — `flex h-[calc(100svh-56px)] overflow-hidden`
From `deck-builder.tsx` line 308: left panel — `flex-1 flex flex-col overflow-hidden`
From `deck-builder.tsx` line 310 (toolbar): `border-b bg-white p-4 flex justify-between items-center shadow-sm`
From `deck-builder.tsx` line 367 (content area): `flex-1 overflow-y-auto bg-slate-50`
From `deck-sidebar.tsx` line 60 (sidebar): `flex flex-col h-full bg-slate-50 border-l p-4 overflow-y-auto w-80`

**`loading.tsx` file structure (Server Component, no auth, no data fetching):**
```typescript
// File: src/app/decks/[id]/loading.tsx
// NO 'use client' directive — Server Component by default
// NO parameters accepted (Next.js loading.tsx convention)
// NO auth calls — loading.tsx cannot access session

export default function DeckBuilderLoading() {
  return (
    // Outer: mirrors deck-builder.tsx line 307 exactly
    <div className="flex h-[calc(100svh-56px)] overflow-hidden">

      {/* Left panel — mirrors deck-builder.tsx line 308 */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Toolbar skeleton — mirrors deck-builder.tsx line 310 */}
        <div className="border-b bg-white p-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4 flex-1 animate-pulse">
            {/* Name input placeholder */}
            <div className="h-8 w-64 bg-slate-200 rounded" />
            {/* Tab pills placeholder */}
            <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
              <div className="h-8 w-20 bg-slate-200 rounded" />
              <div className="h-8 w-20 bg-slate-200 rounded" />
              <div className="h-8 w-20 bg-slate-200 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2 animate-pulse">
            <div className="h-8 w-20 bg-slate-200 rounded" />
            <div className="h-8 w-16 bg-slate-200 rounded" />
          </div>
        </div>

        {/* Content area — mirrors deck-builder.tsx line 367 */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
          <div className="max-w-4xl mx-auto animate-pulse">
            <div className="flex flex-row gap-6 items-start">
              {/* Hover preview panel placeholder (hidden md:block w-48) */}
              <div className="hidden md:block w-48 shrink-0">
                <div className="aspect-[2/3] bg-slate-200 rounded-lg" />
              </div>
              <div className="flex-1 space-y-8">
                {/* Leader + Base grid — mirrors deck-builder.tsx lines 402-482 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="h-3 w-12 bg-slate-200 rounded" />
                    <div className="aspect-[4/3] bg-slate-200 rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-8 bg-slate-200 rounded" />
                    <div className="aspect-[4/3] bg-slate-200 rounded-lg" />
                  </div>
                </div>
                {/* Empty deck placeholder — mirrors deck-builder.tsx lines 486-490 */}
                <div className="bg-white border rounded-lg shadow-sm p-12 text-center">
                  <div className="h-4 w-24 bg-slate-200 rounded mx-auto mb-4" />
                  <div className="h-8 w-28 bg-slate-200 rounded mx-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar skeleton — mirrors deck-sidebar.tsx line 60: w-80 bg-slate-50 border-l p-4 */}
      <div className="w-80 bg-slate-50 border-l p-4 flex flex-col gap-4 animate-pulse">
        {/* Deck name + badge row */}
        <div className="h-7 w-40 bg-slate-200 rounded" />
        <div className="h-5 w-32 bg-slate-200 rounded" />
        {/* Stat blocks */}
        <div className="h-24 bg-slate-200 rounded" />
        <div className="h-32 bg-slate-200 rounded" />
        <div className="h-16 bg-slate-200 rounded" />
        {/* Save buttons at bottom */}
        <div className="mt-auto pt-6 space-y-2">
          <div className="h-9 w-full bg-slate-200 rounded-md" />
          <div className="h-9 w-full bg-slate-200 rounded-md" />
        </div>
      </div>
    </div>
  );
}
```

---

## Shared Patterns

### Auth pattern
**Source:** `src/app/api/collection/starter-deck/route.ts` lines 11–16 and `src/app/api/collection/import/route.ts` lines 15–19
**Apply to:** Both modified route handlers (unchanged — do not alter auth logic)
```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session) {
  return new Response('Unauthorized', { status: 401 });
}
```

### Error handling (route handlers)
**Source:** `src/app/api/collection/starter-deck/route.ts` lines 74–77 and `src/app/api/collection/import/route.ts` lines 113–115
**Apply to:** Both modified route handlers (unchanged)
```typescript
} catch (error) {
  console.error('[context] failed:', error);
  return new Response('Internal Server Error', { status: 500 });
}
```

### Drizzle onConflictDoUpdate pattern
**Source:** `src/db/queries/collection.ts` lines 204–220 (`upsertCardCount`) and lines 238–254 (`incrementVariantCount`)
**Apply to:** All three new batch helpers in `collection.ts`
```typescript
.onConflictDoUpdate({
  target: [table.userId, table.foreignKeyId],
  set: {
    count: sql`...`,      // additive: sql`${table.count} + EXCLUDED.count`
                          // overwrite: sql`EXCLUDED.count`
    updatedAt: new Date(),
  },
})
```

### Empty-array guard
**Source:** Pattern established in RESEARCH.md (Drizzle throws on `.values([])`)
**Apply to:** All three new batch helpers (`batchIncrementVariantCounts`, `batchUpsertVariantCounts`, `batchRecomputeTotals`)
```typescript
if (items.length === 0) return;
```

### animate-pulse skeleton
**Source:** `src/components/catalog/card-item.tsx` line 93 — `!loaded && 'animate-pulse'` on bg-muted container
**Source:** `src/app/collection/page.tsx` lines 163–164 — `animate-pulse` on text
**Apply to:** `loading.tsx` skeleton containers and `collection/page.tsx` uploading text
```typescript
// Skeleton container: className="... animate-pulse"
// Individual placeholder: className="h-8 w-64 bg-slate-200 rounded"
// Text: className="text-sm font-medium animate-pulse"
```

---

## No Analog Found

All five files have close analogs. No entries in this section.

---

## Metadata

**Analog search scope:** `src/db/queries/`, `src/app/api/collection/`, `src/app/collection/`, `src/app/decks/`, `src/components/decks/`, `src/components/catalog/`, `src/components/home/`
**Files scanned:** 9
**Pattern extraction date:** 2026-05-27

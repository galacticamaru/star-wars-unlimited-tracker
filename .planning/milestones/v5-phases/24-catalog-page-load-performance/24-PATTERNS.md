# Phase 24: Catalog & Page Load Performance — Pattern Map

**Mapped:** 2026-05-26
**Files analyzed:** 9
**Analogs found:** 9 / 9 (all files exist and were read directly — no analog search needed; every file is being modified, not created)

---

## File Classification

| File | Role | Data Flow | Closest Analog | Match Quality |
|------|------|-----------|----------------|---------------|
| `src/app/cards/page.tsx` | page (RSC) | request-response | itself (modify) | exact — read current state below |
| `src/components/catalog/catalog-client.tsx` | component (client) | event-driven | itself (modify) | exact |
| `src/components/catalog/sidebar-filters.tsx` | component (client) | event-driven | itself (modify) | exact |
| `src/components/catalog/card-grid.tsx` | component (client) | transform | itself (modify) | exact |
| `src/components/catalog/card-item.tsx` | component (client) | request-response | itself (modify) | exact |
| `src/db/queries/catalog.ts` | service (DB query) | CRUD | itself (modify) | exact |
| `src/app/api/cron/sync-cards/route.ts` | route handler | request-response | itself (modify) | exact |
| `src/app/decks/[id]/page.tsx` | page (RSC) | request-response | itself (modify) | exact |
| `next.config.ts` | config | — | itself (modify) | exact |

---

## Pattern Assignments

### `src/app/cards/page.tsx` (page RSC, request-response)

**What changes:** Remove `export const dynamic = 'force-dynamic'` (D-06). Remove session read and `auth`/`headers` imports (D-07 — `getAllCards` no longer takes `userId`). Call `getAllCards()` with no arguments.

**Current full file** (lines 1–57):
```typescript
import { getAllCards, getFilterOptions, getPrintingArtMap } from '@/db/queries/catalog';
import { CatalogClient } from '@/components/catalog/catalog-client';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';    // <-- DELETE THIS LINE

export default async function CatalogPage() {
  const session = await auth.api.getSession({    // <-- DELETE lines 9-11
    headers: await headers(),
  });

  const [cards, filterOptions, printingArtMap] = await Promise.all([
    getAllCards(session?.user.id ? Number(session.user.id) : undefined),  // <-- change to getAllCards()
    getFilterOptions(),
    getPrintingArtMap(),
  ]);

  // Map to plain serializable objects
  const plainCards = cards.map(c => ({
    id: c.id,
    swudbId: c.swudbId,
    name: c.name,
    // ... (unchanged — all fields except collectionCount)
  }));

  return (
    <CatalogClient
      cards={plainCards}
      filterOptions={filterOptions}
      printingArtMap={printingArtMap}
    />
  );
}
```

**Target state after changes:**
- `import { auth }` and `import { headers }` removed
- `export const dynamic = 'force-dynamic'` removed
- `getAllCards()` called with no arguments
- `plainCards` mapping unchanged (no `collectionCount` was in it — already safe)

---

### `src/components/catalog/catalog-client.tsx` (component, event-driven)

**What changes:** Add local `searchInput` state + `useEffect` debounce (D-01). Pass `searchInput`/`setSearchInput` to sidebar instead of `search`/`setSearch` for the text input. Update `handleClearAll` to also reset `setSearchInput('')` (RESEARCH.md Pitfall 4). The `filtered` useMemo continues to use the nuqs `search` value (not `searchInput`).

**Existing nuqs state wiring** (lines 99–112):
```typescript
const [search, setSearch] = useQueryState('q', parseAsString.withDefault('').withOptions({ shallow: true }));
const [selectedSets, setSelectedSets] = useQueryState('sets', parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: true }));
// ... 9 more nuqs state fields, all with shallow: true
```

**Existing filtered useMemo** (lines 117–150) — `search` (nuqs value) stays in deps, not `searchInput`:
```typescript
const filtered = useMemo(
  () => filterCards(
    cards,
    {
      search,           // <-- nuqs value, NOT searchInput
      selectedSets,
      // ...
    },
    collection
  ),
  [cards, search, selectedSets, /* ... all filter state */]
);
```

**Existing handleClearAll** (lines 152–164):
```typescript
const handleClearAll = () => {
  setSearch('');        // <-- also add setSearchInput('') here
  setSelectedSets([]);
  // ...
};
```

**Existing sidebarProps** (lines 182–206):
```typescript
const sidebarProps = {
  search, onSearchChange: setSearch,    // <-- change to: search: searchInput, onSearchChange: setSearchInput
  // ...
};
```

**Scroll container for virtualizer** (line 214):
```typescript
<main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
// This is the element that needs a ref for the virtualizer's getScrollElement.
// CatalogClient creates useRef(), attaches to this <main>, passes ref as prop to CardGrid.
```

**Pattern to add (inline debounce, lines to insert after existing nuqs state block)**:
```typescript
// After the 'search' nuqs state declaration:
const [searchInput, setSearchInput] = useState(search)  // mirrors nuqs initial value

useEffect(() => {
  const timer = setTimeout(() => {
    void setSearch(searchInput || null)  // null removes param from URL
  }, 150)
  return () => clearTimeout(timer)
}, [searchInput])
```

**Scroll container ref plumbing to add:**
```typescript
import { useRef } from 'react';
// ...
const scrollContainerRef = useRef<HTMLElement>(null)
// Attach: <main ref={scrollContainerRef} ...>
// Pass: <CardGrid ... scrollContainerRef={scrollContainerRef} />
```

---

### `src/components/catalog/sidebar-filters.tsx` (component, event-driven)

**What changes:** The `search` prop and `onSearchChange` handler are already wired correctly — no interface change needed. The only behavioral change is that the caller (`CatalogClient`) will pass `searchInput` instead of `search` and `setSearchInput` instead of `setSearch`. The inline clear button (line 109) calls `onSearchChange('')` which already correctly resets the local state.

**Current search input block** (lines 100–119):
```typescript
<div className="relative">
  <Input
    type="text"
    placeholder="Search cards..."
    value={search}
    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
    className="pr-8"
  />
  {search && (
    <Button
      variant="ghost"
      size="icon-sm"
      className="absolute right-1 top-1/2 -translate-y-1/2"
      onClick={() => onSearchChange('')}   // already clears via handler
      aria-label="Clear search"
    >
      <X className="w-4 h-4" />
    </Button>
  )}
</div>
```

**No changes needed to this file** — the component itself is correct. The fix is entirely in how `CatalogClient` calls it (passing `searchInput`/`setSearchInput`). The `{search && ...}` conditional (line 108) will now use `searchInput`, which is the local display state, so the clear button visibility remains accurate.

---

### `src/components/catalog/card-grid.tsx` (component, transform)

**What changes:** Add `useVirtualizer` from `@tanstack/react-virtual` (D-03). Add breakpoint detection hook for column count (D-04). Accept `scrollContainerRef` prop from `CatalogClient` (D-05). Pass `priority={index < 22}` to `CardItem` (D-10). Replace the flat CSS grid container with a virtualizer-compatible absolute-position wrapper; each virtual row renders its own per-row CSS grid.

**Current full component** (lines 1–69):
```typescript
import { CardItem } from './card-item';
import type { CardForFilter } from '@/lib/filter-cards';
import type { CollectionMap } from '@/app/api/collection/collection-shape';
import { selectBestVariantArtUrl, type PrintingArtMap } from '@/lib/catalog/select-best-variant';

interface CardGridProps {
  cards: CardForFilter[];
  collection: CollectionMap;
  printingArtMap?: PrintingArtMap;
  onUpdateCount?: (id: number, count: number) => void;
  mode?: 'catalog' | 'selector' | 'want-list' | 'binder' | 'want';
  deckCounts?: Record<number, number>;
  onDeckUpdate?: (cardDefinitionId: number, count: number) => void;
}

export function CardGrid({ cards, collection, printingArtMap, onUpdateCount, mode = 'catalog', deckCounts = {}, onDeckUpdate }: CardGridProps) {
  return (
    <div
      className={[
        'grid gap-2 px-4 py-4',
        'grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-11',
      ].join(' ')}
    >
      {cards.map(card => {
        const cardVariants = collection[card.id]?.variants;
        const bestVariantArtUrl = cardVariants && printingArtMap
          ? selectBestVariantArtUrl(cardVariants, printingArtMap)
          : null;

        return (
          <CardItem
            key={`${card.collectorNumber}-${mode}`}
            id={card.id}
            name={card.name}
            // ... all other props
          />
        );
      })}
    </div>
  );
}
```

**Target state after changes (per RESEARCH.md Pattern 2):**

Props interface adds:
```typescript
scrollContainerRef: React.RefObject<HTMLElement | null>
```

Component adds (before return):
```typescript
'use client'
import { useVirtualizer } from '@tanstack/react-virtual'
// breakpoint hook (implementation at planner's discretion: useWindowSize or matchMedia)

const columns = useBreakpointColumns() // returns 3|5|7|9|11
const rowCount = Math.ceil(cards.length / columns)

const rowVirtualizer = useVirtualizer({
  count: rowCount,
  getScrollElement: () => scrollContainerRef.current,
  estimateSize: () => 160,   // ~160px per row at base breakpoint; virtualizer self-corrects
  overscan: 3,
})
```

Return value replaces the flat grid div:
```typescript
// CRITICAL: outer div must NOT be a CSS grid (RESEARCH.md Pitfall 5)
<div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }} className="mx-4 my-4">
  {rowVirtualizer.getVirtualItems().map(virtualRow => {
    const startIndex = virtualRow.index * columns
    const rowCards = cards.slice(startIndex, startIndex + columns)
    return (
      <div
        key={virtualRow.key}
        style={{
          position: 'absolute',
          top: 0,
          transform: `translateY(${virtualRow.start}px)`,
          width: '100%',
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '0.5rem',
        }}
      >
        {rowCards.map((card, colIndex) => {
          const cardVariants = collection[card.id]?.variants;
          const bestVariantArtUrl = cardVariants && printingArtMap
            ? selectBestVariantArtUrl(cardVariants, printingArtMap)
            : null;
          return (
            <CardItem
              key={`${card.collectorNumber}-${mode}`}
              priority={startIndex + colIndex < 22}
              // ... all existing props
            />
          );
        })}
      </div>
    );
  })}
</div>
```

**Note on `'use client'`:** The current `card-grid.tsx` has no `'use client'` directive — it is a server component currently because it contains no hooks. Adding `useVirtualizer` makes it a client component; `'use client'` must be added at line 1.

---

### `src/components/catalog/card-item.tsx` (component, request-response)

**What changes:** Add `priority?: boolean` prop to interface (D-10). Forward to `<Image priority={priority} />`.

**Current interface** (lines 9–29):
```typescript
interface CardItemProps {
  id: number;
  name: string;
  type: string;
  setCode: string;
  collectorNumber: string;
  frontArtUrl: string | null;
  backArtUrl: string | null;
  bestVariantArtUrl?: string | null;
  ownedCount: number;
  onUpdateCount?: (id: number, count: number) => void;
  mode?: 'catalog' | 'selector' | 'want-list' | 'binder' | 'want';
  deckCount?: number;
  deckQuantity?: number;
  shortfall?: number;
  onDeckUpdate?: (id: number, count: number) => void;
  tradeQuantity?: number;
  variantType?: string;
  lookingForQuantity?: number;
}
```

**Add to interface** (after `lookingForQuantity?: number`):
```typescript
priority?: boolean
```

**Add to destructuring** (line 50, after `lookingForQuantity = 0`):
```typescript
priority = false,
```

**Current `<Image>` element** (lines 96–107):
```typescript
<Image
  src={displayUrl}
  alt={name}
  fill
  sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, (max-width: 1280px) 15vw, (max-width: 1536px) 12vw, 10vw"
  className={cn(
    'object-cover transition-opacity duration-300',
    !loaded && 'opacity-0',
  )}
  onLoad={() => setLoaded(true)}
  onError={() => setLoaded(true)}
/>
```

**Target state** (add `priority={priority}` prop):
```typescript
<Image
  src={displayUrl}
  alt={name}
  fill
  sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, (max-width: 1280px) 15vw, (max-width: 1536px) 12vw, 10vw"
  className={cn(
    'object-cover transition-opacity duration-300',
    !loaded && 'opacity-0',
  )}
  priority={priority}
  onLoad={() => setLoaded(true)}
  onError={() => setLoaded(true)}
/>
```

**Test file to update:** `src/components/catalog/card-item.test.tsx` — existing mock at line 10:
```typescript
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));
```
The mock already passes all props through to `<img>`, so `priority` will be in the rendered output. Test can assert `priority` attribute on the img element by index.

---

### `src/db/queries/catalog.ts` (service, CRUD)

**What changes:** Remove `userId` param from `getAllCards` (D-07). Remove `collectionCount` select column and `leftJoin(userCollections, ...)` (D-07, RESEARCH.md Pitfall 3). Add `'use cache'` directive + `cacheTag('cards')` + `cacheLife('days')` to `getAllCards`, `getFilterOptions`, and `getPrintingArtMap` (D-08).

**Current `getAllCards` signature and structure** (lines 6–55):
```typescript
import { db } from '@/db';
import { cardDefinitions, cardPrintings, userCollections } from '@/db/schema';
import { eq, and, notIlike, asc, sql, desc, isNotNull, inArray } from 'drizzle-orm';
import type { PrintingArtMap } from '@/lib/catalog/select-best-variant';

export async function getAllCards(userId?: number) {
  return db
    .select({
      id: cardDefinitions.id,
      // ... all fields ...
      collectionCount: sql<number>`COALESCE(${userCollections.count}, 0)`,   // <-- DELETE
    })
    .from(cardDefinitions)
    .innerJoin(cardPrintings, eq(cardDefinitions.id, cardPrintings.cardDefinitionId))
    .leftJoin(                                                                // <-- DELETE all of leftJoin
      userCollections,
      and(
        eq(cardDefinitions.id, userCollections.cardDefinitionId),
        userId ? eq(userCollections.userId, userId) : sql`FALSE`
      )
    )
    .where(and(notIlike(cardDefinitions.type, '%token%')))
    .orderBy(asc(cardPrintings.setCode), asc(cardPrintings.collectorNumber));
}
```

**Target state** (import change + cache directives):
```typescript
import { cacheTag, cacheLife } from 'next/cache'   // <-- NEW import

// Remove 'userCollections' from the existing schema import:
import { cardDefinitions, cardPrintings } from '@/db/schema';
// Remove 'sql' from drizzle-orm imports (only used for collectionCount):
import { eq, and, notIlike, asc, desc, isNotNull, inArray } from 'drizzle-orm';

export async function getAllCards() {   // <-- no userId param
  'use cache'
  cacheTag('cards')
  cacheLife('days')
  return db
    .select({
      id: cardDefinitions.id,
      swudbId: cardDefinitions.swudbId,
      name: cardDefinitions.name,
      subtitle: cardDefinitions.subtitle,
      type: cardDefinitions.type,
      aspects: cardDefinitions.aspects,
      arenas: cardDefinitions.arenas,
      traits: cardDefinitions.traits,
      keywords: cardDefinitions.keywords,
      cost: cardDefinitions.cost,
      power: cardDefinitions.power,
      hp: cardDefinitions.hp,
      setCode: cardPrintings.setCode,
      collectorNumber: cardPrintings.collectorNumber,
      frontArtUrl: cardPrintings.frontArtUrl,
      backArtUrl: cardPrintings.backArtUrl,
      rarity: cardPrintings.rarity,
      variantType: cardPrintings.variantType,
      printingId: cardPrintings.id,
      frontText: cardDefinitions.frontText,
      backText: cardDefinitions.backText,
      epicAction: cardDefinitions.epicAction,
      doubleSided: cardDefinitions.doubleSided,
      unique: cardDefinitions.unique,
      priceEur: cardDefinitions.priceEur,
      priceUsd: cardDefinitions.priceUsd,
      // collectionCount removed
    })
    .from(cardDefinitions)
    .innerJoin(cardPrintings, eq(cardDefinitions.id, cardPrintings.cardDefinitionId))
    // leftJoin to userCollections removed
    .where(and(notIlike(cardDefinitions.type, '%token%')))
    .orderBy(asc(cardPrintings.setCode), asc(cardPrintings.collectorNumber));
}
```

**`getFilterOptions` target** (lines 57–81) — add cache directives only:
```typescript
export async function getFilterOptions() {
  'use cache'
  cacheTag('cards')
  cacheLife('days')
  // ... rest of function unchanged
}
```

**`getPrintingArtMap` target** (lines 90–103) — add cache directives only:
```typescript
export async function getPrintingArtMap(): Promise<PrintingArtMap> {
  'use cache'
  cacheTag('cards')
  cacheLife('days')
  // ... rest of function unchanged
}
```

**`getTopCardsByPrice`** (lines 105–136) — no changes.

**Test file to update:** `src/db/queries/catalog.test.ts` (lines 7–13) — all stubs. The new stub wording should reflect `getAllCards()` with no userId parameter and no `collectionCount` in the return type:
```typescript
describe('getAllCards()', () => {
  it.todo('returns an array of card objects with no userId parameter');
  it.todo('excludes cards whose type contains "token" (case-insensitive)');
  it.todo('each returned card has a frontArtUrl field (string | null)');
  it.todo('each returned card has aspects as an array');
  it.todo('return type does NOT include collectionCount');
});
```

---

### `src/app/api/cron/sync-cards/route.ts` (route handler, request-response)

**What changes:** Add `revalidateTag('cards', 'max')` after both `syncAllCards()` and `syncPrices()` succeed (D-08). Add `import { revalidateTag } from 'next/cache'`. Do NOT call `revalidateTag` in the catch block — cache stays valid on failure.

**Current structure** (lines 1–36):
```typescript
import type { NextRequest } from 'next/server';
import { syncAllCards } from '@/lib/sync/upsert-cards';
import { syncPrices } from '@/lib/sync/prices';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const startTime = Date.now();

  try {
    console.log('Starting card sync...');
    const cardResult = await syncAllCards();
    
    console.log('Starting price sync...');
    const priceResult = await syncPrices();

    const duration = (Date.now() - startTime) / 1000;

    return Response.json({ 
      success: true, 
      cards: cardResult,
      prices: priceResult,
      duration: `${duration}s`
    });
  } catch (error) {
    console.error('Sync failed:', error);
    return new Response('Sync failed', { status: 500 });
  }
}
```

**Add import** (after line 3):
```typescript
import { revalidateTag } from 'next/cache';
```

**Add `revalidateTag` call** (inside `try`, after `priceResult` is assigned, before `return Response.json(...)`):
```typescript
// Invalidate cards cache after successful sync — next visitor gets fresh data
revalidateTag('cards', 'max')
```

**Note:** RESEARCH.md confirms single-argument `revalidateTag('cards')` is deprecated in Next.js 16. Use `revalidateTag('cards', 'max')` (two-argument form). [Verified against `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidateTag.md`]

**Also note:** This route has no `export const dynamic = 'force-dynamic'` currently. RESEARCH.md Pitfall 6 warns that after enabling `cacheComponents: true` in `next.config.ts`, GET route handlers follow the prerendering model. This route reads `request.headers` at runtime — it may need `export const dynamic = 'force-dynamic'` added to prevent prerendering. Verify during build step.

---

### `src/app/decks/[id]/page.tsx` (page RSC, request-response)

**What changes:** Remove `userId` argument from `getAllCards(Number(session.user.id))` call (line 24). Session read stays (still needed for `getDeckWithCards` and `redirect('/login')` guard). `collectionCount` is not referenced in the `cards.map()` spread below — the field simply disappears from the type.

**Current call site** (line 24):
```typescript
getAllCards(Number(session.user.id)),   // <-- change to: getAllCards(),
```

**Deck page cards.map()** (lines 44–70) — note `collectionCount` is NOT mapped here, confirming it is safe to remove:
```typescript
const cards = allCards.map(c => ({
  id: c.id,
  swudbId: c.swudbId,
  name: c.name,
  // ... all fields present in current getAllCards return
  variantType: c.variantType ?? undefined,
  // collectionCount: c.collectionCount  <-- does not appear; removal is safe
}));
```

**Session + auth remains unchanged** (lines 14–20):
```typescript
const session = await auth.api.getSession({
  headers: await headers(),
});

if (!session) {
  redirect('/login');
}
```

---

### `next.config.ts` (config)

**What changes:** Add `cacheComponents: true` to enable the Next.js 16 `'use cache'` directive model (D-08).

**Current full file** (lines 1–19):
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.swu-db.com',
        pathname: '/**',
      },
    ],
    qualities: [75],
    minimumCacheTTL: 2678400,
    // TODO(2026-06-04): Vercel Image Transformations quota exhausted — remove unoptimized once quota renews
    unoptimized: true,
  },
};

export default nextConfig;
```

**Target state** (add `cacheComponents: true` before `images`):
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,    // enables 'use cache' directive + Cache Components model
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.swu-db.com',
        pathname: '/**',
      },
    ],
    qualities: [75],
    minimumCacheTTL: 2678400,
    // TODO(2026-06-04): Vercel Image Transformations quota exhausted — remove unoptimized once quota renews
    unoptimized: true,
  },
};

export default nextConfig;
```

**Warning:** After this change, run `npm run build` immediately to verify no route handlers break (RESEARCH.md Pitfall 6, Assumption A4). The `/api/cron/sync-cards/route.ts` and `/api/cards/all/route.ts` routes may need `export const dynamic = 'force-dynamic'` to opt out of prerendering.

---

## Shared Patterns

### Next.js 16 Cache Directive
**Source:** `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md` (verified by RESEARCH.md)
**Apply to:** `getAllCards`, `getFilterOptions`, `getPrintingArtMap` in `src/db/queries/catalog.ts`
```typescript
import { cacheTag, cacheLife } from 'next/cache'

export async function getAllCards() {
  'use cache'          // must be first statement in function body
  cacheTag('cards')    // must be called before any await
  cacheLife('days')    // optional lifetime profile
  // ... db query
}
```

### Cache Invalidation Pattern
**Source:** `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidateTag.md` (verified by RESEARCH.md)
**Apply to:** `src/app/api/cron/sync-cards/route.ts` (after successful sync only)
```typescript
import { revalidateTag } from 'next/cache'
// Inside try block, after all sync operations succeed:
revalidateTag('cards', 'max')   // two-argument form — single-arg is deprecated in Next.js 16
```

### nuqs Shallow Filter State
**Source:** `src/components/catalog/catalog-client.tsx` (lines 99–112)
**Apply to:** Debounce only applies to the `search`/`q` nuqs param. All other nuqs params keep their direct setters.
```typescript
const [search, setSearch] = useQueryState('q', parseAsString.withDefault('').withOptions({ shallow: true }));
```

### Inline useEffect Debounce
**Source:** RESEARCH.md Pattern 3 (standard React pattern)
**Apply to:** `src/components/catalog/catalog-client.tsx` (new addition)
```typescript
const [searchInput, setSearchInput] = useState(search)

useEffect(() => {
  const timer = setTimeout(() => {
    void setSearch(searchInput || null)
  }, 150)
  return () => clearTimeout(timer)
}, [searchInput])
```

### Next.js Image with Priority
**Source:** `src/components/catalog/card-item.tsx` lines 96–107 (existing `<Image>` usage)
**Apply to:** Add `priority` prop to existing `<Image>` call in `card-item.tsx`
```typescript
<Image
  src={displayUrl}
  alt={name}
  fill
  sizes="..."
  priority={priority}    // new prop — true for index < 22, false/undefined otherwise
  className={cn(...)}
  onLoad={() => setLoaded(true)}
  onError={() => setLoaded(true)}
/>
```

---

## No Analog Found

None. All files in scope exist and were read directly.

---

## Wave 0 Test Files (New — per RESEARCH.md)

| New Test File | Role | What to Cover |
|---------------|------|---------------|
| `src/components/catalog/card-grid.test.tsx` | unit (jsdom) | PERF-01: virtualized rows (only visible rows in DOM); PERF-03: first 22 cards have `priority=true` |

**Test environment pattern** (copy from `src/components/catalog/card-item.test.tsx` lines 1–17):
```typescript
// @vitest-environment jsdom
import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));
```

---

## Metadata

**Files scanned:** 9 (all read directly — every scoped file is a modification, not a creation)
**New dependency:** `@tanstack/react-virtual` (not yet installed — see RESEARCH.md §Environment Availability for SSL cert workaround)
**Pattern extraction date:** 2026-05-26
**Next.js version confirmed:** 16.2.4 — `'use cache'` + `cacheTag` is the correct caching API

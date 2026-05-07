# Phase 5: Want List - Pattern Map

**Mapped:** 2026-05-06
**Files analyzed:** 8 new/modified files
**Analogs found:** 8 / 8

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/nav-bar.tsx` | component | request-response | `src/components/catalog/top-bar.tsx` | role-match |
| `src/app/layout.tsx` | config | request-response | `src/app/layout.tsx` (modify in place) | exact |
| `src/components/decks/deck-builder.tsx` | component | event-driven | `src/components/decks/deck-builder.tsx` (modify in place) | exact |
| `src/components/decks/want-list-tab.tsx` | component | request-response | `src/components/catalog/catalog-client.tsx` | role-match |
| `src/components/catalog/card-item.tsx` | component | event-driven | `src/components/catalog/card-item.tsx` (modify in place) | exact |
| `src/app/decks/page.tsx` | component | request-response | `src/app/decks/page.tsx` (modify in place) | exact |
| `src/db/queries/decks.ts` | service | CRUD | `src/db/queries/decks.ts` (modify in place) | exact |
| `src/app/api/want-list/route.ts` | route | request-response | `src/app/api/collection/route.ts` | exact |

---

## Pattern Assignments

### `src/components/nav-bar.tsx` (component, request-response) — NEW

**Analog:** `src/components/catalog/top-bar.tsx`

Must be `'use client'` for `usePathname()`. Height 56px (`h-14`). Sticky top-0, z-50. Visual style matches TopBar.

**Imports pattern** (analog: top-bar.tsx lines 1-8, layout.tsx lines 1-5):
```typescript
'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
```

**Core pattern** — sticky bar structure from top-bar.tsx lines 46-53, adapted for nav:
```typescript
// From top-bar.tsx lines 46-53 — copy this sticky/backdrop pattern
<div
  className={cn(
    'sticky top-0 z-50 h-14 flex items-center',
    'px-4 md:px-8',
    'bg-background/80 backdrop-blur-sm border-b border-border',
  )}
>
```

**Active link detection** — usePathname + exact/prefix rules from UI-SPEC.md §8:
```typescript
// Active matching: exact for '/', prefix for others
const isActive = (href: string) =>
  href === '/' ? pathname === '/' : pathname.startsWith(href);

// Active styling: text-foreground font-semibold border-b-2 border-primary
// Inactive styling: text-muted-foreground hover:text-foreground transition-colors
// Both: h-11 flex items-center px-4 (44px touch target)
```

**Brand mark + links layout:**
```typescript
<span className="font-heading font-semibold text-base text-foreground mr-auto">
  SWU Tracker
</span>
<nav className="flex items-center gap-2">
  {[
    { href: '/', label: 'Catalog' },
    { href: '/collection', label: 'Collection' },
    { href: '/decks', label: 'Decks' },
  ].map(({ href, label }) => (
    <Link
      key={href}
      href={href}
      className={cn(
        'h-11 flex items-center px-4 text-sm transition-colors duration-150',
        isActive(href)
          ? 'text-foreground font-semibold border-b-2 border-primary'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {label}
    </Link>
  ))}
</nav>
```

---

### `src/app/layout.tsx` (config, request-response) — MODIFY

**Analog:** `src/app/layout.tsx` (lines 1-42, read in full)

Add `<NavBar>` as a sibling above `<NuqsAdapter>` inside `<body>`. Also update the page title metadata.

**Current body pattern** (lines 37-41):
```typescript
<body className="min-h-full flex flex-col">
  <NuqsAdapter>{children}</NuqsAdapter>
</body>
```

**Modified body pattern — insert NavBar before NuqsAdapter:**
```typescript
import { NavBar } from '@/components/nav-bar';

<body className="min-h-full flex flex-col">
  <NavBar />
  <NuqsAdapter>{children}</NuqsAdapter>
</body>
```

Note: `NavBar` is a client component rendered inside a server layout — this is valid in Next.js App Router. The `NuqsAdapter` wraps only `{children}`, not NavBar, which is correct since NavBar uses `usePathname()` independently.

---

### `src/components/decks/deck-builder.tsx` (component, event-driven) — MODIFY

**Analog:** `src/components/decks/deck-builder.tsx` (lines 1-348, read in full)

**View state extension** (line 80 — current):
```typescript
// CURRENT (line 80):
const [view, setView] = useState<'editor' | 'catalog'>('catalog');

// MODIFIED:
const [view, setView] = useState<'editor' | 'catalog' | 'want-list'>('catalog');
```

**Tab button group extension** (lines 216-233 — current two-button group, add third):
```typescript
// CURRENT container (line 216): <div className="flex bg-slate-100 rounded-lg p-1">
// Add third button matching exact same variant/size/className pattern:
<Button
    variant={view === 'want-list' ? 'secondary' : 'ghost'}
    size="sm"
    onClick={() => setView('want-list')}
    className={view === 'want-list' ? 'bg-white shadow-sm' : ''}
>
    Want List
</Button>
```

**Content area extension** (lines 257-332 — current `{view === 'catalog' ? ... : ...}`):
```typescript
// CURRENT (lines 257-332): two-branch ternary
// MODIFIED: three-branch with want-list as third case:
{view === 'catalog' ? (
    <CatalogClient ... />
) : view === 'editor' ? (
    <div className="max-w-4xl mx-auto space-y-8 p-6 pb-20">
      {/* existing editor content — unchanged */}
    </div>
) : (
    <WantListTab deckCards={state.cards.filter(c => !c.isSideboard)} allCards={allCards} />
)}
```

**Height calc adjustment** (line 205):
```typescript
// CURRENT (line 205): h-[calc(100vh-64px)]
// MODIFIED: h-[calc(100svh-56px)]  ← nav bar is 56px (h-14), use svh for mobile safety
<div className="flex h-[calc(100svh-56px)] overflow-hidden">
```

**WantListTab import** — add alongside CatalogClient import (line 8):
```typescript
import { WantListTab } from './want-list-tab';
```

---

### `src/components/decks/want-list-tab.tsx` (component, request-response) — NEW

**Analog:** `src/components/catalog/catalog-client.tsx` (lines 1-163)

Fetches `GET /api/collection` in `useEffect` (same as CatalogClient lines 53-58), computes shortfall from `deckCards`, renders grouped by type.

**Imports pattern** (modeled on catalog-client.tsx lines 1-9):
```typescript
'use client'

import { useEffect, useState, useMemo } from 'react';
import type { Card } from '@/lib/deck-validation';

interface WantListTabProps {
  deckCards: { cardDefinitionId: number; quantity: number }[];
  allCards: Card[];
}
```

**Collection fetch pattern** (exact copy of catalog-client.tsx lines 51-58):
```typescript
const [collection, setCollection] = useState<Record<number, number>>({});
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/api/collection')
    .then(res => res.json())
    .then(data => {
      setCollection(data);
      setLoading(false);
    })
    .catch(err => {
      console.error('Failed to load collection:', err);
      setLoading(false);
    });
}, []);
```

**Shortfall computation** (derived from deckCards + collection):
```typescript
const shortfallCards = useMemo(() => {
  return deckCards
    .map(dc => {
      const card = allCards.find(c => c.id === dc.cardDefinitionId);
      if (!card) return null;
      const owned = collection[dc.cardDefinitionId] || 0;
      const shortfall = dc.quantity - owned;
      if (shortfall <= 0) return null;
      return { card, quantity: dc.quantity, owned, shortfall };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}, [deckCards, collection, allCards]);
```

**Type group ordering** (hard-coded sort from UI-SPEC.md §7):
```typescript
const TYPE_ORDER = ['Leader', 'Base', 'Unit', 'Event', 'Upgrade'];

const grouped = useMemo(() => {
  const map = new Map<string, typeof shortfallCards>();
  for (const item of shortfallCards) {
    const t = item.card.type;
    if (!map.has(t)) map.set(t, []);
    map.get(t)!.push(item);
  }
  return [...map.entries()].sort(([a], [b]) => {
    const ai = TYPE_ORDER.indexOf(a);
    const bi = TYPE_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}, [shortfallCards]);
```

**Loading state** (from UI-SPEC.md interaction contracts):
```typescript
if (loading) {
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Loading want list...</p>
    </div>
  );
}
```

**Empty states** (UI-SPEC.md copywriting contract):
```typescript
// Deck has no cards:
if (deckCards.length === 0) {
  return <div ...>No cards in this deck yet. Switch to Add Cards to start building.</div>;
}
// Deck fully owned:
if (shortfallCards.length === 0) {
  return <div ...>You own all the cards for this deck. Nothing to buy — you're all set.</div>;
}
```

**Grid layout** (copy from card-grid.tsx lines 22-28 — same breakpoint grid):
```typescript
<div className="grid gap-2 px-4 py-4 grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9">
```

**Type group header** (UI-SPEC.md §2):
```typescript
<h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-muted pb-1 mb-2">
  {typeName}
</h3>
```

---

### `src/components/catalog/card-item.tsx` (component, event-driven) — MODIFY

**Analog:** `src/components/catalog/card-item.tsx` (lines 1-220, read in full)

Add `mode="want-list"` branch. The stat chips (NEED / OWN / SHORT) are rendered OUTSIDE the `<Link>`, below `div.group`, mirroring how the existing owned-count badge is rendered outside the Link (lines 188-193).

**Props interface extension** (lines 9-22):
```typescript
// Add 'want-list' to mode union and new want-list-specific props:
interface CardItemProps {
  // ... existing props unchanged ...
  mode?: 'catalog' | 'selector' | 'want-list';
  // Want-list mode props (optional, only used when mode='want-list'):
  deckQuantity?: number;   // quantity needed by deck
  shortfall?: number;      // deckQuantity - ownedCount
}
```

**Border/glow logic extension** (line 68-69 — current hasShortfall):
```typescript
// CURRENT (line 54):
const hasShortfall = isSelector && deckCount > ownedCount;

// MODIFIED:
const isWantList = mode === 'want-list';
const hasShortfall = (isSelector && deckCount > ownedCount) || isWantList;
// want-list tiles ALWAYS show red border (only shortfall cards are rendered)
```

**Hover overlay extension** (lines 91-180 — current isSelector branch):
```typescript
// Add want-list as third branch — read-only overlay:
{isWantList ? (
  // Read-only overlay: show card name only for accessibility
  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 flex items-center justify-center z-10 px-1">
    <span className="text-white text-xs font-semibold text-center leading-tight">{name}</span>
  </div>
) : isSelector ? (
  // ... existing selector branch unchanged (lines 91-143) ...
) : (
  // ... existing catalog branch unchanged (lines 145-180) ...
)}
```

**Stat chips below tile** — rendered after the closing `</Link>` tag, before closing `</div>` of `div.group` (analog: owned badge pattern at lines 188-193):
```typescript
{isWantList && (
  <div className="flex gap-1 justify-center mt-1">
    <span className="bg-muted text-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
      NEED {deckQuantity}
    </span>
    <span className="bg-muted text-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
      OWN {ownedCount}
    </span>
    <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
      SHORT {shortfall}
    </span>
  </div>
)}
```

**Aria label for want-list mode** (UI-SPEC.md copywriting):
```typescript
// On the outer div.group when isWantList:
aria-label={isWantList ? `${name} — need ${deckQuantity}, own ${ownedCount}, short ${shortfall}` : undefined}
```

---

### `src/app/decks/page.tsx` (component, request-response) — MODIFY

**Analog:** `src/app/decks/page.tsx` (lines 1-130, read in full)

Currently a `'use client'` component fetching `/api/decks`. Add a second `useEffect` fetching `GET /api/want-list` (new endpoint) for the combined want list section.

**Additional state** (after line 17 — current useState declarations):
```typescript
// Add below existing state declarations:
interface WantListEntry {
  cardDefinitionId: number;
  name: string;
  type: string;
  setCode: string;
  collectorNumber: string;
  frontArtUrl: string | null;
  backArtUrl: string | null;
  maxQuantity: number;
  owned: number;
  shortfall: number;
}
const [wantList, setWantList] = useState<WantListEntry[]>([]);
const [wantListLoading, setWantListLoading] = useState(true);
```

**Collection fetch pattern** (analog: catalog-client.tsx lines 53-58):
```typescript
useEffect(() => {
  fetch('/api/want-list')
    .then(res => res.json())
    .then(data => {
      setWantList(data);
      setWantListLoading(false);
    })
    .catch(err => {
      console.error('Failed to fetch want list', err);
      setWantListLoading(false);
    });
}, []);
```

**Combined want list section** — placed after the deck list grid (after line 126 closing `</div>`), separated by `mt-12` (48px = 2xl from spacing scale):
```typescript
{/* What I Need to Buy — only shown if decks exist and shortfall > 0 */}
{decks.length > 0 && (wantListLoading || wantList.length > 0) && (
  <div className="mt-12">
    <h2 className="text-xl font-heading font-semibold mb-2">What I Need to Buy</h2>
    <p className="text-sm text-muted-foreground mb-6">
      {wantListLoading
        ? 'Calculating...'
        : `${wantList.length} cards needed, ${wantList.reduce((s, c) => s + c.shortfall, 0)} total copies short`}
    </p>
    {/* Type-grouped card grid using WantListCardItem — same grid breakpoints as deck builder */}
    {/* ... grouped rendering using TYPE_ORDER, same pattern as WantListTab ... */}
  </div>
)}
```

**Type-grouped grid** (same pattern as WantListTab — share TYPE_ORDER constant in a shared util or duplicate locally):
```typescript
// Same TYPE_ORDER and grouping logic as WantListTab
const TYPE_ORDER = ['Leader', 'Base', 'Unit', 'Event', 'Upgrade'];
// Group wantList by type, sort by TYPE_ORDER
// Render: section heading + grid of WantListCardItem per group
```

---

### `src/db/queries/decks.ts` (service, CRUD) — MODIFY

**Analog:** `src/db/queries/decks.ts` (lines 1-165, read in full)

Add `getDeckCardsForUser(userId)` — returns all `deck_cards` rows joined with `card_definitions` and `card_printings` for a given user's decks. Follows the same `db.select().from().innerJoin().where()` pattern as `getDeckForExport` (lines 102-165).

**Imports already present** (lines 1-4 — no new imports needed):
```typescript
import { db } from '@/db';
import { decks, deckCards, cardDefinitions, cardPrintings } from '@/db/schema';
import { eq, desc, inArray, and } from 'drizzle-orm';
```

**New query function** — modeled on `getDeckForExport` join pattern (lines 139-157) and `getDecks` userId filter (lines 5-11):
```typescript
export async function getDeckCardsForUser(userId: number = 1) {
  // Get all deck IDs for this user first
  const userDecks = await db
    .select({ id: decks.id })
    .from(decks)
    .where(eq(decks.userId, userId));

  if (userDecks.length === 0) return [];

  const deckIds = userDecks.map(d => d.id);

  // Fetch all deck cards with card definition + Normal printing details
  return db
    .select({
      deckId: deckCards.deckId,
      cardDefinitionId: deckCards.cardDefinitionId,
      quantity: deckCards.quantity,
      isSideboard: deckCards.isSideboard,
      name: cardDefinitions.name,
      type: cardDefinitions.type,
      setCode: cardPrintings.setCode,
      collectorNumber: cardPrintings.collectorNumber,
      frontArtUrl: cardPrintings.frontArtUrl,
      backArtUrl: cardPrintings.backArtUrl,
    })
    .from(deckCards)
    .innerJoin(cardDefinitions, eq(deckCards.cardDefinitionId, cardDefinitions.id))
    .innerJoin(cardPrintings, eq(cardDefinitions.id, cardPrintings.cardDefinitionId))
    .where(
      and(
        inArray(deckCards.deckId, deckIds),
        eq(cardPrintings.variantType, 'Normal')
      )
    );
}
```

**Shortfall aggregation logic** (D-06: `shortfall = max(0, max(quantity_in_any_deck) − owned_count)`):
This aggregation is performed in the API route, not in the DB query. The query returns raw per-deck rows; the route groups by `cardDefinitionId` and computes `max(quantity)`.

---

### `src/app/api/want-list/route.ts` (route, request-response) — NEW

**Analog:** `src/app/api/collection/route.ts` (lines 1-37, read in full)

Same GET-only pattern: import DB query, call it, return `Response.json(...)`. Hardcoded userId = 1.

**Full file pattern** (modeled on collection/route.ts):
```typescript
import { getDeckCardsForUser } from '@/db/queries/decks';
import { getUserCollection } from '@/db/queries/collection';

export async function GET() {
  try {
    const [allDeckCards, collection] = await Promise.all([
      getDeckCardsForUser(1),   // hardcoded userId = 1 per v1 convention
      getUserCollection(1),
    ]);

    // Build collection map: cardDefinitionId → owned count
    const ownedMap: Record<number, number> = {};
    for (const row of collection) {
      ownedMap[row.cardDefinitionId] = row.count;
    }

    // Aggregate: max quantity per card across all decks (non-sideboard)
    const maxQty: Record<number, { quantity: number; meta: typeof allDeckCards[0] }> = {};
    for (const row of allDeckCards) {
      if (row.isSideboard) continue;
      const existing = maxQty[row.cardDefinitionId];
      if (!existing || row.quantity > existing.quantity) {
        maxQty[row.cardDefinitionId] = { quantity: row.quantity, meta: row };
      }
    }

    // Compute shortfall per card (D-06 aggregation logic)
    const result = Object.entries(maxQty)
      .map(([idStr, { quantity, meta }]) => {
        const id = Number(idStr);
        const owned = ownedMap[id] || 0;
        const shortfall = Math.max(0, quantity - owned);
        if (shortfall === 0) return null;
        return {
          cardDefinitionId: id,
          name: meta.name,
          type: meta.type,
          setCode: meta.setCode,
          collectorNumber: meta.collectorNumber,
          frontArtUrl: meta.frontArtUrl,
          backArtUrl: meta.backArtUrl,
          maxQuantity: quantity,
          owned,
          shortfall,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    return Response.json(result);
  } catch (error) {
    console.error('Failed to compute want list:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
```

---

## Shared Patterns

### Collection fetch (useEffect + local state)
**Source:** `src/components/catalog/catalog-client.tsx` lines 51-58
**Apply to:** `WantListTab`, `src/app/decks/page.tsx` (want-list section)
```typescript
const [collection, setCollection] = useState<Record<number, number>>({});

useEffect(() => {
  fetch('/api/collection')
    .then(res => res.json())
    .then(data => setCollection(data))
    .catch(err => console.error('Failed to load collection:', err));
}, []);
```

### Drizzle JOIN query (innerJoin + where + variantType filter)
**Source:** `src/db/queries/decks.ts` lines 139-157 (getDeckForExport cards query)
**Apply to:** `getDeckCardsForUser` in `src/db/queries/decks.ts`
```typescript
.from(deckCards)
.innerJoin(cardDefinitions, eq(deckCards.cardDefinitionId, cardDefinitions.id))
.innerJoin(cardPrintings, eq(cardDefinitions.id, cardPrintings.cardDefinitionId))
.where(
  and(
    eq(deckCards.deckId, deckId),
    eq(cardPrintings.variantType, 'Normal')
  )
)
```

### API route pattern (GET-only, hardcoded userId = 1)
**Source:** `src/app/api/collection/route.ts` lines 1-19
**Apply to:** `src/app/api/want-list/route.ts`
```typescript
export async function GET() {
  try {
    // ... query DB ...
    return Response.json(result);
  } catch (error) {
    console.error('Failed to fetch ...:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
```

### Tab button group (pill-style, active = bg-white shadow-sm)
**Source:** `src/components/decks/deck-builder.tsx` lines 216-233
**Apply to:** Third "Want List" button in `deck-builder.tsx`
```typescript
// Container: <div className="flex bg-slate-100 rounded-lg p-1">
// Active:   variant="secondary" className="bg-white shadow-sm"
// Inactive: variant="ghost"    className=""
```

### Sticky top bar with backdrop blur
**Source:** `src/components/catalog/top-bar.tsx` lines 46-53
**Apply to:** `src/components/nav-bar.tsx`
```typescript
className="sticky top-0 z-50 flex items-center px-4 md:px-8 bg-background/80 backdrop-blur-sm border-b border-border"
```

### Card grid breakpoints
**Source:** `src/components/catalog/card-grid.tsx` lines 22-28
**Apply to:** `WantListTab` grid, combined want list section grid
```typescript
'grid gap-2 px-4 py-4 grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9'
// Note: xl:grid-cols-11 from card-grid.tsx is used in catalog; want list spec caps at lg:9
```

### Shortfall border/glow
**Source:** `src/components/catalog/card-item.tsx` lines 66-70
**Apply to:** `CardItem` in `want-list` mode (always applied)
```typescript
hasShortfall ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'border-transparent'
```

### Client fetch + setLoading pattern
**Source:** `src/app/decks/page.tsx` lines 24-36 (fetchDecks)
**Apply to:** want-list fetch in `src/app/decks/page.tsx`
```typescript
async function fetchDecks() {
  try {
    const res = await fetch('/api/decks');
    if (res.ok) {
      const data = await res.json();
      setDecks(data);
    }
  } catch (err) {
    console.error('Failed to fetch decks', err);
  } finally {
    setLoading(false);
  }
}
```

---

## No Analog Found

None. All 8 files have direct analogs in the codebase.

---

## Key Implementation Notes (from AGENTS.md + UI-SPEC.md)

- **AGENTS.md:** Read `node_modules/next/dist/docs/` before writing any Next.js code. Heed deprecation notices.
- **NavBar `'use client'`** is required for `usePathname()` — server layout can render client components as siblings.
- **Height calc:** Change `h-[calc(100vh-64px)]` → `h-[calc(100svh-56px)]` in `deck-builder.tsx` line 205 to account for 56px nav bar.
- **Stat chips** are rendered outside `<Link>`, after the closing `</Link>` tag but inside the outer `div.group` — matching the owned badge placement pattern at card-item.tsx lines 188-193.
- **No new DB schema** — Phase 5 reads from existing `deck_cards`, `user_collections`, `card_definitions`, `card_printings` tables.
- **userId hardcoded to 1** in all new queries (consistent with entire v1 codebase: collection/route.ts line 6, decks.ts line 5, collection.ts line 5).

---

## Metadata

**Analog search scope:** `src/components/`, `src/app/`, `src/db/queries/`
**Files scanned:** 12
**Pattern extraction date:** 2026-05-06

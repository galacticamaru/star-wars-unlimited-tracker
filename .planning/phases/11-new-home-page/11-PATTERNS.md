# Phase 11: New Home Page - Pattern Map

**Mapped:** 2026-05-12
**Files analyzed:** 8 new/modified files
**Analogs found:** 8 / 8

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/page.tsx` | page (RSC) | request-response | `src/app/page.tsx` (current CatalogPage — replace) | exact |
| `src/app/cards/page.tsx` | page (RSC) | request-response | `src/app/page.tsx` (current CatalogPage — copy content) | exact |
| `src/components/home/hero-section.tsx` | component (RSC) | request-response | `src/app/cards/[set-code]/[card-number]/page.tsx` (layout/font patterns) | role-match |
| `src/components/home/high-value-grid.tsx` | component (client) | request-response | `src/components/catalog/card-item.tsx` | role-match |
| `src/db/queries/catalog.ts` | query (extend) | CRUD | `src/db/queries/catalog.ts` (`getAllCards` pattern) | exact |
| `src/components/nav-bar.tsx` | component (client) | request-response | `src/components/nav-bar.tsx` (update in-place) | exact |
| `src/app/cards/[set-code]/[card-number]/page.tsx` | page (RSC) | request-response | `src/app/cards/[set-code]/[card-number]/page.tsx` (update back-link) | exact |
| `src/db/queries/catalog.test.ts` | test | — | `src/components/catalog/card-item.test.tsx` | role-match |

---

## Pattern Assignments

### `src/app/cards/page.tsx` (page RSC, request-response) — NEW

**Analog:** `src/app/page.tsx` (lines 1–54) — copy verbatim, rename function

**Imports pattern** (lines 1–4):
```typescript
import { getAllCards, getFilterOptions } from '@/db/queries/catalog';
import { CatalogClient } from '@/components/catalog/catalog-client';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
```

**Dynamic export** (line 6):
```typescript
export const dynamic = 'force-dynamic';
```

**Core RSC pattern** (lines 8–54) — auth-aware data fetch, serialize, render client component:
```typescript
export default async function CatalogPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const [cards, filterOptions] = await Promise.all([
    getAllCards(session?.user.id ? Number(session.user.id) : undefined),
    getFilterOptions(),
  ]);

  // Map to plain serializable objects — exclude createdAt/updatedAt (Date objects)
  const plainCards = cards.map(c => ({
    id: c.id,
    // ... all primitive fields, no Date columns
    priceUsd: c.priceUsd,
  }));

  return (
    <CatalogClient
      cards={plainCards}
      filterOptions={filterOptions}
    />
  );
}
```

**Note:** This is a near-verbatim copy of the current `src/app/page.tsx`. The only changes are the file location (moving it to `src/app/cards/page.tsx`) and the function name stays `CatalogPage`. The existing `plainCards` map in the current file is the correct pattern to follow.

---

### `src/app/page.tsx` (page RSC, request-response) — REPLACE

**Analog:** `src/app/page.tsx` (lines 1–54) — retain `dynamic` export; replace auth+data pattern with `getTopCardsByPrice`

**Imports pattern:**
```typescript
import { getTopCardsByPrice } from '@/db/queries/catalog';
import { HeroSection } from '@/components/home/hero-section';
import { HighValueGrid } from '@/components/home/high-value-grid';
```

**Dynamic export** — copy from current page (line 6):
```typescript
export const dynamic = 'force-dynamic';
```

**Core RSC pattern** — no auth (grid is public per D-06); serialize; pass to client:
```typescript
export default async function HomePage() {
  const topCards = await getTopCardsByPrice(10);
  const plainCards = topCards.map(c => ({
    id: c.id,
    name: c.name,
    type: c.type,
    setCode: c.setCode,
    collectorNumber: c.collectorNumber,
    frontArtUrl: c.frontArtUrl,
    backArtUrl: c.backArtUrl,
    priceUsd: c.priceUsd,
    // NEVER include: createdAt, updatedAt, pricesUpdatedAt (Date objects)
  }));
  return (
    <main>
      <HeroSection />
      <HighValueGrid cards={plainCards} />
    </main>
  );
}
```

**Serialization rule** (from current page.tsx lines 18–19 comment): Drizzle timestamp columns return `Date` objects which cannot cross the Server→Client boundary. `getTopCardsByPrice` must not select timestamp columns — only select primitives.

---

### `src/components/home/hero-section.tsx` (component, request-response) — NEW

**Analog:** `src/app/layout.tsx` (font class names) + `src/components/nav-bar.tsx` (Button/Link imports)

**Imports pattern** — copy import style from nav-bar.tsx (lines 1–14):
```typescript
import Link from 'next/link';
import { Button } from '@/components/ui/button';
```

**Font classes** (from `src/app/layout.tsx` lines 9, 11):
- `font-heading` → Oxanium (CSS variable `--font-heading`, loaded as `oxaniumHeading.variable`)
- `font-sans` → Nunito Sans (CSS variable `--font-sans`, loaded as `nunitoSans.variable`)

**Core component pattern** — pure JSX, no hooks, no `'use client'` directive:
```typescript
export function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center text-center px-6 py-20 md:py-32 bg-background">
      <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground max-w-3xl leading-tight">
        Star Wars Unlimited Card Database and Deck Builder
      </h1>
      <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-xl">
        Track your collection, build your decks, and begin trading with up to date market prices
      </p>
      <div className="mt-8 flex flex-wrap gap-4 justify-center">
        <Button asChild size="lg"><Link href="/collection">Import Collection</Link></Button>
        <Button asChild variant="outline" size="lg"><Link href="/decks">Build a Deck</Link></Button>
        <Button asChild variant="outline" size="lg"><Link href="/binder/manage">Trade</Link></Button>
      </div>
    </section>
  );
}
```

**Button usage pattern** (from nav-bar.tsx lines 7, 99–101):
```typescript
import { Button } from "@/components/ui/button";
// ...
<Button variant="outline" size="sm">Sign In</Button>
// with asChild for Link wrapping:
<Button asChild size="lg"><Link href="/collection">Import Collection</Link></Button>
```

---

### `src/components/home/high-value-grid.tsx` (component client + CardPriceTile, request-response) — NEW

**Analog:** `src/components/catalog/card-item.tsx` (lines 1–269)

**Directive + imports pattern** (card-item.tsx lines 1–7):
```typescript
'use client'

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
```

**Image loading state pattern** (card-item.tsx lines 46, 79–100) — required for `next/image` in client components:
```typescript
const [loaded, setLoaded] = useState(false);
// Container MUST have: relative + aspect-[X/Y] + overflow-hidden
<div className={cn(
  'relative rounded-md overflow-hidden bg-muted',
  isHorizontal ? 'aspect-[3/2]' : 'aspect-[2/3]',
  !loaded && 'animate-pulse',
)}>
  {displayUrl && (
    <Image
      src={displayUrl}
      alt={name}
      fill
      sizes="(max-width: 640px) 40vw, 20vw"
      className={cn('object-cover transition-opacity duration-300', !loaded && 'opacity-0')}
      onLoad={() => setLoaded(true)}
      onError={() => setLoaded(true)}
    />
  )}
</div>
```

**Collector number parsing pattern** (card-item.tsx lines 48–49):
```typescript
const dashIdx = collectorNumber.indexOf('-');
const cardNumber = dashIdx >= 0 ? collectorNumber.slice(dashIdx + 1) : collectorNumber;
```

**Leader/Base horizontal aspect pattern** (card-item.tsx lines 51–59):
```typescript
const isLeader = type.toLowerCase().includes('leader');
const isBase = type.toLowerCase().includes('base');
const displayUrl = isLeader ? (frontArtUrl || backArtUrl) : frontArtUrl;
const isHorizontal = isLeader || isBase;
```

**Card detail link pattern** (card-item.tsx lines 73–77):
```typescript
<Link href={`/cards/${setCode}/${cardNumber}`} aria-label={`View card: ${name}`} className="block">
```

**Price display pattern** (card-detail page.tsx lines 133–134):
```typescript
{card.priceUsd ? `$${(card.priceUsd / 100).toFixed(2)}` : '—'}
```

**Anti-pattern warning:** Do NOT reuse `CardItem` directly. It carries collection-management UI (`ownedCount`, +/- controls, badge overlays, `mode` prop, `onUpdateCount`) that is wrong for a read-only display grid. Create a lightweight `CardPriceTile` subcomponent instead.

**HighValueGrid wrapper** — receives `plainCards` from RSC parent as props, renders grid:
```typescript
'use client'

interface HighValueGridProps {
  cards: {
    id: number;
    name: string;
    type: string;
    setCode: string;
    collectorNumber: string;
    frontArtUrl: string | null;
    backArtUrl: string | null;
    priceUsd: number | null;
  }[];
}

export function HighValueGrid({ cards }: HighValueGridProps) {
  return (
    <section className="px-4 md:px-8 py-12">
      <h2 className="font-heading text-xl font-semibold mb-6">Highest Value Cards</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {cards.map(card => (
          <CardPriceTile key={card.id} {...card} />
        ))}
      </div>
    </section>
  );
}
```

---

### `src/db/queries/catalog.ts` (query extension, CRUD) — EXTEND

**Analog:** `src/db/queries/catalog.ts` (lines 1–53, `getAllCards`)

**Import additions needed** (current imports line 3):
```typescript
// Current:
import { eq, and, notIlike, asc, sql } from 'drizzle-orm';
// Add:
import { eq, and, notIlike, asc, sql, desc, isNotNull } from 'drizzle-orm';
```

**Core query pattern** — mirror `getAllCards` structure (lines 5–53):
```typescript
export async function getTopCardsByPrice(limit: number) {
  return db
    .select({
      id: cardDefinitions.id,
      name: cardDefinitions.name,
      type: cardDefinitions.type,
      setCode: cardPrintings.setCode,
      collectorNumber: cardPrintings.collectorNumber,
      frontArtUrl: cardPrintings.frontArtUrl,
      backArtUrl: cardPrintings.backArtUrl,
      priceUsd: cardDefinitions.priceUsd,
      // CRITICAL: no timestamp columns — Date objects cannot cross RSC→client boundary
    })
    .from(cardDefinitions)
    .innerJoin(cardPrintings, eq(cardDefinitions.id, cardPrintings.cardDefinitionId))
    .where(
      and(
        isNotNull(cardDefinitions.priceUsd),                    // exclude null-price cards
        notIlike(cardDefinitions.type, '%token%'),              // mirror getAllCards filter (line 48)
        eq(cardPrintings.variantType, 'Normal'),                // mirror getAllCards filter (line 49)
      )
    )
    .orderBy(desc(cardDefinitions.priceUsd))
    .limit(limit);
}
```

**Join pattern** (getAllCards lines 35–45): `innerJoin(cardPrintings, eq(cardDefinitions.id, cardPrintings.cardDefinitionId))` — same join needed to get `setCode`/`collectorNumber` for the card detail link.

**Filter pattern** (getAllCards lines 47–51): `notIlike(cardDefinitions.type, '%token%')` and `eq(cardPrintings.variantType, 'Normal')` — copy both; without `variantType = 'Normal'` the same card appears multiple times (Foil + Normal + Hyperspace).

---

### `src/components/nav-bar.tsx` (component client, request-response) — UPDATE

**Analog:** `src/components/nav-bar.tsx` (lines 1–107, in-place update)

**NAV_LINKS change** (line 17 — change href value only):
```typescript
// Before (line 17):
{ href: '/', label: 'Catalog' },
// After:
{ href: '/cards', label: 'Catalog' },
```

**Brand link change** (lines 37–39 — wrap span in Link):
```typescript
// Before:
<span className="font-heading font-semibold text-base text-foreground mr-auto">
  SWU Tracker
</span>
// After:
<Link href="/" className="font-heading font-semibold text-base text-foreground mr-auto hover:opacity-80 transition-opacity">
  SWU Tracker
</Link>
```

**isActive function** (lines 26–27) — DO NOT CHANGE. The current logic is already correct for the post-migration state:
```typescript
const isActive = (href: string) =>
  href === '/' ? pathname === '/' : pathname.startsWith(href);
```
After migration, `href: '/cards'` uses `pathname.startsWith('/cards')` — correct for catalog + card detail. `href: '/'` in the brand link is not in `NAV_LINKS` so `isActive` is not called on it.

---

### `src/app/cards/[set-code]/[card-number]/page.tsx` (page RSC, request-response) — UPDATE

**Analog:** `src/app/cards/[set-code]/[card-number]/page.tsx` (line 41 — single href change)

**Back-link change** (line 41):
```typescript
// Before:
href="/"
// After:
href="/cards"
```

The surrounding context (lines 39–49) is the `<Link>` element with `ChevronLeft` icon and "Back to catalog" label. Only the `href` attribute changes; all other attributes and the label text stay the same.

---

### `src/db/queries/catalog.test.ts` (test, extend) — EXTEND

**Analog:** `src/components/catalog/card-item.test.tsx` (lines 1–57) — test file structure and mocking conventions

**Test file header pattern** (card-item.test.tsx line 3):
```typescript
// @vitest-environment jsdom   (for component tests)
// @vitest-environment node    (for DB query tests — copy from catalog.test.ts line 1)
```

**Existing stub structure** (catalog.test.ts lines 1–19 — extend this file):
```typescript
// @vitest-environment node
import { describe, it } from 'vitest';

describe('getAllCards()', () => {
  it.todo('...');
  // ...
});
```

**New describe block to add:**
```typescript
describe('getTopCardsByPrice()', () => {
  it.todo('returns at most `limit` cards');
  it.todo('excludes cards with null priceUsd');
  it.todo('excludes token type cards');
  it.todo('excludes non-Normal variant cards (no Foil/Hyperspace duplicates)');
  it.todo('returns cards ordered by priceUsd DESC');
});
```

**Component test pattern** for `hero-section.test.tsx` and `high-value-grid.test.tsx` — follow `card-item.test.tsx`:
```typescript
/**
 * @vitest-environment jsdom
 */
import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));
```

---

## Shared Patterns

### dynamic = 'force-dynamic' Export
**Source:** `src/app/page.tsx` line 6
**Apply to:** `src/app/page.tsx` (new HomePage) and `src/app/cards/page.tsx` (new CatalogPage)
```typescript
export const dynamic = 'force-dynamic';
```
Without this, Next.js attempts static pre-render at build time and errors on live DB access.

### RSC Serialize → Client Pattern
**Source:** `src/app/page.tsx` lines 18–46
**Apply to:** `src/app/page.tsx` (new HomePage), `src/app/cards/page.tsx` (CatalogPage)
```typescript
// Map to plain serializable objects — exclude Date columns
const plainCards = cards.map(c => ({
  id: c.id,
  name: c.name,
  // ... only primitive fields
  priceUsd: c.priceUsd,
  // NEVER: createdAt, updatedAt, pricesUpdatedAt
}));
return <ClientComponent cards={plainCards} />;
```

### Price Display (integer cents → USD string)
**Source:** `src/app/cards/[set-code]/[card-number]/page.tsx` lines 133–134
**Apply to:** `CardPriceTile` in `high-value-grid.tsx`
```typescript
{priceUsd ? `$${(priceUsd / 100).toFixed(2)}` : '—'}
```

### next/image Loading State
**Source:** `src/components/catalog/card-item.tsx` lines 46, 79–100
**Apply to:** `CardPriceTile` in `high-value-grid.tsx`
```typescript
const [loaded, setLoaded] = useState(false);
// Container: relative + aspect-[X/Y] + overflow-hidden (all three required)
<div className={cn('relative rounded-md overflow-hidden bg-muted', isHorizontal ? 'aspect-[3/2]' : 'aspect-[2/3]', !loaded && 'animate-pulse')}>
  <Image src={url} alt={name} fill
    sizes="..."
    className={cn('object-cover transition-opacity duration-300', !loaded && 'opacity-0')}
    onLoad={() => setLoaded(true)}
    onError={() => setLoaded(true)}
  />
</div>
```

### `cn()` Utility Import
**Source:** `src/components/catalog/card-item.tsx` line 6; `src/components/nav-bar.tsx` line 5
**Apply to:** All new components
```typescript
import { cn } from '@/lib/utils';
```

### Drizzle Filter Pair (no-token + Normal-variant)
**Source:** `src/db/queries/catalog.ts` lines 47–51
**Apply to:** `getTopCardsByPrice` in `src/db/queries/catalog.ts`
```typescript
.where(
  and(
    notIlike(cardDefinitions.type, '%token%'),
    eq(cardPrintings.variantType, 'Normal'),
  )
)
```
This filter pair is mandatory in every query against these tables — omitting `variantType = 'Normal'` causes duplicate rows for the same card (Normal + Foil + Hyperspace printings).

---

## No Analog Found

All files have close codebase analogs. No files require falling back to RESEARCH.md patterns as the primary source.

---

## Metadata

**Analog search scope:** `src/app/`, `src/components/`, `src/db/queries/`
**Files scanned:** 8 source files read directly
**Key source files:**
- `src/app/page.tsx` — RSC page pattern, `dynamic` export, serialize map
- `src/components/nav-bar.tsx` — NAV_LINKS, isActive logic, Button/Link imports
- `src/db/queries/catalog.ts` — Drizzle query structure, join and filter patterns
- `src/components/catalog/card-item.tsx` — next/image loading state, aspect ratio, collector number parsing, leader/base logic
- `src/app/cards/[set-code]/[card-number]/page.tsx` — price display pattern, back-link (line 41), font class usage
- `src/app/layout.tsx` — font CSS variables (`--font-heading`, `--font-sans`)
- `src/db/queries/catalog.test.ts` — test stub structure for DB query tests
- `src/components/catalog/card-item.test.tsx` — jsdom test pattern, next/image + next/link mocks
**Pattern extraction date:** 2026-05-12

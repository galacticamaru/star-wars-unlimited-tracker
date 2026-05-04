# Phase 2: Card Catalog - Research

**Researched:** 2026-05-04
**Domain:** Next.js 16 App Router UI — image grid, client-side filtering, Drizzle queries, shadcn/base-ui components
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Pure image grid — no text labels per card in the grid view
- **D-02:** Grey placeholder while loading (`bg-muted animate-pulse`), grey on error (no broken-image icon)
- **D-03:** Single top bar spanning full page width: `[Search cards...]  Set▾  Type▾  Aspect▾`
- **D-04:** Client-side filtering — load all 1,806 cards once on page load, filter in memory
- **D-05:** AND logic across filter categories (Set AND Type AND Aspect)
- **D-06:** Card detail at `/cards/[set-code]/[card-number]` (e.g., `/cards/SOR/059`)
- **D-07:** Detail page side-by-side — full card image left (320px fixed), full metadata right (`flex-1`)
- **D-08:** CDN hostname confirmed as `cdn.swu-db.com` — configure `remotePatterns` in `next.config.ts`

### Claude's Discretion
- Grid column count and responsive breakpoints — resolved by UI-SPEC.md: 3/5/7/9/11 cols
- Card aspect ratio — resolved: `aspect-[2/3]`
- Routing for catalog page — resolved by UI-SPEC.md: `/` (root page)
- How filter options are populated — from distinct DB values at page load
- Pagination vs full render — full render with `useMemo` client-side filtering

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within Phase 2 scope.

### UI-SPEC.md Approved (2026-05-04)
The full design contract is locked in `02-UI-SPEC.md`. All visual decisions (grid breakpoints, color tokens, typography, spacing, hover ring, filter trigger copy, empty state copy, image loading strategy) are specified there and must be followed exactly.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CATALOG-01 | User can browse all cards with card images, name, type, set, and aspect | Server Component DB query → client props → image grid with `next/image` |
| CATALOG-02 | User can search the card catalog by card name | Client-side substring match via `useMemo` over pre-loaded card array |
| CATALOG-03 | User can filter the catalog by set, card type, and aspect | Client-side AND filter via `useMemo`; options from distinct DB values at load |
</phase_requirements>

---

## Summary

Phase 2 builds the first UI of the project on top of the Phase 1 database foundation. The catalog page is a Server Component that queries all 1,806 non-token cards and their primary printing from Neon via Drizzle, then passes the full array as props to a `'use client'` filter/grid component. The detail page is a Server Component that queries a single card by its `set_code`+`collector_number` split from the URL `params`. Both pages use `next/image` with `remotePatterns` for `cdn.swu-db.com`.

The primary complexity is the image loading interaction: `next/image` with `fill` requires a positioned parent, `onLoad`/`onError` require client components, and the grey-placeholder strategy requires rendering both the placeholder and the image simultaneously (placeholder as the container background, image on top). The second complexity area is the filter DropdownMenu, which this project builds using `@base-ui/react/menu` with checkbox items — this is the shadcn nova style primitive, not Radix UI `DropdownMenu`.

**Primary recommendation:** Build three waves — (1) `next.config.ts` image config + DB query layer, (2) catalog page Server Component + client grid with filtering, (3) detail page. All UI follows the locked `02-UI-SPEC.md` contracts exactly.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Card data fetch (catalog) | API / Backend (Server Component) | — | DB query runs server-side; 1,806 rows + join, no client DB exposure |
| Filter options fetch (set/type/aspect) | API / Backend (Server Component) | — | Distinct values query runs at page load alongside card fetch |
| Search / filter logic | Browser / Client | — | D-04 requires client-side filtering; pure JS array operations |
| Image rendering | Browser / Client | CDN (cdn.swu-db.com) | `next/image` with Next.js image optimization proxy |
| Card detail data fetch | API / Backend (Server Component) | — | Single-card query by set+number from URL params |
| Token exclusion | API / Backend (Server Component) | — | Happens in the Drizzle WHERE clause, not client-side |
| Route `/` (catalog) | Frontend Server (SSR) | — | Server Component page renders, passes serialized card array to client |
| Route `/cards/[set-code]/[card-number]` | Frontend Server (SSR) | — | Server Component page, params awaited per Next.js 16 convention |

---

## Standard Stack

### Core
| Library | Version (installed) | Purpose | Why Standard |
|---------|---------------------|---------|--------------|
| next | 16.2.4 | App Router, `next/image`, `next/link`, routing | Project framework |
| drizzle-orm | 0.45.2 | Type-safe DB queries with Neon HTTP | Established in Phase 1 |
| @base-ui/react | 1.4.1 | Headless UI primitives (Menu, Button) for shadcn nova style | This project's shadcn base |
| tailwindcss | 4.x | Utility CSS, Tailwind 4 CSS variables | Established in Phase 1 |
| lucide-react | 1.14.0 | Icons (X for clear, ChevronLeft for back button) | Specified in UI-SPEC.md |

### Supporting
| Library | Version (installed) | Purpose | When to Use |
|---------|---------------------|---------|-------------|
| clsx / tailwind-merge | installed | `cn()` helper for conditional classes | All component className composition |
| tw-animate-css | installed | `animate-pulse` for placeholder shimmer | Card loading placeholder |

### shadcn Components Needed (via `npx shadcn add`)
| Component | Use | Install Command |
|-----------|-----|----------------|
| dropdown-menu | Set/Type/Aspect filter dropdowns with checkbox items | `npx shadcn@latest add dropdown-menu` |
| input | Search field | `npx shadcn@latest add input` |
| badge | Active filter count display (e.g., "Set (2)") | `npx shadcn@latest add badge` |

> **Critical note:** This project uses `@base-ui/react` (not Radix UI) as the headless primitive layer. The installed `button.tsx` confirms this: it imports `from "@base-ui/react/button"`. When adding shadcn components, verify the generated code is compatible. If shadcn CLI generates Radix-based dropdown-menu, it will need adaptation to use `@base-ui/react/menu`. [VERIFIED: inspection of `src/components/ui/button.tsx` and `node_modules/@base-ui/react/` directory]

---

## Architecture Patterns

### System Architecture Diagram

```
Browser Request → Next.js App Router (src/app/)
                         │
              ┌──────────┴──────────────────────┐
              │                                  │
     GET /                              GET /cards/[set]/[number]
     CatalogPage (Server Component)    CardDetailPage (Server Component)
              │                                  │
    ┌─────────┴──────────┐              Drizzle query:
    │                    │              SELECT card_definitions.*
    │  Drizzle query:    │              + card_printings (by set+number)
    │  SELECT cd.*, cp   │                        │
    │  WHERE type NOT    │              await params (Next.js 16)
    │  ILIKE '%token%'   │                        │
    │  JOIN card_printings│             serialize → props
    │  (Normal variant)  │                        │
    │                    │              CardDetailClient (client, optional)
    │  serialize → props │              or pure Server HTML
    │                    │
    ├── filterOptions (distinct sets/types/aspects from same query)
    │
    CatalogClient ('use client')
    │
    ├── useState: searchQuery, selectedSets[], selectedTypes[], selectedAspects[]
    ├── useMemo: filtered = cards.filter(AND logic)
    ├── TopBar (search input + 3× FilterDropdown)
    └── CardGrid
          └── CardItem × N (Link wrapping relative container + Image)
                          └── cdn.swu-db.com → Next.js image proxy → browser
```

### Recommended Project Structure
```
src/
├── app/
│   ├── page.tsx                    # Catalog — Server Component, queries DB, renders CatalogClient
│   ├── cards/
│   │   └── [set-code]/
│   │       └── [card-number]/
│   │           └── page.tsx        # Detail — Server Component, awaits params
│   └── layout.tsx                  # Existing — no changes needed
├── components/
│   ├── ui/                         # shadcn components (button.tsx exists, add more)
│   │   ├── button.tsx              # Existing
│   │   ├── input.tsx               # Add via shadcn CLI
│   │   ├── dropdown-menu.tsx       # Add via shadcn CLI (verify base-ui compat)
│   │   └── badge.tsx               # Add via shadcn CLI
│   └── catalog/                    # Phase 2 feature components
│       ├── catalog-client.tsx      # 'use client' — owns search/filter state, renders grid
│       ├── card-grid.tsx           # Grid layout component (can be server or client)
│       ├── card-item.tsx           # Single card: Link + positioned container + Image
│       ├── top-bar.tsx             # Search input + 3 filter dropdowns
│       ├── filter-dropdown.tsx     # Reusable multi-select dropdown (Set/Type/Aspect)
│       └── empty-state.tsx         # "No matching cards" state
├── db/
│   ├── index.ts                    # Existing Drizzle client
│   ├── schema.ts                   # Existing schema
│   └── queries/
│       ├── catalog.ts              # getAllCards() + getFilterOptions()
│       └── card-detail.ts          # getCardByPrinting(setCode, cardNumber)
└── lib/
    ├── utils.ts                    # Existing cn() helper
    └── sync/                       # Existing sync logic
```

### Pattern 1: Server Component DB Query — Catalog
**What:** Fetch all non-token cards with their primary (Normal variant) printing in a single JOIN query.
**When to use:** Page load; result serialized to JSON and passed to client component.

```typescript
// Source: Drizzle ORM docs + Phase 1 schema (verified)
// src/db/queries/catalog.ts
import { db } from '@/db';
import { cardDefinitions, cardPrintings } from '@/db/schema';
import { eq, and, notILike } from 'drizzle-orm';

export async function getAllCards() {
  return db
    .select({
      id: cardDefinitions.id,
      name: cardDefinitions.name,
      type: cardDefinitions.type,
      aspects: cardDefinitions.aspects,
      setCode: cardPrintings.setCode,
      collectorNumber: cardPrintings.collectorNumber,
      frontArtUrl: cardPrintings.frontArtUrl,
      rarity: cardPrintings.rarity,
    })
    .from(cardDefinitions)
    .innerJoin(
      cardPrintings,
      eq(cardDefinitions.id, cardPrintings.cardDefinitionId)
    )
    .where(
      and(
        notILike(cardDefinitions.type, '%token%'),
        eq(cardPrintings.variantType, 'Normal')  // anchor printing only
      )
    );
}
```

> Note: `notILike` is available in drizzle-orm 0.45.x. Confirm with `import { notILike } from 'drizzle-orm'`. [VERIFIED: drizzle-orm 0.45.2 installed, ilike/notILike available since 0.28]

### Pattern 2: Dynamic Route Params — Next.js 16
**What:** In Next.js 16, `params` is a Promise and MUST be awaited.
**When to use:** Any page.tsx or layout.tsx that reads URL params.

```typescript
// Source: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md [VERIFIED]
// src/app/cards/[set-code]/[card-number]/page.tsx
export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ 'set-code': string; 'card-number': string }>
}) {
  const { 'set-code': setCode, 'card-number': cardNumber } = await params;
  // setCode = "SOR", cardNumber = "059"
  const card = await getCardByPrinting(setCode, cardNumber);
  // ...
}
```

> **Critical:** Forgetting `await params` causes a TypeScript error in Next.js 16 and a runtime failure. This is a breaking change from Next.js 14/15. [VERIFIED: Next.js 16.2.4 docs]

### Pattern 3: next/image with fill + Placeholder Strategy
**What:** `fill` mode requires a positioned parent container. The grey placeholder is the container background. The image renders on top. `onLoad`/`onError` require `'use client'`.
**When to use:** Card grid item with `aspect-[2/3]` container.

```typescript
// Source: node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md [VERIFIED]
// src/components/catalog/card-item.tsx
'use client'

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CardItemProps {
  name: string;
  setCode: string;
  cardNumber: string; // e.g. "059" (from collectorNumber "SOR-059".split('-')[1])
  frontArtUrl: string | null;
}

export function CardItem({ name, setCode, cardNumber, frontArtUrl }: CardItemProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Link href={`/cards/${setCode}/${cardNumber}`} aria-label={`View card: ${name}`}>
      {/* Positioned container: fill requires position relative/absolute */}
      <div className={cn(
        'relative aspect-[2/3] rounded-md overflow-hidden bg-muted',
        !loaded && 'animate-pulse',
      )}>
        {frontArtUrl && (
          <Image
            src={frontArtUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, (max-width: 1280px) 14vw, (max-width: 1536px) 11vw, 9vw"
            className={cn(
              'object-cover transition-shadow hover:ring-2 hover:ring-primary hover:ring-offset-1 cursor-pointer',
              !loaded && 'opacity-0'
            )}
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)} // stop pulse, keep grey box
          />
        )}
      </div>
    </Link>
  );
}
```

> **Notes:**
> - `priority` prop is deprecated in Next.js 16 — use `preload={true}` for LCP images or `loading="eager"`. For grid cards (many images), lazy loading (default) is correct. [VERIFIED: image.md changelog]
> - `onLoadingComplete` is deprecated in Next.js 14+ — use `onLoad`. [VERIFIED: image.md]
> - `onLoad` and `onError` require `'use client'` because they accept function props. [VERIFIED: image.md good-to-know note]
> - The `sizes` prop is critical for performance — without it, Next.js generates a limited srcset and may download 2x images unnecessarily. [VERIFIED: image.md sizes section]

### Pattern 4: Client-Side Filtering with useMemo
**What:** Hold all 1,806 cards in component state. Filter synchronously on every render cycle using `useMemo`.
**When to use:** CATALOG-02 (search) + CATALOG-03 (filters).

```typescript
// Source: React docs + D-04/D-05 decisions [ASSUMED pattern, decisions are VERIFIED]
// src/components/catalog/catalog-client.tsx
'use client'

import { useMemo, useState } from 'react';

interface Card {
  id: number;
  name: string;
  type: string;
  aspects: string[];
  setCode: string;
  collectorNumber: string;
  frontArtUrl: string | null;
}

export function CatalogClient({ cards }: { cards: Card[] }) {
  const [search, setSearch] = useState('');
  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedAspects, setSelectedAspects] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return cards.filter(card => {
      const matchesSearch = search === '' ||
        card.name.toLowerCase().includes(search.toLowerCase());
      const matchesSet = selectedSets.length === 0 ||
        selectedSets.includes(card.setCode);
      const matchesType = selectedTypes.length === 0 ||
        selectedTypes.includes(card.type);
      const matchesAspect = selectedAspects.length === 0 ||
        card.aspects.some(a => selectedAspects.includes(a));
      return matchesSearch && matchesSet && matchesType && matchesAspect;
    });
  }, [cards, search, selectedSets, selectedTypes, selectedAspects]);

  // ...render TopBar + CardGrid
}
```

### Pattern 5: Base-UI Menu as Filter Dropdown
**What:** Multi-select dropdown using `@base-ui/react/menu` with `MenuCheckboxItem`.
**When to use:** Set, Type, Aspect filters in the top bar.

```typescript
// Source: node_modules/@base-ui/react/menu/ directory inspection [VERIFIED available]
// Pattern based on base-ui menu API (checkbox-item variant)
import { Menu } from '@base-ui/react/menu';

// MenuCheckboxItem supports checked/onCheckedChange per item
// Trigger shows category name + optional count badge
// Multiple items remain open after selection (not auto-close) by default with checkbox items
```

> The shadcn nova style uses `@base-ui/react` primitives, NOT Radix UI. The `dropdown-menu` shadcn component should be generated and then verified to use `@base-ui/react/menu` exports. If it uses Radix, adaptation is needed. [VERIFIED: button.tsx uses `@base-ui/react/button`]

### Pattern 6: collectorNumber Split for Route Construction
**What:** `card_printings.collector_number` stores `"SOR-059"`. The route is `/cards/SOR/059`. Split on hyphen.
**When to use:** Building `href` in CardItem, parsing params in detail page.

```typescript
// Source: Phase 1 schema (VERIFIED: schema.ts comment confirms format)
// Building href:
const [setCode, cardNumber] = collectorNumber.split('-'); // ["SOR", "059"]
const href = `/cards/${setCode}/${cardNumber}`;

// Parsing route params (detail page):
const { 'set-code': setCode, 'card-number': cardNumber } = await params;
// Query: WHERE set_code = setCode AND collector_number = `${setCode}-${cardNumber}`
```

> **Edge case:** Some collector numbers may have hyphens beyond the first (e.g., special cards). Use `split('-', 2)` with index access, or `indexOf('-')` + `slice()` for robustness. [ASSUMED — verify against actual data in DB]

### Anti-Patterns to Avoid
- **Using `priority` on card images:** Deprecated in Next.js 16. Use `preload={true}` only for the LCP element (first visible card, not all 1,806). Default lazy loading is correct for the grid.
- **Using `onLoadingComplete`:** Deprecated in Next.js 14. Use `onLoad`.
- **Forgetting `await params`:** Next.js 16 params are Promises. Not awaiting causes TypeScript errors and runtime failures.
- **Server Component using `useState`/`onLoad`:** Image placeholder interaction requires `'use client'`. Server Components cannot have event handlers.
- **Missing `sizes` on fill images:** Without `sizes`, Next.js generates 1x/2x srcset instead of full responsive srcset, causing oversized image downloads.
- **Drizzle querying in client component:** All DB queries must be in Server Components or API routes. Client components receive pre-fetched data as props.
- **Not filtering tokens:** Every catalog query MUST exclude token types (`notILike(type, '%token%')`). The schema comment confirms T-prefixed collector numbers and type matching as the convention.
- **Using `domains` instead of `remotePatterns`:** `domains` is deprecated since Next.js 14. Use `remotePatterns`. [VERIFIED: image.md]
- **Hardcoding filter options:** Set, Type, and Aspect options must be derived from distinct DB values, not hardcoded — to stay current as new sets release.
- **Using Radix DropdownMenu if shadcn CLI generates it:** This project uses `@base-ui/react`, not Radix. Verify generated component import paths.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image optimization & CDN proxying | Custom image resize/proxy | `next/image` | Handles WebP conversion, srcset, lazy loading, cache headers automatically |
| Accessible dropdown menus | Custom `<div>` dropdowns | `@base-ui/react/menu` (MenuCheckboxItem) | Keyboard nav, focus management, ARIA roles |
| CSS class merging | Custom concat logic | `cn()` (clsx + twMerge) | Already in `src/lib/utils.ts` |
| Debounce logic | Custom debounce | None needed — substring match on 1,806 items is <5ms per keystroke | D-04 explicitly forbids debounce |
| Aspect ratio boxes | Padding-top hack | `aspect-[2/3]` Tailwind utility | Tailwind 4 natively supports arbitrary aspect ratios |

**Key insight:** Next.js 16's image component handles all image optimization complexity. The only integration work is configuring `remotePatterns` and tuning the `sizes` attribute.

---

## Common Pitfalls

### Pitfall 1: params is a Promise in Next.js 16
**What goes wrong:** Page crashes or TypeScript error: "Cannot read properties of Promise".
**Why it happens:** Next.js 16 changed `params` to be async (Promise). Training data and older examples show synchronous destructuring.
**How to avoid:** Always `await params` before destructuring: `const { 'set-code': s } = await params;`
**Warning signs:** TypeScript complains that `string` is not assignable to `Promise<...>`.

### Pitfall 2: next/image `fill` without positioned parent
**What goes wrong:** Image either does not render or takes 0 height, causing layout collapse.
**Why it happens:** `fill` uses `position: absolute` on the `<img>`. Without a `position: relative` parent, the image escapes containment.
**How to avoid:** The container `div` must have `relative` class. Tailwind's `aspect-[2/3]` alone is not enough — pair with `relative overflow-hidden`.
**Warning signs:** Image renders but card grid rows have zero height, or image overflows into adjacent cells.

### Pitfall 3: onLoad / onError in Server Component
**What goes wrong:** Next.js build error: "Event handlers cannot be passed to Client Component props".
**Why it happens:** `onLoad` and `onError` accept function props, which cannot be serialized across the Server/Client boundary.
**How to avoid:** Any component that uses `onLoad` or `onError` on `<Image>` MUST be `'use client'`. The CardItem component is a client component.
**Warning signs:** Build-time error about serializable props.

### Pitfall 4: Serializing non-plain data from Server to Client
**What goes wrong:** Next.js error: "Only plain objects, and a few built-ins, can be passed to Client Components from Server Components."
**Why it happens:** Drizzle query results with `Date` objects (timestamps), Drizzle result type wrappers.
**How to avoid:** Select only the columns needed (no `createdAt`/`updatedAt`), or map results to plain objects before passing as props.
**Warning signs:** Runtime error in the browser console about non-serializable props.

### Pitfall 5: Missing `qualities` in next.config.ts (Next.js 16 change)
**What goes wrong:** Image optimization returns 400 Bad Request for any quality value not in the `qualities` allowlist.
**Why it happens:** Next.js 16 changed `qualities` default to `[75]` only. Any quality not in the array is rejected.
**How to avoid:** The default `[75]` covers standard usage. Do NOT add `quality={100}` prop to card images without also adding `100` to the `qualities` array in config.
**Warning signs:** 400 errors on `/_next/image` requests in browser DevTools Network tab.

### Pitfall 6: Aspect filter AND vs OR within a category
**What goes wrong:** User selects Heroism+Villainy and gets zero results because cards must have BOTH aspects.
**Why it happens:** Confusing D-05 (AND across categories) with within-category logic.
**How to avoid:** Within a single category (e.g., multiple selected aspects), use OR: `card.aspects.some(a => selectedAspects.includes(a))`. Across categories, use AND.
**Warning signs:** Multi-aspect filter returns fewer results than expected.

### Pitfall 7: Token cards appearing in catalog
**What goes wrong:** Token cards (type contains "Token") appear in the grid.
**Why it happens:** Forgetting the `notILike(cardDefinitions.type, '%token%')` WHERE clause.
**How to avoid:** Always add token exclusion to every catalog query. Also exclude T-prefixed cards if querying by collector number.
**Warning signs:** Cards with names like "Snowtrooper Token" appear in the catalog.

### Pitfall 8: shadcn CLI generating Radix-based components
**What goes wrong:** Generated `dropdown-menu.tsx` imports from `@radix-ui/react-dropdown-menu`, which is not installed.
**Why it happens:** shadcn CLI default templates use Radix. This project uses `@base-ui/react` (nova style).
**How to avoid:** After running `npx shadcn@latest add dropdown-menu`, inspect the generated file's imports. If it references `@radix-ui/*`, the preset should have generated a base-ui version instead. Check the shadcn preset `b5oIaPwai8` documentation or examine the generated button.tsx as reference for the base-ui pattern.
**Warning signs:** TypeScript error about missing `@radix-ui/react-dropdown-menu` module.

---

## Code Examples

### next.config.ts — Image Remote Patterns
```typescript
// Source: node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md [VERIFIED]
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.swu-db.com',
        pathname: '/**',
      },
    ],
    // qualities defaults to [75] in Next.js 16 — explicit for clarity
    qualities: [75],
  },
};

export default nextConfig;
```

### Drizzle Query — Filter Options (distinct values)
```typescript
// Source: Drizzle ORM 0.45.x API [VERIFIED: installed version]
import { db } from '@/db';
import { cardDefinitions, cardPrintings } from '@/db/schema';
import { eq, notILike, asc } from 'drizzle-orm';

export async function getFilterOptions() {
  // Get distinct set codes
  const sets = await db
    .selectDistinct({ setCode: cardPrintings.setCode })
    .from(cardPrintings)
    .innerJoin(cardDefinitions, eq(cardPrintings.cardDefinitionId, cardDefinitions.id))
    .where(notILike(cardDefinitions.type, '%token%'))
    .orderBy(asc(cardPrintings.setCode));

  // Get distinct card types (from definitions, not printings)
  const types = await db
    .selectDistinct({ type: cardDefinitions.type })
    .from(cardDefinitions)
    .where(notILike(cardDefinitions.type, '%token%'))
    .orderBy(asc(cardDefinitions.type));

  // Aspects are arrays — distinct values require unnesting in PostgreSQL
  // Simplest approach: extract from the loaded cards client-side,
  // OR use a raw SQL query with unnest(aspects)
  return {
    sets: sets.map(r => r.setCode),
    types: types.map(r => r.type),
    // aspects: derived client-side from the card array to avoid unnest complexity
  };
}
```

> For aspects (a `text[]` column), the simplest correct approach is to derive distinct aspect values client-side from the pre-loaded card array using `Set`: `[...new Set(cards.flatMap(c => c.aspects))].sort()`. This avoids a PostgreSQL `unnest()` query while still being accurate. [ASSUMED as simplest — unnest alternative exists if needed]

### Catalog Page — Server Component
```typescript
// Source: Next.js 16 App Router patterns [VERIFIED via docs]
// src/app/page.tsx
import { getAllCards } from '@/db/queries/catalog';
import { CatalogClient } from '@/components/catalog/catalog-client';

export default async function CatalogPage() {
  const cards = await getAllCards();
  // Map to plain serializable objects (no Date fields)
  const plainCards = cards.map(c => ({
    id: c.id,
    name: c.name,
    type: c.type,
    aspects: c.aspects,
    setCode: c.setCode,
    collectorNumber: c.collectorNumber,
    frontArtUrl: c.frontArtUrl,
  }));
  return <CatalogClient cards={plainCards} />;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `params.slug` (sync) | `(await params).slug` | Next.js 15→16 | All dynamic pages must await params |
| `priority` prop on Image | `preload={true}` | Next.js 16.0.0 | Use `preload` for LCP, not `priority` |
| `onLoadingComplete` on Image | `onLoad` | Next.js 14.0.0 | API rename |
| `domains` in next.config | `remotePatterns` | Next.js 14.0.0 | More secure, required for external images |
| `qualities` unrestricted | `qualities: [75]` default allowlist | Next.js 16.0.0 | Must add qualities explicitly if using non-75 values |
| Radix UI primitives (shadcn default) | `@base-ui/react` (this project's nova preset) | shadcn preset b5oIaPwai8 | Component imports differ from typical shadcn examples |

**Deprecated/outdated in this project's context:**
- `priority` prop: Use `preload={true}` instead for any above-the-fold image
- `domains` in next.config: Use `remotePatterns`
- `onLoadingComplete`: Use `onLoad`

---

## Runtime State Inventory

Not applicable — this is a greenfield UI phase. No rename/refactor/migration. Phase 2 creates new files only; no existing state is modified.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js dev server | Yes | (project running) | — |
| npm / npx | `npx shadcn@latest add` | Yes | (package.json exists) | — |
| Neon PostgreSQL | DB queries | Yes | Neon cloud (from Phase 1) | — |
| cdn.swu-db.com | Card images | Yes (public CDN) | — | Grey placeholder (D-02) |
| @base-ui/react | UI primitives | Yes | 1.4.1 installed | — |
| lucide-react | Icons | Yes | 1.14.0 installed | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:**
- `cdn.swu-db.com` unavailable: Grey placeholder renders (D-02 covers this case).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 |
| Config file | `vitest.config.mts` (root, verified) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test -- --run` |
| Browser test env | `.browser.test.tsx` files use jsdom (via `environmentMatchGlobs`) |
| Server test env | Default `node` environment for all other `.test.ts` files |

> **Key constraint (from Phase 1 fix):** Async Server Components are not directly testable with Vitest (React ecosystem limitation, confirmed in Next.js docs). Unit tests cover query logic and pure filter functions. Integration/smoke tests cover the rendered page via `npm run build && npm start`.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CATALOG-01 | getAllCards() returns non-token cards with image URLs | unit (node) | `npm test -- --run src/db/queries/catalog.test.ts` | Wave 0 |
| CATALOG-01 | Image renders with correct src for a card | browser unit | `npm test -- --run src/components/catalog/card-item.browser.test.tsx` | Wave 0 |
| CATALOG-02 | filterCards() with search term returns subset matching name | unit (node) | `npm test -- --run src/lib/filter-cards.test.ts` | Wave 0 |
| CATALOG-02 | Search field updates filter results in DOM | browser unit | `npm test -- --run src/components/catalog/catalog-client.browser.test.tsx` | Wave 0 |
| CATALOG-03 | filterCards() with set/type/aspect filters applies AND logic | unit (node) | `npm test -- --run src/lib/filter-cards.test.ts` | Wave 0 |
| CATALOG-03 | Selecting multiple aspects uses OR within category | unit (node) | `npm test -- --run src/lib/filter-cards.test.ts` | Wave 0 |

> **Manual-only tests (no automation path):**
> - Visual: Grey placeholder renders during image load (requires real browser + slow network)
> - Visual: Hover ring appears on card hover
> - Visual: Grid breakpoints render correct column counts at each viewport
> - Navigation: Clicking card navigates to `/cards/SOR/059` (integration — Next.js routing)
> - Navigation: Back button returns to `/`

### Sampling Rate
- **Per task commit:** `npm test -- --run` (all unit tests, <10s)
- **Per wave merge:** `npm test -- --run` + `npm run build` (build must succeed)
- **Phase gate:** Full test suite green + `npm run build` exits 0 + manual smoke test in browser

### Wave 0 Gaps
- [ ] `src/db/queries/catalog.test.ts` — covers CATALOG-01 DB query (mock DB or use test fixtures)
- [ ] `src/lib/filter-cards.test.ts` — covers CATALOG-02 + CATALOG-03 filter logic (pure function, no DB needed)
- [ ] `src/components/catalog/card-item.browser.test.tsx` — covers image rendering
- [ ] `src/components/catalog/catalog-client.browser.test.tsx` — covers search/filter UI

> **Recommendation:** Extract the filter logic into a pure function `filterCards(cards[], { search, sets, types, aspects })` in `src/lib/filter-cards.ts`. This makes CATALOG-02/03 fully testable without DOM or DB mocks.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Phase 2 is read-only, no auth in v1 |
| V3 Session Management | No | No sessions in Phase 2 |
| V4 Access Control | No | Catalog is public read-only |
| V5 Input Validation | Partial | Search input: substring match only (no SQL injection risk — filtering is client-side in memory, never interpolated into SQL) |
| V6 Cryptography | No | No secrets handled in UI layer |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Image optimization abuse (malicious actors requesting arbitrary remote images) | Tampering | `remotePatterns` in next.config.ts restricts to `cdn.swu-db.com` only |
| XSS via card metadata rendered as HTML | Tampering | React escapes all string values by default; do not use `dangerouslySetInnerHTML` |
| `qualities` array bypass | Tampering | Next.js 16 enforces allowlist — default `[75]` is correct |
| DATABASE_URL exposure | Information Disclosure | DB client in Server Component only; `.env.local` gitignored (Phase 1 established) |

> Phase 2 introduces no new attack surface beyond image proxy configuration. The primary security control is the `remotePatterns` whitelist.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Distinct aspect values derived client-side from card array using `Set` | Code Examples (filter options) | Could miss aspect values if DB has aspects not on loaded cards — but since we load all cards, this is safe |
| A2 | `split('-', 2)` on collectorNumber is sufficient for all card formats | Pattern 6 | Special card numbers with extra hyphens would produce wrong route segments — verify against actual DB data |
| A3 | shadcn CLI generates base-ui compatible components for this preset | Standard Stack | If CLI generates Radix-based dropdown-menu, adaptation is needed before use |
| A4 | `notILike` is available in drizzle-orm 0.45.x | Pattern 1 | If not available, use `sql\`\${cardDefinitions.type} NOT ILIKE '%token%'\`` as fallback |
| A5 | Multi-select aspect filter uses OR-within-category logic | Pattern 4 | If intended logic is AND (card must have all selected aspects), filter returns fewer results than expected |

---

## Open Questions (RESOLVED)

1. **Aspect filter within-category logic** — RESOLVED: OR within category (`aspects.some()`)
   - What we know: D-05 specifies AND across categories. Within a single category (multiple aspects selected), the expected behavior is OR (show cards matching any selected aspect).
   - Resolution: Implemented as `aspects.some(a => selectedAspects.includes(a))` in `filterCards()` — standard TCG filter UX. Decision captured in 02-01-PLAN.md Task 2.

2. **Collector number format edge cases** — RESOLVED: `indexOf('-')` + `slice()` for robustness
   - What we know: Schema stores `"SOR-059"`. Split on first hyphen gives `["SOR", "059"]`.
   - Resolution: Use `const hyphen = cn.indexOf('-'); setCode = cn.slice(0, hyphen); num = cn.slice(hyphen+1)` — handles any multi-hyphen formats. Decision captured in 02-01-PLAN.md Task 1.

3. **shadcn add dropdown-menu compatibility** — RESOLVED: post-install check + rewrite to base-ui if Radix generated
   - What we know: This project uses `@base-ui/react`, not Radix. `button.tsx` confirms base-ui.
   - Resolution: Plan 02-02 Task 1 runs the add command, greps for `@radix-ui` imports, and rewrites to `@base-ui/react/menu` if needed. Acceptance criteria enforces absence of Radix imports. Decision captured in 02-02-PLAN.md Task 1.

---

## Project Constraints (from CLAUDE.md)

The CLAUDE.md references AGENTS.md which states:

> "This is NOT the Next.js you know. This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices."

**Directives enforced in this research:**
- All Next.js API claims verified against `node_modules/next/dist/docs/` (version 16.2.4)
- `params` async requirement confirmed from dynamic-routes.md
- `priority` deprecation confirmed from image.md changelog
- `onLoadingComplete` deprecation confirmed from image.md
- `domains` deprecation confirmed from image.md
- `qualities` default change confirmed from image.md version history

---

## Sources

### Primary (HIGH confidence)
- `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md` — next/image API, remotePatterns, onLoad, onError, fill, sizes, priority deprecation, qualities change, onLoadingComplete deprecation
- `node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md` — next/link API
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md` — params as Promise (Next.js 16 convention)
- `src/db/schema.ts` — cardDefinitions (20 cols) + cardPrintings (11 cols) exact column names
- `src/db/index.ts` — Drizzle client pattern (neon-http)
- `src/components/ui/button.tsx` — confirms `@base-ui/react` as the shadcn primitive layer
- `node_modules/@base-ui/react/menu/index.d.ts` — confirms MenuCheckboxItem available
- `package.json` — exact installed versions: next@16.2.4, drizzle-orm@0.45.2, @base-ui/react@1.4.1, lucide-react@1.14.0
- `vitest.config.mts` — test infrastructure: node env default, jsdom for `.browser.test.*`, passWithNoTests
- `.planning/phases/02-card-catalog/02-UI-SPEC.md` — approved visual/interaction contracts
- `.planning/phases/02-card-catalog/02-CONTEXT.md` — locked decisions D-01 through D-08
- `.planning/phases/01-foundation/01-02-SUMMARY.md` — schema column names and types

### Secondary (MEDIUM confidence)
- drizzle-orm 0.45.2 — `notILike`, `selectDistinct`, `innerJoin` confirmed via installed package version; specific API verified against Phase 1 upsert-cards.ts which uses similar patterns

### Tertiary (LOW confidence / ASSUMED)
- Aspect filter OR-within-category logic (A5) — standard TCG filter UX convention, not explicitly stated in decisions
- Collector number hyphen split edge cases (A2) — needs DB data verification

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified from package.json and node_modules
- Architecture patterns: HIGH — verified against Next.js 16.2.4 docs in node_modules
- UI-SPEC contracts: HIGH — approved 2026-05-04, locked
- Pitfalls: HIGH — derived from official Next.js 16 changelog entries and breaking changes
- Filter logic details: MEDIUM — D-04/D-05 decisions confirmed, within-category logic inferred

**Research date:** 2026-05-04
**Valid until:** 2026-08-04 (Next.js 16 is stable; shadcn/base-ui stable APIs)

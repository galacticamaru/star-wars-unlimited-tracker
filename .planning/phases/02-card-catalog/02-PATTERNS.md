# Phase 2: Card Catalog - Pattern Map

**Mapped:** 2026-05-04
**Files analyzed:** 15
**Analogs found:** 9 / 15 (6 have no close codebase analog — use RESEARCH.md patterns)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `next.config.ts` | config | — | `next.config.ts` (itself) | exact (modify) |
| `src/app/page.tsx` | component (Server) | request-response | `src/app/api/cron/sync-cards/route.ts` | role-partial (async + db call + return) |
| `src/app/cards/[set-code]/[card-number]/page.tsx` | component (Server) | request-response | `src/app/api/cron/sync-cards/route.ts` | role-partial |
| `src/db/queries/catalog.ts` | service | CRUD (read) | `src/lib/sync/upsert-cards.ts` | role-match (Drizzle + same tables) |
| `src/db/queries/card-detail.ts` | service | CRUD (read) | `src/lib/sync/upsert-cards.ts` | role-match (Drizzle + same tables) |
| `src/components/catalog/catalog-client.tsx` | component (Client) | event-driven | `src/app/page.tsx` | partial (JSX structure only) |
| `src/components/catalog/card-grid.tsx` | component | transform | `src/app/page.tsx` | partial (JSX only) |
| `src/components/catalog/card-item.tsx` | component (Client) | event-driven | `src/app/page.tsx` | partial (next/image usage) |
| `src/components/catalog/top-bar.tsx` | component (Client) | event-driven | `src/components/ui/button.tsx` | partial (cn() + base-ui pattern) |
| `src/components/catalog/filter-dropdown.tsx` | component (Client) | event-driven | `src/components/ui/button.tsx` | partial (base-ui primitive pattern) |
| `src/components/catalog/empty-state.tsx` | component | — | `src/app/page.tsx` | partial (JSX + cn()) |
| `src/components/ui/input.tsx` | ui (shadcn CLI) | — | `src/components/ui/button.tsx` | exact (same pattern, different primitive) |
| `src/components/ui/dropdown-menu.tsx` | ui (shadcn CLI) | — | `src/components/ui/button.tsx` | exact (same pattern, different primitive) |
| `src/components/ui/badge.tsx` | ui (shadcn CLI) | — | `src/components/ui/button.tsx` | exact (same pattern, different primitive) |
| `src/lib/filter-cards.ts` | utility | transform | `src/lib/utils.ts` | partial (pure function, same lib/ pattern) |

---

## Pattern Assignments

### `next.config.ts` (config — modify)

**Analog:** `next.config.ts` (current file, lines 1–7)

**Current file** (lines 1–7):
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

**Add `images.remotePatterns`** — replace body of `nextConfig`:
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
  },
};

export default nextConfig;
```

> `qualities` default is `[75]` in Next.js 16 — explicit for clarity. Do NOT use `domains` (deprecated). Source: RESEARCH.md §Anti-Patterns and §Code Examples.

---

### `src/app/page.tsx` (Server Component, request-response)

**Analog:** `src/app/api/cron/sync-cards/route.ts` (lines 1–21) for the async-function-calls-service pattern. `src/app/page.tsx` (current, lines 1–65) for the JSX return structure.

**Imports pattern** from `src/app/api/cron/sync-cards/route.ts` (lines 1–2):
```typescript
import { syncAllCards } from '@/lib/sync/upsert-cards';
// → copy the @/ alias pattern for local imports
```

**Core pattern** — async Server Component calling a query function and passing data to a Client Component:
```typescript
// src/app/page.tsx — FULL REPLACEMENT
import { getAllCards, getFilterOptions } from '@/db/queries/catalog';
import { CatalogClient } from '@/components/catalog/catalog-client';

export default async function CatalogPage() {
  const [cards, filterOptions] = await Promise.all([
    getAllCards(),
    getFilterOptions(),
  ]);

  // Map to plain serializable objects — no Date fields (createdAt/updatedAt excluded)
  // Pitfall 4: Drizzle returns Date objects in timestamps; select only needed columns
  const plainCards = cards.map(c => ({
    id: c.id,
    name: c.name,
    type: c.type,
    aspects: c.aspects,
    setCode: c.setCode,
    collectorNumber: c.collectorNumber,
    frontArtUrl: c.frontArtUrl,
  }));

  return (
    <CatalogClient
      cards={plainCards}
      filterOptions={filterOptions}
    />
  );
}
```

> The current `src/app/page.tsx` uses `next/image` with `priority` — **do not copy this** — `priority` is deprecated in Next.js 16 (use `preload={true}` only for LCP, or omit for grid images). Source: RESEARCH.md §Anti-Patterns.

---

### `src/app/cards/[set-code]/[card-number]/page.tsx` (Server Component, request-response)

**Analog:** `src/app/api/cron/sync-cards/route.ts` for async pattern + error handling structure. No existing dynamic route exists in the project.

**Critical pattern — Next.js 16 async params** (RESEARCH.md §Pattern 2):
```typescript
// src/app/cards/[set-code]/[card-number]/page.tsx
import { getCardByPrinting } from '@/db/queries/card-detail';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Image from 'next/image';

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ 'set-code': string; 'card-number': string }>;
}) {
  // CRITICAL: params is a Promise in Next.js 16 — must await before destructuring
  const { 'set-code': setCode, 'card-number': cardNumber } = await params;

  const card = await getCardByPrinting(setCode, cardNumber);
  if (!card) notFound();

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Back button */}
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/"><ChevronLeft className="mr-1" />Back to catalog</Link>
      </Button>
      {/* Side-by-side layout: image left (320px fixed), metadata right (flex-1) */}
      <div className="flex flex-col gap-8 md:flex-row md:gap-12">
        {/* Image column */}
        <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden md:w-[320px] md:flex-shrink-0">
          {card.frontArtUrl && (
            <Image
              src={card.frontArtUrl}
              alt={card.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 320px"
            />
          )}
        </div>
        {/* Metadata column */}
        <div className="flex-1">
          {/* metadata fields per UI-SPEC.md §Card Detail Page */}
        </div>
      </div>
    </div>
  );
}
```

> `asChild` on Button with Link is the base-ui/button pattern — see `button.tsx`. Error handling: use `notFound()` from `next/navigation` rather than try/catch for missing cards.

---

### `src/db/queries/catalog.ts` (service, CRUD read)

**Analog:** `src/lib/sync/upsert-cards.ts` — the only existing file that uses Drizzle ORM with `cardDefinitions` and `cardPrintings`. Read for the import pattern, table references, and WHERE clause conventions.

**Imports pattern** from `src/lib/sync/upsert-cards.ts` (lines 1–3):
```typescript
import { db } from '@/db';
import { cardDefinitions, cardPrintings } from '@/db/schema';
import { sql, eq, and, isNull } from 'drizzle-orm';
```

**Core read pattern** — `getAllCards()`:
```typescript
// src/db/queries/catalog.ts
import { db } from '@/db';
import { cardDefinitions, cardPrintings } from '@/db/schema';
import { eq, and, notILike, asc } from 'drizzle-orm';

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
        eq(cardPrintings.variantType, 'Normal')
      )
    );
}
```

> Column names: `cardDefinitions.id`, `.name`, `.type`, `.aspects` — camelCase in Drizzle maps to snake_case in DB. The token filter `notILike(cardDefinitions.type, '%token%')` mirrors the manual filter in `upsert-cards.ts` line 68: `card.Type.toLowerCase().includes('token')`. Source: `src/db/schema.ts` + RESEARCH.md §Pattern 1.

**`getFilterOptions()` pattern**:
```typescript
export async function getFilterOptions() {
  const sets = await db
    .selectDistinct({ setCode: cardPrintings.setCode })
    .from(cardPrintings)
    .innerJoin(cardDefinitions, eq(cardPrintings.cardDefinitionId, cardDefinitions.id))
    .where(
      and(
        notILike(cardDefinitions.type, '%token%'),
        eq(cardPrintings.variantType, 'Normal')
      )
    )
    .orderBy(asc(cardPrintings.setCode));

  const types = await db
    .selectDistinct({ type: cardDefinitions.type })
    .from(cardDefinitions)
    .where(notILike(cardDefinitions.type, '%token%'))
    .orderBy(asc(cardDefinitions.type));

  return {
    sets: sets.map(r => r.setCode),
    types: types.map(r => r.type),
    // aspects: derived client-side from the full card array (avoids PostgreSQL unnest)
  };
}
```

---

### `src/db/queries/card-detail.ts` (service, CRUD read)

**Analog:** `src/lib/sync/upsert-cards.ts` — same Drizzle imports and table objects.

**Core pattern** — single-card lookup by setCode + cardNumber:
```typescript
// src/db/queries/card-detail.ts
import { db } from '@/db';
import { cardDefinitions, cardPrintings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function getCardByPrinting(setCode: string, cardNumber: string) {
  // collectorNumber is stored as "SOR-059" — reconstruct from route params
  const collectorNumber = `${setCode}-${cardNumber}`;

  const [card] = await db
    .select({
      id: cardDefinitions.id,
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
      frontText: cardDefinitions.frontText,
      backText: cardDefinitions.backText,
      epicAction: cardDefinitions.epicAction,
      doubleSided: cardDefinitions.doubleSided,
      setCode: cardPrintings.setCode,
      collectorNumber: cardPrintings.collectorNumber,
      rarity: cardPrintings.rarity,
      frontArtUrl: cardPrintings.frontArtUrl,
      backArtUrl: cardPrintings.backArtUrl,
      artist: cardPrintings.artist,
    })
    .from(cardDefinitions)
    .innerJoin(
      cardPrintings,
      eq(cardDefinitions.id, cardPrintings.cardDefinitionId)
    )
    .where(
      and(
        eq(cardPrintings.setCode, setCode),
        eq(cardPrintings.collectorNumber, collectorNumber),
        eq(cardPrintings.variantType, 'Normal')
      )
    )
    .limit(1);

  return card ?? null;
}
```

> Return type is `null` (not `undefined`) for idiomatic null-check in the page component. Array destructure `const [card] = await ...` mirrors the pattern at `upsert-cards.ts` line 181: `const [existing] = await query;`.

---

### `src/components/catalog/catalog-client.tsx` (Client Component, event-driven)

**Analog:** No existing client component in the codebase. Use `src/app/page.tsx` for JSX structural reference and RESEARCH.md §Pattern 4 for the useMemo filter pattern.

**Imports pattern** — copy from `src/components/ui/button.tsx` (lines 1–3) for the import style:
```typescript
// Note: button.tsx uses no 'use client' — catalog-client.tsx MUST declare it
'use client'

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { TopBar } from './top-bar';
import { CardGrid } from './card-grid';
import { filterCards } from '@/lib/filter-cards';
```

**Core pattern** — state + useMemo filter:
```typescript
// Types should match what getAllCards() returns (serialized, no Date)
interface Card {
  id: number;
  name: string;
  type: string;
  aspects: string[];
  setCode: string;
  collectorNumber: string;
  frontArtUrl: string | null;
}

interface FilterOptions {
  sets: string[];
  types: string[];
}

export function CatalogClient({
  cards,
  filterOptions,
}: {
  cards: Card[];
  filterOptions: FilterOptions;
}) {
  const [search, setSearch] = useState('');
  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedAspects, setSelectedAspects] = useState<string[]>([]);

  // Derive aspects from the card array — avoids PostgreSQL unnest complexity
  const aspectOptions = useMemo(
    () => [...new Set(cards.flatMap(c => c.aspects))].sort(),
    [cards]
  );

  const filtered = useMemo(
    () => filterCards(cards, { search, selectedSets, selectedTypes, selectedAspects }),
    [cards, search, selectedSets, selectedTypes, selectedAspects]
  );

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar
        search={search}
        onSearchChange={setSearch}
        sets={filterOptions.sets}
        types={filterOptions.types}
        aspects={aspectOptions}
        selectedSets={selectedSets}
        selectedTypes={selectedTypes}
        selectedAspects={selectedAspects}
        onSetsChange={setSelectedSets}
        onTypesChange={setSelectedTypes}
        onAspectsChange={setSelectedAspects}
      />
      {/* Result count — right-aligned, above grid */}
      <div className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">
        {filtered.length.toLocaleString()} cards
      </div>
      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <CardGrid cards={filtered} />
      )}
    </div>
  );
}
```

---

### `src/components/catalog/card-grid.tsx` (component, transform)

**Analog:** `src/app/page.tsx` (lines 5–63) for grid/layout pattern; no existing grid component. Can be a Server Component (receives plain array, renders list, no interactivity).

**Core pattern** — responsive CSS grid using Tailwind:
```typescript
// src/components/catalog/card-grid.tsx
// No 'use client' needed — pure presentational
import { CardItem } from './card-item';

interface Card {
  id: number;
  name: string;
  setCode: string;
  collectorNumber: string;
  frontArtUrl: string | null;
}

export function CardGrid({ cards }: { cards: Card[] }) {
  return (
    <div
      className={[
        'grid gap-2 px-4 py-4',
        // UI-SPEC.md: 3/5/7/9/11 columns at <640/sm/md/lg/xl breakpoints
        'grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-11',
      ].join(' ')}
    >
      {cards.map(card => (
        <CardItem key={card.id} {...card} />
      ))}
    </div>
  );
}
```

> Grid gap is `gap-2` (8px = `sm` spacing token from UI-SPEC.md). Container padding is `px-4` (16px = `md` on mobile) matching the top-bar padding.

---

### `src/components/catalog/card-item.tsx` (Client Component, event-driven)

**Analog:** `src/app/page.tsx` (lines 7–13) for `next/image` usage — but that usage is outdated (uses `priority`, no `fill`). The real pattern comes from RESEARCH.md §Pattern 3. `src/components/ui/button.tsx` (lines 1–4) for the import style.

**Imports pattern** (from button.tsx style):
```typescript
'use client'
// Must be 'use client' — onLoad/onError are function props (Pitfall 3)

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
```

**Core pattern** — positioned container + fill Image + grey placeholder:
```typescript
interface CardItemProps {
  name: string;
  setCode: string;
  collectorNumber: string;  // e.g. "SOR-059"
  frontArtUrl: string | null;
}

export function CardItem({ name, setCode, collectorNumber, frontArtUrl }: CardItemProps) {
  const [loaded, setLoaded] = useState(false);
  // Split "SOR-059" → ["SOR", "059"] — use indexOf for robustness over edge cases
  const dashIdx = collectorNumber.indexOf('-');
  const cardNumber = dashIdx >= 0 ? collectorNumber.slice(dashIdx + 1) : collectorNumber;

  return (
    <Link
      href={`/cards/${setCode}/${cardNumber}`}
      aria-label={`View card: ${name}`}
    >
      {/* relative + aspect-[2/3] + overflow-hidden are all required (Pitfall 2) */}
      <div
        className={cn(
          'relative aspect-[2/3] rounded-md overflow-hidden bg-muted',
          !loaded && 'animate-pulse',
        )}
      >
        {frontArtUrl && (
          <Image
            src={frontArtUrl}
            alt={name}
            fill
            // sizes tuned to UI-SPEC.md breakpoints: 3/5/7/9/11 cols
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, (max-width: 1280px) 15vw, (max-width: 1536px) 12vw, 10vw"
            className={cn(
              'object-cover transition-shadow',
              'hover:ring-2 hover:ring-primary hover:ring-offset-1 cursor-pointer',
              !loaded && 'opacity-0',
            )}
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)}  // stop pulse, grey box stays visible
          />
        )}
      </div>
    </Link>
  );
}
```

> Do NOT use `priority` prop — deprecated in Next.js 16. Do NOT use `onLoadingComplete` — deprecated since Next.js 14. Use `onLoad`. The `sizes` attribute is required with `fill` to generate responsive srcset (Pitfall: missing sizes causes oversized downloads). Source: RESEARCH.md §Anti-Patterns.

---

### `src/components/catalog/top-bar.tsx` (Client Component, event-driven)

**Analog:** `src/components/ui/button.tsx` for the import style (cn(), base-ui primitives, named export). No existing top-bar or search component.

**Imports pattern** (following button.tsx import style, lines 1–3):
```typescript
'use client'

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FilterDropdown } from './filter-dropdown';
import { X } from 'lucide-react';
```

**Core pattern** — sticky top bar with search + 3 filter dropdowns:
```typescript
// UI-SPEC.md: height 56px, bg-background/80 backdrop-blur-sm, border-b border-border
// Layout: search (flex-1, min-200px max-480px) + Set(120px) + Type(120px) + Aspect(120px)
// Gap between elements: gap-2 (8px = sm token). Padding: px-4 mobile, px-8 desktop.

interface TopBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  sets: string[];
  types: string[];
  aspects: string[];
  selectedSets: string[];
  selectedTypes: string[];
  selectedAspects: string[];
  onSetsChange: (v: string[]) => void;
  onTypesChange: (v: string[]) => void;
  onAspectsChange: (v: string[]) => void;
}

export function TopBar({ search, onSearchChange, sets, types, aspects,
  selectedSets, selectedTypes, selectedAspects,
  onSetsChange, onTypesChange, onAspectsChange }: TopBarProps) {
  return (
    <div className={cn(
      'sticky top-0 z-10 h-14 flex items-center gap-2',
      'px-4 lg:px-8',
      'bg-background/80 backdrop-blur-sm border-b border-border',
    )}>
      {/* Search — flex-1 with min/max width per UI-SPEC.md */}
      <div className="relative flex-1 min-w-[200px] max-w-[480px]">
        <Input
          type="text"
          placeholder="Search cards..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="pr-8"
        />
        {search && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute right-1 top-1/2 -translate-y-1/2"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
          >
            <X />
          </Button>
        )}
      </div>
      {/* Filter dropdowns — fixed 120px each per UI-SPEC.md */}
      <FilterDropdown
        label="Set"
        options={sets}
        selected={selectedSets}
        onChange={onSetsChange}
      />
      <FilterDropdown
        label="Type"
        options={types}
        selected={selectedTypes}
        onChange={onTypesChange}
      />
      <FilterDropdown
        label="Aspect"
        options={aspects}
        selected={selectedAspects}
        onChange={onAspectsChange}
      />
    </div>
  );
}
```

---

### `src/components/catalog/filter-dropdown.tsx` (Client Component, event-driven)

**Analog:** `src/components/ui/button.tsx` (full file) — the only UI primitive. This is the highest-risk component because it wraps the shadcn dropdown-menu, which may be Radix or base-ui depending on what `npx shadcn@latest add dropdown-menu` generates.

**Critical pre-flight check** (must happen in Wave 0 before building this component):
Run `npx shadcn@latest add dropdown-menu` and inspect the generated `src/components/ui/dropdown-menu.tsx`. If it imports from `@radix-ui/react-dropdown-menu`, adaptation to `@base-ui/react/menu` is required (RESEARCH.md §Pitfall 8).

**Imports pattern** — depends on shadcn CLI output, but follows button.tsx import style (lines 1–4):
```typescript
'use client'

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
```

**Core pattern** — multi-select dropdown, trigger shows label + count badge:
```typescript
interface FilterDropdownProps {
  label: string;  // "Set" | "Type" | "Aspect"
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}

export function FilterDropdown({ label, options, selected, onChange }: FilterDropdownProps) {
  const triggerLabel = selected.length > 0
    ? `${label} (${selected.length})`
    : label;

  const toggle = (option: string) => {
    onChange(
      selected.includes(option)
        ? selected.filter(s => s !== option)
        : [...selected, option]
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* Fixed width 120px per UI-SPEC.md. Outline variant shows active state. */}
        <Button
          variant={selected.length > 0 ? 'outline' : 'ghost'}
          className="w-[120px] justify-between"
        >
          {triggerLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map(option => (
          <DropdownMenuCheckboxItem
            key={option}
            checked={selected.includes(option)}
            onCheckedChange={() => toggle(option)}
          >
            {option}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

> The `button.tsx` `variant="outline"` class includes `aria-expanded:bg-muted aria-expanded:text-foreground` — this naturally handles the open/closed dropdown trigger state.

---

### `src/components/catalog/empty-state.tsx` (component)

**Analog:** `src/app/page.tsx` (lines 15–32) for centered content layout pattern. No 'use client' needed.

**Core pattern** — centered empty state, no interactivity:
```typescript
// src/components/catalog/empty-state.tsx
// No 'use client' — purely presentational

export function EmptyState() {
  return (
    // UI-SPEC.md §Copywriting: "No matching cards" / "Try adjusting your search or clearing a filter."
    <div className="flex flex-col items-center justify-center flex-1 py-24 gap-3 text-center">
      <p className="text-lg font-semibold font-heading">No matching cards</p>
      <p className="text-sm text-muted-foreground max-w-xs">
        Try adjusting your search or clearing a filter.
      </p>
    </div>
  );
}
```

> `font-heading` applies the `Oxanium` font via `--font-heading` CSS variable declared in `layout.tsx` line 6. `text-muted-foreground` is the correct color token per UI-SPEC.md §Color.

---

### `src/components/ui/input.tsx`, `dropdown-menu.tsx`, `badge.tsx` (shadcn CLI)

**Analog:** `src/components/ui/button.tsx` (full file) — the only existing shadcn component. All three follow the identical structure.

**Pattern to copy from `src/components/ui/button.tsx`** (lines 1–58):
```typescript
// Key structural points — apply to input.tsx / dropdown-menu.tsx / badge.tsx:

// 1. Import primitive from @base-ui/react/<primitive>
import { Button as ButtonPrimitive } from "@base-ui/react/button"

// 2. Use class-variance-authority (cva) for variant classes
import { cva, type VariantProps } from "class-variance-authority"

// 3. Always import cn() from @/lib/utils
import { cn } from "@/lib/utils"

// 4. Named export (not default)
export { Button, buttonVariants }

// 5. Wrapper function forwards ...props to the base-ui primitive
function Button({ className, variant, size, ...props }) {
  return (
    <ButtonPrimitive
      data-slot="button"          // data-slot is the shadcn nova convention
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
```

> If shadcn CLI generates Radix-based components, the import on line 1 will be `from "@radix-ui/..."` — that must be changed to `from "@base-ui/react/..."`. Verify immediately after running each `npx shadcn@latest add` command.

---

### `src/lib/filter-cards.ts` (utility, transform)

**Analog:** `src/lib/utils.ts` (full file, lines 1–6) — the only file in `src/lib/`. Same pattern: pure function, named export, no dependencies beyond types.

**Pattern from `src/lib/utils.ts`** (lines 1–6):
```typescript
// Pure function, named export, no side effects
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Core pattern** — extract from RESEARCH.md §Pattern 4, adapted to pure function:
```typescript
// src/lib/filter-cards.ts
// Pure function — no imports needed beyond types. Fully testable without mocks.

export interface FilterState {
  search: string;
  selectedSets: string[];
  selectedTypes: string[];
  selectedAspects: string[];
}

export interface CardForFilter {
  id: number;
  name: string;
  type: string;
  aspects: string[];
  setCode: string;
  collectorNumber: string;
  frontArtUrl: string | null;
}

export function filterCards(cards: CardForFilter[], filters: FilterState): CardForFilter[] {
  const { search, selectedSets, selectedTypes, selectedAspects } = filters;

  return cards.filter(card => {
    // Search: case-insensitive substring on name (D-04)
    const matchesSearch = search === '' ||
      card.name.toLowerCase().includes(search.toLowerCase());

    // Set: OR within category, AND with other categories (D-05)
    const matchesSet = selectedSets.length === 0 ||
      selectedSets.includes(card.setCode);

    // Type: OR within category
    const matchesType = selectedTypes.length === 0 ||
      selectedTypes.includes(card.type);

    // Aspect: OR within category — card qualifies if it has ANY selected aspect
    // (Pitfall 6: do NOT require ALL selected aspects — use .some())
    const matchesAspect = selectedAspects.length === 0 ||
      card.aspects.some(a => selectedAspects.includes(a));

    return matchesSearch && matchesSet && matchesType && matchesAspect;
  });
}
```

> This pure function is the primary unit-testable surface for CATALOG-02 and CATALOG-03. All test cases (including OR-within-category for aspects, empty filter returns all cards, AND across categories) run against this function directly with no mocks.

---

## Shared Patterns

### 1. `cn()` for className composition
**Source:** `src/lib/utils.ts` (lines 1–6)
**Apply to:** All component files (`catalog-client.tsx`, `card-grid.tsx`, `card-item.tsx`, `top-bar.tsx`, `filter-dropdown.tsx`, `empty-state.tsx`)
```typescript
import { cn } from "@/lib/utils"
// Usage: className={cn('base-classes', conditional && 'extra-class', props.className)}
```

### 2. `@/` path alias
**Source:** `src/lib/sync/upsert-cards.ts` (line 1), `src/components/ui/button.tsx` (line 3)
**Apply to:** All new files — imports use `@/` not relative `../../`
```typescript
import { db } from '@/db';              // not '../../db'
import { cn } from '@/lib/utils';       // not '../../../lib/utils'
```

### 3. Named exports (not default) for components
**Source:** `src/components/ui/button.tsx` (line 58): `export { Button, buttonVariants }`
**Apply to:** All `src/components/` files
```typescript
// Correct — named export
export function CardGrid({ ... }) { ... }
export { CardItem }

// Exception — page.tsx files use default export (Next.js App Router requirement)
export default async function CatalogPage() { ... }
```

### 4. Drizzle import pattern
**Source:** `src/lib/sync/upsert-cards.ts` (lines 1–3)
**Apply to:** `src/db/queries/catalog.ts`, `src/db/queries/card-detail.ts`
```typescript
import { db } from '@/db';
import { cardDefinitions, cardPrintings } from '@/db/schema';
import { eq, and, notILike, asc } from 'drizzle-orm';
```

### 5. Token exclusion in every catalog query
**Source:** `src/lib/sync/upsert-cards.ts` (lines 65–70) — canonical token filter
**Apply to:** `src/db/queries/catalog.ts`, `src/db/queries/card-detail.ts` (detail page excludes via Normal variantType)
```typescript
// In WHERE clause of every catalog query:
notILike(cardDefinitions.type, '%token%')
```

### 6. `data-slot` convention on shadcn components
**Source:** `src/components/ui/button.tsx` (line 52): `data-slot="button"`
**Apply to:** All `src/components/ui/` components added via shadcn CLI — verify generated file includes this attribute.

### 7. Font class application
**Source:** `src/app/layout.tsx` (lines 6, 8): `--font-heading` (Oxanium) and `--font-sans` (Nunito Sans)
**Apply to:** Detail page card name heading uses `font-heading` class; all other text uses default `font-sans`
```typescript
// Heading (card name on detail page): font-heading text-xl font-semibold
// Body text: (inherits font-sans from layout — no explicit class needed)
// Label/metadata: text-xs font-semibold text-muted-foreground
```

---

## No Analog Found

Files with no close match in the codebase — use RESEARCH.md patterns and UI-SPEC.md exclusively:

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/components/catalog/catalog-client.tsx` | Client Component | event-driven | No client components exist yet; first `'use client'` file in the project |
| `src/components/catalog/filter-dropdown.tsx` | Client Component | event-driven | No dropdown or multi-select component exists; depends on shadcn CLI output |
| `src/components/catalog/top-bar.tsx` | Client Component | event-driven | No nav/bar component exists; composed of yet-to-be-added shadcn ui components |
| `src/components/ui/input.tsx` | ui (shadcn CLI) | — | Generated by CLI — verify base-ui vs Radix before use |
| `src/components/ui/dropdown-menu.tsx` | ui (shadcn CLI) | — | Generated by CLI — highest adaptation risk (Pitfall 8); inspect imports immediately |
| `src/components/ui/badge.tsx` | ui (shadcn CLI) | — | Generated by CLI — verify base-ui vs Radix before use |

---

## Metadata

**Analog search scope:** `src/app/`, `src/components/`, `src/db/`, `src/lib/`, `next.config.ts`, `vitest.config.mts`
**Files scanned:** 8 source files (full project — small codebase)
**Pattern extraction date:** 2026-05-04

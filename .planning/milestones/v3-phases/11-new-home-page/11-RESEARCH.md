# Phase 11: New Home Page - Research

**Researched:** 2026-05-12
**Domain:** Next.js App Router routing, React Server Components, Drizzle ORM query extension, Tailwind CSS hero layout
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Hero title — "Star Wars Unlimited Card Database and Deck Builder"
- **D-02:** Hero subtitle — "Track your collection, build your decks, and begin trading with up to date market prices"
- **D-03:** Visual treatment — dark/SW-themed background with Oxanium heading font (already loaded)
- **D-04:** Three CTAs: "Import Collection" → `/collection`, "Build a Deck" → `/decks`, "Trade" → `/binder/manage`
- **D-05:** Highest Value grid = system-wide top 10 by `priceUsd DESC`; not personalized
- **D-06:** Grid visible to all users including unauthenticated guests — no auth gate
- **D-07:** Each grid card links to `/cards/[set-code]/[card-number]`
- **D-08:** Prices displayed in USD
- **D-09:** Brand name "SWU Tracker" in NavBar becomes `<Link href="/">` — no separate "Home" nav item
- **D-10:** "Catalog" nav link keeps label; href changes from `/` to `/cards`
- **D-11:** `isActive` logic for `href === '/'` uses exact match — stays correct after migration

### Claude's Discretion
- Hero visual treatment: dark background with gradient or subtle texture, Oxanium font at large size for the title, contrasting subtitle in Nunito Sans, primary-colored CTA buttons using shadcn/ui Button component
- Card grid component design: image, card name, price badge; reuse existing card image pattern
- Spacing, padding, and layout rhythm of the home page sections

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-HOME-01 | Move catalog to `/cards`; update root route and navigation | File move: `src/app/page.tsx` content → `src/app/cards/page.tsx` (new); brand link + NAV_LINKS update in `nav-bar.tsx`; "Back to catalog" link update in card detail page |
| REQ-HOME-02 | Hero section with Title, Subtitle, and clear CTAs (Import, Build, Trade) | New RSC at `/`; shadcn/ui Button; Oxanium `font-heading` class; Nunito Sans `font-sans`; both already loaded in root layout |
| REQ-HOME-03 | "Highest Value Cards" 10-card grid (5×2) on home page | New `getTopCardsByPrice(limit)` Drizzle query on `cardDefinitions` ordered by `priceUsd DESC`; new `HighValueGrid` client component; `priceUsd` stored as integer cents → divide by 100 for display |
</phase_requirements>

---

## Summary

Phase 11 is a routing-and-UI phase with no schema migrations and no new API routes. The work falls into three clean buckets: (1) route migration — move the existing CatalogPage from `/` to `/cards` with minimal code change, (2) hero section — build a new root `/` server component with marketing copy and CTA buttons, and (3) highest-value grid — extend the catalog query layer with a `getTopCardsByPrice` function and render a 10-card display-only grid.

The existing codebase provides strong reuse surface. The `CatalogPage` server component pattern (data fetch → serialize → pass to client component) transfers directly to `/cards/page.tsx`. The `CardItem` component (used extensively across catalog, binder, deck views) handles image aspect ratios, link routing to card detail, and fallback states — it is the correct image rendering primitive, but it carries collection-management UI (badge overlays, +/- controls) that are inappropriate for the read-only highest-value grid. A purpose-built, simpler display component is warranted for the grid cards.

**Primary recommendation:** Three sequential tasks: (1) route migration + nav update, (2) Drizzle query + new RSC page skeleton, (3) Hero section + HighValueGrid UI components.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Route migration (/ → /cards) | Frontend Server (RSC) | — | File-system routing in Next.js App Router; moving `page.tsx` files |
| Navigation update | Browser / Client | — | `nav-bar.tsx` is `'use client'` (uses `usePathname`) |
| Hero section render | Frontend Server (RSC) | — | Static marketing copy; no interactivity; RSC is correct |
| Top-10 query | Database / Storage | — | Drizzle query against `card_definitions` table |
| High-value grid display | Frontend Server (RSC) | Browser / Client | Server fetches and serializes; client component handles Image loading state |
| Card image rendering | Browser / Client | — | Uses `next/image` with loading state; must be client |

---

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.2.4 | File-system routing, RSC, `next/image`, `next/link` | Project standard [VERIFIED: package.json] |
| React | 19.2.4 | Component model | Project standard [VERIFIED: package.json] |
| Drizzle ORM | ^0.45.2 | Type-safe PostgreSQL queries | Project standard [VERIFIED: package.json] |
| Tailwind CSS | ^4 | Utility-first styling | Project standard [VERIFIED: package.json] |
| shadcn/ui Button | ^4.6.0 | CTA buttons (decided D-04) | Already used in nav-bar.tsx [VERIFIED: codebase] |
| Lucide React | ^1.14.0 | CTA icons (optional) | Already used in nav-bar.tsx and card-item.tsx [VERIFIED: package.json] |
| next/font (Oxanium, Nunito Sans) | bundled with Next.js 16 | Hero typography | Already loaded in root layout [VERIFIED: src/app/layout.tsx] |

### No New Dependencies
This phase introduces zero new npm packages. All required libraries are already installed.

---

## Architecture Patterns

### System Architecture Diagram

```
Browser Request: GET /
        |
        v
[src/app/page.tsx — RSC — HomePage]
        |
        |--- (static)----> [HeroSection — RSC or inline JSX]
        |                        |
        |                        |--- shadcn/ui Button ×3 (CTAs)
        |
        |--- getTopCardsByPrice(10) ---> [Drizzle → PostgreSQL]
        |        returns: { id, name, setCode, collectorNumber,
        |                   frontArtUrl, backArtUrl, type, priceUsd }
        |
        v
  serialize to plain objects (no Date fields)
        |
        v
[HighValueGridClient — 'use client']
        |
        |--- CardPriceTile ×10 (new component)
               |--- next/image (card art)
               |--- card name
               |--- price badge ($X.XX)
               |--- Link href="/cards/{setCode}/{cardNumber}"

Browser Request: GET /cards
        |
        v
[src/app/cards/page.tsx — RSC — CatalogPage]  ← content moved from src/app/page.tsx
        |
        |--- getAllCards(userId?) + getFilterOptions()
        v
[CatalogClient — 'use client'] (unchanged)

Browser Request: any page
        |
        v
[NavBar — 'use client']
        |--- "SWU Tracker" brand → <Link href="/">
        |--- NAV_LINKS: Catalog href="/cards" (was "/")
        |--- isActive('/') → pathname === '/' (exact, unchanged)
        |--- isActive('/cards') → pathname.startsWith('/cards') (correct for catalog + detail)
```

### Recommended Project Structure (changes only)
```
src/
├── app/
│   ├── page.tsx                    ← REPLACE with new HomePage (hero + grid)
│   └── cards/
│       ├── page.tsx                ← NEW: CatalogPage (moved from src/app/page.tsx)
│       └── [set-code]/
│           └── [card-number]/
│               └── page.tsx        ← UPDATE: "Back to catalog" href "/" → "/cards"
├── components/
│   └── home/                       ← NEW directory
│       ├── hero-section.tsx        ← NEW: Hero UI component (can be RSC or plain JSX)
│       └── high-value-grid.tsx     ← NEW: 'use client' grid + CardPriceTile
├── db/
│   └── queries/
│       └── catalog.ts              ← EXTEND: add getTopCardsByPrice(limit: number)
└── components/
    └── nav-bar.tsx                 ← UPDATE: brand link + NAV_LINKS
```

### Pattern 1: RSC Data Fetch → Serialize → Client Component
**What:** Server component fetches data, maps to plain objects (no Date fields), passes as props to `'use client'` component.
**When to use:** Any time client needs data that requires DB access — avoids client-side fetching entirely.
**Example (established in codebase):**
```typescript
// Source: src/app/page.tsx (current CatalogPage — copy this pattern)
export default async function CatalogPage() {
  const cards = await getAllCards();
  const plainCards = cards.map(c => ({
    id: c.id,
    name: c.name,
    // ... only primitive fields, no Date objects
  }));
  return <CatalogClient cards={plainCards} />;
}
```

### Pattern 2: Drizzle Query Extension
**What:** Add `getTopCardsByPrice` to `src/db/queries/catalog.ts`.
**When to use:** New read query on existing tables — same file, same import pattern.
**Example:**
```typescript
// Source: drizzle-orm ^0.45.2 — established pattern from getAllCards()
// priceUsd is stored on cardDefinitions, NOT on cardPrintings
export async function getTopCardsByPrice(limit: number) {
  return db
    .select({
      id: cardDefinitions.id,
      name: cardDefinitions.name,
      setCode: cardPrintings.setCode,
      collectorNumber: cardPrintings.collectorNumber,
      frontArtUrl: cardPrintings.frontArtUrl,
      backArtUrl: cardPrintings.backArtUrl,
      type: cardDefinitions.type,
      priceUsd: cardDefinitions.priceUsd,
    })
    .from(cardDefinitions)
    .innerJoin(cardPrintings, eq(cardDefinitions.id, cardPrintings.cardDefinitionId))
    .where(
      and(
        isNotNull(cardDefinitions.priceUsd),
        notIlike(cardDefinitions.type, '%token%'),
        eq(cardPrintings.variantType, 'Normal'),
      )
    )
    .orderBy(desc(cardDefinitions.priceUsd))
    .limit(limit);
}
```
**Critical detail:** `priceUsd` lives on `cardDefinitions`, not `cardPrintings`. The join is required to get `setCode` and `collectorNumber` for the card detail link.

### Pattern 3: Price Display
**What:** `priceUsd` is stored as integer cents. Divide by 100 to display dollars.
**When to use:** Any time priceUsd is rendered to the user.
**Example:**
```typescript
// Source: src/app/cards/[set-code]/[card-number]/page.tsx:134 [VERIFIED: codebase]
{card.priceUsd ? `$${(card.priceUsd / 100).toFixed(2)}` : '—'}
```

### Pattern 4: next/image in Client Components
**What:** `next/image` requires `relative` container + `aspect-*` + `overflow-hidden` + `fill` prop. Loading state via `useState(false)` + `onLoad` callback.
**When to use:** All card art rendering.
**Example (established in CardItem):**
```typescript
// Source: src/components/catalog/card-item.tsx [VERIFIED: codebase]
const [loaded, setLoaded] = useState(false);
// ...
<div className="relative aspect-[2/3] rounded-md overflow-hidden bg-muted">
  <Image
    src={frontArtUrl}
    alt={name}
    fill
    sizes="(max-width: 640px) 50vw, 20vw"
    className={cn('object-cover transition-opacity duration-300', !loaded && 'opacity-0')}
    onLoad={() => setLoaded(true)}
  />
</div>
```

### Pattern 5: isActive Logic in NavBar
**What:** NavBar uses `pathname.startsWith(href)` for most links, exact match `pathname === href` for `href === '/'`.
**Post-migration behavior:**
- `href: '/'` → exact match → home page only
- `href: '/cards'` → `pathname.startsWith('/cards')` → active on `/cards` AND `/cards/SOR/059` (card detail) — correct
**No logic change needed to `isActive` function itself.**

### Pattern 6: `dynamic = 'force-dynamic'` in RSC pages with DB reads
**What:** The current `CatalogPage` exports `export const dynamic = 'force-dynamic'`. This should be carried over to `cards/page.tsx`.
**Why:** Prevents Next.js from statically rendering pages that hit a live DB.
**Note:** The new home page also hits the DB (`getTopCardsByPrice`) and should carry the same export.

### Anti-Patterns to Avoid
- **Using `CardItem` for the high-value grid:** `CardItem` carries collection management UI (+/- controls, owned badge, binder badges) that are wrong for a read-only display. Create a lightweight `CardPriceTile` instead.
- **Forgetting to update "Back to catalog" link:** `src/app/cards/[set-code]/[card-number]/page.tsx` line 41 has `href="/"` — this must change to `href="/cards"` as part of REQ-HOME-01 or users will navigate to the new home page instead of the catalog.
- **Passing Date objects across server/client boundary:** Drizzle returns `Date` for timestamp columns. The `getTopCardsByPrice` query must not select `createdAt`, `updatedAt`, or `pricesUpdatedAt`.
- **Forgetting `variantType = 'Normal'` filter in getTopCardsByPrice:** Without it, Foil/Hyperspace/Showcase duplicates inflate the list — the same card could appear multiple times.
- **Null priceUsd rows:** Some cards have `priceUsd = null`. The query must filter `isNotNull(cardDefinitions.priceUsd)` to ensure a meaningful top-10 list.
- **Home page needs `dynamic = 'force-dynamic'`:** Without it, Next.js may try to statically prerender the page and error on DB access at build time.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image with loading state | Custom img + fetch | `next/image` with `fill` + `useState` loading | Automatic optimization, lazy loading, aspect-ratio enforcement |
| CTA buttons | Custom `<button>` with styling | `shadcn/ui Button` | Already installed; consistent with rest of UI |
| DB query for top cards | Raw SQL string | Drizzle ORM `.select().from().where().orderBy().limit()` | Type-safe, consistent with existing query layer |
| Font loading | Manual `@import` | `next/font` (already configured in layout.tsx) | Font already available via CSS variable `--font-heading` |

**Key insight:** Everything needed already exists in the project. This phase is composition of existing primitives, not new infrastructure.

---

## Common Pitfalls

### Pitfall 1: "Back to catalog" link not updated
**What goes wrong:** Users on the card detail page click "Back to catalog" and land on the new home page, not the catalog.
**Why it happens:** `src/app/cards/[set-code]/[card-number]/page.tsx` line 41 hardcodes `href="/"`. It is easy to forget this file when focusing on the route migration.
**How to avoid:** REQ-HOME-01 task must explicitly include updating this file's back-link to `href="/cards"`.
**Warning signs:** Clicking "Back to catalog" from a card detail page goes to the hero/home page.

### Pitfall 2: Duplicate cards in top-10 grid (missing variantType filter)
**What goes wrong:** A card like "Darth Vader" that has Normal + Foil + Hyperspace printings appears multiple times in the list.
**Why it happens:** The `cardPrintings` join multiplies rows without a `variantType = 'Normal'` WHERE clause.
**How to avoid:** Always add `eq(cardPrintings.variantType, 'Normal')` to `getTopCardsByPrice` (same as `getAllCards` does).
**Warning signs:** Fewer than 10 distinct card names in the grid; same card name appearing twice.

### Pitfall 3: Null priceUsd cards crowding top-10
**What goes wrong:** Cards with null price sort unpredictably (PostgreSQL sorts nulls last by default with `DESC`, but this is fragile to rely on).
**Why it happens:** Not all cards have price data.
**How to avoid:** Add `isNotNull(cardDefinitions.priceUsd)` to the WHERE clause.
**Warning signs:** Grid shows cards with `'—'` for price.

### Pitfall 4: Date serialization error across server/client boundary
**What goes wrong:** `TypeError: Cannot serialize date` or React hydration error.
**Why it happens:** Drizzle timestamp columns (`createdAt`, `updatedAt`, `pricesUpdatedAt`) return `Date` objects; React Server Components cannot serialize `Date` to the client boundary.
**How to avoid:** Select only needed columns in `getTopCardsByPrice` — no timestamp columns.
**Warning signs:** Runtime error mentioning "cannot serialize" or "Date object".

### Pitfall 5: NavBar isActive collision between `/` and `/cards`
**What goes wrong:** After migration, the Catalog nav item appears active on the home page, or the home link fails to highlight.
**Why it happens:** If `href: '/'` used `pathname.startsWith(href)`, it would match every path. The current exact-match logic for `href === '/'` is intentionally preserved (D-11).
**How to avoid:** Do NOT change the `isActive` function. Only change `NAV_LINKS[0].href` from `'/'` to `'/cards'`.
**Warning signs:** Both home and catalog appear highlighted simultaneously.

### Pitfall 6: Missing `dynamic = 'force-dynamic'` on home page
**What goes wrong:** Build fails or home page shows stale data / errors.
**Why it happens:** Next.js attempts to statically render pages without dynamic exports; a live DB call breaks the static render.
**How to avoid:** Add `export const dynamic = 'force-dynamic'` to the new `src/app/page.tsx` (same as current catalog page).
**Warning signs:** Build-time error mentioning static page generation failure.

---

## Code Examples

### getTopCardsByPrice query
```typescript
// src/db/queries/catalog.ts — extend existing file
// Source: established Drizzle pattern from getAllCards() [VERIFIED: codebase]
import { desc, isNotNull } from 'drizzle-orm';

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
    })
    .from(cardDefinitions)
    .innerJoin(cardPrintings, eq(cardDefinitions.id, cardPrintings.cardDefinitionId))
    .where(
      and(
        isNotNull(cardDefinitions.priceUsd),
        notIlike(cardDefinitions.type, '%token%'),
        eq(cardPrintings.variantType, 'Normal'),
      )
    )
    .orderBy(desc(cardDefinitions.priceUsd))
    .limit(limit);
}
```

### New home page (src/app/page.tsx)
```typescript
// Source: RSC pattern from existing CatalogPage [VERIFIED: codebase]
import { getTopCardsByPrice } from '@/db/queries/catalog';
import { HeroSection } from '@/components/home/hero-section';
import { HighValueGrid } from '@/components/home/high-value-grid';

export const dynamic = 'force-dynamic';

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
  }));
  return (
    <main>
      <HeroSection />
      <HighValueGrid cards={plainCards} />
    </main>
  );
}
```

### NavBar changes (minimal diff)
```typescript
// Source: src/components/nav-bar.tsx [VERIFIED: codebase]
// Change 1: update NAV_LINKS
const NAV_LINKS = [
  { href: '/cards', label: 'Catalog' },  // was href: '/'
  { href: '/collection', label: 'Collection' },
  { href: '/decks', label: 'Decks' },
];

// Change 2: wrap brand span in Link
// Before:
// <span className="font-heading font-semibold text-base text-foreground mr-auto">
//   SWU Tracker
// </span>
// After:
<Link href="/" className="font-heading font-semibold text-base text-foreground mr-auto hover:opacity-80 transition-opacity">
  SWU Tracker
</Link>
```

### CardPriceTile (new lightweight component)
```typescript
// Source: adapted from CardItem pattern [VERIFIED: codebase]
// 'use client' required for next/image loading state
'use client'
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CardPriceTileProps {
  name: string;
  type: string;
  setCode: string;
  collectorNumber: string;  // e.g. "SOR-059"
  frontArtUrl: string | null;
  backArtUrl: string | null;
  priceUsd: number | null;
}

export function CardPriceTile({ name, type, setCode, collectorNumber, frontArtUrl, backArtUrl, priceUsd }: CardPriceTileProps) {
  const [loaded, setLoaded] = useState(false);
  const dashIdx = collectorNumber.indexOf('-');
  const cardNumber = dashIdx >= 0 ? collectorNumber.slice(dashIdx + 1) : collectorNumber;
  const isLeader = type.toLowerCase().includes('leader');
  const isBase = type.toLowerCase().includes('base');
  const isHorizontal = isLeader || isBase;
  const displayUrl = isLeader ? (frontArtUrl || backArtUrl) : frontArtUrl;

  return (
    <div className="group relative">
      <Link href={`/cards/${setCode}/${cardNumber}`} aria-label={`View ${name}`} className="block">
        <div className={cn('relative rounded-md overflow-hidden bg-muted', isHorizontal ? 'aspect-[3/2]' : 'aspect-[2/3]', !loaded && 'animate-pulse')}>
          {displayUrl && (
            <Image src={displayUrl} alt={name} fill
              sizes="(max-width: 640px) 40vw, 20vw"
              className={cn('object-cover transition-opacity duration-300', !loaded && 'opacity-0')}
              onLoad={() => setLoaded(true)} onError={() => setLoaded(true)}
            />
          )}
        </div>
        <div className="mt-1 px-0.5">
          <p className="text-xs font-medium truncate">{name}</p>
          <p className="text-xs text-muted-foreground font-semibold">
            {priceUsd ? `$${(priceUsd / 100).toFixed(2)}` : '—'}
          </p>
        </div>
      </Link>
    </div>
  );
}
```

### HeroSection layout approach
```typescript
// Source: shadcn/ui Button + Tailwind CSS 4 — discretion area (D-03)
// Oxanium font available as font-heading class [VERIFIED: src/app/layout.tsx]
// Dark background, gradient optional via Tailwind arbitrary values
export function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center text-center px-6 py-20 md:py-32 bg-background">
      {/* Optional: dark overlay or gradient layer */}
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

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `params` as plain object in RSC | `params` is a `Promise` — must `await` before destructuring | Next.js 15+ | Already handled in card detail page; home page has no params |
| Static home page | RSC with `dynamic = 'force-dynamic'` for DB reads | Next.js 13 App Router | Required for live data |

**Deprecated/outdated:**
- `getServerSideProps` / `getStaticProps`: Not used in App Router — use RSC data fetching directly.

---

## Runtime State Inventory

> Omitted — this is a greenfield UI phase, not a rename/refactor/migration phase. No runtime state is affected by the changes.

---

## Open Questions

1. **Hero background image or pure CSS gradient?**
   - What we know: D-03 says "dark background with gradient or subtle texture" is at Claude's discretion
   - What's unclear: Whether to use a background image from the card art CDN or pure CSS
   - Recommendation: Pure CSS gradient (no external asset dependency, no image optimization overhead, faster to implement)

2. **HighValueGrid: RSC wrapper vs full client component**
   - What we know: The grid fetches data server-side (RSC); `CardPriceTile` needs `useState` for image loading so it must be `'use client'`
   - What's unclear: Whether to make `HighValueGrid` itself a server component (receives serialized data as props) or make the whole thing client
   - Recommendation: `HighValueGrid` as `'use client'` receiving `plainCards` as props from the RSC parent — consistent with `CatalogClient` pattern

3. **"Back to catalog" link text after migration**
   - What we know: The link currently says "Back to catalog" and href `"/"`
   - What's unclear: Whether the label should stay "Back to catalog" (pointing to `/cards`) or change
   - Recommendation: Keep label "Back to catalog"; change href to `/cards`. No wording change needed.

---

## Environment Availability

Step 2.6: SKIPPED — this phase has no external dependencies beyond the already-running PostgreSQL database and Node.js runtime, which are verified operational (project is in active development on branch `worktree-agent-phase-10.1`).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 |
| Config file | `vitest.config.mts` (project root) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

Default environment: `node`. Browser/jsdom tests use `// @vitest-environment jsdom` per-file pragma (established pattern).

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-HOME-01 | `getTopCardsByPrice` excludes tokens and non-Normal variants | unit | `npx vitest run src/db/queries/catalog.test.ts` | Exists (stub) — needs new test cases |
| REQ-HOME-01 | `getTopCardsByPrice` orders by priceUsd DESC | unit | `npx vitest run src/db/queries/catalog.test.ts` | Exists (stub) |
| REQ-HOME-02 | HeroSection renders title, subtitle, and 3 CTA links | unit (jsdom) | `npx vitest run src/components/home/hero-section.test.tsx` | No — Wave 0 gap |
| REQ-HOME-03 | HighValueGrid renders 10 CardPriceTile items | unit (jsdom) | `npx vitest run src/components/home/high-value-grid.test.tsx` | No — Wave 0 gap |
| REQ-HOME-03 | CardPriceTile displays price as `$X.XX` | unit (jsdom) | `npx vitest run src/components/home/high-value-grid.test.tsx` | No — Wave 0 gap |
| REQ-HOME-03 | CardPriceTile renders `'—'` when priceUsd is null | unit (jsdom) | `npx vitest run src/components/home/high-value-grid.test.tsx` | No — Wave 0 gap |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/components/home/hero-section.test.tsx` — covers REQ-HOME-02 (title, subtitle, CTA link hrefs)
- [ ] `src/components/home/high-value-grid.test.tsx` — covers REQ-HOME-03 (price display, null handling, link routing)
- [ ] Add `getTopCardsByPrice` test cases to existing `src/db/queries/catalog.test.ts` (file exists as stub with `.todo` tests)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Home page is public (D-06); no auth required |
| V3 Session Management | No | No session-dependent data on home page |
| V4 Access Control | No | No protected resources on this page |
| V5 Input Validation | No | No user input on home page |
| V6 Cryptography | No | No cryptographic operations |

### Known Threat Patterns for {stack}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Open redirect via crafted CTA href | Tampering | CTAs use hardcoded string literals, not user input — no risk |
| Clickjacking | Elevation | Next.js default headers include X-Frame-Options [ASSUMED] |

**Security assessment:** This phase has a minimal security surface. The home page is fully public, has no user input, and renders only server-fetched DB data. No ASVS controls are applicable beyond standard Next.js defaults.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | PostgreSQL sorts NULLs last in `ORDER BY priceUsd DESC` by default | Pitfall 3 / Code Examples | Cards with null price might appear in top-10; mitigated by `isNotNull` filter anyway |
| A2 | Next.js 16 sends X-Frame-Options by default | Security Domain | Clickjacking risk; low impact for a public catalog page |
| A3 | `HeroSection` can be a pure server component (no client hooks needed) | Architecture Patterns | If animation or interaction is added during implementation, 'use client' will be needed |

---

## Sources

### Primary (HIGH confidence)
- `src/app/page.tsx` — current CatalogPage; RSC data fetch pattern, serialization approach, `dynamic = 'force-dynamic'`
- `src/components/nav-bar.tsx` — `NAV_LINKS` constant, `isActive` logic, brand span, existing client component structure
- `src/db/queries/catalog.ts` — `getAllCards` Drizzle query; established join, filter, and import patterns
- `src/db/schema.ts` — `priceUsd` on `cardDefinitions` (integer cents); `variantType` on `cardPrintings`
- `src/app/layout.tsx` — Oxanium as `--font-heading` / `font-heading`; Nunito Sans as `--font-sans`
- `src/components/catalog/card-item.tsx` — image aspect ratio pattern, `next/image` loading state
- `src/app/cards/[set-code]/[card-number]/page.tsx` — price display pattern (`priceUsd / 100).toFixed(2)`); "Back to catalog" `href="/"` (must update to `/cards`)
- `package.json` — verified all library versions
- `vitest.config.mts` — test framework configuration

### Secondary (MEDIUM confidence)
- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md` — App Router file-system routing, page/layout conventions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in package.json; all patterns verified in codebase
- Architecture: HIGH — file locations and component boundaries confirmed by direct file reads
- Pitfalls: HIGH — identified from direct code inspection (Back-to-catalog link, variantType filter, null price, Date serialization)
- Validation: HIGH — test framework confirmed; existing test patterns confirmed

**Research date:** 2026-05-12
**Valid until:** 2026-06-12 (stable Next.js App Router conventions; no external APIs in this phase)

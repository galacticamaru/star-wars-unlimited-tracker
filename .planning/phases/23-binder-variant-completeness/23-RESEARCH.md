# Phase 23: Binder Variant Completeness — Research

**Researched:** 2026-05-25
**Domain:** Next.js 16 / Drizzle ORM / shadcn-ui — binder data layer, card-detail RSC, Manage Binder client component
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Schema migration (tradeManualWants)**
- D-01: `tradeManualWants` migrates PK from `(userId, cardDefinitionId)` to `(userId, cardPrintingId)`
- D-02: Existing rows mapped to Normal printing's `cardPrintingId`; rows with no Normal printing are dropped
- D-03: Auto-wants (deck-driven) remain card-definition-level; appear in public binder with Normal variant badge as default

**Looking For — per-printing tiles**
- D-04: `getPublicBinderData()` updated to produce per-printing entries for manual wants; auto-wants produce card-definition-level entries via Normal printing
- D-05: One tile per printing — Normal and Foil manual wants for the same card produce two separate tiles
- D-06: Both auto-wants and manual wants remain in Looking For

**Looking For — manual wants UX**
- D-07: After card-name search, user picks variant via chips; replaces quantity-only flow
- D-08: `/api/binder/wants` POST accepts `cardPrintingId` instead of `cardDefinitionId`

**Card Detail — trade offer section**
- D-09: "Available for Trade" section below `VariantCollectionSection` in image column; auth-gated
- D-10: One row per printing; +/- controls; trade quantity 0 means not trading but row stays visible
- D-11: `tradeQuantity` fetched server-side by extending `getSameSetPrintingsWithCounts()`; no separate client fetch
- D-12: Mutations use existing `/api/trade` PATCH; new thin client component for interactive controls

**Manage Binder — owned-card discovery**
- D-13: "Add cards" section switches from all printings (`/api/cards/all`) to card definitions with `userCollections.count > 0`
- D-14: Card tile art uses highest-owned-variant precedence (Showcase > Hyperspace Foil > Hyperspace > Foil > Normal)
- D-15: Clicking a tile opens a side panel / Sheet with per-printing trade controls
- D-16: Sheet uses `/api/trade` PATCH with optimistic state updates

**Cross-page sync**
- D-17: "Immediately reflected" = fresh on next navigation; existing `useEffect` re-fetches on mount; no real-time mechanism needed

### Claude's Discretion

- Exact visual styling of the variant chip selector (color, size, spacing) — covered in 23-UI-SPEC.md
- Whether to extract owned-cards API to a new endpoint or extend `/api/binder` GET — planner decides
- Pagination or virtualization of the owned-card browse grid
- Whether the side panel is Sheet from shadcn/ui or custom drawer — Sheet confirmed present in codebase

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BINDER-07 | Variant badges on public binder "Looking For" tiles | Schema migration of `tradeManualWants` to printing-level; `getPublicBinderData()` update; `CardItem` already has variant badge logic in `want` mode (currently unused) |
| BINDER-08 | Card Detail page trade offer management per variant | Extend `getSameSetPrintingsWithCounts()` to return `tradeQuantity`; new client component mirroring `VariantCollectionSection`; re-uses `/api/trade` PATCH |
| BINDER-09 | Manage Binder collection-driven discovery | New owned-card query from `userCollections`/`userPrintingCollections`; replace `/api/cards/all` with owned-only endpoint; Sheet component confirmed installed |
</phase_requirements>

---

## Summary

Phase 23 is a surgical, well-bounded enhancement to three existing binder surfaces. All decisions are locked and the codebase already contains the key building blocks. No new external packages are required.

**The largest work item is the database schema migration** (D-01/D-02): `tradeManualWants` table must have its primary key changed from `(userId, cardDefinitionId)` to `(userId, cardPrintingId)`, with a data migration that maps existing rows to their Normal-printing `cardPrintingId`. This is a breaking change to the table that cascades into the API route, the `getUserTradeData` query, and Manage Binder client state.

**BINDER-08** is straightforward extension work: `getSameSetPrintingsWithCounts()` gains a LEFT JOIN to `user_trade_offerings`, and a new thin client component is added to the card detail page image column, directly mirroring the `VariantCollectionSection` pattern already in place. The `/api/trade` PATCH endpoint requires no changes.

**BINDER-09** replaces the Manage Binder "Add Cards" data source from the global `/api/cards/all` endpoint to an owned-card query, and adds a Sheet side panel (component already installed) for per-printing trade controls. The manual wants flow gains a variant chip selector after card selection.

**Primary recommendation:** Execute in three independent tracks within a single wave — schema migration (BINDER-07 data layer), Card Detail section (BINDER-08), and Manage Binder redesign (BINDER-09) — since BINDER-08 and BINDER-09 share no code paths and can proceed in parallel after the migration is complete.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Looking For per-printing data | Database / Storage | API (binder route) | `getPublicBinderData()` owns the shape of the looking-for list |
| `tradeManualWants` schema migration | Database / Storage | — | DDL change + data migration SQL; no frontend impact |
| Public binder Looking For badges | Frontend Server (SSR) | Browser / Client | Data shape change propagates via RSC to `CardItem` which already renders variant badges |
| Card Detail trade section data | Database / Storage → Frontend Server (SSR) | — | `getSameSetPrintingsWithCounts()` extended, result passed as RSC prop |
| Card Detail trade section controls | Browser / Client | API | Client component fires PATCH; no server involvement beyond the API |
| Manage Binder owned-card grid | API | Browser / Client | New or extended API endpoint supplies owned-card definitions; client fetches on mount |
| Manage Binder Sheet panel | Browser / Client | API | Optimistic state; PATCH mutations per printing |
| Manual wants chip selector | Browser / Client | API | Client renders chips from printing list; posts to `/api/binder/wants` |

---

## Standard Stack

### Core (no new packages — all existing)

| Library | Installed Version | Purpose | Why Standard |
|---------|-------------------|---------|--------------|
| drizzle-orm | ^0.45.2 | DB queries, schema, migrations | Project ORM [VERIFIED: package.json] |
| Next.js | 16.2.4 | SSR, API routes, RSC | Project framework [VERIFIED: package.json] |
| React | 19.2.4 | Client components, hooks | Project UI runtime [VERIFIED: package.json] |
| @base-ui/react | ^1.4.1 | Dialog/Sheet primitives | Already installed; Sheet component uses it [VERIFIED: 23-UI-SPEC.md] |
| lucide-react | ^1.14.0 | Icons (Plus, Minus, X, Search) | Already in use throughout [VERIFIED: codebase grep] |

### No New Packages Required

This phase adds no new dependencies. All UI components (Sheet, Button, Input, Card, Badge), icons, and styling utilities are already installed.

**Installation:** none

---

## Package Legitimacy Audit

No external packages are being installed in this phase. This section is not applicable.

---

## Architecture Patterns

### System Architecture Diagram

```
BINDER-07 — Looking For Variant Badges
  tradeManualWants (DB)
    [migrate PK: cardDefinitionId → cardPrintingId]
         │
         ▼
  getPublicBinderData() ── manualWants (per printing)
         │                 autoWants (card-definition, Normal badge)
         ▼
  PublicBinderPage (RSC) → mapToFilterable() [adds variantType]
         │
         ▼
  PublicBinderClient → CardGrid (mode="want") → CardItem
         [CardItem "want" mode: variant badge already implemented]

BINDER-08 — Card Detail Trade Section
  getSameSetPrintingsWithCounts() (extended)
    LEFT JOIN user_trade_offerings → adds tradeQuantity per printing
         │
         ▼
  CardDetailPage (RSC) → VariantTradeSection (new Client Component)
         │                [mirrors VariantCollectionSection structure]
         │                [+/- controls → PATCH /api/trade]
         ▼
  /api/trade PATCH (unchanged) → upsertTradeOffering()

BINDER-09 — Manage Binder Owned-Card Discovery
  getOwnedCardDefinitions() (new query)
    userCollections (count > 0) → cardDefinitions → Normal printing art
    userPrintingCollections → per-variant count + art precedence
         │
         ▼
  /api/collection/owned-cards (new) OR extended /api/binder GET
         │
         ▼
  ManageBinderPage (Client Component, useEffect on mount)
    OwnedCardGrid: ManageTradeCard tiles (art = best variant)
         │ click
         ▼
    VariantTradeSheet (new Client Component, uses Sheet)
      Per-printing rows: ownedCount chip + +/- trade controls
      PATCH /api/trade per mutation

  ManageWantsList (extended)
    Card search (card-definition level) → cardPrintings query
    Variant chip selector (new inline UI) → POST /api/binder/wants (cardPrintingId)
```

### Recommended Project Structure

No new directories. New files slot into existing structure:

```
src/
├── components/
│   ├── catalog/
│   │   └── variant-trade-section.tsx          # New — Card Detail trade controls (BINDER-08)
│   └── binder/
│       └── variant-trade-sheet.tsx            # New — Manage Binder side panel (BINDER-09)
├── db/
│   └── queries/
│       ├── card-detail.ts                     # Modified — extend getSameSetPrintingsWithCounts
│       ├── binder.ts                          # Modified — update getPublicBinderData
│       └── trade.ts                           # Modified — update upsertManualWant / deleteManualWant
├── app/
│   ├── api/
│   │   ├── binder/
│   │   │   └── wants/route.ts                 # Modified — accept cardPrintingId
│   │   └── collection/
│   │       └── owned-cards/route.ts           # New (recommended) — owned card definitions
│   ├── cards/[set-code]/[card-number]/
│   │   └── page.tsx                           # Modified — add VariantTradeSection
│   └── binder/manage/
│       └── page.tsx                           # Modified — replace allCards, add sheet state
└── drizzle/
    └── 0005_binder_variant_completeness.sql   # New migration
```

### Pattern 1: Extending getSameSetPrintingsWithCounts with tradeQuantity

**What:** LEFT JOIN `user_trade_offerings` into the existing query to add `tradeQuantity` per printing.
**When to use:** Card Detail page, server-side render, only when `userId` is present.

```typescript
// Source: src/db/queries/card-detail.ts (existing pattern extended)
export async function getSameSetPrintingsWithCounts(
  cardDefinitionId: number,
  setCode: string,
  userId?: number
) {
  return db
    .select({
      id: cardPrintings.id,
      variantType: cardPrintings.variantType,
      collectorNumber: cardPrintings.collectorNumber,
      ownedCount: sql<number>`COALESCE(${userPrintingCollections.count}, 0)`,
      tradeQuantity: sql<number>`COALESCE(${userTradeOfferings.quantity}, 0)`, // NEW
    })
    .from(cardPrintings)
    .leftJoin(
      userPrintingCollections,
      and(
        eq(cardPrintings.id, userPrintingCollections.cardPrintingId),
        userId ? eq(userPrintingCollections.userId, userId) : sql`FALSE`
      )
    )
    .leftJoin(                                                                  // NEW
      userTradeOfferings,
      and(
        eq(cardPrintings.id, userTradeOfferings.cardPrintingId),
        userId ? eq(userTradeOfferings.userId, userId) : sql`FALSE`
      )
    )
    .where(
      and(
        eq(cardPrintings.cardDefinitionId, cardDefinitionId),
        eq(cardPrintings.setCode, setCode)
      )
    )
    .orderBy(cardPrintings.variantType);
}
```

### Pattern 2: VariantTradeSection — Client Component structure

**What:** Thin client component mirroring `VariantCollectionSection` for trade quantities.
**When to use:** Card Detail page, auth-gated, placed in image column after VariantCollectionSection.

```typescript
// Source: mirrors src/components/catalog/variant-collection-section.tsx
'use client'
interface Printing {
  id: number;
  variantType: string;
  tradeQuantity: number;
}
// State: Record<number, number> keyed by printing.id, initialized from RSC-passed tradeQuantity
// Mutation: fetch('/api/trade', { method: 'PATCH', body: { cardPrintingId, tradeQuantity } })
// Optimistic: setCounts optimistically, rollback on !res.ok
// Status indicator: tradeQuantity > 0 → "Trading" (text-primary), else "Not trading" (muted)
```

### Pattern 3: tradeManualWants migration SQL

**What:** Drizzle migration SQL for PK change + data migration.
**When to use:** Wave 0, must run before any code changes touch the table.

```sql
-- Step 1: Add new column
ALTER TABLE "trade_manual_wants" ADD COLUMN "card_printing_id" integer;

-- Step 2: Populate with Normal printing id for existing rows
UPDATE "trade_manual_wants" tmw
SET "card_printing_id" = cp.id
FROM "card_printings" cp
WHERE cp.card_definition_id = tmw.card_definition_id
  AND cp.variant_type = 'Normal';

-- Step 3: Drop rows that have no Normal printing (acceptable data loss per D-02)
DELETE FROM "trade_manual_wants" WHERE "card_printing_id" IS NULL;

-- Step 4: Make column NOT NULL, add FK
ALTER TABLE "trade_manual_wants" ALTER COLUMN "card_printing_id" SET NOT NULL;
ALTER TABLE "trade_manual_wants"
  ADD CONSTRAINT "trade_manual_wants_card_printing_id_card_printings_id_fk"
  FOREIGN KEY ("card_printing_id") REFERENCES "card_printings"("id");

-- Step 5: Drop old PK and column
ALTER TABLE "trade_manual_wants" DROP CONSTRAINT "trade_manual_wants_user_id_card_definition_id_pk";
ALTER TABLE "trade_manual_wants" DROP COLUMN "card_definition_id";

-- Step 6: Add new PK
ALTER TABLE "trade_manual_wants"
  ADD CONSTRAINT "trade_manual_wants_user_id_card_printing_id_pk"
  PRIMARY KEY ("user_id", "card_printing_id");
```

### Pattern 4: Owned-card query for Manage Binder

**What:** New query to fetch card definitions where `userCollections.count > 0`, with best-variant art.
**When to use:** Manage Binder page, replaces `/api/cards/all`.

```typescript
// Source: pattern from src/db/queries/catalog.ts + src/lib/catalog/select-best-variant.ts
// Strategy: query cardDefinitions + userCollections (count > 0) + Normal printing for base art.
// For art override (D-14), also fetch userPrintingCollections and run selectBestVariantArtUrl
// client-side, or include a subquery that returns the highest-precedence owned printing's artUrl.
// Recommended: server-side — join userPrintingCollections, return all variant art URLs,
// call selectBestVariantArtUrl on the server and embed bestArtUrl in the response.
```

### Pattern 5: getPublicBinderData — manual wants per printing

**What:** Updated section of `getPublicBinderData` to produce per-printing looking-for entries from `tradeManualWants` (after migration to `cardPrintingId`).
**When to use:** Public binder page, Looking For section.

```typescript
// After migration, tradeManualWants has (userId, cardPrintingId, quantity)
// Fetch manual wants via join: tradeManualWants → cardPrintings → cardDefinitions
// Each row is already a per-printing entry — no explosion needed.
// Auto-wants continue to use the existing card-definition path (join to Normal printing).
// Combined lookingFor array: manualWant entries (with variantType from cardPrintings) 
//   + autoWant entries (variantType = 'Normal' as default)
```

### Anti-Patterns to Avoid

- **Schema Drizzle push vs migrate:** Do NOT use `drizzle-kit push` for the tradeManualWants migration; it cannot handle the multi-step PK swap. Use a hand-written SQL migration file in `drizzle/`. [VERIFIED: existing migration files are SQL-based]
- **Fetching all cards for Manage Binder:** The current `/api/cards/all` returns every printing of every card (tokens excluded). For users with large collections this is fine but replacing it with owned-only is both the UX requirement and a performance improvement. Do not keep the old endpoint as primary data source.
- **Separate client fetch for Card Detail trade data:** D-11 explicitly locks the tradeQuantity as server-fetched. Do not add a `useEffect` to load trade data on Card Detail — it must come from the RSC via extended `getSameSetPrintingsWithCounts`.
- **Mutating wants with cardDefinitionId after migration:** After D-01/D-08, the `/api/binder/wants` POST must only accept `cardPrintingId`. Any call passing `cardDefinitionId` will fail at the DB level due to missing column.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Side panel / drawer | Custom fixed-position div | `Sheet` from `src/components/ui/sheet.tsx` | Already installed, backed by `@base-ui/react/dialog`, animation handled |
| Variant art precedence | Custom precedence map | `selectBestVariantArtUrl()` from `src/lib/catalog/select-best-variant.ts` + `VARIANT_PRECEDENCE` | Existing implementation already used by catalog grid |
| Per-variant +/- row layout | Custom layout | Mirror `VariantCollectionSection` structure exactly | Pattern is established, tested, and matches UI-SPEC |
| Optimistic state with rollback | Custom state machine | `useState` map + try/catch rollback (existing pattern in `VariantCollectionSection`) | Simple pattern that already exists in the project |
| Card badge rendering | New badge component | Existing `CardItem` variant badge (`isBinder && variantType && variantType !== 'Normal'`) or `ManageTradeCard` badge | Badge markup is identical across surfaces |

**Key insight:** This phase is 90% wiring and extension of existing patterns. The primary risk is the migration SQL, not the UI components.

---

## Common Pitfalls

### Pitfall 1: Next.js 16 — params is a Promise
**What goes wrong:** Destructuring `params` directly causes a TypeScript error and runtime failure.
**Why it happens:** Next.js 16 changed `params` to be a `Promise<{...}>`.
**How to avoid:** Always `const { ... } = await params;` — see existing pattern in `CardDetailPage`.
**Warning signs:** TypeScript error "Cannot destructure property of Promise", or runtime "Cannot read properties of Promise".

### Pitfall 2: Drizzle `sql\`FALSE\`` pattern for optional userId joins
**What goes wrong:** Omitting the `userId ? eq(...) : sql\`FALSE\`` guard causes all users' trade data to leak to unauthenticated requests.
**Why it happens:** LEFT JOIN without a user filter returns rows for all users.
**How to avoid:** Match the existing pattern in `getSameSetPrintingsWithCounts` — the `sql\`FALSE\`` guard is the established convention.
**Warning signs:** Trade quantity showing for unauthenticated page loads.

### Pitfall 3: tradeManualWants migration order dependency
**What goes wrong:** Updating `getUserTradeData`, `/api/binder/wants`, or Manage Binder client before the migration is deployed causes 500 errors (missing column reference).
**Why it happens:** Code and schema are out of sync.
**How to avoid:** Migration SQL must be in Wave 0; all code changes that reference `cardPrintingId` on `tradeManualWants` must come after Wave 0 completes.
**Warning signs:** `column "card_printing_id" of relation "trade_manual_wants" does not exist` DB errors.

### Pitfall 4: Sheet from @base-ui/react vs shadcn/ui API
**What goes wrong:** Using shadcn/ui radix-based Sheet API (with `asChild`, `SheetContent` as direct child of `Sheet`) when the project's Sheet is backed by `@base-ui/react/dialog`.
**Why it happens:** The existing Sheet in this project wraps `@base-ui/react/dialog`, not Radix. The API is similar but not identical.
**How to avoid:** Import from `@/components/ui/sheet` and use the exported `Sheet`, `SheetTrigger`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription` — do not install or import from `shadcn` registry.
**Warning signs:** TypeScript errors on `asChild` prop, or duplicate Dialog primitive installs.

### Pitfall 5: allCards state coupling in ManageBinderPage
**What goes wrong:** The existing `updateTradeQuantity` handler in `ManageBinderPage` uses `allCards.find(c => c.printingId === cardPrintingId)` to construct the optimistic offering object. Replacing `allCards` with owned-only data means new trade entries for unowned-but-searched cards will fail to resolve the card name.
**Why it happens:** The optimistic update builds the offering from client-side card data.
**How to avoid:** After migration to owned-only browse, the "Add Cards" section only shows owned cards — so `allCards` (now renamed `ownedCards`) will always contain the card being added to trade.

### Pitfall 6: Auto-want rows in Looking For — variantType field
**What goes wrong:** Auto-want entries don't have a `variantType` field after the migration (they are card-definition level). Passing them directly to `mapToFilterable` fails if the shape expects `variantType`.
**Why it happens:** Auto-wants still use `cardDefinitionId`, not a printing row.
**How to avoid:** When building auto-want looking-for entries in `getPublicBinderData`, explicitly join to the Normal printing to get `variantType: 'Normal'` and the Normal art URL — same as today. The existing code already does this (`eq(cardPrintings.variantType, 'Normal')`).

---

## Code Examples

### Existing: CardItem variant badge in want mode

```typescript
// Source: src/components/catalog/card-item.tsx lines 111-115
// Currently: badge only in 'binder' mode. Looking For uses 'want' mode.
// BINDER-07 requires badge also in 'want' mode for non-Normal variantType.
{isBinder && variantType && variantType !== 'Normal' && (
  <div className="absolute top-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-bold shadow-md z-20 pointer-events-none uppercase">
    {variantType}
  </div>
)}
// Required change: add `|| isWant` to the condition, OR add a separate identical block for isWant.
```

### Existing: upsertManualWant signature (must be updated)

```typescript
// Source: src/db/queries/trade.ts line 186
export async function upsertManualWant(userId: number, cardDefinitionId: number, quantity: number)
// After migration becomes:
export async function upsertManualWant(userId: number, cardPrintingId: number, quantity: number)
// DB table column changes from card_definition_id to card_printing_id
```

### Existing: /api/binder/wants POST — must accept cardPrintingId

```typescript
// Source: src/app/api/binder/wants/route.ts line 15
const { cardDefinitionId, quantity } = body;
// After D-08 becomes:
const { cardPrintingId, quantity } = body;
```

### Existing: ManageBinderPage useEffect — replace /api/cards/all

```typescript
// Source: src/app/binder/manage/page.tsx lines 80-90
const [binderRes, cardsRes] = await Promise.all([
  fetch('/api/binder'),
  fetch('/api/cards/all')   // ← BINDER-09: replace with owned-cards endpoint
]);
```

### Existing: Sheet component usage pattern

```typescript
// Source: src/components/ui/sheet.tsx (confirmed installed)
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
// Usage:
<Sheet>
  <SheetTrigger asChild>
    <button>Open</button>
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>{cardName}</SheetTitle>
    </SheetHeader>
    {/* per-printing rows */}
  </SheetContent>
</Sheet>
// Note: SheetContent internally renders SheetPortal + SheetOverlay + SheetPrimitive.Popup
// Do not wrap SheetContent in an additional Portal — it handles its own portal.
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tradeManualWants` keyed by cardDefinitionId | `tradeManualWants` keyed by cardPrintingId | Phase 23 migration | Breaking change — all existing manual wants mapped to Normal printing |
| Manage Binder browses full catalog | Manage Binder browses owned cards only | Phase 23 | Better UX; reduces data transfer |
| Looking For tiles are card-definition level (no variant badge) | Looking For tiles are per-printing (with variant badge) | Phase 23 | Manual wants become per-variant |

**Deprecated/outdated after this phase:**
- `getAllCards()` as primary data source for Manage Binder "Add Cards": no longer used in that flow (still used by catalog page).
- `cardDefinitionId` as parameter to `/api/binder/wants` POST: replaced by `cardPrintingId`.

---

## Assumptions Log

> No `[ASSUMED]` claims in this research — all findings verified against the codebase directly.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | — | — | — |

**This table is empty:** All claims verified against source files in this session.

---

## Open Questions

1. **New owned-cards API endpoint vs extending /api/binder GET**
   - What we know: CONTEXT.md marks this as Claude's discretion
   - What's unclear: Does extending `/api/binder` GET increase its response payload significantly, or is a separate `/api/collection/owned-cards` endpoint cleaner?
   - Recommendation: Create a new `/api/collection/owned-cards` endpoint. It avoids inflating the `/api/binder` response with browse data that has different lifetime/purpose from trade state, and keeps routes single-responsibility. The planner should confirm.

2. **Variant chip selector data source in manual wants flow**
   - What we know: After card-name search, chips show the card's available printings
   - What's unclear: The card-name search currently runs against `allCards` (now `ownedCards`) which includes printing rows. The chip selector needs all printings for the selected card (including non-owned ones, since the user may want a variant they don't own yet).
   - Recommendation: After the user selects a card from search results, fire a lightweight fetch to get all `cardPrintings` for that `cardDefinitionId`. Alternatively, the owned-cards API can include all printings per card definition with `ownedCount` per printing — the chip selector can then show all variants, marking owned ones.

---

## Environment Availability

Step 2.6: SKIPPED — this phase contains no external dependencies beyond the project's own code and already-installed packages.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Not detected — no `jest.config.*`, `vitest.config.*`, or `pytest.ini` found in project |
| Config file | None |
| Quick run command | `npm run build` (type-check + build as proxy for correctness) |
| Full suite command | `npm run build` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BINDER-07 | Looking For tiles show variant badge for non-Normal printings | manual | Visit `/binder/{username}` — inspect Looking For section | N/A — manual |
| BINDER-07 | Auto-want tiles show no variant badge (Normal default) | manual | Same page | N/A — manual |
| BINDER-08 | Card Detail shows "Available for Trade" section for auth'd user | manual | Navigate to card detail, check section below collection | N/A — manual |
| BINDER-08 | Trade quantity update reflects immediately on the page | manual | +/- control on trade section row | N/A — manual |
| BINDER-09 | Manage Binder "Add Cards" shows only owned cards | manual | Visit `/binder/manage`, inspect browse grid | N/A — manual |
| BINDER-09 | Clicking tile opens Sheet with per-printing trade controls | manual | Click card tile on browse grid | N/A — manual |

### Sampling Rate

- Per task commit: `npm run build` — catches TypeScript type errors in modified files
- Per wave merge: `npm run build`
- Phase gate: `npm run build` green + manual smoke test of all three surfaces

### Wave 0 Gaps

- [ ] `drizzle/0005_binder_variant_completeness.sql` — migration file does not yet exist
- [ ] Database migration must run and succeed before code changes that reference `card_printing_id` on `tradeManualWants`

*(No test framework detected in project — `npm run build` serves as the automated quality gate.)*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `auth.api.getSession()` — all mutation routes are auth-gated (existing pattern) |
| V3 Session Management | no | Session management unchanged |
| V4 Access Control | yes | All trade mutations check `session.user.id` matches the userId in the DB query — existing pattern |
| V5 Input Validation | yes | `cardPrintingId` and `quantity` inputs validated (presence check + `Math.max(0, ...)` floor) |
| V6 Cryptography | no | No crypto in this phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Trade quantity injection (negative or overflow) | Tampering | `Math.max(0, tradeQuantity)` floor in `/api/trade` PATCH (already present) |
| IDOR on trade offerings (user A edits user B's row) | Elevation of Privilege | All DB mutations include `eq(table.userId, session.user.id)` — enforced at query level |
| `cardPrintingId` forgery (valid printing but not owned) | Tampering | Trade offerings allow any printing (not restricted to owned) — this is by design. No additional guard needed. |

---

## Sources

### Primary (HIGH confidence — verified against codebase)

- `src/db/schema.ts` — confirmed `tradeManualWants` current schema, `userTradeOfferings` schema, `userCollections` / `userPrintingCollections`
- `src/db/queries/binder.ts` — confirmed `getPublicBinderData()` structure and auto-want / manual-want join paths
- `src/db/queries/card-detail.ts` — confirmed `getSameSetPrintingsWithCounts()` signature and join pattern
- `src/db/queries/trade.ts` — confirmed `getUserTradeData()`, `upsertManualWant()`, `upsertTradeOffering()`
- `src/app/api/binder/wants/route.ts` — confirmed current `cardDefinitionId` parameter
- `src/app/api/trade/route.ts` — confirmed PATCH accepts `cardPrintingId` + `tradeQuantity` (no change needed)
- `src/app/cards/[set-code]/[card-number]/page.tsx` — confirmed RSC structure, image column layout
- `src/components/catalog/variant-collection-section.tsx` — confirmed state/optimistic/rollback pattern to mirror
- `src/components/catalog/card-item.tsx` — confirmed variant badge exists in `binder` mode; `want` mode needs badge added
- `src/components/binder/manage-trade-card.tsx` — confirmed badge pattern for reuse
- `src/app/binder/manage/page.tsx` — confirmed `allCards` state, `useEffect` data fetch, `updateTradeQuantity` optimistic state pattern
- `src/components/binder/manage-wants-list.tsx` — confirmed current wants list structure (no variant chip yet)
- `src/components/ui/sheet.tsx` — confirmed Sheet installed, backed by `@base-ui/react/dialog`
- `src/lib/catalog/select-best-variant.ts` — confirmed `VARIANT_PRECEDENCE` map and `selectBestVariantArtUrl()`
- `src/lib/binder-logic.ts` — confirmed `calculateLookingFor()` signature (unchanged)
- `.planning/phases/23-binder-variant-completeness/23-UI-SPEC.md` — confirmed approved visual contract
- `package.json` — confirmed Next.js 16.2.4, React 19.2.4, Drizzle ^0.45.2
- `drizzle/` migrations — confirmed hand-written SQL migration pattern; 0004 is current latest

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all from package.json
- Architecture: HIGH — all patterns verified against actual source files
- Migration SQL: HIGH — pattern derived from existing Drizzle migrations and PostgreSQL DDL
- Pitfalls: HIGH — derived from observed code patterns and explicit phase decisions

**Research date:** 2026-05-25
**Valid until:** 2026-07-25 (stable stack)

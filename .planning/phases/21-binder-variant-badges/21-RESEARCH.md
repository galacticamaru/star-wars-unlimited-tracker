# Phase 21: Binder Variant Badges - Research

**Researched:** 2026-05-21
**Domain:** Drizzle schema migration + React component props
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Create `user_trade_offerings` table with `(userId, cardPrintingId, quantity)` — same shape as `userPrintingCollections`. Composite PK on `(userId, cardPrintingId)`.
- **D-02:** Drop `userCollections.tradeQuantity` column after migration (clean break). Remove all reads/writes to this column from `getUserTradeData`, `getPublicBinderData`, `upsertTradeQuantity`, and PATCH `/api/trade`.
- **D-03:** Data migration runs atomically via custom SQL block in the Drizzle migration file: `INSERT INTO user_trade_offerings (user_id, card_printing_id, quantity) SELECT uc.user_id, cp.id, uc.trade_quantity FROM user_collections uc JOIN card_printings cp ON cp.card_definition_id = uc.card_definition_id WHERE cp.variant_type = 'Normal' AND uc.trade_quantity > 0`. Runs as part of `npx drizzle-kit push`.
- **D-04:** `getPublicBinderData` queries `user_trade_offerings` directly, joins to `card_printings` to get `frontArtUrl` and `variantType`, includes both in the returned offering shape.
- **D-05:** Add `variantType?: string` to `CardItemProps`. Render a variant type badge only in `mode='binder'`. Style matches `ManageTradeCard` badge: `bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase`.
- **D-06:** Two separate offerings tiles if a user offers both a Normal and Foil of the same card. No grouping logic; query naturally returns one row per offering.
- **D-07:** Add `printingId: cardPrintings.id` to `getAllCards()` return shape and expose via `/api/cards/all`. Manage binder page uses `card.printingId` when calling the trade API. PATCH `/api/trade` changes from `{ cardDefinitionId, tradeQuantity }` to `{ cardPrintingId, tradeQuantity }`.

### Claude's Discretion

- Whether to update `getAllCards()` in place or create a separate query for binder search — planner decides based on caller impact.
- Whether `upsertTradeOffering` is a new query function in `trade.ts` or inline in the API route — planner decides following existing patterns.
- Whether the manage page's optimistic state update (currently keyed by `cardDefinitionId`) migrates to `cardPrintingId` as the key — planner decides.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-BINDER-06 | Card tiles in the trade binder (offerings) display their variant type if it is not "Normal" | D-01 through D-07 collectively close this: per-printing storage (D-01/D-02/D-03) enables variant-aware art and badge (D-04/D-05) |

</phase_requirements>

---

## Summary

Phase 21 is a schema migration + thin UI change. The core problem is that `userCollections.tradeQuantity` is keyed by `cardDefinitionId`, which means only one trade offering per card is possible and the variant type is unknown. The fix is a new `user_trade_offerings` table keyed by `(userId, cardPrintingId)` — the same shape as the already-existing `userPrintingCollections` table — which makes both the variant type and the variant's art URL directly available from the join.

The code surface is well-understood: the locked decisions map precisely onto four named files in `src/db/queries/` (schema.ts, trade.ts, binder.ts, catalog.ts), two API routes (trade, binder), and two components (card-item.tsx and manage/page.tsx). `getAllCards()` returns all printings for the search panel — after adding `cardPrintings.id` as `printingId`, the manage page can pass it to the PATCH route instead of `cardDefinitionId`.

The most structurally significant change is the manage page's optimistic state. Currently `offerings` is an array of objects keyed by `cardDefinitionId`; post-migration it must key/de-duplicate by `cardPrintingId`. The `ManageTradeCard` key prop on line 319 is `card.cardDefinitionId` — that must change to `card.cardPrintingId`. The `updateTradeQuantity` callback signature must accept `cardPrintingId` instead of `cardDefinitionId`. This is a focused but pervasive rename within a single file.

**Primary recommendation:** Execute in two waves — Wave 1 is all schema + query + API + component changes in parallel; Wave 2 is `npx drizzle-kit push` (blocking, followed by smoke verification).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Store per-printing trade offerings | Database / Storage | — | New `user_trade_offerings` table keyed by `(userId, cardPrintingId)` |
| Migrate existing tradeQuantity data | Database / Storage | — | SQL migration block in schema push |
| Serve per-printing offering data | API / Backend | — | `getUserTradeData`, `getPublicBinderData`, PATCH `/api/trade` |
| Expose printingId for binder search | API / Backend | — | `getAllCards()` + `/api/cards/all` |
| Render variant badge on public binder tiles | Browser / Client | — | `CardItem` in `mode='binder'` with `variantType` prop |
| Manage-page optimistic state by printingId | Browser / Client | — | `manage/page.tsx` offerings array key change |

---

## Standard Stack

### Core (all already in project — no new installs)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | existing | Table definition, type-safe queries | Project ORM [VERIFIED: src/db/schema.ts] |
| drizzle-kit | existing | Schema push to Neon | Project migration tool [VERIFIED: drizzle.config.ts] |
| @neondatabase/serverless | existing | Postgres connection pool | Project DB driver [VERIFIED: src/db/index.ts] |
| React / Next.js | existing | Component rendering | Project framework |
| Tailwind CSS | existing | Badge styling | Project CSS framework |

No new packages required. [VERIFIED: codebase inspection]

**Installation:** None needed.

---

## Architecture Patterns

### System Architecture Diagram

```
Manage Binder Page (client)
  │ fetch /api/cards/all         → getAllCards() → card_definitions × card_printings
  │   returns: [..., printingId] (NEW)
  │
  │ fetch /api/binder (GET)      → getUserTradeData() → user_trade_offerings × card_printings (NEW)
  │   returns: { offerings: [{ cardPrintingId, quantity, variantType, frontArtUrl }] }
  │
  │ PATCH /api/trade             → upsertTradeOffering(userId, cardPrintingId, quantity) (NEW)
  │   body: { cardPrintingId, tradeQuantity }
  │
  optimistic state: offerings[] keyed by cardPrintingId (changed from cardDefinitionId)

Public Binder page (RSC → client)
  │ fetch getPublicBinderData()  → user_trade_offerings × card_printings (NEW)
  │   joins on user_trade_offerings.card_printing_id = card_printings.id
  │   returns: offerings[] with { variantType, frontArtUrl } from the specific printing
  │
  PublicBinderClient → CardGrid (mode="binder") → CardItem
    CardItem receives variantType prop → renders badge if variantType !== "Normal"
```

### Recommended Project Structure

No structural changes to directories. Changes are in-place edits to existing files:

```
src/
├── db/
│   ├── schema.ts               add userTradeOfferings table; drop tradeQuantity from userCollections
│   └── queries/
│       ├── trade.ts            rewrite getUserTradeData + upsertTradeQuantity → upsertTradeOffering
│       ├── binder.ts           rewrite getPublicBinderData offerings block
│       └── catalog.ts          add printingId to getAllCards() SELECT
├── app/
│   ├── api/
│   │   ├── trade/route.ts      body field: cardDefinitionId → cardPrintingId
│   │   └── cards/all/route.ts  expose printingId in plainCards map
│   └── binder/manage/page.tsx  AllCard + Offering interfaces; optimistic state key
└── components/
    └── catalog/card-item.tsx   add variantType prop + badge in binder mode
```

### Pattern 1: New Table — Same Shape as `userPrintingCollections`

**What:** Composite-PK table keyed on `(userId, cardPrintingId)` with a `quantity` column.
**When to use:** Whenever a user-level quantity is tracked per physical card printing.

```typescript
// Source: src/db/schema.ts (existing userPrintingCollections — copy this shape exactly)
export const userTradeOfferings = pgTable(
  'user_trade_offerings',
  {
    userId: integer('user_id').notNull(),
    cardPrintingId: integer('card_printing_id')
      .notNull()
      .references(() => cardPrintings.id),
    quantity: integer('quantity').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.cardPrintingId] }),
  ]
);
```

[VERIFIED: src/db/schema.ts lines 134–148 — exact shape being replicated]

### Pattern 2: Upsert Query — Same Shape as `upsertVariantCount`

**What:** Drizzle `.insert().onConflictDoUpdate()` targeting the composite PK.
**When to use:** Every write to the new `user_trade_offerings` table.

```typescript
// Source: src/db/queries/collection.ts lines 49–57 (upsertVariantCount — copy this pattern)
export async function upsertTradeOffering(userId: number, cardPrintingId: number, quantity: number) {
  return db
    .insert(userTradeOfferings)
    .values({ userId, cardPrintingId, quantity })
    .onConflictDoUpdate({
      target: [userTradeOfferings.userId, userTradeOfferings.cardPrintingId],
      set: { quantity, updatedAt: new Date() },
    })
    .returning();
}
```

[ASSUMED: function name and column name `quantity` follow the project's existing convention; exact implementation is planner/implementer discretion]

### Pattern 3: Data Migration SQL in Drizzle Push

**What:** Custom SQL block executed as part of `npx drizzle-kit push` to seed `user_trade_offerings` from `userCollections.tradeQuantity`.
**When to use:** Schema additions that require one-time data migration from an existing column.

The locked migration SQL (D-03):
```sql
INSERT INTO user_trade_offerings (user_id, card_printing_id, quantity)
SELECT uc.user_id, cp.id, uc.trade_quantity
FROM user_collections uc
JOIN card_printings cp ON cp.card_definition_id = uc.card_definition_id
WHERE cp.variant_type = 'Normal'
  AND uc.trade_quantity > 0;
```

**How drizzle-kit push handles this:** `drizzle-kit push` applies DDL from schema diffs. For custom DML (INSERT/UPDATE), the migration SQL must be placed in a `drizzle/` migration file (`.sql` extension) or run as a separate SQL step after push. `drizzle-kit push` itself does not execute DML.

**IMPORTANT:** `drizzle-kit push` applies schema DDL only. It does NOT execute arbitrary SQL in the migration. The data migration SQL (D-03) must be run as a separate step — either via `drizzle-kit migrate` with a hand-written migration file, or as a one-time `psql`/`db:seed` script. The plan must include an explicit task for this. [VERIFIED: drizzle.config.ts, 17-07-PLAN.md — Phase 17 only pushed DDL, no DML]

### Pattern 4: Variant Badge in `CardItem` (binder mode)

**What:** Plain `<div>` overlay at `top-1 left-1`, rendered only when `mode === 'binder'` and `variantType && variantType !== 'Normal'`.
**When to use:** Matches badge in `ManageTradeCard` lines 93–98.

```tsx
// Source: src/components/binder/manage-trade-card.tsx lines 93–98 (copy verbatim)
{variantType && variantType !== 'Normal' && (
  <div className="absolute top-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-bold shadow-md z-20 pointer-events-none uppercase">
    {variantType}
  </div>
)}
```

Full badge in `CardItem` must be inside the `<Link>` block's inner image `<div>`, positioned `absolute top-1 left-1` with the correct z-index (`z-20`) so it appears above the card image. [VERIFIED: src/components/binder/manage-trade-card.tsx lines 93–98]

### Anti-Patterns to Avoid

- **Hand-rolling the composite PK:** Use `primaryKey({ columns: [t.userId, t.cardPrintingId] })` exactly as in `userPrintingCollections`. Do not use `serial` PK with a separate unique constraint.
- **Putting DML in `drizzle-kit push`:** Push is DDL-only. The migration SQL (INSERT SELECT) must be a separate explicit step.
- **Keying the optimistic state by `cardDefinitionId` after migration:** Two printings of the same card (Normal + Foil) will clash. Use `cardPrintingId` as the unique key everywhere in the manage page after Phase 21.
- **Filtering `variantType = 'Normal'` in the new offerings join:** After migration, `user_trade_offerings` is already keyed by `cardPrintingId`. The `card_printings` join gives the variant type directly — no variant filter is needed or desired (D-06).
- **Leaving two sources of truth:** The `tradeQuantity` column must be dropped from `user_collections` and all reads/writes removed (D-02). Phase 19 added `variantType` to the `Offering` interface but it was populated via the old `WHERE variantType = 'Normal'` join — that entire query block is replaced.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Upsert with composite PK | Custom UPDATE + INSERT logic | Drizzle `onConflictDoUpdate` | Handles race conditions, already the project pattern |
| Badge HTML | Radix or custom component | Plain `<div>` with Tailwind | Project convention; no Radix UI in this codebase |
| Migration SQL runner | Custom script runner | `drizzle-kit push` (DDL) + separate SQL step (DML) | Established workflow per Phase 17 |

**Key insight:** The new table is structurally identical to `userPrintingCollections`. Every helper function, query pattern, and type can be copied from the collection module with column names changed from `count` to `quantity` (or `count` — planner decides based on consistency).

---

## Common Pitfalls

### Pitfall 1: `drizzle-kit push` Does Not Run DML

**What goes wrong:** Plan says "migration SQL runs as part of `npx drizzle-kit push`" (phrasing from D-03) but the push only applies DDL (CREATE TABLE, DROP COLUMN). The INSERT SELECT data migration silently never runs. All existing binder data is lost.
**Why it happens:** D-03 says "runs as part of `npx drizzle-kit push`" but that is shorthand for "in the same deployment step", not that push executes arbitrary SQL.
**How to avoid:** The plan must include an explicit separate task that runs the data migration SQL — via a one-time script, `drizzle-kit migrate` with a migration file, or a `psql` command against the Neon DB.
**Warning signs:** After push, `user_trade_offerings` table exists but is empty while `user_collections.trade_quantity > 0` rows still exist.

### Pitfall 2: `getAllCards()` Returns One Row Per Printing — Manage Page Already Handles Multiple Rows Per Card

**What goes wrong:** `getAllCards()` already returns one row per `card_printings` row (one per variant printing), not one row per definition. The manage page `allCards` state contains multiple rows for the same card (one Normal, one Foil, etc.). The search filter already uses this correctly (`allCards.filter(c => matchesSearch && matchesVariant)`). After adding `printingId`, each row in `allCards` will have a distinct `printingId`. This is the desired behavior — no deduplication needed.
**Why it happens:** Developers may assume `getAllCards` returns one row per card and try to add deduplication logic.
**How to avoid:** Leave `getAllCards()` as a per-printing query. The search results already show all variants; `printingId` is just a new field on each row.
**Warning signs:** Filtering the manage page search results down to Normal only — that would break the phase goal of allowing users to add Foil/variant offerings.

### Pitfall 3: Manage Page `key` Prop Still Uses `cardDefinitionId`

**What goes wrong:** Line 319 of `manage/page.tsx` uses `key={card.cardDefinitionId}` for `ManageTradeCard`. If a user has both a Normal and Foil offering, React will render the second card with the wrong key and the component state will merge.
**Why it happens:** The `Offering` interface currently has `cardDefinitionId` — it must gain `cardPrintingId` and the key must change.
**How to avoid:** The `Offering` interface gains `cardPrintingId: number`; `key` on `ManageTradeCard` changes to `card.cardPrintingId`; `ManageTradeCard.id` prop receives `cardPrintingId`; `updateTradeQuantity` callback receives `cardPrintingId`.
**Warning signs:** React "duplicate key" warning in the console when a user has two printings of the same card offered.

### Pitfall 4: `CardItem` Badge Positioned Outside the `<Link>` Block

**What goes wrong:** The badge `<div>` is placed outside the `<Link>` wrapper (after line 215 in `card-item.tsx`). The `absolute` positioning on `top-1 left-1` then escapes the image container and floats incorrectly.
**Why it happens:** The other badges (owned count, binder quantity) are placed OUTSIDE the `<Link>` at lines 218–236. The variant badge in `ManageTradeCard` is inside the image container.
**How to avoid:** The variant type badge belongs INSIDE the image `<div>` (same `relative` container as the card art), positioned `absolute top-1 left-1`. Specifically, it should be inside the `<Link>` wrapper's inner `<div className="relative rounded-md overflow-hidden ...">`. The exact placement mirrors `ManageTradeCard` lines 93–98 which is inside the outer container's `<div className="relative rounded-md overflow-hidden">`.
**Warning signs:** Badge appears outside the card frame or overlaps adjacent cards.

### Pitfall 5: `getPublicBinderData` Still Joins `userCollections` for Offerings

**What goes wrong:** The `offerings` block in `getPublicBinderData` is left unchanged, or partially updated. After Phase 21, `userCollections.tradeQuantity` is dropped — any query that touches it will fail at runtime.
**Why it happens:** `getPublicBinderData` has two conceptually separate blocks: offerings (needs to change) and looking-for inventory (uses `userCollections.count`, which stays).
**How to avoid:** Only the offerings query (lines 17–45 of binder.ts) changes to join `user_trade_offerings`. The inventory/looking-for portion of the function continues to use `userCollections` for `count` — that column is NOT dropped.
**Warning signs:** "column user_collections.trade_quantity does not exist" runtime error on public binder page.

---

## Code Examples

### New Table Definition

```typescript
// Source: src/db/schema.ts — copy of userPrintingCollections with column rename
export const userTradeOfferings = pgTable(
  'user_trade_offerings',
  {
    userId: integer('user_id').notNull(),
    cardPrintingId: integer('card_printing_id')
      .notNull()
      .references(() => cardPrintings.id),
    quantity: integer('quantity').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.cardPrintingId] }),
  ]
);
```

[VERIFIED: src/db/schema.ts lines 134–148 — shape verified]

### Updated `getUserTradeData` Offerings Query

```typescript
// Source: pattern from src/db/queries/trade.ts — replace the offerings SELECT block
const offerings = await db
  .select({
    cardPrintingId: userTradeOfferings.cardPrintingId,
    quantity: userTradeOfferings.quantity,
    name: cardDefinitions.name,
    type: cardDefinitions.type,
    frontArtUrl: cardPrintings.frontArtUrl,
    variantType: cardPrintings.variantType,
  })
  .from(userTradeOfferings)
  .innerJoin(cardPrintings, eq(cardPrintings.id, userTradeOfferings.cardPrintingId))
  .innerJoin(cardDefinitions, eq(cardDefinitions.id, cardPrintings.cardDefinitionId))
  .where(
    and(
      eq(userTradeOfferings.userId, userId),
      sql`${userTradeOfferings.quantity} > 0`
    )
  );
```

[ASSUMED: exact alias names follow project conventions; no foreign source verified for this specific query]

### Add `printingId` to `getAllCards()`

```typescript
// Source: src/db/queries/catalog.ts — add one field to the existing SELECT
return db
  .select({
    // ... existing fields ...
    printingId: cardPrintings.id,  // NEW — D-07
  })
  // ... rest of query unchanged
```

[VERIFIED: src/db/queries/catalog.ts — confirmed the SELECT fields and join; `cardPrintings.id` is available in this query]

### Expose `printingId` in `/api/cards/all`

```typescript
// Source: src/app/api/cards/all/route.ts
const plainCards = cards.map(c => ({
  id: c.id,
  name: c.name,
  subtitle: c.subtitle,
  frontArtUrl: c.frontArtUrl,
  type: c.type,
  variantType: c.variantType,
  printingId: c.printingId,  // NEW — D-07
}));
```

[VERIFIED: src/app/api/cards/all/route.ts lines 8–15 — confirmed existing shape]

### `CardItem` Variant Badge (binder mode only)

```tsx
// Source: src/components/binder/manage-trade-card.tsx lines 93–98 — copy verbatim
// Place INSIDE the <div className="relative rounded-md overflow-hidden ..."> block
{isBinder && variantType && variantType !== 'Normal' && (
  <div className="absolute top-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-bold shadow-md z-20 pointer-events-none uppercase">
    {variantType}
  </div>
)}
```

[VERIFIED: src/components/binder/manage-trade-card.tsx lines 93–98 — style classes confirmed]

### Updated PATCH `/api/trade` Route

```typescript
// Source: src/app/api/trade/route.ts — field rename
const { cardPrintingId, tradeQuantity } = body;  // was cardDefinitionId

if (cardPrintingId === undefined || tradeQuantity === undefined) {
  return new Response('Missing cardPrintingId or tradeQuantity', { status: 400 });
}

await upsertTradeOffering(Number(session.user.id), cardPrintingId, tradeQuantity);
```

[VERIFIED: src/app/api/trade/route.ts — confirmed current shape to change]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `userCollections.tradeQuantity` (definition-keyed) | `user_trade_offerings` (printing-keyed) | Phase 21 | Enables per-variant trade offerings and variant type badges |
| `getUserTradeData` + `getPublicBinderData` joining `userCollections.tradeQuantity` | Both query `user_trade_offerings` joined to `card_printings` | Phase 21 | Offerings carry correct art URL and variant type directly from printing row |
| `/api/trade PATCH` accepts `cardDefinitionId` | Accepts `cardPrintingId` | Phase 21 | API contract change — manage page must update simultaneously |

**Deprecated/outdated after Phase 21:**
- `userCollections.tradeQuantity` column: dropped
- `upsertTradeQuantity` function in `trade.ts`: replaced by `upsertTradeOffering`
- `tradeQuantity` field in `getUserTradeData` offerings shape: replaced by `quantity` (or renamed `tradeQuantity` — planner discretion)

---

## Runtime State Inventory

> Phase 21 is a rename/migration phase — this section is required.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | `user_collections.trade_quantity` column — production Neon DB rows where `trade_quantity > 0` | Data migration: INSERT SELECT into `user_trade_offerings` (one-time SQL step after push) |
| Live service config | None — no external service configuration references binder trade data | None |
| OS-registered state | None — no OS-level registrations reference trade data | None |
| Secrets/env vars | None — column rename does not affect env vars | None |
| Build artifacts | None — no compiled artifacts cache `tradeQuantity` column name | None |

**Nothing found in categories 2–5:** Verified by codebase inspection — the string `tradeQuantity` appears only in TypeScript source files, not in env vars, task scheduler entries, or build artifacts.

**Data migration risk:** The INSERT SELECT migration SQL (D-03) must run AFTER the DDL push (table created) and BEFORE application traffic reads from `user_trade_offerings`. If the production Neon DB currently has rows with `trade_quantity > 0`, those rows will be silently lost if the migration SQL step is skipped. The plan must include an explicit verification step (row count check before and after migration SQL).

---

## Open Questions (RESOLVED)

1. **`upsertTradeOffering` — `quantity` or `tradeQuantity` column name?**
   - What we know: `userPrintingCollections` uses `count`. The context says the new table uses `quantity`. The `Offering` interface in the manage page currently names the field `tradeQuantity`.
   - What's unclear: Whether the DB column should be `quantity` (matches context/D-01) or `trade_quantity` (mirrors the old column name for readability).
   - Recommendation: Use `quantity` (DB column `quantity`) as specified in D-01 to match the `tradeManualWants` table shape. The TypeScript interface field can be renamed to `tradeQuantity` in the API response for UI backward compatibility.

2. **Caller impact of `getAllCards()` printingId addition**
   - What we know: `/api/cards/all` currently maps `cards.map(c => ({ id, name, subtitle, frontArtUrl, type, variantType }))`. Other callers of `getAllCards()` exist (checked: no other API routes call it directly; the catalog RSC path uses a different set of queries).
   - What's unclear: Whether adding `printingId` to the raw `getAllCards()` return could break any typed consumers.
   - Recommendation: Add `printingId` to `getAllCards()` in-place and expose it in `/api/cards/all`. The field is additive and will not break existing destructuring.

3. **Manage page `Offering` interface shape after migration**
   - What we know: `Offering.cardDefinitionId` is used as the key in both the `offerings` array and `ManageTradeCard.id` prop. After migration, `Offering` needs `cardPrintingId` instead (or in addition) to key correctly.
   - What's unclear: Whether `cardDefinitionId` should be removed from `Offering` entirely or kept for backward compat with `ManageTradeCard.onUpdateTradeQuantity`.
   - Recommendation: Replace `cardDefinitionId` with `cardPrintingId` in `Offering`. Update `ManageTradeCard` prop `id` to accept the `cardPrintingId` value and thread it to `onUpdateTradeQuantity`. No other component or caller references `Offering.cardDefinitionId` externally.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 21 is code + schema changes against the existing Neon DB connection. No new external tools or services are required beyond what is already available.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (vitest.config.mts) |
| Config file | `vitest.config.mts` |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-BINDER-06 | `CardItem` in binder mode renders variant badge when `variantType !== 'Normal'` | unit | `npx vitest run src/components/catalog/card-item.test.tsx` | ✅ (extend existing) |
| REQ-BINDER-06 | `CardItem` in binder mode renders NO variant badge when `variantType === 'Normal'` | unit | `npx vitest run src/components/catalog/card-item.test.tsx` | ✅ (extend existing) |
| REQ-BINDER-06 (migration) | `user_trade_offerings` table exists in DB after push | manual smoke | — | ❌ Wave 0 |
| REQ-BINDER-06 (migration) | Existing `trade_quantity > 0` rows migrated to `user_trade_offerings` | manual smoke | — | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/components/catalog/card-item.test.tsx` — extend existing file with 2 new tests:
  - `shows variant badge in binder mode when variantType is 'Foil'`
  - `does not show variant badge in binder mode when variantType is 'Normal'`

*(No new test files needed — existing `card-item.test.tsx` is the right location. DB migration verification is manual-only.)*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `auth.api.getSession({ headers: await headers() })` — unchanged, already on every API route |
| V3 Session Management | no | No session changes |
| V4 Access Control | yes | `userId` always from `session.user.id`, never from request body — must be maintained in new PATCH handler |
| V5 Input Validation | yes | `cardPrintingId` must be validated as a positive integer; `tradeQuantity` must be `>= 0` |
| V6 Cryptography | no | No cryptographic operations |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| User A modifies User B's trade offerings by supplying a different userId | Tampering | `userId` sourced from `session.user.id` only — never from request body. Already established pattern. |
| Negative `tradeQuantity` submitted | Tampering | `Math.max(0, tradeQuantity)` floor in API route before DB write (matches existing pattern in collection API) |
| Invalid `cardPrintingId` (non-existent printing) | Tampering | Drizzle FK constraint on `user_trade_offerings.card_printing_id → card_printings.id` will reject invalid IDs at DB level |

---

## Sources

### Primary (HIGH confidence)

- `src/db/schema.ts` — table definitions for `userPrintingCollections` (template), `userCollections` (tradeQuantity column), `cardPrintings` (variantType, frontArtUrl)
- `src/db/queries/trade.ts` — `getUserTradeData`, `upsertTradeQuantity` — both verified as requiring full rewrite
- `src/db/queries/binder.ts` — `getPublicBinderData` — offerings block verified as the section to rewrite
- `src/db/queries/catalog.ts` — `getAllCards()` — confirmed `cardPrintings.id` is available in the join
- `src/db/queries/collection.ts` — `upsertVariantCount` / `recomputeTotal` — verified as the upsert pattern template
- `src/app/api/trade/route.ts` — confirmed current `cardDefinitionId` body field
- `src/app/api/cards/all/route.ts` — confirmed current plainCards shape (no `printingId`)
- `src/app/api/binder/route.ts` — confirmed calls `getUserTradeData`
- `src/app/binder/manage/page.tsx` — confirmed `AllCard`, `Offering` interfaces; `updateTradeQuantity` callback shape; `key={card.cardDefinitionId}` on ManageTradeCard
- `src/components/binder/manage-trade-card.tsx` lines 93–98 — variant badge style verified
- `src/components/catalog/card-item.tsx` — confirmed `variantType` prop absent; badge placement pattern verified
- `src/components/catalog/card-grid.tsx` — confirmed `tradeQuantity` threaded from `card.tradeQuantity`
- `src/lib/filter-cards.ts` — `CardForFilter` interface has optional `variantType?: string` — no change needed
- `.planning/phases/17-variant-collection-tracking/17-07-PLAN.md` — `drizzle-kit push` pattern: DDL only, confirmed push is not a DML runner
- `drizzle.config.ts` — confirmed `schema: './src/db/schema.ts'`
- `src/db/index.ts` — confirmed Neon serverless pool driver (no transactions)
- `.planning/config.json` — `nyquist_validation: true`
- `vitest.config.mts` — test framework config verified

### Secondary (MEDIUM confidence)

- None needed — all findings verified directly from codebase.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `upsertTradeOffering` uses `quantity` as the Drizzle field name (not `tradeQuantity`) | Code Examples | Low — planner can choose either name; the DB column name is the binding decision |
| A2 | The data migration SQL can be run as a one-time `psql` / script step rather than a Drizzle `migrate` migration file | Pitfall 1 | Medium — if the project strictly requires all DB changes via drizzle-kit, a migration file approach may be needed instead |

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in use, verified from source
- Architecture: HIGH — all integration points verified by reading actual source files
- Pitfalls: HIGH — derived from concrete code reading, not assumptions
- Migration approach: MEDIUM — `drizzle-kit push` DDL-only behavior inferred from Phase 17 plan pattern; DML separation is the safe interpretation

**Research date:** 2026-05-21
**Valid until:** 2026-06-21 (stable stack; no fast-moving dependencies)

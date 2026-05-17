# Phase 17: Variant Collection Tracking - Research

**Researched:** 2026-05-17
**Domain:** Drizzle ORM schema migration, Next.js 16 route handlers, React optimistic UI, CSV normalization
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**DB Schema**
- D-01: Add `user_printing_collections` table with composite PK `(userId, cardPrintingId)` and `count integer NOT NULL DEFAULT 0`. Keyed on `cardPrintings.id`.
- D-02: After every per-variant upsert, auto-recompute total: `SUM(count)` from `user_printing_collections` → write to `userCollections.count`. Zero downstream code changes for catalog, deck builder, want lists.
- D-03: `POST /api/collection` is REMOVED. All count mutations via `/api/collection/variants`.

**API**
- D-04: New endpoint `POST /api/collection/variants` — body `{ cardPrintingId: number, count: number }`. Upserts into `user_printing_collections`, then auto-sums → updates `userCollections`.
- D-05: `GET /api/collection` updated — new response shape: `{ [cardDefinitionId]: { total: number, variants: { [cardPrintingId]: number } } }`. All existing consumers of the old flat `{ [cardDefinitionId]: count }` must read `.total`.

**CSV Import**
- D-06: `POST /api/collection/import` updated to map collectorNumber → `cardPrintingId` and write to `user_printing_collections` per-variant, then auto-sum → `userCollections`.

**Card Detail Page**
- D-07: Variant list shows only same-set printings: `card_printings WHERE setCode = URL.setCode AND cardDefinitionId = card.id`.
- D-08: Each row labeled by `variantType` only (e.g., "Normal", "Hyperspace", "Showcase"). Set implied by URL.
- D-09: All same-set variants always shown, even at 0 owned. No add-variant flow needed.
- D-10: Existing single-total `CollectionControls` component REMOVED from card detail page. Replaced with per-variant list.
- D-11: Each variant row uses same +/− pattern as existing `CollectionControls`. One row per printing.
- D-12: Read-only "Total: X copies" line shown in collection section (positioning and component structure at planner's discretion).

### Claude's Discretion
- Positioning of "Total: X" within the collection section (above vs. below variant rows).
- Whether to extract a new `VariantCollectionControls` component or inline the per-variant list in the card detail page.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-COLLECT-06 | User can view per-variant owned counts on the card detail page | D-01 (new table), D-07/D-08/D-09 (query all same-set printings), D-05 (GET response includes variants map) |
| REQ-COLLECT-07 | User can increment and decrement owned count per variant on the card detail page | D-04 (new POST endpoint), D-11 (per-variant +/− controls), D-02 (auto-sum back to totals) |

</phase_requirements>

---

## Summary

Phase 17 adds per-variant owned-count tracking to the card detail page. The change is additive at the DB layer (new `user_printing_collections` table) while preserving the existing `userCollections.count` total via an auto-sum trigger written in application code, so no downstream consumers of `userCollections` need to change.

The API surface changes meaningfully: `POST /api/collection` is removed and replaced by `POST /api/collection/variants`, and `GET /api/collection` returns a richer shape `{ [cardDefinitionId]: { total, variants: { [cardPrintingId]: count } } }`. Three existing client-side consumers read the GET response and all must be migrated to `.total` — `CatalogClient`, `WantListTab`, and `CollectionControls` (already being removed, so no update needed there).

The card detail page's UI replaces the single `CollectionControls` component with a per-variant list. The existing `CollectionControls` component's +/− + number display pattern is the exact building block for each variant row.

The CSV import normalizer currently sums Standard/Foil/Hyperspace/F-Hyperspace into a single total per collectorNumber. Phase 17 changes this to write each count as a separate `user_printing_collections` row per variant, then auto-sum into `userCollections`. This requires the normalizer to return per-variant counts keyed by collectorNumber-variant-type rather than a single total.

**Primary recommendation:** Implement in waves — schema+migration first (Wave 0 test stubs + schema), then DB queries + API routes, then card detail page UI.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Per-variant count storage | Database | — | New `user_printing_collections` table; auto-sum to `userCollections` stays in the query layer |
| Auto-sum recompute | API / Backend (query layer) | — | Done after every upsert using `SUM(count)` subquery; not a DB trigger — application code |
| `POST /api/collection/variants` | API / Backend | — | Auth check + upsert + recompute |
| `GET /api/collection` shape update | API / Backend | — | Enriches response with `variants` map alongside `total` |
| CSV import per-variant writes | API / Backend | — | Maps collectorNumber → printingId per variant column, writes separate rows |
| Per-variant +/− controls | Browser / Client | — | Optimistic `useState` + async fetch, same pattern as existing `CollectionControls` |
| Card detail variant list (RSC data) | Frontend Server (SSR) | — | RSC fetches all same-set printings + their per-variant counts in page.tsx |
| `GET /api/collection` consumer migration | Browser / Client | — | CatalogClient, WantListTab must read `.total` instead of raw number |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | 0.45.2 | ORM — schema, upsert, aggregate queries | Already used; composite PK upsert pattern already proven in `userCollections` |
| @neondatabase/serverless | ^1.1.0 | Neon HTTP driver | No transactions available — sequential upserts per existing import pattern |
| next | 16.2.4 | Route handlers, RSC | Project framework; `params` is a Promise (must await) |
| react | 19.2.4 | Client components, useState | Optimistic UI pattern already in `CollectionControls` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| papaparse | ^5.5.3 | CSV parsing in browser | Already used in CollectionPage for CSV import |
| lucide-react | ^1.14.0 | Plus/Minus icons | Already imported in `CollectionControls` — reuse directly |
| vitest | ^4.1.5 | Unit tests | Test framework already configured; test pure logic (normalize, query helpers) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| App-level auto-sum after upsert | DB trigger | Neon HTTP driver doesn't support transactions; app-level SUM query is simpler and already the established pattern |
| Separate `/api/collection/variants` GET endpoint | Extend GET /api/collection | User explicitly wants single GET response with both total and variants — D-05 locks this |

---

## Architecture Patterns

### System Architecture Diagram

```
CSV Upload (browser)
  → normalizeRedditCsv (per-variant keyed)
  → POST /api/collection/import
      → lookup cardPrintingId per collectorNumber+variantType
      → INSERT user_printing_collections (per row)
      → SUM → UPDATE userCollections (per cardDefinitionId)

Card Detail Page (RSC)
  → getCardByPrinting(setCode, cardNumber)      [existing]
  → getSameSetPrintings(cardDefinitionId, setCode)  [NEW]
  → getVariantCounts(userId, cardDefinitionId)   [NEW or combined]
  → render VariantCollectionSection (client component)
      → per-row: variantType label + PrintingCountControl
          → onClick → POST /api/collection/variants
              → UPSERT user_printing_collections
              → SUM → UPDATE userCollections
          → optimistic useState update

CatalogClient / WantListTab / DeckBuilder
  → GET /api/collection → { [cardDefinitionId]: { total, variants } }
  → read .total  [migration from raw count]
```

### Recommended Project Structure
```
src/
├── db/
│   ├── schema.ts                      # Add userPrintingCollections table
│   └── queries/
│       ├── collection.ts              # Add upsertVariantCount, getUserVariantCounts, recomputeTotal
│       └── card-detail.ts             # Extend to fetch same-set printings
├── app/
│   └── api/
│       └── collection/
│           ├── route.ts               # Update GET shape; REMOVE POST
│           ├── variants/
│           │   └── route.ts           # NEW: POST /api/collection/variants
│           └── import/
│               └── route.ts           # Update to write per-variant rows
├── components/
│   └── catalog/
│       ├── collection-controls.tsx    # Keep for catalog use; no longer used on card detail
│       └── variant-collection-section.tsx  # NEW: per-variant list + total display
└── lib/
    └── collection/
        └── normalize.ts               # Update to return per-variant counts
```

### Pattern 1: Drizzle Composite PK Upsert (established)
**What:** Insert-on-conflict-update targeting composite PK columns
**When to use:** Upsert into `user_printing_collections`

```typescript
// Source: src/db/queries/collection.ts (existing upsertCardCount pattern)
await db
  .insert(userPrintingCollections)
  .values({ userId, cardPrintingId, count })
  .onConflictDoUpdate({
    target: [userPrintingCollections.userId, userPrintingCollections.cardPrintingId],
    set: { count, updatedAt: new Date() },
  });
```

### Pattern 2: Auto-Sum Recompute (new)
**What:** After every variant upsert, SUM all variant counts for the same `cardDefinitionId` and write to `userCollections`.
**When to use:** After every `upsertVariantCount` call (inside query helper or API route).

```typescript
// Source: [ASSUMED] — Drizzle aggregate subquery pattern, consistent with existing sql`COALESCE(...)` usage
import { sql, eq, and } from 'drizzle-orm';

async function recomputeTotal(userId: number, cardDefinitionId: number) {
  const [{ total }] = await db
    .select({ total: sql<number>`COALESCE(SUM(${userPrintingCollections.count}), 0)` })
    .from(userPrintingCollections)
    .innerJoin(cardPrintings, eq(cardPrintings.id, userPrintingCollections.cardPrintingId))
    .where(
      and(
        eq(userPrintingCollections.userId, userId),
        eq(cardPrintings.cardDefinitionId, cardDefinitionId)
      )
    );

  await db
    .insert(userCollections)
    .values({ userId, cardDefinitionId, count: total })
    .onConflictDoUpdate({
      target: [userCollections.userId, userCollections.cardDefinitionId],
      set: { count: total, updatedAt: new Date() },
    });
}
```

### Pattern 3: Same-Set Printings Query (new)
**What:** Fetch all `card_printings` rows for a given `cardDefinitionId` + `setCode`.
**When to use:** Card detail RSC to build the variant list.

```typescript
// Source: [ASSUMED] — standard Drizzle select with AND condition, consistent with card-detail.ts patterns
const printings = await db
  .select({
    id: cardPrintings.id,
    variantType: cardPrintings.variantType,
    collectorNumber: cardPrintings.collectorNumber,
  })
  .from(cardPrintings)
  .where(
    and(
      eq(cardPrintings.cardDefinitionId, cardDefinitionId),
      eq(cardPrintings.setCode, setCode)
    )
  );
```

### Pattern 4: Per-Variant Counts with Left Join (new)
**What:** Join `user_printing_collections` onto `card_printings` to get owned count per printing for a user.
**When to use:** Card detail RSC — one query to get all same-set printings with owned counts.

```typescript
// Source: [ASSUMED] — follows leftJoin pattern in card-detail.ts (existing userId guard)
const printingsWithCounts = await db
  .select({
    id: cardPrintings.id,
    variantType: cardPrintings.variantType,
    ownedCount: sql<number>`COALESCE(${userPrintingCollections.count}, 0)`,
  })
  .from(cardPrintings)
  .leftJoin(
    userPrintingCollections,
    and(
      eq(cardPrintings.id, userPrintingCollections.cardPrintingId),
      userId ? eq(userPrintingCollections.userId, userId) : sql`FALSE`
    )
  )
  .where(
    and(
      eq(cardPrintings.cardDefinitionId, cardDefinitionId),
      eq(cardPrintings.setCode, setCode)
    )
  );
```

### Pattern 5: Optimistic UI per variant row (existing pattern extended)
**What:** Local `useState` per-variant counts map; update optimistically, then fire fetch.
**When to use:** `VariantCollectionSection` client component.

```typescript
// Source: src/components/catalog/collection-controls.tsx (existing fire-and-update pattern)
const [counts, setCounts] = useState<Record<number, number>>(
  Object.fromEntries(printings.map(p => [p.id, p.ownedCount]))
);

const updateVariant = async (cardPrintingId: number, newCount: number) => {
  const val = Math.max(0, newCount);
  setCounts(prev => ({ ...prev, [cardPrintingId]: val }));
  await fetch('/api/collection/variants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardPrintingId, count: val }),
  });
};
```

### Pattern 6: GET /api/collection enriched shape (migration)
**What:** Response changes from `{ [cardDefinitionId]: count }` to `{ [cardDefinitionId]: { total: number, variants: { [cardPrintingId]: number } } }`.
**Consumer migration:** All three consumers read `data[id]` as a raw number today — they must switch to `data[id]?.total ?? 0`.

```typescript
// Before (3 consumers: CatalogClient, WantListTab, catalog card-item inline logic)
const owned = collection[cardDefinitionId] ?? 0;

// After
const owned = collection[cardDefinitionId]?.total ?? 0;
```

### Pattern 7: CSV import per-variant normalization (updated)
**What:** `normalizeRedditCsv` currently returns `{ [collectorNumber]: totalCount }`. It must be updated to return per-variant collectorNumbers since each variant already has its own collectorNumber in the DB (e.g., "SOR-059" for Normal, "SOR-059H" for Hyperspace). The import route then maps each to its `cardPrintingId`.

**Key insight from existing data:** `card_printings` has a `unique(setCode, collectorNumber)` constraint. The DB already stores one row per physical variant with its own `collectorNumber`. The CSV's card number (e.g., "059") is the base number — each variant type has a distinct physical collector number suffix in the actual data.

**Important:** The current normalizer pads the card number with `padStart(3, '0')` and constructs `{setCode}-{paddedNum}`. The variant collectorNumbers in the DB may have suffixes (e.g., "SOR-059", "SOR-059H"). The import route must query `cardPrintings` by `collectorNumber` per variant — the normalizer can emit separate entries for each variant column with the correct suffix pattern, **or** the import route can look up both the base and variant collectorNumbers. This is a design decision the planner must resolve — research cannot confirm the exact collectorNumber suffix convention without querying the live DB. [ASSUMED: Hyperspace uses "H" suffix, Foil uses "F" suffix — verify against `card_printings` data before implementing].

### Anti-Patterns to Avoid
- **DB triggers for auto-sum:** Neon HTTP driver doesn't support DDL in-flight. Keep the SUM-and-update logic in application code inside the query helper.
- **Reading `GET /api/collection` response as raw number:** After the shape change, `data[id]` is an object, not a number. Reading it as `collection[id] ?? 0` will silently return the object itself (truthy but wrong).
- **Forgetting `await params` in Next.js 16:** Route handler context `params` is a Promise in Next.js ≥15. Always `const { id } = await params` — already well-established in this codebase.
- **`WHERE variantType = 'Normal'` filter in card-detail query:** The existing `getCardByPrinting` has this filter. The new same-set-printings query must NOT include it — all variant types are wanted.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Composite-PK upsert | Manual SELECT + INSERT/UPDATE | Drizzle `.onConflictDoUpdate` | Already proven in `upsertCardCount`; handles race conditions atomically |
| Sum aggregation | JS-side loop over all variant rows | Drizzle `sql\`COALESCE(SUM(...))\`` | Single round-trip; consistent with `collectionCount` pattern in `card-detail.ts` |
| Auth check pattern | Custom session parsing | `auth.api.getSession({ headers: await headers() })` | Project standard — every API route already uses this exact pattern |

**Key insight:** The auto-sum recompute does not need to be a DB trigger. Application-level SUM + upsert is consistent with the Neon HTTP driver constraint (no transactions) and is simpler to debug.

---

## Common Pitfalls

### Pitfall 1: GET /api/collection response shape — silent breakage in consumers
**What goes wrong:** After the shape change, `collection[id]` is `{ total, variants }` not a `number`. Code that does `if (collection[id] > 0)` or `count + collection[id]` silently does the wrong thing.
**Why it happens:** TypeScript would catch this if the type is updated, but fetch responses are often typed as `Record<number, number>` and not re-typed at the call sites.
**How to avoid:** Update the TypeScript type of the collection state in all three consumers (`CatalogClient`, `WantListTab`, the catalog card's inline ownedCount logic) when updating the GET response. Search for `Record<number, number>` and `collection[` across the codebase to find all call sites.
**Warning signs:** Catalog cards showing `[object Object]` for owned count badge; WantListTab "shortfall" math producing NaN.

### Pitfall 2: `variantType = 'Normal'` filter left in card-detail query
**What goes wrong:** `getCardByPrinting` currently has `eq(cardPrintings.variantType, 'Normal')` in its WHERE clause. If a new "get same-set printings" function accidentally inherits this filter, only Normal variant rows are returned.
**Why it happens:** Easy copy-paste from existing query.
**How to avoid:** The new `getSameSetPrintings` / combined query must NOT include a `variantType` filter.
**Warning signs:** Card detail page shows only one row (Normal) instead of all variants.

### Pitfall 3: CSV import — collectorNumber suffix conventions unknown without live data
**What goes wrong:** The normalizer currently maps card number "059" → collectorNumber "SOR-059". Hyperspace variant may be "SOR-059H" or a completely different number. If the suffix convention is wrong, `cardPrintings` lookup fails silently and counts are dropped.
**Why it happens:** The existing normalizer sums all variants into one total so it only needs the base number. Phase 17 must separate them.
**How to avoid:** Query `card_printings` for a known multi-variant card before writing the normalizer logic. Verify the actual `collectorNumber` values stored for Hyperspace and Foil printings.
**Warning signs:** Import reports 0 or reduced count for cards with multiple variants.

### Pitfall 4: `CollectionControls` still referenced after removal
**What goes wrong:** `CollectionControls` is imported in `src/app/cards/[set-code]/[card-number]/page.tsx`. If the import is not removed, TypeScript won't error (component still exists for catalog use) but the old single-total control will render alongside or instead of the new per-variant controls.
**How to avoid:** Remove the `CollectionControls` import from `page.tsx` explicitly in the same task that adds the per-variant component.

### Pitfall 5: Neon HTTP driver — no transactions
**What goes wrong:** Attempting to wrap the variant upsert + total recompute in a `db.transaction()` call fails at runtime with the Neon HTTP driver.
**Why it happens:** The `@neondatabase/serverless` HTTP driver does not support transactions (confirmed by existing import route comment: "neon-http driver does not support transactions").
**How to avoid:** Execute the upsert and recompute as two sequential awaits. This is already the pattern in the import route.

---

## Code Examples

Verified patterns from official sources:

### New table schema definition
```typescript
// Source: src/db/schema.ts (existing userCollections pattern)
export const userPrintingCollections = pgTable(
  'user_printing_collections',
  {
    userId: integer('user_id').notNull(),
    cardPrintingId: integer('card_printing_id')
      .notNull()
      .references(() => cardPrintings.id),
    count: integer('count').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.cardPrintingId] }),
  ]
);
```

### POST /api/collection/variants route
```typescript
// Source: src/app/api/collection/route.ts (existing POST pattern)
// File: src/app/api/collection/variants/route.ts
import { NextRequest } from 'next/server';
import { upsertVariantCount } from '@/db/queries/collection';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response('Unauthorized', { status: 401 });

  const { cardPrintingId, count } = await request.json();
  if (cardPrintingId === undefined || count === undefined) {
    return new Response('Missing cardPrintingId or count', { status: 400 });
  }

  await upsertVariantCount(Number(cardPrintingId), Math.max(0, count), Number(session.user.id));
  return Response.json({ success: true });
}
```

### Updated GET /api/collection response
```typescript
// Source: src/app/api/collection/route.ts (existing GET pattern, updated shape)
// New getUserCollection must return both totals and variant breakdowns
const countMap = collection.reduce((acc, row) => {
  if (!acc[row.cardDefinitionId]) {
    acc[row.cardDefinitionId] = { total: row.total, variants: {} };
  }
  if (row.cardPrintingId) {
    acc[row.cardDefinitionId].variants[row.cardPrintingId] = row.variantCount;
  }
  return acc;
}, {} as Record<number, { total: number; variants: Record<number, number> }>);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `params` is synchronous | `params` is a Promise in Next.js 15+ | v15.0.0-RC | Must `await params` in route handlers and page components — already done in this codebase |
| `GET` handlers cached by default | `GET` handlers dynamic by default | v15.0.0-RC | No caching surprises for collection data |

**Deprecated/outdated:**
- `POST /api/collection` (this project): Removed by D-03 in this phase. Existing callers: `CollectionControls` component (removed from card detail) and `CatalogClient.handleUpdateCount` (must be updated to POST to `/api/collection/variants` or kept pointing to the catalog's own flow — see Open Questions).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Hyperspace variant collectorNumber uses "H" suffix (e.g., "SOR-059H"), Foil uses "F" suffix | Architecture Patterns §Pattern 7, Common Pitfalls §Pitfall 3 | CSV import writes counts to wrong printingId; variants silently dropped on import |
| A2 | `recomputeTotal` can be implemented as a SELECT SUM + upsert without transactions and will be consistent enough for this use case | Architecture Patterns §Pattern 2 | If two concurrent variant updates race, total could be momentarily off — acceptable given single-user usage pattern |
| A3 | The `VariantCollectionSection` component should be a new file rather than extending `CollectionControls` | Architecture Patterns §Recommended Project Structure | If wrong, planner may choose to inline the variant list directly in `page.tsx` instead — both are valid per D-12 discretion |

---

## Open Questions

1. **CatalogClient mutation endpoint after POST /api/collection removal**
   - What we know: `CatalogClient.handleUpdateCount` currently calls `POST /api/collection` to update the total count for a card (from catalog card grid +/- controls). D-03 removes this endpoint.
   - What's unclear: The catalog does not know `cardPrintingId` — it only knows `cardDefinitionId`. There is no variant granularity in the catalog grid. The catalog +/- controls operate on total count only.
   - Recommendation: The planner must decide whether the catalog grid +/- controls (a) are also removed/disabled, (b) continue to call some endpoint (possibly the new variants endpoint with a designated "Normal" printingId), or (c) become read-only in this phase. The CONTEXT.md does not address this — the card detail page is the only explicit mutation surface. **Likely answer: catalog +/- mutation is out of scope for Phase 17; catalog shows `.total` from GET response but its inline mutation path needs a clear decision.** Flag for planner.

2. **CSV import: per-variant collectorNumber suffix**
   - What we know: `card_printings` has one row per physical printing, each with its own `collectorNumber`. The current normalizer uses the base card number only.
   - What's unclear: The exact suffix convention for Hyperspace (H?), Foil (F?), and Showcase variants in `card_printings` is not confirmed without a live DB query.
   - Recommendation: Add a Wave 0 task to query `card_printings` for a known set (e.g., SOR) and document the actual `collectorNumber` patterns before writing the updated normalizer. This is a 5-minute lookup that prevents a hard-to-debug bug.

3. **`getUserCollection` query refactoring scope**
   - What we know: `getUserCollection` returns `{ cardDefinitionId, count }[]` from `userCollections` only. The GET /api/collection handler must now return `{ total, variants }`.
   - What's unclear: Whether to join `user_printing_collections` in the same query or run a separate query for variants.
   - Recommendation: Single query with a left join on `user_printing_collections` → `card_printings` gives `cardDefinitionId`, `total`, `cardPrintingId`, `variantCount` in one round-trip. This is more efficient and follows the existing join patterns in `card-detail.ts`.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is code/config/schema changes against the already-connected Neon DB. No new external tools are required beyond what is already installed and running.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 |
| Config file | `vitest.config.mts` |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-COLLECT-06 | View per-variant owned counts — normalizer emits correct per-variant structure | unit | `npx vitest run src/lib/collection/normalize.test.ts` | ❌ Wave 0 |
| REQ-COLLECT-07 | Increment/decrement per variant — count never goes below 0 | unit | `npx vitest run src/lib/collection/normalize.test.ts` | ❌ Wave 0 |
| D-05 | GET /api/collection response shape — reducer builds `{ total, variants }` correctly | unit | `npx vitest run src/app/api/collection/collection-shape.test.ts` | ❌ Wave 0 |

> Note: DB query functions and API routes cannot be unit tested without a live DB (Neon HTTP). Tests cover the pure logic: CSV normalizer, response-shape reducer, and count-floor behavior.

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/lib/collection/normalize.test.ts` — per-variant normalizer output (REQ-COLLECT-06, REQ-COLLECT-07)
- [ ] `src/app/api/collection/collection-shape.test.ts` — GET response shape reducer (D-05)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `auth.api.getSession({ headers: await headers() })` — existing pattern in every route |
| V3 Session Management | no | Handled by better-auth |
| V4 Access Control | yes | userId scoped in all DB queries — `WHERE user_id = session.user.id` |
| V5 Input Validation | yes | `count = Math.max(0, count)` floor on mutation; validate `cardPrintingId` is a number |
| V6 Cryptography | no | No cryptographic operations |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Missing auth on POST /api/collection/variants | Elevation of Privilege | `auth.api.getSession` check — return 401 if no session |
| Negative count injection | Tampering | `Math.max(0, count)` before upsert |
| Cross-user data access (userId in body vs. session) | Spoofing | Never trust userId from request body — always use `session.user.id` |
| Missing `cardPrintingId` validation | Tampering | Validate both `cardPrintingId` and `count` present and numeric before DB call |

---

## Sources

### Primary (HIGH confidence)
- `src/db/schema.ts` — verified table structures, composite PK patterns, column names
- `src/db/queries/collection.ts` — verified `upsertCardCount` onConflictDoUpdate pattern
- `src/db/queries/card-detail.ts` — verified leftJoin + `userId ? ... : sql\`FALSE\`` pattern, `variantType = 'Normal'` filter
- `src/app/api/collection/route.ts` — verified GET/POST shape, auth pattern
- `src/app/api/collection/import/route.ts` — verified chunked lookup + sequential upsert + "no transactions" comment
- `src/components/catalog/collection-controls.tsx` — verified optimistic UI pattern (useState + async fetch)
- `src/app/cards/[set-code]/[card-number]/page.tsx` — verified RSC structure, `await params` pattern, CollectionControls usage
- `src/lib/collection/normalize.ts` — verified current CSV normalizer behavior (sums all variants into one total)
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` — verified Next.js 16 route handler patterns, `params` is Promise

### Secondary (MEDIUM confidence)
- `src/components/catalog/catalog-client.tsx` — verified `collection` state typed as `Record<number, number>`, fetch pattern, `onUpdateCount` mutation via POST /api/collection
- `src/components/decks/want-list-tab.tsx` — verified `collection[dc.cardDefinitionId] ?? 0` raw-number access pattern

### Tertiary (LOW confidence)
- Collectorнumber suffix conventions (H/F for Hyperspace/Foil) — [ASSUMED] based on SWU card naming convention; not verified against live `card_printings` data

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified from installed packages and existing source
- Architecture: HIGH — all patterns traced from existing codebase; new patterns follow established Drizzle and Next.js conventions verified from docs
- CSV import suffix convention: LOW — assumed from domain knowledge, requires live DB verification
- Pitfalls: HIGH — all identified from direct code inspection of consumers and existing import pattern

**Research date:** 2026-05-17
**Valid until:** 2026-06-17 (stable stack; no fast-moving dependencies)

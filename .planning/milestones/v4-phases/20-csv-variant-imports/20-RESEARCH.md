# Phase 20: Update CSV imports to support all four variant types - Research

**Researched:** 2026-05-24
**Domain:** CSV Import & Collection Sync
**Confidence:** HIGH

## Summary
The goal is to update the Reddit community CSV import to fully support all four columns: Normal (Standard/Non-Foil), Foil, Hyperspace, and Hyperspace Foil (F-Hyperspace). Previously, Hyperspace variants were skipped because their `collectorNumber` does not follow a predictable suffix pattern (e.g. SOR-059 vs SOR-324) and cannot be derived from the base card number alone.

By updating `normalizeRedditCsv` to output an array of operations structured as `{ swudbId, variantType, count }`, we shift the burden of `collectorNumber` discovery to the server. The `POST /api/collection/import` route will query the `card_definitions` table by `swudbId` (which perfectly matches the `${setCode}-${paddedNumber}` format of the CSV) joined with `card_printings` by `variantType` to locate the exact `printingId` needed for upsert.

**Primary recommendation:** Refactor `normalizeRedditCsv` to return an aggregated array of `{ swudbId, variantType, count }` objects. Refactor `POST /api/collection/import` to batch-query `cardDefinitions` joined with `cardPrintings` to resolve these objects to a `printingId` for sequential upserting.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| CSV Parsing | Browser / Client | — | Offload parsing to client via PapaParse, sending a clean JSON structure to the API. |
| CSV Normalization | Browser / Client | — | Transforming rows into `swudbId` and `variantType` maps happens client side to minimize API payload. |
| Import Processing | API / Backend | Database | Receives array of variants, joins against `card_definitions` and `card_printings` to locate `printingId`, and sequentially upserts via `upsertVariantCount`. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| papaparse | (existing) | CSV Parsing | Handles large client-side CSV files efficiently. |
| drizzle-orm | (existing) | DB Queries | Batch joins across `card_printings` and `card_definitions`. |

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None | Schema is unchanged. |
| Live service config | None | N/A |
| OS-registered state | None | N/A |
| Secrets/env vars | None | N/A |
| Build artifacts | None | N/A |

## Architecture Patterns

### Pattern 1: Variant Resolution via JOIN
**What:** Instead of deriving `collectorNumber` client-side, the client provides the base card identity (`swudbId`) and the `variantType`. The server resolves this to a `printingId` via an INNER JOIN.
**When to use:** When dealing with Hyperspace or Showcase variants that do not follow base number suffix rules.
**Example:**
```typescript
const results = await db
  .select({
    swudbId: cardDefinitions.swudbId,
    cardDefinitionId: cardDefinitions.id,
    variantType: cardPrintings.variantType,
    printingId: cardPrintings.id,
  })
  .from(cardPrintings)
  .innerJoin(cardDefinitions, eq(cardPrintings.cardDefinitionId, cardDefinitions.id))
  .where(inArray(cardDefinitions.swudbId, chunkedSwudbIds));
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Batch DB Lookups | `N` single row queries | `inArray` + `innerJoin` | Prevents connection pool exhaustion and speeds up imports. |

## Common Pitfalls

### Pitfall 1: Double Upserting Duplicates
**What goes wrong:** A CSV has two rows for the same card, causing two separate `{ swudbId, variantType, count }` operations for the same variant.
**Why it happens:** Bad CSV formatting, leading to two calls to `upsertVariantCount` for the same `printingId`.
**How to avoid:** `normalizeRedditCsv` must aggregate counts by `swudbId|variantType` locally before mapping the final array, since `upsertVariantCount` overwrites values instead of adding to them.

### Pitfall 2: Spelling of Variant Types
**What goes wrong:** The API query fails to find a printing because the CSV column header (e.g. "F-Hyperspace") is used directly as the `variantType`.
**Why it happens:** The database constraint enforces specific strings.
**How to avoid:** Map "F-Hyperspace" strictly to `"Hyperspace Foil"`.

## Code Examples

### CSV Normalization with Aggregation
```typescript
export function normalizeRedditCsv(rows: any[], setCode: string) {
  const aggregated: Record<string, number> = {};

  for (const row of rows) {
    const rawNum = row['Card #']?.toString().trim();
    if (!rawNum || !setCode) continue;

    const num = rawNum.padStart(3, '0');
    const swudbId = `${setCode}-${num}`;

    const normalCount = Math.max(0, Math.max(parseInt(row['Standard'] || '0') || 0, parseInt(row['Non-Foil'] || '0') || 0));
    if (normalCount > 0) {
      const key = `${swudbId}|Normal`;
      aggregated[key] = (aggregated[key] || 0) + normalCount;
    }
    // Repeat for Foil, Hyperspace, and Hyperspace Foil...
  }

  return Object.entries(aggregated).map(([key, count]) => {
    const [swudbId, variantType] = key.split('|');
    return { swudbId, variantType, count };
  });
}
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest |
| Config file | vitest.config.mts |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-01 | normalizer outputs correctly | unit | `npm test src/lib/collection/normalize.test.ts` | ✅ Wave 0 |

### Wave 0 Gaps
- [ ] Update `src/lib/collection/normalize.test.ts` to expect the new array payload instead of the old `Record<string, number>` payload.

## Sources

### Primary (HIGH confidence)
- `src/db/schema.ts` - Verified `swudbId` is exactly `${setCode}-${paddedNumber}`.
- Database query against live DB (using temp script) - Verified variant types are exactly 'Normal', 'Foil', 'Hyperspace', and 'Hyperspace Foil'.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing Drizzle and PapaParse.
- Architecture: HIGH - Successfully tested the JOIN query logic against a local instance.
- Pitfalls: HIGH - Documented `upsertVariantCount` overwrite pitfall.

**Research date:** 2026-05-24
**Valid until:** 2026-06-24
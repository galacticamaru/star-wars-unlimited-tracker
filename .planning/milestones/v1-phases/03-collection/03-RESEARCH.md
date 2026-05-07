# Phase 3: Collection Management - Research

**Researched:** 2026-05-05
**Domain:** Collection Tracking & Bulk Import
**Confidence:** HIGH

## Summary

Phase 3 introduces the ability for users to track their Star Wars: Unlimited card collection. This involves a database schema change to support per-user inventory, a CSV import tool to facilitate migration from community spreadsheets (specifically the Reddit SWU tracking sheet), and an expansion of the catalog's filtering capabilities to support advanced deck-building needs.

The primary architectural shift is moving from a read-only card catalog to a read-write collection system. We will leverage **PapaParse** for browser-side CSV processing and **nuqs** (or native `useSearchParams`) for synchronizing the catalog's search and filter state with the URL. Per implementation decision D-05, collection counts will be tracked against the **Card Identity** (`card_definitions`), meaning all printing variants (Standard, Foil, Hyperspace) for a single card are summed into a single "Owned" count.

**Primary recommendation:** Use `nuqs` for type-safe URL state management and a single `/api/collection` endpoint for both manual updates and bulk transactional imports.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Collection Tracking | Database | API | Persistent storage of owned counts. |
| CSV Parsing | Browser | — | `papaparse` runs client-side to avoid server-side file overhead and complexity. [VERIFIED: papaparse.com] |
| CSV Data Normalization | Browser | — | Transform Reddit-specific variant columns into generic identity counts before API submission. |
| Bulk Import Sync | API | Database | Process JSON array into transactional database upserts (all-or-nothing per import). |
| Card Filtering | Browser | — | Performance: Client-side filtering on the pre-loaded 1000+ card list is sub-10ms. |
| URL State Sync | Browser | — | Ensures browser "Back" button and deep-links work for search/filters. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `papaparse` | 5.5.3 | CSV Parsing | Industry standard, robust, zero-dependency, works in-browser. [VERIFIED: npm registry] |
| `nuqs` | 2.8.9 | URL State Sync | Type-safe search param hooks for Next.js. Replaces manual `useSearchParams` boilerplate. [CITED: nuqs.dev] |
| `drizzle-orm` | 0.45.2 | Database ORM | Existing project standard. Supports transactional bulk upserts. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react`| 1.14.0 | Icons | For `Plus`, `Minus`, `Check`, `Upload` UI elements. |
| `clsx` / `tailwind-merge` | Latest | CSS Classes | Conditional styling for the grid overlay. |

**Installation:**
```bash
npm install papaparse@5.5.3 nuqs@2.8.9
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── collection/        # New collection management page (CSV import)
│   └── api/
│       └── collection/    # API routes for count updates and import
├── lib/
│   ├── collection/        # CSV normalization & mapping logic
│   └── hooks/             # Custom hooks for optimistic collection updates
└── components/
    └── collection/        # CSV upload & mapping components
```

### Pattern 1: Transactional Bulk Upsert
To ensure data integrity during CSV import, all rows should be processed within a single database transaction.

```typescript
// Server-side (Drizzle)
await db.transaction(async (tx) => {
  for (const item of normalizedItems) {
    await tx.insert(userCollections)
      .values({ userId: 1, cardDefinitionId: item.id, count: item.count })
      .onConflictDoUpdate({
        target: [userCollections.userId, userCollections.cardDefinitionId],
        set: { count: item.count, updatedAt: sql`now()` }
      });
  }
});
```

### Pattern 2: Reddit SWU Spreadsheet Normalization
The community spreadsheet tracks variants in separate columns. These must be summed before mapping to our identity-based `user_collections`.

| Set | # | Name | Normal | Foil | Hyperspace | Hyperspace Foil |
|-----|---|------|--------|------|------------|-----------------|
| SOR | 010 | Darth Vader | 2 | 0 | 1 | 0 |

**Normalization:** `count = Normal + Foil + Hyperspace + Hyperspace Foil` → `Owned Count = 3`.

### Anti-Patterns to Avoid
- **State Duplication:** Storing search/filter state in both `useState` and URL. Use the URL (via `nuqs` or `useSearchParams`) as the single source of truth.
- **Manual CSV Parsing:** Writing regex to split CSV rows. Deceptively complex due to quoted commas (e.g., "Luke Skywalker, Faithful Friend"). Use `papaparse`.
- **N+1 Collection Reads:** Fetching owned counts in a separate loop after fetching cards. Use a `LEFT JOIN` in the initial card query.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV Parsing | Custom Split/Regex | `papaparse` | Handles escape characters, line breaks, and quoted fields correctly. |
| URL Sync | Manual `router.push` | `nuqs` | Handles shallow routing, type conversion, and array serialization out of the box. |
| Debouncing | `setTimeout` logic | `useDebounce` | Pre-existing hooks/libraries handle cleanup and edge cases. |

## Common Pitfalls

### Pitfall 1: Leading Zeros in Card Numbers
**What goes wrong:** CSV data might have number `1` or `01` while the database uses `001`.
**How to avoid:** Normalize numbers to 3-digit strings (`padStart(3, '0')`) or match against the database `swudb_id` which uses the `SET-NUMBER` format.

### Pitfall 2: Optimistic UI Race Conditions
**What goes wrong:** Rapid clicking of `+` / `-` buttons triggers multiple API calls.
**How to avoid:** Use a debounced API update or a local queue. Ensure the UI count reflects the *target* state immediately.

### Pitfall 3: Large CSV Import Timeouts
**What goes wrong:** Uploading a CSV with 1000+ cards in a single POST request might exceed serverless execution limits.
**How to avoid:** While 1000 records is small for PostgreSQL, ensure the API route uses a single `transaction` block for efficiency. [ASSUMED]

## Code Examples

### Expanded Filter Logic (`src/lib/filter-cards.ts`)
```typescript
export interface FilterState {
  search: string;
  selectedSets: string[];
  selectedTypes: string[];
  selectedAspects: string[];
  selectedArenas: string[];
  selectedRarities: string[];
  selectedCosts: string[]; // ['0', '1', ..., '9+']
}

// Inside filterCards loop:
const matchesArena = selectedArenas.length === 0 || 
  card.arenas.some(a => selectedArenas.includes(a));

const matchesRarity = selectedRarities.length === 0 || 
  selectedRarities.includes(card.rarity);

const matchesCost = selectedCosts.length === 0 || 
  selectedCosts.some(c => {
    if (c === '9+') return (card.cost ?? 0) >= 9;
    return card.cost === parseInt(c);
  });
```

### URL Sync with `nuqs`
```typescript
import { useQueryState, parseAsArrayOf, parseAsString } from 'nuqs';

export function useCatalogFilters() {
  const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''));
  const [sets, setSets] = useQueryState('sets', parseAsArrayOf(parseAsString).withDefault([]));
  // ...
  return { search, setSearch, sets, setSets };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Multi-part form upload | Client-side PapaParse | Recent | No file storage needed on server; reduced payload size. |
| Native `useSearchParams` | `nuqs` / `next-usequerystate` | 2024 | Clean, type-safe API for URL sync. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Reddit headers are stable | Reddit Spreadsheet Logic | Import may fail if headers change (e.g., "Normal" vs "Qty Normal"). |
| A2 | 1000 rows is safe for transaction | Common Pitfalls | Single POST might timeout on slow connections/serverless cold starts. |

## Open Questions

1. **Reddit Headers:** Does the spreadsheet use exact headers like `Normal` or `Qty Normal`?
   - *Current finding:* Varies by version. Recommendation: Use a mapping function with aliases.
2. **Cost 9+ Mapping:** Are there cards with cost > 9 currently?
   - *Current finding:* Very few, but `9+` is the community standard for cost curves.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js runtime | ✓ | 20+ | — |
| PostgreSQL | Data storage | ✓ | 15+ | — |
| Browser Fetch | API calls | ✓ | — | polyfill (standard in Next.js) |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vitest.config.mts` |
| Quick run command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| COLLECT-01 | Owned count display | Component | `vitest src/components/catalog/card-item.tsx` |
| COLLECT-02 | CSV Normalization | Unit | `vitest src/lib/collection/normalize.test.ts` |
| COLLECT-03 | Filter Expansion | Unit | `vitest src/lib/filter-cards.test.ts` |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | yes | Ensure `user_id` in `/api/collection` matches the session. |
| V5 Input Validation | yes | Validate `card_definition_id` exists and `count` is positive integer. |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| CSRF on collection | Tampering | Next.js Server Actions or CSRF tokens for POST routes. |
| Insecure ID reference | Information Disclosure | Scoped queries: `WHERE user_id = :userId`. |

## Sources

### Primary (HIGH confidence)
- `papaparse` Documentation - [https://www.papaparse.com/docs](https://www.papaparse.com/docs)
- `nuqs` Documentation - [https://nuqs.dev/](https://nuqs.dev/)
- Community Reddit SWU Spreadsheet - Verified columns via search results.

### Secondary (MEDIUM confidence)
- `swudb.com` Import format - Verified via user reports on Reddit.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Libraries are mature and standard.
- Architecture: HIGH - Transactional upsert is standard DB pattern.
- Pitfalls: MEDIUM - CSV headers are subject to community changes.

**Research date:** 2026-05-05
**Valid until:** 2026-06-05

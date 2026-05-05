---
phase: 02-card-catalog
reviewed: 2026-05-05T02:18:48Z
depth: standard
files_reviewed: 19
files_reviewed_list:
  - next.config.ts
  - src/app/cards/[set-code]/[card-number]/page.tsx
  - src/app/page.tsx
  - src/components/catalog/card-grid.tsx
  - src/components/catalog/card-item.browser.test.tsx
  - src/components/catalog/card-item.tsx
  - src/components/catalog/catalog-client.browser.test.tsx
  - src/components/catalog/catalog-client.tsx
  - src/components/catalog/empty-state.tsx
  - src/components/catalog/filter-dropdown.tsx
  - src/components/catalog/top-bar.tsx
  - src/components/ui/badge.tsx
  - src/components/ui/dropdown-menu.tsx
  - src/components/ui/input.tsx
  - src/db/queries/card-detail.ts
  - src/db/queries/catalog.test.ts
  - src/db/queries/catalog.ts
  - src/lib/filter-cards.test.ts
  - src/lib/filter-cards.ts
findings:
  critical: 2
  warning: 5
  info: 3
  total: 10
status: issues_found
---

# Phase 2: Code Review Report

**Reviewed:** 2026-05-05T02:18:48Z
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found

## Summary

Phase 2 implements the Card Catalog — a server-rendered page that fetches all cards and filter options from Neon Postgres, then hands them to a client component for live search and multi-dimensional filtering. The architecture is sound and the code is generally clean. Two blockers were found: (1) `getAllCards` has no `ORDER BY`, so the grid order is non-deterministic across serverless cold starts, and (2) the `getFilterOptions` `types` query is inconsistent with `getAllCards` — it can expose types that have zero Normal-variant cards, producing phantom filter options that always return zero results. Five warnings and three info items follow.

---

## Critical Issues

### CR-01: `getAllCards` has no `ORDER BY` — card grid order is non-deterministic

**File:** `src/db/queries/catalog.ts:5-28`

**Issue:** `getAllCards` issues a SELECT with no `ORDER BY`. PostgreSQL does not guarantee row order without one, and Neon's serverless compute (which resumes a fresh connection on each cold start) can serve rows in any order. In practice this means the card grid reorders on every page load that hits a cold compute. The `asc` symbol is already imported (it's used in `getFilterOptions`) but not applied to this query.

**Fix:**
```ts
import { eq, and, notIlike, asc } from 'drizzle-orm';

// in getAllCards(), chain before the closing semicolon:
.where(
  and(
    notIlike(cardDefinitions.type, '%token%'),
    eq(cardPrintings.variantType, 'Normal')
  )
)
.orderBy(asc(cardPrintings.setCode), asc(cardPrintings.collectorNumber));
```

---

### CR-02: `getFilterOptions` `types` query is inconsistent — can expose phantom filter options

**File:** `src/db/queries/catalog.ts:43-47`

**Issue:** The `types` query selects distinct types from `cardDefinitions` without joining `cardPrintings`. This means a card type can appear in the Type dropdown even if every printing of that type is a non-Normal variant (Foil, Hyperspace) — because `getAllCards` filters to `variantType = 'Normal'` but the types query does not. A user selecting such a type would always get zero results. The `sets` query (lines 31-41) correctly joins both tables and applies both filters; the `types` query should do the same.

**Fix:**
```ts
const types = await db
  .selectDistinct({ type: cardDefinitions.type })
  .from(cardDefinitions)
  .innerJoin(cardPrintings, eq(cardPrintings.cardDefinitionId, cardDefinitions.id))
  .where(
    and(
      notIlike(cardDefinitions.type, '%token%'),
      eq(cardPrintings.variantType, 'Normal')
    )
  )
  .orderBy(asc(cardDefinitions.type));
```

---

## Warnings

### WR-01: `hover:ring` on `Image` is clipped by `overflow-hidden` on parent — visual feedback is broken

**File:** `src/components/catalog/card-item.tsx:29-42`

**Issue:** The card container div has `overflow-hidden` (line 29) while `hover:ring-2 hover:ring-primary hover:ring-offset-1` is applied to the inner `Image` (line 41). CSS `box-shadow`/`outline`/`ring` drawn outside an `overflow:hidden` ancestor is clipped. The hover ring will be cut off at all four card edges — the interactive affordance is visually broken.

**Fix:** Move the ring to the container div or the wrapping `Link`, not the `Image`. Remove `overflow-hidden` from the ring target or restructure so the ring is painted outside the clipping context:

```tsx
// Option A: apply ring to the container div, remove overflow-hidden from it,
// and add rounded-md overflow-hidden to the Image instead (not possible with fill).
// Option B (preferred): apply hover to the outer div and use outline instead of ring:
<div
  className={cn(
    'relative aspect-[2/3] rounded-md overflow-hidden bg-muted',
    'hover:outline hover:outline-2 hover:outline-primary hover:outline-offset-[-2px]',
    !loaded && 'animate-pulse',
  )}
>
```
`outline-offset-[-2px]` paints the outline inside the box so `overflow-hidden` does not clip it.

---

### WR-02: `rarity` column is fetched in `getAllCards` but immediately discarded in `page.tsx`

**File:** `src/db/queries/catalog.ts:15` / `src/app/page.tsx:13-21`

**Issue:** `getAllCards` selects `rarity: cardPrintings.rarity` (catalog.ts line 15), but `page.tsx` builds `plainCards` without including `rarity` (lines 13-21). The column is fetched from the database on every catalog load and then thrown away. Because `getAllCards` is the main catalog query this adds unnecessary payload on every request — especially visible at scale where a full catalog fetch can return thousands of rows.

**Fix:** Remove `rarity` from the `getAllCards` select list since it is not used by `CardForFilter` or any downstream component:

```ts
// Remove this line from getAllCards():
rarity: cardPrintings.rarity,
```

---

### WR-03: `card-detail.ts` `getCardByPrinting` hard-codes `variantType = 'Normal'` with no fallback — valid card URLs return 404

**File:** `src/db/queries/card-detail.ts:42`

**Issue:** The detail page query filters `eq(cardPrintings.variantType, 'Normal')`. If a card exists in the database only as a Foil or Hyperspace variant (i.e., was never printed as Normal), navigating to its URL — which the catalog correctly never generates, but which a user may bookmark or share from a third-party source — silently returns `notFound()`. There is no fallback to other variant types. Given that the SWU card set includes Showcase-only cards and regional variants, this is a real gap.

**Fix:** Remove the `variantType` filter and accept any printing, or implement a priority fallback (Normal > Foil > Hyperspace):

```ts
// Simplest fix: remove variantType constraint and let the UNIQUE index on
// (setCode, collectorNumber) ensure a single row is returned:
.where(
  and(
    eq(cardPrintings.setCode, setCode),
    eq(cardPrintings.collectorNumber, collectorNumber),
    // Removed: eq(cardPrintings.variantType, 'Normal')
  )
)
```

---

### WR-04: `filter-cards.ts` aspect filter uses "subset" semantics that contradict standard UX expectation

**File:** `src/lib/filter-cards.ts:34-39`

**Issue:** The aspect filter logic (`card.aspects.every(a => selectedAspects.includes(a))`) means: show a card only if ALL its aspects are within the selection. Selecting "Heroism" hides a multi-aspect card like [Heroism + Command] because Command is outside the selection. This is the opposite of "show me cards that use these aspects" — the standard filter pattern for collectible card games is OR (show cards that have at least one selected aspect), not subset containment. A user selecting [Heroism] to find Han Solo cards will miss every dual-aspect Heroism card. The test suite at `filter-cards.test.ts:55-67` encodes this behavior as intentional, but the behavior will surprise most users.

**Fix (if intentional, document it more prominently):** The comment is buried inside the function body. Elevate the decision to a JSDoc on `filterCards` or a code comment in `CatalogClient` where the filter is wired up, so that future developers do not accidentally "fix" it to OR semantics.

**Fix (if the intent was OR semantics):**
```ts
// Replace the aspect filter with OR logic:
const matchesAspect = selectedAspects.length === 0 ||
  card.aspects.some(a => selectedAspects.includes(a));
```

---

### WR-05: `CardItem` URL construction silently produces wrong link when `collectorNumber` has no dash

**File:** `src/components/catalog/card-item.tsx:18-19`

**Issue:** When `collectorNumber.indexOf('-') === -1` (no dash found), the code falls back to `cardNumber = collectorNumber` (the full collector number string). The URL becomes `/cards/${setCode}/${collectorNumber}` where `collectorNumber` is e.g. `"SOR059"` without a dash. In `getCardByPrinting`, this is reconstructed as `"SOR-SOR059"` — a collector number that will never match a real record, so the detail page returns 404 with no indication of why. There is no error or log in the fallback branch. The schema guarantees `"SET-NUM"` format, so this won't trigger in production — but a data import error could silently break all cards from that import batch.

**Fix:** Add an assertion or warning in the fallback branch:

```ts
const dashIdx = collectorNumber.indexOf('-');
if (dashIdx < 0) {
  // Data integrity error — collectorNumber must be "SET-NUM" format
  console.error(`[CardItem] Invalid collectorNumber format: "${collectorNumber}"`);
}
const cardNumber = dashIdx >= 0 ? collectorNumber.slice(dashIdx + 1) : collectorNumber;
```

---

## Info

### IN-01: All browser tests are `it.todo` stubs — zero behavioral coverage for client components

**File:** `src/components/catalog/card-item.browser.test.tsx:6-14` / `src/components/catalog/catalog-client.browser.test.tsx:6-13`

**Issue:** Both browser test files consist entirely of `it.todo()` stubs. This is documented as "Wave 0" with the rationale that full interactive testing requires a real browser. While the `filter-cards.test.ts` unit tests do cover the pure logic, the client component behavior (loading states, filter UI wiring, card link generation) has zero automated coverage. If the `CatalogClient` → `TopBar` → `FilterDropdown` prop chain breaks, no test will catch it.

**Fix:** Promote at least the deterministic cases to real tests using `@testing-library/react` + `vitest` with jsdom. Specifically: link href construction in `CardItem` and the result count display in `CatalogClient` are fully testable without a real browser.

---

### IN-02: `catalog.test.ts` all stubs — DB query behavior untested

**File:** `src/db/queries/catalog.test.ts:7-18`

**Issue:** All tests for `getAllCards` and `getFilterOptions` are `it.todo` stubs. The comment "require a live DB connection; mark as todo for CI" is reasonable, but there is no integration test suite or CI step that exercises these queries. The query bugs reported in CR-01 and CR-02 are not detectable by any automated test in this codebase.

**Fix:** Add a `vitest` integration test configuration that connects to a Neon branch (or local Postgres) and exercises the queries. Neon branching makes this low-cost for CI.

---

### IN-03: `page.tsx` builds `plainCards` with an unnecessary `?? []` guard on `aspects`

**File:** `src/app/page.tsx:17`

**Issue:** `c.aspects ?? []` — the `aspects` column is defined as `.notNull().default(sql\`'{}'::text[]\`)` in the schema, so Drizzle types it as `string[]` (non-nullable). The nullish coalescing operator is unreachable dead code that adds noise. It will not cause bugs, but it implies the developer was uncertain about nullability.

**Fix:**
```ts
aspects: c.aspects,
```

---

_Reviewed: 2026-05-05T02:18:48Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

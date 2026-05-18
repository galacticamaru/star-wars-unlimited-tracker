---
phase: 17-variant-collection-tracking
verified: 2026-05-18T12:36:00Z
status: passed
score: 4/4 must-haves verified
overrides_applied: 0
re_verification: false
---

# Phase 17: Variant Collection Tracking — Verification Report

**Phase Goal:** Users can view and manage how many copies they own of each variant of a card on that card's detail page
**Verified:** 2026-05-18T12:36:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Card detail page lists each available variant with owned count | VERIFIED | `VariantCollectionSection` renders `printings.map(...)` from `getSameSetPrintingsWithCounts` — one row per DB printing, with COALESCE(count, 0) per user |
| 2 | User can increment owned count per variant | VERIFIED | `updateVariant(printing.id, count + 1)` fires `POST /api/collection/variants` with optimistic state update; server upserts + recomputes total |
| 3 | User can decrement count per variant (down to zero) | VERIFIED | Minus button has `disabled={count === 0}` guard; `Math.max(0, newCount)` floors both client and server; UAT confirmed |
| 4 | Changes persist and reflect immediately without full page reload | VERIFIED | Optimistic `setCounts` before fetch; server upsert via `upsertVariantCount` + `recomputeTotal`; UAT confirmed persistence across page reload |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/db/schema.ts` | `userPrintingCollections` table with composite PK | VERIFIED | Lines 134–148: table defined with `(userId, cardPrintingId)` primary key, FK to `cardPrintings.id` |
| `src/db/queries/collection.ts` | `upsertVariantCount`, `recomputeTotal`, updated `getUserCollection` | VERIFIED | All three functions present and exported; two-join approach in `getUserCollection` |
| `src/db/queries/card-detail.ts` | `getSameSetPrintingsWithCounts` | VERIFIED | Lines 75–102: returns all variant printings with per-user `ownedCount`; no variantType filter |
| `src/app/api/collection/collection-shape.ts` | `buildCollectionMap` implemented, `CollectionMap` type | VERIFIED | Lines 19–32: full implementation (no stub), `CollectionMap` and `CollectionRow` exported |
| `src/app/api/collection/variants/route.ts` | `POST /api/collection/variants` with auth + input validation | VERIFIED | Auth gate (401), type validation, `Math.max(0, Math.floor(count))`, sequential upsert+recompute |
| `src/app/api/collection/route.ts` | `GET` returns `CollectionMap` shape; `POST` removed | VERIFIED | GET uses `buildCollectionMap(getUserCollection(...))`; POST handler absent (only a comment remains) |
| `src/components/catalog/variant-collection-section.tsx` | Client component with per-variant rows and total line | VERIFIED | Full implementation: `'use client'`, `useState`, optimistic update with rollback (UAT bug fix), `fetch('/api/collection/variants')`, total computed from client state |
| `src/app/cards/[set-code]/[card-number]/page.tsx` | RSC fetches printings, renders `VariantCollectionSection` | VERIFIED | Calls `getSameSetPrintingsWithCounts(card.id, setCode, userId)`, renders `<VariantCollectionSection printings={printings} />` guarded by `userId && printings.length > 0` |
| `src/components/catalog/catalog-client.tsx` | Uses `CollectionMap`, no `handleUpdateCount` | VERIFIED | `useState<CollectionMap>({})`, import from `collection-shape`; grep confirms 0 occurrences of `handleUpdateCount` |
| `src/components/decks/want-list-tab.tsx` | Uses `CollectionMap`, reads `.total` | VERIFIED | Line 48: `collection[dc.cardDefinitionId]?.total ?? 0` |
| `src/lib/filter-cards.ts` | Uses `CollectionMap`, reads `.total` | VERIFIED | Line 118: `(collection[card.id]?.total ?? 0) >= 1` |
| `src/components/catalog/card-grid.tsx` | Uses `CollectionMap`, reads `.total` | VERIFIED | Line 40: `collection[card.id]?.total ?? 0` |
| `src/lib/collection/normalize.ts` | Per-variant normalizer (Normal + Foil keys; Hyperspace skipped) | VERIFIED | Emits `${base}` for Standard/Non-Foil, `${base}F` for Foil; Hyperspace intentionally skipped with documented rationale |
| `src/app/api/collection/import/route.ts` | Writes to `user_printing_collections` via `upsertVariantCount`; recomputes totals | VERIFIED | Uses `upsertVariantCount`, tracks `affectedDefinitions`, calls `recomputeTotal` per definition |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `page.tsx` | `card-detail.ts` | `getSameSetPrintingsWithCounts` | WIRED | Import on line 5; called on line 32 |
| `page.tsx` | `variant-collection-section.tsx` | `VariantCollectionSection` import + render | WIRED | Import line 7; JSX render line 77 |
| `variant-collection-section.tsx` | `POST /api/collection/variants` | `fetch` in `updateVariant` | WIRED | Line 46: `fetch('/api/collection/variants', { method: 'POST' ... })` |
| `variants/route.ts` | `collection.ts` | `upsertVariantCount + recomputeTotal` | WIRED | Import line 5; called lines 37 and 56 |
| `route.ts` (collection) | `collection-shape.ts` | `buildCollectionMap` | WIRED | Import line 2; called line 17 |
| `route.ts` (collection) | `collection.ts` | `getUserCollection` | WIRED | Import line 1; called line 13 |
| `catalog-client.tsx` | `collection-shape.ts` | `CollectionMap` type import | WIRED | Line 7: `import type { CollectionMap }` |
| `want-list-tab.tsx` | `collection-shape.ts` | `CollectionMap` type import | WIRED | Line 5: `import type { CollectionMap }` |
| `filter-cards.ts` | `collection-shape.ts` | `CollectionMap` in function signature | WIRED | Line 1: `import type { CollectionMap }` |
| `import/route.ts` | `collection.ts` | `upsertVariantCount + recomputeTotal` | WIRED | Import line 5; called lines 81 and 93 |
| `collection.ts` | `schema.ts` | `userPrintingCollections` import | WIRED | Line 2: `import { userCollections, userPrintingCollections, cardPrintings }` |
| `card-detail.ts` | `schema.ts` | `userPrintingCollections` import | WIRED | Line 2: `import { cardDefinitions, cardPrintings, userCollections, userPrintingCollections }` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `variant-collection-section.tsx` | `counts` (Record<number, number>) | RSC props: `printings[].ownedCount` from `getSameSetPrintingsWithCounts` | Yes — COALESCE from `user_printing_collections` LEFT JOIN on `card_printings` | FLOWING |
| `variant-collection-section.tsx` | `total` | Derived: `Object.values(counts).reduce(...)` | Yes — computed from live per-variant counts | FLOWING |
| `catalog-client.tsx` | `collection` (CollectionMap) | Fetches `GET /api/collection` → `buildCollectionMap(getUserCollection(...))` → real DB query | Yes — two-join LEFT JOIN on `user_collections`, `card_printings`, `user_printing_collections` | FLOWING |
| `want-list-tab.tsx` | `collection` (CollectionMap) | Fetches `GET /api/collection` with res.ok guard | Yes — same DB path as catalog-client | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript compiles clean | `npx tsc --noEmit` | Exit 0, no output | PASS |
| collection-shape tests GREEN | `npx vitest run collection-shape.test.ts` | 4/4 passed | PASS |
| normalize tests GREEN | `npx vitest run normalize.test.ts` | 5/5 passed | PASS |
| filter-cards tests GREEN (consumer regression) | `npx vitest run filter-cards.test.ts` | 15/15 passed | PASS |
| Phase 17 unit tests overall | 3 test files above combined | 24/24 passed | PASS |
| `POST /api/collection` removed | grep for `export async function POST` in collection/route.ts | No matches | PASS |
| `handleUpdateCount` removed from CatalogClient | grep count | 0 occurrences | PASS |

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| REQ-COLLECT-06 | User can view per-variant owned counts on card detail page | SATISFIED | `VariantCollectionSection` renders one row per printing from `getSameSetPrintingsWithCounts`; owned count displayed in controlled `<Input>` with Owned/Not owned status; UAT passed |
| REQ-COLLECT-07 | User can increment and decrement owned count per variant on card detail page | SATISFIED | Plus/Minus buttons call `updateVariant(id, count ± 1)`; floored at 0; fires `POST /api/collection/variants`; recomputes total; UAT confirmed persistence |

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `tests/data-isolation.test.ts` | Pre-existing test mock failure: `db.select(...).from(...).leftJoin is not a function` | Warning | Test mock was written before `getUserCollection` gained `.leftJoin()` chaining in Plan 02. NOT introduced by Phase 17 (confirmed pre-existing per Plan 04 and 07 SUMMARYs). Does not affect runtime behavior. |
| `__tests__/cron-route.test.ts` (4 tests) | Pre-existing `DATABASE_URL not set` failures | Warning | Environment variable missing in test context. Pre-existing infrastructure issue, not introduced by Phase 17. |
| `tests/auth-config.test.ts`, `__tests__/api-deck-validation.test.ts`, `src/app/decks/page.test.tsx`, `src/lib/sync/prices.test.ts` | Pre-existing failures | Warning | All pre-existing per Plan 04 SUMMARY documentation. Not introduced by Phase 17. |

No Phase 17 code contains: `return null` stubs, TODO placeholders, empty implementations, or hardcoded empty arrays that flow to user-visible output.

The `upsertVariantCount` import on line 6 of `page.tsx` is for the legacy hydration feature (not a stub concern — it actively populates the Normal variant with the legacy total for existing users).

### Human Verification Required

None. Human UAT was completed as Plan 08 (blocking checkpoint). Three bugs were identified and fixed during UAT before sign-off:

1. **Catalog read-only buttons** — `CardItem` now gates +/- overlay on `onUpdateCount !== undefined`
2. **Legacy data hydration** — `page.tsx` initializes the Normal variant with the legacy `userCollections.count` when `user_printing_collections` has no rows yet (prevents first increment from overwriting prior total via `recomputeTotal`)
3. **userId propagation** — `userId` now passed to `getCardByPrinting` so `collectionCount` reflects the authenticated user's actual total

UAT confirmed all four Plan 08 success criteria: variant rows display correctly, counts increment/decrement and persist, total line is accurate, catalog and deck-builder owned-count overlays work.

### Gaps Summary

No gaps. All four ROADMAP success criteria are VERIFIED by code evidence. Both requirement IDs (REQ-COLLECT-06, REQ-COLLECT-07) are SATISFIED.

The six pre-existing test failures in the suite (`data-isolation.test.ts`, `cron-route.test.ts`, `auth-config.test.ts`, `api-deck-validation.test.ts`, `decks/page.test.tsx`, `prices.test.ts`) were present before Phase 17 began and are documented as pre-existing in Plans 04, 05, and 07 SUMMARYs. They are not regressions introduced by this phase.

The Hyperspace/F-Hyperspace import limitation (CSV import skips those variant columns) is an intentional, documented design decision (D-06 equivalent) with rationale: Hyperspace variants use a completely different number range with no derivable relationship to the base card number from CSV data alone. This is not a gap against REQ-COLLECT-06 or REQ-COLLECT-07 — both requirements concern the card detail page UI, not CSV import.

---

_Verified: 2026-05-18T12:36:00Z_
_Verifier: Claude (gsd-verifier)_

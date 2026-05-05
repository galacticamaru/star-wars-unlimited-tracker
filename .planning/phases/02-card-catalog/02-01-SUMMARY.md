---
phase: 02-card-catalog
plan: 01
subsystem: database
tags: [drizzle-orm, next-image, vitest, tdd, filter]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: card_definitions + card_printings schema, Drizzle client, neon-http driver
provides:
  - next.config.ts remotePatterns whitelist for cdn.swu-db.com
  - getAllCards() Drizzle query — non-token Normal-variant cards with id/name/type/aspects/setCode/collectorNumber/frontArtUrl/rarity
  - getFilterOptions() Drizzle query — distinct sorted sets and types
  - getCardByPrinting() single-card lookup by setCode + collectorNumber
  - filterCards() pure function — AND-across-categories, OR-within-aspects filter
  - FilterState and CardForFilter TypeScript interfaces
  - Wave 0 test stubs for getAllCards (catalog.test.ts)
  - Full unit test suite for filterCards (filter-cards.test.ts, 7 passing)
affects:
  - 02-02 (CatalogClient imports filterCards and CardForFilter)
  - 02-03 (card detail page uses getCardByPrinting)
  - any future phase adding collection overlay (LEFT JOIN on same getAllCards base query)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - notIlike (lowercase 'i') — correct drizzle-orm 0.45.2 export for case-insensitive token exclusion
    - TDD RED/GREEN for pure functions — test created before implementation, confirmed failing before writing code
    - Wave 0 it.todo stubs — DB-dependent tests stubbed with it.todo to satisfy CI without live DATABASE_URL
    - remotePatterns (not deprecated domains) + explicit qualities: [75] for Next.js 16 image security

key-files:
  created:
    - src/db/queries/catalog.ts
    - src/db/queries/card-detail.ts
    - src/lib/filter-cards.ts
    - src/lib/filter-cards.test.ts
    - src/db/queries/catalog.test.ts
  modified:
    - next.config.ts

key-decisions:
  - "notIlike (lowercase 'i') is the correct drizzle-orm 0.45.2 export — notILike does not exist; plan had wrong casing"
  - "Wave 0 catalog.test.ts uses it.todo stubs — live DB unavailable in CI without DATABASE_URL, manual smoke test in Wave 3"
  - "filterCards aspects filter uses .some() not .every() — OR within category per D-05 and Pitfall 6"

patterns-established:
  - "Pattern: notIlike (drizzle-orm) for token exclusion in all catalog queries"
  - "Pattern: Normal variantType anchor — eq(cardPrintings.variantType, 'Normal') prevents Foil/Hyperspace duplicates"
  - "Pattern: TDD for pure utility functions — write test first, confirm RED, then implement"

requirements-completed:
  - CATALOG-01
  - CATALOG-02
  - CATALOG-03

# Metrics
duration: 18min
completed: 2026-05-05
---

# Phase 2 Plan 01: Infrastructure Foundation Summary

**Drizzle query layer + remotePatterns image security + filterCards pure function with full TDD test coverage (7 passing)**

## Performance

- **Duration:** 18 min
- **Started:** 2026-05-05T11:10:00Z
- **Completed:** 2026-05-05T11:28:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- next.config.ts updated with remotePatterns whitelist for cdn.swu-db.com and qualities allowlist (ASVS T-2-01, T-2-04 mitigations)
- getAllCards() and getFilterOptions() Drizzle queries with notIlike token filter and Normal-variant anchor
- getCardByPrinting() single-card lookup excluding createdAt/updatedAt (serialization safety across Server/Client boundary)
- filterCards() pure function with full TDD — 7 tests green covering empty filter, case-insensitive search, set/type/aspect filtering, OR-within-aspect, AND-across-categories
- Wave 0 catalog.test.ts stubs (it.todo) satisfying CI without live DB

## Task Commits

Each task was committed atomically:

1. **Task 1: next.config.ts + catalog.ts + card-detail.ts** - `218b456` (feat)
2. **Task 2: filter-cards.ts (pure function) + Wave 0 test stubs** - `cea5cba` (feat, TDD)

## Files Created/Modified
- `next.config.ts` - remotePatterns whitelist for cdn.swu-db.com, qualities: [75]
- `src/db/queries/catalog.ts` - getAllCards() + getFilterOptions() with notIlike token filter
- `src/db/queries/card-detail.ts` - getCardByPrinting() single-card lookup, no timestamp fields
- `src/lib/filter-cards.ts` - filterCards() pure function + FilterState + CardForFilter interfaces
- `src/lib/filter-cards.test.ts` - 7 unit tests (TDD), all passing
- `src/db/queries/catalog.test.ts` - Wave 0 it.todo stubs for getAllCards + getFilterOptions

## Decisions Made
- notIlike (lowercase 'i') is the correct drizzle-orm 0.45.2 export; plan specified notILike (uppercase 'L') which does not exist — fixed inline (Rule 1)
- Wave 0 catalog.test.ts uses it.todo stubs: DB query tests require Neon connection unavailable without DATABASE_URL; stubs satisfy Wave 0 requirement without breaking CI
- filterCards uses aspects.some() not aspects.every() — OR within category (D-05 + Pitfall 6)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed wrong drizzle-orm export name notILike -> notIlike**
- **Found during:** Task 1 (catalog.ts compilation)
- **Issue:** Plan specified `notILike` (capital L) but drizzle-orm 0.45.2 exports `notIlike` (lowercase i). TypeScript build error confirmed.
- **Fix:** Changed import and all usages from `notILike` to `notIlike` in catalog.ts
- **Files modified:** src/db/queries/catalog.ts
- **Verification:** `npm run build` TypeScript check passes (Compiled successfully + Finished TypeScript)
- **Committed in:** 218b456 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Necessary correctness fix, no scope change.

## Issues Encountered
- Pre-existing build error: `vitest.config.mts` uses `environmentMatchGlobs` which TypeScript reports as unknown in the InlineConfig type (present on main branch before this plan). This causes `npm run build` to fail at the "Collecting page data" step but TypeScript compilation itself passes (Compiled successfully + Finished TypeScript). Logged as pre-existing, out of scope.
- Pre-existing build error: DATABASE_URL not set causes runtime error at Next.js page data collection step. Pre-existing, out of scope.

## User Setup Required
None - no external service configuration required for this plan.

## Next Phase Readiness
- Wave 2 (02-02): CatalogClient can import filterCards and CardForFilter from src/lib/filter-cards.ts; getAllCards and getFilterOptions from src/db/queries/catalog.ts
- Wave 3 (02-03): CardDetailPage can import getCardByPrinting from src/db/queries/card-detail.ts
- All exported interfaces are stable contracts for Wave 2 component implementation

## Known Stubs
- `src/db/queries/catalog.test.ts` — all tests are it.todo (Wave 0 requirement met; full integration tests deferred to manual smoke test in Wave 3 checkpoint)

## Threat Flags

No new threat surface introduced beyond what is documented in the plan's threat_model.

## Self-Check: PASSED

---
*Phase: 02-card-catalog*
*Completed: 2026-05-05*

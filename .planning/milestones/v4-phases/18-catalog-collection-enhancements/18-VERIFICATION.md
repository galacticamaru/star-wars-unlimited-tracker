---
phase: 18-catalog-collection-enhancements
verified: 2026-05-20T12:00:00Z
status: human_needed
score: 8/8 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Open catalog as an authenticated user who owns Hyperspace copies of a card. Verify the card tile shows Hyperspace art instead of Normal art."
    expected: "The tile image changes to the Hyperspace frontArtUrl for that card."
    why_human: "Data-flow from DB (getPrintingArtMap + CollectionMap.variants) through selectBestVariantArtUrl to CardItem display cannot be confirmed to produce a visible image swap without a live session and real collection data."
  - test: "Open the Collection page, select a starter deck (e.g. 'Luke Skywalker (SOR)'), click 'Add to Collection', and observe the result."
    expected: "Success banner: 'Added {N} cards from Luke Skywalker (SOR) to your collection.' N > 0. Running it a second time doubles card counts (additive)."
    why_human: "Requires authenticated session and live Neon DB. The POST /api/collection/starter-deck path involves sequential DB increments that cannot be verified without executing against the real database."
  - test: "Log out, open the catalog, and confirm all card tiles display Normal/Standard art."
    expected: "Every tile shows the default frontArtUrl from getAllCards — no variant override applied."
    why_human: "Logout state behaviour (CatalogClient sets collection={} and passes null printingArtMap to CardGrid which falls back to null bestVariantArtUrl) needs visual confirmation."
---

# Phase 18: Catalog Collection Enhancements — Verification Report

**Phase Goal:** The catalog surface reflects variant ownership in its art display, and users can seed their collection from a known starter deck in one click
**Verified:** 2026-05-20T12:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A catalog card tile displays the art of whichever variant the user owns the most copies of | VERIFIED | `selectBestVariantArtUrl` in `src/lib/catalog/select-best-variant.ts` iterates `CollectionMap.variants`, picks highest count with precedence tie-break, returns `frontArtUrl`; `CardItem` uses `bestVariantArtUrl ?? normalDisplayUrl` |
| 2 | Tie-breaking precedence (Showcase > Hyperspace Foil > Hyperspace > Foil > Normal) is respected | VERIFIED | `VARIANT_PRECEDENCE` constant defined and applied in `selectBestVariantArtUrl`; 15-test suite in `tests/catalog-variant.test.ts` covers all tie-break cases |
| 3 | Logged-out users see Normal art by default | VERIFIED | `CatalogClient` sets `collection={}` when unauthenticated; `CardGrid` passes `null` for `bestVariantArtUrl` when `!cardVariants || !printingArtMap`; `CardItem` falls through to `normalDisplayUrl` |
| 4 | User can trigger a single action to add all cards from a starter deck | VERIFIED | `POST /api/collection/starter-deck` route exists and is fully implemented; Collection page exposes `<select>` + "Add to Collection" button wired to `handleQuickAdd` |
| 5 | After quick-add, the user receives confirmation of how many cards were added | VERIFIED | `handleQuickAdd` reads `data.cardsAdded` from API response; renders "Added {N} cards from {deckName} to your collection." on `deckStatus === 'success'` |
| 6 | Quantities are incremented on top of existing counts, not overwritten | VERIFIED | `incrementVariantCount` uses `sql\`${userPrintingCollections.count} + ${qtyToAdd}\`` on conflict instead of overwrite; documented as explicit decision to avoid Pitfall 1 |
| 7 | StarterDeck interface includes deckType field distinguishing starter/spotlight/twin-suns | VERIFIED | Interface updated in `src/data/starter-decks.ts` line 10: `deckType: 'starter' \| 'spotlight' \| 'twin-suns'` |
| 8 | 11 deck entries present (6 starter + 5 spotlight) with correct deckType assignments; deferred decks documented | VERIFIED | File contains 6 entries with `deckType: 'starter'` (sor-luke, sor-vader, shd-mando, shd-gideon, twi-ahsoka, twi-grievous) and 5 with `deckType: 'spotlight'` (jtl-boba-fett, jtl-han-solo, lof-darth-maul, lof-qui-gon-jinn, sec-palpatine); deferred comment block present at line 420 |

**Score:** 8/8 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/data/starter-decks.ts` | Starter deck definitions with deckType | VERIFIED | 429-line file; StarterDeck interface + 11 deck entries + deferred comment block |
| `src/db/queries/collection.ts` | incrementVariantCount query | VERIFIED | Lines 65-81; uses `sql\`count + qtyToAdd\`` on conflict; substantive implementation |
| `src/app/api/collection/starter-deck/route.ts` | POST endpoint for quick-add | VERIFIED | 78-line file; auth check, deckId validation against static list, Normal variant lookup, increment loop, recomputeTotal, returns `{cardsAdded}` |
| `src/db/queries/catalog.ts` | getPrintingArtMap query | VERIFIED | Lines 94-107; selects all card_printings (id, variantType, frontArtUrl), reduces to Record |
| `src/lib/catalog/select-best-variant.ts` | Pure precedence selection function | VERIFIED | 57-line file; VARIANT_PRECEDENCE map + selectBestVariantArtUrl function; no stubs |
| `tests/catalog-variant.test.ts` | Unit tests for precedence logic | VERIFIED | 111-line file; 15 test cases covering all precedence scenarios, null art, unknown types, string-key pitfall |
| `tests/starter-deck-api.test.ts` | Starter deck API tests | VERIFIED | 94-line file; 7 test cases covering POST export, incrementVariantCount, data shape, deck fields, 6 original IDs, deckType |
| `src/components/catalog/card-grid.tsx` | Best variant art selection logic | VERIFIED | Calls `selectBestVariantArtUrl(cardVariants, printingArtMap)` per card; passes `bestVariantArtUrl` to `CardItem` |
| `src/components/catalog/card-item.tsx` | Optional bestVariantArtUrl prop | VERIFIED | Line 62-63: `const displayUrl = bestVariantArtUrl ?? normalDisplayUrl`; comment references REQ-COLLECT-08 |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/cards/page.tsx` | `src/components/catalog/catalog-client.tsx` | `printingArtMap` prop | WIRED | RSC awaits `getPrintingArtMap()` in parallel (line 13-17); passes `printingArtMap={printingArtMap}` to CatalogClient (line 54) |
| `src/components/catalog/catalog-client.tsx` | `src/components/catalog/card-grid.tsx` | `printingArtMap` prop | WIRED | CatalogClient accepts `printingArtMap?: PrintingArtMap` (line 24); passes `printingArtMap={printingArtMap}` to CardGrid (line 228) |
| `src/components/catalog/card-grid.tsx` | `src/lib/catalog/select-best-variant.ts` | `selectBestVariantArtUrl()` call | WIRED | Imports function (line 4); calls per-card on lines 39-42 |
| `src/app/collection/page.tsx` | `/api/collection/starter-deck` | POST request | WIRED | `handleQuickAdd` (lines 80-103) fetches `POST /api/collection/starter-deck` with `{deckId}`; reads `data.cardsAdded`; calls `router.refresh()` |
| `src/app/api/collection/starter-deck/route.ts` | `src/db/queries/collection.ts` | `incrementVariantCount` + `recomputeTotal` | WIRED | Imports both functions (line 8); calls `incrementVariantCount` per card (line 63); calls `recomputeTotal` per distinct cardDefinitionId (line 70) |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `src/components/catalog/card-item.tsx` | `displayUrl` | `bestVariantArtUrl` from CardGrid → `selectBestVariantArtUrl` → `printingArtMap` from `getPrintingArtMap()` DB query | Yes — `getPrintingArtMap()` selects real rows from `card_printings`; `CollectionMap.variants` populated from `getUserCollection` DB query | FLOWING |
| `src/app/api/collection/starter-deck/route.ts` | `cardsAdded` | `printings` from DB query on `card_printings`; `incrementVariantCount` writes to `user_printing_collections` | Yes — Drizzle ORM query against real `card_printings` table; `inArray(collectorNumbers)` + `eq(variantType, 'Normal')` | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — live Neon DB required; all checks depend on real data that cannot be tested without a running server and authenticated session. No static entry points expose this functionality.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| REQ-CAT-04 | 18-01-PLAN.md, 18-03-PLAN.md | User can add all cards from a known pre-constructed starter deck to their collection in one action | SATISFIED | `POST /api/collection/starter-deck` implemented; Collection page UI wired; 11 deck definitions (6 starter + 5 spotlight) in `starter-decks.ts` |
| REQ-COLLECT-08 | 18-02-PLAN.md | Catalog card grid displays art for the variant the user owns the most copies of (falls back to Standard art if none owned) | SATISFIED | Full RSC-to-client pipeline: `getPrintingArtMap` → `CatalogClient` → `CardGrid` → `selectBestVariantArtUrl` → `CardItem.bestVariantArtUrl`; fallback to `normalDisplayUrl` when `bestVariantArtUrl` is null |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | — | — | No stubs, no TODO markers, no empty implementations, no hardcoded empty returns in any Phase 18 file |

Checked files: `src/data/starter-decks.ts`, `src/db/queries/collection.ts`, `src/app/api/collection/starter-deck/route.ts`, `src/db/queries/catalog.ts`, `src/lib/catalog/select-best-variant.ts`, `src/components/catalog/card-grid.tsx`, `src/components/catalog/card-item.tsx`, `src/app/collection/page.tsx`, `src/app/cards/page.tsx`, `src/components/catalog/catalog-client.tsx`.

---

### Human Verification Required

#### 1. Catalog Variant Art — Visual Display

**Test:** Log in as a user who owns Hyperspace or Showcase copies of at least one card. Open `/cards` catalog. Find that card's tile.
**Expected:** The tile image shows the Hyperspace/Showcase art instead of the Normal/Standard art. The owned-count badge (top-right) shows the total owned count.
**Why human:** The art URL displayed depends on live `CollectionMap.variants` data from `/api/collection` and `printingArtMap` passed from the RSC. The swap from Normal to variant art requires a real session, real DB data, and visual inspection — grep cannot confirm image rendering.

#### 2. Starter Deck Quick-Add — End-to-End

**Test:** Log in, go to `/collection`, select "Luke Skywalker (SOR)" from the "Select Starter Deck" dropdown, click "Add to Collection", observe the response, then click again.
**Expected:** First click: success banner "Added {N} cards from Luke Skywalker (SOR) to your collection." with N > 0. Second click: same banner with same N, and owned counts on the catalog grid are doubled (verifying additive increment, not overwrite).
**Why human:** Requires authenticated session + live Neon DB writes. The additive-increment guarantee relies on `sql\`count + qtyToAdd\`` behavior in production, which cannot be tested without real DB execution.

#### 3. Logged-Out Users See Normal Art

**Test:** Log out of the application. Open `/cards` catalog. Observe card tile images.
**Expected:** All tiles show default Normal art (no Hyperspace/Showcase art visible). No errors in browser console related to missing `printingArtMap` or `collection`.
**Why human:** Requires browser rendering of the actual page with an unauthenticated session. The code path (`collection={}` → `selectBestVariantArtUrl` receives `undefined` cardVariants → returns null → falls back to `normalDisplayUrl`) is code-verified but visual confirmation eliminates any rendering edge cases.

---

### Gaps Summary

No gaps found. All 8 must-have truths verified at all four levels (exists, substantive, wired, data flowing). The three human verification items above are standard UI/functional checks that cannot be performed programmatically — they do not indicate missing implementation.

---

_Verified: 2026-05-20T12:00:00Z_
_Verifier: Claude (gsd-verifier)_

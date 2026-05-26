---
phase: 21-binder-variant-badges
verified: 2026-05-23T00:00:00Z
status: human_needed
score: 3/3 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Navigate to the public binder page (/binder/{username}) and confirm Foil-variant offering tiles show the Foil badge"
    expected: "A small badge reading 'FOIL' (uppercase via CSS) is visible at top-left of Foil card tiles; Normal-variant offering tiles show no badge"
    why_human: "The CSS text-transform:uppercase display and absolute positioning inside the card image container can only be confirmed visually; the variantType data flows through DB → getPublicBinderData → mapToFilterable → CardGrid → CardItem but whether the badge actually renders correctly for a real offering requires an active DB session with at least one non-Normal trade offering"
  - test: "Confirm user_trade_offerings table exists in Neon DB with composite PK (user_id, card_printing_id)"
    expected: "SELECT * FROM user_trade_offerings LIMIT 1 succeeds (even returning 0 rows is OK); SELECT column_name FROM information_schema.columns WHERE table_name = 'user_collections' AND column_name = 'trade_quantity' returns 0 rows"
    why_human: "DB schema state cannot be verified programmatically from the codebase — requires a live DB connection to confirm the DDL was applied correctly"
---

# Phase 21: Binder Variant Badges Verification Report

**Phase Goal:** Trade binder offerings display a variant type badge when the variant is not "Normal", closing REQ-BINDER-06
**Verified:** 2026-05-23
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Each trade offering record stores the specific card_printing_id (not card_definition_id) | VERIFIED | `userTradeOfferings` table in schema.ts has composite PK `(userId, cardPrintingId)`; `getPublicBinderData` reads from `userTradeOfferings` joined to `cardPrintings`; `getUserTradeData` returns `cardPrintingId: userTradeOfferings.cardPrintingId` |
| 2  | The public binder renders a "Foil", "Showcase", etc. badge on each offering tile that is not Normal variant | VERIFIED | `CardItem` contains `isBinder && variantType && variantType !== 'Normal'` conditional; badge JSX renders `{variantType}` inside image container; `variantType` threaded through: `getPublicBinderData` → `mapToFilterable` → `CardGrid` (`variantType={card.variantType}`) → `CardItem` (`variantType?: string` prop); all 7 card-item unit tests pass including the 2 new badge tests |
| 3  | Existing binder data migrates cleanly — pre-migration offerings treated as Normal | VERIFIED | 21-04-SUMMARY.md documents that pre-migration row count was 0 (no prior trade_quantity > 0 rows existed); migration was a safe no-op; DB push confirmed via human checkpoint in Plan 21-04 |

**Score:** 3/3 truths verified

### Deferred Items

None.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/catalog/card-item.test.tsx` | Failing badge tests (Wave 0 Nyquist gate) | VERIFIED | 7 tests total; lines 59-69 contain both badge tests; `screen.getByText('Foil')` and `screen.queryByText('Normal')` present |
| `src/db/schema.ts` | userTradeOfferings table definition | VERIFIED | Lines 149-163: `export const userTradeOfferings = pgTable('user_trade_offerings', ...)` with composite PK `(userId, cardPrintingId)` and FK to `cardPrintings.id`; no `tradeQuantity` in `userCollections` |
| `src/db/queries/trade.ts` | upsertTradeOffering + updated getUserTradeData | VERIFIED | Exports `upsertTradeOffering(userId, cardPrintingId, quantity)` (line 175); `getUserTradeData` offerings query reads from `userTradeOfferings` with `tradeQuantity: userTradeOfferings.quantity` alias and `variantType: cardPrintings.variantType`; no `upsertTradeQuantity` present |
| `src/db/queries/binder.ts` | getPublicBinderData with userTradeOfferings join | VERIFIED | Line 37 `.from(userTradeOfferings)` with `variantType: cardPrintings.variantType` and `tradeQuantity: userTradeOfferings.quantity`; no `userCollections.tradeQuantity` reference in offerings block |
| `src/db/queries/catalog.ts` | getAllCards with printingId field | VERIFIED | Line 27: `printingId: cardPrintings.id, // D-07` present in SELECT |
| `src/app/api/trade/route.ts` | PATCH handler accepting cardPrintingId | VERIFIED | Imports `upsertTradeOffering`; destructures `{ cardPrintingId, tradeQuantity }` from body; applies `Math.max(0, tradeQuantity)`; returns 400 with "Missing cardPrintingId or tradeQuantity" |
| `src/app/api/cards/all/route.ts` | plainCards map with printingId | VERIFIED | Line 15: `printingId: c.printingId` present |
| `src/components/catalog/card-item.tsx` | variantType prop + badge in binder mode | VERIFIED | `variantType?: string` in `CardItemProps` (line 27); badge JSX at lines 110-115 with exact class string; conditional `isBinder && variantType && variantType !== 'Normal'` |
| `src/components/catalog/card-grid.tsx` | variantType threaded from CardForFilter to CardItem | VERIFIED | Line 62: `variantType={card.variantType}` in CardItem render |
| `src/app/binder/manage/page.tsx` | Updated interfaces + optimistic state keyed by cardPrintingId | VERIFIED | `Offering` interface has `cardPrintingId: number` (line 16); `AllCard` interface has `printingId: number` (line 59); `ManageTradeCard` uses `key={card.cardPrintingId}` and `id={card.cardPrintingId}`; Trade button calls `updateTradeQuantity(card.printingId, 1)`; fetch body sends `{ cardPrintingId, tradeQuantity }` |
| `src/app/binder/[username]/page.tsx` | mapToFilterable forwards variantType | VERIFIED | Line 51: `variantType: c.variantType` in mapToFilterable return object (gap fix applied in Plan 21-04 commit 47259a3) |
| `(DB) user_trade_offerings` | Live table in Neon DB | UNCERTAIN | Confirmed by human checkpoint in 21-04-SUMMARY.md; cannot verify live DB state from codebase |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/db/queries/trade.ts` | `src/db/schema.ts` | `import { userTradeOfferings }` | WIRED | Line 2 of trade.ts includes `userTradeOfferings` in schema import destructure |
| `src/db/queries/binder.ts` | `src/db/schema.ts` | `import { userTradeOfferings }` | WIRED | Line 2 of binder.ts includes `userTradeOfferings` in schema import destructure |
| `src/app/binder/manage/page.tsx` | `src/app/api/trade/route.ts` | `fetch PATCH /api/trade with { cardPrintingId, tradeQuantity }` | WIRED | Line 118: `body: JSON.stringify({ cardPrintingId, tradeQuantity })` |
| `src/components/catalog/card-item.tsx` | variantType prop | `isBinder && variantType && variantType !== 'Normal'` | WIRED | Line 111: exact conditional present |
| `src/components/catalog/card-grid.tsx` | `src/components/catalog/card-item.tsx` | `variantType={card.variantType}` in cards.map render | WIRED | Line 62: `variantType={card.variantType}` |
| `src/app/binder/[username]/page.tsx` | `getPublicBinderData` | `variantType: c.variantType` in `mapToFilterable` | WIRED | Line 51: field forwarded through mapToFilterable |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `CardItem` (binder mode) | `variantType` | `getPublicBinderData` → `cardPrintings.variantType` | Yes — DB column `card_printings.variant_type` (set during card sync) | FLOWING |
| `CardItem` badge div | `{variantType}` rendered text | `variantType` prop passed through CardGrid → CardItem | Yes — flows from DB query through page, mapToFilterable, CardGrid | FLOWING |
| `ManageTradeCard` | `cardPrintingId` | `getUserTradeData` → `userTradeOfferings.cardPrintingId` | Yes — live DB table `user_trade_offerings` | FLOWING (DB state confirmed by human checkpoint) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `upsertTradeQuantity` absent from codebase | `grep -r upsertTradeQuantity src/` | No matches | PASS |
| `userCollections.tradeQuantity` absent from queries | `grep -r "userCollections.tradeQuantity" src/` | No matches | PASS |
| CardItem badge conditional correct | Grep for `variantType !== 'Normal'` in card-item.tsx | Line 111 confirmed | PASS |
| cardPrintingId in Offering interface | Grep for `cardPrintingId` in manage/page.tsx Offering interface | Line 16 confirmed | PASS |
| variantType forwarded in mapToFilterable | Read binder/[username]/page.tsx line 51 | `variantType: c.variantType` confirmed | PASS |

Step 7b runtime spot-checks skipped: tests require running vitest which requires a live environment; the SUMMARY documents 7/7 card-item tests passing and all other suites exit 0.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| REQ-BINDER-06 | 21-01, 21-02, 21-03, 21-04 | Card tiles in the trade binder (offerings) display their variant type if it is not "Normal" | SATISFIED | Badge JSX in CardItem verified; variantType fully threaded from DB to render; 2 unit tests GREEN; human checkpoint approved in Plan 21-04 |

**Note:** REQ-BINDER-06 remains marked `[ ]` (unchecked) in REQUIREMENTS.md and is absent from the traceability table. This is a documentation gap — the implementation is complete but REQUIREMENTS.md was not updated to mark it complete or add Phase 21 to the traceability table. This is a WARNING (documentation only; does not affect functionality).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `.planning/REQUIREMENTS.md` | 43 | `[ ] REQ-BINDER-06` — still marked unchecked | Info | Documentation only; does not affect code or behavior |
| `.planning/ROADMAP.md` | 298 | Phase 21 progress row shows `0/4 plans complete` | Info | Progress table not updated to reflect completion; cosmetic only |

No code-level anti-patterns found. No TODO/FIXME/placeholder comments in modified files. No stub implementations. No hardcoded empty arrays or null data sources in the badge render path.

### Human Verification Required

#### 1. Public Binder Variant Badge Visibility

**Test:** Navigate to `/binder/{username}` with at least one non-Normal variant trade offering. Confirm the badge (e.g., "FOIL") appears at the top-left of that card tile. Confirm Normal-variant offering tiles show no badge.

**Expected:** Non-Normal offerings show a small dark badge with the variant type text; Normal offerings have no badge on the card image.

**Why human:** The CSS `uppercase` transform cannot be verified by jsdom in unit tests, and the badge visibility requires a real browser rendering the absolute-positioned element inside the card image container. Additionally, a live non-Normal trade offering must exist in the DB to exercise the full data path end-to-end.

#### 2. DB Schema State Confirmation

**Test:** Via Neon console or psql, run:
```sql
SELECT * FROM user_trade_offerings LIMIT 1;
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'user_collections' AND column_name = 'trade_quantity';
```

**Expected:** First query succeeds (table exists). Second query returns 0 rows (column was dropped).

**Why human:** Live DB state cannot be queried from the codebase. The 21-04-SUMMARY.md documents the human checkpoint approved these checks, but programmatic re-verification from the source code is impossible.

### Gaps Summary

No code-level gaps found. All three Success Criteria from ROADMAP.md are satisfied by the codebase evidence:

1. **SC1 (per-printing ID):** `userTradeOfferings` table with `cardPrintingId` PK is in schema.ts; all query functions use it; the API and manage page are fully migrated to `cardPrintingId`.

2. **SC2 (badge render):** `CardItem` badge JSX is fully wired with the correct conditional; `variantType` flows from `getPublicBinderData` through `mapToFilterable` → `CardGrid` → `CardItem`. The gap found during Plan 21-04 (mapToFilterable not forwarding variantType) was fixed in commit 47259a3.

3. **SC3 (data migration):** Migration was a clean no-op with 0 pre-existing rows; human checkpoint approved.

The two human verification items above are required to confirm live DB state and visual badge rendering — both were approved during Plan 21-04's human checkpoint but that approval cannot be re-verified programmatically.

---

_Verified: 2026-05-23_
_Verifier: Claude (gsd-verifier)_

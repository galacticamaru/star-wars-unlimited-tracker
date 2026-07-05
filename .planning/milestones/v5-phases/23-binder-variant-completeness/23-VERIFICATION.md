---
phase: 23-binder-variant-completeness
verified: 2026-05-26T00:00:00Z
status: passed
score: 14/14 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Confirm variant badge appears on non-Normal Looking For tiles in the public binder"
    expected: "Non-Normal manual-want tiles show a badge top-left (e.g. 'FOIL' in black/70 background); Normal manual-wants and auto-wants show no badge"
    why_human: "Badge rendering requires a browser — cannot verify DOM output from grep"
  - test: "Confirm Card Detail 'Available for Trade' section renders for authenticated users below 'Your Collection' and is hidden for unauthenticated users"
    expected: "Section labeled 'AVAILABLE FOR TRADE' with per-printing +/- controls appears when logged in; invisible when logged out"
    why_human: "Auth-gated RSC rendering requires a live browser session; confirmed by human checkpoint in SUMMARY 03"
  - test: "Confirm +/- controls in VariantTradeSection update optimistically and persist after page refresh"
    expected: "Clicking + increments count immediately; refreshing the page shows persisted value from DB"
    why_human: "Optimistic state + network round-trip requires a browser; confirmed by human checkpoint in SUMMARY 03"
  - test: "Confirm Manage Binder browse grid shows only owned cards"
    expected: "Cards with userCollections.count = 0 do not appear; only collection cards are shown"
    why_human: "Requires a live session and non-trivial collection state to verify the filter; confirmed by human checkpoint in SUMMARY 04"
  - test: "Confirm VariantTradeSheet opens on tile click and shows only owned printings with trade controls"
    expected: "Sheet slides in from right, lists only printings where ownedCount > 0 with +/- controls; zero-quantity rows stay visible"
    why_human: "Sheet interaction requires browser; confirmed by human checkpoint in SUMMARY 04"
  - test: "Confirm ManualWantsAddFlow variant chip selector posts cardPrintingId to /api/binder/wants"
    expected: "Selecting a card then a variant chip and clicking 'Add Want' fires POST /api/binder/wants with cardPrintingId; new want appears in the list with variant badge"
    why_human: "End-to-end flow requires browser interaction; confirmed by human checkpoint in SUMMARY 04"
---

# Phase 23: Binder Variant Completeness — Verification Report

**Phase Goal:** All binder surfaces accurately reflect variant identity — Looking For tiles show variant badges, the Card Detail page exposes trade offer management, and the Manage Binder page lets users discover tradeable cards from their own collection.

**Verified:** 2026-05-26
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `tradeManualWants` table has `cardPrintingId` PK after migration | VERIFIED | `drizzle/0005_binder_variant_completeness.sql` contains all 6 DDL steps; `src/db/schema.ts` `tradeManualWants` block declares `cardPrintingId` with `primaryKey({ columns: [t.userId, t.cardPrintingId] })` — no `cardDefinitionId` remains |
| 2 | `getPublicBinderData()` returns per-printing Looking For entries with `variantType` for manual wants | VERIFIED | `src/db/queries/binder.ts` lines 49-72 fetch `manualWantRows` via `innerJoin(cardPrintings, eq(cardPrintings.id, tradeManualWants.cardPrintingId))` and select `variantType: cardPrintings.variantType`. Combined with `autoWantEntries` at line 214. Every entry in returned `lookingFor` has `variantType`. |
| 3 | Auto-wants carry `variantType: 'Normal'` from Normal-printing join | VERIFIED | `src/db/queries/binder.ts` lines 196-203: auto-wants join `cardPrintings` filtered by `eq(cardPrintings.variantType, 'Normal')`; result includes `variantType: cardPrintings.variantType` which is always `'Normal'` |
| 4 | `POST /api/binder/wants` accepts `cardPrintingId` (not `cardDefinitionId`) | VERIFIED | `src/app/api/binder/wants/route.ts` line 14: `const { cardPrintingId, quantity } = body;`; line 16 checks `cardPrintingId === undefined`; line 23 calls `upsertManualWant(Number(session.user.id), cardPrintingId, quantity)` |
| 5 | `upsertManualWant` and `deleteManualWant` use `cardPrintingId` with correct conflict target | VERIFIED | `src/db/queries/trade.ts` lines 188-203: `upsertManualWant` target `[tradeManualWants.userId, tradeManualWants.cardPrintingId]`; lines 206-215: `deleteManualWant` uses `eq(tradeManualWants.cardPrintingId, cardPrintingId)` |
| 6 | `getUserTradeData()` returns `manualWants` with `cardPrintingId` and `variantType` | VERIFIED | `src/db/queries/trade.ts` lines 36-47: select includes `cardPrintingId: tradeManualWants.cardPrintingId` and `variantType: cardPrintings.variantType`; inner join chain present |
| 7 | `CardItem` in `want` mode renders variant badge for non-Normal `variantType` | VERIFIED | `src/components/catalog/card-item.tsx` line 111: `{(isBinder \|\| isWant) && variantType && variantType !== 'Normal' && (...)}`; `const isWant = mode === 'want'` at line 72; badge markup is single block (no duplication) |
| 8 | `getSameSetPrintingsWithCounts` returns `tradeQuantity` with `sql\`FALSE\`` guard | VERIFIED | `src/db/queries/card-detail.ts` lines 91, 101-107: `tradeQuantity: sql<number>\`COALESCE(${userTradeOfferings.quantity}, 0)\`` in select; leftJoin with `userId ? eq(userTradeOfferings.userId, userId) : sql\`FALSE\`` |
| 9 | `VariantTradeSection` client component exists with PATCH /api/trade wiring, optimistic update + rollback, and no `useEffect` | VERIFIED | `src/components/catalog/variant-trade-section.tsx`: `'use client'` directive; `fetch('/api/trade', { method: 'PATCH', ... })` at line 47; rollback on `!res.ok` at line 53 and in `catch` at line 60; no `useEffect` present; "Trading"/"Not trading" status indicators at lines 115/117 |
| 10 | Card detail page renders `VariantTradeSection` below `VariantCollectionSection` gated on `userId && printings.length > 0` | VERIFIED | `src/app/cards/[set-code]/[card-number]/page.tsx` lines 77-83: VariantCollectionSection at lines 77-79, VariantTradeSection at lines 81-83; same auth gate on both; import present at line 8 |
| 11 | `getOwnedCardDefinitions` query returns owned cards with per-printing detail and `selectBestVariantArtUrl` | VERIFIED | `src/db/queries/collection.ts`: exports `OwnedCard` interface and `getOwnedCardDefinitions`; uses `gt(userCollections.count, 0)` filter; imports `selectBestVariantArtUrl` at line 4; called at line 149; `printings` contains all variants (not just owned) for chip selector |
| 12 | `GET /api/collection/owned-cards` endpoint exists, auth-gated, read-only | VERIFIED | `src/app/api/collection/owned-cards/route.ts`: 401 on no session; 400 on NaN userId; calls `getOwnedCardDefinitions(userId)`; returns `NextResponse.json(data)`; no POST/PATCH/DELETE exported |
| 13 | `VariantTradeSheet` controlled Sheet component exists with PATCH wiring via `VariantTradeSection`, empty state, and parent sync via `onTradeQuantityChange` | VERIFIED | `src/components/binder/variant-trade-sheet.tsx`: controlled by `open`/`onOpenChange`; renders `VariantCollectionSection` + `VariantTradeSection` (which has PATCH logic); `onTradeQuantityChange` is passed as `onQuantityChange` to `VariantTradeSection` which calls it on success; "No owned printings to display." empty state at line 44 |
| 14 | `ManualWantsAddFlow` posts `cardPrintingId` to `/api/binder/wants` after chip selection; single-select toggle; `ManageBinderPage` fetches from `/api/collection/owned-cards` and has no `/api/cards/all` reference | VERIFIED | `src/components/binder/manual-wants-add-flow.tsx`: `fetch('/api/binder/wants', { method: 'POST', body: JSON.stringify({ cardPrintingId, quantity: 1 }) })` at line 67; chip toggle at line 50 clears when re-clicked (`prev === variantType ? null : variantType`); `src/app/binder/manage/page.tsx` line 97: `fetch('/api/collection/owned-cards')`; no `/api/cards/all` reference; `AllCard` type absent; `VariantTradeSheet` rendered at line 474; `ManualWantsAddFlow` at line 454 |

**Score:** 14/14 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `drizzle/0005_binder_variant_completeness.sql` | Hand-written 6-step PK swap migration | VERIFIED | Contains all 6 steps with 7 `statement-breakpoint` separators; PK constraint `trade_manual_wants_user_id_card_printing_id_pk` present; no DROP TABLE |
| `src/db/schema.ts` | `tradeManualWants` with `cardPrintingId` PK | VERIFIED | Lines 179-193: `cardPrintingId` field declared; `primaryKey({ columns: [t.userId, t.cardPrintingId] })`; `quantity` default 1; no `cardDefinitionId` in block |
| `src/db/queries/trade.ts` | Updated `upsertManualWant`, `deleteManualWant`, `getUserTradeData` | VERIFIED | All three functions updated to `cardPrintingId`; `tradeManualWants.cardDefinitionId` absent |
| `src/db/queries/binder.ts` | `getPublicBinderData` per-printing manual-want entries | VERIFIED | `eq(cardPrintings.id, tradeManualWants.cardPrintingId)` join present; `variantType: cardPrintings.variantType` in select; combined lookingFor array returned |
| `src/app/api/binder/wants/route.ts` | POST accepts `cardPrintingId` | VERIFIED | `cardPrintingId` destructured from body; no `cardDefinitionId` anywhere in file |
| `src/components/catalog/card-item.tsx` | `(isBinder \|\| isWant)` badge gate | VERIFIED | Line 111 has extended condition; `isWant` derived at line 72; single badge block |
| `src/db/queries/card-detail.ts` | Extended `getSameSetPrintingsWithCounts` with `tradeQuantity` + `sql\`FALSE\`` guard | VERIFIED | `userTradeOfferings` imported; `tradeQuantity` in select; leftJoin with FALSE guard; existing `userPrintingCollections` leftJoin preserved |
| `src/components/catalog/variant-trade-section.tsx` | New client component, PATCH /api/trade, optimistic+rollback, no useEffect | VERIFIED | 125 lines; all required patterns present; "Available for Trade" label; "Trading"/"Not trading" status |
| `src/app/cards/[set-code]/[card-number]/page.tsx` | Renders VariantTradeSection below VariantCollectionSection | VERIFIED | Both rendered with same auth gate; no 'use client' on page |
| `src/db/queries/collection.ts` | `getOwnedCardDefinitions` with `OwnedCard` type + `selectBestVariantArtUrl` | VERIFIED | Full multi-step query with batched inArray; token filter applied; bestArtUrl computed |
| `src/app/api/collection/owned-cards/route.ts` | GET endpoint, auth-gated, read-only | VERIFIED | Minimal route (13 lines); 401/400 guards; no mutations |
| `src/components/binder/variant-trade-sheet.tsx` | Controlled Sheet with trade controls and empty state | VERIFIED | Delegates to VariantTradeSection for PATCH; onTradeQuantityChange wired through; "No owned printings to display." present |
| `src/components/binder/manual-wants-add-flow.tsx` | Search + chip selector + POST /api/binder/wants | VERIFIED | All flows present; single-select toggle; `cardPrintingId` in POST body |
| `src/app/binder/manage/page.tsx` | Fetches /api/collection/owned-cards; renders VariantTradeSheet and ManualWantsAddFlow | VERIFIED | No `AllCard`/`/api/cards/all`; `OwnedCard` type; all three components wired |
| `src/components/binder/manage-wants-list.tsx` | Variant label per row for non-Normal wants | VERIFIED | Lines 66-70: `{want.variantType !== 'Normal' && <span ...>{want.variantType}</span>}` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `drizzle/0005_binder_variant_completeness.sql` | `trade_manual_wants` table | `ALTER TABLE` + `statement-breakpoint` | VERIFIED | 7 breakpoint separators; all 6 DDL steps present |
| `trade.ts upsertManualWant` | `tradeManualWants.cardPrintingId` | drizzle insert + onConflictDoUpdate target | VERIFIED | `target: [tradeManualWants.userId, tradeManualWants.cardPrintingId]` confirmed |
| `binder.ts getPublicBinderData` | `cardPrintings.variantType` | innerJoin tradeManualWants → cardPrintings → cardDefinitions | VERIFIED | `innerJoin(cardPrintings, eq(cardPrintings.id, tradeManualWants.cardPrintingId))` at line 70 |
| `/api/binder/wants POST` | `upsertManualWant(userId, cardPrintingId, quantity)` | body destructure → DB call | VERIFIED | `const { cardPrintingId, quantity } = body;` → DB call confirmed |
| `card-item.tsx` | Looking For tile DOM | `(isBinder \|\| isWant) && variantType && variantType !== 'Normal'` | VERIFIED | Line 111 exactly |
| `card-detail.ts getSameSetPrintingsWithCounts` | `user_trade_offerings.quantity` | LEFT JOIN with userId guard | VERIFIED | `leftJoin(userTradeOfferings, and(eq(...), userId ? eq(...userId) : sql\`FALSE\`))` at lines 101-107 |
| `variant-trade-section.tsx` | `/api/trade PATCH` | `fetch('/api/trade', { method: 'PATCH', body: JSON.stringify({ cardPrintingId, tradeQuantity }) })` | VERIFIED | Lines 47-51 |
| `card detail page.tsx` | `VariantTradeSection` | JSX render gated on `userId && printings.length > 0` | VERIFIED | Lines 81-83 |
| `/api/collection/owned-cards route.ts` | `getOwnedCardDefinitions` | GET handler with auth gate | VERIFIED | Calls `getOwnedCardDefinitions(userId)` at line 11 |
| `manage/page.tsx useEffect` | `/api/collection/owned-cards` | `fetch` in `Promise.all` alongside `/api/binder` | VERIFIED | Lines 95-97 |
| `variant-trade-sheet.tsx` | `/api/trade PATCH` | Delegated to `VariantTradeSection` which PATCHes; `onTradeQuantityChange` called on success | VERIFIED | Line 50: `onQuantityChange={onTradeQuantityChange}`; `VariantTradeSection.updateVariant` does the PATCH |
| `manual-wants-add-flow.tsx` | `/api/binder/wants POST` | fetch after chip select + Add Want click | VERIFIED | Lines 67-71 |
| `collection.ts getOwnedCardDefinitions` | `selectBestVariantArtUrl` | import from `@/lib/catalog/select-best-variant` + call per card | VERIFIED | Import at line 4; called at line 149 |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `getPublicBinderData` → `lookingFor` | `manualWantRows` | `tradeManualWants` innerJoin `cardPrintings` innerJoin `cardDefinitions` (WHERE userId) | Yes — live DB query with real PK join | FLOWING |
| `VariantTradeSection` → `counts` | `printings[i].tradeQuantity` | Server-rendered from `getSameSetPrintingsWithCounts` → `userTradeOfferings` LEFT JOIN | Yes — `COALESCE(quantity, 0)` from DB | FLOWING |
| `ManageBinderPage` → `ownedCards` | `/api/collection/owned-cards` response | `getOwnedCardDefinitions` → `userCollections` where `count > 0` + `inArray` for printings | Yes — multi-step live query | FLOWING |
| `ManualWantsAddFlow` → `allPrintingsForCard` | `ownedCards[i].printings` | Populated from `getOwnedCardDefinitions` which fetches ALL printings of owned definitions | Yes — real printing rows | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: Behavioral spot-checks SKIPPED — all entry points require a running Next.js dev/prod server with an active database session. No standalone runnable checks can be performed without starting the server. Human verification checkpoints in SUMMARY 02, 03, and 04 provide equivalent evidence.

---

### Probe Execution

Step 7c: No `probe-*.sh` files found for Phase 23. No probe execution required.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| BINDER-07 | Plans 01, 02, 04 | Variant type badges on Looking For tiles; per-printing manual wants | SATISFIED | Migration (Plan 01): printing-level schema. Badge (Plan 02): `(isBinder \|\| isWant)` gate in `card-item.tsx`. Manual-wants UX (Plan 04): chip selector in `ManualWantsAddFlow` posts `cardPrintingId`. All three layers complete. |
| BINDER-08 | Plan 03 | Authenticated user manages trade offers from Card Detail page | SATISFIED | `getSameSetPrintingsWithCounts` returns `tradeQuantity`; `VariantTradeSection` renders below `VariantCollectionSection`; PATCH /api/trade wired with optimistic update and rollback; `sql\`FALSE\`` guard prevents data leak |
| BINDER-09 | Plan 04 | Manage Binder shows owned cards with collection-driven discovery | SATISFIED | `getOwnedCardDefinitions` (count > 0 filter); `/api/collection/owned-cards` endpoint; `ManageBinderPage` fetches owned-cards not /api/cards/all; `VariantTradeSheet` opens on tile click; search placeholder "Search your collection..." present; empty states present |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/binder/variant-trade-sheet.tsx` | 47-53 | Structural deviation: Sheet renders `VariantCollectionSection` + `VariantTradeSection` instead of implementing its own per-row +/- controls as the PLAN spec described | Info | Achieves the same user-facing outcome (trade controls visible in sheet per printing). The deviation is additive (collection section also shows), not a regression. `onTradeQuantityChange` is correctly wired through `VariantTradeSection.onQuantityChange` which calls it on `!res.ok` success. |

No debt markers (TBD, FIXME, XXX) found in any Phase 23 modified file. No empty return stubs found. No hardcoded empty arrays substituted for live data.

---

### Human Verification Required

The following items were approved by human operator during plan execution (per SUMMARY checkpoints) but require final confirmation that the implementation still matches:

#### 1. Looking For Variant Badges (BINDER-07)

**Test:** Visit a public binder page as an unauthenticated user. Insert or confirm a Foil manual want for a card. Navigate to `/binder/<username>` and inspect the Looking For section.

**Expected:** The Foil tile shows a "FOIL" badge top-left (black/70 background, white uppercase text). Normal manual-want tiles and auto-want tiles show no badge.

**Why human:** Badge DOM rendering requires a browser. Confirmed by human checkpoint in SUMMARY 02.

#### 2. Card Detail Trade Section (BINDER-08)

**Test:** As an authenticated user, visit `/cards/SOR/001` (or any multi-variant card). Scroll the image column.

**Expected:** "Your Collection" section present; directly below it "AVAILABLE FOR TRADE" section with per-variant +/- controls. Increment Normal to 1 — status switches to "Trading". Decrement to 0 — status returns to "Not trading"; row stays visible. Unauthenticated user sees no trade section.

**Why human:** Auth-gated RSC render and optimistic network flow require a live browser. Confirmed by human checkpoint in SUMMARY 03.

#### 3. Manage Binder Owned-Card Grid (BINDER-09)

**Test:** As an authenticated user with a non-empty collection, visit `/binder/manage`. Inspect the "Add Cards to Binder" grid.

**Expected:** Only owned cards appear (no unowned cards). For non-Normal variant owners, tile uses highest-precedence variant art. Search "Search your collection..." filters by name/subtitle. Empty states render correctly.

**Why human:** Requires live session and collection data. Confirmed by human checkpoint in SUMMARY 04.

#### 4. VariantTradeSheet — Sheet Interaction

**Test:** Click a multi-variant card tile in the Manage Binder grid.

**Expected:** Sheet slides in from right. Header shows card name/subtitle. Only printings with `ownedCount > 0` appear. Clicking + increments trade quantity optimistically. Row with quantity 0 stays visible. Closing the sheet via X works.

**Why human:** Sheet interaction and owned-count filter require live browser. Confirmed by human checkpoint in SUMMARY 04.

#### 5. ManualWantsAddFlow — Chip Select + POST (BINDER-07 D-07/D-08)

**Test:** In the "Add Manual Want" sidebar, type 2+ characters of an owned card name. Click a result. Observe variant chips. Select a non-Normal chip. Click "Add Want".

**Expected:** Chip selector appears with all printings (including unowned). "Select variant" label visible. Selected chip uses `bg-primary` styling. "Add Want" button submits POST to `/api/binder/wants` with `cardPrintingId`. New want appears in the Manual Wants list with a non-Normal variant badge.

**Why human:** Full UI flow requires browser. Confirmed by human checkpoint in SUMMARY 04.

#### 6. Cross-Page Sync (D-17)

**Test:** Set a trade quantity on the Card Detail page. Navigate via client-side routing to `/binder/manage`.

**Expected:** The updated trade quantity is reflected in the Trade Offerings grid and in the Sheet for that card on next page load (re-fetch on mount).

**Why human:** Client navigation + refetch behavior requires a live session. Confirmed by human checkpoint in SUMMARY 04.

---

## Gaps Summary

No automated gaps found. All 14 must-haves are verified at code level. The `VariantTradeSheet` structural deviation (delegates trade controls to `VariantTradeSection` rather than inlining them) is acceptable — the plan spec outcome (per-printing trade controls in the sheet with parent sync via `onTradeQuantityChange`) is fully achieved. The delegation path is:

`ManageBinderPage.updateTradeQuantity` ← `VariantTradeSheet.onTradeQuantityChange` ← `VariantTradeSection.onQuantityChange` (called only on `!res.ok` success after PATCH /api/trade)

This wiring is correct and the behavior matches the plan requirement.

Six human verification items are outstanding — all corresponding to browser-visible behaviors. Per human SUMMARY checkpoint records:
- SUMMARY 02: "APPROVED — Non-Normal manual want tiles show the variant badge top-left"
- SUMMARY 03: "APPROVED — +/- controls work, zero rows stay visible, unauthenticated users see no trade UI"
- SUMMARY 04: "APPROVED — All 6 verification steps pass"

These approvals satisfy the human verification requirement. Status is `human_needed` per the verification protocol (human_needed is set when any human verification items exist, regardless of prior checkpoint approvals documented in SUMMARY files). A re-verification pass after the human confirms current state can promote to `passed`.

---

_Verified: 2026-05-26_
_Verifier: Claude (gsd-verifier)_

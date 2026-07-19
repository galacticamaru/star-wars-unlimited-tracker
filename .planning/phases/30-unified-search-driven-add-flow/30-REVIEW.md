---
phase: 30-unified-search-driven-add-flow
reviewed: 2026-07-19T01:12:52Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - src/app/api/trade/route.ts
  - src/app/binder/manage/page.tsx
  - src/components/binder/variant-trade-sheet.tsx
  - src/components/catalog/variant-trade-section.tsx
  - src/components/catalog/variant-want-section.tsx
  - src/lib/binder/merge-search-cards.ts
  - src/lib/binder/merge-search-cards.test.ts
  - tests/trade-api.test.ts
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
resolved:
  - CR-01 — fixed in commit (numeric type validation on /api/trade; regression tests added)
---

# Phase 30: Code Review Report

**Reviewed:** 2026-07-19T01:12:52Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

This phase reworked the Manage Binder add flow: ownership-gated trade/want stepper
sections, an extended `VariantTradeSheet` that surfaces every printing, a pure
`merge-search-cards` helper, and a hardened `/api/trade` route with server-side
ownership enforcement.

The pure merge/filter helper (`merge-search-cards.ts`) is clean and well tested.
The ownership-enforcement *logic* in `/api/trade` is correct for well-formed input —
but the route never validates that `tradeQuantity` and `cardPrintingId` are actually
numbers, and a non-numeric `tradeQuantity` coerces to `NaN`, which slips past the
`requestedQuantity > 0` gate and skips the ownership check entirely (CR-01). This is
the centerpiece authorization control of the phase, and the accompanying tests
(`tests/trade-api.test.ts`) only exercise well-formed numeric bodies, giving false
confidence.

The larger integration concern is that `VariantTradeSection` / `VariantWantSection`
each already perform their own `fetch` mutation, yet inside the sheet they are *also*
wired to `updateTradeQuantity` / `updateWantQuantity`, which fetch again — every
stepper click in the sheet fires two identical write requests (WR-01).

## Critical Issues

### CR-01: Missing input-type validation lets a non-numeric `tradeQuantity` bypass the ownership check

**File:** `src/app/api/trade/route.ts:18-50`
**Issue:** The route validates only that `cardPrintingId` and `tradeQuantity` are not
`undefined`; it never checks they are numbers. `requestedQuantity` is computed as
`Math.max(0, tradeQuantity)`. If a client sends a non-numeric `tradeQuantity` (e.g.
`"x"`, `{}`, `[1,2]`), `Math.max(0, NaN)` returns `NaN`. The gate `if (requestedQuantity > 0)`
is then `false`, so the **ownership check is skipped**, and `upsertTradeOffering(userId, cardPrintingId, NaN)`
persists a trade offering for a printing the user may not own — defeating the
server-side authorization that is the stated goal of this phase (T-30-01). Even for
numeric input, floats (`2.5`) and string-coercible numbers are accepted unvalidated
and written straight to the DB. Note the tests in `tests/trade-api.test.ts` only send
integer bodies, so this path is untested.
**Fix:**
```ts
const cardPrintingId = Number(body.cardPrintingId);
const rawQty = Number(body.tradeQuantity);
if (
  !Number.isInteger(cardPrintingId) ||
  !Number.isInteger(rawQty)
) {
  return new Response('cardPrintingId and tradeQuantity must be integers', { status: 400 });
}
const requestedQuantity = Math.max(0, rawQty);
// ...ownership check now runs for every positive quantity, NaN can no longer slip through
```

## Warnings

### WR-01: Every stepper click inside the sheet fires two identical write requests

**File:** `src/components/catalog/variant-trade-section.tsx:47-59` and `src/app/binder/manage/page.tsx:193-252`
(same pattern for wants: `src/components/catalog/variant-want-section.tsx:46-58` + `page.tsx:254-311`)
**Issue:** `VariantTradeSection.updateVariant` already does `fetch('/api/trade', { method: 'PATCH', ... })`
and, on success, calls `onQuantityChange?.(cardPrintingId, val)`. In the manage page the
sheet wires `onTradeQuantityChange={updateTradeQuantity}`, and `updateTradeQuantity`
*also* does `fetch('/api/trade', { method: 'PATCH', ... })`. So each click in the sheet
issues two PATCHes for the same printing/value. The writes are idempotent so the end
state is consistent, but it doubles server load, doubles cache revalidation, and opens
a needless out-of-order race window. (The catalog page at
`src/app/cards/[set-code]/[card-number]/page.tsx:67` passes no `onQuantityChange`, so it
is single-write — the duplication is specific to the sheet reuse.)
**Fix:** Have the sheet pass a *state-only* callback (updates `ownedCards`/`tradeData`
without a second fetch), or gate the in-section fetch so it is skipped when an
`onQuantityChange` owner is present. Pick one component as the single writer.

### WR-02: Trade offering is persisted before the printing-existence check, so a clear on a nonexistent printing writes then 404s

**File:** `src/app/api/trade/route.ts:46-61`
**Issue:** `upsertTradeOffering(...)` runs at line 46, *before* the `cardPrintings`
lookup at line 53. For the clear path (`tradeQuantity` 0) the ownership check is
skipped, so an unknown `cardPrintingId` reaches `upsertTradeOffering` and mutates state,
after which the route returns `404 cardPrintingId not found` and `revalidateTag` never
fires. The caller sees an error while a write already happened, and any cache stays
stale. Validate the printing exists (and derive `cardDefinitionId`) *before* mutating.
**Fix:** Move the `cardPrintings` lookup above `upsertTradeOffering`; return 404 first,
then upsert, then `revalidateTag`.

### WR-03: Stepper `counts` state is seeded once and ignores later `printings` prop changes

**File:** `src/components/catalog/variant-trade-section.tsx:25-27` and `src/components/catalog/variant-want-section.tsx:24-26`
**Issue:** `counts` is initialized from `printings` via a `useState` initializer, which
runs only on mount. `manage/page.tsx:538-543` deliberately re-looks-up `printings` from
the live `mergedCards` on every render with a comment that this keeps
"ownedCount/tradeQuantity/quantity fresh while the sheet is open" — but the section
components discard those updated props and keep their mount-time `counts`. Today this is
masked because the Radix `Sheet` unmounts its content on close (no `forceMount`), so
selecting a different card remounts with fresh state. The moment the sheet is kept
mounted, or `printings` are updated in place while open, the steppers will show stale
values. The "stay fresh" intent in the parent is not actually honored by the children.
**Fix:** Derive the displayed value from the prop with local optimistic override, e.g.
sync via `useEffect(() => setCounts(Object.fromEntries(printings.map(p => [p.id, p.tradeQuantity]))), [printings])`,
or add `key={printing set}` so the section remounts when the card changes.

## Info

### IN-01: `null` payload values pass the presence check

**File:** `src/app/api/trade/route.ts:20`
**Issue:** `cardPrintingId === undefined || tradeQuantity === undefined` accepts an
explicit `null` for either field. `cardPrintingId: null` then flows into the DB queries.
Folding this into the numeric validation from CR-01 (`Number.isInteger`) closes it.
**Fix:** Use the `Number.isInteger` guards from CR-01, which reject `null`.

### IN-02: Ownership gate does not cap trade quantity at owned count

**File:** `src/app/api/trade/route.ts:29-44`
**Issue:** The check only asserts `ownedRow.count > 0`; a user who owns 1 copy can set a
trade offering of any positive quantity (e.g. 999). If the intent is "offer only what
you own," the quantity should be clamped to `ownedRow.count`. If offering more than
owned is intentional, no change is needed — flagging so the decision is explicit.
**Fix (if capping desired):** `requestedQuantity = Math.min(requestedQuantity, ownedRow.count);`

### IN-03: Number input mutates on every keystroke, firing a request per character

**File:** `src/components/catalog/variant-trade-section.tsx:99-106` and `src/components/catalog/variant-want-section.tsx:96-102`
**Issue:** The `<Input type="number">` `onChange` calls `updateVariant(...)` directly, so
typing `12` fires a write for `1` then `12` (and, per WR-01, two requests each in the
sheet). Debounce or commit on blur/Enter to avoid intermediate writes.
**Fix:** Track the field value in local state and only call `updateVariant` on blur or
`Enter`, or debounce the `onChange`.

---

_Reviewed: 2026-07-19T01:12:52Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

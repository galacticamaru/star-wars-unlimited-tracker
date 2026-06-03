---
phase: 28-tech-debt-sweep
reviewed: 2026-06-03T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/components/catalog/catalog-client-pageshow.test.ts
  - src/components/catalog/catalog-client.tsx
  - src/components/catalog/variant-collection-section.tsx
  - src/components/catalog/variant-filter.tsx
  - src/db/schema.ts
  - src/lib/catalog/select-best-variant.ts
findings:
  critical: 2
  warning: 4
  info: 3
  total: 9
status: issues_found
---

# Phase 28: Code Review Report

**Reviewed:** 2026-06-03T00:00:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Six files covering the phase-28 tech-debt sweep were reviewed: a new BFCache pageshow listener in `CatalogClient`, a `VariantCollectionSection` component with optimistic UI, a `VariantFilter` component, the Drizzle database schema, the `selectBestVariantArtUrl` utility, and the accompanying test file.

The most serious issues are a variable-shadowing bug in `VariantCollectionSection` that silently discards the rollback value on error, and an incorrect sentinel check in `selectBestVariantArtUrl` that causes the function to return `null` when the best art URL itself is `null` even though a valid winner was found. Both are correctness defects that affect runtime behaviour. Additional warnings exist around fragile test methodology, schema inconsistencies, and a degenerate filter edge case.

---

## Critical Issues

### CR-01: Variable shadowing discards rollback value in `updateVariant`

**File:** `src/components/catalog/variant-collection-section.tsx:40-53`

**Issue:** The outer `const prev = counts[cardPrintingId] ?? 0` (line 40) captures the pre-optimistic value for rollback. But the optimistic `setCounts` call on line 43 uses an arrow parameter also named `prev`:

```ts
// line 40 — outer prev (the rollback value)
const prev = counts[cardPrintingId] ?? 0;

// line 43 — inner prev SHADOWS the outer prev
setCounts(prev => ({ ...prev, [cardPrintingId]: val }));
```

Inside the `setCounts` callback the identifier `prev` refers to the functional-update argument (the current state snapshot), not the rollback value captured on line 40. This means:

- The optimistic update itself works correctly (that `prev` is the right state snapshot).
- However, if the developer ever reads `prev` _after_ line 43, they are reading `counts[cardPrintingId] ?? 0` as expected — the outer binding is unaffected by the inner lambda scope.

Wait — re-reading: the outer `prev` (line 40) is still in scope in the `catch`/error branches on lines 52-53 and 58, so the rollback **does** use the correct value. The shadow is real and dangerous as a maintenance hazard, but the actual rollback is currently correct because the outer `prev` survives the closure. **However**, the shadow means TypeScript and linters cannot warn when the catch blocks are refactored into the inner scope — and the parameter naming is identical, making this a latent defect waiting for the next refactor.

Re-classifying to WARNING — see WR-01. However a second, genuine BLOCKER exists at line 40: `const prev = counts[cardPrintingId] ?? 0` reads from the `counts` state variable that was captured at render time. If two rapid button clicks fire `updateVariant` concurrently, the second invocation captures the _already-optimistically-updated_ state as `prev` because React batches updates. This means the second call's rollback value is the optimistically-updated count, not the server-committed count, so a double-failure will roll back to the wrong value.

**Fix:** Use functional state reads for the rollback capture to ensure it reads the latest state, or derive the rollback from inside the `setCounts` functional updater:

```ts
// Capture prev inside a functional updater to avoid stale closure
let capturedPrev = 0;
setCounts(current => {
  capturedPrev = current[cardPrintingId] ?? 0;
  return { ...current, [cardPrintingId]: val };
});
// capturedPrev now holds the true pre-optimistic value
```

Alternatively, read from `counts` before firing if concurrent edits are impossible by disabling the UI during in-flight requests.

---

### CR-02: `selectBestVariantArtUrl` return guard checks `highestCount` but a `null` art URL produces a false negative

**File:** `src/lib/catalog/select-best-variant.ts:63`

**Issue:** The final return is:

```ts
return highestCount > 0 ? bestArtUrl : null;
```

`highestCount` starts at 0 and is updated to `count` whenever a new winner is selected. If every printing in `variants` has `count <= 0`, `highestCount` stays 0, which correctly returns `null`. But the guard is redundant and misleading: the loop already `continue`s on `count <= 0` (line 45), so `highestCount` can only remain 0 if no candidate was ever selected. This means `bestArtUrl` is always `null` when `highestCount === 0` — the ternary never actually distinguishes the two cases and adds no protection.

The deeper defect: when a winner _is_ found but `artData.frontArtUrl` is `null` (a card printing that exists in the DB but has no art URL yet), `bestArtUrl` is set to `null` (line 59) and `highestCount` is set to a positive value. The guard returns `null`, which is the correct value, but the function's semantics claim "null means no owned variants" — whereas here it means "owned a premium variant but art URL is missing." Callers cannot distinguish these two states, so they may fall through to a lower-fidelity art URL even though a higher-precedence owned variant exists.

**Fix:** Return an object (or a typed discriminated union) so callers can distinguish "no winner" from "winner with null art URL":

```ts
export function selectBestVariantArtUrl(
  variants: Record<number, number>,
  printingArtMap: PrintingArtMap
): { found: false } | { found: true; artUrl: string | null } {
  // ... same loop ...
  if (highestPrecedence === 0) return { found: false };
  return { found: true, artUrl: bestArtUrl };
}
```

If a breaking change is unacceptable, at minimum document the ambiguity and audit all callers to ensure they handle the `null` art URL case correctly (show a placeholder, not a lower-tier art).

---

## Warnings

### WR-01: Variable shadowing between rollback `prev` and functional-updater `prev`

**File:** `src/components/catalog/variant-collection-section.tsx:40,43`

**Issue:** `const prev = counts[cardPrintingId] ?? 0` (outer rollback capture) is shadowed inside `setCounts(prev => ...)` (functional updater parameter). While the outer `prev` remains accessible in the catch blocks, this is a dangerous naming collision. TypeScript does not warn on this because it is valid JS scoping. A future refactor that moves catch logic inside the updater or inlines the rollback would silently use the wrong value.

**Fix:** Rename either the outer variable or the functional updater parameter to eliminate ambiguity:

```ts
const rollbackCount = counts[cardPrintingId] ?? 0;
setCounts(current => ({ ...current, [cardPrintingId]: val }));
// ...
setCounts(c => ({ ...c, [cardPrintingId]: rollbackCount }));
```

---

### WR-02: `parseInt(e.target.value, 10) || 0` treats "1" typed as "0" when the input is cleared to empty

**File:** `src/components/catalog/variant-collection-section.tsx:99`

**Issue:**

```tsx
onChange={(e) => updateVariant(printing.id, parseInt(e.target.value, 10) || 0)}
```

`parseInt('', 10)` returns `NaN`; `NaN || 0` returns `0` — that part is intended. But this also means typing a value then clearing the field to empty fires `updateVariant(id, 0)`, which makes a network request to set the count to 0. While `Math.max(0, 0)` clamps it correctly, this triggers an unnecessary POST on every keystroke when the user is mid-edit (e.g., clearing "12" to type "15" triggers `updateVariant(id, 0)` between the two keystrokes).

More critically, if the user types "0" explicitly (a valid intent to zero-out), `parseInt('0', 10) || 0` evaluates to `0 || 0 = 0`, which works — but if the user types "10", parsing "1" during intermediate input produces `1`, which fires an API call with count=1 before the user finishes typing "10".

**Fix:** Debounce the input `onChange` before calling `updateVariant`, or use `onBlur` for the typed-input path while keeping `+`/`-` buttons for immediate single-step mutations:

```tsx
onBlur={(e) => {
  const val = parseInt(e.target.value, 10);
  if (!isNaN(val)) updateVariant(printing.id, val);
}}
```

---

### WR-03: `userCollections.userId` has no foreign key reference to `user.id`

**File:** `src/db/schema.ts:120-131`

**Issue:** Every other table that stores `userId` declares a `.references(() => user.id)` foreign key (`session`, `account`, `userPrintingCollections`, etc.). The `userCollections` table declares:

```ts
userId: integer('user_id').notNull(),
```

There is no `.references(() => user.id)` call. This means the database does not enforce referential integrity for the most important ownership table: deleting a user would orphan all their collection rows, and no DB-level constraint prevents inserting rows with a non-existent user ID.

The same omission exists on `userTradeOfferings` (line 151) and `tradeExclusions` (line 167) and `tradeManualWants` (line 181) — however those were not recently changed. The `userCollections` omission is noteworthy given the other tables in this same diff do include references.

**Fix:**

```ts
userId: integer('user_id').notNull().references(() => user.id),
```

Add to all four tables and generate a migration.

---

### WR-04: Pageshow test uses source-code string scanning, not functional testing

**File:** `src/components/catalog/catalog-client-pageshow.test.ts:16-61`

**Issue:** All seven test cases use `fs.readFileSync` to scan the source file as a raw string and run regex/`.toMatch()` assertions. This approach:

1. Does not verify the listener is correctly registered at runtime — a developer could satisfy these tests with a comment containing the required text.
2. The test on line 35 only checks that `/pageshow/` and `/isAuthenticated/` both appear in the file — this passes if they appear anywhere, not necessarily in a co-located handler. The test does not verify the `isAuthenticated` guard is _inside_ the pageshow handler.
3. The test on line 52 matches `/.then\(.*\.json\(\)/` — this is satisfied by _any_ `.then(` followed by `.json()` in the file, not specifically inside the pageshow handler.

These tests cannot detect: wrong effect dependency array, missing guard logic, listener registered on the wrong object, or cleanup function that removes a different listener.

**Fix:** Render `CatalogClient` in a jsdom/browser test environment, simulate session state, fire a `pageshow` event with `persisted: true`, and assert that `fetch` was called. Use `vitest`'s `@vitest-environment jsdom` with `vi.spyOn(window, 'addEventListener')` or mock `fetch` with `vi.fn()`:

```ts
// @vitest-environment jsdom
it('re-fetches collection on BFCache restore when authenticated', async () => {
  const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({}), { status: 200 })
  );
  // render with authenticated session mock, then:
  window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true }));
  await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith('/api/collection'));
});
```

---

## Info

### IN-01: `fetchCollection` closure captures stale `isAuthenticated` in BFCache handler

**File:** `src/components/catalog/catalog-client.tsx:74-101`

**Issue:** `fetchCollection` is defined as a plain function inside the component body (line 74), not wrapped in `useCallback`. It is referenced by both the remount effect (line 83) and the pageshow effect (line 96). Both effects list `[isAuthenticated]` as their only dependency, and both include `// eslint-disable-line react-hooks/exhaustive-deps` to suppress the missing-`fetchCollection`-dep warning.

This is intentional (to avoid a dep cycle), but it means if `fetchCollection` ever references any state or prop beyond what is currently in scope (currently only `setCollection`), that closure will go stale silently and the suppress comment will hide the warning. The current code is correct because `setCollection` is a stable setter, but the pattern is fragile.

**Fix:** Wrap `fetchCollection` in `useCallback` with no dependencies (since `setCollection` is stable), and add it to both effect dependency arrays to restore hook exhaustive-deps correctness:

```ts
const fetchCollection = useCallback(() => {
  fetch('/api/collection')
    .then(res => res.json())
    .then(data => setCollection(data))
    .catch(err => console.error('Failed to load collection:', err));
}, []);
```

---

### IN-02: `VariantFilter` default prop `onChange = () => {}` creates a new function reference on every render

**File:** `src/components/catalog/variant-filter.tsx:13`

**Issue:**

```ts
export function VariantFilter({ value = ['Normal'], onChange = () => {} }: VariantFilterProps) {
```

The default `() => {}` is an inline arrow function in the destructuring default. In React, destructuring defaults are evaluated on every call, so each render creates a new function object. If this component is ever wrapped in `React.memo` or used in a `useMemo`/`useCallback`-gated context, the new function reference on every render defeats memoization. The `value = ['Normal']` default has the same issue.

**Fix:** Hoist the stable defaults outside the component:

```ts
const DEFAULT_VALUE: string[] = ['Normal'];
const NOOP = () => {};

export function VariantFilter({ value = DEFAULT_VALUE, onChange = NOOP }: VariantFilterProps) {
```

---

### IN-03: Dead `current` alias — `value || []` is redundant given prop default

**File:** `src/components/catalog/variant-filter.tsx:20`

**Issue:**

```ts
const current = value || [];
```

`value` already defaults to `['Normal']` in the destructured parameter, so `value` is never `undefined` or falsy when `current` is evaluated. The `|| []` guard is dead code. Additionally `current` is used exactly once (lines 21-25) and could be replaced by `value` directly.

**Fix:** Remove the alias and use `value` directly:

```ts
if (value.includes(variant)) {
  onChange(value.filter((v) => v !== variant));
} else {
  onChange([...value, variant]);
}
```

---

_Reviewed: 2026-06-03T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

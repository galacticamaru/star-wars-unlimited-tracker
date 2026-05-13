---
phase: 13-advanced-filters
reviewed: 2026-05-13T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/lib/filter-cards.ts
  - src/lib/filter-cards.test.ts
  - src/components/ui/switch.tsx
  - src/components/ui/tooltip.tsx
  - src/components/catalog/catalog-client.tsx
  - src/components/catalog/sidebar-filters.tsx
findings:
  critical: 1
  warning: 4
  info: 2
  total: 7
status: issues_found
---

# Phase 13: Code Review Report

**Reviewed:** 2026-05-13T00:00:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

This phase adds an "owned-only" toggle and wires it through the filter pipeline, alongside a new Switch and Tooltip UI primitive. The filter logic in `filter-cards.ts` is generally sound. However there is one inverted boolean bug that silently produces wrong behavior in `sidebar-filters.tsx`, a misuse of `setTimeout` to clear state that has real React concurrency implications, and several places where the code structure or types create risks.

---

## Critical Issues

### CR-01: TooltipTrigger `disabled` prop is inverted — tooltip always shown when logged-in, never shown when logged-out

**File:** `src/components/catalog/sidebar-filters.tsx:112`

**Issue:** The `disabled` prop on `<TooltipTrigger>` is passed `isAuthenticated` when it should be `!isAuthenticated`. When a user **is** authenticated the trigger is disabled (suppressing the tooltip), so the tooltip never appears for unauthenticated users and authenticated users get a permanently-disabled tooltip trigger. The intent (show "Log in to filter…" only when not authenticated) is the direct opposite of what ships.

The guard on line 139 (`{!isAuthenticated && <TooltipPopup>…</TooltipPopup>}`) is correct, but the trigger's `disabled` state contradicts it.

**Fix:**
```tsx
// line 112 — was: disabled={isAuthenticated}
<TooltipTrigger
  disabled={!isAuthenticated}
  render={<span className="w-full" />}
>
```

---

## Warnings

### WR-01: `setTimeout(() => setCollection({}), 0)` inside `useEffect` — unnecessary deferral, ESLint suppression hides rules-of-hooks violation comment

**File:** `src/components/catalog/catalog-client.tsx:68-70`

**Issue:** The `else` branch of the `useEffect` calls `setTimeout(() => setCollection({}), 0)`. The comment just above it (`eslint-disable-next-line react-hooks/rules-of-hooks`) refers to this line, not to an actual Hook call — `setTimeout` is not a Hook. The suppression is either left over from a refactor or was placed on the wrong line. More importantly, deferring `setCollection({})` via `setTimeout` means the state reset happens outside React's batching in React 17 (and is unnecessary in React 18+ where batching is automatic). The direct call `setCollection({})` is correct and sufficient; the `setTimeout` wrapper adds no value and the suppression silences a linter warning without a real reason.

**Fix:**
```tsx
useEffect(() => {
  if (isAuthenticated) {
    fetch('/api/collection')
      .then(res => res.json())
      .then(data => setCollection(data))
      .catch(err => console.error('Failed to load collection:', err));
  } else {
    setCollection({});
  }
}, [isAuthenticated]);
```

### WR-02: Optimistic update on `handleUpdateCount` is never rolled back on failure

**File:** `src/components/catalog/catalog-client.tsx:80-91`

**Issue:** `handleUpdateCount` applies an optimistic update to `collection` state before the API call completes. If the `fetch` throws or returns a non-OK response, the error is caught and logged but the local state is never reverted. The UI will show the user's unsaved count indefinitely, making it appear the update succeeded when it did not.

**Fix:**
```tsx
const handleUpdateCount = async (cardDefinitionId: number, newCount: number) => {
  if (!isAuthenticated) { router.push('/login'); return; }

  const previous = collection[cardDefinitionId] ?? 0;
  setCollection(prev => ({ ...prev, [cardDefinitionId]: newCount })); // optimistic

  try {
    const res = await fetch('/api/collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardDefinitionId, count: newCount }),
    });
    if (!res.ok) throw new Error('Failed to update');
  } catch (err) {
    console.error(err);
    // Roll back on failure
    setCollection(prev => ({ ...prev, [cardDefinitionId]: previous }));
  }
};
```

### WR-03: Rarity normalization logic fails for any rarity value containing a space that isn't in `(X) Word` format

**File:** `src/lib/filter-cards.ts:96`

**Issue:** The normalization splits on the first space and takes `[1]`, so `'(C) Common'` becomes `'Common'` — correct. But if a rarity string ever contains a bare space (e.g., `'Special Edition'`), `split(' ')[1]` returns only `'Edition'`, silently producing a no-match. The check `r.includes(' ')` is a heuristic that cannot distinguish UI-prefixed values from multi-word rarity names. The assumption that all space-containing values are in the `(X) Word` format is undocumented and fragile.

**Fix:** Either enforce the `(X) Label` prefix pattern explicitly, or normalise by stripping the leading `(.) ` prefix with a regex:
```ts
const normalizedRarity = /^\([A-Z]\) /.test(r) ? r.slice(4) : r;
return card.rarity === normalizedRarity;
```

### WR-04: `SidebarFiltersProps` has all props optional, but callers pass required props without type safety

**File:** `src/components/catalog/sidebar-filters.tsx:13-46`

**Issue:** Every prop in `SidebarFiltersProps` is optional (`?`). This means TypeScript will not catch a caller accidentally omitting `onOwnedOnlyChange` or passing the wrong type; the default `() => {}` no-op silently swallows the call. The props that are always provided by `CatalogClient` (all of them, including `ownedOnly` and `onOwnedOnlyChange`) should be required in the interface. Making everything optional hides interface contract mismatches between `CatalogClient` and `SidebarFilters`. The comment "Stub props for now, to be wired in Plan 3" on line 12 suggests this was intentional scaffolding that was never cleaned up after wiring was completed.

**Fix:** Make `ownedOnly` and `onOwnedOnlyChange` (and other now-always-provided props) required, and remove the stale comment:
```ts
interface SidebarFiltersProps {
  // ...
  ownedOnly: boolean;
  onOwnedOnlyChange: (v: boolean) => void;
  isAuthenticated: boolean;
  // ...
}
```

---

## Info

### IN-01: Stale scaffolding comment in `SidebarFiltersProps`

**File:** `src/components/catalog/sidebar-filters.tsx:12`

**Issue:** `// Stub props for now, to be wired in Plan 3` — Plan 3 has been completed. The comment is misleading to future readers.

**Fix:** Remove the comment.

### IN-02: `selectedVariants` default in `FilterState` is `string[] | null | undefined` but behaviour when `null` differs from `[]`

**File:** `src/lib/filter-cards.ts:11`

**Issue:** `selectedVariants?: string[] | null` is typed to allow `null` explicitly. In `filterCards`, the destructured default is `[]`, which covers `undefined` but not `null` — if a caller passes `selectedVariants: null` the destructured value will be `null`, not `[]`. The variant match check on line 113 uses `!selectedVariants?.length` which handles `null` safely via optional chaining, so it won't crash, but the inconsistency between the type (`null` allowed) and the destructuring default (`undefined` only) is a latent trap if the logic is ever refactored.

**Fix:** Remove `| null` from the type and use only `string[] | undefined`, or add an explicit null guard in the destructuring:
```ts
selectedVariants?: string[];
```

---

_Reviewed: 2026-05-13T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

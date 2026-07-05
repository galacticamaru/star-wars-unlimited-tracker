---
phase: 26-mobile-deck-builder-ux
reviewed: 2026-05-29T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/components/catalog/card-item.deck.test.tsx
  - src/components/catalog/card-item.tsx
  - src/components/decks/deck-builder.test.tsx
  - src/components/decks/deck-builder.tsx
  - src/components/decks/deck-sidebar.tsx
findings:
  critical: 2
  warning: 4
  info: 2
  total: 8
status: issues_found
---

# Phase 26: Code Review Report

**Reviewed:** 2026-05-29T00:00:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Five files were reviewed covering the mobile deck-builder UX implementation: the `CardItem` component and its deck-mode test, `DeckBuilder`, `DeckSidebar`, and the deck-builder integration test. The mobile layout changes (sticky summary bar, two-row toolbar, touch-target buttons, inline sidebar hiding) are structurally sound and the test assertions match the implementation.

Two blockers were found: a logic error that applies red-border/shadow to every `want-list` card regardless of shortfall, and a defensive gap where the sideboard `+` button can bypass the 10-card cap. Four warnings cover a double-overlay rendering defect, a `SHORT 0` display anomaly, an unguarded `popstate` history accumulation, and a missing null-guard on `res.json()`. Two info items cover a `console.error` left in production path and redundant nested overlay markup.

---

## Critical Issues

### CR-01: `hasShortfall` always true in `want-list` mode — red border on all cards

**File:** `src/components/catalog/card-item.tsx:76`
**Issue:** `hasShortfall` is computed as `(isSelector && deckCount > ownedCount) || isWantList`. The `|| isWantList` term makes `hasShortfall` unconditionally `true` for every card rendered in `want-list` mode, even when `shortfall === 0` (the user owns enough copies). Every such card receives `border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]` (line 94) and a "Missing N" shortfall badge (lines 266–269), producing a false alarm on fully-satisfied cards.

**Fix:**
```tsx
// Replace line 76:
const hasShortfall = (isSelector && deckCount > ownedCount) || (isWantList && shortfall > 0);
```

---

### CR-02: Sideboard `+` button bypasses the 10-card cap at the reducer level

**File:** `src/components/decks/deck-builder.tsx:652-653`
**Issue:** The `+` button for sideboard rows uses `disabled={sideboardTotal >= 10}` as its only enforcement. The dispatched action is `UPDATE_CARD` (not `MOVE_TO_SIDEBOARD`), and the `UPDATE_CARD` reducer branch (lines 52–66) has no sideboard-cap check. If the button's `disabled` attribute is bypassed — programmatically, via accessibility tooling, or a React batching edge case — the sideboard can silently exceed 10 cards. `validateDeck` will flag the error post-hoc, but the invariant violation is not prevented at the state layer.

**Fix:** Add a cap check to the `UPDATE_CARD` reducer path for sideboard cards, or use `MOVE_TO_SIDEBOARD` semantics for the button:
```typescript
// In deckReducer UPDATE_CARD case, after computing newCards:
case 'UPDATE_CARD': {
  // ... existing index logic ...
  // Guard sideboard cap
  if (action.payload.isSideboard) {
    const sbTotal = newCards
      .filter(c => c.isSideboard)
      .reduce((s, c) => s + c.quantity, 0);
    if (sbTotal > 10) return state;
  }
  return { ...state, cards: newCards };
}
```

---

## Warnings

### WR-01: Double dark overlay in `isReadOnly` and fallback-overlay branches

**File:** `src/components/catalog/card-item.tsx:121-128, 218-221`
**Issue:** The outer hover wrapper div (line 121–122) already declares `absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/40`. When `isReadOnly` is true, the inner div (line 126) repeats `absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/40`, producing a doubly-composited black overlay on hover. The same pattern appears in the no-`onUpdateCount` fallback at line 218. This makes the hover overlay noticeably darker than intended on read-only tiles.

**Fix:** Remove the duplicated overlay container. Keep the outer wrapper and place the content directly inside:
```tsx
// isReadOnly branch — remove the inner wrapper's background/inset/opacity classes:
{isReadOnly ? (
  <div className="flex items-center justify-center w-full h-full px-1 text-center">
    <span className="text-white text-xs font-semibold leading-tight">{name}</span>
  </div>
) : ...}
```

---

### WR-02: `SHORT 0` badge renders with destructive styling when shortfall is zero

**File:** `src/components/catalog/card-item.tsx:283-285`
**Issue:** In `want-list` mode the `SHORT {shortfall}` chip (line 283–285) always renders with `bg-destructive text-destructive-foreground` regardless of the `shortfall` value. When `shortfall === 0` the user sees a red "SHORT 0" badge, suggesting a problem where none exists. The fix for CR-01 will hide the red border, but this badge is always-visible (outside the hover overlay) and is not gated on `hasShortfall`.

**Fix:** Conditionally switch styling based on shortfall value, or suppress the chip entirely when zero:
```tsx
{shortfall > 0 ? (
  <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-sm whitespace-nowrap">
    SHORT {shortfall}
  </span>
) : (
  <span className="bg-green-100 text-green-800 text-[10px] font-bold px-1.5 py-0.5 rounded-sm whitespace-nowrap">
    OK
  </span>
)}
```

---

### WR-03: `pushState` called every time `isDirty` transitions to `true`, stacking history entries

**File:** `src/components/decks/deck-builder.tsx:161-174`
**Issue:** The `popstate` guard effect (lines 161–174) calls `window.history.pushState` once each time `isDirty` changes from `false` to `true`. In normal use this happens once per edit session. However, if a save fails (API error) and the user continues editing, `isDirty` can toggle `false → true` again after each save attempt, stacking additional history entries. Each extra entry requires an additional back-button press to actually leave the page — the user's browser history is corrupted silently. Additionally, the popstate handler closure captures `handlePopState` by reference but the event is removed only via the cleanup function; any `pushState` call inside the handler (line 169) creates another entry without registering another listener, but the accumulation of pushState entries remains.

**Fix:** Track whether the sentinel entry has already been pushed using a ref, so `pushState` is called at most once per component mount:
```typescript
const historyPushedRef = useRef(false);

useEffect(() => {
  if (!isDirty) return;
  if (!historyPushedRef.current) {
    window.history.pushState(null, '', window.location.href);
    historyPushedRef.current = true;
  }
  const handlePopState = () => { ... };
  window.addEventListener('popstate', handlePopState);
  return () => window.removeEventListener('popstate', handlePopState);
}, [isDirty]);
```

---

### WR-04: `res.json()` called without error handling on 400 response

**File:** `src/components/decks/deck-builder.tsx:304-306`
**Issue:** When the server returns HTTP 400, the code calls `await res.json()` (line 305) and immediately accesses `data.errors`. If the response body is not valid JSON (e.g., a plain-text error from a reverse proxy or Next.js middleware), this throws an unhandled exception that is swallowed silently: the outer `try/catch` (line 310) would catch it and show "Network error", masking the 400 status and making debugging harder.

**Fix:**
```typescript
} else if (res.status === 400) {
  try {
    const data = await res.json();
    setApiErrors(data.errors || ['Failed to save deck']);
  } catch {
    setApiErrors(['Failed to save deck (bad response)']);
  }
}
```

---

## Info

### IN-01: `console.error` in production save path

**File:** `src/components/decks/deck-builder.tsx:311`
**Issue:** `console.error('Failed to save deck', err)` is left in the network-error catch block. In production this leaks internal error details to the browser console. The error is already surfaced to the user via `setApiErrors`.

**Fix:** Remove or guard behind a `process.env.NODE_ENV === 'development'` check.

---

### IN-02: Nested overlay `div` is redundant markup in the `isReadOnly` branch

**File:** `src/components/catalog/card-item.tsx:124-128`
**Issue:** The `isReadOnly` branch renders a `<div>` that fully duplicates the positioning, opacity, transition, and background of its parent (see WR-01). Even after fixing the visual double-overlay, the inner wrapper is unnecessary — the content can be rendered directly into the outer overlay div. This adds a gratuitous DOM node per read-only card item.

**Fix:** Inline the name span directly inside the outer hover wrapper div (no inner wrapper needed), as described in WR-01.

---

_Reviewed: 2026-05-29T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

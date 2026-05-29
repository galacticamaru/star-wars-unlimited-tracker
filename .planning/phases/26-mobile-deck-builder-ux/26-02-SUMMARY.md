---
phase: 26-mobile-deck-builder-ux
plan: "02"
subsystem: deck-builder-mobile
tags: [mobile-ux, sheet, sticky-bar, responsive, height-fix]
completed_date: "2026-05-29"
duration_minutes: 15

dependency_graph:
  requires: ["26-01"]
  provides:
    - "Mobile sticky summary bar (md:hidden fixed bottom-0) with Legal/Illegal badge + card counts"
    - "Bottom Sheet (SheetContent side=bottom) containing full DeckSidebar — portaled to document.body"
    - "Inline DeckSidebar wrapped in hidden md:flex for desktop-only rendering"
    - "Root container height formula: h-[calc(100dvh-56px)] md:h-[calc(100svh-56px)]"
    - "Mobile hoveredCard bar removed; desktop preview panel preserved"
    - "DeckSidebar root class: h-auto md:h-full for dual-context rendering"
    - "Wave 1 GREEN: MOBILE-01 and MOBILE-04 stubs passing"
  affects:
    - "src/components/decks/deck-builder.tsx"
    - "src/components/decks/deck-sidebar.tsx"
    - "src/components/decks/deck-builder.test.tsx"

tech_stack:
  added: []
  patterns:
    - "React Fragment wrapper to place Sheet outside overflow-hidden container (D-04 / Pitfall 1)"
    - "SheetTrigger render prop pattern (base-ui Dialog — NOT asChild)"
    - "validateDeck lifted into DeckBuilder for sticky bar validation sync"
    - "hidden md:flex wrapper for inline sidebar (desktop-only)"
    - "dvh (mobile, keyboard-safe) vs svh (desktop, stable) height formula"

key_files:
  created: []
  modified:
    - src/components/decks/deck-builder.tsx
    - src/components/decks/deck-sidebar.tsx
    - src/components/decks/deck-builder.test.tsx

decisions:
  - "validateDeck lifted into DeckBuilder (Option A from plan) — ensures sticky bar and Sheet sidebar badge stay in sync"
  - "Sheet placed as Fragment sibling of overflow-hidden div to avoid SheetContent clipping (D-04)"
  - "DeckSidebar root h-full → h-auto md:h-full so it works both inside Sheet (h-auto parent) and inline on desktop (flex h-full parent)"
  - "Mobile hoveredCard bar deleted; state + desktop preview panel kept intact (D-03)"

metrics:
  tasks_completed: 2
  tasks_total: 2
  files_created: 0
  files_modified: 3
---

# Phase 26 Plan 02: Mobile Sticky Bar + Sheet Sidebar Summary

## One-liner

Bottom Sheet with sticky summary bar (Legal/Illegal badge + card counts) replaces the removed mobile hoveredCard bar, desktop inline sidebar wrapped in hidden md:flex, and root height fixed to dvh/svh for keyboard safety.

## What Was Built

### Task 1 — `src/components/decks/deck-sidebar.tsx` (modified)

Changed DeckSidebar root div className from `flex flex-col h-full ...` to `flex flex-col h-auto md:h-full ...`.

- `h-auto` at mobile: inside SheetContent (h-auto parent), sizes to content rather than collapsing to 0
- `md:h-full` at desktop: inside DeckBuilder's `flex h-[calc(100svh-56px)]` flex container, stretches to fill height as before
- No prop changes, no API changes, no other edits

### Task 2 — `src/components/decks/deck-builder.tsx` + `deck-builder.test.tsx` (modified)

Seven changes applied to deck-builder.tsx:

1. **Height fix (D-12):** Root container uses `h-[calc(100dvh-56px)] md:h-[calc(100svh-56px)]` — `dvh` shrinks when virtual keyboard appears on mobile; `svh` stays stable on desktop.

2. **Inline sidebar wrapper (D-05, MOBILE-04):** Existing `<DeckSidebar>` at bottom of JSX wrapped in `<div className="hidden md:flex">` — invisible on mobile, rendered on desktop.

3. **React Fragment (D-04):** Return wrapped in `<>...</>` so the new `<Sheet>` is a sibling of the `<div className="flex ... overflow-hidden">` container, not a child. Prevents SheetContent from being clipped.

4. **Sticky summary bar + Sheet (D-01, D-02, D-11, MOBILE-01):**
   - `<SheetTrigger render={<button className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t z-50 flex items-center gap-4 px-4 w-full text-left" aria-label="Open deck stats" />}>` contains the Legal/Illegal Badge and `{totalMain}/50 main · {sideboardTotal}/10 SB` span
   - `<SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto">` wraps DeckSidebar in `<div className="w-full">`

5. **Real validation in sticky bar (D-01):** `validateDeck` imported and called via `useMemo([leader, base, mainDeck, sideboard])` in DeckBuilder. `totalMain` useMemo added. Badge and counts use live computed state.

6. **Remove hoveredCard mobile bar (D-03):** Deleted the `{hoveredCard && (<div className="md:hidden fixed bottom-0 ... h-24">` JSX block. `useState<Card | null>` for hoveredCard, all `onMouseEnter/onMouseLeave/onFocus/onBlur/onTouchStart` handlers, and the desktop preview panel (`hidden md:block w-48 shrink-0 sticky top-0`) are all preserved.

7. **Imports:** Added `validateDeck` to `@/lib/deck-validation` import; `CheckCircle2, AlertCircle` to lucide-react import; new imports for `Sheet, SheetTrigger, SheetContent` and `Badge`.

Three Wave 0 stubs in deck-builder.test.tsx converted to passing `it(...)` tests:
- `MOBILE-01: renders sticky summary bar...` — asserts `getByLabelText('Open deck stats')` returns a button with `md:hidden`, `fixed`, `bottom-0`, `h-14`, `z-50` in className
- `MOBILE-01: Sheet is not visible initially...` — asserts `queryAllByText('Cost Curve').length < 2` (Sheet not auto-opened)
- `MOBILE-04: inline DeckSidebar wrapper has class "hidden md:flex"...` — asserts `container.querySelector('div.hidden.md\\:flex')` is not null and contains "Test Deck"

Two remaining stubs (`MOBILE-02`, `MOBILE-03`) remain as `it.todo` for Plans 03 and 04.

## Commits

| Task | Commit | Files |
|------|--------|-------|
| Task 1 | `13b7db0` | `src/components/decks/deck-sidebar.tsx` |
| Task 2 | `59ff85c` | `src/components/decks/deck-builder.tsx`, `src/components/decks/deck-builder.test.tsx` |

## Verification Results

- `npx vitest run src/components/decks/deck-builder.test.tsx` → 3 passed, 2 todo, 0 failed
- `npx vitest run src/components/catalog/card-item.deck.test.tsx` → 4 passed, 1 todo, 0 failed
- Full suite → 11 pre-existing test file failures unchanged (DATABASE_URL missing, legacy jest tests, etc.)
- `npx tsc --noEmit` → 0 errors in modified files; pre-existing errors in `__tests__/` and `tests/` (legacy jest format) confirmed unchanged
- `npm run build` → TypeScript compiled successfully; build error is pre-existing (DATABASE_URL not set for page data collection at build time)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All functional changes produce real rendered output (Badge, counts span, Sheet trigger button). The two remaining `it.todo` stubs (`MOBILE-02`, `MOBILE-03`) are intentional pending markers for Plans 03 and 04 — they do not represent functional stubs in the implementation.

## Threat Flags

None. This plan introduces no new network endpoints, auth paths, file access patterns, or schema changes. The sticky bar and Sheet are entirely client-side UI.

## Self-Check: PASSED

- `src/components/decks/deck-builder.tsx` modified: FOUND
- `src/components/decks/deck-sidebar.tsx` modified: FOUND
- `src/components/decks/deck-builder.test.tsx` modified: FOUND
- Commit `13b7db0` exists: FOUND
- Commit `59ff85c` exists: FOUND
- `deck-builder.tsx` contains `h-[calc(100dvh-56px)] md:h-[calc(100svh-56px)]`: VERIFIED
- `deck-builder.tsx` contains `md:hidden fixed bottom-0 left-0 right-0 h-14`: VERIFIED
- `deck-builder.tsx` contains `max-h-[80dvh] overflow-y-auto`: VERIFIED
- `deck-builder.tsx` contains `hidden md:flex`: VERIFIED
- `deck-builder.tsx` contains `SheetTrigger` and `SheetContent side="bottom"`: VERIFIED
- `deck-builder.tsx` contains `validateDeck(`: VERIFIED
- `deck-builder.tsx` contains `aria-label="Open deck stats"`: VERIFIED
- `deck-builder.tsx` does NOT contain `hoveredCard && (` mobile bar: VERIFIED
- `deck-builder.tsx` contains `hidden md:block w-48 shrink-0 sticky top-0` (desktop preview): VERIFIED
- `deck-sidebar.tsx` contains `h-auto md:h-full`: VERIFIED
- `deck-builder.test.tsx` has exactly 2 `it.todo(`: VERIFIED
- `deck-builder.test.tsx` has exactly 3 `it(`: VERIFIED
- `npx vitest run src/components/decks/deck-builder.test.tsx` exits 0, 3 passed + 2 todo: VERIFIED

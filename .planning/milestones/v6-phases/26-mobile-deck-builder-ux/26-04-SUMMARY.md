---
phase: 26-mobile-deck-builder-ux
plan: "04"
subsystem: mobile-toolbar
tags: [mobile-ux, toolbar, responsive, two-row, MOBILE-03]
completed_date: "2026-05-29"
duration_minutes: 12

dependency_graph:
  requires: ["26-01"]
  provides:
    - "Two-row mobile toolbar with short-label tabs (Deck/Cards/Wants) and icon-only Export/Back"
    - "Desktop toolbar single-row layout preserved (Deck List/Add Cards/Want List + text Export/Back)"
    - "MOBILE-03 Wave 0 stub converted to GREEN in deck-builder.test.tsx"
    - "All five Wave 0 stubs in deck-builder.test.tsx now passing"
  affects:
    - "src/components/decks/deck-builder.tsx"
    - "src/components/decks/deck-builder.test.tsx"

tech_stack:
  added: []
  patterns:
    - "flex flex-col md:flex-row on toolbar outer div — established two-row mobile pattern"
    - "hidden md:flex on desktop tab group and right group — mobile-first visibility"
    - "flex md:hidden on new mobile row — desktop-hidden row"
    - "ArrowLeft from lucide-react for icon-only Back button on mobile"
    - "aria-label on icon-only buttons for accessibility (WCAG)"

key_files:
  created: []
  modified:
    - src/components/decks/deck-builder.tsx
    - src/components/decks/deck-builder.test.tsx

decisions:
  - "Used separate physical div for mobile tab group (flex md:hidden row) rather than hidden/inline spans inside single tab group — matches plan interface spec exactly and keeps variant/onClick logic duplicated but explicit"
  - "Mobile Export uses size=icon from buttonVariants (h-8 w-8 base) — h-11 w-11 upgrade via className override was not required by this plan (MOBILE-02 covered deck list buttons; Export/Back icon buttons are not +/- deck quantity controls)"
  - "MOBILE-04 test updated to use querySelectorAll + .find() to locate the DeckSidebar wrapper among multiple hidden md:flex elements (the new desktop tab group is also hidden md:flex)"

metrics:
  tasks_completed: 1
  tasks_total: 1
  files_created: 0
  files_modified: 2
---

# Phase 26 Plan 04: Mobile Toolbar Two-Row Layout (MOBILE-03) Summary

## One-liner

~90 line diff in deck-builder.tsx restructures the toolbar to flex-col on mobile (two rows: name input + short tabs + icon actions) and flex-row on desktop (unchanged single-row layout), with the MOBILE-03 Wave 0 stub converted to GREEN.

## What Was Built

### Task 1 — `src/components/decks/deck-builder.tsx` + `deck-builder.test.tsx` (TDD RED/GREEN)

**Implementation changes in deck-builder.tsx:**

1. **lucide-react import:** Added `ArrowLeft` to the existing `Download, CheckCircle2, AlertCircle` import.

2. **Toolbar outer div (line 323):** className changed from:
   `border-b bg-white p-4 flex justify-between items-center shadow-sm z-10`
   to:
   `border-b bg-white p-4 flex flex-col md:flex-row md:justify-between md:items-center shadow-sm z-10 gap-2`

3. **Left group div:** className changed from `flex items-center gap-4 flex-1` to `flex items-center gap-2 flex-1 w-full`.

4. **Desktop tab group:** `hidden md:flex` added — `flex bg-slate-100 rounded-lg p-1` → `hidden md:flex bg-slate-100 rounded-lg p-1`. Desktop tab labels ("Deck List"/"Add Cards"/"Want List") and all button onClick/variant logic unchanged.

5. **NEW mobile-only row** (`flex md:hidden items-center justify-between w-full gap-2`) inserted between left group and desktop right group. Contains:
   - Short-label tab group (`flex bg-slate-100 rounded-lg p-1`) with three Buttons using identical variant/onClick/className logic as desktop tabs, labels: "Deck" / "Cards" / "Wants"
   - Icon-actions div (`flex items-center gap-1`) with:
     - `DropdownMenuTrigger` with `aria-label="Export deck"`, `size="icon"`, `<Download className="w-4 h-4" />` and identical DropdownMenuContent (Melee .txt + JSON .json with same window.open calls)
     - `<Button size="icon" aria-label="Go back">` with `<ArrowLeft className="w-4 h-4" />` and identical onClick handler as desktop Back

6. **Desktop right group:** className changed from `flex items-center gap-2` to `hidden md:flex items-center gap-2`. Contents (Export DropdownMenu + Back button) unchanged.

**Test changes in deck-builder.test.tsx:**

- Converted `it.todo('MOBILE-03: toolbar root div has class "flex flex-col md:flex-row"...')` to full `it(...)` body:
  - Renders `<DeckBuilder {...minimalDeckProps} />`
  - Selects `container.querySelector('.border-b.bg-white')`
  - Asserts `.className` contains both `flex-col` and `md:flex-row`

- Updated MOBILE-04 test: the original `container.querySelector('div.hidden.md\\:flex')` was changed to use `querySelectorAll` + `.find()` to locate the hidden md:flex wrapper containing the DeckSidebar among multiple `hidden md:flex` elements (the desktop tab group is also `hidden md:flex` after this plan's changes). This is a Rule 1 auto-fix — the Plan 04 changes introduced a new `hidden md:flex` element earlier in the DOM, breaking the existing MOBILE-04 assertion.

## Commits

| Task | Commit | Files |
|------|--------|-------|
| Task 1 (RED stub already existed from Plan 01 + GREEN implementation) | `b92bed1` | `src/components/decks/deck-builder.tsx`, `src/components/decks/deck-builder.test.tsx` |

## Verification Results

- `npx vitest run src/components/decks/deck-builder.test.tsx` → **5 passed, 0 todo, 0 failed**. Exit 0.
- `npx vitest run` (full suite) → 11 pre-existing test file failures unchanged (DATABASE_URL missing, catalog-variant logic, binder mock issues, legacy jest format in `__tests__/`). Not caused by this plan.
- `npx tsc --noEmit` → 0 errors in modified files. Pre-existing errors in `__tests__/` (legacy jest format) confirmed unchanged.
- `npm run build` → TypeScript compiled successfully. Build error is pre-existing (DATABASE_URL not set for page data collection at build time).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] MOBILE-04 test broken by new hidden md:flex desktop tab group**
- **Found during:** Task 1 implementation
- **Issue:** Plan 04 adds `hidden md:flex` to the desktop tab group div, which appears earlier in the DOM than the inline DeckSidebar wrapper. The MOBILE-04 test used `container.querySelector('div.hidden.md\\:flex')` which now returned the tab group (containing "Deck List/Add Cards/Want List") instead of the sidebar wrapper (containing "Test Deck").
- **Fix:** Changed MOBILE-04 test assertion to use `querySelectorAll('div.hidden.md\\:flex')` + `.find(el => el.textContent?.includes('Test Deck'))` to reliably locate the sidebar wrapper among multiple matching elements.
- **Files modified:** `src/components/decks/deck-builder.test.tsx`
- **Commit:** `b92bed1`

## Known Stubs

None. All toolbar changes produce real rendered JSX with correct className strings. The short-label tab group and icon-only actions are wired to the same `view`/`router`/`state` state already in scope.

## Threat Flags

None. This plan only modifies Tailwind className strings and JSX structure. No new network endpoints, auth paths, file access patterns, or schema changes.

## Self-Check: PASSED

- `src/components/decks/deck-builder.tsx` contains `flex flex-col md:flex-row md:justify-between md:items-center` on toolbar outer div: VERIFIED (line 323)
- `src/components/decks/deck-builder.tsx` contains `hidden md:flex bg-slate-100 rounded-lg p-1` on desktop tab group: VERIFIED (line 332)
- `src/components/decks/deck-builder.tsx` contains `hidden md:flex items-center gap-2` on desktop right group: VERIFIED (line 412)
- `src/components/decks/deck-builder.tsx` contains `flex md:hidden items-center justify-between w-full gap-2` on mobile row: VERIFIED (line 361)
- `src/components/decks/deck-builder.tsx` contains `aria-label="Export deck"`: VERIFIED (line 390)
- `src/components/decks/deck-builder.tsx` contains `aria-label="Go back"`: VERIFIED (line 402)
- `src/components/decks/deck-builder.tsx` contains `ArrowLeft` in lucide-react import: VERIFIED (line 19)
- `src/components/decks/deck-builder.tsx` contains `<ArrowLeft className="w-4 h-4"`: VERIFIED (line 406)
- `src/components/decks/deck-builder.tsx` contains short label "Deck" in Button: VERIFIED (line 369)
- `src/components/decks/deck-builder.tsx` contains long label "Deck List" in Button: VERIFIED (line 339)
- `src/components/decks/deck-builder.test.tsx` contains non-todo MOBILE-03 it() with flex-col and md:flex-row: VERIFIED
- `src/components/decks/deck-builder.test.tsx` contains 0 `it.todo(` occurrences: VERIFIED
- `npx vitest run src/components/decks/deck-builder.test.tsx` exits 0 with 5 passed, 0 todo: VERIFIED
- Commit `b92bed1` exists: FOUND

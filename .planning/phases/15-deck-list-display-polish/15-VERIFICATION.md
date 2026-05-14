---
phase: 15-deck-list-display-polish
verified: 2026-05-14T12:30:00Z
status: human_needed
score: 6/6 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 6/6
  gaps_closed: []
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Open a deck with a leader and base selected. Navigate to the Deck List tab."
    expected: "Both the leader and base slots show full card art images (not text names). Art fills the slot with correct aspect ratio."
    why_human: "next/image rendering, CDN reachability, and visual appearance cannot be verified without a browser."
  - test: "Hover over the leader art image in the Deck List tab."
    expected: "A dark overlay with a 'Remove' button fades in. Clicking 'Remove' clears the slot back to the 'No Leader Selected' placeholder."
    why_human: "CSS group-hover:opacity-100 Tailwind transition and click dispatch require browser interaction."
  - test: "On desktop, hover over a card row in a type-grouped section (e.g., a Ground Unit)."
    expected: "The card's art appears in the 192px preview panel to the left of the card list. Moving the mouse away empties the panel."
    why_human: "onMouseEnter/onMouseLeave state interaction and Image render must be observed in a browser."
  - test: "On a mobile device (or Chrome devtools mobile mode), tap any card row."
    expected: "A fixed bottom bar (h-24) appears at the bottom of the screen showing the card's art thumbnail and name."
    why_human: "onTouchStart handler and fixed-position mobile bar require a touch-capable viewport to verify."
  - test: "Open a deck that contains cards with multiple non-Basic aspects (e.g., Aggression + Command). Check the right sidebar."
    expected: "An 'Aspects' panel appears between the Types/Arenas grid and the Save buttons, listing each non-Basic aspect with its count, sorted highest first. 'Basic' does not appear."
    why_human: "Panel position, visual style, and correct data require visual inspection in a browser with real deck data."
---

# Phase 15: Deck List Display Polish — Verification Report

**Phase Goal:** The deck list view is visually rich — cards are grouped by type, the sidebar shows aspect distribution, and art appears on every card row
**Verified:** 2026-05-14T12:30:00Z
**Status:** human_needed
**Re-verification:** Yes — confirming prior human_needed result (no regressions, no gaps closed)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | The Deck List tab renders separate sections for Ground Units, Space Units, Upgrades, Events (and Other), each with its own header showing the group's total card count | VERIFIED | `deck-builder.tsx` line 203: `groupDeckCards(mainDeck)` useMemo. Lines 458–513: five section keys rendered via `.map()`, each as `<section aria-label={label}>` with `<h3>` header `{label} ({group.reduce(...)})`. Empty sections suppressed: `if (group.length === 0) return null`. |
| 2 | The flat "Main Deck (N)" heading and single card list are gone | VERIFIED | Grep for "Main Deck (" in `deck-builder.tsx` returns zero matches. The flat `mainDeck.map()` block is fully replaced by the grouped sections render. |
| 3 | Leader/Base slots show full card art via Image fill when frontArtUrl is non-null; null guard prevents broken images | VERIFIED | `deck-builder.tsx` line 372: `leader?.frontArtUrl` three-branch conditional — art (Image fill) → selected-no-art (text fallback) → empty placeholder. Line 412: identical `base?.frontArtUrl` pattern. Both `aria-label` Remove buttons present (lines 386, 426). |
| 4 | Hovering any card row shows art in desktop preview panel; mobile tap shows fixed bottom bar; hoveredCard state wires it all | VERIFIED | Line 129: `useState<Card | null>(null)`. Line 351: desktop panel `hidden md:block w-48 shrink-0 sticky top-0` with `aria-live="polite"`. Lines 480–484: card rows have all five handlers (`onMouseEnter`, `onMouseLeave`, `onFocus`, `onBlur`, `onTouchStart`). Line 564: mobile bar `md:hidden fixed bottom-0 left-0 right-0 h-24`. |
| 5 | Deck sidebar contains an Aspects panel using filterAndSortAspects; Basic excluded; sorted descending; conditionally hidden when empty | VERIFIED | `deck-sidebar.tsx` line 8: `import { filterAndSortAspects } from '@/lib/aspect-panel'`. Line 184: IIFE calls `filterAndSortAspects(validation.stats.aspectCounts)`, returns null when `aspects.length === 0`. Line 188: heading "Aspects". No inline `aspect !== 'Basic'` in sidebar. Aspects panel placed after Types/Arenas grid and before `mt-auto` save buttons. |
| 6 | groupDeckCards() exported from src/lib/deck-grouping.ts; filterAndSortAspects() exported from src/lib/aspect-panel.ts; both are substantive implementations | VERIFIED | `src/lib/deck-grouping.ts`: 41 lines, exports `groupDeckCards` and `GroupedDeck` interface, uses `card.arenas ?? []` null guard, classifies into 5 named buckets. `src/lib/aspect-panel.ts`: 14 lines, exports `filterAndSortAspects`, filters `aspect !== 'Basic'`, sorts `b - a` descending. Neither is a stub. |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/deck-grouping.ts` | groupDeckCards() pure function + GroupedDeck interface | VERIFIED | 41 lines. Exports both. Uses `card.arenas ?? []` null guard. Classifies Ground/Space by arenas, not type alone. |
| `src/lib/aspect-panel.ts` | filterAndSortAspects() pure function | VERIFIED | 14 lines. Exports `filterAndSortAspects`. Filters Basic, sorts descending. |
| `src/components/decks/deck-builder.tsx` | groupedDeck useMemo + grouped section render + hoveredCard state + Image fill slots + preview panel + mobile bar | VERIFIED | 609 lines. All features present and wired. `import Image from 'next/image'` at line 4. `import { groupDeckCards }` at line 6. |
| `src/components/decks/deck-sidebar.tsx` | Aspects panel using filterAndSortAspects | VERIFIED | 220 lines. Import at line 8. IIFE panel at lines 183–199. Correct placement between Types/Arenas grid and mt-auto save buttons. |
| `__tests__/deck-grouping.test.ts` | 8 unit tests for groupDeckCards | VERIFIED | 73 lines. 8 test cases: Ground unit, Space unit, Upgrade, Event, unknown/other, empty input, frontArtUrl=null no-throw, no Ground units. |
| `__tests__/aspect-panel.test.ts` | 5 unit tests for filterAndSortAspects | VERIFIED | 35 lines. 5 test cases: excludes Basic, descending sort, empty input, all-Basic returns empty, all non-Basic returned. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| deck-builder.tsx groupedDeck | mainDeck useMemo | `useMemo(() => groupDeckCards(mainDeck), [mainDeck])` | WIRED | Line 203: `mainDeck` in dependency array confirmed |
| deck-builder.tsx grouped render | groupedDeck | `groupedDeck[key]` lookup per section | WIRED | Line 467: `const group = groupedDeck[key]` used in all five sections |
| card rows | hoveredCard state | `onMouseEnter={() => setHoveredCard(item.card)}` | WIRED | Lines 480–484: all five event handlers on each card row div |
| leader slot | next/image Image fill | `leader?.frontArtUrl` conditional | WIRED | Line 372: null guard present; Image at line 375 with `fill` and `sizes` props |
| base slot | next/image Image fill | `base?.frontArtUrl` conditional | WIRED | Line 412: null guard present; Image at line 415 with `fill` and `sizes` props |
| preview panel | hoveredCard state | `hoveredCard?.frontArtUrl` conditional render | WIRED | Line 352: `{hoveredCard?.frontArtUrl ? ( <Image ... /> ) : null}` |
| deck-sidebar.tsx Aspects panel | validation.stats.aspectCounts | `filterAndSortAspects(validation.stats.aspectCounts)` | WIRED | Line 184: data flows directly from validateDeck() stats output |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| deck-builder.tsx grouped sections | `groupedDeck` | `groupDeckCards(mainDeck)` ← `state.cards` ← `initialDeck` server prop | Yes — classifies real card data from server-fetched allCards prop | FLOWING |
| deck-builder.tsx preview panel | `hoveredCard` | `setHoveredCard(item.card)` on mouse/touch events; card reference from allCards | Yes — `frontArtUrl` from DB via server-fetched allCards prop | FLOWING |
| deck-sidebar.tsx Aspects panel | `aspects` | `filterAndSortAspects(validation.stats.aspectCounts)` ← `validateDeck(leader, base, mainDeck, sideboard)` | Yes — aspectCounts computed from actual deck cards via validateDeck() | FLOWING |

### Behavioral Spot-Checks

Step 7b: Skipped for visual UI components — all checkable behaviors require browser interaction. Data-layer wiring is fully verified above.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|------------|-------------|-------------|--------|----------|
| REQ-DECK-07 | 15-01-PLAN.md | User can view Deck List tab with cards grouped by type (Ground Units, Space Units, Upgrades, Events) | SATISFIED | `deck-builder.tsx` renders five named type-group sections with headers and counts; empty groups suppressed; `groupDeckCards` uses `card.arenas[]` not `card.type` alone |
| REQ-DECK-08 | 15-03-PLAN.md | User can see aspect pip breakdown panel in deck stats sidebar | SATISFIED | `deck-sidebar.tsx` Aspects panel with `filterAndSortAspects`, sorted descending, Basic excluded, conditionally hidden when empty |
| REQ-DECK-10 | 15-02-PLAN.md | User sees leader and base card images in Deck List tab; card art appears on hover for all deck card rows | SATISFIED (programmatic) — visual verification pending human | Image fill slots with three-branch null guard in deck-builder.tsx; hover preview panel and mobile bar wired to hoveredCard state |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | — | — | No anti-patterns found |

No TODO/FIXME/placeholder comments in modified files. No empty handler stubs. No `return null` placeholders in rendering paths. No hardcoded empty arrays flowing to visible output. The old "Main Deck (N)" flat heading is confirmed absent.

### Human Verification Required

#### 1. Leader and Base Card Art Display

**Test:** Open a deck with a leader and base already selected. Navigate to the "Deck List" tab.
**Expected:** Both the leader slot and base slot display the full card art image (not the card name as text). The art fills the slot area with correct aspect ratio (3:4 for leader, 3:4 on mobile / 4:3 on desktop for base).
**Why human:** `next/image` rendering, CDN reachability (cdn.swu-db.com), and visual fill appearance require a browser with a live database connection.

#### 2. Hover Overlay Remove Button on Leader/Base Art

**Test:** With art displayed in the leader slot, hover over the image with a mouse cursor.
**Expected:** A dark translucent overlay fades in over the art with a "Remove" button centered on it. Clicking "Remove" clears the slot and shows "No Leader Selected". Verify the same for the base slot.
**Why human:** The CSS `group-hover:opacity-100` Tailwind transition and click dispatch (SET_LEADER null) require browser hover interaction to observe.

#### 3. Desktop Hover Art Preview Panel

**Test:** On a desktop-width viewport, hover over any card row in a type-grouped section (e.g., a Ground Unit row).
**Expected:** The card's art appears in the 192px-wide sticky panel to the left of the card list. Moving the mouse off the row empties the panel (no image shown). Verify at least two different card rows trigger the preview correctly.
**Why human:** `onMouseEnter`/`onMouseLeave` state transitions and Image render cannot be verified without browser interaction.

#### 4. Mobile Fixed Bottom Bar on Card Row Tap

**Test:** On a mobile device or Chrome DevTools mobile mode (< 768px), tap any card row in a type-grouped section.
**Expected:** A fixed bottom bar (height 96px) appears at the bottom of the screen showing a small thumbnail of the card art (56px wide) and the card name. Tapping a different row updates the bar.
**Why human:** `onTouchStart` handler and fixed-position overlay require a touch viewport to verify correctly.

#### 5. Aspects Panel in Sidebar with Real Deck Data

**Test:** Open a deck that contains cards with multiple non-Basic aspects (e.g., Aggression and Command cards). Look at the right sidebar below the Arenas section.
**Expected:** An "Aspects" panel appears, listing each aspect name on the left and its numeric count on the right, sorted highest count first. "Basic" does not appear in the list. The panel is absent entirely from a deck with only Basic-aspect cards (e.g., a brand-new empty deck with only a base selected).
**Why human:** Panel position, correct sorting from real `aspectCounts`, and conditional visibility require visual inspection in a running browser with real data.

### Gaps Summary

No gaps. All 6 automated must-haves are verified with no regressions from the prior verification. The 5 items above require human browser verification before the phase can be declared fully complete. These are standard UI behavioral checks that cannot be resolved programmatically.

---

_Verified: 2026-05-14T12:30:00Z_
_Verifier: Claude (gsd-verifier)_

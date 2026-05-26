# Phase 15: Deck List Display Polish - Research

**Researched:** 2026-05-14
**Domain:** React component composition, Tailwind CSS layout, Next.js Image (fill mode), deck-builder view refactor
**Confidence:** HIGH

---

## Summary

Phase 15 is a pure frontend component-composition phase. No API changes, no schema changes, no new libraries. All three features (type grouping, aspect panel, art display) operate on data already present in the `DeckBuilder` component tree.

The `mainDeck: DeckCard[]` array and `validation.stats.aspectCounts` are already computed and available. The `Card.arenas[]` field is the only discriminator needed to split Ground vs Space units — the `type` field is just `"Unit"` for both. The `frontArtUrl` field is present on every `Card` object flowing through `DeckBuilder`.

The hover-art preview panel is the most structurally significant change: it requires wrapping the editor view's main content in a `flex flex-row` layout and adding a sibling panel element. The leader/base art slots require replacing their inner `div.text-center.p-4` content with an `<Image fill>` plus hover-overlay pattern. The aspect panel requires inserting a new `<div>` block in `deck-sidebar.tsx` between the types/arenas grid and the save buttons.

**Primary recommendation:** Implement in 3 isolated plans: (1) type grouping, (2) leader/base art slots + hover preview, (3) aspect panel in sidebar. Each plan touches a single concern and can be verified independently.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Group main deck cards into 4 sections: Ground Units (type="Unit" AND arenas includes "Ground"), Space Units (type="Unit" AND arenas includes "Space"), Upgrades (type="Upgrade"), Events (type="Event"). A catch-all "Other" section captures anything that doesn't fit.
- **D-02:** Hide empty sections entirely — do not render a section header when its card count is 0.
- **D-03:** Group derivation uses the `arenas[]` array on the card, NOT the `type` field alone.
- **D-04:** Add an "Aspects" panel to deck sidebar, styled identically to existing Types/Arenas breakdown panels.
- **D-05:** Exclude the "Basic" aspect from the panel.
- **D-06:** Show numeric counts. `aspectCounts` is already in `ValidationStats` — no new validation logic.
- **D-07:** Replace text-only content in the leader/base dashed box with a full card image using `frontArtUrl`. Box dimensions stay the same.
- **D-08:** Use `frontArtUrl` for both leaders and bases.
- **D-09:** Empty slot (no card selected) keeps existing placeholder unchanged.
- **D-10:** Show Remove action as overlay button on hover over the card image — same hover-overlay pattern as `card-item.tsx`.
- **D-11:** Hover preview panel sits to the LEFT of the card list, within the Deck List tab area.
- **D-12:** Show `frontArtUrl` only (no back-face logic).
- **D-13:** Trigger on mouseenter (desktop) AND tap/focus (mobile).
- **D-14:** When no row is hovered, preview panel is empty/hidden.

### Claude's Discretion
None declared.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-DECK-07 | User can view the Deck List tab with cards grouped by type section (Ground Units, Space Units, Upgrades, Events) | `useMemo` derivation from `mainDeck`, group logic on `card.arenas`, conditional render per group |
| REQ-DECK-08 | User can see an aspect pip breakdown panel in the deck stats sidebar showing distribution across all aspects | `validation.stats.aspectCounts` already computed; insert sidebar panel between types/arenas grid and save buttons |
| REQ-DECK-10 | User sees leader and base card images in the Deck List tab, and card art appears on hover for all deck card rows | Next.js `Image` with `fill` + `object-cover`, `useState<Card | null>` for hover state, flex layout wrapper for preview panel |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Type-group derivation (Ground/Space/Upgrade/Event) | Browser / Client | — | Pure in-memory transform on `mainDeck[]`; no server call needed |
| Aspect breakdown panel | Browser / Client | — | `aspectCounts` already in validation result; sidebar render only |
| Leader/Base art display | Browser / Client | CDN / Static | Image renders client-side; CDN (`cdn.swu-db.com`) serves the art files |
| Hover art preview state | Browser / Client | — | `useState<Card | null>` local to `DeckBuilder`; no server involvement |
| Mobile tap preview (fixed bottom bar) | Browser / Client | — | CSS + React state; no backend |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.4 | Component state, `useState`, `useMemo` | Already in project |
| next/image | 16.2.4 | Optimized image rendering with `fill` | Required by AGENTS.md; already used in card-item.tsx |
| Tailwind CSS v4 | ^4 | Layout utilities, hover states, transitions | Project standard |
| lucide-react | ^1.14.0 | Icons (no new icons needed in this phase) | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn Button | installed | Row action buttons | All interactive buttons — no change to existing |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tailwind `invisible` | conditional render (`{hoveredCard && ...}`) | Both work. `invisible` preserves layout width. Conditional render collapses panel when empty. UI-SPEC D-14 says "empty/hidden state" — conditional render is simpler and matches spec intent. |
| `group-hover` Tailwind for overlay | JS `onMouseEnter` state | `group-hover` is CSS-only and sufficient for the leader/base remove overlay (card-item.tsx pattern). JS state is needed for the preview panel (cross-element communication). |

**Installation:** No new packages required.

---

## Architecture Patterns

### System Architecture Diagram

```
DeckBuilder (view === 'editor')
│
├── flex flex-row gap-6
│   ├── [Hover Preview Panel]  ← NEW: w-48 shrink-0, sticky top-0
│   │     useState<Card|null>(hoveredCard)
│   │     {hoveredCard && <Image src={frontArtUrl} fill object-cover />}
│   │     Mobile: fixed bottom bar on tap
│   │
│   └── [Main Content]  ← existing max-w-4xl content, moved inside flex child
│         ├── Leader/Base Grid  ← art slots use Image fill + group hover overlay
│         ├── Type-Group Sections  ← NEW: useMemo → 5 groups, render non-empty
│         │     Ground Units (arenas includes "Ground")
│         │     Space Units  (arenas includes "Space")
│         │     Upgrades     (type === "Upgrade")
│         │     Events       (type === "Event")
│         │     Other        (catch-all)
│         └── Sideboard  ← unchanged
│
└── DeckSidebar
      ├── Cost Curve
      ├── Types / Arenas Grid  ← unchanged
      ├── [Aspect Panel]  ← NEW: after types/arenas grid
      │     aspectCounts filtered (no "Basic"), sorted descending
      └── Save Buttons
```

### Recommended Project Structure
No new files needed. All changes are in:
```
src/
├── components/decks/
│   ├── deck-builder.tsx   ← type grouping, hover preview, leader/base art
│   └── deck-sidebar.tsx   ← aspect breakdown panel
```

### Pattern 1: Type Group Derivation with useMemo

**What:** Derive 5 card groups from `mainDeck` using a single `useMemo` hook.
**When to use:** Any time deck contents change — `mainDeck` already reacts to `state.cards`.
**Example:**
```typescript
// Source: codebase (deck-builder.tsx existing useMemo pattern)
const groupedDeck = useMemo(() => {
  const groups = {
    groundUnits:  [] as DeckCard[],
    spaceUnits:   [] as DeckCard[],
    upgrades:     [] as DeckCard[],
    events:       [] as DeckCard[],
    other:        [] as DeckCard[],
  };
  for (const item of mainDeck) {
    const { card } = item;
    if (card.type === 'Unit' && card.arenas.includes('Ground')) {
      groups.groundUnits.push(item);
    } else if (card.type === 'Unit' && card.arenas.includes('Space')) {
      groups.spaceUnits.push(item);
    } else if (card.type === 'Upgrade') {
      groups.upgrades.push(item);
    } else if (card.type === 'Event') {
      groups.events.push(item);
    } else {
      groups.other.push(item);
    }
  }
  return groups;
}, [mainDeck]);
```

### Pattern 2: Leader/Base Art Slot (filled state)

**What:** Replace the text `div.text-center.p-4` content inside the existing dashed box with `Image fill` + group hover overlay.
**When to use:** When `leader !== null` or `base !== null`.
**Example:**
```typescript
// Source: card-item.tsx hover-overlay pattern [VERIFIED: codebase grep]
// Wrapper becomes: className="aspect-[3/4] border-2 border-dashed rounded-lg overflow-hidden relative group"
{leader ? (
  <div className="relative w-full h-full group">
    <Image
      src={leader.frontArtUrl!}
      alt={leader.name}
      fill
      sizes="(max-width: 768px) 50vw, 192px"
      className="object-cover"
    />
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 flex items-center justify-center">
      <Button
        variant="ghost"
        size="sm"
        className="text-white bg-black/30 hover:bg-black/50 border border-white/20"
        aria-label={`Remove ${leader.name} as leader`}
        onClick={() => dispatch({ type: 'SET_LEADER', payload: null })}
      >
        Remove
      </Button>
    </div>
  </div>
) : (
  <p className="text-slate-400 text-sm">No Leader Selected</p>
)}
```

**Critical:** The outer `<div>` housing the leader slot already has `overflow-hidden`. Add `relative` to it (currently missing — `fill` child requires positioned parent).

### Pattern 3: Hover Preview Panel with useState

**What:** Local `hoveredCard` state in `DeckBuilder`; card rows set it on `onMouseEnter`/`onFocus`, clear it on `onMouseLeave`/`onBlur`.
**When to use:** Desktop hover and keyboard navigation within the card list.
**Example:**
```typescript
// Source: React docs [ASSUMED pattern, standard React]
const [hoveredCard, setHoveredCard] = useState<Card | null>(null);

// Card row:
<div
  key={item.card.id}
  className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors"
  tabIndex={0}
  onMouseEnter={() => setHoveredCard(item.card)}
  onMouseLeave={() => setHoveredCard(null)}
  onFocus={() => setHoveredCard(item.card)}
  onBlur={() => setHoveredCard(null)}
>

// Preview panel (left of main content):
<div className="w-48 shrink-0 sticky top-0">
  {hoveredCard?.frontArtUrl ? (
    <div className="aspect-[2/3] rounded-lg overflow-hidden relative transition-opacity duration-150">
      <Image
        src={hoveredCard.frontArtUrl}
        alt={hoveredCard.name}
        fill
        sizes="192px"
        className="object-cover"
      />
    </div>
  ) : null}
</div>
```

### Pattern 4: Aspect Breakdown Panel in Sidebar

**What:** Insert after the types/arenas grid, before the `mt-auto` save buttons section.
**When to use:** Always rendered (panel is empty/hidden when no cards have non-Basic aspects).
**Example:**
```typescript
// Source: deck-sidebar.tsx existing Types/Arenas pattern [VERIFIED: codebase]
<div>
  <h3 className="text-sm font-semibold uppercase text-slate-500 mb-2">Aspects</h3>
  <div className="space-y-1">
    {Object.entries(validation.stats.aspectCounts)
      .filter(([aspect]) => aspect !== 'Basic')
      .sort(([, a], [, b]) => b - a)
      .map(([aspect, count]) => (
        <div key={aspect} className="flex justify-between text-sm">
          <span className="text-slate-600">{aspect}</span>
          <span className="font-medium">{count}</span>
        </div>
      ))}
  </div>
</div>
```

### Pattern 5: Mobile Fixed Bottom Bar (D-13)

**What:** On screens `< md` (768px), the preview panel does not float left. On tap/focus of a card row, a fixed bottom bar appears with the card art.
**When to use:** Touch events on mobile.
**Example:**
```typescript
// Source: UI-SPEC layout contract [CITED: 15-UI-SPEC.md]
// The preview panel uses responsive Tailwind:
// Desktop: <div className="hidden md:block w-48 shrink-0 sticky top-0">
// Mobile:  <div className="md:hidden fixed bottom-0 left-0 right-0 h-24 bg-white border-t z-50 flex items-center gap-4 px-4">
//   {hoveredCard && <Image ... />}
//   <span>{hoveredCard?.name}</span>
// </div>
```

### Anti-Patterns to Avoid

- **Using `<img>` instead of `next/image`:** The project uses `Image` from `next/image` everywhere. Using raw `<img>` breaks the CDN optimization pipeline (even though `unoptimized: true` is set in next.config.ts, `next/image` is still required per AGENTS.md).
- **Placing `fill` child in a non-positioned parent:** `Image fill` requires the parent to have `position: relative` (or `absolute`/`fixed`). The existing leader/base slot `div` does not currently have `relative` — this must be added. Omitting it causes the image to overflow to the viewport.
- **Using `type` to distinguish Ground vs Space units:** Both share `type === "Unit"`. Use `card.arenas.includes("Ground")` / `card.arenas.includes("Space")` per D-03.
- **Including "Basic" in the aspect panel:** Filter it out per D-05. `aspectCounts` includes "Basic" from `validateDeck()`.
- **Rendering empty group sections:** D-02 requires hiding sections with 0 cards. Check `groups.groundUnits.length > 0` before rendering.
- **Lifting hover state to parent server component:** `DeckBuilder` is a `'use client'` component — `useState` is valid here. No lifting needed.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Aspect data aggregation | Custom loop over mainDeck | `validation.stats.aspectCounts` from `validateDeck()` | Already computed, already React-reactive |
| Image optimization | Raw `<img>` | `next/image` with `fill` | CDN integration, lazy loading, layout-shift prevention |
| Hover overlay | Custom CSS module | Tailwind `group` + `group-hover:opacity-100` | Already established in `card-item.tsx` — identical pattern |
| Card type grouping | Separate DB query | `useMemo` over existing `mainDeck` | All data in memory; no round-trip needed |

**Key insight:** Every data dependency for this phase is already computed in the component tree. Zero new API calls, zero new DB queries, zero new library installs.

---

## Common Pitfalls

### Pitfall 1: Missing `relative` on the Leader/Base Slot Container

**What goes wrong:** `<Image fill>` renders with `position: absolute` and needs an ancestor with `position: relative`. The current dashed-box `div` does not have it. Without `relative`, the image bleeds out to the nearest positioned ancestor (the overall editor layout), covering unrelated UI.
**Why it happens:** `overflow-hidden` on the container is not sufficient — `fill` requires a positioned parent.
**How to avoid:** Add `relative` to the `aspect-[3/4]` dashed-box `div` before placing `<Image fill>` inside it.
**Warning signs:** Card art appears at full viewport width / covers the page.

### Pitfall 2: Flex Layout Breaks `max-w-4xl` Constraint

**What goes wrong:** The current editor view root is `<div className="max-w-4xl mx-auto space-y-8 p-6 pb-20">`. Wrapping in a flex row to add the preview panel could break `max-w-4xl` centering if the flex container is placed inside the constrained div.
**Why it happens:** `max-w-4xl` only constrains its own content width. If the flex row is the constrained div's parent, the preview panel sits outside the 4xl boundary.
**How to avoid:** Place the `flex flex-row gap-6` wrapper INSIDE the `max-w-4xl` div (or make the preview panel part of the constrained content). The UI-SPEC says `w-48 shrink-0` for the panel — 192px + the card list should fit within 896px (4xl).
**Warning signs:** Preview panel is misaligned or causes horizontal overflow.

### Pitfall 3: `frontArtUrl` Can Be `null`

**What goes wrong:** `Card.frontArtUrl` is typed as `string | null`. Passing `null` to `<Image src={null}>` causes a runtime error.
**Why it happens:** Not all cards have art URLs (e.g., newly seeded cards before CDN sync).
**How to avoid:** Guard with `leader.frontArtUrl &&` before rendering the Image. If null, fall back to the text placeholder (same as the empty-slot state).
**Warning signs:** TypeScript will catch this at compile time if `src` prop type is not accepted as null.

### Pitfall 4: Mobile Touch — `touchstart` vs `onClick`

**What goes wrong:** `onMouseEnter` does not fire on touch devices. Tap events on a card row would not trigger the preview panel on mobile.
**Why it happens:** Mobile browsers skip mouse events for touch interactions.
**How to avoid:** The UI-SPEC specifies a fixed bottom bar for mobile (separate from the desktop left panel). Handle with `onTouchStart` or use a combined `onClick` toggle for mobile, separately from `onMouseEnter`/`onMouseLeave` for desktop.
**Warning signs:** Preview never appears on mobile when tapping a card row.

### Pitfall 5: `space-y-8` Lost When Wrapping in Flex

**What goes wrong:** The existing editor view uses `space-y-8` for vertical spacing between sections. If that `div` becomes a flex child, its internal spacing is preserved, but the outer flex wrapper might override layout expectations.
**Why it happens:** `space-y-*` uses `> * + *` CSS selector — it works within a flex column child but not if the parent is `flex-row`.
**How to avoid:** Keep the main content block (leader/base grid + type groups + sideboard) as a single `div` flex child with its own `space-y-8` internally. The preview panel is the sibling flex child.

---

## Code Examples

Verified patterns from official/codebase sources:

### Next.js Image with fill (current project)
```typescript
// Source: src/components/catalog/card-item.tsx [VERIFIED: codebase]
<div className="relative rounded-md overflow-hidden bg-muted">
  <Image
    src={displayUrl}
    alt={name}
    fill
    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 10vw"
    className="object-cover transition-opacity duration-300"
    onLoad={() => setLoaded(true)}
  />
</div>
```

### Group hover overlay (current project)
```typescript
// Source: src/components/catalog/card-item.tsx [VERIFIED: codebase]
<div className="group relative">
  {/* ... image ... */}
  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 flex items-center justify-center z-10">
    {/* overlay content */}
  </div>
</div>
```

### Sidebar panel pattern (current project)
```typescript
// Source: src/components/decks/deck-sidebar.tsx lines 158–179 [VERIFIED: codebase]
<div>
  <h3 className="text-sm font-semibold uppercase text-slate-500 mb-2">Types</h3>
  <div className="space-y-1">
    {Object.entries(validation.stats.typeCounts).map(([type, count]) => (
      <div key={type} className="flex justify-between text-sm">
        <span className="text-slate-600">{type}</span>
        <span className="font-medium">{count}</span>
      </div>
    ))}
  </div>
</div>
```

### aspectCounts in ValidationStats (current project)
```typescript
// Source: src/lib/deck-validation.ts [VERIFIED: codebase]
export interface ValidationStats {
  costCurve: Record<number, number>;
  sideboardCostCurve: Record<number, number>;
  typeCounts: Record<string, number>;
  aspectCounts: Record<string, number>;  // ← already computed, ready to use
  arenaCounts: Record<string, number>;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `onLoadingComplete` (next/image) | `onLoad` | Next.js 13+ | `onLoadingComplete` is deprecated; use `onLoad` for load callbacks |
| `<img>` for card art | `next/image` with `fill` + `object-cover` | v1 of this project | Required for CDN/remotePatterns compliance |
| Flat main deck list | Type-grouped sections (this phase) | Phase 15 | The single "Main Deck (N)" heading and flat `.map()` is replaced by per-group sections |

**Deprecated/outdated (within this codebase after Phase 15):**
- The flat `mainDeck.map((item) => ...)` block at deck-builder.tsx lines 386–413 will be replaced by grouped sections. The Sideboard block is unchanged.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `card.arenas` is always an array (never null/undefined) on cards flowing through `mainDeck` | Architecture Patterns / Pattern 1 | `includes()` call would throw; add a guard `(card.arenas ?? []).includes(...)` |
| A2 | Mobile fixed-bottom-bar implementation uses `onTouchStart` or `onClick` toggle (not specified precisely in UI-SPEC) | Common Pitfalls / Pitfall 4 | Could require revisiting touch handling if a different approach is decided |
| A3 | The existing `max-w-4xl` editor wrapper is wide enough to accommodate `w-48` preview panel + card list without overflow | Common Pitfalls / Pitfall 2 | Preview panel may need `w-32` or be absolutely positioned if layout breaks |

---

## Open Questions

1. **Where exactly does the flex wrapper go relative to `max-w-4xl`?**
   - What we know: UI-SPEC says `flex flex-row gap-6` with preview `w-48 shrink-0`; existing root is `max-w-4xl mx-auto`
   - What's unclear: Whether the preview panel is inside or outside the `max-w-4xl` constraint
   - Recommendation: Place the preview panel INSIDE the `max-w-4xl` wrapper as a flex sibling to the main content block. This keeps it visually anchored to the list.

2. **`frontArtUrl` null guard for leader/base art — fallback to text or hide Image?**
   - What we know: `frontArtUrl: string | null` on Card; D-09 says empty slot shows placeholder
   - What's unclear: If a card IS selected but `frontArtUrl` is null, should it show the text placeholder or nothing?
   - Recommendation: Fall back to the text placeholder (same as empty slot) — safest UX, avoids broken-image state.

---

## Environment Availability

Step 2.6: SKIPPED — this phase contains no external dependencies. All changes are pure component/Tailwind work. The `unoptimized: true` flag in `next.config.ts` means the CDN domain (`cdn.swu-db.com`) is already configured and available for existing card art — no new configuration required.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 |
| Config file | `vitest.config.mts` |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test -- --run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| REQ-DECK-07 | `groupedDeck` useMemo correctly classifies Ground Units, Space Units, Upgrades, Events, Other | unit | `npm test -- --run __tests__/deck-grouping.test.ts` | ❌ Wave 0 |
| REQ-DECK-07 | Empty groups are not rendered (no section header for 0-count groups) | unit | `npm test -- --run __tests__/deck-grouping.test.ts` | ❌ Wave 0 |
| REQ-DECK-08 | Aspect panel excludes "Basic" aspect, sorts descending by count | unit | `npm test -- --run __tests__/aspect-panel.test.ts` | ❌ Wave 0 |
| REQ-DECK-08 | Aspect panel renders when `aspectCounts` has non-Basic entries | unit | `npm test -- --run __tests__/aspect-panel.test.ts` | ❌ Wave 0 |
| REQ-DECK-10 | `frontArtUrl` null guard — falls back gracefully when null | unit | `npm test -- --run __tests__/deck-grouping.test.ts` | ❌ Wave 0 |

**Note on test scope:** The type-grouping logic (`groupedDeck` useMemo) is pure function logic — it can be extracted to a helper and unit-tested in isolation without rendering. The aspect panel filter/sort is similarly pure. REQ-DECK-10 (art rendering) involves `<Image>` and hover state, which are harder to assert automatically; the primary check is visual (manual browser verification). Automated tests should cover the data-transform logic and null-guard branches.

### Sampling Rate
- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test -- --run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `__tests__/deck-grouping.test.ts` — covers REQ-DECK-07 (type grouping logic, empty group suppression, arenas-based classification) and REQ-DECK-10 (frontArtUrl null guard)
- [ ] `__tests__/aspect-panel.test.ts` — covers REQ-DECK-08 (Basic exclusion, sort order, numeric counts)

*(Both test files are pure unit tests against the derivation logic — no DOM rendering required. The grouping helper and aspect filter are good candidates for extraction into testable pure functions.)*

---

## Security Domain

The phase introduces no new API routes, no authentication changes, no user input handling beyond existing dispatch actions already in `DeckBuilder`. No ASVS categories apply to this UI-only phase.

---

## Sources

### Primary (HIGH confidence)
- `src/components/decks/deck-builder.tsx` [VERIFIED: codebase] — complete current implementation of editor view, lines 342–456
- `src/components/decks/deck-sidebar.tsx` [VERIFIED: codebase] — sidebar panels, aspect data already in `validation.stats`
- `src/lib/deck-validation.ts` [VERIFIED: codebase] — `ValidationStats.aspectCounts` field confirmed present and populated
- `src/components/catalog/card-item.tsx` [VERIFIED: codebase] — hover overlay pattern, `group`/`group-hover` Tailwind, `Image fill` usage
- `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md` [VERIFIED: local docs] — `fill` requires positioned parent, `sizes` recommended with `fill`, `onLoadingComplete` deprecated in favor of `onLoad`
- `.planning/phases/15-deck-list-display-polish/15-CONTEXT.md` [VERIFIED: planning] — all D-01 through D-14 locked decisions
- `.planning/phases/15-deck-list-display-polish/15-UI-SPEC.md` [VERIFIED: planning] — layout contract, spacing, color, interaction contract, accessibility notes

### Secondary (MEDIUM confidence)
- `next.config.ts` [VERIFIED: codebase] — `unoptimized: true` and `remotePatterns` for `cdn.swu-db.com` confirmed
- `package.json` [VERIFIED: codebase] — Next.js 16.2.4, React 19.2.4, Tailwind v4, no new packages needed

### Tertiary (LOW confidence)
- None — all claims in this research are verified or cited from codebase/official sources.

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — all packages verified in package.json
- Architecture: HIGH — all data dependencies verified in source files
- Pitfalls: HIGH — Pitfall 1 (missing `relative`) verified by reading the current slot div in deck-builder.tsx
- Type grouping logic: HIGH — `card.arenas` and `card.type` fields verified in Card interface
- Aspect panel: HIGH — `aspectCounts` verified in ValidationStats interface and validateDeck() implementation

**Research date:** 2026-05-14
**Valid until:** 2026-06-14 (stable tech stack, no fast-moving dependencies)

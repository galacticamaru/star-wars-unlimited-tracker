# Phase 16: Empty Deck Guided Onboarding - Research

**Researched:** 2026-05-14
**Domain:** React state management, nuqs URL state, filter auto-application, component prop threading
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01** — Three filter states based on deck state:
- Empty state (no leader OR no base): auto-filter `types` to `["Leader", "Base"]`
- Leader-only (leader selected, no base yet): stay on `["Leader", "Base"]`
- Both selected (leader AND base): auto-filter `aspects` to the combined aspects of leader+base (union of both arrays, excluding "Basic")

**D-02** — The auto-filter applies only to the card browser tab (CatalogClient in `mode="selector"`), not the deck editor view.

**D-03** — When the user manually changes the types or aspects filter while the auto-filter is active, set an `isAutoFilterOverridden` React state flag to `true`.

**D-04** — The override flag resets to `false` on ANY leader/base change (add, swap, or remove). After the reset, the auto-filter re-applies immediately based on the new deck state.

**D-05** — The override flag lives in component state (not URL state, not nuqs) — it is reset on every leader/base change with no persistence.

**D-06** — When both leader and base are selected, the auto-applied aspect filter shows:
1. Cards whose aspects include ANY of the combined leader+base aspects
2. Cards with NO aspects (neutral cards)

**D-07** — Auto-filter pre-selects the combined aspects in CatalogClient's existing `selectedAspects` nuqs state (the sidebar aspect checkboxes are ticked). The user sees the standard chips pre-ticked and can uncheck any to broaden.

**D-08** — Exclude "Basic" aspect from the auto-filter set.

**D-09** — A small informational chip/label appears near the filter area when the auto-filter is active. Informational only — no interaction. Chip updates or disappears when auto-filter state changes or is overridden.

**D-10** — Chip placement: near the top of the sidebar filter section or adjacent to the active filter group.

**D-11** — In the deck editor empty state, rename the existing switch-to-catalog CTA button to "Add Cards". Label change only.

### Claude's Discretion

None — all decisions are locked.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-DECK-09 | User is guided through building an empty deck — card browser auto-filters to Leader and Base cards first, then filters by the combination of chosen leader's and base aspects after selection | All decisions D-01 through D-11 implement this requirement. The filter state machine (D-01), override behavior (D-03–D-05), aspect union logic (D-06–D-08), and visual chip (D-09–D-10) together satisfy the three success criteria. |
</phase_requirements>

---

## Summary

Phase 16 adds a stateful filter-guidance system to the deck builder's card browser. When a user opens a new deck with no leader or base, `CatalogClient` (in `mode="selector"`) is automatically seeded with `selectedTypes=["Leader","Base"]` via nuqs. Once both leader and base are chosen, the filter shifts to `selectedAspects` set to the union of their aspects (excluding "Basic"). The user may override at any time; the override sticks until any leader/base change, which resets it and re-applies the auto-filter.

The key technical challenge is **cross-component filter injection**: `selectedTypes` and `selectedAspects` are nuqs URL params owned by `CatalogClient`, but the deck state that drives them lives in `DeckBuilder`'s `useReducer`. The solution is to pass an `autoFilter` prop (or equivalent) from `DeckBuilder` into `CatalogClient`, which then uses a `useEffect` to apply the values to its own nuqs state — guarded by the `isAutoFilterOverridden` flag.

Visual output is small: a new `autoFilterLabel` prop on `SidebarFilters` renders a `Badge` chip (exact JSX specified in the UI-SPEC), and a single string change in the deck editor's empty-state CTA button from "Switch to Catalog" to "Add Cards".

**Primary recommendation:** Use the `autoFilter` prop approach (option b from CONTEXT.md §Integration Points) — pass a computed `{ types?: string[], aspects?: string[] } | null` object from `DeckBuilder` into `CatalogClient`, and let `CatalogClient` apply it via `useEffect` internally. This keeps nuqs ownership inside `CatalogClient` (no lifting required) and isolates override-detection logic.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Deck state (leader/base IDs) | Frontend Client | — | Already in DeckBuilder `useReducer`; no server round-trip needed |
| Auto-filter computation (aspects union) | Frontend Client | — | Pure derivation from leader/base Card objects; mirrors existing `combinedAspects` pattern in `deck-validation.ts` |
| Override flag (`isAutoFilterOverridden`) | Frontend Client | — | Ephemeral UI state; D-05 explicitly forbids URL persistence |
| Filter state application (nuqs) | Frontend Client | — | nuqs URL params already owned by `CatalogClient`; injection via `useEffect` |
| Auto-filter chip rendering | Frontend Client | — | Presentational; driven by `autoFilterLabel` prop computed in `DeckBuilder` |
| CTA label rename | Frontend Client | — | Static string change in JSX |

---

## Standard Stack

### Core (all already installed)

| Library | Installed Version | Purpose | Why Standard |
|---------|------------------|---------|--------------|
| React | 19.2.4 | Component rendering, `useState`, `useEffect`, `useMemo` | Project baseline [VERIFIED: package.json] |
| nuqs | 2.8.9 | URL-persisted filter state (`selectedTypes`, `selectedAspects`) | Already owns all CatalogClient filter params [VERIFIED: package.json] |
| Tailwind CSS v4 | ^4 | Utility styling | Project baseline [VERIFIED: package.json] |
| lucide-react | ^1.14.0 | Icons (no new icons needed in this phase) | Project baseline [VERIFIED: package.json] |
| shadcn Badge | existing | Auto-filter chip rendering | Already installed; UI-SPEC mandates `variant="outline"` + className override [VERIFIED: 16-UI-SPEC.md] |

**No new dependencies.** This phase is a pure code change — zero new packages.

### Supporting (no changes needed)

| Already Exists | Role in This Phase |
|----------------|--------------------|
| `deck-validation.ts` `combinedAspects` pattern | Copy the set-union logic (lines 82–88); do NOT duplicate — extract or inline the same pattern |
| `SidebarFilters` props spread | `MobileFilterSheet` passes all props via `{...props}` (line 35 mobile-filter-sheet.tsx) — `autoFilterLabel` propagates automatically with zero MobileFilterSheet changes |

---

## Architecture Patterns

### System Architecture Diagram

```
DeckBuilder (useReducer)
│
│  state.leaderCardDefinitionId
│  state.baseCardDefinitionId
│       │
│       ▼
│  [computeAutoFilter(leader, base)]
│  → autoFilter: { types } | { aspects } | null
│  → autoFilterLabel: string | null
│  → isAutoFilterOverridden: boolean (useState)
│       │
│       ├──────────────────────────────────────────────────────┐
│       ▼                                                       ▼
│  <CatalogClient                                          <SidebarFilters
│    mode="selector"                                          autoFilterLabel={autoFilterLabel}
│    autoFilter={autoFilter}           (prop)                 ...sidebarProps
│    isAutoFilterOverridden=           (prop)             />
│      {isAutoFilterOverridden}
│    onFilterManualChange=             (callback prop)
│      {() => setIsAutoFilterOverridden(true)}
│  />
│
└── CatalogClient (internal)
    │
    │  useQueryState('types', ...)   → selectedTypes
    │  useQueryState('aspects', ...) → selectedAspects
    │       │
    │       ▼
    │  useEffect([autoFilter, isAutoFilterOverridden])
    │  → if (!isAutoFilterOverridden && autoFilter)
    │       setSelectedTypes(autoFilter.types ?? [])
    │       setSelectedAspects(autoFilter.aspects ?? [])
    │
    │  Manual change detection:
    │  onTypesChange / onAspectsChange handlers
    │  → call onFilterManualChange() when auto-filter is active
    │
    └── <SidebarFilters autoFilterLabel={autoFilterLabel} ... />
```

### Recommended Implementation Structure

No new files needed. All changes are in existing files:

```
src/
├── components/
│   ├── decks/
│   │   └── deck-builder.tsx          ← computeAutoFilter logic, isAutoFilterOverridden state,
│   │                                    autoFilterLabel derivation, prop threading to CatalogClient,
│   │                                    CTA label rename (line ~454)
│   └── catalog/
│       ├── catalog-client.tsx        ← autoFilter + isAutoFilterOverridden props,
│       │                               useEffect injection, onFilterManualChange callback
│       └── sidebar-filters.tsx       ← autoFilterLabel prop, Badge chip render
```

### Pattern 1: Auto-Filter Prop Injection via useEffect

**What:** Parent computes filter intent and passes it as a prop; child applies it to its own nuqs state in a `useEffect`.

**When to use:** When the parent owns the data that determines filter values but the child owns the nuqs params — avoids lifting state.

**Example (CatalogClient internal):**

```typescript
// Source: derived from existing nuqs pattern in catalog-client.tsx
interface AutoFilter {
  types?: string[];
  aspects?: string[];
}

// New props added to CatalogClientProps:
// autoFilter?: AutoFilter | null
// isAutoFilterOverridden?: boolean
// onFilterManualChange?: () => void

useEffect(() => {
  if (isAutoFilterOverridden || !autoFilter) return;
  if (autoFilter.types !== undefined) {
    setSelectedTypes(autoFilter.types);
  }
  if (autoFilter.aspects !== undefined) {
    setSelectedAspects(autoFilter.aspects);
  }
}, [autoFilter, isAutoFilterOverridden]);
// NOTE: setSelectedTypes / setSelectedAspects are stable refs from nuqs — safe in deps
```

**Why this approach (not lifting state):**
- `selectedTypes` and `selectedAspects` are used in the `filterCards` call, the `sidebarProps` spread, and the `handleClearAll` handler — all inside `CatalogClient`. Lifting them to `DeckBuilder` would require threading 10+ filter params up and back down.
- The `autoFilter` prop is a clean one-directional signal: `DeckBuilder` says "apply this filter", `CatalogClient` decides when and how.

### Pattern 2: Override Detection in Change Handlers

**What:** Wrap the `onTypesChange` / `onAspectsChange` callbacks that are currently passed to `sidebarProps` to fire `onFilterManualChange` when auto-filter is active.

**When to use:** When user manually interacts with a filter that the auto-filter controls.

**Example (CatalogClient internal):**

```typescript
// Source: derived from existing sidebarProps pattern in catalog-client.tsx
const handleTypesChange = (v: string[]) => {
  // If auto-filter is active and user is manually changing types → signal override
  if (!isAutoFilterOverridden && autoFilter?.types !== undefined) {
    onFilterManualChange?.();
  }
  setSelectedTypes(v);
};

const handleAspectsChange = (v: string[]) => {
  if (!isAutoFilterOverridden && autoFilter?.aspects !== undefined) {
    onFilterManualChange?.();
  }
  setSelectedAspects(v);
};
```

### Pattern 3: Auto-Filter Computation in DeckBuilder

**What:** Derive `autoFilter` and `autoFilterLabel` from leader/base objects using the same `Set` union pattern as `deck-validation.ts`.

**Example (DeckBuilder):**

```typescript
// Source: mirrors deck-validation.ts lines 82-87 [VERIFIED: src/lib/deck-validation.ts]
const autoFilter = useMemo((): AutoFilter | null => {
  if (isAutoFilterOverridden) return null; // don't recompute while overridden
  if (!leader || !base) {
    return { types: ['Leader', 'Base'] };
  }
  // Both selected: union aspects, exclude "Basic"
  const combined = new Set<string>();
  leader.aspects.forEach(a => { if (a !== 'Basic') combined.add(a); });
  base.aspects.forEach(a => { if (a !== 'Basic') combined.add(a); });
  return { aspects: [...combined] };
}, [leader, base, isAutoFilterOverridden]);

const autoFilterLabel = useMemo((): string | null => {
  if (isAutoFilterOverridden || !autoFilter) return null;
  if (autoFilter.types) return 'Auto: Leader & Base';
  if (autoFilter.aspects) return 'Auto: Aspect filter';
  return null;
}, [autoFilter, isAutoFilterOverridden]);
```

### Pattern 4: Override Reset on Leader/Base Change

**What:** The `SET_LEADER` and `SET_BASE` dispatch calls already exist in `handleDeckUpdate`. Wrap them to also reset `isAutoFilterOverridden`.

**Example (DeckBuilder):**

```typescript
// Source: derived from existing handleDeckUpdate in deck-builder.tsx line 215
// Also applies to the Remove buttons (dispatch SET_LEADER/SET_BASE null) in the editor view

// When dispatching SET_LEADER or SET_BASE, always pair with:
setIsAutoFilterOverridden(false);
```

This means the reset must fire in ALL places that dispatch `SET_LEADER` or `SET_BASE`:
1. `handleDeckUpdate` (adding via card browser)
2. Remove button in editor leader slot (`onClick={() => dispatch({ type: 'SET_LEADER', payload: null })}`)
3. Remove button in editor base slot (`onClick={() => dispatch({ type: 'SET_BASE', payload: null })}`)

### Anti-Patterns to Avoid

- **Lifting selectedTypes/selectedAspects to DeckBuilder:** Would require threading 10+ filter params through the prop chain and duplicating `handleClearAll` logic. The `autoFilter` prop approach avoids this entirely.
- **Storing isAutoFilterOverridden in nuqs:** D-05 explicitly forbids URL persistence. Use `useState`.
- **Re-applying auto-filter on every render instead of via useEffect:** Would fight the user — any render would undo their manual changes even after the override flag is set.
- **Checking `autoFilter !== null` for the `useEffect` dep array:** The effect should depend on both `autoFilter` object identity AND `isAutoFilterOverridden`. If the leader changes while overridden, `autoFilter` updates but override is reset synchronously — the effect then fires and applies the new filter correctly.
- **Forgetting the `autoFilter` null guard when both states are cleared simultaneously:** When leader AND base are both null, `autoFilter.types = ['Leader', 'Base']`. This is correct behavior, but the initial render of a NEW deck with no leader/base must also trigger this — confirm the `useEffect` fires on first mount.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Aspect union computation | Custom set-union function | Inline the same `new Set<string>()` pattern from `deck-validation.ts` lines 82–87 | Identical logic already tested |
| Informational badge/chip | Custom styled `<div>` | `Badge` with `variant="outline"` + className override (exact JSX in UI-SPEC) | Ensures consistent border-radius, font-size, height with rest of app |
| Filter state URL persistence | Custom URL param management | nuqs `useQueryState` (already in `CatalogClient`) | nuqs handles SSR, shallow routing, and serialization |

---

## Common Pitfalls

### Pitfall 1: useEffect Infinite Loop on nuqs Setters

**What goes wrong:** `setSelectedTypes` and `setSelectedAspects` are listed in the `useEffect` deps array → every render triggers the effect → infinite loop.

**Why it happens:** nuqs setter functions have stable identity across renders (they don't change on each render), but if included in the dep array, some linting rules flag them. The real risk is accidentally depending on `selectedTypes`/`selectedAspects` (the values) rather than the setters.

**How to avoid:** Depend only on `[autoFilter, isAutoFilterOverridden]`. Do NOT include `selectedTypes` or `selectedAspects` in the effect deps — that would create a loop (effect sets them → they change → effect fires again).

**Warning signs:** Browser tab freezes when loading deck builder in selector mode.

---

### Pitfall 2: autoFilter Object Identity Instability

**What goes wrong:** `autoFilter` is recreated on every render (not memoized), so the `useEffect` fires on every render even when leader/base haven't changed.

**Why it happens:** If `autoFilter` is computed inline in the render body rather than in `useMemo`, it is a new object reference every render.

**How to avoid:** Compute `autoFilter` with `useMemo([leader, base, isAutoFilterOverridden])` in `DeckBuilder`. Since `leader` and `base` are derived from `cardMap.get(id)` which is already memoized via `useMemo([state.leaderCardDefinitionId, cardMap])` — they are stable references.

**Warning signs:** Filter flickers on every keystroke in the search box.

---

### Pitfall 3: Override Flag Not Reset on Remove Buttons

**What goes wrong:** User manually overrides → removes their leader → auto-filter should re-apply to ["Leader","Base"], but the flag isn't reset from the Remove button in the editor view.

**Why it happens:** There are THREE places that dispatch `SET_LEADER null` or `SET_BASE null`:
- `handleDeckUpdate` (quantity=0 path)
- Leader slot Remove button (line ~387)
- Base slot Remove button (line ~428)

Only `handleDeckUpdate` is obvious; the Remove buttons are inline `onClick` dispatches.

**How to avoid:** Audit all `dispatch({ type: 'SET_LEADER' })` and `dispatch({ type: 'SET_BASE' })` call sites. Each must be paired with `setIsAutoFilterOverridden(false)`.

**Warning signs:** After removing a leader, the card browser stays on whatever filter the user had set manually instead of re-showing ["Leader","Base"].

---

### Pitfall 4: Aspect Filter Logic Mismatch (D-06)

**What goes wrong:** The auto-filter pre-selects aspects in the sidebar (D-07) using the existing `selectedAspects` mechanism. But the existing `filterCards` aspect logic is a **subset match** (every aspect on the card must be within the selected set) — not an "ANY" match. This means a card with aspects `["Command","Vigilance"]` when only `["Command"]` is pre-selected would be hidden.

**Why it matters:** D-06 says "cards whose aspects include ANY of the combined leader+base aspects" — but the filter implementation uses "every card aspect must be in the selected set". When the auto-filter pre-selects ALL combined aspects (e.g., `["Command","Vigilance"]`), this works correctly: a card with `["Command","Vigilance"]` passes because both are in the selected set. A card with just `["Command"]` also passes. The logic aligns.

**The real edge case:** Neutral cards with `aspects: []`. The existing `matchesAspect` logic:
```typescript
const matchesAspect = (selectedAspects?.length ?? 0) === 0 ||
  (card.aspects || []).every(a => selectedAspects.includes(a));
```
When `card.aspects = []`, `.every()` returns `true` (vacuous truth) — neutral cards always pass the aspect filter regardless of selection. **D-06 requirement for neutral cards is already satisfied by the existing filter implementation.** [VERIFIED: src/lib/filter-cards.ts line 81-83]

**How to avoid:** No filter logic changes needed. Confirm the existing behavior with a test case.

---

### Pitfall 5: autoFilter Fires on Initial Mount for Existing Decks

**What goes wrong:** A deck with an existing leader+base (loaded from DB) triggers the auto-filter's aspect injection on mount, overriding whatever the user had previously filtered.

**Why it happens:** The `useEffect` fires after first render. If the user previously had a manual filter set (in the URL), it gets wiped.

**Mitigation:** The URL state (nuqs) is owned by the browser tab, not persisted across sessions. When a user navigates to the deck builder, URL params start fresh. The initial mount will apply the auto-filter to a clean state — which is correct behavior. No special handling needed.

**Edge case to confirm:** If the user refreshes while on the catalog tab with manual filters set, the URL params persist (nuqs reads from URL). On mount, the `useEffect` fires and overwrites them with the auto-filter. This is acceptable per D-04: any leader/base change re-triggers auto-filter. A page refresh is treated as a fresh session.

---

## Code Examples

### Computing the Aspect Union (mirrors deck-validation.ts pattern)

```typescript
// Source: mirrors src/lib/deck-validation.ts lines 82-87 [VERIFIED]
const combinedAspects = new Set<string>();
if (leader) {
  leader.aspects.forEach(a => { if (a !== 'Basic') combinedAspects.add(a); });
}
if (base) {
  base.aspects.forEach(a => { if (a !== 'Basic') combinedAspects.add(a); });
}
const aspectFilter = [...combinedAspects];
```

### Auto-Filter Chip (exact JSX from UI-SPEC)

```tsx
// Source: src/.planning/phases/16-empty-deck-guided-onboarding/16-UI-SPEC.md [VERIFIED]
{autoFilterLabel && (
  <Badge
    variant="outline"
    className="border-primary/40 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/15 dark:text-primary"
    aria-label={`Auto-filter active: ${autoFilterLabel}`}
    role="status"
  >
    {autoFilterLabel}
  </Badge>
)}
```

Placement: immediately below `<h2>Filters</h2>` in sidebar-filters.tsx (line ~84), before the search `<Input>`.

### SidebarFilters New Prop

```typescript
// Source: 16-UI-SPEC.md §Prop added to SidebarFilters [VERIFIED]
// Add to SidebarFiltersProps:
autoFilterLabel?: string | null;
// Default: undefined (chip not rendered)
```

MobileFilterSheet requires NO changes — it already passes `{...props}` to SidebarFilters (line 35 of mobile-filter-sheet.tsx). [VERIFIED: src/components/catalog/mobile-filter-sheet.tsx]

### CTA Label Rename

```tsx
// Source: src/components/decks/deck-builder.tsx line ~454 [VERIFIED]
// Before:
<Button onClick={() => setView('catalog')}>Switch to Catalog</Button>
// After:
<Button onClick={() => setView('catalog')}>Add Cards</Button>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-----------------|--------------|--------|
| Lifting filter state to parent | Inject via `autoFilter` prop + `useEffect` | This phase | Keeps nuqs ownership inside CatalogClient |
| No onboarding guidance | Auto-filter state machine | This phase | Reduces blank-page confusion for new deck builders |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `setSelectedTypes` and `setSelectedAspects` from nuqs have stable function identity across renders (safe to omit from useEffect deps) | Architecture Patterns, Pitfall 1 | If unstable, effect fires on every render — trivially detectable and fixable by adding a ref guard |

All other claims were verified against the actual source files in this session.

---

## Open Questions

1. **Should the `autoFilter` prop carry `types` AND `aspects` fields, or should it be a discriminated union?**
   - What we know: The two states are mutually exclusive (types filter when no both, aspects when both). A discriminated union like `{ kind: 'types' } | { kind: 'aspects', aspects: string[] } | null` would be more explicit.
   - What's unclear: Whether the added complexity is worth it for a 2-state machine.
   - Recommendation: Use a flat object `{ types?: string[], aspects?: string[] }` matching the existing filter param shapes. Simpler, consistent with how `sidebarProps` passes values.

2. **Where should `isAutoFilterOverridden` live — DeckBuilder or CatalogClient?**
   - What we know: CONTEXT.md D-03/D-04/D-05 say it's a React state flag reset on leader/base change. The leader/base changes happen in DeckBuilder. The manual filter change that sets it happens in CatalogClient.
   - Recommendation: Own it in `DeckBuilder`. Reset is trivial (co-located with `SET_LEADER`/`SET_BASE` dispatches). Pass it down + pass `onFilterManualChange` callback up into CatalogClient. This avoids lifting the flag reset into CatalogClient which doesn't know when leader/base changes occur.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 16 is a pure code change. No external tools, databases, CLIs, or runtimes beyond the existing project stack are required.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 |
| Config file | `vitest.config.mts` |
| Quick run command | `npx vitest run src/lib/deck-validation.test.ts src/lib/filter-cards.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-DECK-09 | Auto-filter types to ["Leader","Base"] when no leader or base | unit | `npx vitest run src/lib/auto-filter.test.ts` | Wave 0 |
| REQ-DECK-09 | Auto-filter types to ["Leader","Base"] when leader-only | unit | `npx vitest run src/lib/auto-filter.test.ts` | Wave 0 |
| REQ-DECK-09 | Auto-filter aspects to leader+base union when both selected | unit | `npx vitest run src/lib/auto-filter.test.ts` | Wave 0 |
| REQ-DECK-09 | "Basic" aspect excluded from auto-filter aspect set | unit | `npx vitest run src/lib/auto-filter.test.ts` | Wave 0 |
| REQ-DECK-09 | Override flag set when user manually changes types | unit | `npx vitest run src/lib/auto-filter.test.ts` | Wave 0 |
| REQ-DECK-09 | Override flag resets on leader/base change | unit | `npx vitest run src/lib/auto-filter.test.ts` | Wave 0 |
| REQ-DECK-09 | Neutral cards (aspects=[]) pass aspect filter | unit | (existing filter-cards.test.ts already covers this — vacuous truth in every()) | ✅ |
| REQ-DECK-09 | Chip renders with correct label in each state | manual | Browser inspection | manual-only — requires Next.js render context |
| REQ-DECK-09 | Override persists after user interaction until leader/base change | manual | Browser interaction | manual-only |
| D-11 | CTA button shows "Add Cards" not "Switch to Catalog" | unit | `npx vitest run src/components/decks/deck-builder.test.tsx` | Wave 0 (or inline in existing deck tests) |

**Note on auto-filter unit tests:** The `computeAutoFilter` derivation function should be extracted as a pure function (no React) from `deck-builder.tsx` so it can be unit tested without a jsdom environment. This is the cleanest path to automated coverage.

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/auto-filter.test.ts` (if extracted as pure function)
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/lib/auto-filter.test.ts` — unit tests for the auto-filter computation logic (D-01 three states, D-08 Basic exclusion, D-03/D-04 override behavior)
- [ ] Pure function extraction: `computeAutoFilter(leader, base) => AutoFilter | null` and `computeAutoFilterLabel(autoFilter, isOverridden) => string | null` in a new `src/lib/auto-filter.ts` — makes them testable without React

*(Neutral card aspect-pass behavior: already tested via `filter-cards.test.ts` vacuous truth — no new test needed.)*

---

## Security Domain

No security-relevant changes in this phase. All operations are client-side React state and URL param manipulation. No new API endpoints, no authentication changes, no data persistence changes.

ASVS categories V2/V3/V4/V5/V6 do not apply — this phase is purely presentational/behavioral UI.

---

## Sources

### Primary (HIGH confidence)
- `src/components/decks/deck-builder.tsx` — DeckBuilder full source; leader/base state fields, handleDeckUpdate, dispatch sites, CatalogClient render at line ~339 [VERIFIED]
- `src/components/catalog/catalog-client.tsx` — nuqs filter params (lines 94-107), sidebarProps construction, filter application [VERIFIED]
- `src/lib/deck-validation.ts` — `combinedAspects` Set union pattern (lines 82-87) [VERIFIED]
- `src/lib/filter-cards.ts` — aspect filter logic (lines 81-83), vacuous truth for neutral cards [VERIFIED]
- `src/components/catalog/sidebar-filters.tsx` — prop interface, filter layout, insertion point for chip [VERIFIED]
- `src/components/catalog/mobile-filter-sheet.tsx` — `{...props}` spread confirms zero changes needed [VERIFIED]
- `.planning/phases/16-empty-deck-guided-onboarding/16-UI-SPEC.md` — exact JSX contract for Badge chip, prop name, placement [VERIFIED]
- `.planning/phases/16-empty-deck-guided-onboarding/16-CONTEXT.md` — all decisions D-01 through D-11 [VERIFIED]
- `package.json` — nuqs@2.8.9, vitest@4.1.5, React 19.2.4 confirmed [VERIFIED]
- `vitest.config.mts` — test environment `node`, globals true [VERIFIED]

### Secondary (MEDIUM confidence)
- nuqs 2.8.9 `useQueryState` setter stability — [ASSUMED: stable identity across renders is a nuqs design guarantee; behavior confirmed consistent with project's existing usage pattern across 10+ filter params in CatalogClient]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified from package.json and source files
- Architecture: HIGH — integration points read directly from source; approach derived from existing patterns
- Pitfalls: HIGH — identified from direct source code analysis (filter logic, dispatch sites, nuqs usage)
- Test gaps: HIGH — verified against actual test files and vitest config

**Research date:** 2026-05-14
**Valid until:** 2026-06-14 (stable stack; main risk is if nuqs releases a breaking change to setter stability)

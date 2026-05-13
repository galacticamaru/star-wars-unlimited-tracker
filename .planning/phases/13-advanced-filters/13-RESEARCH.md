# Phase 13: Advanced Filters - Research

**Researched:** 2026-05-13
**Domain:** Client-side filter state, nuqs URL params, Base UI Switch/Tooltip, filterCards() extension
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** "Owned only" means `collection[id] >= 1` — at least 1 copy owned. No deck-aware surplus logic.
- **D-02:** The toggle is visible to all users. When logged out, it renders greyed out / disabled with a tooltip: "Log in to filter by owned cards". `isAuthenticated` is already tracked in `CatalogClient`.
- **D-03:** Toggle placement: below the search bar, above the other filter dropdowns in the sidebar.
- **D-04:** Toggle state persists in the URL via nuqs (boolean param, e.g., `?owned=true`), consistent with all other filter state.
- **D-05:** The toggle appears in both catalog and deck builder — CatalogClient is shared; adding it once covers both surfaces at no extra cost. No mode-specific conditional.

### Claude's Discretion
- Toggle UI component choice (shadcn/ui Switch, Checkbox, or styled Button toggle) — use whichever reads most naturally alongside the search bar.
- Exact nuqs param name (e.g., `owned`, `ownedOnly`).
- Tooltip wording and disabled state visual treatment.

### Deferred Ideas (OUT OF SCOPE)
- **REQ-MARKET-05 — Market price threshold filter**: Dropped from Phase 13 by user decision. No implementation started. Defer to a future phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-DECK-06 | Filter deck builder catalog to show ONLY cards user owns | Owned-only toggle using `collection` state already fetched in CatalogClient; `filterCards()` extended with `ownedOnly` boolean; same CatalogClient serves both catalog and deck builder |
</phase_requirements>

---

## Summary

Phase 13 is a narrow, contained change: one boolean URL-param filter that gates on the client-side `collection` map that CatalogClient already has. No database schema changes, no new API endpoints, and no new data fetching are required. The `collection` record (`cardDefinitionId → count`) is already fetched from `/api/collection` on mount; `isAuthenticated` is already derived from `authClient.useSession()`. The phase is entirely a UI and client-side filter extension.

The primary work is four coordinated edits: (1) add `ownedOnly: boolean` to `FilterState` and implement the gate in `filterCards()`; (2) add a nuqs `parseAsBoolean` hook in `CatalogClient`, wire it into `sidebarProps`, and add `setOwnedOnly(false)` to `handleClearAll`; (3) add the toggle UI to `SidebarFilters` with disabled+tooltip treatment; (4) update both component prop interfaces so the types compile. `MobileFilterSheet` requires no changes beyond the prop interface because it re-renders `SidebarFilters` via a `{...props}` spread — the toggle appears there for free.

The UI component question (Switch vs Checkbox vs Button) is at Claude's discretion. The project uses `@base-ui/react` 1.4.1 as its primitive layer (not Radix UI). Base UI exposes `Switch.Root` + `Switch.Thumb` and `Tooltip.Root` / `Tooltip.Trigger` / `Tooltip.Popup`. Neither is scaffolded yet in `src/components/ui/`. The simplest approach that avoids scaffolding boilerplate is a styled `<button>` toggle (matching the pattern already used for the Cost filter row) or a minimal inline checkbox — but if Switch semantics are preferred, a thin `src/components/ui/switch.tsx` wrapper over Base UI can be created in Wave 0.

**Primary recommendation:** Use a styled inline toggle row (label + `<Switch.Root>` from Base UI, wrapped in a `src/components/ui/switch.tsx` shim) below the search bar, disabled and wrapped in a `Tooltip` when `isAuthenticated` is false.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Owned-only filter logic | Browser / Client | — | Filtering runs entirely client-side in `filterCards()`; collection data is already in memory |
| URL state persistence | Browser / Client | — | nuqs writes to URL query string; no server involvement |
| Toggle UI (switch + disabled state) | Browser / Client | — | Rendered inside CatalogClient tree; no SSR requirement |
| Tooltip for logged-out users | Browser / Client | — | Purely presentational; no server involvement |
| Collection data (counts) | API / Backend | Browser / Client | Already fetched once on mount from `/api/collection`; no new endpoint needed |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| nuqs | 2.8.9 [VERIFIED: package.json] | URL query state for boolean filter param | All filter state in this project is URL-persisted via nuqs (established Phase 12 rule) |
| @base-ui/react | 1.4.1 [VERIFIED: package.json] | Switch and Tooltip primitives | Project's primitive layer; replaces @radix-ui; no Radix UI packages present |
| TypeScript | ^5 [VERIFIED: package.json] | Typed filter state extension | FilterState interface must be updated; both files are .ts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^1.14.0 [VERIFIED: package.json] | Icons (optional lock/unlock for disabled state) | If icon reinforces disabled state visually |
| class-variance-authority | ^0.7.1 [VERIFIED: package.json] | cn() utility for conditional classes | Used everywhere for conditional Tailwind classes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Base UI Switch.Root | Native `<input type="checkbox">` | Checkbox is simpler to scaffold, but Switch reads better as an on/off toggle in a filter panel |
| Base UI Tooltip | `title` HTML attribute | `title` has poor mobile support and no visual styling control; Base UI Tooltip handles positioning correctly |
| Base UI Tooltip | Inline helper text below toggle | No tooltip dependency at all — just static greyed text; reduces complexity at cost of discoverability |

**Installation:** No new packages required. `@base-ui/react` is already installed. [VERIFIED: node_modules/@base-ui/react/package.json]

---

## Architecture Patterns

### System Architecture Diagram

```
URL (?owned=true)
       |
       v
CatalogClient (nuqs hook: useQueryState('owned', parseAsBoolean))
       |
       +---> sidebarProps spread (adds ownedOnly, onOwnedOnlyChange, isAuthenticated)
       |            |
       |            +---> SidebarFilters (desktop): renders OwnedOnlyToggle
       |            |
       |            +---> MobileFilterSheet -> SidebarFilters (mobile): same toggle, free
       |
       +---> filterCards(cards, { ...filters, ownedOnly }, collection)
                    |
                    v
              filtered CardForFilter[]  ->  CardGrid
```

### Recommended Project Structure
```
src/
├── lib/
│   └── filter-cards.ts          # add ownedOnly to FilterState; extend filterCards()
├── components/
│   ├── ui/
│   │   ├── switch.tsx           # NEW — thin Base UI Switch.Root wrapper (Wave 0)
│   │   └── tooltip.tsx          # NEW — thin Base UI Tooltip wrapper (Wave 0)
│   └── catalog/
│       ├── catalog-client.tsx   # add nuqs hook, sidebarProps entries, handleClearAll reset
│       ├── sidebar-filters.tsx  # add ownedOnly + onOwnedOnlyChange + isAuthenticated to props; render toggle
│       └── mobile-filter-sheet.tsx  # update MobileFilterSheetProps type alias only (spreads all SidebarFiltersProps)
```

### Pattern 1: nuqs Boolean Param
**What:** A URL-persisted boolean flag with `.withDefault(false)` so the param is absent from the URL when off.
**When to use:** Any binary on/off filter that users may share via URL.
**Example:**
```typescript
// Source: nuqs 2.8.9 — parseAsBoolean is confirmed exported [VERIFIED: node_modules/nuqs/dist/index.js]
// In CatalogClient:
import { useQueryState, parseAsBoolean } from 'nuqs';

const [ownedOnly, setOwnedOnly] = useQueryState(
  'owned',
  parseAsBoolean.withDefault(false).withOptions({ shallow: true })
);
```

### Pattern 2: FilterState Extension
**What:** Add `ownedOnly` to the `FilterState` interface and handle it inside `filterCards()`. Pass `collection` as a second argument (already available in `CatalogClient`).
**When to use:** Any new client-side filter criterion.
**Example:**
```typescript
// Source: src/lib/filter-cards.ts — existing pattern [VERIFIED: read file]
// FilterState extension:
export interface FilterState {
  // ...existing fields...
  ownedOnly?: boolean;
}

// In filterCards(), add collection as a second parameter:
export function filterCards(
  cards: CardForFilter[],
  filters: FilterState,
  collection: Record<number, number> = {}
): CardForFilter[] {
  const { ownedOnly = false, ...rest } = filters;
  // existing destructuring continues unchanged

  return cards.filter(card => {
    // ...existing matchesX booleans...

    // Owned-only gate: pass-through when false; check collection when true
    const matchesOwned = !ownedOnly || (collection[card.id] ?? 0) >= 1;

    return (
      matchesSearch && matchesSet && matchesType && matchesAspect &&
      matchesArena && matchesTrait && matchesRarity && matchesKeyword &&
      matchesCost && matchesVariant && matchesOwned
    );
  });
}
```

### Pattern 3: sidebarProps Spread Extension
**What:** Add the two new props to the `sidebarProps` object in `CatalogClient`. Both `SidebarFilters` and `MobileFilterSheet` spread it — the toggle appears in both surfaces automatically.
**When to use:** Whenever a new filter control must appear in both desktop sidebar and mobile sheet.
**Example:**
```typescript
// Source: src/components/catalog/catalog-client.tsx — existing pattern [VERIFIED: read file]
const sidebarProps = {
  // ...existing props...
  ownedOnly,
  onOwnedOnlyChange: setOwnedOnly,
  isAuthenticated,   // already derived in CatalogClient
};
```

### Pattern 4: Disabled Toggle with Tooltip (Base UI)
**What:** Wrap the toggle in `Tooltip.Root` with `Tooltip.Trigger` rendered as the toggle label area, disabled when `!isAuthenticated`. Base UI Tooltip requires a Positioner and Popup child.
**When to use:** UI elements that are always visible but conditionally interactive.
**Example:**
```typescript
// Source: @base-ui/react/tooltip — API confirmed [VERIFIED: node_modules/@base-ui/react]
// Tooltip sub-components: Root, Trigger, Positioner, Popup, Arrow
import { Tooltip } from '@base-ui/react/tooltip';
import { Switch } from '@base-ui/react/switch';

// In SidebarFilters:
<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger disabled={isAuthenticated}>
      {/* The switch row — Tooltip.Trigger renders its child */}
      <div className={cn('flex items-center justify-between py-1', !isAuthenticated && 'opacity-50 cursor-not-allowed')}>
        <label className="text-sm font-medium">Owned only</label>
        <Switch.Root
          checked={ownedOnly}
          onCheckedChange={onOwnedOnlyChange}
          disabled={!isAuthenticated}
        >
          <Switch.Thumb />
        </Switch.Root>
      </div>
    </Tooltip.Trigger>
    {!isAuthenticated && (
      <Tooltip.Positioner>
        <Tooltip.Popup>Log in to filter by owned cards</Tooltip.Popup>
      </Tooltip.Positioner>
    )}
  </Tooltip.Root>
</Tooltip.Provider>
```
Note: Exact Base UI Tooltip render API should be verified against `node_modules/@base-ui/react/dist/` type definitions at implementation time, as Base UI 1.x is relatively new. [ASSUMED: sub-component prop names match the exports; verify from d.ts files]

### Pattern 5: handleClearAll Reset
**What:** Add `setOwnedOnly(false)` to the existing `handleClearAll` in CatalogClient.
**When to use:** Required so "Clear All Filters" resets the owned-only toggle.
```typescript
// Source: src/components/catalog/catalog-client.tsx — existing handleClearAll [VERIFIED: read file]
const handleClearAll = () => {
  setSearch('');
  setSelectedSets([]);
  // ...existing resets...
  setSelectedVariants(['Normal']);
  setOwnedOnly(false);   // ADD THIS
};
```

### Anti-Patterns to Avoid
- **useState for filter state:** All filter state uses nuqs URL persistence (Phase 12 established rule). Do NOT use `useState` for `ownedOnly`.
- **Passing `collection` to `getAllCards()` for DB-level filtering:** The owned-only filter is intentionally client-side. No DB query changes are needed or wanted.
- **Conditional rendering by `mode` prop:** D-05 says no mode-specific conditional. The toggle appears in both catalog and deck builder unconditionally.
- **Hiding the toggle for logged-out users:** D-02 says the toggle is always visible — it renders disabled with a tooltip, not absent.
- **Rendering `ownedOnly` as active when collection is empty/loading:** When `isAuthenticated` is false, `collection` is `{}`. The filter expression `!ownedOnly || (collection[card.id] ?? 0) >= 1` naturally shows all cards when `ownedOnly` is false, so no special loading guard is needed. However, if `ownedOnly` is `true` in the URL and the user is logged out, the result count would be 0 (because collection is empty). This is acceptable and consistent.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL boolean state | Manual `window.location` manipulation or `useState` | `nuqs parseAsBoolean` | Handles SSR, serialisation, shallow routing, default omission — already used project-wide |
| Accessible toggle | Custom `<div>` with click handler | Base UI `Switch.Root` + `Switch.Thumb` | Handles aria-checked, keyboard activation, focus ring |
| Tooltip positioning | Custom `position: absolute` CSS | Base UI `Tooltip.Positioner` | Handles viewport overflow, portal rendering, pointer-events |

**Key insight:** `collection` data is already fetched and in scope in `CatalogClient`. The entire feature is a data-routing exercise, not a data-fetching one.

---

## Runtime State Inventory

> Not a rename/refactor/migration phase. Omit.

---

## Common Pitfalls

### Pitfall 1: MobileFilterSheet Type Mismatch
**What goes wrong:** `MobileFilterSheetProps` is defined as `React.ComponentProps<typeof SidebarFilters>`. If `SidebarFiltersProps` is updated but the mobile sheet is not re-checked, TypeScript will infer the new props automatically — but if `isAuthenticated` is required (non-optional) in `SidebarFilters`, it becomes required at the call site too.
**Why it happens:** The type alias mirrors `SidebarFilters` exactly, so new required props cascade.
**How to avoid:** Make `isAuthenticated` optional in `SidebarFiltersProps` with a default of `false`. This is consistent with how all other props in the interface are optional.
**Warning signs:** TypeScript error on `<MobileFilterSheet {...sidebarProps} />` about missing `isAuthenticated`.

### Pitfall 2: filterCards() Call Sites Not Updated
**What goes wrong:** If `filterCards()` signature changes to accept a third `collection` argument, the existing call in `CatalogClient` must pass `collection`. There is only one call site in production code (CatalogClient). Test files use the two-argument form — they must be updated to pass an empty collection when not testing the ownedOnly path.
**Why it happens:** Refactoring a function signature without auditing all call sites.
**How to avoid:** Search for all `filterCards(` usages before changing the signature. Default `collection = {}` to avoid breaking the test file.
**Warning signs:** TypeScript errors on the test file (`filter-cards.test.ts`) after signature change; filter-cards test suite red.

### Pitfall 3: ownedOnly Active When Collection Still Loading
**What goes wrong:** User is authenticated but collection fetch hasn't completed yet (`collection` is `{}`). If `ownedOnly` is `true`, the card grid shows 0 results momentarily.
**Why it happens:** `collection` initialises as `{}` and is populated asynchronously.
**How to avoid:** This is an acceptable loading flicker for this phase scope (no loading state decision was required). Document it as known behaviour. If it becomes a UX concern, a `collectionLoading` boolean state can gate the `ownedOnly` filter — but that is out of scope per D-01/D-02.
**Warning signs:** Flash of empty grid on page load when `?owned=true` is in the URL.

### Pitfall 4: nuqs parseAsBoolean Serialisation
**What goes wrong:** `parseAsBoolean.withDefault(false)` means when the value is `false`, nuqs removes the param from the URL. If code checks `searchParams.get('owned') === 'true'` elsewhere instead of using the hook, it may miss the param.
**Why it happens:** Mixing nuqs hook and direct searchParams access.
**How to avoid:** All reads of `ownedOnly` must go through the nuqs hook. Do not read `searchParams` directly for this param.
**Warning signs:** Toggle resets on navigation even though URL shows `?owned=true`.

### Pitfall 5: Base UI Tooltip Requires Provider
**What goes wrong:** Base UI Tooltip will not render correctly if `Tooltip.Provider` is absent from an ancestor. The existing codebase has no global tooltip provider.
**Why it happens:** Base UI Tooltip requires a Provider for delay and side-effects.
**How to avoid:** Wrap the toggle section in `<Tooltip.Provider>` inline, or add a global provider in the layout.
**Warning signs:** Tooltip never appears, or React throws a context error.

---

## Code Examples

### Full filterCards() ownedOnly gate
```typescript
// Source: derived from src/lib/filter-cards.ts existing pattern [VERIFIED: read file]
// Extend FilterState
export interface FilterState {
  search: string;
  selectedSets: string[];
  selectedTypes: string[];
  selectedAspects: string[];
  selectedArenas: string[];
  selectedTraits: string[];
  selectedRarities: string[];
  selectedKeywords: string[];
  selectedCosts: string[];
  selectedVariants?: string[] | null;
  ownedOnly?: boolean;       // NEW
}

// Extend filterCards() signature
export function filterCards(
  cards: CardForFilter[],
  filters: FilterState,
  collection: Record<number, number> = {}  // NEW — defaults to empty so tests need no change
): CardForFilter[] {
  const {
    ownedOnly = false,  // NEW
    // ...existing destructure unchanged
  } = filters;

  return cards.filter(card => {
    // ...existing matchesX booleans unchanged...

    // NEW gate — short-circuits to true when toggle is off
    const matchesOwned = !ownedOnly || (collection[card.id] ?? 0) >= 1;

    return (
      matchesSearch && matchesSet && matchesType && matchesAspect &&
      matchesArena && matchesTrait && matchesRarity && matchesKeyword &&
      matchesCost && matchesVariant && matchesOwned  // add matchesOwned
    );
  });
}
```

### CatalogClient nuqs hook + filterCards call + clearAll
```typescript
// Source: src/components/catalog/catalog-client.tsx [VERIFIED: read file] + nuqs 2.8.9 API
import { parseAsBoolean } from 'nuqs';

// Inside CatalogClient():
const [ownedOnly, setOwnedOnly] = useQueryState(
  'owned',
  parseAsBoolean.withDefault(false).withOptions({ shallow: true })
);

// Update the useMemo:
const filtered = useMemo(
  () => filterCards(cards, { ...filters, ownedOnly }, collection),
  [cards, /* existing deps */, ownedOnly, collection]
);

// Update handleClearAll:
const handleClearAll = () => {
  // ...existing resets...
  setOwnedOnly(false);
};

// Update sidebarProps:
const sidebarProps = {
  // ...existing props...
  ownedOnly,
  onOwnedOnlyChange: setOwnedOnly,
  isAuthenticated,
};
```

### SidebarFilters prop interface additions
```typescript
// Source: src/components/catalog/sidebar-filters.tsx [VERIFIED: read file]
// Add to SidebarFiltersProps interface:
interface SidebarFiltersProps {
  // ...existing props (all optional)...
  ownedOnly?: boolean;
  onOwnedOnlyChange?: (v: boolean) => void;
  isAuthenticated?: boolean;
}

// Add to destructured defaults:
function SidebarFilters({
  // ...existing...
  ownedOnly = false,
  onOwnedOnlyChange = () => {},
  isAuthenticated = false,
}: SidebarFiltersProps) { ... }
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Radix UI primitives | Base UI (@base-ui/react) | Introduced in this project's setup | No @radix-ui packages present; all primitive wrapping must use Base UI APIs |
| nuqs v1 (useQueryState returns string | null) | nuqs v2 (typed parsers, withDefault, withOptions) | nuqs 2.x | parseAsBoolean is the correct v2 API; do not use v1 null-check patterns |

**Deprecated/outdated:**
- `@radix-ui/*` packages: Not installed. Do not import from them.
- nuqs v1 patterns (`useQueryState` returning nullable string): Not applicable; project uses nuqs 2.8.9 typed parsers.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Base UI Tooltip sub-component prop names (`Trigger`, `Positioner`, `Popup`) match the exports confirmed at runtime | Architecture Patterns / Pattern 4 | Compilation error; need to verify from .d.ts files at implementation time |
| A2 | `Tooltip.Provider` is required as a wrapper for Base UI Tooltip to function | Common Pitfalls / Pitfall 5 | May not be required if Base UI 1.4.1 changed the API; verify from Base UI docs |

---

## Open Questions

1. **Tooltip vs. static helper text for logged-out users**
   - What we know: D-02 mandates a tooltip reading "Log in to filter by owned cards"
   - What's unclear: Base UI Tooltip 1.4.1 prop API needs to be confirmed from d.ts at implementation time
   - Recommendation: Implementer reads `node_modules/@base-ui/react/dist/` type definitions before writing the tooltip wrapper; if Tooltip proves awkward, a static `<p>` below the disabled toggle is a valid fallback that satisfies the intent

2. **`isAuthenticated` prop vs. importing `authClient` directly in SidebarFilters**
   - What we know: `isAuthenticated` is derived in `CatalogClient`; passing it as a prop is consistent with the sidebarProps spread pattern
   - What's unclear: Nothing — prop threading is clearly correct here
   - Recommendation: Pass as prop (D-02 is already clear; no question)

---

## Environment Availability

Step 2.6: SKIPPED — this phase is purely client-side code changes with no external tool, service, runtime, or database dependencies beyond the running dev server.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 [VERIFIED: package.json] |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npx vitest run src/lib/filter-cards.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-DECK-06 | `ownedOnly=false` returns all cards regardless of collection | unit | `npx vitest run src/lib/filter-cards.test.ts` | Wave 0 gap — new tests needed |
| REQ-DECK-06 | `ownedOnly=true` returns only cards with `collection[id] >= 1` | unit | `npx vitest run src/lib/filter-cards.test.ts` | Wave 0 gap |
| REQ-DECK-06 | `ownedOnly=true` with empty collection returns 0 cards | unit | `npx vitest run src/lib/filter-cards.test.ts` | Wave 0 gap |
| REQ-DECK-06 | `ownedOnly=true` ANDs correctly with other active filters | unit | `npx vitest run src/lib/filter-cards.test.ts` | Wave 0 gap |
| REQ-DECK-06 | Toggle disabled + tooltip when logged out | manual | — | Manual-only (requires browser session state) |
| REQ-DECK-06 | `?owned=true` in URL persists across refresh | manual | — | Manual-only (requires live browser + nuqs routing) |
| REQ-DECK-06 | "Clear All Filters" resets owned-only toggle to false | manual | — | Manual-only (requires browser interaction) |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/filter-cards.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] New test cases in `src/lib/filter-cards.test.ts` — covers REQ-DECK-06 (4 unit cases above)
- [ ] No framework gaps — Vitest, jsdom, and test infrastructure already in place

*(Existing `filter-cards.test.ts` exists and uses the established `makeCard` + `emptyFilters` pattern — new ownedOnly tests extend this file, they do not create a new file.)*

---

## Security Domain

This phase adds no authentication surfaces, no new API endpoints, no input fields that reach the server, and no cryptographic operations. The `ownedOnly` filter operates entirely client-side on data already in memory.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no | Boolean URL param; nuqs parseAsBoolean rejects non-boolean values |
| V6 Cryptography | no | — |

No new threat surface introduced.

---

## Project Constraints (from CLAUDE.md)

CLAUDE.md delegates to AGENTS.md, which states: "This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code."

**Directives applicable to this phase:**
- Read Next.js docs in `node_modules/next/dist/docs/` before writing code — this phase does not introduce new Next.js routing, server components, or data-fetching patterns, but any implementer touching `catalog-client.tsx` must comply.
- The project uses Next.js 16.2.4 (confirmed: `node_modules/next/package.json`), which is ahead of the public release known to training data. Treat Next.js APIs as potentially changed.
- No restrictions on the filter-cards.ts or component changes themselves — these are client-side React patterns not tied to Next.js-specific APIs.

---

## Sources

### Primary (HIGH confidence)
- `src/lib/filter-cards.ts` [VERIFIED: read file] — FilterState interface, filterCards() signature and logic
- `src/components/catalog/catalog-client.tsx` [VERIFIED: read file] — nuqs hook pattern, sidebarProps spread, handleClearAll, collection state, isAuthenticated
- `src/components/catalog/sidebar-filters.tsx` [VERIFIED: read file] — SidebarFiltersProps interface, rendering order, all existing props
- `src/components/catalog/mobile-filter-sheet.tsx` [VERIFIED: read file] — type alias `React.ComponentProps<typeof SidebarFilters>`, spread pattern
- `src/db/queries/catalog.ts` [VERIFIED: read file] — collectionCount in getAllCards() confirms no DB change needed
- `node_modules/nuqs/dist/index.js` [VERIFIED: runtime check] — `parseAsBoolean` confirmed exported
- `node_modules/@base-ui/react/package.json` [VERIFIED: runtime check] — version 1.4.1, switch and tooltip exports confirmed
- `node_modules/@base-ui/react` runtime inspection [VERIFIED] — `Switch: { Root, Thumb }`, `Tooltip: { Root, Trigger, Positioner, Popup, Portal, Arrow, Provider, Viewport }`
- `package.json` [VERIFIED: read file] — full dependency versions, no Radix UI present
- `vitest.config.ts` [VERIFIED: read file] — test framework and environment
- `src/lib/filter-cards.test.ts` [VERIFIED: read file] — existing test patterns (makeCard, emptyFilters)

### Secondary (MEDIUM confidence)
- `src/components/ui/sheet.tsx` [VERIFIED: read file] — confirms Base UI Dialog pattern; informs Switch/Tooltip wrapper structure

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified from package.json and node_modules at runtime
- Architecture: HIGH — all relevant source files read; no inference required
- Base UI Tooltip API: MEDIUM — component names verified from exports; exact prop shapes not read from .d.ts (see A1, A2 in Assumptions Log)
- Pitfalls: HIGH — derived directly from reading the actual code

**Research date:** 2026-05-13
**Valid until:** 2026-06-13 (stable libraries; nuqs and Base UI 1.x change infrequently)

---

## RESEARCH COMPLETE

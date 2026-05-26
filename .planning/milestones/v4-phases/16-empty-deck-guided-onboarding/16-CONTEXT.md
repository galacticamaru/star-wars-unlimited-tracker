# Phase 16: Empty Deck Guided Onboarding - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

When a user starts building a deck with no cards, the card browser intelligently guides them. It auto-filters to Leader+Base cards first so they can make their commander selection. Once both leader and base are selected, the filter shifts to show only cards matching the combined aspects of that pair (plus neutral cards). The user can manually override the auto-filter at any time; the override persists until the next leader/base change, which re-triggers the auto-filter.

</domain>

<decisions>
## Implementation Decisions

### Auto-Filter Logic
- **D-01:** Three filter states based on deck state:
  - **Empty state** (no leader OR no base selected): auto-filter `types` to `["Leader", "Base"]`
  - **Leader-only** (leader selected, no base yet): stay on `["Leader", "Base"]` — the pair selection phase isn't complete
  - **Both selected** (leader AND base): auto-filter `aspects` to the combined aspects of leader+base (union of both arrays, excluding "Basic")
- **D-02:** The auto-filter applies only to the card browser tab (CatalogClient in `mode="selector"`), not the deck editor view.

### Override Behavior
- **D-03:** When the user manually changes the types or aspects filter while the auto-filter is active, set an `isAutoFilterOverridden` React state flag to `true`.
- **D-04:** The override flag resets to `false` on ANY leader/base change (add, swap, or remove). After the reset, the auto-filter re-applies immediately based on the new deck state.
- **D-05:** The override flag lives in component state (not URL state, not nuqs) — it is reset on every leader/base change with no persistence.

### Aspect Filter Scope (Both Selected)
- **D-06:** When both leader and base are selected, the auto-applied aspect filter shows:
  1. Cards whose aspects include ANY of the combined leader+base aspects
  2. Cards with NO aspects (neutral cards — valid in any deck per SWU rules)
- **D-07:** Auto-filter pre-selects the combined aspects in CatalogClient's existing `selectedAspects` nuqs state (the sidebar aspect checkboxes are ticked). The user sees the standard chips pre-ticked and can uncheck any to broaden.
- **D-08:** Exclude "Basic" aspect from the auto-filter set (consistent with Phase 15 D-05).

### Visual Guidance
- **D-09:** A small informational chip/label appears near the filter area when the auto-filter is active. It shows the current auto-filter state, e.g. "Auto: Leader & Base" or "Auto: Aspect filter". Informational only — no interaction (no dismiss button, no click action). The chip updates or disappears when the auto-filter state changes or is overridden.
- **D-10:** Chip placement: near the top of the sidebar filter section or adjacent to the active filter group.

### Empty Deck CTA
- **D-11:** In the deck editor empty state (no cards added yet), rename the existing switch-to-catalog CTA button to **"Add Cards"**. Label change only — keep same position, style, and behavior (navigates to card browser tab).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Deck Builder
- `src/components/decks/deck-builder.tsx` — The full DeckBuilder component; `state.leaderCardDefinitionId` and `state.baseCardDefinitionId` are the deck state to watch; `CatalogClient` is rendered in the `view === 'catalog'` branch (lines ~339–345)
- `src/lib/deck-validation.ts` — `combinedAspects` computation (lines ~84–87) shows how leader+base aspects are unioned; same logic should inform the auto-filter aspect set

### Card Browser (Filter State)
- `src/components/catalog/catalog-client.tsx` — All filter state is nuqs URL params; `selectedTypes` (line ~96), `selectedAspects` (line ~97) are the two params the auto-filter will write; `mode="selector"` vs `mode="catalog"` are the two usage modes

### Phase Requirements
- `.planning/REQUIREMENTS.md` — REQ-DECK-09: guided onboarding requirement definition
- `.planning/ROADMAP.md` §Phase 16 — Success criteria (3 items) and phase goal

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `deck-validation.ts` `combinedAspects`: Pattern for computing the union of leader+base aspects already exists — auto-filter should use the same set-union logic (not duplicate it)
- `CatalogClient` `selectedTypes` / `selectedAspects` nuqs params: These are the exact values the auto-filter will programmatically set; the mechanism for setting them from the parent (deck-builder.tsx) needs to be designed (prop callback or lifting state)
- `Card.aspects[]`: Available on every card object passed to DeckBuilder — leader and base objects already have their aspects arrays

### Established Patterns
- nuqs is used for all URL-persisted filter state — the auto-filter sets nuqs values, consistent with the rest of the app
- `useReducer` in deck-builder.tsx handles deck state mutations — the `leaderCardDefinitionId` and `baseCardDefinitionId` fields are already tracked here; the override flag (`isAutoFilterOverridden`) should live alongside them or in a separate `useState`
- Phase 15 D-05: "Basic" aspect is excluded from strategic aspect displays — exclude it from the auto-filter set too

### Integration Points
- The auto-filter watches deck builder `useReducer` state and writes to CatalogClient nuqs state — the challenge is that nuqs state lives inside CatalogClient. The planner should evaluate whether to: (a) lift selectedTypes/selectedAspects out of CatalogClient into deck-builder.tsx and pass them down as props, or (b) pass an `autoFilter` prop to CatalogClient and handle it internally.
- The informational chip could render inside CatalogClient (where it knows the filter state) or in deck-builder.tsx (where it knows the deck state that drove the filter). The planner should decide.
- The `view === 'catalog'` branch in deck-builder.tsx (line ~338) is where CatalogClient is rendered for the card browser — this is the primary integration point.

</code_context>

<specifics>
## Specific Ideas

- The auto-filter chip text examples: "Auto: Leader & Base" (empty/leader-only state) and "Auto: Aspect filter" (both selected state)
- The "Add Cards" CTA rename: label-only change, no restyle needed

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 16-Empty-Deck-Guided-Onboarding*
*Context gathered: 2026-05-14*

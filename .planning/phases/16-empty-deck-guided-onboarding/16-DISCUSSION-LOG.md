# Phase 16: Empty Deck Guided Onboarding - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 16-empty-deck-guided-onboarding
**Areas discussed:** Override behavior, Leader-only state, Neutral cards in aspect filter, Visual guidance disclosure

---

## Override Behavior

### Q1: When user manually changes the filter, what happens on next deck state change?

| Option | Description | Selected |
|--------|-------------|----------|
| Re-apply auto-filter on deck change | Each leader/base change resets auto-filter. User's override is temporary. | ✓ |
| Sticky override until deck reset | Once overridden, auto-filter stops until deck is cleared. | |
| Re-apply only when slot goes empty→filled | Only re-triggers on empty→filled transitions, not leader swaps. | |

**User's choice:** Re-apply auto-filter on deck change
**Notes:** Auto-filter is always fresh — each leader/base change brings it back.

### Q2: Which deck state changes trigger re-application?

| Option | Description | Selected |
|--------|-------------|----------|
| Any leader/base change (add, swap, remove) | Every mutation to leaderCardDefinitionId or baseCardDefinitionId re-triggers. | ✓ |
| Only when slots change fill status | Only empty→filled or filled→empty transitions. | |
| You decide | Leave to implementer. | |

**User's choice:** Any leader/base change (add, swap, remove)

### Q3: How does the system track that an override is in effect?

| Option | Description | Selected |
|--------|-------------|----------|
| React state flag (isAutoFilterOverridden) | Boolean in component state, set true on manual filter change, reset on deck change. | ✓ |
| Compare current filter vs. expected auto-filter | No extra flag — detect override by comparing nuqs values to expected values. | |
| You decide | Leave to implementer. | |

**User's choice:** React state flag (isAutoFilterOverridden)

---

## Leader-Only State

### Q1: What filter applies when leader is selected but no base yet?

| Option | Description | Selected |
|--------|-------------|----------|
| Keep showing Leader+Base | Stay on Leader+Base until both are selected. | ✓ |
| Switch to Base-only | Narrow to just Base cards to guide the next step. | |
| No filter change | Do nothing for intermediate state. | |

**User's choice:** Keep showing Leader+Base
**Notes:** The "pick your commander pair" phase isn't done — keep guiding toward completing both slots.

---

## Neutral Cards in Aspect Filter

### Q1: What cards appear when both leader+base are selected?

| Option | Description | Selected |
|--------|-------------|----------|
| Aspects matching leader+base PLUS neutral cards | Combined aspects filter + no-aspect (neutral) cards included. | ✓ |
| Only cards matching leader+base aspects exactly | Strict filter, neutral cards excluded. | |
| You decide | Leave to implementer. | |

**User's choice:** Aspects matching leader+base PLUS neutral cards

### Q2: How are the combined aspects applied in the existing filter UI?

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-select combined aspects in existing aspect checkboxes | Auto-tick the sidebar aspect chips (selectedAspects nuqs state). | ✓ |
| Separate 'show only playable' toggle | New toggle as a single on/off, not per-aspect. | |
| You decide | Leave to implementer. | |

**User's choice:** Pre-select the combined aspects in existing aspect checkboxes

### Bonus (user-initiated): Empty deck CTA rename

**User's specification:** The empty deck editor state currently has a switch-to-catalog CTA. Rename it to "Add Cards". Label change only — same position and style.

---

## Visual Guidance Disclosure

### Q1: Does the user get any indication that the filter is auto-managed?

| Option | Description | Selected |
|--------|-------------|----------|
| Silent smart default | No banner or indicator — filter just works. | |
| Subtle chip/label near the filter | Small informational label showing current auto-filter state. | ✓ |
| Dismissible banner above card grid | Prominent message with Dismiss/Override button. | |

**User's choice:** Subtle chip/label near the filter

### Q2: What does the chip say and what happens when interacted with?

| Option | Description | Selected |
|--------|-------------|----------|
| Informational only — no interaction | Shows text, purely visual. User overrides by changing filters directly. | ✓ |
| Clickable — toggle lock/unlock override | Chip acts as toggle for override state. | |
| Has an X to dismiss | Dismissing the chip locks the override. | |

**User's choice:** Informational only — no interaction

---

## Claude's Discretion

- Chip placement (exact positioning near sidebar filter section) — left to implementer
- Whether to lift selectedTypes/selectedAspects out of CatalogClient or pass an autoFilter prop — left to implementer (noted in code_context integration points)
- Whether the informational chip renders inside CatalogClient or deck-builder.tsx — left to implementer

## Deferred Ideas

None.

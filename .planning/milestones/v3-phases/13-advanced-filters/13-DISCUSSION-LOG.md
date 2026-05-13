# Phase 13: Advanced Filters - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-13
**Phase:** 13-advanced-filters
**Areas discussed:** Owned-only behavior, Price filter UI, Filter scope

---

## Owned-only behavior

### What does "owned only" mean?

| Option | Description | Selected |
|--------|-------------|----------|
| At least 1 copy owned | collection[id] >= 1. Simple, no deck-state dependency. | ✓ |
| Surplus copies (deck-aware) | collection[id] - deckCounts[id] > 0. Hides cards already maxed in deck. | |
| Same in both contexts | ≥1 copy everywhere regardless of context. | |

**User's choice:** At least 1 copy owned

---

### Auth handling for the toggle

| Option | Description | Selected |
|--------|-------------|----------|
| Hide filter entirely when logged out | Don't render toggle if no session. | |
| Show toggle, auto-disabled when logged out | Toggle renders greyed out with tooltip. | ✓ |
| Show toggle, falls back to showing all | No guard — user sees empty state if not logged in. | |

**User's choice:** Show toggle, auto-disabled when logged out

---

### Toggle placement in sidebar

| Option | Description | Selected |
|--------|-------------|----------|
| Top of sidebar, before search | Most prominent — deck builder users use this constantly. | |
| Below search bar, above other filters | Near top but below search. | ✓ |
| You decide | Placement left to Claude's discretion. | |

**User's choice:** Below search bar, above other filters

---

### URL persistence

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, nuqs like all filters | Consistent with Phase 12 filter system pattern. | ✓ |
| Local state only | Resets on reload. Breaks nuqs consistency. | |

**User's choice:** Yes, nuqs like all filters

---

## Price filter UI

| Option | Description | Selected |
|--------|-------------|----------|
| Max price slider | Single slider for max price. shadcn/ui Slider ready to use. | |
| Min/max text inputs | Two number inputs for price range. | |
| Preset budget tiers | Opinionated buttons like "Budget / Mid / All". | |
| Drop price filters | Remove from Phase 13 scope entirely. | ✓ |

**User's choice:** Drop Price filters from the plan.
**Notes:** REQ-MARKET-05 deferred to a future phase.

---

## Filter scope

| Option | Description | Selected |
|--------|-------------|----------|
| Deck builder only | Conditionally render toggle based on mode='selector'. | |
| Both catalog and deck builder | CatalogClient is shared — zero extra work. | ✓ |

**User's choice:** Both catalog and deck builder

---

## Claude's Discretion

- Toggle UI component (shadcn/ui Switch, Checkbox, or styled Button toggle)
- Exact nuqs param name (e.g., `owned` or `ownedOnly`)
- Tooltip wording and disabled state visual treatment

## Deferred Ideas

- **REQ-MARKET-05 — Market price threshold filter**: Explicitly dropped from Phase 13 by user. All price data already exists in `CardForFilter`. Candidate for a standalone future phase.

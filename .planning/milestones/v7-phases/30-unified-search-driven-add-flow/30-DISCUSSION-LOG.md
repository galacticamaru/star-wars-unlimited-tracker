# Phase 30: Unified Search-Driven Add Flow - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-06
**Phase:** 30-Unified Search-Driven Add Flow
**Areas discussed:** Search mechanism, Result presentation, Variant + destination UX, Page layout after removal

---

## Search mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Server search endpoint | New `/api/binder/search?q=` route querying `card_definitions` server-side with per-printing ownership join; nothing fetched until typing | |
| Lazy full-catalog load | Fetch full catalog + owned cards once on the first keystroke (not on mount), filter client-side; reuses `/api/cards/all` + `/api/collection/owned-cards` | ✓ |
| You decide | Pick during research based on catalog size and query perf | |

**User's choice:** Lazy full-catalog load
**Notes:** Accepts shipping the whole catalog to the browser on first search. "No eager load" is satisfied because nothing is fetched/rendered on page mount.

### Follow-up — search gating

| Option | Description | Selected |
|--------|-------------|----------|
| 2 chars, cap ~20 | Require 2+ characters, cap visible results ~20, 150ms debounce (matches catalog) | ✓ |
| 1 char, cap ~50 | Match at 1 char, show ~50; more permissive but noisier | |
| You decide | Pick min-length/debounce/cap during planning | |

**User's choice:** 2 chars, cap ~20

---

## Result presentation

| Option | Description | Selected |
|--------|-------------|----------|
| Compact rows + thumbnail | Vertical list of rows with small thumbnail + name/subtitle | |
| Art tiles grid | Responsive grid of card-art tiles, reusing `ManageTradeCard` styling | ✓ |
| You decide | Pick during UI planning | |

**User's choice:** Art tiles grid

---

## Variant + destination UX

| Option | Description | Selected |
|--------|-------------|----------|
| Right-side Sheet | Reuse `VariantTradeSheet`: sheet lists every variant with both actions; trade gated on ownership | ✓ |
| Inline expand panel | Clicking a tile expands a panel beneath the grid | |
| Modal dialog | Centered modal with variant list + actions | |

**User's choice:** Right-side Sheet
**Notes:** Sheet must be extended from the current owned-only version to show all variants (owned + unowned); trade action disabled with reason for unowned, want action always available.

### Follow-up — want quantity

| Option | Description | Selected |
|--------|-------------|----------|
| Quantity stepper | Want action gets its own qty stepper; `/api/binder/wants` POST already accepts quantity | ✓ |
| Add as want = 1 | Adds a single want; qty adjusted later in wants list (Phase 32) | |
| You decide | Pick based on sheet simplicity | |

**User's choice:** Quantity stepper

---

## Page layout after removal

| Option | Description | Selected |
|--------|-------------|----------|
| Full-width search on top | Search + results span full width at top; Offerings + Wants below in 2/3 + 1/3 | |
| Keep 2/3 + 1/3 grid | Search in left 2/3 (where Add Cards was) above Trade Offerings; right 1/3 keeps Trade Profile + Wants list | ✓ |
| You decide | Pick during UI planning | |

**User's choice:** Keep 2/3 + 1/3 grid
**Notes:** Trade Profile card and `ManageWantsList` stay untouched this phase (reworked in Phases 31 & 32). The old "Add Manual Want" card is removed from the right column.

---

## Claude's Discretion

- Exact catalog→sheet data plumbing (grouping per-printing catalog rows into per-definition cards with ownership merged).
- Whether to extend `VariantTradeSheet` in place or build a superset component, provided owned-card behavior is preserved.

## Deferred Ideas

- Trade Profile modal + public trade note → Phase 31 (BINDER-15/16/17).
- Combined wants & exclusions list + manual-want qty/remove controls → Phase 32 (BINDER-18/19/20).
- Server-side `/api/binder/search` endpoint — deferred in favor of lazy client load; revisit if catalog fetch becomes heavy.

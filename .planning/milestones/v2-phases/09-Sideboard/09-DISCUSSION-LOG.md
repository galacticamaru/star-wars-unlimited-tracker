# Phase 9: Sideboard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-11
**Phase:** 9-Sideboard
**Areas discussed:** Adding to sideboard, Sideboard list display, Cost curve sideboard bars

---

## Adding to sideboard

| Option | Description | Selected |
|--------|-------------|----------|
| Toggle above the catalog | A 'Main Deck / Sideboard' toggle at the top of the Add Cards tab | |
| Long-press or right-click | Standard + adds to main; long-press/right-click opens 'Add to Sideboard' menu | |
| Two separate + buttons per card | Each card row shows two controls: '+ Main' and '+ SB' | ✓ (reinterpreted) |

**User's choice (freeform):** "On the Deck List tab, add a button that moves a copy of the card to the sideboard. Sideboarded cards have a button that moves a copy of the card to the main deck."

**Follow-up — button placement:**

| Option | Description | Selected |
|--------|-------------|----------|
| Replaces the '+' button | 'SB' button replaces rightmost '+' | |
| Added alongside existing +/- controls | Main deck row: [qty] [name] [-] [+] [Move to SB] | ✓ |
| Hover-reveal action | Hovering a row reveals 'Move to SB' | |

**Confirmed mechanic:** Catalog always adds to main deck. "Move to SB" takes 1 copy from main and places in sideboard. "Move to Main" is the reverse. User confirmed this is correct.

**Notes:** The user's intent is that sideboard management lives entirely in the Deck List editor tab. No changes to the catalog. The "two separate buttons" framing evolved into "move buttons on existing rows" in the Deck List tab.

---

## Sideboard list display

| Question | Options | Selected |
|----------|---------|----------|
| Where does sideboard section appear? | Section below main deck list / Separate inner tab | Section below main deck list |
| Empty sideboard behavior | Hidden until first SB card / Always visible with empty-state prompt | Always visible with empty-state prompt |
| Sidebar header sideboard count | Yes — show separately / No — main deck only | Yes — show separately |

**Notes:** Sidebar will show e.g. "50 / 50 main • 3 / 10 sideboard". Sideboard section header: "Sideboard (N / 10)".

---

## Cost curve sideboard bars

| Option | Description | Selected |
|--------|-------------|----------|
| Stacked on top of main deck bars | Same column, sideboard color on top of main color | ✓ |
| Side-by-side mini bars | Two bars per cost value | |
| Separate mini chart below | Second cost curve chart labeled 'Sideboard' | |

**Color:** Amber / orange selected. User noted amber already used for warnings in the app — this creates visual cohesion.

---

## Claude's Discretion

- Exact "Move to SB" / "Move to Main" button styling (text, size, variant) — left to Claude matching existing +/- style
- Legend text below cost curve — Claude to design consistent with sidebar typography

## Deferred Ideas

None.

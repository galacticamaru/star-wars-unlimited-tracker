# Phase 5: Want List - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-06
**Phase:** 5-Want List
**Areas discussed:** Per-deck list placement, Combined list surface, Shortfall aggregation math, Display format, Top navigation

---

## Per-Deck List Placement

| Option | Description | Selected |
|--------|-------------|----------|
| New 'Want List' tab | Adds third toggle: Add Cards \| Deck List \| Want List. Clean separation, matches existing tab pattern. | ✓ |
| Section in sidebar | Adds a 'Missing Cards' section in the right sidebar below validation stats. Always visible while building. | |
| Bottom of Deck List view | Appends a 'Missing Cards' section below the card list in the Deck List tab. | |

**User's choice:** New "Want List" tab

---

## Combined List Surface

| Option | Description | Selected |
|--------|-------------|----------|
| Section on /decks dashboard | Adds "What I Need to Buy" section below the deck list. Everything in one place. | ✓ |
| Dedicated /want-list page | Separate route with its own nav link. Clean but adds a new page to maintain. | |

**User's choice:** Section on /decks dashboard

---

## Shortfall Aggregation Math

| Option | Description | Selected |
|--------|-------------|----------|
| Sum per-deck shortfalls | Each deck's shortfall summed. 1+1=2 in the example. | |
| Total need minus owned once | Sum all deck quantities, subtract owned once. 4-1=3 in the example. | |
| Max(deck quantities) - owned | How many to cover the most-demanding deck independently. 2-1=1 in the example. | ✓ |

**User's choice:** "Assuming collection covers each deck independently." Formula confirmed: `shortfall = max(0, max(quantity_in_any_deck) - owned_count)`.
**Notes:** User clarified: "if you own 1 and each deck needs 2, you only need 1 more to cover either deck independently." This is max-across-decks minus owned, not sum of per-deck shortfalls.

---

## Display Format

| Option | Description | Selected |
|--------|-------------|----------|
| Text table | Simple rows: card name \| type \| need \| own \| shortfall. Fast to scan. | |
| Card tiles with images | Same visual grid as catalog. Richer, reuses CardItem component. | ✓ |
| You decide | Claude picks based on simplest/most consistent approach. | |

**User's choice:** Card tiles with images
**Follow-up — Sort order:**
- By card type (selected) — grouped Leader → Base → Unit → Event → Upgrade

**Follow-up — Interactivity:**
- Read-only (selected) — no +/− controls; users update owned counts in Catalog/Collection

---

## Top Navigation Bar

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, in Phase 5 (Catalog • Collection • Decks) | Simple top nav, no Want List link needed (combined list on /decks). | ✓ |
| Yes, with Want List nav link | Same nav bar + Want List link, requiring /want-list as its own page. | |
| No, skip for now | Leave navigation as-is. | |

**User's choice:** Yes — add top nav (Catalog • Collection • Decks) in Phase 5.
**Notes:** User raised this as a cross-cutting need: "as we add more pages we need top navigation."

---

## Claude's Discretion

None — all areas had explicit user decisions.

## Deferred Ideas

- **WANT-03 (v2)**: Export / share the want list — already in v2 backlog per REQUIREMENTS.md.
- **Want List nav link**: If a dedicated /want-list route is ever added, it would need its own nav entry.

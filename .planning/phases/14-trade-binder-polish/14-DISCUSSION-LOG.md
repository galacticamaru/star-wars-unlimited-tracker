# Phase 14: Trade Binder Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-13
**Phase:** 14-trade-binder-polish
**Areas discussed:** Auto wants — manage page, Full-width scope, Looking For quantities

---

## Auto wants — manage page

### Q1: What should the manage page show about deck-driven wants?

| Option | Description | Selected |
|--------|-------------|----------|
| Show a "Deck Wants" read-only list | Add a section listing cards auto-included from decks with quantity and attribution. Read-only — users suppress via Exclusions. | |
| Full Looking For preview | A preview panel showing exactly what the public binder's Looking For section will look like (combined after exclusions). | |
| Just a count/note | Small notice like "N cards auto-included from your decks" with a link to the public binder. | |

**User's choice:** Free text — "Similar to Manual Wants - add an Automatic Wants section that displays card rows in the same UI/style as Manual Wants. Users can add cards to their exclusion list directly from the Automatic Wants list."

**Notes:** User wants a full Automatic Wants section matching the Manual Wants UI pattern, with inline Exclude actions on each row.

---

### Q2: What info should each Automatic Wants row show?

| Option | Description | Selected |
|--------|-------------|----------|
| Card name + quantity needed | Same as Manual Wants rows: name, subtitle, quantity. Simple. | ✓ |
| Card name + quantity + deck attribution | Name, quantity, plus which deck(s) are driving the want. | |

**User's choice:** Card name + quantity needed  
**Notes:** Keep it simple — no deck attribution needed.

---

### Q3: How should excluded cards appear in the Automatic Wants list?

| Option | Description | Selected |
|--------|-------------|----------|
| Hide them entirely | Excluded cards don't appear in Automatic Wants at all — only in Exclusions section. | |
| Show greyed out with "Excluded" label | Show the row muted with an "Excluded" badge + option to un-exclude inline. | ✓ |

**User's choice:** Show greyed out with "Excluded" label  
**Notes:** Users can see the full picture (all deck-driven wants) in one list, with excluded ones visually distinguished and un-excludable inline.

---

## Full-width scope

### Q1: Does "full-width" apply to both binder pages, or just the public binder?

| Option | Description | Selected |
|--------|-------------|----------|
| Both pages go full-width | Remove container from both public binder and manage page. | |
| Public binder only | Only /binder/[username] goes full-width. Manage page keeps centered container. | ✓ |

**User's choice:** Public binder only  
**Notes:** The manage page is a form-like management UI — centered layout is appropriate. The public binder is a browsing/display experience like the catalog and should be full-width.

---

## Looking For quantities

### Q1: Should "need X" quantities be visible on Looking For cards in the public binder?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — show quantity badge on each card | Add "Need 2" badge on card thumbnails in Looking For grid. | |
| No — quantity already in section header | Individual quantities add noise without much value. | |

**User's choice:** Free text — "The public binder already has a pill on cards with this information. We do not need to make any changes to it."  
**Notes:** Pre-answered — existing implementation already handles this. No work item.

---

## Claude's Discretion

- Exact positioning of "Automatic Wants" section relative to "Manual Wants" and "Exclusions" in the manage page
- Whether to extract deck-wants logic into a shared helper in `binder-logic.ts` or compute inline in `getUserTradeData()`
- Visual treatment for excluded rows (opacity level, badge style)

## Deferred Ideas

None — discussion stayed within phase scope.

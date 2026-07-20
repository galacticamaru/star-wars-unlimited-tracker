# Phase 32: Combined Wants & Exclusions List - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-20
**Phase:** 32-combined-wants-exclusions-list
**Areas discussed:** List structure, Auto vs manual cue, Excluded want display, Manual want details

---

## List structure

| Option | Description | Selected |
|--------|-------------|----------|
| Two sections, drop Exclusions | One list, two groups (Deck Wants over Manual Wants); standalone Exclusions section removed, excluded auto-wants stay in the auto group dimmed + restore | ✓ |
| Manual first, then Deck | Same two-group idea but Manual Wants on top | |
| One flat list, badges only | No section headers; each row carries an Auto/Manual badge | |

**User's choice:** Two sections, drop Exclusions (Deck Wants on top, Manual Wants below).
**Notes:** Section headers carry the auto/manual distinction, so the "Auto vs manual cue" area was resolved by this choice — no per-row badge needed.

---

## Excluded want display

| Option | Description | Selected |
|--------|-------------|----------|
| Dimmed inline + restore | Excluded rows stay in place, greyed with an Excluded tag + restore, sunk to bottom of the section (current behavior) | ✓ |
| Collapsed 'Hidden' group | Excluded ones tuck into a collapsible "Hidden (N)" disclosure | |
| Count only, no rows | Excluded items vanish; a "N hidden — manage" link reveals them | |

**User's choice:** Dimmed inline + restore, excluded rows sorted to the bottom of Deck Wants.
**Notes:** Preserves current behavior; user sees exactly what's hidden without hunting.

---

## Manual want details

| Option | Description | Selected |
|--------|-------------|----------|
| Variant badge only | Variant badge for non-Normal printings; no owned/not-owned indicator | ✓ |
| Variant + owned hint | Variant badge plus a subtle owned/unowned marker per row | |
| You decide | Leave manual-row adornment to planning | |

**User's choice:** Variant badge only.
**Notes:** Wants list is about what the user is seeking, not what they hold — keep rows clean even though Phase 30 allows wants for unowned cards.

---

## Claude's Discretion

- Section header wording ("Deck Wants" / "Manual Wants" vs other framing).
- Count-pill semantics — whether the Deck Wants count includes dimmed excluded rows.
- Combined/empty-state copy.
- Internal component structure (refactor in place vs split sub-rows), provided the props contract with `manage/page.tsx` holds.

## Deferred Ideas

None — discussion stayed within phase scope.

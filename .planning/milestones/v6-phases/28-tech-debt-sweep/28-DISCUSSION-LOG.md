# Phase 28: Tech Debt Sweep - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-03
**Phase:** 28-tech-debt-sweep
**Areas discussed:** Serialized precedence, DEBT-03 scope, DEBT-04 mechanism

---

## Serialized Precedence

| Option | Description | Selected |
|--------|-------------|----------|
| 8 — above Prestige Foil | Serialized cards are numbered prints (1/25 etc.) — the rarest category. Highest precedence means if you own a Serialized copy, the catalog tile shows its art. | ✓ |
| 7 — equal to Prestige Foil | Treat Serialized as equivalent to Prestige Foil — no strict ordering between the two most premium types. | |
| Below Prestige Foil (rank 6 or lower) | Serialized is rarer but might not have distinct art vs. the base print, so lower precedence makes sense. | |

**User's choice:** 8 — above Prestige Foil
**Notes:** Serialized = 8, becoming the new top of the VARIANT_PRECEDENCE scale.

---

## DEBT-03 Scope

### Schema comment update

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — update comment to list all 8 types | schema.ts currently says "Normal \| Foil \| Hyperspace \| Hyperspace Foil \| Showcase" — update to include Prestige Foil, Prestige, Serialized while we're touching variant definitions. | ✓ |
| No — code comment only, not worth the change | Comments don't affect runtime behavior. Scope the fix to the two functional files only. | |

**User's choice:** Yes — include schema.ts comment update in scope.

### Prestige Foil display order

| Option | Description | Selected |
|--------|-------------|----------|
| After 'Prestige' | Groups the two Prestige variants together: [..., 'Showcase', 'Prestige', 'Prestige Foil', 'Serialized']. Logical pairing. | ✓ |
| After 'Hyperspace Foil' | Groups by foil types together: [..., 'Hyperspace Foil', 'Prestige Foil', ...]. Alternate grouping logic. | |
| At the end, before Serialized | Keep existing order and append: [..., 'Prestige', 'Prestige Foil', 'Serialized']. | |

**User's choice:** After 'Prestige' — groups Prestige variants together.

---

## DEBT-04 Mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Accept the limitation — verify & document only | Manual smoke test confirms the Link-based 'Back to catalog' navigation works correctly. BFCache edge case is acceptable. | |
| Add 'pageshow' listener for BFCache restores | Small addition: `window.addEventListener('pageshow', e => { if (e.persisted && isAuthenticated) fetchCollection() })`. Handles the native back-button case on mobile browsers. | ✓ |
| Refetch on window focus/visibilitychange | Re-fetch collection whenever the tab regains focus. Broader coverage but re-fetches unnecessarily. | |

**User's choice:** Add `pageshow` listener — covers the BFCache edge case on mobile.
**Notes:** The existing `useEffect([isAuthenticated])` already handles the standard remount path. The `pageshow` listener adds coverage for the device back-button case where BFCache prevents remount.

---

## Claude's Discretion

- Exact cleanup wording for the CollectionControls comment references in `variant-collection-section.tsx`
- Whether to extract the collection fetch into a named `fetchCollection` helper to avoid duplication between the two effects
- Test assertions for DEBT-04 (manual verification is acceptable)

## Deferred Ideas

None — discussion stayed within phase scope.

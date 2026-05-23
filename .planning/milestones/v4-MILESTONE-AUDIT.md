---
milestone: v4
audited: 2026-05-21T00:00:00Z
status: gaps_found
scores:
  requirements: 11/12
  phases_verified: 7/9
  integration: 11/12
  flows: 4/5
gaps:
  requirements:
    - id: "REQ-BINDER-06"
      status: "unsatisfied"
      phase: "Phase 19"
      claimed_by_plans: ["19-02-PLAN.md"]
      completed_by_plans: []
      verification_status: "missing"
      evidence: "19-02-SUMMARY confirms explicit abandonment — schema gap: tradeQuantity stored by cardDefinitionId (not per variant), making per-variant badges on trade binder offerings impossible without a schema migration. User acknowledged during Phase 19 execution."
    - id: "REQ-COLLECT-09"
      status: "partial"
      phase: "Phase 20"
      claimed_by_plans: ["20-01-PLAN.md"]
      completed_by_plans: ["20-01-SUMMARY.md"]
      verification_status: "missing"
      evidence: "20-01-SUMMARY.md describes implementation + manual verification. No VERIFICATION.md exists for Phase 20. Implementation appears complete from SUMMARY evidence alone."
    - id: "REQ-FILTER-01"
      status: "partial"
      phase: "Phase 19"
      claimed_by_plans: ["19-01-PLAN.md"]
      completed_by_plans: ["19-01-SUMMARY.md"]
      verification_status: "missing"
      evidence: "19-01-SUMMARY confirms Foil + Hyperspace Foil added to VariantFilter; state tracking added to public binder and deck builder. No VERIFICATION.md. Integration check found Prestige Foil absent from filter options and Serialized missing from VARIANT_PRECEDENCE in select-best-variant.ts."
    - id: "REQ-BINDER-05"
      status: "partial"
      phase: "Phase 19"
      claimed_by_plans: ["19-02-PLAN.md"]
      completed_by_plans: ["19-02-SUMMARY.md"]
      verification_status: "missing"
      evidence: "19-02-SUMMARY confirms VariantFilter added to binder manage page. No VERIFICATION.md for Phase 19."
  integration:
    - "Catalog tile +/- controls intentionally removed (Phase 17 D-03) — users must navigate to card detail page to edit variant counts inline"
    - "DeckBuilder Add Cards tab does not fetch getPrintingArtMap; catalog tiles in deck builder show no variant art override"
    - "Stale collection state after cross-page mutation — catalog art does not refresh after card detail page decrement without a page reload"
  flows:
    - "Flow 2 BROKEN at step: after decrement on card detail page, catalog tile still shows old variant art until full page reload (stale CatalogClient collection state)"
tech_debt:
  - phase: "17.1-card-sync-variant-grouping"
    items:
      - "JSDoc on upsertCards (lines 54-59) still describes removed two-pass strategy — documentation drift, no functional impact"
  - phase: "17-variant-collection-tracking"
    items:
      - "CollectionControls (src/components/catalog/collection-controls.tsx) is dead code — 0 import sites — but calls POST /api/collection which no longer exists. Should be deleted."
      - "Catalog +/- overlay intentionally removed (D-03) — UX regression from pre-v4 behavior. Users cannot update owned count from catalog grid; must visit card detail page."
  - phase: "18-catalog-collection-enhancements"
    items:
      - "DeckBuilder Add Cards tab missing printingArtMap — REQ-COLLECT-08 satisfied on catalog page but not in deck builder catalog tab. src/app/decks/[id]/page.tsx does not call getPrintingArtMap()."
      - "Starter deck route lacks setCode guard — inArray(cardPrintings.collectorNumber) without eq(cardPrintings.setCode) could theoretically match cross-set printings. Low risk in practice."
  - phase: "19-variant-filter-enhancements"
    items:
      - "Prestige Foil absent from VARIANT_OPTIONS in variant-filter.tsx — cards with variantType='Prestige Foil' cannot be isolated via the variant filter"
      - "Serialized present in VARIANT_OPTIONS but absent from VARIANT_PRECEDENCE in select-best-variant.ts — Serialized art will never be preferred over other variant types (precedence score 0)"
  - phase: "19-20-general"
    items:
      - "Catalog collection state not invalidated on card detail page mutation — cross-page count changes (card detail → catalog) only reflect after full page reload"
nyquist:
  compliant_phases: []
  partial_phases: [15, 16, 17, 18]
  missing_phases: ["15.1", "16.1", "17.1", 19, 20]
  overall: "MISSING/PARTIAL — all VALIDATION.md files created but nyquist_compliant: false across all 4 phases that have them; 5 phases (15.1, 16.1, 17.1, 19, 20) have no VALIDATION.md at all"
---

# v4 Milestone Audit — Deck Builder & Collection Depth

**Audited:** 2026-05-21
**Milestone:** v4 — Phases 15–20 (incl. 15.1, 16.1, 17.1)
**Status:** ⚠ GAPS FOUND
**Auditor:** Claude (gsd-audit-milestone)

---

## Summary

| Dimension | Score | Status |
|-----------|-------|--------|
| Requirements satisfied | 8/12 (traceability) | ⚠ Gaps |
| Phases with VERIFICATION.md | 7/9 | ⚠ Unverified |
| Integration wiring | 11/12 | ⚠ One broken |
| E2E flows complete | 4/5 | ⚠ One stale |
| Nyquist compliance | 0/9 | ⚠ None fully compliant |

**One hard blocker:** REQ-BINDER-06 is unsatisfied (schema gap acknowledged during execution — variant badges on trade binder offerings not implementable without a DB migration).

**Two verification gaps:** Phases 19 and 20 have no VERIFICATION.md files (evidence exists in SUMMARY.md files only).

---

## Phase Verification Status

| Phase | VERIFICATION.md | Status | Score | Notes |
|-------|----------------|--------|-------|-------|
| 15: Deck List Display Polish | ✅ Exists | human_needed | 6/6 | Visual tests pending browser verification |
| 15.1: Cost Sort | ✅ Exists | passed | 1/1 | — |
| 16: Guided Onboarding | ✅ Exists | human_needed | 3/3 | Visual tests pending browser verification |
| 16.1: Reorder Tabs | ✅ Exists | passed | 3/3 | — |
| 17: Variant Collection Tracking | ✅ Exists | passed | 4/4 | Human UAT (Plan 08) completed and approved |
| 17.1: Card Sync Grouping | ✅ Exists | human_needed | 4/5 | Idempotency confirmation needs human; JSDoc stale |
| 18: Catalog Enhancements | ✅ Exists | human_needed | 8/8 | Visual tests pending browser verification |
| 19: Variant Filter Enhancements | ❌ Missing | unverified | —/— | BLOCKER: no verification artifact |
| 20: CSV Variant Imports | ❌ Missing | unverified | —/— | BLOCKER: no verification artifact |

---

## Requirements Coverage (3-Source Cross-Reference)

### Requirements in Traceability Table

| REQ-ID | Phase | VERIFICATION.md | SUMMARY Frontmatter | REQUIREMENTS.md | → Final Status |
|--------|-------|----------------|---------------------|-----------------|----------------|
| REQ-DECK-07 | 15 | SATISFIED | listed (15-01) | `[ ]` stale | **satisfied** |
| REQ-DECK-08 | 15 | SATISFIED | in phase 15 scope | `[ ]` stale | **satisfied** |
| REQ-DECK-10 | 15 | SATISFIED (programmatic) | in phase 15 scope | `[ ]` stale | **satisfied** |
| REQ-DECK-09 | 16 | SATISFIED | in phase 16 scope | `[x]` | **satisfied** |
| REQ-COLLECT-06 | 17 | SATISFIED | in phase 17 scope | `[ ]` stale | **satisfied** |
| REQ-COLLECT-07 | 17 | SATISFIED | in phase 17 scope | `[ ]` stale | **satisfied** |
| REQ-COLLECT-08 | 18 | SATISFIED | in phase 18 scope | `[x]` | **satisfied** |
| REQ-CAT-04 | 18 | SATISFIED | in phase 18 scope | `[x]` | **satisfied** |
| REQ-COLLECT-09 | 20 | MISSING | manual verify noted | Complete | **partial** (no VERIFICATION.md) |

### Phase 19 Requirements (in ROADMAP, not in traceability table)

| REQ-ID | Phase | VERIFICATION.md | SUMMARY Evidence | → Final Status |
|--------|-------|----------------|------------------|----------------|
| REQ-FILTER-01 | 19 | MISSING | Foil+HF added to VariantFilter, tracking added to public binder | **partial** (no VERIFICATION; Prestige Foil/Serialized gaps) |
| REQ-BINDER-05 | 19 | MISSING | VariantFilter added to manage page | **partial** (no VERIFICATION.md) |
| REQ-BINDER-06 | 19 | MISSING | **Not implemented** — schema gap acknowledged | **unsatisfied** |

---

## Critical Gaps (Blockers)

### GAP-1: REQ-BINDER-06 — Unsatisfied (Schema Gap)

**Requirement:** Card tiles in the trade binder (offerings) display their variant type if it is not "Normal"

**Status:** Not implemented. During Phase 19, the executor identified a structural constraint: `tradeQuantity` in the existing binder schema is stored against `cardDefinitionId` (not per `cardPrintingId`). As a result, binder offerings have no per-variant identity and cannot display a variant badge.

**Evidence:** 19-02-SUMMARY: *"The plan to add a variant badge was abandoned as the offerings data is not variant-specific."*

**Resolution options:**
1. **Schema migration:** Add a `card_printing_id` FK to the trade offerings table — requires a new phase
2. **Accept as tech debt:** Document in MILESTONES.md and close the milestone with this known gap
3. **Descope:** Move REQ-BINDER-06 to v5 backlog permanently

### GAP-2: Phases 19 and 20 — No VERIFICATION.md

**Status:** Both phases were shipped without verification artifacts. Per the audit workflow, a missing VERIFICATION.md is a blocker flag.

**Mitigating evidence:**
- Phase 19: Both SUMMARY files describe the implemented changes. Integration checker confirms REQ-FILTER-01 and REQ-BINDER-05 are wired.
- Phase 20: 20-01-SUMMARY describes implementation + manual verification with a real CSV.

**Resolution options:**
1. **Write retroactive VERIFICATION.md** for each phase (confirm code, write artifact) — `/gsd-validate-phase 19` and `/gsd-validate-phase 20`
2. **Accept as audit gap** — note in MILESTONES.md and proceed with close

---

## Integration Findings

### BLOCKER → RECLASSIFIED WARNING: Catalog +/- Controls Not Wired

The integration checker initially flagged catalog tile +/- controls as a BLOCKER. After review:

- Phase 17 **intentionally** removed `handleUpdateCount` from `CatalogClient` (documented as D-03 in Phase 17 plans)
- `CollectionControls` still exists as a dead file but has zero import sites — no live impact
- REQ-COLLECT-07 scopes specifically to "**on the card detail page**" — that path is fully wired
- The catalog was redesigned to be read-only; variant editing lives on the card detail page

**Classification: WARNING (intentional UX regression, not a gap against REQ-COLLECT-07)**

### WARNING: DeckBuilder Add Cards Tab Missing `printingArtMap`

`src/app/decks/[id]/page.tsx` does not call `getPrintingArtMap()`. As a result, the "Add Cards" tab inside the deck builder never shows variant art overrides — all tiles display the default Normal art regardless of owned variants.

REQ-COLLECT-08 is satisfied on the `/cards` catalog page. The deck builder Add Cards tab is a degraded experience.

**Affected REQ:** REQ-COLLECT-08 (partial)

### WARNING: Stale Catalog State After Cross-Page Mutation

After a user decrements a variant count on the card detail page (`/cards/[set]/[number]`), returning to the catalog page without a full reload still shows the old variant art. The `CatalogClient` collection state is fetched on mount and not invalidated by mutations on other pages.

**Affected flow:** Flow 2 (BROKEN at final step — correct on reload)

### WARNING: Prestige Foil / Serialized Filter Gaps

- `VariantFilter` has `Prestige` and `Serialized` options but is missing `Prestige Foil`
- `VARIANT_PRECEDENCE` in `select-best-variant.ts` has no entry for `Serialized` — Serialized art will never win a precedence tie

**Affected REQ:** REQ-FILTER-01 (partial)

---

## E2E Flow Results

| Flow | Status | Notes |
|------|--------|-------|
| 1. Empty deck → auto-filter → leader+base → aspect catalog → grouped deck list | COMPLETE | All 6 hops wired |
| 2. Showcase owned → catalog art → card detail counts → decrement → catalog falls back | BROKEN | Catalog state stale after cross-page mutation; correct on reload |
| 3. CSV import → variant counts in DB → catalog updated | COMPLETE | normalizeRedditCsv → import route → upsert → recompute |
| 4. Quick-add starter deck → collection updated | COMPLETE | With WARNING: missing setCode guard |
| 5. Deck builder Want List → shortfall display | COMPLETE | `.total` correctly consumed |

---

## Nyquist Compliance

| Phase | VALIDATION.md | nyquist_compliant | wave_0_complete | Action |
|-------|--------------|-------------------|-----------------|--------|
| 15 | ✅ exists | false | false | `/gsd-validate-phase 15` |
| 16 | ✅ exists | false | false | `/gsd-validate-phase 16` |
| 17 | ✅ exists | false | false | `/gsd-validate-phase 17` |
| 18 | ✅ exists | false | false | `/gsd-validate-phase 18` |
| 15.1 | ❌ missing | — | — | `/gsd-validate-phase 15.1` |
| 16.1 | ❌ missing | — | — | `/gsd-validate-phase 16.1` |
| 17.1 | ❌ missing | — | — | `/gsd-validate-phase 17.1` |
| 19 | ❌ missing | — | — | `/gsd-validate-phase 19` |
| 20 | ❌ missing | — | — | `/gsd-validate-phase 20` |

No phase is fully Nyquist-compliant. Recommend running `/gsd-validate-phase` for phases where verification gaps exist (19, 20 highest priority).

---

## Tech Debt Summary

| Phase | Item | Severity |
|-------|------|----------|
| 17 | `CollectionControls` dead code calls deleted `POST /api/collection` | Warning |
| 17 | Catalog +/- overlay removed — users must visit card detail page to update counts | Warning |
| 17.1 | JSDoc on `upsertCards` still describes removed two-pass strategy | Info |
| 18 | `DeckBuilder` Add Cards tab shows no variant art (no `printingArtMap` fetch in deck page RSC) | Warning |
| 18 | Starter deck route missing `setCode` guard in collector number lookup | Warning |
| 19 | `Prestige Foil` absent from `VariantFilter` options | Warning |
| 19 | `Serialized` in filter UI but not in `VARIANT_PRECEDENCE` map | Warning |
| 19–20 | Catalog collection state not invalidated after card detail page mutation | Warning |

---

## Verdict

**Status: `gaps_found`**

The milestone has one hard unsatisfied requirement (REQ-BINDER-06) and two unverified phases (19, 20). Eight of nine traceability-table requirements are fully satisfied with VERIFICATION.md evidence. The integration is largely sound with a few notable tech debt items.

**Mandatory before closing:**
1. Decide fate of REQ-BINDER-06 (new phase, accept as debt, or descope to v5)
2. Either write retroactive VERIFICATION.md for phases 19 and 20, or acknowledge the gap in MILESTONES.md

**Strongly recommended (can be v5 backlog):**
- Fix catalog tile art in deck builder Add Cards tab
- Fix Prestige Foil filter gap + Serialized precedence
- Delete or replace `CollectionControls` dead code
- Add `setCode` guard to starter deck route
- Run `/gsd-validate-phase 19` and `/gsd-validate-phase 20`

---

*Audit created: 2026-05-21*
*Auditor: Claude (gsd-audit-milestone)*

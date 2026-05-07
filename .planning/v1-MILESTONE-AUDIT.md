---
milestone: 1
audited: 2026-05-07T00:00:00Z
status: gaps_found
scores:
  requirements: 13/15
  phases: 3/5
  integration: 13/15
  flows: 4/5
gaps:
  requirements:
    - id: "WANT-01"
      status: "partial"
      phase: "Phase 5"
      claimed_by_plans: ["05-03-PLAN.md"]
      completed_by_plans: ["05-03-SUMMARY.md"]
      verification_status: "gaps_found"
      evidence: "WantListTab computes shortfall only from deck_cards entries. Leaders and Bases are stored as FK columns on the decks table (leaderCardDefinitionId, baseCardDefinitionId), not in deck_cards, so they are excluded from the deckCards prop passed to WantListTab. A user who doesn't own the Leader or Base required by a deck will not see it in the per-deck want list."
    - id: "WANT-02"
      status: "partial"
      phase: "Phase 5"
      claimed_by_plans: ["05-02-PLAN.md"]
      completed_by_plans: ["05-02-SUMMARY.md"]
      verification_status: "gaps_found"
      evidence: "getDeckCardsForUser() (src/db/queries/decks.ts ~line 167) queries only the deck_cards join table. decks.leaderCardDefinitionId and decks.baseCardDefinitionId are never joined, so the combined /api/want-list endpoint never surfaces Leaders or Bases regardless of whether the user owns them."
  integration:
    - "WANT-01 / WANT-02 — Phase 4→5 Leader/Base shortfall chain: getDeckCardsForUser() queries deck_cards only; decks.leaderCardDefinitionId / decks.baseCardDefinitionId never surfaced to want list computation"
    - "Phase 3 success criterion (rarity filter) — filterCards() has matchesRarity hardcoded to true; rarity dropdown exists in UI but produces no filtering effect"
  flows:
    - "Want list E2E flow (WANT-01, WANT-02): Leader and Base ownership gaps are not surfaced — want list is incomplete for deck slots stored in decks table columns rather than deck_cards"
tech_debt:
  - phase: 02-card-catalog
    items:
      - "VERIFICATION.md missing — phase was UAT'd (all 10 test cases passed) but no formal gsd-verify artifact produced"
      - "VALIDATION.md status is 'draft', nyquist_compliant: false, wave_0_complete: false — Wave 0 browser test stubs were created but not completed (status shows pending)"
      - "SUMMARY.md files lack requirements-completed frontmatter (informal format)"
  - phase: 03-collection
    items:
      - "VERIFICATION.md missing — phase was UAT'd (all tests passed) but no gsd-verify artifact"
      - "SUMMARY.md files missing for all 4 plans (03-01 through 03-04) — only PLAN.md, CONTEXT.md, RESEARCH.md, UAT.md present"
      - "VALIDATION.md missing — no Nyquist validation artifact"
      - "COLLECT-04 fix (03-05-FIX-PLAN.md) was executed and code verified in codebase, but no SUMMARY or re-verification artifact produced for the fix plan"
      - "Rarity filter silently non-functional: src/lib/filter-cards.ts has const matchesRarity = true hardcoded — Phase 3 success criterion #5 (rarity filter) not delivered"
  - phase: 04-deck-builder
    items:
      - "VERIFICATION.md exists but is informal prose — no YAML frontmatter, no structured requirements table, no Observable Truths format"
      - "VALIDATION.md is a strategy doc (no nyquist_compliant frontmatter) — validation plan written but not signed off"
  - phase: 05-want-list
    items:
      - "VERIFICATION.md exists but is informal checklist — no YAML frontmatter, no structured requirements table"
      - "VALIDATION.md missing — no Nyquist validation artifact"
nyquist:
  compliant_phases: []
  partial_phases: ["01-foundation", "02-card-catalog", "04-deck-builder"]
  missing_phases: ["03-collection", "05-want-list"]
  overall: "PARTIAL — no phase is fully Nyquist-compliant; 3 have VALIDATION.md artifacts (varying completeness), 2 are missing entirely"
---

# v1 Milestone Audit — Star Wars Unlimited Tracker

**Milestone:** v1 (all 5 phases)
**Audited:** 2026-05-07
**Status:** gaps_found
**Score:** 13/15 requirements satisfied · 3/5 phases formally verified · 13/15 requirements fully integrated · 4/5 E2E flows complete

---

## Requirements Coverage (3-Source Cross-Reference)

| REQ-ID | Phase | VERIFICATION.md | SUMMARY Frontmatter | REQUIREMENTS.md | Final Status | Notes |
|--------|-------|-----------------|--------------------|-----------------|-----------|----|
| CATALOG-01 | 2 | missing | missing | `[x]` | **satisfied** | UAT all 10 cases passed; integration confirmed; codebase confirmed |
| CATALOG-02 | 2 | missing | missing | `[x]` | **satisfied** | Search wired through filterCards(); integration confirmed |
| CATALOG-03 | 2 | missing | missing | `[x]` | **satisfied** | Set/type/aspect filters work; rarity bypass is Phase 3 tech debt, not in CATALOG-03 scope |
| CATALOG-04 | 1 | human_needed (8/9) | listed | `[x]` | **satisfied** | All code verified; 2 items pending human confirmation (live DB + Vercel deployment) |
| COLLECT-01 | 3 | missing | missing | `[x]` | **satisfied** | UAT 1.1–1.4 passed; GET /api/collection → CatalogClient confirmed |
| COLLECT-02 | 3 | missing | missing | `[x]` | **satisfied** | +/- controls → POST /api/collection → upsertCardCount() confirmed |
| COLLECT-03 | 3 | missing | missing | `[x]` | **satisfied** | Generic CSV path via PapaParse → /api/collection/import confirmed |
| COLLECT-04 | 3 | missing | missing | `[x]` | **satisfied** | normalizeRedditCsv() confirmed in codebase with correct headers; set selector UI present |
| DECK-01 | 4 | informal | missing | `[x]` | **satisfied** | POST /api/decks + validateDeck() enforcement confirmed |
| DECK-02 | 4 | informal | missing | `[x]` | **satisfied** | GET/DELETE /api/decks, /decks page confirmed |
| DECK-03 | 4 | informal | missing | `[x]` | **satisfied** | CatalogClient selector mode passes deckCounts to CardItem confirmed |
| DECK-04 | 4 | informal | missing | `[x]` | **satisfied** | hasShortfall = deckCount > ownedCount → red border confirmed |
| DECK-05 | 4 | informal | missing | `[x]` | **satisfied** | validateDeck() enforces 1 Leader + 1 Base + 50-card + 3-copy limit confirmed |
| WANT-01 | 5 | informal | missing | `[x]` | **partial** | WantListTab works for main deck cards; Leaders/Bases excluded (stored in decks table, not deck_cards) |
| WANT-02 | 5 | informal | missing | `[x]` | **partial** | Combined /api/want-list works for main deck cards; Leaders/Bases never surfaced |

**Score: 13/15 requirements satisfied, 2 partial**

---

## Phase Verification Status

| Phase | VERIFICATION.md | Status | Notes |
|-------|-----------------|--------|-------|
| 01-foundation | ✓ structured | human_needed (8/9) | 2 items need live human verification (DB row count + Vercel deployment) |
| 02-card-catalog | **MISSING** | unverified | UAT completed (10/10 passed); no gsd-verify artifact |
| 03-collection | **MISSING** | unverified | UAT completed (all tests passed); no gsd-verify artifact |
| 04-deck-builder | ✓ informal | passed (informal) | Verification exists but lacks structured frontmatter/requirements table |
| 05-want-list | ✓ informal | passed (informal) | Verification exists but lacks structured frontmatter; does not call out Leader/Base gap |

**Score: 3/5 phases with any VERIFICATION.md (1 structured, 2 informal)**

---

## Integration Report (from gsd-integration-checker)

**Connected:** 18 exports properly used across phases
**Orphaned exports:** 0
**API routes:** 8/8 have callers

### Cross-Phase Chain Results

| Chain | From → To | Status | Issue |
|-------|-----------|--------|-------|
| Card sync → Catalog display | Phase 1 → Phase 2 | WIRED | — |
| Catalog → Collection overlay | Phase 2 → Phase 3 | WIRED | Minor: SUMMARY describes route as GET/PATCH; implementation is GET/POST (internally consistent) |
| Collection → Deck builder shortfall | Phase 3 → Phase 4 | WIRED | — |
| Deck data → Want list computation | Phase 4 → Phase 5 | PARTIAL | Leaders/Bases stored in decks table columns excluded from getDeckCardsForUser() |
| E2E: Import → Catalog → Build → Want List | All phases | FUNCTIONAL with gaps | Leaders/Bases not surfaced in want list if not owned |

### Integration Gaps

**1. Leader/Base shortfall not surfaced in want list (WANT-01, WANT-02)**
- `decks.leaderCardDefinitionId` and `decks.baseCardDefinitionId` are stored as FK columns on the `decks` row
- `getDeckCardsForUser()` (`src/db/queries/decks.ts` ~line 167) queries only the `deck_cards` join table
- `DeckBuilder` passes only `state.cards` (deck_cards entries) to `WantListTab` — leader/base IDs are not included
- Result: users who don't own their Leader or Base card get no signal from either want list view

**2. Rarity filter silently non-functional (Phase 3 success criterion)**
- `src/lib/filter-cards.ts` has `const matchesRarity = true;` — rarity predicate hardcoded, never evaluates `selectedRarities`
- Rarity dropdown is fully wired in UI (options rendered, URL-synced) but produces no filtering effect
- This is a Phase 3 success criterion gap, not a named REQUIREMENTS.md gap (rarity not mentioned in CATALOG-03)

---

## Nyquist Compliance

| Phase | VALIDATION.md | nyquist_compliant | wave_0_complete | Status | Action |
|-------|---------------|-------------------|-----------------|--------|--------|
| 01-foundation | ✓ exists | not set | not set | PARTIAL | No status frontmatter; Wave 0 tests (upsert + cron) confirmed passing |
| 02-card-catalog | ✓ exists | false | false | PARTIAL | Wave 0 browser test stubs created but not completed; `/gsd-validate-phase 2` |
| 03-collection | **MISSING** | — | — | MISSING | `/gsd-validate-phase 3` |
| 04-deck-builder | ✓ exists | not set | not set | PARTIAL | Strategy doc, not a status doc; Playwright tests planned but not confirmed run |
| 05-want-list | **MISSING** | — | — | MISSING | `/gsd-validate-phase 5` |

**Overall: PARTIAL — no phase is fully Nyquist-compliant**

---

## Tech Debt by Phase

**Phase 02 — Card Catalog**
- VERIFICATION.md missing (UAT completed, no gsd-verify artifact)
- VALIDATION.md stuck at draft/false — Wave 0 browser tests not completed
- SUMMARY files lack `requirements-completed` frontmatter

**Phase 03 — Collection**
- VERIFICATION.md missing
- All SUMMARY.md files missing (03-01 through 03-04)
- VALIDATION.md missing entirely
- 03-05-FIX-PLAN.md executed (COLLECT-04 fix confirmed in codebase) but no SUMMARY artifact written
- Rarity filter silently non-functional (`matchesRarity = true` in filter-cards.ts)

**Phase 04 — Deck Builder**
- VERIFICATION.md is informal prose with no structured frontmatter or requirements table
- VALIDATION.md is a strategy document, not a sign-off artifact

**Phase 05 — Want List**
- VERIFICATION.md is an informal checklist with no structured frontmatter
- VALIDATION.md missing
- Does not surface the Leader/Base want-list gap that the integration checker identified

---

## Functional Gaps Requiring Closure

### Gap 1: Want List Excludes Leaders and Bases (WANT-01, WANT-02)

**Root cause:** `getDeckCardsForUser()` joins only the `deck_cards` table. The `decks` table stores `leaderCardDefinitionId` and `baseCardDefinitionId` as FK columns, not in `deck_cards`. These are never queried in the want list computation path.

**Files to fix:**
- `src/db/queries/decks.ts` — `getDeckCardsForUser()` — extend to also return leader and base cards from `decks` table
- `src/app/api/want-list/route.ts` — include leader/base in aggregation
- `src/components/decks/want-list-tab.tsx` — receive leader/base IDs from DeckBuilder state and include in shortfall computation

**Severity:** Functional gap — users get an incomplete want list for decks where they're missing the Leader or Base card.

### Gap 2: Rarity Filter Non-Functional

**Root cause:** `src/lib/filter-cards.ts` line ~80 has `const matchesRarity = true;` — the `selectedRarities` parameter is accepted but never evaluated.

**File to fix:**
- `src/lib/filter-cards.ts` — implement rarity predicate using `selectedRarities` array

**Severity:** Silent UI failure — user can interact with rarity dropdown, URL syncs, but catalog does not filter.

---

## Summary

| Dimension | Score | Status |
|-----------|-------|--------|
| Requirements | 13/15 | gaps_found (WANT-01, WANT-02 partial) |
| Phase verifications | 3/5 | gaps_found (Phases 2, 3 missing VERIFICATION.md) |
| Integration | 13/15 | gaps_found (want list leader/base chain incomplete) |
| E2E flows | 4/5 | gaps_found (want list flow degraded for Leader/Base) |
| Nyquist compliance | 0/5 fully compliant | PARTIAL overall |

The milestone delivers a working core loop — card sync, catalog browsing, collection tracking, deck building, and want lists — with the notable exception that Leaders and Bases missing from the user's collection are not surfaced by the want list feature. The rarity filter is also silently non-functional. Planning artifacts for Phases 2 and 3 are incomplete (no VERIFICATION.md).

---

_Audited: 2026-05-07_
_Auditor: Claude (gsd-audit-milestone)_

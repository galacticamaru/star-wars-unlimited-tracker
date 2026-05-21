# Phase 22: Starter Deck Expansions - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Pure data-entry phase — append new deck entries to `src/data/starter-decks.ts`. The Quick Add infrastructure (API route, UI dropdown, collection upsert logic) is 100% complete from Phase 18 and requires no changes. New entries auto-appear in the Quick Add dropdown with no other code modifications.

Three groups of decks to add:
1. **TS26 Twin Suns precons** — 4 decks (Against the Odds / Improvised Tactics, Aggressive Negotiations, Blood Brothers, Master and Apprentice). Card data in planning CSV.
2. **IBH box precons** — 2 decks from the existing IBH booster box product. Researcher sources from swu-db.com.
3. **Previously deferred Spotlight decks** — SEC Padmé Amidala, LAW Jabba the Hutt, LAW Leia Organa. All 3 now includable; researcher sources from swu-db.com.

</domain>

<decisions>
## Implementation Decisions

### TS26 Twin Suns Precons
- **D-01:** 4 decks total. Card data sourced from the user-supplied CSV: `.planning/phases/22-starter-deck-expansions/TS Pre-Con Deck Breakdown - All Cards.csv`. Planner reads this file directly — no research step needed for TS26 card lists.
- **D-02:** All TS26 precon cards are qty:1. The CSV has no quantity column; every card in each deck entry gets `qty: 1`.
- **D-03:** deckType `'twin-suns'` for all 4 TS26 decks. This type is already in the TypeScript union (`deckType: 'starter' | 'spotlight' | 'twin-suns'`) — no interface change needed.
- **D-04:** setCode `'TS26'` for all four decks.
- **D-05:** CSV collector numbers are bare numbers (e.g., `"009"`, `"031"`). Planner formats them as `SET-NNN` zero-padded to 3 digits (e.g., `TS26-009`, `SOR-150`).

**Data corrections (apply during implementation):**
- **D-06:** `TS26-003` (Maul) appears in the CSV under "Against the Odds / Improvised Tactics" — this is a data error. Maul is ONLY in the Blood Brothers deck. Remove it from the Improvised Tactics entry.
- **D-07:** "Against the Odds / Improvised Tactics" lists two bases (`TS26-009` First Battle Memorial and `TWI-021` The Crystal City). These are two sides of a single double-sided base card. Include only `TS26-009` — omit `TWI-021`.
- **D-08:** "Master and Apprentice" has a final row `Raxus Assembly` with no set code or collector number ("No prior-set match found"). Use `SEC-118` for this card.

### IBH Box Precons
- **D-09:** `IBH` is the exact set code used in our database and on swu-db.com. It is an existing booster set we already support (card definitions already seeded).
- **D-10:** An IBH box includes 2 preconstructed decks. Researcher looks up the deck names, leader/base cards, and full card lists from swu-db.com using set code `IBH`.
- **D-11:** deckType `'starter'` for both IBH decks.

### Previously Deferred Spotlight Decks
- **D-12:** All 3 previously-deferred Spotlight decks are included in this phase:
  - SEC Padmé Amidala — deckType `'spotlight'`
  - LAW Jabba the Hutt — deckType `'spotlight'`
  - LAW Leia Organa — deckType `'spotlight'`
- **D-13:** Researcher sources all 3 from swu-db.com. These decklists are known to exist — if any cannot be found, stop and check in with the user rather than skipping. The user will provide the decklist data directly to unblock the phase.

### Claude's Discretion
- Deck `id` values for TS26 entries — follow existing kebab-case pattern (e.g., `ts26-improvised-tactics`, `ts26-aggressive-negotiations`, `ts26-blood-brothers`, `ts26-master-and-apprentice`)
- Deck display `name` values — use descriptive names consistent with the existing format (check swu-db.com for official product names)
- Whether to remove the `// --- DEFERRED DECKS ---` comment block from `starter-decks.ts` after all entries are added (or update it to reflect any remaining gaps)
- Whether the Quick Add dropdown needs any UI grouping changes for the `twin-suns` deckType — check Phase 18's implementation to see if it groups by deckType or lists flat

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Data File (primary target)
- `src/data/starter-decks.ts` — the file to edit; all new entries append to `starterDecks[]`; `StarterDeck` interface already has `'twin-suns'` in the deckType union

### Quick Add API & Existing Architecture
- `src/app/api/collection/starter-deck/route.ts` — the Quick Add API route; reads `starterDecks` by id and upserts Normal variant counts — no changes needed, just verify it handles any setCode
- `.planning/phases/18-catalog-collection-enhancements/18-CONTEXT.md` — Phase 18 decisions D-05 through D-14 define the full Quick Add architecture; read before planning

### TS26 Card Data
- `.planning/phases/22-starter-deck-expansions/TS Pre-Con Deck Breakdown - All Cards.csv` — user-supplied card list for all 4 TS26 precon decks; columns: Deck, Set, Number, Card Name, Type, Arena, Notes, is_TS26

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 22 — 3 success criteria (TS26 entries, IBH entries, dropdown appearance + function)
- `.planning/REQUIREMENTS.md` — REQ-CAT-04 (Quick Add feature that this phase extends)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `StarterDeck` interface and `starterDecks` array in `src/data/starter-decks.ts` — just append new entries following the identical shape; 11 existing entries are the template
- `'twin-suns'` is already in the deckType union — no TypeScript changes needed for TS26 entries

### Established Patterns
- Each entry: `{ id: string, name: string, setCode: string, deckType: '...', cards: [{ collectorNumber: 'SET-NNN', qty: number }] }`
- Collector number format: `SET-NNN` (uppercase set code, hyphen, 3-digit zero-padded number) — e.g., `SOR-005`, `TS26-009`
- Existing entries mix same-set and cross-set reprints freely within one deck's card list — the Quick Add API resolves any `collectorNumber` regardless of set

### Integration Points
- The Quick Add dropdown on the Collection page (`/collection`) reads directly from the `starterDecks` export — new entries appear in the dropdown immediately with no UI code changes
- The API route resolves `collectorNumber → Normal cardPrintingId` via a DB lookup; it will handle TS26 and IBH collector numbers correctly as long as those cards are seeded in `card_printings`

</code_context>

<specifics>
## Specific Ideas

- **TS26-003 Maul collision:** Blood Brothers contains both `TS26-003 maul` (Leader Unit) and `TS26-030 maul` (non-leader Unit card) — both are intentionally in Blood Brothers. The CSV data error only affects Against the Odds / Improvised Tactics.
- **Double-sided base explanation:** TS26 "Against the Odds / Improvised Tactics" has a physical double-sided base card (TS26-009 / TWI-021). We track only the TS26 face (`TS26-009`) since the DB seeds by collector number.
- **Deferred comment cleanup:** After Phase 22 adds all resolvable decks, the `// --- DEFERRED DECKS ---` block in `starter-decks.ts` should be updated to reflect only genuinely remaining gaps (if any). Don't leave stale comments.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 22-Starter-Deck-Expansions*
*Context gathered: 2026-05-21*

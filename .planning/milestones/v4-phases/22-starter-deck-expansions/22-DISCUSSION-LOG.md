# Phase 22: Starter Deck Expansions - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-21
**Phase:** 22-Starter-Deck-Expansions
**Areas discussed:** TS26 decklist availability, IBH set identity, Previously deferred decks

---

## TS26 Decklist Availability

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, decklists are published | Card lists with collector numbers are available and we can proceed | ✓ |
| No, still blocked | Decklists aren't published yet; phase should wait or descope | |
| Partially available | Some TS26 decklists published but not all four | |

**User's choice:** Yes, decklists are published

---

| Option | Description | Selected |
|--------|-------------|----------|
| swu-db.com API | Researcher queries the API for TS26 cards to get exact collector numbers | |
| swu-db.com website | Look up precon decklist pages directly on the site | |
| I'll provide the card lists | User will supply the collector numbers directly | ✓ |

**User's choice:** User provided data directly

---

| Option | Description | Selected |
|--------|-------------|----------|
| Now — paste in this session | Share decklist data now so it goes straight into CONTEXT.md | ✓ |
| During planning/execution | Provide lists when the planner asks for them | |

**User's choice:** User placed CSV file in `.planning/phases/22-starter-deck-expansions/`

**Notes:** User supplied `TS Pre-Con Deck Breakdown - All Cards.csv` with all 4 TS26 precon deck card lists. Discussion identified 3 data corrections needed:
1. TS26-003 Maul appears in "Against the Odds / Improvised Tactics" CSV rows — this is a data error; Maul only belongs in Blood Brothers
2. "Against the Odds / Improvised Tactics" has two bases (TS26-009 and TWI-021) — these are two faces of a single double-sided base card; only TS26-009 (First Battle Memorial) is included
3. Raxus Assembly in "Master and Apprentice" has no collector number in the CSV; user confirmed it is SEC-118

All cards are qty:1 (TS26 precons include exactly 1 copy of each card). deckType is `'twin-suns'` (already in the TypeScript union).

---

## IBH Set Identity

| Option | Description | Selected |
|--------|-------------|----------|
| Upcoming set with known decklists | Set name, deck names, and card data to be provided | |
| Existing set already in DB | Already seeded; researcher looks up precon decks | ✓ |
| Different acronym to clarify | IBH stands for something specific; user provides full name | |

**User's choice:** IBH is an existing booster set already in our database

---

| Option | Description | Selected |
|--------|-------------|----------|
| I'll provide a CSV like TS26 | User drops a CSV in the planning directory | |
| Look them up on swu-db.com | Researcher sources IBH precon decklists from swu-db.com | ✓ |
| Decklists not available yet | Phase 22 proceeds with just TS26 | |

**User's choice:** Researcher looks up on swu-db.com

---

| Option | Description | Selected |
|--------|-------------|----------|
| starter | Same as SOR/SHD/TWI starter decks; existing type | ✓ |
| A new type (e.g., 'battle-box') | IBH box decks are a distinct product category | |
| spotlight | Close enough to spotlight decks | |

**User's choice:** `starter`

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, IBH is the set code | Researcher can query swu-db.com with 'IBH' | ✓ |
| No, set code is different | IBH is a shorthand; actual code provided | |

**User's choice:** Yes, `IBH` is the exact set code on swu-db.com and in our database

**Notes:** IBH is an existing booster set with 2 preconstructed decks in the box. All card definitions are already seeded. Researcher will use swu-db.com to get deck names and card lists.

---

## Previously Deferred Decks

| Option | Description | Selected |
|--------|-------------|----------|
| Include all if data is available | Researcher checks if missing data is now available | |
| Include SEC Padmé only | Focus on SEC Padmé; skip LAW image-only decks | |
| Skip all deferred decks | Keep Phase 22 focused on TS26 and IBH only | |

**User's choice:** All 3 deferred spotlight decks can be supported (SEC Padmé, LAW Jabba, LAW Leia)

---

| Option | Description | Selected |
|--------|-------------|----------|
| swu-db.com for all three | If decklists are now published, researcher looks them up | ✓ |
| I'll provide CSVs for LAW decks | User supplies LAW data; SEC Padmé from swu-db.com | |
| Researcher checks what's available first | Researcher determines sources and reports gaps | |

**User's choice:** swu-db.com for all three

**Notes:** All 3 previously-deferred Spotlight decks are now includable. Researcher sources from swu-db.com. If any remain unavailable (e.g., SEC Padmé still missing cards), note the gap but don't block the phase.

---

## Claude's Discretion

- Deck `id` values for TS26 entries — follow existing kebab-case pattern
- Deck display `name` values — use canonical product names from swu-db.com/CSV
- Whether to remove or update the `// --- DEFERRED DECKS ---` comment block after entries are added
- Whether the Quick Add dropdown needs UI grouping changes for `twin-suns` deckType

## Deferred Ideas

None — discussion stayed within phase scope.

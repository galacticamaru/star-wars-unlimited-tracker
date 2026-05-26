# Phase 22: Starter Deck Expansions — Pattern Map

**Mapped:** 2026-05-21
**Files analyzed:** 1 (modified)
**Analogs found:** 1 / 1

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/data/starter-decks.ts` | static-data | batch (array append) | itself — 11 existing entries | exact |

---

## Pattern Assignments

### `src/data/starter-decks.ts` (static-data, batch append)

**Analog:** `src/data/starter-decks.ts` — the existing 11 entries are the definitive template.

**Interface pattern** (lines 1–12):
```typescript
export interface StarterDeckCard {
  collectorNumber: string;
  qty: number;
}

export interface StarterDeck {
  id: string;
  name: string;
  setCode: string;
  deckType: 'starter' | 'spotlight' | 'twin-suns';
  cards: StarterDeckCard[];
}
```

**Entry shape pattern** — `deckType: 'starter'` example (lines 15–53, sor-luke):
```typescript
{
  id: 'sor-luke',
  name: 'Luke Skywalker (SOR)',
  setCode: 'SOR',
  deckType: 'starter',
  cards: [
    { collectorNumber: 'SOR-005', qty: 1 }, // Luke Leader
    { collectorNumber: 'SOR-029', qty: 1 }, // Admin Tower
    { collectorNumber: 'SOR-236', qty: 3 },
    // ...
  ],
},
```

**Entry shape pattern** — `deckType: 'spotlight'` example (lines 250–282, jtl-boba-fett):
```typescript
{
  id: 'jtl-boba-fett',
  name: 'Boba Fett – By Any Means Necessary (JTL Spotlight)',
  setCode: 'JTL',
  deckType: 'spotlight',
  cards: [
    { collectorNumber: 'JTL-009', qty: 1 }, // Leader
    { collectorNumber: 'SHD-026', qty: 1 }, // Base
    // ... cross-set reprints use their own set code
  ],
},
```

**Collector number format rule** (observed across all 11 entries):
- Format: `SET-NNN` — uppercase set code, hyphen, 3-digit zero-padded number
- Examples: `SOR-005`, `TS26-009`, `TWI-021`, `SEC-118`
- Cross-set reprints use the reprint's own set code (e.g., `SOR-049` inside a TS26 deck)

**`id` naming convention** (kebab-case, all entries):
- Pattern: `{setcode-lowercase}-{descriptor-kebab}`
- Examples: `sor-luke`, `shd-mando`, `jtl-boba-fett`, `sec-palpatine`
- TS26 ids per CONTEXT.md Discretion: `ts26-improvised-tactics`, `ts26-aggressive-negotiations`, `ts26-blood-brothers`, `ts26-master-and-apprentice`

**`name` display convention** (observed across all 11 entries):
- Starters: `'Character Name (SETCODE)'`
- Spotlight: `'Full Official Name (SETCODE Spotlight)'`
- TS26 twin-suns: use deck product name + `(TS26)` suffix (e.g., `'Against the Odds / Improvised Tactics (TS26)'`)

**`deckType: 'twin-suns'` — new type for TS26 entries:**
- Already in the union: `'starter' | 'spotlight' | 'twin-suns'` (line 10) — no interface change needed
- All 4 TS26 decks use `deckType: 'twin-suns'`

**Deferred comment block** (lines 420–429 — to be updated after Phase 22):
```typescript
// --- DEFERRED DECKS ---
// The following decks are known but cannot be added yet:
//
// SEC Padmé Amidala (Spotlight) — missing 4 upgrade card collector numbers
// LAW Jabba the Hutt (Spotlight) — complete decklist only available as image
// LAW Leia Organa (Spotlight) — complete decklist only available as image
// TS26 Twin Suns precons (x4: ...) — product releases 2026-07-11; ...
```
After Phase 22: remove entries for any decks successfully added. If IBH/Spotlight gaps remain unresolved, update the comment to reflect only the truly remaining gaps (or remove the block entirely if all are resolved).

---

## New Entries: Concrete Templates

### TS26 Deck 1 — Against the Odds / Improvised Tactics

```typescript
{
  id: 'ts26-improvised-tactics',
  name: 'Against the Odds / Improvised Tactics (TS26)',
  setCode: 'TS26',
  deckType: 'twin-suns',
  cards: [
    // D-07: Only TS26-009 (first face); TWI-021 omitted (double-sided base flip)
    // D-06: TS26-003 (Maul) NOT included here — CSV error; Maul belongs to Blood Brothers only
    { collectorNumber: 'TS26-009', qty: 1 }, // Base: First Battle Memorial
    { collectorNumber: 'TS26-008', qty: 1 }, // Leader: Ahsoka Tano
    { collectorNumber: 'TS26-006', qty: 1 }, // Leader: Rex
    // ... 79 remaining cards, all qty: 1 (see RESEARCH.md Deck 1 table)
  ],
},
```

### TS26 Deck 2 — Aggressive Negotiations

```typescript
{
  id: 'ts26-aggressive-negotiations',
  name: 'Aggressive Negotiations (TS26)',
  setCode: 'TS26',
  deckType: 'twin-suns',
  cards: [
    // Two bases included (TS26-011 and SEC-024) — assumption A1: separate physical cards, not double-sided
    { collectorNumber: 'TS26-011', qty: 1 }, // Base: Executioner's Arena
    { collectorNumber: 'SEC-024', qty: 1 }, // Base: Naval Intelligence HQ
    { collectorNumber: 'TS26-002', qty: 1 }, // Leader: Anakin Skywalker
    { collectorNumber: 'TS26-004', qty: 1 }, // Leader: Padmé Amidala
    // ... 82 remaining cards, all qty: 1 (see RESEARCH.md Deck 2 table)
  ],
},
```

### TS26 Deck 3 — Blood Brothers

```typescript
{
  id: 'ts26-blood-brothers',
  name: 'Blood Brothers (TS26)',
  setCode: 'TS26',
  deckType: 'twin-suns',
  cards: [
    // Three Maul cards intentional: TS26-003 (Leader), TS26-030 (Unit), LAW-054 (reprint Unit)
    { collectorNumber: 'TS26-012', qty: 1 }, // Base: Sundari Palace
    { collectorNumber: 'SHD-026', qty: 1 }, // Base: Jabba's Palace
    { collectorNumber: 'TS26-003', qty: 1 }, // Leader: Maul
    { collectorNumber: 'TS26-005', qty: 1 }, // Leader: Savage Opress
    // ... 80 remaining cards, all qty: 1 (see RESEARCH.md Deck 3 table)
  ],
},
```

### TS26 Deck 4 — Master and Apprentice

```typescript
{
  id: 'ts26-master-and-apprentice',
  name: 'Master and Apprentice (TS26)',
  setCode: 'TS26',
  deckType: 'twin-suns',
  cards: [
    // D-08: "Raxus Assembly" had no CSV set/number — use SEC-118
    { collectorNumber: 'TS26-010', qty: 1 }, // Base: Dooku's Palace
    { collectorNumber: 'TWI-023', qty: 1 }, // Base: Lair of Grievous
    { collectorNumber: 'TS26-001', qty: 1 }, // Leader: Count Dooku
    { collectorNumber: 'TS26-007', qty: 1 }, // Leader: Asajj Ventress
    // ... 88 remaining cards, all qty: 1 (see RESEARCH.md Deck 4 table)
    { collectorNumber: 'SEC-118', qty: 1 }, // Raxus Assembly (D-08 correction)
  ],
},
```

---

## Data Gaps — User Confirmation Required Before Implementing

Per RESEARCH.md Data Gaps section and CONTEXT.md D-13. Planner MUST NOT invent collector numbers.

| File | Entry | Gap | Resolution |
|------|-------|-----|------------|
| `src/data/starter-decks.ts` | IBH Leia Organa deck | ~25 of 50 IBH-NNN collector numbers unconfirmed | User provides full IBH checklist OR look up in project's own `card_printings` DB |
| `src/data/starter-decks.ts` | IBH Darth Vader deck | ~25 of 50 IBH-NNN collector numbers unconfirmed | Same as above |
| `src/data/starter-decks.ts` | SEC Padmé Amidala spotlight | Most SET-NNN numbers missing; 2 upgrade cards unknown | User provides complete decklist |
| `src/data/starter-decks.ts` | LAW Jabba the Hutt spotlight | Complete 50-card list with numbers missing | User provides complete decklist |
| `src/data/starter-decks.ts` | LAW Leia Organa spotlight | Complete 50-card list with numbers missing | User provides complete decklist |

---

## Shared Patterns

### Collector Number Format
**Source:** `src/data/starter-decks.ts` — all 11 existing entries
**Apply to:** Every `collectorNumber` value in new entries
```typescript
// CORRECT: uppercase set code + hyphen + 3-digit zero-padded number
{ collectorNumber: 'TS26-009', qty: 1 }
{ collectorNumber: 'SOR-049', qty: 1 }  // cross-set reprint uses its own set code

// WRONG: bare number, wrong padding, lowercase
{ collectorNumber: '9', qty: 1 }        // missing set prefix
{ collectorNumber: 'ts26-009', qty: 1 } // lowercase
{ collectorNumber: 'TS26-9', qty: 1 }   // not zero-padded
```

### Quantity Field
**Source:** `src/data/starter-decks.ts` — existing entries mix qty:1, qty:2, qty:3
**Apply to:** All new entries
```typescript
// TS26 decks: all qty: 1 (per D-02, CSV has no quantity column)
// IBH decks: use actual deck quantities (e.g., qty: 3 for Hoth Trooper) — NOT all qty:1
// Spotlight decks: use actual deck quantities (e.g., qty: 2 or qty: 3 for playsets)
```

### TypeScript Compilation Validation
**No test files needed.** Run after each new entry block:
```bash
npx tsc --noEmit
```
The `StarterDeck` interface at lines 6–12 enforces the shape. Any missing required field or wrong `deckType` value causes a compile error.

---

## Metadata

**Analog search scope:** `src/data/` (single file — no further search needed; the target is its own best analog)
**Files scanned:** 1 (`src/data/starter-decks.ts`, 430 lines, read in one pass)
**Pattern extraction date:** 2026-05-21

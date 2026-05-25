# Phase 22: Starter Deck Expansions — Research

**Researched:** 2026-05-21
**Domain:** Static data entry — `src/data/starter-decks.ts`
**Confidence:** HIGH (TS26 from CSV), LOW (IBH card numbers), LOW (LAW/SEC spotlight full lists)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** 4 TS26 precon decks. Card data from user-supplied CSV.
- **D-02:** All TS26 precon cards are qty:1.
- **D-03:** deckType `'twin-suns'` for all 4 TS26 decks.
- **D-04:** setCode `'TS26'` for all four TS26 decks.
- **D-05:** Collector numbers formatted as `SET-NNN` zero-padded to 3 digits.
- **D-06:** Remove `TS26-003` (Maul) from "Against the Odds / Improvised Tactics" — CSV error.
- **D-07:** In "Against the Odds / Improvised Tactics", include only `TS26-009` (First Battle Memorial) as the base; omit `TWI-021`.
- **D-08:** For "Master and Apprentice", the last row "Raxus Assembly" has no set/number — use `SEC-118`.
- **D-09:** `IBH` is the exact set code used in our database and on swu-db.com.
- **D-10:** An IBH box includes 2 preconstructed decks. Researcher looks up from swu-db.com.
- **D-11:** deckType `'starter'` for both IBH decks.
- **D-12:** All 3 deferred Spotlight decks included: SEC Padmé Amidala, LAW Jabba the Hutt, LAW Leia Organa — all deckType `'spotlight'`.
- **D-13:** If any spotlight deck cannot be found on swu-db.com, stop and check in with user rather than skipping.

### Claude's Discretion
- Deck `id` values for TS26 entries — follow existing kebab-case pattern
- Deck display `name` values — use descriptive names consistent with existing format
- Whether to remove `// --- DEFERRED DECKS ---` comment block after all entries added
- Whether Quick Add dropdown needs UI grouping changes for `twin-suns` deckType

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-CAT-04 (extension) | User can add all cards from a known pre-constructed starter deck to their collection in one action | Adding new deck entries to `starterDecks[]` in `starter-decks.ts` is sufficient — the Quick Add API route and UI already exist and require no changes |
</phase_requirements>

---

## Summary

Phase 22 is a pure data-entry phase. The Quick Add infrastructure (API route at `src/app/api/collection/starter-deck/route.ts`, dropdown UI in `src/app/collection/page.tsx`, `StarterDeck` interface) is 100% complete and requires no code changes. New deck entries added to `starterDecks[]` in `src/data/starter-decks.ts` automatically appear in the Quick Add dropdown and work correctly.

Three groups of decks need to be added:
1. **TS26 Twin Suns precons (4 decks)** — Complete card data available from the user-supplied CSV, with 3 data corrections applied per CONTEXT.md D-06/D-07/D-08.
2. **IBH box precons (2 decks)** — "Intro Battle: Hoth". Card compositions confirmed via web research; IBH is a 104-card introductory product (cards 1–52 = Leia deck, 53–104 = Vader deck). Full individual collector numbers for every card could not be verified to exact `IBH-NNN` format for all 50 cards per deck — see Data Gaps section.
3. **Deferred Spotlight decks (3 decks)** — SEC Padmé Amidala, LAW Jabba the Hutt, LAW Leia Organa. Full collector-numbered decklists could not be obtained via automated web research — see Data Gaps section.

**Primary recommendation:** Implement TS26 decks immediately from the complete CSV data. For IBH and Spotlight decks, user confirmation of collector numbers is required before implementation (D-13 applies).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Deck card data | Static data file (`src/data/starter-decks.ts`) | — | Design decision from Phase 18: hard-coded static arrays, no DB table |
| Quick Add API | API/Backend (`/api/collection/starter-deck`) | — | Already implemented; reads `starterDecks` by id, upserts Normal variant counts |
| Quick Add UI | Frontend Client (`/collection` page) | — | Already implemented; `<select>` dropdown renders flat list of all starterDecks |
| deckType grouping in dropdown | Frontend Client | — | Currently FLAT LIST — no grouping by deckType; see UI note below |

---

## Standard Stack

This phase has no new library dependencies. All implementation uses existing infrastructure.

| Component | File | Status |
|-----------|------|--------|
| Deck data | `src/data/starter-decks.ts` | EXISTS — append new entries |
| Interface | `StarterDeck` (in same file) | EXISTS — `deckType: 'starter' \| 'spotlight' \| 'twin-suns'` |
| Quick Add API | `src/app/api/collection/starter-deck/route.ts` | EXISTS — no changes needed |
| Quick Add UI | `src/app/collection/page.tsx` | EXISTS — no changes needed |

---

## Architecture Patterns

### Quick Add UI — Flat List (No grouping by deckType)
[VERIFIED: read `src/app/collection/page.tsx`]

The current dropdown renders a flat `{starterDecks.map(...)}` with no `<optgroup>` grouping:

```tsx
{starterDecks.map((deck) => (
  <option key={deck.id} value={deck.id}>{deck.name}</option>
))}
```

Adding 9 new decks (4 TS26 + 2 IBH + 3 spotlight) will grow the list from 11 to 20 entries. This may warrant grouping by deckType in a future improvement but is NOT required for this phase per the decisions. The planner's discretion per CONTEXT.md.

### Collector Number Format
[VERIFIED: read `src/data/starter-decks.ts`]

All collector numbers follow `SET-NNN` format (uppercase set code, hyphen, 3-digit zero-padded number):
- `TS26-009`, `SOR-150`, `TWI-021`
- Cross-set reprints use the reprint's own set code: e.g., `SOR-049` even when inside a TS26 deck entry

### Entry Shape (from existing entries)
```typescript
{
  id: 'ts26-improvised-tactics',   // kebab-case
  name: 'Against the Odds / Improvised Tactics (TS26)',
  setCode: 'TS26',
  deckType: 'twin-suns',
  cards: [
    { collectorNumber: 'TS26-009', qty: 1 },
    // ...
  ],
}
```

---

## TS26 Twin Suns Precon Card Lists

Parsed from `.planning/phases/22-starter-deck-expansions/TS Pre-Con Deck Breakdown - All Cards.csv` with corrections D-06, D-07, D-08 applied.
[VERIFIED: read CSV file]

### Deck 1: Against the Odds / Improvised Tactics
**Proposed id:** `ts26-improvised-tactics`
**D-06 applied:** `TS26-003` (Maul) REMOVED — CSV data error.
**D-07 applied:** `TWI-021` (The Crystal City) OMITTED — double-sided base, track TS26 face only.

Cards (all qty: 1):

| Collector Number | Card Name | Type |
|-----------------|-----------|------|
| TS26-009 | First Battle Memorial | Base |
| TS26-031 | Chaotic Diversion | Event |
| SOR-150 | Heroic Sacrifice | Event |
| TS26-032 | Reckless Landing | Event |
| TS26-069 | Remove the Chip | Event |
| SOR-173 | Bombing Run | Event |
| TS26-080 | Reveal Intentions | Event |
| SOR-217 | Shoot First | Event |
| TS26-068 | Arms Deal | Event |
| SOR-199 | Bamboozle | Event |
| TWI-171 | Grenade Strike | Event |
| TWI-172 | Grim Resolve | Event |
| SEC-232 | Kreia's Whispers | Event |
| TS26-081 | Mislead | Event |
| SHD-231 | Surprise Strike | Event |
| LAW-246 | The Axe Forgets | Event |
| LOF-226 | Tip the Scale | Event |
| SEC-233 | Beguile | Event |
| TS26-082 | Evade Arrest | Event |
| TWI-052 | Hello There | Event |
| SOR-171 | Mission Briefing | Event |
| TWI-174 | Open Fire | Event |
| SOR-221 | Outmaneuver | Event |
| JTL-180 | Piercing Shot | Event |
| TS26-071 | Take Action | Event |
| TS26-083 | Take Aim | Event |
| TS26-047 | Take Cover | Event |
| TS26-084 | Fearless Attack | Event |
| SOR-077 | Takedown | Event |
| TS26-048 | Vanquish the Legion | Event |
| TS26-008 | Ahsoka Tano | Leader Unit |
| TS26-006 | Rex | Leader Unit |
| TS26-039 | Captain Vaughn | Unit |
| SOR-193 | Millennium Falcon | Unit |
| SOR-145 | K-2SO | Unit |
| TWI-146 | Steela Gerrera | Unit |
| TWI-064 | Ki-Adi-Mundi | Unit |
| TS26-034 | Fives | Unit |
| SOR-049 | Obi-Wan Kenobi | Unit |
| SHD-154 | Wrecker | Unit |
| TS26-036 | Tribunal | Unit |
| SOR-204 | Greedo | Unit |
| SOR-140 | SpecForce Soldier | Unit |
| TS26-043 | Wartime Refugee | Unit |
| TS26-020 | 501st Veteran | Unit |
| TS26-065 | Bo-Katan Kryze | Unit |
| SEC-043 | Chandrilan Sponsor | Unit |
| SOR-141 | Green Squadron A-Wing | Unit |
| SHD-146 | Heroic Renegade | Unit |
| SEC-200 | Junior Senator | Unit |
| TWI-044 | Kashyyyk Defender | Unit |
| SOR-189 | Leia Organa | Unit |
| SEC-057 | Lobot | Unit |
| SEC-058 | Lost Jedi | Unit |
| LOF-207 | Loth-Cat | Unit |
| LOF-044 | Loth-Wolf | Unit |
| LOF-192 | N-1 Starfighter | Unit |
| TS26-062 | R2-D2 | Unit |
| TS26-076 | Wartime Profiteer | Unit |
| SHD-166 | Disabling Fang Fighter | Unit |
| JTL-151 | Red Five | Unit |
| JTL-051 | Red Squadron X-Wing | Unit |
| TS26-041 | Twilight | Unit |
| SHD-043 | Village Protectors | Unit |
| SOR-045 | Yoda | Unit |
| TS26-066 | Wartime Pirate | Unit |
| SOR-065 | Baze Malbus | Unit |
| TS26-077 | Deployed Droideka | Unit |
| TS26-067 | Ruping Rider | Unit |
| TWI-147 | Anakin Skywalker | Unit |
| TS26-078 | Barriss Offee | Unit |
| LAW-083 | Broken Horn | Unit |
| TS26-042 | Relief Frigate | Unit |
| SOR-067 | Rugged Survivors | Unit |
| LAW-045 | Zeb Orellios | Unit |
| LOF-199 | Depa Billaba | Unit |
| TS26-063 | Rex's DC-17s | Upgrade |
| TS26-035 | Ahsoka's Lightsabers | Upgrade |
| TS26-079 | Underestimated | Upgrade |
| SEC-070 | Armor of Fortune | Upgrade |
| TS26-037 | Abandoned the Order | Upgrade |
| TS26-045 | Champion | Upgrade |

**Total cards:** 82 (2 leader units + 1 base + 50 units + 23 events + 6 upgrades)

> Note: TS26 Twin Suns precons are larger than standard 50-card starter decks. The Quick Add API iterates all cards in `deck.cards` regardless of count, so larger decks work correctly.

---

### Deck 2: Aggressive Negotiations
**Proposed id:** `ts26-aggressive-negotiations`

Cards (all qty: 1):

| Collector Number | Card Name | Type |
|-----------------|-----------|------|
| TS26-011 | Executioner's Arena | Base |
| SEC-024 | Naval Intelligence HQ | Base |
| TS26-046 | Secret Marriage | Event |
| TS26-064 | Urgent Mission | Event |
| TWI-129 | In Defense of Kamino | Event |
| SOR-104 | U-Wing Reinforcement | Event |
| TS26-068 | Arms Deal | Event |
| TS26-056 | Galactic Escalation | Event |
| TS26-057 | Mechanize | Event |
| SHD-105 | Spark of Hope | Event |
| SEC-179 | Aggressive Negotiations | Event |
| TWI-173 | Blood Sport | Event |
| TS26-071 | Take Action | Event |
| TS26-060 | Take Charge | Event |
| TS26-047 | Take Cover | Event |
| TWI-251 | Drop In | Event |
| TS26-084 | Fearless Attack | Event |
| TS26-061 | Encircle | Event |
| TS26-072 | Fervor | Event |
| TS26-002 | Anakin Skywalker | Leader Unit |
| TS26-004 | Padmé Amidala | Leader Unit |
| TS26-019 | Coleman Trebor | Unit |
| SOR-160 | Wolffe | Unit |
| TWI-092 | Admiral Yularen | Unit |
| SHD-115 | Cobb Vanth | Unit |
| TS26-040 | Obi-Wan Kenobi | Unit |
| TS26-023 | Assault Lander LAAT | Unit |
| TS26-018 | Jendirian Valley | Unit |
| TS26-055 | Jedi General | Unit |
| SHD-153 | Poe Dameron | Unit |
| TS26-014 | Yoda | Unit |
| TWI-050 | Luminara Unduli | Unit |
| LOF-149 | Mace Windu | Unit |
| LOF-254 | Porg | Unit |
| TWI-240 | 332nd Stalwart | Unit |
| TWI-056 | Compassionate Senator | Unit |
| TS26-053 | Coruscanti Spy | Unit |
| SHD-055 | Moisture Farmer | Unit |
| SEC-146 | Rebellious Functionary | Unit |
| TWI-141 | Soldier of the 501st | Unit |
| TS26-043 | Wartime Refugee | Unit |
| TS26-020 | 501st Veteran | Unit |
| TWI-142 | Anakin's Interceptor | Unit |
| SOR-095 | Battlefield Marine | Unit |
| TS26-015 | C-3PO | Unit |
| LAW-048 | Chio Fain | Unit |
| TWI-106 | Coruscant Guard | Unit |
| TWI-090 | Echo | Unit |
| SEC-111 | Jar Jar Binks | Unit |
| LOF-144 | Jedi Starfighter | Unit |
| LOF-095 | Lor San Tekka | Unit |
| LOF-059 | Nightsister Warrior | Unit |
| TWI-043 | Outspoken Representative | Unit |
| TWI-107 | Patrolling V-Wing | Unit |
| TS26-062 | R2-D2 | Unit |
| TWI-091 | Republic Tactical Officer | Unit |
| SOR-044 | Restored ARC-170 | Unit |
| TS26-017 | Rush Clovis | Unit |
| JTL-160 | Supporting Eta-2 | Unit |
| TWI-109 | 501st Liberator | Unit |
| TWI-144 | Batch Brothers | Unit |
| TWI-046 | Captain Typho | Unit |
| JTL-064 | Omicron Strike Craft | Unit |
| TS26-041 | Twilight | Unit |
| TS26-066 | Wartime Pirate | Unit |
| TS26-044 | Arena Reek | Unit |
| SEC-254 | Heroic ARC-170 | Unit |
| LOF-162 | Hunting Nexu | Unit |
| JTL-068 | Perimeter AT-RT | Unit |
| SEC-063 | Rotunda Senate Guards | Unit |
| TS26-067 | Ruping Rider | Unit |
| TS26-054 | Wartime Mercenaries | Unit |
| TWI-114 | Clone Commander Cody | Unit |
| TS26-042 | Relief Frigate | Unit |
| TS26-024 | Sundari Gauntlet | Unit |
| SEC-048 | Captain Rex | Unit |
| SOR-148 | Guerilla Attack Pod | Unit |
| TWI-149 | Low Altitude Gunship | Unit |
| JTL-170 | War Juggernaut | Unit |
| TWI-169 | Clone Cohort | Upgrade |
| TS26-025 | Fiery Alliance | Upgrade |
| TWI-070 | Perilous Position | Upgrade |
| SEC-176 | Sudden Ferocity | Upgrade |
| TS26-045 | Champion | Upgrade |

**Total cards:** 86 (2 leader units + 2 bases + 56 units + 21 events + 5 upgrades)

> Note: "Aggressive Negotiations" has TWO bases (`TS26-011` and `SEC-024`). Unlike the Improvised Tactics case (D-07), there is no CSV note about one being a flip side of the other. Both are included. The Quick Add API resolves by collector number and handles this correctly.

---

### Deck 3: Blood Brothers
**Proposed id:** `ts26-blood-brothers`

Cards (all qty: 1):

| Collector Number | Card Name | Type |
|-----------------|-----------|------|
| TS26-012 | Sundari Palace | Base |
| SHD-026 | Jabba's Palace | Base |
| SOR-219 | Sneak Attack | Event |
| TS26-070 | Backed by Black Sun | Event |
| TS26-058 | Backed by the Pykes | Event |
| TS26-059 | Brothers | Event |
| TWI-225 | Now There Are Two of Them | Event |
| JTL-123 | Dogfight | Event |
| TS26-080 | Reveal Intentions | Event |
| TS26-068 | Arms Deal | Event |
| TS26-056 | Galactic Escalation | Event |
| TS26-057 | Mechanize | Event |
| TS26-081 | Mislead | Event |
| TS26-082 | Evade Arrest | Event |
| TS26-072 | Fervor | Event |
| LAW-217 | Hold For Questioning | Event |
| SHD-244 | No Bargain | Event |
| TWI-127 | Resupply | Event |
| TS26-071 | Take Action | Event |
| TS26-083 | Take Aim | Event |
| TS26-060 | Take Charge | Event |
| TS26-003 | Maul | Leader Unit |
| TS26-005 | Savage Opress | Leader Unit |
| SHD-185 | Doctor Evazan | Unit |
| TS26-021 | Gar Saxon | Unit |
| TS26-028 | Prime Minister Almec | Unit |
| TS26-029 | Ziton Moj | Unit |
| TS26-026 | Mother Talzin | Unit |
| SOR-133 | Seventh Sister | Unit |
| TS26-030 | Maul | Unit |
| SHD-172 | Krayt Dragon | Unit |
| SEC-079 | Corrupt Politician | Unit |
| TS26-053 | Coruscanti Spy | Unit |
| LOF-228 | Forged Starfighter | Unit |
| SHD-134 | Guavian Antagonizer | Unit |
| SHD-080 | Salacious Crumb | Unit |
| LOF-107 | Village Tender | Unit |
| TWI-166 | Aurra Sing | Unit |
| TS26-065 | Bo-Katan Kryze | Unit |
| LAW-173 | BT-1 | Unit |
| LAW-070 | Devaronian Doorbuster | Unit |
| LAW-075 | Interrogation Droid | Unit |
| LAW-135 | Pirate Snub Fighter | Unit |
| LOF-081 | Sith Legionnaire | Unit |
| LOF-131 | Strikeship | Unit |
| TS26-076 | Wartime Profiteer | Unit |
| TWI-132 | Confederate Tri-Fighter | Unit |
| JTL-184 | Contracted Jumpmaster | Unit |
| SHD-136 | Death Watch Loyalist | Unit |
| SHD-084 | Phase-III Dark Trooper | Unit |
| LOF-085 | Praetorian Guard | Unit |
| TS26-074 | Pre Vizsla | Unit |
| SEC-166 | Republic Aurek Starfighter | Unit |
| LOF-183 | Shin Hati | Unit |
| LAW-081 | Sullustan Sapper | Unit |
| TS26-066 | Wartime Pirate | Unit |
| LOF-210 | Charging Phillak | Unit |
| TS26-077 | Deployed Droideka | Unit |
| LAW-159 | Expendable Mercenary | Unit |
| TS26-027 | Fortune and Glory | Unit |
| LOF-113 | Jedi Temple Guards | Unit |
| LAW-054 | Maul | Unit |
| LAW-060 | Quarren Contractor | Unit |
| TS26-067 | Ruping Rider | Unit |
| JTL-224 | Shadowed Hover Tank | Unit |
| LAW-082 | Urrr'k | Unit |
| TS26-054 | Wartime Mercenaries | Unit |
| SEC-086 | Cruel Commandos | Unit |
| TS26-051 | Lom Pyke | Unit |
| LOF-116 | Relic Scavenger | Unit |
| SOR-134 | Ruthless Raider | Unit |
| TS26-024 | Sundari Gauntlet | Unit |
| LOF-136 | Thralls of the Coven | Unit |
| JTL-225 | Corporate Light Cruiser | Unit |
| SEC-140 | Hondo Ohnaka | Unit |
| JTL-119 | Resupply Carrier | Unit |
| TWI-137 | Savage Opress | Unit |
| SHD-124 | Legal Authority | Upgrade |
| SOR-137 | Fallen Lightsaber | Upgrade |
| TS26-022 | The Darksaber | Upgrade |
| TS26-025 | Fiery Alliance | Upgrade |
| JTL-192 | In Debt to Crimson Dawn | Upgrade |
| TS26-052 | Sith Traditions | Upgrade |
| SEC-226 | Sneaking Suspicion | Upgrade |

**Total cards:** 84 (2 leader units + 2 bases + 58 units + 15 events + 7 upgrades)

> Note: Blood Brothers contains **three Maul cards**: `TS26-003` (Leader Unit), `TS26-030` (non-leader Unit), and `LAW-054` (older reprint Unit). All three are intentional and correct per CONTEXT.md Specifics section.

---

### Deck 4: Master and Apprentice
**Proposed id:** `ts26-master-and-apprentice`
**D-08 applied:** Last CSV row "Raxus Assembly" has no set/number — use `SEC-118`.

Cards (all qty: 1):

| Collector Number | Card Name | Type |
|-----------------|-----------|------|
| TS26-010 | Dooku's Palace | Base |
| TWI-023 | Lair of Grievous | Base |
| TS26-033 | Kouhun Assassination | Event |
| JTL-229 | Diversion | Event |
| TS26-056 | Galactic Escalation | Event |
| TS26-081 | Mislead | Event |
| SOR-186 | No Good to Me Dead | Event |
| TWI-238 | Merciless Contest | Event |
| TS26-083 | Take Aim | Event |
| TWI-128 | Take Captive | Event |
| TS26-060 | Take Charge | Event |
| TS26-047 | Take Cover | Event |
| SEC-091 | Corporate Warmongering | Event |
| TWI-190 | On the Doorstep | Event |
| TS26-048 | Vanquish the Legion | Event |
| TS26-061 | Encircle | Event |
| SOR-092 | Overwhelming Barrage | Event |
| TS26-001 | Count Dooku | Leader Unit |
| TS26-007 | Asajj Ventress | Leader Unit |
| TS26-016 | King Katuunko | Unit |
| TWI-080 | Poggle the Lesser | Unit |
| TS26-038 | Dooku's Solar Sailer | Unit |
| TS26-073 | Moralo Eval | Unit |
| TS26-017 | Rush Clovis | Unit |
| TS26-049 | Separatist Council | Unit |
| TS26-050 | General Grievous | Unit |
| TS26-075 | Jango Fett | Unit |
| TS26-013 | Darth Sidious | Unit |
| JTL-191 | Invincible | Unit |
| TWI-085 | Kalani | Unit |
| TWI-187 | Cad Bane | Unit |
| SOR-038 | Count Dooku | Unit |
| TWI-207 | B1 Security Team | Unit |
| TS26-053 | Coruscanti Spy | Unit |
| LAW-097 | Imperial Door Technician | Unit |
| TS26-043 | Wartime Refugee | Unit |
| TWI-252 | Aggrieved Parliamentarian | Unit |
| TS26-015 | C-3PO | Unit |
| SOR-178 | Cartel Spacer | Unit |
| TWI-079 | Confederate Courier | Unit |
| SEC-215 | Emissary's Sheathipede | Unit |
| TWI-210 | Lux Bonteri | Unit |
| JTL-033 | Onyx Squadron Brute | Unit |
| SHD-029 | Pyke Sentinel | Unit |
| TWI-031 | Rune Haako | Unit |
| TWI-183 | Rush Clovis | Unit |
| TWI-180 | Separatist Commando | Unit |
| TS26-076 | Wartime Profiteer | Unit |
| SEC-217 | Zenuas Shadow Fighter | Unit |
| TWI-229 | Battle Droid Escort | Unit |
| TWI-033 | Calculating MagnaGuard | Unit |
| TWI-081 | Droid Commando | Unit |
| TWI-181 | Elite P-38 Starfighter | Unit |
| LOF-110 | Hive Defense Wing | Unit |
| TS26-074 | Pre Vizsla | Unit |
| TWI-230 | Super Battle Droid | Unit |
| SHD-085 | Superlaser Technician | Unit |
| SHD-031 | The Client | Unit |
| LOF-065 | Watto | Unit |
| TS26-044 | Arena Reek | Unit |
| TS26-077 | Deployed Droideka | Unit |
| TS26-027 | Fortune and Glory | Unit |
| SEC-033 | Sly Moore | Unit |
| TS26-054 | Wartime Mercenaries | Unit |
| SEC-263 | Assassin Probe | Unit |
| TWI-113 | B2 Legionnaires | Unit |
| TS26-078 | Barriss Offee | Unit |
| TWI-036 | Devastating Gunship | Unit |
| TWI-084 | Kraken | Unit |
| TS26-051 | Lom Pyke | Unit |
| TS26-042 | Relief Frigate | Unit |
| TWI-185 | Ziro the Hutt | Unit |
| JTL-071 | CR90 Relief Runner | Unit |
| LOF-120 | Trident Assault Ship | Unit |
| SOR-071 | Electrostaff | Upgrade |
| SOR-122 | Traitorous | Upgrade |
| SHD-071 | Top Target | Upgrade |
| TS26-079 | Underestimated | Upgrade |
| TS26-052 | Sith Traditions | Upgrade |
| SEC-039 | Creditor's Claim | Upgrade |
| TS26-037 | Abandoned the Order | Upgrade |
| SEC-123 | Unveiled Might | Upgrade |
| TS26-045 | Champion | Upgrade |
| SEC-118 | Raxus Assembly | Upgrade |

**Total cards:** 92 (2 leader units + 2 bases + 67 units + 11 events + 10 upgrades)

---

## IBH (Intro Battle: Hoth) Deck Lists

**Discovery:** IBH = "Intro Battle: Hoth" — a 104-card introductory box product (2025) with two pre-built 50-card decks.
[CITED: starwarsunlimited.com/products/intro-battle-hoth, Amazon product listing]

**Card numbering structure:** Cards 1–52 = Leia/Rebel deck; cards 53–104 = Vader/Imperial deck.
[CITED: swudb.com search results confirming IBH-001=Leia, IBH-002=Echo Caverns, IBH-053=Vader, IBH-054=Forward Command Post]

### CONFIRMED Card Numbers (from verified sources)

From swudb.com direct URL searches and Spanish-language card collection site cross-reference:

| IBH# | Card Name |
|------|-----------|
| 001 | Leia Organa – Get to Your Transports! (Leader) |
| 002 | Echo Caverns, Hoth (Base) |
| 003 | Chewbacca – Rrruuuurrr |
| 004 | Rogue Squadron Speeder |
| 005 | Trench Defender |
| 006 | Rebellion Y-Wing |
| 007 | Echo Coordinator |
| 008 | I'll Cover For You (Event) |
| 009 | I've Found Them (Event) |
| 010 | Han Solo – Scruffy-Looking Nerf Herder |
| 011 | R2-D2 – Known to Make Mistakes |
| 012 | (unknown) |
| 013 | Recovery (Event) |
| 014 | Bright Hope – Narrow Escape |
| 015 | Tauntaun Mount |
| 016 | Ion Cannon |
| 018 | Go For The Legs (Event) |
| 019 | C-3PO – Oh Dear, Oh Dear |
| 020 | Luke Skywalker – Do You Read Me? |
| 021 | Improvised Detonation (Event) |
| 022 | GR-75 Medium Transport |
| 023 | General Rieekan – Stalwart Tactician |
| 031 | Millennium Falcon – Bucket of Bolts |
| 037 | Hoth Trooper |
| 052 | Watch This (Event) |
| 053 | Darth Vader – Don't Fail Me Again (Leader) |
| 054 | Forward Command Post, Hoth (Base) |
| 055 | First Legion Trooper |
| 056 | Ground Assault AT-AT |
| 057 | Snowtrooper Vanguard |
| 058 | Lambda Shuttle |
| 059 | Target the Main Generator (Event) |
| 060 | Admiral Piett – In Command Now |
| 061 | We're In Trouble (Event) |
| 062 | Imperial Deck Officer |
| 063 | Snowtrooper |
| 064 | Hoth Lieutenant |
| 066 | Too Strong for Blasters (Event) |
| 068 | General Veers – Leading the Assault |
| 069 | E-Web Gunner |
| 070 | Blizzard Force AT-ST |
| 072 | Avenger – Hunting the Rebels |
| 074 | I Want Proof, Not Leads (Event) |
| 078 | Surface Assault Bomber |
| 079 | Death Squadron Star Destroyer |
| 082 | Admiral Ozzel – As Clumsy As He Is Stupid |
| 085 | Blizzard One – Veers at the Helm |
| 092 | (referenced by swudb.com — name unknown) |
| 095 | You Have Failed Me (Event) |
| 096 | Rampaging Wampa |
| 104 | The Desolation of Hoth (Event) |

**WARNING — DATA GAP:** Many card numbers in the range 1–52 and 53–104 are unconfirmed. Specifically:
- Several card numbers between 001–052 are not verified (IBH-012, IBH-016 may be another event, IBH-017, IBH-024–030, IBH-032–036, IBH-038–051 unknown)
- Several card numbers between 053–104 are not verified (IBH-065, IBH-067, IBH-071, IBH-073, IBH-075–077, IBH-080–081, IBH-083–084, IBH-086–091, IBH-093–094, IBH-097–103 unknown)

**Verified deck compositions** (card names confirmed, some numbers missing):

**IBH Leia Organa / Rebel Deck (50 cards):**
- Leader: Leia Organa – Get to Your Transports! (IBH-001) — Command/Heroism
- Base: Echo Caverns, Hoth (IBH-002) — Cunning
- Ground Units (28): C-3PO, Chewbacca, Echo Coordinator (x3), General Rieekan, Han Solo, Hoth Trooper (x3), Ion Cannon, Luke Skywalker, R2-D2, Rogue Squadron Speeder (x3), Tauntaun Mount (x3), Trench Defender (x3)
- Space Units (12): Bright Hope (x2), Evacuation Escort (x3), GR-75 Medium Transport (x3), Millennium Falcon, Rebellion Y-Wing (x3)
- Events (10): Go For The Legs (x2), I've Found Them (x2), Improvised Detonation (x2), I'll Cover For You (x2), Recovery, Watch This
[CITED: Web search result from LaserGaming article with full Leia deck composition]

**IBH Darth Vader / Imperial Deck (50 cards):**
- Leader: Darth Vader – Don't Fail Me Again (IBH-053) — Aggression/Villainy
- Base: Forward Command Post, Hoth (IBH-054) — Vigilance
- Ground Units (28): Admiral Ozzel (x2), Admiral Piett (x2), Blizzard Force AT-ST (x3), Blizzard One, E-Web Gunner (x2), First Legion Trooper (x3), General Veers (x2), Ground Assault AT-AT (x2), Hoth Lieutenant (x2), Imperial Deck Officer (x2), Rampaging Wampa, Snowtrooper (x3), Snowtrooper Vanguard (x3)
- Space Units (12): Avenger, Death Squadron Star Destroyer (x2), Lambda Shuttle (x3), Scouting TIE Fighter (x3), Surface Assault Bomber (x3)
- Events (10): I Want Proof Not Leads (x2), Target the Main Generator (x2), The Desolation of Hoth, Too Strong for Blasters (x2), We're In Trouble (x2), You Have Failed Me
[CITED: Web search result confirming complete Vader deck composition]

---

## DATA GAPS — User Confirmation Required (D-13)

The following decklists have **incomplete or unverified collector numbers**. Per D-13, the planner MUST NOT implement these from assumed data. The user must provide the missing information.

### GAP 1: IBH Deck Card Numbers

**What is known:** Full 50-card composition of both IBH decks (card names and quantities).
**What is missing:** Individual `IBH-NNN` collector numbers for ~25–30 cards per deck.
**Risk:** Without exact collector numbers, the Quick Add API cannot resolve cards in `card_printings` (it looks up by `collectorNumber`). Cards not found are silently skipped.
**Resolution options:**
1. User provides full IBH set checklist (from physical product or swu-db.com)
2. Researcher checks swudb.com directly (requires browser — the site blocks automated fetch)
3. The IBH set checklist may be available in the project's own database if IBH cards have been seeded

**Known confirmed numbers (from research):**
- IBH-001 through IBH-023 (many confirmed, some gaps)
- IBH-053 and IBH-054 (both confirmed)
- IBH-055 through IBH-104 (partial, many gaps)

**Quantities for IBH decks:** Unlike TS26 (all qty:1), IBH cards have multiples (e.g., 3x Echo Coordinator, 3x Hoth Trooper). The `qty` field in the deck entry must reflect actual quantities.

---

### GAP 2: SEC Padmé Amidala Spotlight Deck

**Leader:** SEC-016 (Padmé Amidala, What Do You Have to Hide?) — Cunning/Heroism [CITED]
**Base:** SEC-022 (Senate Rotunda) [CITED: deduced from existing `sec-palpatine` entry which uses SEC-022 as base — needs verification that Padmé shares this base]

> **Note:** The existing `sec-palpatine` entry in `starter-decks.ts` uses `SEC-022` as the base. The Padmé deck reportedly also uses Senate Rotunda — verify this matches or uses a different base.

**Confirmed card names and partial numbers from research:**

Ground Units (25 total):
- 3x Ahsoka Tano – I Learned It From You
- 3x Anakin Skywalker – Secret Husband (SEC-201 area)
- 1x B2EMO – That's Two Lies
- 2x Bail Organa – Responding to Catastrophe
- 1x C-3PO – Anything I Might Do? (SEC-015 area)
- 3x Captain Typho – All Necessary Precautions (TWI-046)
- 3x Furtive Handmaiden
- 1x Hunter – Extraordinary Tracker
- 1x Jar Jar Binks – Mesa Propose… (SEC-111)
- 1x Kelleran Beq – The Sabered Hand
- 2x Mina Bonteri – Stop This War
- 1x Mon Mothma – Clinging to Hope
- 2x Naboo Security Force
- 1x Seasoned Fleet Admiral

Space Units (13 total):
- 2x Bravo Squadron Fighter
- 3x J-Type Nubian Starship
- 1x Naboo Royal Starship – Fit For A Queen
- 2x N-1 Starfighter (LOF-192 or SEC version)
- 2x Nubian Star Skiff
- 2x Stinger Mantis – Where Are We Going?
- 1x Taylander Shuttle

Events (8 total):
- 2x Bog Down in Procedure
- 1x Charged with Corruption
- 1x Dismantle the Conspiracy
- 2x Dogfight
- 2x With Thunderous Applause

Upgrades (4 total):
- 2x Sneaking Suspicion (SEC-226) [CITED]
- 2x Moral Authority (SEC-256) [CITED]
- (2 more upgrade cards — names and numbers unknown)

**What is missing:** Individual `SET-NNN` collector numbers for most cards, plus names/numbers of 2 remaining upgrade cards. This was explicitly the blocking issue noted in the `// --- DEFERRED DECKS ---` comment: "missing 4 upgrade card collector numbers."

**Resolution:** User must provide the complete decklist with collector numbers, or the planner must look up each card name against the SEC card database to resolve numbers.

---

### GAP 3: LAW Jabba the Hutt Spotlight Deck

**Leader:** LAW-015 (Jabba the Hutt, His High Exaltedness) — Cunning/Villainy [CITED]
**Base:** LAW-023 (Great Pit of Carkoon) — Special [CITED]

**Known cards from research:**
- Special cards (3x each, deck-exclusive): Salacious Crumb (LAW-210), Malakili (LAW-212), The Sarlacc of Carkoon (LAW-163)
- Jabba's Rancor (LAW-216)
- Syndicate Spice Runner (LAW-136)
- Black Sun Patroller (LAW-211)
- Black Sun Cabalist (LAW-249)
- Bib Fortuna (LAW-134)
- Unmarked Credits (LAW-244)

**What is missing:** Complete 50-card list with all SET-NNN collector numbers and exact quantities.

**Resolution:** User must provide the complete official decklist. The CONTEXT.md notes this decklist "only available as image" was the original deferral reason — if the user has since obtained it, they should provide it here.

---

### GAP 4: LAW Leia Organa Spotlight Deck

**Leader:** LAW-010 (Leia Organa, Someone Who Loves You) — Command/Heroism [CITED]
**Base:** LAW-020 (Daimyo's Palace) — Common [CITED]

**Known cards from research:**
- Special cards (3x each, deck-exclusive): Han Solo (LAW-037), R2-D2 (LAW-145), Lando Calrissian (unknown LAW#), Leia's Disguise (LAW-111)
- Zeb Orellios (LAW-045)
- Jaunty Light Freighter (LAW-147)
- Lepi Lookout (LAW-038)
- Massassi Group Marines (LAW-146)
- Cinta Kaz, Bodhi Rook, Scarif Lieutenant, Jyn Erso, C-3PO
- Sabine's Masterpiece, Mon Mothma Clinging to Hope, Common Cause, Nothing Left to Fear

**What is missing:** Complete 50-card list with all SET-NNN collector numbers and exact quantities.

**Resolution:** User must provide the complete official decklist.

---

## Quick Add UI — deckType Grouping Assessment

[VERIFIED: read `src/app/collection/page.tsx`]

The current dropdown renders a **flat list** with no grouping:
```tsx
{starterDecks.map((deck) => (
  <option key={deck.id} value={deck.id}>{deck.name}</option>
))}
```

There are **no `<optgroup>` elements** grouping by deckType. The 11 existing entries display in array order.

**Impact of adding 9 more decks (when all gaps resolved):** The dropdown will have 20 entries, all flat. This is functional but may be slightly unwieldy. Whether to add grouping is marked as Claude's Discretion in CONTEXT.md.

**deckType `'twin-suns'` in dropdown:** The existing code does not filter or exclude any deckType — all entries appear. The `deckType` field in the TS interface exists but is not used in the UI render logic. TS26 decks will appear automatically.

---

## Common Pitfalls

### Pitfall 1: Quantity field on IBH decks
**What goes wrong:** Using `qty: 1` for all IBH cards when the actual decks have 2x or 3x copies.
**Why it happens:** CSV TS26 data correctly uses qty:1, which may cause copy-paste pattern for IBH.
**How to avoid:** IBH deck composition confirmed with quantities (e.g., 3x Hoth Trooper). Planner must use correct qty values.
**Warning signs:** Quick Add adds fewer cards than expected (e.g., 50 instead of full card count).

### Pitfall 2: TWI-021 (The Crystal City) still included in Improvised Tactics
**What goes wrong:** Missing D-07 correction, including the flip-side base.
**Why it happens:** CSV has both `TS26-009` and `TWI-021` for Improvised Tactics.
**How to avoid:** Only include `TS26-009` as the base entry.

### Pitfall 3: TS26-003 (Maul) in Improvised Tactics
**What goes wrong:** CSV data error leads to Maul appearing in the wrong deck.
**Why it happens:** CSV has `TS26-003` under "Against the Odds / Improvised Tactics".
**How to avoid:** Per D-06, remove `TS26-003` from Improvised Tactics entirely. Blood Brothers gets `TS26-003` (correct).

### Pitfall 4: Raxus Assembly missing collector number
**What goes wrong:** Last row of Master and Apprentice CSV has no set code or number.
**Why it happens:** Original CSV note says "No prior-set match found".
**How to avoid:** Per D-08, use `SEC-118` for this card.

### Pitfall 5: Deferred comment block not updated
**What goes wrong:** `// --- DEFERRED DECKS ---` comment block left in `starter-decks.ts` even after successfully adding TS26 decks.
**Why it happens:** Comment cleanup is easily forgotten.
**How to avoid:** Per CONTEXT.md specifics, update the deferred block to reflect only genuinely remaining gaps after implementation.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected for this data file — the Quick Add API has integration test coverage via the existing route test patterns |
| Quick run | `npx tsc --noEmit` (TypeScript compilation check) |
| Full suite | `npm run test` (if test runner configured) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Notes |
|--------|----------|-----------|-------|
| REQ-CAT-04 | New decks appear in dropdown and add cards | Manual smoke test | Visit `/collection`, verify new deck names in dropdown, click "Add to Collection" |
| REQ-CAT-04 | TypeScript compilation succeeds | Type check | `npx tsc --noEmit` |
| REQ-CAT-04 | Card counts are correct | Manual verify | Check that `cardsAdded` in toast matches expected deck size |

### Wave 0 Gaps
- No new test files needed — data-only change
- TypeScript compiler validates the entry shape against `StarterDeck` interface automatically
- If `nyquist_validation` is enabled: run `npx tsc --noEmit` after each deck entry block is added

---

## Security Domain

This phase adds static data to a TypeScript file. No new API endpoints, no new user inputs, no new authentication paths. The existing Quick Add API already validates `deckId` against `starterDecks` (prevents tampering with unknown deck IDs) — this validation automatically covers any new entries added.

| ASVS Category | Applies | Control |
|---------------|---------|---------|
| V5 Input Validation | No new inputs | Existing: deckId validated against starterDecks array |
| V4 Access Control | No change | Existing: auth check in route.ts |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | "Aggressive Negotiations" has two bases (TS26-011 and SEC-024) as separate physical cards (not a double-sided card like Improvised Tactics) | TS26 Deck 2 | If they ARE double-sided, only include TS26-011 (same pattern as D-07) |
| A2 | IBH cards in the deck have multiples (2x or 3x of common cards) matching the verified deck composition | IBH Data Gaps | If all qty:1, Quick Add adds fewer cards than the actual product contains |
| A3 | SEC Padmé Amidala spotlight uses SEC-022 (Senate Rotunda) as base — same as Palpatine | SEC Data Gaps | If wrong, the deck entry will fail to resolve a base card |
| A4 | The IBH set is already seeded in `card_printings` (CONTEXT.md D-09 says it's an "existing booster set we already support") | IBH Deck Lists | If IBH cards are NOT in card_printings, Quick Add API will silently skip them all |

---

## Open Questions

1. **IBH full collector number list**
   - What we know: Full deck compositions (50 cards each), confirmed numbers for ~25/50 cards per deck
   - What's unclear: IBH-NNN for ~25 remaining cards in each deck
   - Recommendation: User provides the full IBH checklist, OR implementer looks up each card name against the project's own `card_printings` DB to find the seeded collector numbers

2. **SEC Padmé upgrade cards (2 missing)**
   - What we know: 2 of 4 upgrades (SEC-226 Sneaking Suspicion, SEC-256 Moral Authority)
   - What's unclear: Names and numbers of the other 2 upgrade cards
   - Recommendation: User provides complete deck list; this was the original blocking issue

3. **LAW Jabba and LAW Leia complete decklists**
   - What we know: Leaders, bases, special cards, and several key cards confirmed
   - What's unclear: All remaining cards with exact collector numbers and quantities
   - Recommendation: Per D-13, user must provide these if not findable on swu-db.com

4. **Aggressive Negotiations — two bases**
   - What we know: CSV shows both TS26-011 and SEC-024 as Base type entries
   - What's unclear: Are these a double-sided card (like Improvised Tactics) or two separate physical bases?
   - Recommendation: Treat as two separate base entries (include both) unless user confirms otherwise

5. **Quick Add UI grouping for twin-suns deckType**
   - What we know: Current UI is a flat list, deckType not used in rendering
   - What's unclear: Whether adding optgroup grouping improves UX enough to warrant the change
   - Recommendation: Add as optional polish if planner determines it's worth the UI change

---

## Sources

### Primary (HIGH confidence)
- `src/data/starter-decks.ts` — read directly; confirmed interface, entry shape, existing entries
- `src/app/collection/page.tsx` — read directly; confirmed flat dropdown rendering
- `src/app/api/collection/starter-deck/route.ts` — read directly; confirmed API handles any setCode
- `.planning/phases/22-starter-deck-expansions/TS Pre-Con Deck Breakdown - All Cards.csv` — read directly; all 4 TS26 deck card lists
- `.planning/phases/22-starter-deck-expansions/22-CONTEXT.md` — read directly; all locked decisions

### Secondary (MEDIUM confidence)
- starwarsunlimited.com/articles/my-first-battle — IBH Leia deck composition confirmed
- Web search results confirming IBH Vader deck composition
- swudb.com search results confirming LAW-010=Leia, LAW-015=Jabba, LAW-020=Daimyo's Palace, LAW-023=Great Pit of Carkoon
- swudb.com confirming IBH-001=Leia, IBH-002=Echo Caverns, IBH-053=Vader, IBH-054=Forward Command Post
- LaserGaming article confirming Leia deck composition with card names and some numbers
- Web search results confirming SEC Padmé deck unit/event composition

### Tertiary (LOW confidence — needs validation)
- Individual IBH-NNN numbers beyond the confirmed ones
- Complete LAW spotlight deck lists
- SEC Padmé deck remaining upgrade names/numbers

---

## Metadata

**Confidence breakdown:**
- TS26 card lists: HIGH — parsed directly from user-supplied CSV with corrections applied
- IBH deck compositions: MEDIUM — card names/quantities confirmed via multiple sources; collector numbers partially missing
- LAW/SEC spotlight collector numbers: LOW — partial data only; full lists not accessible via automated research
- Architecture/integration: HIGH — read directly from codebase

**Research date:** 2026-05-21
**Valid until:** 2026-07-01 (TS26 product releases 2026-07-11; research remains valid until then)

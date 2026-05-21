---
phase: 22-starter-deck-expansions
verified: 2026-05-21T00:00:00Z
status: human_needed
score: 9/9 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Open /collection in a running app instance, open the Quick Add dropdown, and confirm 'Against the Odds / Improvised Tactics (TS26)', 'Aggressive Negotiations (TS26)', 'Blood Brothers (TS26)', 'Master and Apprentice (TS26)', 'Leia Organa – Get to Your Transports! (IBH Starter)', and 'Darth Vader – Don\'t Fail Me Again (IBH Starter)' are present as selectable options."
    expected: "All 6 new decks appear in the dropdown alongside the existing 14 decks."
    why_human: "Dropdown rendering requires a running Next.js dev server and a browser — cannot verify statically."
  - test: "Select 'Blood Brothers (TS26)' and click 'Add to Collection'. Observe the count returned."
    expected: "Cards added count is > 0 (the API finds Normal variant printings for TS26 cards in the DB and upserts them)."
    why_human: "API execution against the live Neon DB required — cannot verify statically."
  - test: "Select 'Leia Organa – Get to Your Transports! (IBH Starter)' and click 'Add to Collection'. Observe the count returned."
    expected: "Cards added count is > 0 (IBH cards are seeded in DB; upsert proceeds correctly)."
    why_human: "Requires live DB access to verify IBH collector numbers resolve to card_printings rows."
---

# Phase 22: Starter Deck Expansions Verification Report

**Phase Goal:** Add TS26 and IBH preconstructed decks to the Quick Add feature
**Verified:** 2026-05-21
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Four TS26 precon decks (ts26-improvised-tactics, ts26-aggressive-negotiations, ts26-blood-brothers, ts26-master-and-apprentice) appear in starterDecks[] with deckType 'twin-suns' | VERIFIED | Lines 422, 512, 604, 696 in starter-decks.ts; 4 occurrences of `deckType: 'twin-suns'` confirmed |
| 2 | Each TS26 deck has setCode 'TS26' and all collector numbers formatted as SET-NNN | VERIFIED | All TS26 entries carry `setCode: 'TS26'`; all cards follow the SET-NNN pattern (e.g., 'TS26-009', 'SOR-150') |
| 3 | D-06 applied: TS26-003 (Maul) is NOT in ts26-improvised-tactics | VERIFIED | Single occurrence of TS26-003 at line 630, which is inside ts26-blood-brothers; absent from ts26-improvised-tactics (lines 422–510) |
| 4 | D-07 applied: TWI-021 is NOT in ts26-improvised-tactics | VERIFIED | grep for TWI-021 returns zero matches in the entire file |
| 5 | D-08 applied: ts26-master-and-apprentice contains SEC-118 (Raxus Assembly) | VERIFIED | SEC-118 present at line 784, the last card entry in ts26-master-and-apprentice (closes at line 785) |
| 6 | Two IBH precon decks (ibh-leia-rebel, ibh-vader-imperial) appear in starterDecks[] with deckType 'starter' | VERIFIED | Lines 791 and 851; both have `deckType: 'starter'`, `setCode: 'IBH'`, all qty: 1; 52 entries each (IBH-001..IBH-052 and IBH-053..IBH-104) |
| 7 | New decks appear in the Quick Add dropdown on /collection | VERIFIED (static) | collection/page.tsx line 11 imports starterDecks; line 203 maps all entries to dropdown options unconditionally — no filtering by deckType |
| 8 | New decks are wired to the Quick Add API | VERIFIED | route.ts line 7 imports starterDecks; line 24 uses `.find((d) => d.id === deckId)` — any new id in the array is automatically reachable |
| 9 | TypeScript interface accepts 'twin-suns' deckType | VERIFIED | StarterDeck interface (lines 6–11) has `deckType: 'starter' \| 'spotlight' \| 'twin-suns'`; no schema changes required |

**Score:** 9/9 truths verified

### Deferred Items

No items deferred to later phases.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/data/starter-decks.ts` | 4 TS26 + 2 IBH + 3 spotlight entries appended | VERIFIED | 20 total deck entries confirmed; all 9 new entries present |
| `src/app/api/collection/starter-deck/route.ts` | Unchanged — reads starterDecks by id | VERIFIED | No modifications; import of starterDecks confirmed at line 7 |
| `src/app/collection/page.tsx` | Unchanged — maps starterDecks to dropdown | VERIFIED | No modifications; starterDecks mapped unconditionally at line 203 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/data/starter-decks.ts` | `src/app/api/collection/starter-deck/route.ts` | `import { starterDecks }` + `starterDecks.find(d => d.id === deckId)` | WIRED | Import at route.ts line 7; usage at line 24 |
| `src/data/starter-decks.ts` | `src/app/collection/page.tsx` | `import { starterDecks }` + `starterDecks.map(deck => <option>)` | WIRED | Import at page.tsx line 11; map at line 203 |
| Quick Add API | DB (card_printings) | `inArray(cardPrintings.collectorNumber, collectorNumbers)` | WIRED | route.ts lines 37–48; resolves collector numbers against Normal variant printings |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `collection/page.tsx` dropdown | `starterDecks` (static import) | `src/data/starter-decks.ts` static array | Yes — statically populated at build time | FLOWING |
| Quick Add API response | `cardsAdded` | DB upsert via `incrementVariantCount` per deck card | Yes — DB query per collector number | FLOWING (requires live DB to confirm > 0 result; see human verification) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| ts26-improvised-tactics entry count in file | `grep -c "ts26-improvised-tactics" starter-decks.ts` | 1 | PASS |
| TS26-003 absent from improvised-tactics | grep for TS26-003 — single match at line 630 (blood-brothers) | 0 in improvised-tactics section | PASS |
| TWI-021 absent from file | grep returns no matches | 0 | PASS |
| SEC-118 last card in master-and-apprentice | line 784 — immediately before closing `],` at line 785 | Present, last entry | PASS |
| IBH-001..IBH-052 present in ibh-leia-rebel | Lines 796 and 847 confirmed | Boundary entries present | PASS |
| IBH-053..IBH-104 present in ibh-vader-imperial | Lines 856 and 907 confirmed | Boundary entries present | PASS |
| No RESOLVED_ placeholders in output | grep returns 0 matches | 0 | PASS |
| No DEFERRED DECKS comment block | grep returns 0 matches | 0 | PASS |
| 20 total deck entries in array | id: ' pattern — 20 lines | 20 | PASS |
| starterDecks imported by route.ts | line 7 confirmed | Present | PASS |
| starterDecks mapped to dropdown in page.tsx | line 203 confirmed | Present | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| REQ-CAT-04 | 22-01, 22-02, 22-03 | User can add all cards from a known pre-constructed starter deck to their collection in one action | SATISFIED | Phase 18 established the infrastructure (marked Complete in REQUIREMENTS.md); Phase 22 extends the deck list to include TS26 and IBH entries. The Quick Add mechanism (API + dropdown) is unchanged and all new deck ids resolve via the existing `.find()` lookup. |

**Note on REQUIREMENTS.md traceability table:** The table maps REQ-CAT-04 to Phase 18 with status "Complete" — this is correct because the mechanism was built in Phase 18. Phase 22 is a data extension of the same feature, not a new requirement. No requirements-table update is needed.

### Anti-Patterns Found

| File | Lines | Pattern | Severity | Impact |
|------|-------|---------|----------|--------|
| `src/data/starter-decks.ts` | 964, 968, 970–972, 975, 1001–1003 | TODO commented-out cards in law-jabba-the-hutt (6 cards) and law-leia-organa (3 cards) | INFO | These are code comments — they compile away entirely and do not affect runtime behavior. The 9 cards are spotlight-deck-exclusive and absent from the Neon DB. Plan 03 explicitly specified the comment-out path for unresolvable cards. The decks appear in the dropdown and the API will add all currently-resolvable cards. Not a blocker. |

**Stub classification note:** The commented-out LAW lines are not stubs — they are non-executing comments that do not affect the rendered dropdown or the API's card-lookup loop. The decks are active with 13 and 17 live entries respectively.

### Human Verification Required

#### 1. Quick Add dropdown contains all 6 new decks

**Test:** Start the development server (`npm run dev`), navigate to `/collection`, open the "Select Starter Deck" dropdown.
**Expected:** The following new options appear: "Against the Odds / Improvised Tactics (TS26)", "Aggressive Negotiations (TS26)", "Blood Brothers (TS26)", "Master and Apprentice (TS26)", "Leia Organa – Get to Your Transports! (IBH Starter)", "Darth Vader – Don't Fail Me Again (IBH Starter)".
**Why human:** Requires a running Next.js dev server and browser. Static wiring is confirmed but render output cannot be verified programmatically.

#### 2. TS26 deck adds cards correctly

**Test:** Select "Blood Brothers (TS26)" and click "Add to Collection" (authenticated session required).
**Expected:** Success message shows "Added N cards" where N > 0. TS26 cards are expected to exist in the Neon DB if the DB was seeded with TS26 card_printings.
**Why human:** Requires live Neon DB access. The API is correctly wired but whether TS26 collector numbers resolve to DB rows depends on the DB seed state.

#### 3. IBH deck adds cards correctly

**Test:** Select "Leia Organa – Get to Your Transports! (IBH Starter)" and click "Add to Collection" (authenticated session required).
**Expected:** Success message shows "Added N cards" where N > 0. IBH is described as an existing supported set (D-09 in CONTEXT.md: "IBH is an existing booster set we already support").
**Why human:** Requires live Neon DB access to confirm IBH-NNN collector numbers resolve to card_printings rows.

### Gaps Summary

No gaps found. All programmatically-verifiable must-haves are VERIFIED:
- All 4 TS26 Twin Suns precon decks are present with correct deckType, setCode, and data corrections (D-06, D-07, D-08)
- Both IBH starter decks are present with deckType 'starter', setCode 'IBH', all qty: 1
- The DEFERRED DECKS comment block is removed
- The starterDecks array is imported by both the collection page (dropdown) and the API route (card resolution)
- The data flow from starter-decks.ts → dropdown and starter-decks.ts → API is fully wired

The LAW and SEC spotlight decks (bonus scope in plans 02 and 03) are also present. The 9 LAW spotlight-exclusive cards that could not be resolved from the DB are correctly commented out as TODOs per the plan specification — this is the accepted partial-completeness state for those two decks, not a failure.

Remaining work requires human verification of live API behavior to confirm the phase goal ("add cards correctly") is end-to-end functional.

---

_Verified: 2026-05-21_
_Verifier: Claude (gsd-verifier)_

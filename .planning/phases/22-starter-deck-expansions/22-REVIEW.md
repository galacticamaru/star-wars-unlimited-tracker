---
phase: 22-starter-deck-expansions
reviewed: 2026-05-21T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - src/data/starter-decks.ts
findings:
  critical: 0
  warning: 4
  info: 2
  total: 6
status: issues_found
---

# Phase 22: Code Review Report

**Reviewed:** 2026-05-21
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

Phase 22 appended new `StarterDeck` objects to the `starterDecks[]` array in `src/data/starter-decks.ts`. The new entries cover: four Twin Suns (TS26) preconstructed decks, two IBH starter decks (Leia and Vader), one SEC Spotlight (Padmé Amidala), and two LAW Spotlight decks (Jabba the Hutt and Leia Organa).

TypeScript structural compliance is clean: all objects satisfy the `StarterDeck` / `StarterDeckCard` interfaces, no missing required fields, all `id` values are unique, and `collectorNumber` formats follow the expected `SETCODE-NNN` pattern throughout. No duplicate collector numbers exist within any single deck.

Four data-quality warnings were found. The most user-visible is that the two LAW Spotlight decks are knowingly shipped with incomplete card lists — 9 commented-out TODO entries — and the quick-add feature will silently deliver fewer cards than the actual physical deck contains. Additionally, `ts26-improvised-tactics` has 82 cards while all three peer TS26 decks have 84 cards, a 2-card shortfall that needs verification.

---

## Warnings

### WR-01: LAW Spotlight decks are partially populated — quick-add delivers incorrect card counts

**File:** `src/data/starter-decks.ts:964–1003`

**Issue:** `law-jabba-the-hutt` and `law-leia-organa` both contain `TODO` comments for spotlight-deck-exclusive cards whose collector numbers are not yet known. Those entries are fully commented out, meaning the array objects the API operates on are structurally complete but factually incomplete.

- `law-jabba-the-hutt`: 13 card entries (33 total qty) vs. the complete deck's ~49 total qty. Six distinct cards — Jabba's Guard (×3), Skiff Cargo Hold (×3), Underworld Connections (×2), Cunning Deal (×3), Payoff (×2), Bargaining for Life (×3) — are missing.
- `law-leia-organa`: 17 card entries (42 total qty) vs. the complete deck's ~50 total qty. Three cards — Boushh's Thermals (×3), Commanding Presence (×2), Infiltration Plan (×3) — are missing.

The `starter-deck` API route uses `cardsAdded` as a success response that the UI renders verbatim ("Added N cards from deck X to your collection"). A user quick-adding either LAW deck receives a misleading confirmation: the count is silently reduced and their collection is missing 8–16 cards from the physical product with no indication that anything was skipped.

The `printingByNumber.get()` miss path at `route.ts:59` intentionally silences missing cards ("skip silently — could be a data gap"), which means the code will not error — the incomplete data ships functionally but incorrectly.

**Fix:** Two acceptable approaches:
1. Block quick-add for these decks until collector numbers are resolved. Add an optional `incomplete?: true` flag to `StarterDeck` and reject `deckId` values for incomplete decks at the API:
```typescript
// In StarterDeck interface
incomplete?: boolean;

// In route.ts
if (deck.incomplete) {
  return new Response('Deck data incomplete — quick-add unavailable', { status: 422 });
}
```
2. Expose the deck in the UI as disabled/grayed out with a tooltip explaining data is pending, so users are not surprised.

Either way, the silent under-count is the defect to fix.

---

### WR-02: `ts26-improvised-tactics` has 82 cards; all three peer TS26 decks have 84

**File:** `src/data/starter-decks.ts:421–509`

**Issue:** The four Twin Suns preconstructed decks are physically the same product format (84-card Commander-style decks, all `qty: 1`). Three decks (`ts26-aggressive-negotiations`, `ts26-blood-brothers`, `ts26-master-and-apprentice`) each have exactly 84 entries. `ts26-improvised-tactics` has only 82 entries. This 2-card gap is likely a transcription error rather than an intentional structural difference.

The CSV source file (`TS Pre-Con Deck Breakdown - All Cards.csv`) is available in the phase directory and should be the authoritative reference. This defect was not caught before commit.

**Fix:** Cross-reference `ts26-improvised-tactics` against the CSV source. Identify the two missing cards and add them. If the physical deck genuinely differs in count, add an explanatory comment.

---

### WR-03: `sec-padme-amidala` and `sec-palpatine` share the same base (`SEC-022`)

**File:** `src/data/starter-decks.ts:389, 918`

**Issue:** Both SEC Spotlight decks list `SEC-022` as their base card with `qty: 1`. This is not a structural error — different real decks can legitimately share a base. However, it creates a behavioral side-effect: a user who quick-adds both decks will have `qty: 2` for a single-copy base card, which is physically impossible and inflates the collection count.

The route does not de-duplicate across decks (by design — it increments per add). This is only a problem because both are selectable from the same picker dropdown with no warning that adding the second will double-count the base.

**Fix:** Either add a UI note warning that the same base is shared, or — if the `recomputeTotal` logic already handles this gracefully — verify and document it explicitly. No code change required if the collection total logic caps single-copy cards. Verify that `incrementVariantCount` at `src/db/queries/collection.ts` does not allow qty to exceed a meaningful ceiling for base cards.

---

### WR-04: Nine `TODO` comments with placeholder collector numbers (`LAW-???`) in shipped data

**File:** `src/data/starter-decks.ts:964, 968, 970, 971, 972, 975, 1001, 1002, 1003`

**Issue:** Nine commented-out lines use the placeholder string `LAW-???`, which is not a valid collector number. If any of these entries are ever accidentally un-commented without replacing the placeholder, they will be inserted into the `collectorNumbers` array passed to the `inArray` DB query. The DB query will simply find no match and silently skip them (the same miss path noted in WR-01), so this is not a crash risk — but it would produce confusing behavior.

More practically, these TODOs signal unresolved research debt that is not tracked anywhere except inline comments, making them easy to forget.

**Fix:** Track the pending collector numbers as a discrete open issue (in STATE.md or a phase plan) rather than solely as inline comments. Consider adding a lint/test check that asserts no `collectorNumber` value in `starterDecks` matches `???`:
```typescript
// In a test file:
import { starterDecks } from '@/data/starter-decks';
test('no placeholder collector numbers', () => {
  for (const deck of starterDecks) {
    for (const card of deck.cards) {
      expect(card.collectorNumber).not.toContain('???');
    }
  }
});
```
This would catch an accidental uncomment immediately.

---

## Info

### IN-01: Cross-deck card sharing between SHD starters (`SHD-251`, `SHD-223`)

**File:** `src/data/starter-decks.ts:122, 158–161`

**Issue:** `SHD-251` appears in both `shd-mando` (qty: 3) and `shd-gideon` (qty: 1). `SHD-223` appears in both at qty: 2 each. This is valid game data — both were sold as separate physical products and legally share cards — but it is worth confirming intentionality since `shd-gideon` already has `SHD-251` at a lower qty than `shd-mando`, which could indicate a copy-paste from the Mando list.

**Fix:** Verify against a source list that `SHD-251` at qty: 1 (not 3) is correct for the Gideon deck. No code change required if confirmed correct.

---

### IN-02: `ts26-improvised-tactics` name format is inconsistent with peer TS26 decks

**File:** `src/data/starter-decks.ts:423`

**Issue:** The name field is `'Against the Odds / Improvised Tactics (TS26)'` — it includes a dual-name format with a slash separator. The three peer TS26 decks use single names (`'Aggressive Negotiations (TS26)'`, `'Blood Brothers (TS26)'`, `'Master and Apprentice (TS26)'`). If this dual name reflects the actual product name it is correct, but if "Against the Odds" is a subtitle or tagline it may be inconsistent with how the product is marketed.

**Fix:** Verify the official product name. If the product is called "Improvised Tactics" the `Against the Odds /` prefix should be dropped.

---

_Reviewed: 2026-05-21_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

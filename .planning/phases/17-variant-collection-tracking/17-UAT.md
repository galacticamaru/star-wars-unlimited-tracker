---
status: complete
phase: 17-variant-collection-tracking
source:
  - 17-01-SUMMARY.md
  - 17-02-SUMMARY.md
  - 17-03-SUMMARY.md
  - 17-04-SUMMARY.md
  - 17-05-SUMMARY.md
  - 17-06-SUMMARY.md
  - 17-07-SUMMARY.md
  - 17-08-SUMMARY.md
started: 2026-05-20T00:00:00.000Z
updated: 2026-05-20T00:00:00.000Z
---

## Current Test

number: 9
name: CSV import — Normal and Foil variants
expected: |
  Import a Reddit-format CSV that has Normal and Foil counts for cards. After import,
  open the card detail page for an imported card. The Normal and Foil variant counts
  reflect the CSV values. Hyperspace variants are intentionally skipped by the
  importer — that is expected behavior.
awaiting: user response

## Tests

### 1. Card detail variant list
expected: Navigate to a card detail page for a card with multiple printings in a set (e.g. a SOR card). The variant collection section lists each available variant (Normal, Foil, Hyperspace, etc.) with the current owned count, Minus/Plus controls, and "Owned"/"Not owned" status for each.
result: pass

### 2. Increment variant count
expected: On the card detail page, click + on any variant. The count shown for that variant increases by 1 immediately (optimistic update). The Total line at the bottom of the section also updates to reflect the new sum.
result: pass

### 3. Decrement variant count — floor at zero
expected: On the card detail page, click − on a variant that shows 0. Nothing happens — the count stays at 0 and does not go negative. Clicking − on a variant with count > 0 decreases it by 1 correctly.
result: pass

### 4. Counts persist across reload
expected: After incrementing or decrementing a variant count, refresh the page. The updated counts are still shown correctly — they have been persisted to the database and are not reset on reload.
result: pass

### 5. Total line accuracy
expected: The "Total" line at the bottom of the variant collection section always equals the sum of all individual variant counts. Change several variant counts and confirm the total stays in sync.
result: pass

### 6. Catalog owned-count overlay (read-only)
expected: The catalog grid still shows the correct owned-count badge/overlay on cards you own (using the new CollectionMap shape). There are no + / − mutation buttons on catalog card tiles — the catalog is intentionally read-only for collection mutation in this phase.
result: pass

### 7. Want List owned counts
expected: In the deck builder's Want List tab, the "Owned" count displayed for each card in the want list is correct and matches the total you see on that card's detail page.
result: pass

### 8. Owned-only filter still works
expected: In the catalog, enable the "Owned only" filter. Only cards where your total owned count is ≥ 1 (across all variants) are shown. Cards with 0 total are hidden.
result: pass

### 9. CSV import — Normal and Foil variants
expected: Import a Reddit-format CSV that has Normal and Foil counts for cards. After import, open the card detail page for an imported card. The Normal and Foil variant counts reflect the CSV values. (Hyperspace variants are intentionally skipped by the importer — that is expected behavior.)
result: pass
note: "Resolved by plans 17-09 (seed fix + data repair) and 17-10 (re-seed + re-verify). SEC-030F (Death Trooper Foil) specifically absent from swu-db.com API — data source gap, not a code bug. Cards with API-available Foil variants now show both rows correctly."

## Summary

total: 9
passed: 9
issues: 0
skipped: 0
pending: 0

## Gaps

- truth: "Card detail page lists all available variant printings for a card (Normal, Foil, etc.) with per-variant owned counts and +/- controls; CSV import correctly populates Foil variant counts"
  status: failed
  reason: "User reported: SEC/030 — CSV has 10 normal and 1 foil. Card detail page only shows Normal listed; no Foil variant row visible and no way to manually add it either."
  severity: major
  test: 9
  root_cause: |
    Two seeding bugs in src/lib/sync/upsert-cards.ts:
    (1) SEC-030F (Death Trooper Foil) is completely absent from card_printings — never inserted by seed.
    (2) 38 SEC Foil rows exist but are linked to wrong/orphaned card_definition_ids instead of the
        matching Normal card's definition. Root cause: Pass 2 name+subtitle lookup fails silently for
        some cards (likely API name encoding mismatches), causing upsertCards to create a new
        standalone card_definition row for the Foil instead of reusing the Normal card's definition.
        getSameSetPrintingsWithCounts queries by the Normal card's card_definition_id and cannot
        find these orphaned Foil rows.
    SOR also has 12 non-Leader/Base cards missing Foil counterparts by the same mechanism.
  missing:
    - src/lib/sync/upsert-cards.ts — Pass 2 lookup must not create orphaned card_definition rows when name match fails
    - Data repair: 38 SEC orphaned Foil rows need card_definition_id corrected to match their Normal counterpart
    - Re-seed needed to insert SEC-030F and other completely absent Foil rows

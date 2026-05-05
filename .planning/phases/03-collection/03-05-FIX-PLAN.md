---
phase: 03-collection
plan: 05-FIX
type: execute
wave: 5
depends_on: [03-04]
files_modified: [src/lib/collection/normalize.ts, src/app/collection/page.tsx]
autonomous: true
gap_closure: true
---

<objective>
Refine the Reddit CSV import mapping to match the actual headers in the community spreadsheet and support multi-set detection.
</objective>

<tasks>
<task type="auto">
  <name>Task 1: Update Normalization Logic</name>
  <files>src/lib/collection/normalize.ts</files>
  <action>
    Update `normalizeRedditCsv` to:
    1. Use correct headers: `Card #` for number, and `Non-Foil`, `Foil`, `Hyperspace`, `F-Hyperspace` for quantities.
    2. Add a `setCode` parameter to the function since the CSV itself doesn't explicitly label the set in every row (the set is usually the tab name).
    3. Ensure card numbers are zero-padded to 3 digits (e.g., "1" -> "001") to match the database's `collectorNumber` format (e.g., "SOR-001").
  </action>
  <verify>Check that "SOR-001" is correctly mapped from "Card # 1" in an SOR context.</verify>
  <done>Normalization logic matches actual spreadsheet format</done>
</task>

<task type="auto">
  <name>Task 2: Update Import UI with Set Selection</name>
  <files>src/app/collection/page.tsx</files>
  <action>
    1. Add a dropdown (using existing `FilterDropdown` or a simple select) to allow the user to specify which set they are importing (e.g., "Spark of Rebellion (SOR)").
    2. Pass the selected set code to the updated normalization function.
    3. Update the instructions on the page to reflect the correct column requirements.
  </action>
  <verify>Upload a CSV, select SOR, verify cards are imported with SOR prefix.</verify>
  <done>UI supports per-set CSV imports</done>
</task>
</tasks>

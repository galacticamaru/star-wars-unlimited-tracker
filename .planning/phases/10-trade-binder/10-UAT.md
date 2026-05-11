---
status: complete
phase: 10-trade-binder
source: [10-01-PLAN.md, 10-02-PLAN.md, 10-03-PLAN.md, 10-04-PLAN.md, 10-VALIDATION.md]
started: 2026-05-11T00:00:00Z
updated: 2026-05-11T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. My Binder Nav Link
expected: When logged in, the navigation bar shows a "My Binder" link. Clicking it navigates to /binder/manage.
result: pass
notes: "Initially threw compile error (authClient.user.update → authClient.updateUser) + runtime error (want.card.name → want.name). Both fixed inline. Confirmed working."

### 2. Username Setup
expected: On /binder/manage, there is a section to set or update a username. Entering a name and saving it persists — the page reflects the new username and shows the public binder URL (e.g. /binder/yourusername).
result: pass

### 3. Add Card to Trade Offerings
expected: On /binder/manage, you can search for a card and mark it as "Available for Trade" with a quantity. The card then appears in the Trade Offerings section.
result: pass

### 4. Update Trade Quantity
expected: On /binder/manage, you can increase or decrease the trade quantity of an existing offering using +/- controls. The updated quantity saves correctly.
result: pass

### 5. Add Manual Want
expected: On /binder/manage, you can manually add a card to your "Looking For" list (independent of deck shortfalls). It appears in the Looking For sidebar/list.
result: pass

### 6. Exclude Card from Looking For
expected: On /binder/manage, you can exclude a card so it doesn't appear in your public "Looking For" list, even if it's missing from your decks. The card disappears from the Looking For section after exclusion.
result: pass

### 7. Public Binder — Trade Offerings
expected: Navigating to /binder/[your-username] (logged out or in a different tab) shows the "Available for Trade" section with the cards you flagged and their trade quantities (e.g. "2 Available"). No total inventory count (owned count) is shown.
result: pass

### 8. Public Binder — Looking For
expected: The public binder page shows a "Looking For" section with the merged list of auto-shortfalls from your decks plus manual wants, minus any exclusions.
result: pass

### 9. Catalog Filters on Public Binder
expected: The public binder page has catalog-style filters (Set, Aspect, Rarity, etc.). Applying a filter narrows both the "Available for Trade" and "Looking For" sections correctly.
result: pass

### 10. Read-Only Public View
expected: When viewing the public binder while logged out (or as a different user), there are no edit controls — no +/- quantity buttons, no "Add to Trade" buttons, no settings. The page is purely for browsing.
result: pass

## Summary

total: 10
passed: 10
issues: 0
skipped: 0
pending: 0

## Gaps

[none yet]

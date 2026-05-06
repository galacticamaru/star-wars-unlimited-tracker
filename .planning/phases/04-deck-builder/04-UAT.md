# Phase 4 UAT: Deck Builder

## User Acceptance Testing Tracker

| ID | Test Case | Status | Notes |
|----|-----------|--------|-------|
| 4.1 | Deck Dashboard CRUD (Create/List/Delete) | PASSED | Verified via conversational testing. |
| 4.2 | Catalog Selector: Adding/Removing Cards | PASSED | Verified via conversational testing. |
| 4.3 | Ownership & Shortfall Visualization | PASSED | Verified via conversational testing. |
| 4.4 | Real-time Validation Feedback (Sidebar) | PASSED | Fixed scaling, ID lookup, and CSS height issues. |
| 4.5 | Draft vs. Complete Persistence Rules | PASSED | Fixed 500 error by enabling transactions in DB driver. |
| 4.6 | Deck Export (Melee & JSON) | PASSED | Fixed Melee format: section order (MainDeck first), pipe separator for subtitles, no set code/collector number, bases omit subtitle. |
| 4.7 | Dirty State Warning | PASSED | Fixed: warning now only fires when deck is dirty; Back button and browser back/forward guarded with confirm(); beforeunload only when dirty. |

## Session Log

### 2026-05-06 - Initial UAT Session
- Starting Phase 4 UAT.
- **4.1 PASSED**: Basic deck management (creation/listing/deletion) verified.
- **4.2 PASSED**: Catalog selector integration and state synchronization verified.
- **4.3 PASSED**: Shortfall visualization (red border/badge) confirmed when deck count > owned count.
- **4.4 PASSED**: Real-time feedback and cost curve confirmed after 3 rounds of fixes for scaling, logic, and CSS.
- **4.5 PASSED**: Persistence rules verified. Save-as-draft allows illegal states; complete-deck enforces rules. Fixed transaction driver issue.
- **4.6 PASSED**: Melee export fixed — correct section order, `Name | Subtitle` format, no set code, bases export name-only.
- **4.7 PASSED**: Dirty state warning fixed — guarded Back button, browser back/forward via pushState trick, tab close via beforeunload. Warning suppressed on clean decks.

## Result

**7/7 tests passed. Phase 4 UAT complete.**

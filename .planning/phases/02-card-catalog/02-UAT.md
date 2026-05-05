# Phase 2 UAT — Card Catalog

**Status:** ✅ Complete
**Tester:** Claude (Interactive)
**Date:** 2026-05-05

---

## Test Cases

| ID | Description | Requirement | Status | Result |
|----|-------------|-------------|--------|--------|
| TC-01 | Grey placeholder renders during image load | CATALOG-01 (D-02) | ✅ Pass | Shimmer visible before load |
| TC-02 | Hover ring appears on card | CATALOG-01 (D-02) | ✅ Pass | Blue inset ring visible on hover |
| TC-03 | Grid column count at each viewport | CATALOG-01 (UI-SPEC) | ✅ Pass | Responsive grid working |
| TC-04 | Card click navigates to /cards/{set}/{number} | CATALOG-01 (D-06) | ✅ Pass | Detail page opens correctly |
| TC-05 | Back button returns to catalog | CATALOG-01 (D-06) | ✅ Pass | Navigation back works |
| TC-06 | Empty state "No matching cards" | CATALOG-02, CATALOG-03 | ✅ Pass | Correct copy displayed |
| TC-07 | Leaders/Bases horizontal in catalog | Tweak | ✅ Pass | 3:2 ratio correctly applied |
| TC-08 | Cards sorted by Set/Number | Tweak | ✅ Pass | Correct sorting order confirmed |
| TC-09 | Leader detail toggle works | Tweak | ✅ Pass | Correctly switches between Leader/Unit sides |
| TC-10 | Leader sides correctly mapped (Vertical Leader / Horizontal Unit) | Tweak | ✅ Pass | Front/Back mapping corrected |

---

## Session Log

### 2026-05-05 15:15
- Session started.
- TC-01 passed.
- TC-02 failed (clipped ring). Fixed via absolute overlay.
- TC-03 passed.
- TC-04, TC-05 passed.
- TC-06, TC-07, TC-08 passed.
- TC-09, TC-10 failed (aspect ratio and mapping issues).
- Fixed Leader toggle mapping and aspect ratios across all card types.
- All test cases passed.
- Session ended.

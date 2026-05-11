# Phase 10: Trade Binder - Validation

**Phase:** Phase 10: Trade Binder
**Status:** PENDING

## Success Truths
- [ ] **Truth 01:** Public binder page at `/binder/[username]` resolves correctly to the owner's offerings.
- [ ] **Truth 02:** Total inventory counts (owned cards) are never leaked to the public binder page.
- [ ] **Truth 03:** "Looking For" list correctly merges auto-shortfalls, manual wants, and exclusions.
- [ ] **Truth 04:** Users cannot modify other users' trade quantities or binder settings.
- [ ] **Truth 05:** Standard catalog filters work correctly on the public binder page.

## Automated Verification
| Component | Test File | Command | Target |
|-----------|-----------|---------|--------|
| Logic | `src/lib/binder-logic.test.ts` | `npm test src/lib/binder-logic.test.ts` | 100% Pass |
| API | `tests/trade-api.test.ts` | `npm test tests/trade-api.test.ts` | 100% Pass |
| Integration | `tests/binder-flow.test.ts` | `npm test tests/binder-flow.test.ts` | 100% Pass |

## Manual Verification
- [ ] Set username in `/binder/manage` and verify URL updates.
- [ ] Add cards to trade binder and verify they appear on the public page with correct quantities.
- [ ] Add card to exclusion list and verify it disappears from "Looking For".
- [ ] Open public binder in Incognito/Logged out and verify read-only state.
- [ ] Verify catalog filters (e.g., Aspect, Set) filter the binder items correctly.

# Phase 4 Validation Strategy: Deck Builder

This document outlines the validation strategy for Phase 4 (Deck Builder), ensuring legality, persistence, and user experience meet the defined requirements.

## 1. Core Validation Rules (SWU Premier)

The following rules must be enforced by the `validateDeck` utility and the API layer:

| Rule | Severity | Persistence Logic |
|------|----------|-------------------|
| Leader: Exactly 1 | Error | Block save if `is_draft: false` |
| Base: Exactly 1 | Error | Block save if `is_draft: false` |
| Main Deck Size: Min 50 | Error | Block save if `is_draft: false` |
| Copy Limit: Max 3 of non-unique | Error | Block save if `is_draft: false` |
| Aspect Penalty | Warning | Allow save (even if not draft) |
| Sideboard: Max 10 | Error | Block save if `is_draft: false` |

## 2. Automated Testing Strategy

### Unit Testing (Vitest)
- **Component**: `src/lib/deck-validation.ts`
- **Focus**: Pure logic for legality checks, cost curve calculations, and stats.
- **Goal**: 100% branch coverage for `validateDeck`.

### API Testing (Vitest/Supertest)
- **Component**: `src/app/api/decks/[id]/route.ts`
- **Focus**: 
    - Verify `PATCH` respects the `is_draft` flag.
    - `is_draft: true` -> Save invalid state.
    - `is_draft: false` -> Return 400 for invalid state.
- **Goal**: Prevent data corruption and illegal deck states in production.

### UI / Integration Testing (Playwright)
- **Focus**:
    - Dashboard: Create/Delete decks.
    - Builder: Adding/Removing cards via the Selector.
    - Feedback: Real-time validation messages appearing/disappearing.
    - Persistence: Reloading a deck shows the correct saved state.
- **Goal**: End-to-end confirmation of the user loop.

## 3. Security Validation (STRIDE)

| Threat | Component | Mitigation |
|--------|-----------|------------|
| **Spoofing** | API Routes | Hardcode `userId=1` (single-user constraint) and validate ownership if multi-user is added. |
| **Tampering** | `PATCH /api/decks/[id]` | Re-validate deck legality on server for non-draft decks. |
| **Information Disclosure** | API Routes | Ensure deck list only returns user-specific decks. |
| **Denial of Service** | `validateDeck` | Ensure O(N) complexity for validation logic. |

## 4. Manual Verification (UAT)

1. **Shortfall Visualization**: Verify that cards the user doesn't own enough of are clearly highlighted in red/high-contrast.
2. **Selector Sync**: Verify that searching in the catalog selector doesn't clear the current "In Deck" quantities.
3. **Mobile Layout**: Verify the builder sidebar collapses or remains usable on small screens.

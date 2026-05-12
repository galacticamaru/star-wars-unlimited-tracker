# Phase 6: Auth & Multi-User - Validation Strategy

## Goal
Verify that the application transition from single-user to multi-user is secure, data-isolated, and preserves legacy data for the first user.

## Automated Test Suites

### 1. Auth Protection (`tests/auth-protection.test.ts`)
- **Objective:** Verify that protected routes redirect to `/login` when no session is present.
- **Scenarios:**
  - Access `/collection` without session -> Redirect to `/login`
  - Access `/decks` without session -> Redirect to `/login`
  - Access `/` (catalog) without session -> Allowed
  - Access `/cards/[id]` without session -> Allowed

### 2. Data Isolation (`tests/data-isolation.test.ts`)
- **Objective:** Verify that database queries and API routes only return/modify data belonging to the current user.
- **Scenarios:**
  - Fetch collection for User A -> Returns only User A's cards
  - Fetch decks for User B -> Returns only User B's decks
  - POST to `/api/collection` as User A -> Updates only User A's records
  - Verify that no data is leaked between accounts.

### 3. Migration Logic (`tests/migration-hook.test.ts`)
- **Objective:** Verify that the `userId = 1` legacy data is correctly reassigned to the first registered user.
- **Scenarios:**
  - Create first user -> `userId = 1` records in `user_collections` and `decks` are updated to `newUserId`.
  - Create second user -> No migration occurs.
  - Verify data integrity after migration.

## Manual Verification Points

### Login/Register Flow
- [ ] Toggle between Sign In and Create Account on `/login`.
- [ ] Register with email/password.
- [ ] Log in with Google/Discord OAuth.
- [ ] Log out via the NavBar avatar dropdown.

### NavBar State
- [ ] "Sign In" link shown when logged out.
- [ ] Avatar initials shown when logged in.
- [ ] Dropdown menu contains "Sign Out".

### UX Redirects
- [ ] Clicking collection controls when logged out redirects to `/login`.
- [ ] Successful login redirects to `/` (Home/Catalog).

## Success Criteria Checklist
- [ ] User can register and log in via email or OAuth.
- [ ] Session persists across browser restarts (Standard Better Auth).
- [ ] All collection and deck data is isolated per user.
- [ ] Legacy data (userId=1) is associated with the first registered account.
- [ ] Route protection is active via `proxy.ts`.

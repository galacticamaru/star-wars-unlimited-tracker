# Phase 6: Auth & Multi-User - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-08
**Phase:** 6-Auth & Multi-User
**Areas discussed:** Auth wall, Login/Register UX, NavBar user state, v1 data migration

---

## Auth Wall

| Option | Description | Selected |
|--------|-------------|----------|
| Full wall — login required for everything | Any route redirects to /login if no session. Simplest to implement, no partial-access edge cases. | |
| Public catalog, auth for collection/decks | Unauthenticated users can browse cards at / — collection controls and deck builder require login. | ✓ |

**User's choice:** Public catalog, auth for collection/decks

---

| Option | Description | Selected |
|--------|-------------|----------|
| Public | Anyone can view card detail pages; collection controls hidden/disabled if not logged in. | ✓ |
| Requires login | Card detail pages redirect to /login if unauthenticated. | |

**User's choice:** Card detail pages are public

---

| Option | Description | Selected |
|--------|-------------|----------|
| Hidden entirely | No +/- buttons or owned count badges shown. Clean browsing. | |
| Shown but clicking prompts login | Buttons visible; tapping triggers login redirect. | ✓ |

**User's choice:** Collection controls shown on public pages; clicking redirects to /login

---

| Option | Description | Selected |
|--------|-------------|----------|
| Redirect to /login page | Full page redirect. Simple, standard web pattern. | ✓ |
| Open a login modal in-place | User stays on catalog, logs in via modal. | |

**User's choice:** Redirect to /login

---

## Login/Register UX

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated /login page | Full-page with email+password fields and OAuth buttons. | ✓ |
| Modal/dialog overlay | Login appears on top of current page. | |

**User's choice:** Dedicated /login full page

---

| Option | Description | Selected |
|--------|-------------|----------|
| Single /login page with tabs/toggle | One route handles both sign in and create account. | ✓ |
| Separate /login and /register pages | Clean separation; more routes to manage. | |

**User's choice:** Single /login page with toggle

---

| Option | Description | Selected |
|--------|-------------|----------|
| Home page / | Always redirect to catalog root after login. | ✓ |
| The page they were trying to visit | Return to referring page; requires storing return URL. | |

**User's choice:** Redirect to / (home/catalog) after login

---

## NavBar User State

| Option | Description | Selected |
|--------|-------------|----------|
| Email address + Sign Out button | Minimal; shows who you are and a direct logout action. | |
| Avatar/initials with dropdown menu | Circle with initials that opens a dropdown with Sign Out. | ✓ |

**User's choice:** Avatar/initials with dropdown menu

---

| Option | Description | Selected |
|--------|-------------|----------|
| Sign Out only | Simple dropdown with just a "Sign Out" item. | ✓ |
| Email display + Sign Out | Shows logged-in email at top, then Sign Out. | |
| Email + Sign Out + future placeholders | Email, Sign Out, and disabled future items. | |

**User's choice:** Sign Out only in dropdown

---

| Option | Description | Selected |
|--------|-------------|----------|
| Sign In button/link | A simple "Sign In" link on the right going to /login. | ✓ |
| Sign In + Register buttons | Two buttons; redundant since they share one /login page. | |
| Nothing | No login button; redirect on action only. | |

**User's choice:** "Sign In" link on the right of the NavBar when logged out

---

## v1 Data Migration

| Option | Description | Selected |
|--------|-------------|----------|
| Auto on first registration | First user to register gets userId=1 data auto-migrated. | ✓ |
| Manual deploy script before launch | One-time script run after deploy, before anyone registers. | |
| Claude decides | Pick whichever approach is cleaner to implement. | |

**User's choice:** Auto on first registration

---

| Option | Description | Selected |
|--------|-------------|----------|
| Still first registration wins — acceptable risk | Personal app; user will be the first to register on own deployment. | ✓ |
| Add a one-time claim link / admin guard | Migration only runs for a specific email address. | |

**User's choice:** First-register-wins, no email guard — acceptable risk

---

## Claude's Discretion

- Better Auth version and exact adapter configuration
- userId type bridge strategy (current schema: integer; Better Auth default: string/UUID)
- Exact tab/toggle UI implementation on /login page
- Error messaging shapes on auth forms
- Session cookie configuration (using Better Auth defaults)

## Deferred Ideas

None — discussion stayed within Phase 6 scope.

# Phase 6: Auth & Multi-User - Context

**Gathered:** 2026-05-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Give users personal accounts (email/password + Google OAuth + Discord OAuth); isolate all collection and deck data per user; migrate v1 single-user data (hardcoded userId=1) to the first registered account. All phases from 7 onward depend on a real userId — this is the first v2 phase and unblocks everything.

</domain>

<decisions>
## Implementation Decisions

### Auth Wall — Route Protection

- **D-01:** Public routes (no login required): `/` (catalog), `/cards/[set-code]/[card-number]` (card detail pages)
- **D-02:** Protected routes (redirect to `/login` if no session): `/collection`, `/decks`, `/decks/[id]`
- **D-03:** Collection controls (+/- buttons, owned count badges) are shown on public pages even when logged out; clicking a control redirects the user to `/login`
- **D-04:** After login, user is always redirected to `/` (home/catalog), not back to the referring page

### Login/Register UX

- **D-05:** Single dedicated `/login` page — full-page (not a modal overlay)
- **D-06:** One page with a toggle between "Sign In" and "Create Account" (tab or link-based toggle) — no separate `/register` route
- **D-07:** The page hosts email + password fields for both flows, plus OAuth buttons (Google, Discord) for sign-in

### NavBar User State

- **D-08:** Logged out: show a "Sign In" link on the right side of the NavBar
- **D-09:** Logged in: show an avatar/initials circle on the right side; clicking it opens a dropdown menu
- **D-10:** Avatar dropdown contains only one item: "Sign Out" — no account settings, no email display, no placeholders

### v1 Data Migration

- **D-11:** Auto-migration on first registration: when the first user account is created, update all `user_collections` rows with `user_id = 1` and all `decks` rows with `user_id = 1` to the new account's userId
- **D-12:** First-register-wins — no email guard or admin confirmation; acceptable risk for a personal deployment

### Claude's Discretion

- Better Auth library version and exact schema approach (planner should read Better Auth docs and handle userId type mismatch — current schema has `integer` userId columns, Better Auth defaults to string/UUID IDs)
- Exact tab/toggle UI for the login/register page (shadcn pattern is fine)
- Error messaging on auth forms (standard Better Auth error shapes)
- Session cookie configuration (httpOnly, secure, sameSite — Better Auth defaults are correct)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap

- `.planning/REQUIREMENTS.md` — AUTH-01 through AUTH-07 (all Phase 6 requirements)
- `.planning/ROADMAP.md` — Phase 6 goal, success criteria, dependency chain (all phases 7–10 depend on Phase 6)

### Current Schema (must understand before making changes)

- `src/db/schema.ts` — Current table definitions; `user_collections.user_id` and `decks.user_id` are `integer` columns defaulting to 1 — Better Auth will introduce its own `users` table; planner must decide how to bridge string vs. integer userId

### Integration Points (read before planning)

- `src/db/index.ts` — Drizzle client singleton; Better Auth adapter will need this
- `src/app/layout.tsx` — Root layout; session provider goes here
- `src/components/nav-bar.tsx` — Extend for auth state (Sign In link / avatar dropdown)
- `src/app/api/cron/sync-cards/route.ts` — Already uses CRON_SECRET guard; no auth change needed

### Auth Library

- Better Auth docs should be fetched by the researcher: https://www.better-auth.com/docs/installation
- Key known pitfall (from STATE.md): **Better Auth requires `proxy.ts` as the auth export file in Next.js 16** — `middleware.ts` silently leaves routes unprotected. This is not optional.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/components/ui/input.tsx` — Use for email and password fields on `/login` page
- `src/components/ui/button.tsx` — Use for "Sign In", "Create Account", OAuth buttons
- `src/components/ui/dropdown-menu.tsx` — Use for avatar dropdown (Sign Out item) — already imported in codebase
- `src/components/nav-bar.tsx` — Extend; currently 3 nav links; add auth slot on the right

### Established Patterns

- **Server components fetch data directly; client components call API routes** — Session checks in server components should use Better Auth's `auth.api.getSession()` server call; client components should use Better Auth's React hooks
- **No global state manager** — Better Auth's session state replaces the need for any auth store; use the provided hooks
- **Tailwind + shadcn/base-ui styling** — All new UI (login page, avatar, dropdown) should follow this convention
- **API routes: try/catch + return JSON** — Add auth session check at the top of each protected API route; return 401 if no session

### Integration Points

- Every API route in `src/app/api/` currently uses `userId = 1` hardcoded — ALL must be updated to extract userId from the Better Auth session
- `src/db/queries/collection.ts` and `src/db/queries/decks.ts` — Remove `default(1)` userId assumptions; all query functions must accept userId as a parameter
- `src/components/catalog/catalog-client.tsx` — Currently fetches `/api/collection` without auth; must pass session state down to `CardItem` to control whether controls redirect vs. act
- `src/components/catalog/card-item.tsx` — Collection controls need an "authenticated" prop or context to decide between redirect-to-login and actual API call

</code_context>

<specifics>
## Specific Ideas

- The migration auto-runs when the first user registers: check `SELECT COUNT(*) FROM users` in a post-registration callback; if count == 1, run `UPDATE user_collections SET user_id = {newId} WHERE user_id = 1` and `UPDATE decks SET user_id = {newId} WHERE user_id = 1`
- Avatar initials: derive from the email address (first letter of local part), uppercased. No profile picture upload needed.
- Collection controls on the catalog: the click handler should check `isAuthenticated` and call `router.push('/login')` if false, otherwise call the API as normal

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 6 scope.

</deferred>

---

*Phase: 6-Auth & Multi-User*
*Context gathered: 2026-05-08*

# Phase 31: Trade Profile Modal & Public Trade Note - Context

**Gathered:** 2026-07-20
**Status:** Ready for planning

<domain>
## Phase Boundary

The Trade Profile — today a permanent `Card` (username / binder URL) in the left 2/3 column of `src/app/binder/manage/page.tsx` — moves **behind a profile button that opens a modal**. The modal gains a new public **"trade note"** free-text field (e.g. "EU only, will ship"), and the public binder page (`/binder/[username]`, via `PublicBinderClient`) **displays that note** to visitors when set. (BINDER-15/16/17)

**In scope:**
- Replace the inline Trade Profile card with a header profile button that opens a modal.
- The modal edits username (as today) plus the new trade note, with a single Save.
- Persist the trade note and surface it on the public binder as a callout under the header.

**Out of scope (belongs to other v7 phases):**
- Combined wants & exclusions list rework (`ManageWantsList`) → **Phase 32** (BINDER-18/19/20).
- The unified search-driven add flow → already shipped in **Phase 30**; leave it untouched.

</domain>

<decisions>
## Implementation Decisions

### Profile button (entry point) — BINDER-15
- **D-01:** The profile button lives in the **manage-page header row, beside the existing "View Public Binder" button** (top-right). The old inline "Trade Profile" `Card` in the left column is removed entirely.
- **D-02:** Button reads as **icon + label** (e.g. a user/settings lucide icon with text like "Trade Profile" / "Edit Profile"), consistent with the labeled outline `buttonVariants` styling already used by "View Public Binder".
- **D-03:** The "View Public Binder" link stays in the header (unchanged) — the profile button is additive, not a replacement, so the one-click path to the public page is preserved.

### Trade note input — BINDER-16
- **D-04:** The note is a **multi-line textarea (2–3 lines)** with a **140-character cap** and a **live character counter**. Room for a second condition (region + shipping) without becoming a bio.
- **D-05:** The note is **optional** (empty by default). The input shows an **example placeholder** — copy along the lines of `e.g. EU only, will ship`. Saving an empty value clears the note.

### Public binder display — BINDER-17
- **D-06:** On `/binder/[username]`, the note renders as a **callout / banner directly under the username header**, above the Available-for-Trade / Looking-For sections — visible before the visitor browses.
- **D-07:** When no note is set, render **nothing** — no box, no empty line, no reserved gap. Directly satisfies success criterion #3 ("no broken UI when the note is empty").

### Modal contents & save flow
- **D-08:** The modal contains the **full profile in one place**: the username field, the public-URL helper text/link ("your binder will be at swu-tracker.com/binder/{username}"), and the trade note field.
- **D-09:** **One Save button** persists username + note together and closes the modal. The single button orchestrates both writes — username still goes through Better Auth (`authClient.updateUser`), and the trade note rides the same update call (see D-10).

### Trade note storage
- **D-10:** Store the note as a **Better Auth `additionalField` (`tradeNote`) on the `user` table**, updatable via `authClient.updateUser({ tradeNote })` — mirroring exactly how `username` / `displayUsername` are handled today. Preferred over a separate column + dedicated API route: one save path, no new endpoint, no new mutation-invalidation surface.
  - **Planner note:** Better Auth `additionalFields` must be declared in **both** places — `user.additionalFields.tradeNote` in `src/lib/auth.ts` **and** a matching `tradeNote` column on `schema.user` in `src/db/schema.ts` (plus a Drizzle migration). Research must confirm the additionalField flows through `authClient.updateUser`, the session `user` object, and server-side reads used by the public binder query. If additionalFields prove awkward with the serial-id Drizzle adapter, the fallback is a plain `tradeNote` column read directly in `getPublicBinderData` — but the schema column is needed either way.

### Claude's Discretion
- Exact modal primitive (shadcn `Dialog` / Base UI dialog) and its trigger wiring — provided it stays within the **Base UI + shadcn/ui, no `@radix-ui`** constraint.
- Precise button label wording, icon choice, callout styling, and counter placement.
- Whether the note is trimmed/sanitized on save and how it's escaped on the public page (must be plain text, not rendered HTML).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` §"Trade Profile" — BINDER-15, BINDER-16, BINDER-17 (the requirements this phase satisfies)
- `.planning/ROADMAP.md` §"Phase 31: Trade Profile Modal & Public Trade Note" — goal + 3 success criteria

### Files this phase changes / builds on
- `src/app/binder/manage/page.tsx` — the manage page: header row (`View Public Binder` link ~L363), inline Trade Profile card (~L372–398) to remove, `username` state + `handleUpdateUsername` (~L79–104, L184–191)
- `src/app/binder/[username]/page.tsx` — public binder RSC; must fetch + pass the trade note down
- `src/components/binder/public-binder-client.tsx` — renders the public binder header; new callout mounts here
- `src/lib/auth.ts` — Better Auth config; add `user.additionalFields.tradeNote` (username plugin at L19, drizzle adapter L9–17)
- `src/lib/auth-client.ts` — `authClient.updateUser` call site reference
- `src/db/schema.ts` — `user` table (L13–23); add `tradeNote` column
- `src/db/queries/binder.ts` — `getUserIdByUsername`, `getPublicBinderData`; the public read that must surface the note

### Project conventions
- `.planning/codebase/CONVENTIONS.md`, `.planning/codebase/STRUCTURE.md` — component/patterns conventions (Base UI + shadcn, no `@radix-ui`)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `handleUpdateUsername` / `authClient.updateUser` in `manage/page.tsx` — already persists username via Better Auth; extend the same call to carry `tradeNote` (D-09/D-10).
- The existing Trade Profile `Card` markup (Input + helper text + Update button) — the modal body is essentially this content relocated, plus the note textarea.
- `buttonVariants({ variant: "outline" })` + lucide icons + `ExternalLink` — the header already uses this styling for "View Public Binder"; reuse for the profile button.
- `PublicBinderClient` header area — the anchor point for the trade-note callout.

### Established Patterns
- Client page (`'use client'`) using `authClient.useSession()`; username/profile writes go through Better Auth, not custom `/api` routes.
- Better Auth `username` plugin already adds `username` / `displayUsername` as user fields — `tradeNote` follows the same additionalField pattern.
- Base UI (`@base-ui/react`) + shadcn/ui only; no `@radix-ui` imports.
- Public binder page is an RSC that reads via `src/db/queries/binder.ts` and hands data to a client component.

### Integration Points
- Modal mounts on `src/app/binder/manage/page.tsx`, triggered from the header button; edits flow through `authClient.updateUser`.
- The public read (`getPublicBinderData` / the `[username]/page.tsx` RSC) must include `tradeNote` so `PublicBinderClient` can render the callout — a schema column is required regardless of the additionalField wiring.

</code_context>

<specifics>
## Specific Ideas

- Example trade note is deliberately short — "EU only, will ship". The 140-char cap and placeholder are sized for that kind of one-or-two-condition note, not a bio.
- The note is a **public** field shown to anonymous visitors; treat it as untrusted plain text on the public page (escape, no HTML rendering).
- Empty note = fully hidden on the public page (no placeholder, no reserved space) — the "no broken UI when empty" criterion is met by rendering nothing.

</specifics>

<deferred>
## Deferred Ideas

- **Combined wants & exclusions list** — auto-wants + manual wants in one sectioned list with exclude/restore and manual-want qty/remove controls → **Phase 32** (BINDER-18/19/20). `ManageWantsList` stays untouched this phase.
- **Dedicated trade-note API route** — a standalone `/api/...` PATCH endpoint was considered but deferred in favor of the Better Auth additionalField path (D-10). Revisit only if additionalFields don't integrate cleanly with the serial-id Drizzle adapter.

None beyond the above — discussion stayed within phase scope.

</deferred>

---

*Phase: 31-Trade Profile Modal & Public Trade Note*
*Context gathered: 2026-07-20*

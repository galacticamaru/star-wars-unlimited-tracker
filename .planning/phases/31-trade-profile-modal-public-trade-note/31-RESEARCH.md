# Phase 31: Trade Profile Modal & Public Trade Note - Research

**Researched:** 2026-07-20
**Domain:** Better Auth `additionalFields`, Base UI dialog primitives, Next.js 16 RSC public data reads, Drizzle schema migration on Neon
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Profile button (entry point) — BINDER-15**
- **D-01:** The profile button lives in the manage-page header row, beside the existing "View Public Binder" button (top-right). The old inline "Trade Profile" `Card` in the left column is removed entirely.
- **D-02:** Button reads as icon + label (e.g. a user/settings lucide icon with text like "Trade Profile" / "Edit Profile"), consistent with the labeled outline `buttonVariants` styling already used by "View Public Binder".
- **D-03:** The "View Public Binder" link stays in the header (unchanged) — the profile button is additive, not a replacement, so the one-click path to the public page is preserved.

**Trade note input — BINDER-16**
- **D-04:** The note is a multi-line textarea (2–3 lines) with a 140-character cap and a live character counter. Room for a second condition (region + shipping) without becoming a bio.
- **D-05:** The note is optional (empty by default). The input shows an example placeholder — copy along the lines of `e.g. EU only, will ship`. Saving an empty value clears the note.

**Public binder display — BINDER-17**
- **D-06:** On `/binder/[username]`, the note renders as a callout / banner directly under the username header, above the Available-for-Trade / Looking-For sections — visible before the visitor browses.
- **D-07:** When no note is set, render nothing — no box, no empty line, no reserved gap. Directly satisfies success criterion #3 ("no broken UI when the note is empty").

**Modal contents & save flow**
- **D-08:** The modal contains the full profile in one place: the username field, the public-URL helper text/link ("your binder will be at swu-tracker.com/binder/{username}"), and the trade note field.
- **D-09:** One Save button persists username + note together and closes the modal. The single button orchestrates both writes — username still goes through Better Auth (`authClient.updateUser`), and the trade note rides the same update call (see D-10).

**Trade note storage**
- **D-10:** Store the note as a Better Auth `additionalField` (`tradeNote`) on the `user` table, updatable via `authClient.updateUser({ tradeNote })` — mirroring exactly how `username`/`displayUsername` are handled today. Preferred over a separate column + dedicated API route: one save path, no new endpoint, no new mutation-invalidation surface.
  - Planner note: Better Auth `additionalFields` must be declared in both places — `user.additionalFields.tradeNote` in `src/lib/auth.ts` and a matching `tradeNote` column on `schema.user` in `src/db/schema.ts` (plus a Drizzle migration). Research must confirm the additionalField flows through `authClient.updateUser`, the session `user` object, and server-side reads used by the public binder query. If additionalFields prove awkward with the serial-id Drizzle adapter, the fallback is a plain `tradeNote` column read directly in `getPublicBinderData` — but the schema column is needed either way.
  - **Research resolution:** No friction found. `additionalFields` are ordinary columns unrelated to the `advanced.database.generateId: "serial"` id-generation setting; both mechanisms are independent. The fallback path is, in fact, always required regardless of additionalFields working cleanly — see Summary above.

### Claude's Discretion
- Exact modal primitive (shadcn `Dialog` / Base UI dialog) and its trigger wiring — provided it stays within the Base UI + shadcn/ui, no `@radix-ui` constraint. **Research recommendation:** build a `Dialog` component as a sibling to the existing `Sheet` component (both wrap the same `@base-ui/react/dialog` primitive) — see Pattern 3.
- Precise button label wording, icon choice, callout styling, and counter placement.
- Whether the note is trimmed/sanitized on save and how it's escaped on the public page (must be plain text, not rendered HTML). **Research recommendation:** `.trim()` on save; plain JSX text interpolation for rendering (React auto-escapes) — see Anti-Patterns.

### Deferred Ideas (OUT OF SCOPE)
- Combined wants & exclusions list — auto-wants + manual wants in one sectioned list with exclude/restore and manual-want qty/remove controls → Phase 32 (BINDER-18/19/20). `ManageWantsList` stays untouched this phase.
- Dedicated trade-note API route — a standalone `/api/...` PATCH endpoint was considered but deferred in favor of the Better Auth additionalField path (D-10). Revisit only if additionalFields don't integrate cleanly with the serial-id Drizzle adapter. **Research resolution: no such integration problem was found — no revisit needed.**
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BINDER-15 | The trade profile (username / binder URL) is reached via a profile button that opens a modal, instead of occupying the Manage Binder page permanently | Pattern 3 (Base UI Dialog, built as a sibling to the existing `Sheet` component); Recommended Project Structure shows `profile-modal.tsx` + `ui/dialog.tsx` as new files; header button placement per D-01/D-02/D-03 already matches the existing `buttonVariants({ variant: "outline" })` + lucide-icon convention used by "View Public Binder" |
| BINDER-16 | The user can set a public "trade note" (short free text) in the trade profile modal | Pattern 1 (Better Auth `additionalFields.tradeNote` declaration) + Pattern 2 (typed client via `inferAdditionalFields`) + Code Examples (Textarea with character counter, save handler); Pitfall 2 covers the `required: false` requirement for D-05's "empty clears the note" behavior |
| BINDER-17 | The public binder page displays the user's trade note | Pattern 4 (raw Drizzle read in `getUserIdByUsername`, independent of Better Auth's session API) confirms the schema column is mandatory on the read side; Code Examples (public callout) shows the D-06/D-07 conditional-render implementation; Anti-Patterns section covers XSS-safe rendering and the "render nothing when empty" requirement |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

`./CLAUDE.md` is a single `@AGENTS.md` include. `AGENTS.md` contains one actionable directive:

- **"This is NOT the Next.js you know"** — this Next.js version (16.2.4, installed) has breaking changes vs. training data; any Next.js API/convention must be verified against `node_modules/next/dist/docs/` before being asserted, not assumed from memory. **Compliance this session:** `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-params.md` was read and confirms the existing async-params pattern already used in `src/app/binder/[username]/page.tsx` (`params: Promise<{ username: string }>` + `await params`) is current and correct for the installed version — no change to that convention is needed or recommended by this phase. No other Next.js APIs are touched by this phase's scope (no new routes, no new data-fetching functions, no new `generateStaticParams`/`dynamicParams` usage), so no further doc verification was required.

## Summary

This phase is small in surface area (one modal, one textarea, one public callout) but the CONTEXT.md D-10 planner note correctly flags the one genuinely uncertain piece: whether a Better Auth `additionalField` is the right storage mechanism, and how it threads through `authClient.updateUser`, the session object, and the public binder's raw-SQL read path. All of that has now been confirmed directly against this repo's installed `better-auth@1.6.9` type declarations (`node_modules/@better-auth/core/dist/db/type.d.mts`, `node_modules/better-auth/dist/db/schema.mjs`, `node_modules/better-auth/dist/plugins/additional-fields/client.d.mts`) and against this repo's actual source (`src/lib/auth.ts`, `src/db/queries/binder.ts`). There is no ambiguity left to resolve at plan time.

**Key confirmation:** `getPublicBinderData`'s caller (`src/app/binder/[username]/page.tsx`) does not go through the Better Auth API at all — it calls `getUserIdByUsername(username)`, a raw Drizzle `db.select(...).from(user)...` query in `src/db/queries/binder.ts`, then passes the resulting numeric `userId` into `getPublicBinderData`. This means the public read is 100% independent of Better Auth's request/response pipeline. A `tradeNote` column on `schema.user` is mandatory regardless of how the write path works — there is no "additionalFields-only" shortcut that skips the schema column. This directly validates the CONTEXT.md D-10 planner note's core claim, with code-level evidence rather than assumption.

**Primary recommendation:** Add `user.additionalFields.tradeNote` to `src/lib/auth.ts` (a `{ type: "string", required: false }` field attribute) AND a plain nullable `text('trade_note')` column to `schema.user` in `src/db/schema.ts`. Wire `authClient.updateUser({ tradeNote })` on the client exactly as `handleUpdateUsername` already does for `username`/`displayUsername` — no new API route. Extend `getUserIdByUsername` to also select `tradeNote` (one extra column in the existing query) so the public RSC page can pass it straight through to `PublicBinderClient`. Build the modal on the same Base UI `Dialog` primitive (`@base-ui/react/dialog`) that `src/components/ui/sheet.tsx` already wraps — no new dependency, no `@radix-ui`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Profile button + modal trigger/state | Browser / Client | — | `manage/page.tsx` is already `'use client'`; modal open/close is local UI state, no server round-trip needed to open it |
| Username + trade note write | API / Backend (Better Auth) | Browser / Client | Write happens via `authClient.updateUser()`, a client-side call into Better Auth's own `/api/auth/update-user` handler (mounted by `betterAuth()` in `src/lib/auth.ts`); the client only triggers it |
| Trade note persistence | Database / Storage | API / Backend | Better Auth's Drizzle adapter persists the field; the column must exist on `schema.user` regardless of the write path used |
| Public trade note read | Database / Storage | Frontend Server (SSR) | `getPublicBinderData`'s sibling query `getUserIdByUsername` reads `schema.user` directly via Drizzle in an RSC (`[username]/page.tsx`) — no client-side fetch, no Better Auth session API involved for anonymous visitors |
| Public callout rendering | Browser / Client (hydrated) / Frontend Server (initial HTML) | — | `PublicBinderClient` is a client component but receives `tradeNote` as a server-fetched prop from the RSC page — rendering itself is a plain conditional JSX block, no client fetch |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| better-auth | 1.6.9 (installed) — 1.6.23 latest on npm | Auth, session, `user.additionalFields` mechanism | Already the project's sole auth library; `additionalFields` is its documented, built-in extension point for custom user columns — no alternative needed |
| @base-ui/react | ^1.4.1 (installed) | Headless `Dialog` primitive for the profile modal | Project constraint: Base UI + shadcn/ui only, no `@radix-ui`. `@base-ui/react/dialog` already ships in this dependency and is already used to build `Sheet` |
| drizzle-orm / drizzle-kit | 0.45.2 / 0.31.10 (installed) | Schema column + migration | Already the project's ORM/migration tool |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^1.14.0 (installed) | Profile button icon | `UserRound`, `UserCog`, or `UserPen` icons all exist in the installed version — reuse the same icon-import convention as `ExternalLink` in `manage/page.tsx` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Better Auth `additionalField` on `user` | Dedicated `trade_note` table + `/api/binder/profile` PATCH route | Explicitly deferred in CONTEXT.md ("Dedicated trade-note API route" under Deferred Ideas) — more moving parts, a second mutation-invalidation surface, no benefit since the field is 1:1 with the user row |
| Native `<textarea>` (new shadcn-style wrapper) | Base UI `Field`/`Fieldset` primitives | Base UI has no dedicated `Textarea` primitive (confirmed: `node_modules/@base-ui/react/` has no `textarea` entry). shadcn's own textarea pattern is a plain native `<textarea>` styled with Tailwind — matches how `Input` wraps `@base-ui/react/input` today, but a `<textarea>` needs no Base UI wrapper since it has no open/close or focus-trap behavior to manage |

**Installation:**
No new packages required. All primitives (`better-auth`, `@base-ui/react`, `drizzle-orm`, `lucide-react`) are already installed at the versions above.

**Version verification:**
```
npm view better-auth version   → 1.6.23 (latest on npm registry, checked 2026-07-20)
Installed (package.json/node_modules): better-auth@1.6.9
```
[VERIFIED: npm registry] The installed version (1.6.9) is behind latest (1.6.23), but the `additionalFields` mechanism verified below is present in the installed 1.6.9 dist files themselves — no upgrade is required for this phase. Do not bump the dependency as part of this phase; it's out of scope and untested against the rest of the app's auth flows.

## Package Legitimacy Audit

No new packages are being installed in this phase — all required primitives (`better-auth`, `@base-ui/react`, `drizzle-orm`, `drizzle-kit`, `lucide-react`) are already present in `package.json` and `node_modules`. The Package Legitimacy Gate is not applicable.

**Packages removed due to [SLOP] verdict:** none (no new packages)
**Packages flagged as suspicious [SUS]:** none (no new packages)

## Architecture Patterns

### System Architecture Diagram

```
[Manage Binder Page — client]
   "View Public Binder" (unchanged)  +  "Trade Profile" button (NEW)
                                            │ onClick → setModalOpen(true)
                                            ▼
                              [ProfileModal — Base UI Dialog]
                              ├─ username Input (existing state, relocated)
                              ├─ public-URL helper text (existing, relocated)
                              └─ tradeNote Textarea (NEW, 140-char cap + counter)
                                            │ single "Save" button
                                            ▼
                       authClient.updateUser({ username, displayUsername, tradeNote })
                                            │  (Better Auth client → its own /api/auth/* route)
                                            ▼
                    [Better Auth server: src/lib/auth.ts — drizzleAdapter]
                    user.additionalFields.tradeNote persisted to `user.trade_note` column
                                            │
                                            ▼
                              [Neon Postgres — user table]

──────────────────────────── separate read path (no Better Auth involved) ────────────────────────────

[Visitor → /binder/[username]]  (RSC, anonymous, no session)
                │ await params → username
                ▼
     getUserIdByUsername(username)   ── raw Drizzle SELECT on schema.user, includes tradeNote
                │
                ▼
     getPublicBinderData(userId)     ── unchanged; offerings + lookingFor
                │
                ▼
     <PublicBinderClient tradeNote={...} .../>
                │
                ▼
     Callout renders under header IF tradeNote is truthy; renders nothing if null/empty
```

### Recommended Project Structure
```
src/
├── app/binder/manage/page.tsx           # header button + modal mount point; remove inline Trade Profile Card
├── app/binder/[username]/page.tsx        # pass tradeNote from getUserIdByUsername through to PublicBinderClient
├── components/binder/
│   ├── manage-trade-card.tsx             # unchanged
│   ├── public-binder-client.tsx          # add tradeNote prop + callout render
│   └── profile-modal.tsx                 # NEW — modal component (username + tradeNote + Save)
├── components/ui/
│   ├── dialog.tsx                        # NEW — Base UI Dialog wrapper, sibling to sheet.tsx
│   └── textarea.tsx                      # NEW — native <textarea> wrapper matching input.tsx styling
├── db/schema.ts                          # add tradeNote text column to user table
├── db/queries/binder.ts                  # getUserIdByUsername selects + returns tradeNote too
└── lib/auth.ts                           # user.additionalFields.tradeNote
```

### Pattern 1: Better Auth `additionalFields` declaration
**What:** Declare custom user-table fields directly in the `betterAuth()` config's `user.additionalFields` object. Confirmed shape from the installed package's own type declarations (`node_modules/@better-auth/core/dist/db/type.d.mts`, type `DBFieldAttributeConfig`): `{ type: "string" | "number" | "boolean" | "date" | ..., required?: boolean, input?: boolean, returned?: boolean, defaultValue?, fieldName?: string }`.
**When to use:** Any time a custom column needs to ride the same read/write pipeline as Better Auth's own session/user endpoints (mirrors exactly how the `username` plugin already adds `username`/`displayUsername`, except those come from the plugin's own `plugin.schema.user.fields`, not from `user.additionalFields` — the mechanism differs slightly but both are merged into the same effective user schema; confirmed in `node_modules/better-auth/dist/db/schema.mjs`: `schema = { ...coreSchema, ...options[modelName]?.additionalFields }`, then plugin schemas are merged on top of that in a loop).
**Example:**
```typescript
// Source: node_modules/@better-auth/core/dist/db/type.d.mts (DBFieldAttributeConfig, installed v1.6.9)
// src/lib/auth.ts
export const auth = betterAuth({
    database: drizzleAdapter(db, { /* unchanged */ }),
    user: {
        additionalFields: {
            tradeNote: {
                type: "string",
                required: false,
                input: true,
            },
        },
    },
    plugins: [ username() ],
    // ...rest unchanged
});
```

### Pattern 2: Typed additional fields on the client (optional but recommended)
**What:** `better-auth/client/plugins` exports `inferAdditionalFields<typeof auth>()` (confirmed export path: `node_modules/better-auth/dist/client/plugins/index.d.mts`, re-exported from `plugins/additional-fields/client.mjs`). Adding this plugin to `createAuthClient()` gives `authClient.updateUser({ tradeNote })` and `session.user.tradeNote` proper TypeScript types, inferred from the server `auth` config's type — without it, `tradeNote` still flows correctly at runtime (Better Auth returns all non-`returned:false` fields regardless of client-side plugin registration) but the client TS types won't know about it, forcing an `as any` cast that this project's strict TypeScript setup would otherwise reject.
**When to use:** Recommended for this phase since `manage/page.tsx` and `profile-modal.tsx` will read/write `session.user.tradeNote` directly and the project has no existing pattern of casting around auth-client types.
**Example:**
```typescript
// Source: node_modules/better-auth/dist/client/plugins/index.d.mts (installed v1.6.9)
// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { usernameClient, inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

export const authClient = createAuthClient({
    baseURL: /* unchanged */,
    plugins: [
        usernameClient(),
        inferAdditionalFields<typeof auth>(),
    ],
});
```
**Caveat:** `import type { auth }` is a type-only import — it is erased at compile time and does not bundle `src/lib/auth.ts` (which imports `@/db`, a Node-only module using `@neondatabase/serverless` + `ws`) into the client bundle. `src/lib/auth.ts` and `src/db/index.ts` carry no `"server-only"` guard today, so a type-only import is safe; a *value* import would not be.

### Pattern 3: Modal built on the existing Base UI Dialog primitive
**What:** `@base-ui/react/dialog` is already installed and already used — `src/components/ui/sheet.tsx` wraps it (`import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"`) with `Root`, `Trigger`, `Portal`, `Backdrop`, `Popup`, `Title`, `Description`, `Close` parts (confirmed via `node_modules/@base-ui/react/dialog/index.parts.d.ts` — same part set: `root`, `trigger`, `portal`, `popup`, `backdrop`, `title`, `description`, `close`, `viewport`). There is no separate "Dialog vs Sheet" primitive in Base UI — a shadcn-style `Dialog` component and the existing `Sheet` component are the *same* underlying Base UI primitive with different popup positioning/animation classes (`Sheet` slides from a side; a centered `Dialog` uses centered-fixed positioning instead of `data-[side=...]`).
**When to use:** For this phase's profile modal — a centered dialog reads better for a "profile settings" form than a slide-in sheet, matching common shadcn `Dialog` conventions, but either is valid within the Base UI + shadcn constraint. Discretion is explicitly left to the planner/implementer per CONTEXT.md.
**Example:**
```typescript
// Source: node_modules/@base-ui/react/dialog/index.parts.d.ts + src/components/ui/sheet.tsx (existing pattern in this repo)
"use client"
import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "@/lib/utils"

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}
function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}
function DialogContent({ className, children, ...props }: DialogPrimitive.Popup.Props) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs" />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-popover p-6 shadow-lg",
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}
// DialogTitle / DialogDescription / DialogClose follow the exact same wrapping pattern as SheetTitle/SheetDescription/SheetClose in sheet.tsx
```

### Pattern 4: Raw Drizzle read for the public page — no Better Auth session API
**What:** `src/app/binder/[username]/page.tsx` is an RSC that calls `getUserIdByUsername(username)` then `getPublicBinderData(userId)` — both are direct `db.select(...)` calls against `schema.user`/etc. There is no `auth.api.getSession()` call anywhere in this path (confirmed by reading `binder.ts` and the page — neither imports `@/lib/auth`). This is correct for a public, unauthenticated-visitor page and must not change.
**When to use:** Extend `getUserIdByUsername` to also select `user.tradeNote`, changing its return shape from `number | null` to `{ id: number; tradeNote: string | null } | null`. Update the one call site (`[username]/page.tsx`) accordingly. This is the minimal-surface-area change — no new query function needed.
**Example:**
```typescript
// Source: src/db/queries/binder.ts (existing code, extended)
export async function getUserIdByUsername(username: string) {
  const [u] = await db
    .select({ id: user.id, tradeNote: user.tradeNote })
    .from(user)
    .where(eq(user.username, username.toLowerCase()))
    .limit(1);
  return u ?? null;
}
```
```typescript
// Source: src/app/binder/[username]/page.tsx (existing code, extended)
const profile = await getUserIdByUsername(username);
if (!profile) notFound();
const [binderData, filterOptions] = await Promise.all([
  getPublicBinderData(profile.id),
  getFilterOptions(),
]);
// ...
<PublicBinderClient username={username} tradeNote={profile.tradeNote} ... />
```

### Anti-Patterns to Avoid
- **Building a second write path for tradeNote:** Do not add a `/api/binder/profile` PATCH route. CONTEXT.md's Deferred Ideas explicitly rules this out; `authClient.updateUser` already covers it in one call.
- **`dangerouslySetInnerHTML` for the public note:** The note is untrusted-origin public text (any user can type anything). Render it as plain JSX text content (`{tradeNote}`), which React auto-escapes — never inject as HTML. No sanitization library (e.g. DOMPurify) is needed since nothing is parsed as markup.
- **Reserving layout space for an empty note:** D-07 requires literally no DOM node when the note is empty/null — not an empty bordered box, not a placeholder paragraph. Guard with `{tradeNote && <Callout>...}` (or a dedicated `TradeNoteCallout` component that itself returns `null` on falsy input), not CSS `hidden`/`opacity-0` (which still reserves layout or leaves an empty accessible node).
- **Forgetting `input: true` semantics:** Better Auth's default for `additionalFields` is `input: true, required: true, returned: true`. An **optional** note (D-05) requires `required: false` explicitly, or `authClient.updateUser` calls that omit `tradeNote` (e.g. future callers) would fail validation. Since D-09 always sends `tradeNote` alongside `username` in the same call, this mostly matters for allowing an *empty string* to be a valid save value — set `required: false` so `""` (clearing the note) is accepted, not rejected as a missing required field.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Persisting a new user-scoped field alongside the session | A custom `/api/user/profile` route + separate `user_profiles` table | Better Auth `user.additionalFields` (Pattern 1) | One save path already exists (`authClient.updateUser`); a parallel table/route duplicates the mutation-invalidation surface for no benefit — explicitly deferred in CONTEXT.md |
| Centered modal dialog with focus trap / escape-to-close / scroll lock | A custom `useEffect`-based modal with manual `document.body` overflow toggling | `@base-ui/react/dialog` (already installed, already used for `Sheet`) | Base UI's `Dialog.Root`/`Popup`/`Backdrop` already implement focus management, `Escape` handling, outside-click dismissal, and scroll locking — reinventing this is exactly the "deceptively complex problem" pattern to avoid |
| Escaping user-generated public text | A regex-based HTML stripper or a sanitization library | Plain JSX text interpolation (`{tradeNote}`) | React's JSX text nodes are auto-escaped by the DOM renderer; no markup is ever parsed from the string, so there is nothing to sanitize against XSS as long as the string is never passed through `dangerouslySetInnerHTML` |
| Character-limit enforcement + counter | Free-typed unclamped textarea with a separate validation library | `maxLength={140}` on the native `<textarea>` (browser enforces the hard cap) + a plain `{note.length}/140` counter derived from local state | Native HTML attribute already does the clamping; no library needed for a single numeric constraint |

**Key insight:** Every "hard part" of this phase (auth field storage, modal primitive, XSS-safe rendering) is already solved by a dependency or pattern already present in this codebase. The only genuinely new code is: one schema column, one migration, one modal component, one textarea component, and one conditional callout block.

## Runtime State Inventory

> This phase is additive (new column, new UI), not a rename/refactor/migration of existing identifiers. Included per the mandatory checklist regardless, since a schema column is being added.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | No existing "trade note" data anywhere — this is a wholly new field. The `user` table has zero rows referencing a note today. | None — pure additive column, `DEFAULT NULL` (nullable), no backfill needed |
| Live service config | None found — no n8n/Datadog/Tailscale/Cloudflare-style external config in this project's stack (Vercel + Neon only, both git-tracked via `drizzle.config.ts` / env vars) | None |
| OS-registered state | None — no Task Scheduler/pm2/launchd/systemd registrations in this project | None |
| Secrets/env vars | None — no new env var or secret is introduced by this phase | None |
| Build artifacts | None — no renamed package/module; `drizzle/` migration files are additive only | None — a new migration file will be *added* (0006), not modifying prior ones |

**Nothing found requiring migration beyond the additive schema column** — verified by reading `schema.ts`, `auth.ts`, and the full `drizzle/` migration history (0000–0005); no prior art references a "trade note" concept anywhere in the codebase or git history (`git log --all -S "tradeNote"` and `-S "trade_note"` both return no hits before this research).

## Common Pitfalls

### Pitfall 1: Declaring `additionalFields` only in `auth.ts` and forgetting the Drizzle column
**What goes wrong:** Better Auth's Drizzle adapter does not auto-create columns. If `user.additionalFields.tradeNote` is declared in `src/lib/auth.ts` but `schema.ts`'s `user` table has no matching `trade_note` column, `authClient.updateUser({ tradeNote })` will throw a Postgres "column does not exist" error at the Drizzle layer the first time it's called.
**Why it happens:** Better Auth's `additionalFields` config only affects what shape of data the auth *API* accepts/returns and validates — it does not generate DDL. Schema/DDL is entirely Drizzle's job, driven by `schema.ts` + `drizzle-kit generate`/`push`.
**How to avoid:** Always pair the `auth.ts` addition with a `schema.ts` column addition in the same task, then run the migration before testing the write path.
**Warning signs:** A 500 error from `/api/auth/update-user` referencing an unknown column; `authClient.updateUser` resolving with an error object instead of throwing (Better Auth client calls typically return `{ data, error }`, not throw — check `error` on the response, don't assume a thrown exception).

### Pitfall 2: `required: true` (the default) rejecting an intentional "clear the note" save
**What goes wrong:** D-05 requires "saving an empty value clears the note." If `tradeNote`'s field attribute is left at the Better Auth default (`required: true`), sending `tradeNote: ""` may be treated as a missing/invalid required value by server-side validation, causing the save to fail silently or throw, and an empty note can never be persisted after one has been set.
**Why it happens:** Better Auth mirrors typical form-validation conventions where `required` fields reject empty strings unless explicitly told otherwise.
**How to avoid:** Set `required: false` explicitly (Pattern 1). Verify empty-string round-trip manually as part of UAT (set a note, save; clear the textarea, save; reload the public page and confirm the callout is gone).
**Warning signs:** The character counter shows `0/140` and Save appears to succeed, but the public page still shows the old note after a refresh.

### Pitfall 3: Migration command mismatch — this repo's convention is `drizzle-kit push`, not always `generate` + `migrate`
**What goes wrong:** `package.json` defines `db:generate` (`drizzle-kit generate`), `db:push` (`drizzle-kit push`), and `db:migrate` (`drizzle-kit migrate`) as three separate scripts, but this project's actual history (see Phase 21's `21-04-migration-log.md`) shows schema changes were applied to the live Neon database via **`npx drizzle-kit push --force`** directly — not via `db:generate` followed by `db:migrate`. The `drizzle/*.sql` files in git are a mix of properly generated snapshots (0000–0004, before the auth/username schema) and at least one gap where a `push` was applied without a matching generated file ever being committed for it (the `user_trade_offerings` table from Phase 21 has no corresponding `NNNN_*.sql` file in `drizzle/`).
**Why it happens:** `drizzle-kit push` applies the current `schema.ts` state directly to the configured `DATABASE_URL` without requiring a migration file to exist first — convenient for solo/small-team iteration against Neon, at the cost of migration-file/DB drift.
**How to avoid:** For this phase's single additive nullable column, run `npx drizzle-kit generate` first (to keep a migration file in git per `STRUCTURE.md`'s stated convention: "IS committed to git ... one migration per schema change"), then apply it with `npx drizzle-kit push`. Since Neon's serverless driver + this local environment previously needed `NODE_TLS_REJECT_UNAUTHORIZED=0` to bypass an SSL verification issue in `drizzle-kit push` (documented in `21-04-migration-log.md`), be ready to prefix the push command with that env var if the same TLS error recurs. `--force` is only needed when drizzle-kit's interactive prompt can't be answered (typically for destructive changes); a nullable additive column should not trigger a data-loss prompt, so `--force` is likely unnecessary here — try without it first.
**Warning signs:** `drizzle-kit push` hangs waiting for a TTY prompt in a non-interactive shell; a `SELF_SIGNED_CERT_IN_CHAIN` or similar TLS error against the Neon connection.

### Pitfall 4: Adding `inferAdditionalFields` creates a value import instead of a type-only import
**What goes wrong:** If a future edit changes `import type { auth } from "@/lib/auth"` (Pattern 2) to a plain `import { auth } from "@/lib/auth"` (e.g. an editor auto-import "helpfully" removing the `type` keyword), the client bundle would attempt to pull in `src/lib/auth.ts`, which imports `@/db` → `@neondatabase/serverless` + `ws` (Node-only), breaking the client build or bloating the bundle.
**Why it happens:** TypeScript's `import type` is easy to accidentally widen to a value import via IDE auto-import or a lint autofix that doesn't understand the intent.
**How to avoid:** Keep the `import type` explicit; consider a lint rule (`@typescript-eslint/consistent-type-imports`) if not already enabled — check `eslint.config` for this rule before relying on it.
**Warning signs:** Build errors referencing `ws`, `neonConfig`, or `Pool` in a client-bundled chunk; a sudden appearance of Node polyfill warnings in `next build` output for the auth-client module graph.

## Code Examples

### Full modal save handler — mirrors existing `handleUpdateUsername`
```typescript
// Source: src/app/binder/manage/page.tsx (existing handleUpdateUsername, extended per D-09)
const handleSaveProfile = async () => {
  setIsSaving(true);
  const { error } = await authClient.updateUser({
    username: username.toLowerCase().trim(),
    displayUsername: username.trim(),
    tradeNote: tradeNote.trim(), // "" clears the note (D-05); Better Auth requires `required: false` on the field
  });
  setIsSaving(false);
  if (!error) setModalOpen(false); // close only on success — keep modal open with the note intact on failure
};
```

### Public callout — renders nothing when empty (D-06/D-07)
```tsx
// Source: src/components/binder/public-binder-client.tsx (new block, inserted under the header, before the sections)
{tradeNote && (
  <div className="px-4 lg:px-8 py-2 bg-muted/20 border-b border-border text-sm text-muted-foreground">
    {tradeNote}
  </div>
)}
```

### Textarea with character counter (D-04)
```tsx
// Source: pattern derived from src/components/ui/input.tsx styling conventions — new src/components/ui/textarea.tsx
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 md:text-sm dark:bg-input/30",
        className
      )}
      {...props}
    />
  );
}
```
```tsx
// Usage in profile-modal.tsx
<Textarea
  value={tradeNote}
  onChange={e => setTradeNote(e.target.value.slice(0, 140))}
  maxLength={140}
  rows={3}
  placeholder="e.g. EU only, will ship"
/>
<p className="text-xs text-muted-foreground text-right">{tradeNote.length}/140</p>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline "Trade Profile" `Card` permanently on the manage page | Header profile button opening a modal | This phase (Phase 31) | Frees up left-column vertical space; matches D-01/D-02/D-03 |
| Username-only profile editing | Username + public trade note, single Save | This phase | One additional `additionalField`, same write path |

**Deprecated/outdated:** None — no library or pattern used elsewhere in this codebase is being replaced; this phase only adds to existing patterns (Better Auth additionalFields mechanism, Base UI dialog primitive, RSC public data reads).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `npx drizzle-kit push` (without `--force`) will not prompt interactively for a purely additive nullable column — no destructive-change prompt expected | Pitfall 3 | If wrong, the migration command hangs in a non-interactive shell; mitigate by running interactively first, or adding `--force` if a prompt appears and the diff is confirmed non-destructive |
| A2 | The `NODE_TLS_REJECT_UNAUTHORIZED=0` workaround documented in Phase 21's migration log is still needed in the current local environment | Pitfall 3 | If the underlying Neon/Node TLS issue has since been resolved (e.g. certificate updated, driver upgraded), the env var is a harmless no-op; if still needed and omitted, the push command fails with a TLS handshake error — either way, low risk, just try both |

**On confidence tiering:** The core technical claims in this research (Better Auth `additionalFields` shape, Base UI dialog parts, the public-read code path) are tagged `[VERIFIED: ...]` throughout because they were confirmed by directly reading this repo's installed `node_modules` type declarations and its own source files — not from training-data recall of Better Auth's hosted docs (which were not fetched this session; no MCP docs provider was invoked because the installed package's own `.d.mts` files were sufficient, direct, and unambiguous ground truth for the exact installed version 1.6.9). Where a claim rests on prior-phase history (`21-04-migration-log.md`) rather than the current installed code, it is treated as `[CITED: internal phase history]` rather than `[VERIFIED]`, since environment conditions (TLS, Neon driver state) may have changed since that log was written.

## Open Questions

1. **Should `tradeNote` character limit (140) be enforced server-side too, or is client-side `maxLength` sufficient?**
   - What we know: The native `<textarea maxLength={140}>` prevents typing beyond the cap in every evergreen browser; D-04 only specifies the UI behavior (cap + counter), not a security/data-integrity requirement.
   - What's unclear: Whether a malicious client (not the app's UI) could POST a longer string directly to Better Auth's update-user endpoint, bypassing the textarea's `maxLength`.
   - Recommendation: Low risk for this project's threat model (single-user-writes-own-profile, not a multi-tenant abuse vector) — client-side cap is sufficient for the UAT criteria as written. If stricter enforcement is wanted, add a `validator.input` Zod schema to the `additionalFields.tradeNote` config (the type defs confirm `validator?: { input?: StandardSchemaV1 }` is supported) — flag this as an optional hardening task, not a blocking one.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Neon Postgres (`DATABASE_URL`) | Schema migration + all reads/writes | Assumed ✓ (required for `next dev`/`db:push` to function at all; not independently re-verified this session since it's a pre-existing hard dependency of the whole app) | — | None — blocking if unset, but this is true of every existing phase, not new to this one |
| `@base-ui/react` dialog primitive | Profile modal | ✓ | 1.4.1 (installed, confirmed via `node_modules/@base-ui/react/dialog/`) | — |
| `better-auth` additionalFields mechanism | Trade note storage | ✓ | 1.6.9 (installed, confirmed via `node_modules/better-auth/dist/db/schema.mjs`) | — |

**Missing dependencies with no fallback:** None identified beyond the pre-existing `DATABASE_URL` requirement common to all phases.

**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (via `vitest.config.mts`) + `@testing-library/react` 16.3.2 + `jsdom` 29.1.1 |
| Config file | `vitest.config.mts` (repo root) — `environment: 'node'` default, individual test files opt into `@vitest-environment jsdom` for component tests (see `src/components/home/hero-section.test.tsx`) |
| Quick run command | `npx vitest run src/components/binder/public-binder-client.test.tsx src/db/queries/binder.test.ts` (once created) |
| Full suite command | `npm test` (runs `vitest`, no args — full repo suite) |

### Phase Requirement → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BINDER-15 | Profile button opens modal; inline Card is gone | component | `npx vitest run src/app/binder/manage/page.test.tsx` | ❌ Wave 0 (no test file for `manage/page.tsx` exists today) |
| BINDER-16 | Trade note textarea: 140-char cap, counter, empty clears | component | `npx vitest run src/components/binder/profile-modal.test.tsx` | ❌ Wave 0 (new component, new test) |
| BINDER-17 | Public page shows note when set, nothing when empty | component | `npx vitest run src/components/binder/public-binder-client.test.tsx` | ❌ Wave 0 (`public-binder-client.tsx` has no existing test file) |
| BINDER-17 (data path) | `getUserIdByUsername` returns `tradeNote` alongside `id` | unit | `npx vitest run src/db/queries/binder.test.ts` | ❌ Wave 0 (`binder.ts` has no existing test file — note the 21-REVIEW.md caution about DB-mock fragility for this file; keep new tests narrow and mock only the specific query shape being tested, not the whole `getPublicBinderData` call chain) |

### Sampling Rate
- **Per task commit:** run the specific new/changed test file(s) via `npx vitest run <file>`
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/components/binder/profile-modal.test.tsx` — covers BINDER-15/16 (modal open/close, textarea cap+counter, empty-clears-on-save intent via a mocked `authClient.updateUser`)
- [ ] `src/components/binder/public-binder-client.test.tsx` — covers BINDER-17 (renders callout with note text; renders nothing/no extra DOM node when `tradeNote` prop is `null`/`""`)
- [ ] `src/db/queries/binder.test.ts` — covers BINDER-17 data path (`getUserIdByUsername` selects and returns `tradeNote`); follow the `vi.mock('@/db', ...)` guard pattern from `src/db/queries/collection.test.ts` rather than attempting a full multi-query mock chain (per the fragility warning already recorded in `21-REVIEW.md` for `getPublicBinderData`-style tests)
- [ ] No new test framework or config needed — Vitest + RTL + jsdom already fully set up and used by 25 existing test files, including component tests in this exact `components/binder/` sibling area is not present yet, but the pattern is well-established elsewhere (`components/home/hero-section.test.tsx`, `components/catalog/card-item.test.tsx`)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (unchanged) | Better Auth session cookies, already in place |
| V3 Session Management | no (unchanged) | Better Auth session cookies, already in place |
| V4 Access Control | yes | Only the authenticated session owner can call `authClient.updateUser` for their own row — Better Auth scopes updates to the current session's user by design (no `userId` parameter is accepted from the client for this call); no new access-control surface is introduced |
| V5 Input Validation | yes | `maxLength={140}` client-side cap (Pitfall/Open Question above); optionally a `validator.input` Zod schema on the `additionalFields.tradeNote` config for server-side enforcement |
| V6 Cryptography | no | Not applicable — plain text field, no secrets/tokens involved |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Stored XSS via public trade note (any authenticated user can set text a visitor with no account will see) | Tampering / Elevation of Privilege (limited) | Never render via `dangerouslySetInnerHTML`; plain JSX text interpolation auto-escapes (`{tradeNote}`) — already the codebase's universal pattern for rendering user-supplied strings (card names, usernames, etc. are all rendered the same way elsewhere) |
| Unbounded-length input flooding the DB / breaking layout | Denial of Service (minor) | 140-char client cap; optionally add a server-side `validator.input` check per the Open Question above |

## Sources

### Primary (HIGH confidence)
- `node_modules/@better-auth/core/dist/db/type.d.mts` (installed better-auth 1.6.9) — `DBFieldAttribute`/`DBFieldAttributeConfig` shape
- `node_modules/better-auth/dist/db/schema.mjs` (installed better-auth 1.6.9) — confirms `options[modelName]?.additionalFields` merge behavior and plugin schema merge order
- `node_modules/better-auth/dist/plugins/additional-fields/client.d.mts` and `node_modules/better-auth/dist/client/plugins/index.d.mts` (installed better-auth 1.6.9) — `inferAdditionalFields` export path and type-inference shape
- `node_modules/@base-ui/react/dialog/index.parts.d.ts` (installed @base-ui/react 1.4.1) — Dialog primitive parts (`root`, `trigger`, `portal`, `popup`, `backdrop`, `title`, `description`, `close`, `viewport`)
- This repo: `src/lib/auth.ts`, `src/lib/auth-client.ts`, `src/db/schema.ts`, `src/db/queries/binder.ts`, `src/app/binder/manage/page.tsx`, `src/app/binder/[username]/page.tsx`, `src/components/binder/public-binder-client.tsx`, `src/components/ui/sheet.tsx`, `src/components/ui/input.tsx`, `src/components/ui/button.tsx` — all read directly this session
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-params.md` (installed Next.js 16.2.4 bundled docs) — confirms this project's existing `params: Promise<{ username: string }>` + `await params` pattern in `[username]/page.tsx` is the current, correct async-params convention for this installed Next.js version; no change needed to that file's params handling

### Secondary (MEDIUM confidence)
- `.planning/milestones/v4-phases/21-binder-variant-badges/21-04-migration-log.md` and `21-REVIEW.md` — this project's own prior-phase record of the actual `drizzle-kit push --force` command used against Neon, and a documented DB-mock test fragility caution for `getPublicBinderData`-style functions
- `npm view better-auth version` — confirms 1.6.23 is latest on the registry vs. 1.6.9 installed (no upgrade performed or recommended this phase)

### Tertiary (LOW confidence)
- None used — all findings for this phase were resolvable directly from installed package source/types and this repo's own code, so no unverified WebSearch-only claims are present.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all mechanisms confirmed against installed package internals
- Architecture: HIGH — public-read-path independence from Better Auth confirmed by direct code read, not inferred
- Pitfalls: HIGH — each pitfall is grounded in either the installed type definitions' documented defaults (`required: true` default) or this project's own prior migration history (TLS workaround, push-vs-generate drift)

**Research date:** 2026-07-20
**Valid until:** 30 days (stable internal-tooling domain; re-verify if `better-auth` or `@base-ui/react` are upgraded before this phase executes)

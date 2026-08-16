---
phase: 31-trade-profile-modal-public-trade-note
reviewed: 2026-07-20T00:00:00Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - src/db/schema.ts
  - src/lib/auth.ts
  - src/lib/auth-client.ts
  - src/db/queries/binder.ts
  - src/db/queries/binder.test.ts
  - src/components/ui/dialog.tsx
  - src/components/ui/textarea.tsx
  - src/components/binder/profile-modal.tsx
  - src/components/binder/profile-modal.test.tsx
  - src/components/binder/public-binder-client.tsx
  - src/components/binder/public-binder-client.test.tsx
  - src/app/binder/manage/page.tsx
  - src/app/binder/[username]/page.tsx
  - drizzle/0006_trade_note.sql
  - tests/binder-flow.test.ts
  - tests/binder-queries.test.ts
findings:
  critical: 1
  warning: 4
  info: 4
  total: 9
status: issues_found
---

# Phase 31: Code Review Report

**Reviewed:** 2026-07-20
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

Phase 31 adds a nullable `user.trade_note` column, a profile modal for editing username + trade note, and a public-binder callout that renders the note. The four flagged concerns were verified directly:

- **XSS-safety — PASS.** The note renders as `{tradeNote}` in JSX (`public-binder-client.tsx:137`), so React auto-escapes it. There is no `dangerouslySetInnerHTML`. The dedicated XSS test in `public-binder-client.test.tsx` confirms markup is not parsed. No injection vector found.
- **140-char cap — FAIL.** The cap is enforced **only** client-side (`slice(0,140)` + `maxLength`). There is no server-side or DB-level limit, so the contract is trivially bypassable (see CR-01).
- **`updateUser` owner-scoping — PASS.** `authClient.updateUser` is session-bound and mutates only the caller's own row; `tradeNote` is exposed as an `input: true` additionalField. No authorization gap.
- **additionalField/column pairing — PASS.** `additionalFields.tradeNote` (`auth.ts`), `tradeNote: text('trade_note')` (`schema.ts`), and migration `0006_trade_note.sql` are consistent.

The most serious issue is the missing server-side length validation. There is also one currently-failing test in the reviewed set, and several usability/quality gaps around error reporting and username coupling.

## Structural Findings (fallow)

No structural pre-pass payload was provided with this review.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: 140-character trade-note cap is not enforced server-side (missing input validation)

**File:** `src/lib/auth.ts:19-25`, `src/components/binder/profile-modal.tsx:98-99`, `src/db/schema.ts:21`
**Issue:** The 140-char limit lives entirely in the client: `onChange={e => setTradeNote(e.target.value.slice(0, 140))}` and `maxLength={140}`. The write path is `authClient.updateUser({ tradeNote })` → Better Auth's update-user endpoint. The additionalField declares no validator:

```ts
tradeNote: {
  type: "string",
  required: false,
  input: true,   // client-settable, but with NO length/shape validation
},
```

The backing column is `text('trade_note')` — unbounded. A caller hitting the update-user endpoint directly (or via `authClient.updateUser`) with a 100 KB string bypasses the UI clamp entirely, and that value is then rendered verbatim on the public binder page (`public-binder-client.tsx:131-139`). React escaping prevents XSS, but the stated cap is a contract the server never enforces — enabling oversized rows, layout-breaking public output, and unbounded stored text. A grep of `src/` confirms zero server-side references to length/validation for `tradeNote`.
**Fix:** Enforce the limit server-side. Either add validation on the additionalField, e.g.:

```ts
tradeNote: {
  type: "string",
  required: false,
  input: true,
  validator: {
    input: z.string().trim().max(140).optional(),
  },
},
```

(confirm the exact validator API against the installed Better Auth version), and/or constrain the column to `varchar('trade_note', { length: 140 })`. Also trim/normalize on the server so the DB never stores more than 140 chars.

## Warnings

### WR-01: `calculates looking for quantity correctly` test is currently failing (red suite)

**File:** `tests/binder-queries.test.ts:69-98`
**Issue:** Running the in-scope suites yields a failure:
`getPublicBinderData > calculates looking for quantity correctly` — `expected "vi.fn()" to be called at least once` at line 95. The mock returns query results in the order `offerings, inventory, manualWants, exclusions, decks`, but `getPublicBinderData` executes them in the order `offerings, manualWants, inventory, exclusions, decks` (`binder.ts:17,49,76,87,97`), so the mock rows are assigned to the wrong locals. Additionally, `calculateLookingFor` is only invoked when `userDecks.length > 0`; the mock supplies empty decks, so it is never called and the assertion can never pass. (Verified: this failure predates Phase 31, but the file was modified in this phase and the suite ships red.)
**Fix:** Re-order the `mockResolvedValueOnce` sequence to match the actual query order, and provide at least one deck + deck-card row so the auto-want path (and `calculateLookingFor`) actually executes. Or drop the unreachable `calculateLookingFor` assertion and align the fixture with the real code path.

### WR-02: Save error copy misattributes validation failures to network problems

**File:** `src/components/binder/profile-modal.tsx:54-58, 107-111`
**Issue:** Any non-null `saveError` renders "Couldn't save changes. Check your connection and try again." But `updateUser` most commonly fails on validation — username already taken, too short, or invalid characters — not connectivity. A user whose chosen username is taken is told to check their connection, which is actively misleading and gives them no path to resolution.
**Fix:** Surface the actual failure reason, e.g. `setError(saveError.message ?? 'generic')` and render the message (fall back to the generic copy only when no message is present). At minimum distinguish "username unavailable" from a transport error.

### WR-03: Trade note cannot be saved without a valid username (coupled single call)

**File:** `src/components/binder/profile-modal.tsx:45-59`
**Issue:** `handleSave` always sends `username`, `displayUsername`, and `tradeNote` in one `updateUser` call. For a user who has not yet set a username, `currentUsername` is `''`, so the call sends `username: ''`, which the username plugin rejects — meaning the trade note can never be saved until a valid username is also provided, and the failure surfaces as the generic error (WR-02). There is also no client-side guard against empty/invalid usernames before submit.
**Fix:** Validate the username field client-side (non-empty, length/charset) and block Save with inline guidance when invalid, or decouple so that clearing to an empty username does not silently poison a note-only edit. Consider only sending `username`/`displayUsername` when they actually changed.

### WR-04: `mapToFilterable(c: any)` erases types at the RSC→client boundary

**File:** `src/app/binder/[username]/page.tsx:24`
**Issue:** The mapper is typed `(c: any)`, discarding all type checking on the row shape returned by `getPublicBinderData`. If a selected column is renamed or dropped (e.g. `c.tradeQuantity`, `c.lookingForQuantity`), nothing flags it at compile time and the public binder silently renders wrong/empty fields. This is exactly the kind of boundary where the query result type should be enforced.
**Fix:** Type the parameter against the element type of `binderData.offerings`/`lookingFor` (e.g. `type BinderRow = Awaited<ReturnType<typeof getPublicBinderData>>['offerings'][number]`) instead of `any`.

## Info

### IN-01: `getUserIdByUsername` name no longer matches its return value

**File:** `src/db/queries/binder.ts:6-13`
**Issue:** The function now returns `{ id, tradeNote } | null`, not a user id. The name misleads callers into expecting a scalar.
**Fix:** Rename to something like `getBinderProfileByUsername` (or `getPublicUserByUsername`) to reflect the object it returns.

### IN-02: Public trade-note callout lacks word-break/wrap handling

**File:** `src/components/binder/public-binder-client.tsx:131-139`
**Issue:** The callout `div` uses `text-sm text-muted-foreground` with no `break-words`/`whitespace-pre-wrap`. A long unbroken token (or the oversized note enabled by CR-01) can overflow horizontally on narrow viewports.
**Fix:** Add `break-words` (and `whitespace-pre-wrap` if newlines should be preserved) to the callout container.

### IN-03: Hardcoded `swu-tracker.com` in the profile modal helper text

**File:** `src/components/binder/profile-modal.tsx:62`
**Issue:** `publicUrl` is built from a hardcoded domain string, while the real link in `manage/page.tsx:357` uses a relative path and the auth client derives its base URL from `NEXT_PUBLIC_APP_URL`. In any non-production environment the displayed URL is wrong. It also shows the raw (possibly mixed-case) username, whereas the stored/canonical username is lowercased.
**Fix:** Derive the origin from `NEXT_PUBLIC_APP_URL`/`window.location.origin`, and display the lowercased username to match what is actually stored and routed.

### IN-04: Large select projection duplicated three times in `getPublicBinderData`

**File:** `src/db/queries/binder.ts:18-45, 50-72, 179-196`
**Issue:** The ~16-column card projection is copy-pasted across the offerings, manual-wants, and auto-want queries. Divergence risk on future column changes. (Pre-existing; noted for maintainability, not introduced by this phase.)
**Fix:** Extract a shared column-selection object and spread it into each `.select({...})`.

---

_Reviewed: 2026-07-20_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

# Phase 31: Trade Profile Modal & Public Trade Note - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-20
**Phase:** 31-Trade Profile Modal & Public Trade Note
**Areas discussed:** Profile button entry, Trade note input, Note on public binder, Modal contents & save

---

## Profile button entry

**Where the button lives:**

| Option | Description | Selected |
|--------|-------------|----------|
| Header, next to View Public Binder | Top-right header row beside the existing button; inline Trade Profile card removed | ✓ |
| Header, replace/absorb URL link | One header button; the View Public Binder link moves inside the modal | |
| Where the card was | Slim button in the left column where the card sat | |

**How the button reads:**

| Option | Description | Selected |
|--------|-------------|----------|
| Icon + label | User/settings icon with text like "Trade Profile" / "Edit Profile" | ✓ |
| Icon only | Just an icon button with accessible label/tooltip | |
| You decide | Match existing button styling | |

**User's choice:** Header beside "View Public Binder"; icon + label.
**Notes:** "View Public Binder" link stays in the header (additive button, one-click public path preserved).

---

## Trade note input

**Input type & length:**

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-line, ~140 char limit | Small textarea, 140-char cap, live counter | ✓ |
| Single-line, ~100 char limit | One-line Input, ~100-char cap | |
| Multi-line, ~280 char limit | Textarea, tweet-length cap | |

**Empty state / required:**

| Option | Description | Selected |
|--------|-------------|----------|
| Optional, example placeholder | Optional; placeholder shows worked example ("e.g. EU only, will ship"); empty save clears it | ✓ |
| Optional, generic placeholder | Optional; generic "Add a public trade note…" | |
| You decide | Sensible copy matching app tone | |

**User's choice:** Multi-line textarea, 140-char cap + live counter, optional, example placeholder.

---

## Note on public binder

**Placement / treatment:**

| Option | Description | Selected |
|--------|-------------|----------|
| Callout banner under header | Distinct callout under the username header, above trade sections | ✓ |
| Muted line under header | Quieter muted-text line, no box | |
| You decide | Match existing header layout | |

**Empty behavior:**

| Option | Description | Selected |
|--------|-------------|----------|
| Hide entirely | Render nothing — no box, line, or gap (criterion #3) | ✓ |
| Show subtle absence | Reserve space / faint placeholder | |

**User's choice:** Callout banner under the username header; hidden entirely when empty.

---

## Modal contents & save

**Modal contents:**

| Option | Description | Selected |
|--------|-------------|----------|
| Username + note + URL | Both fields plus the public-URL helper/link, full profile in one place | ✓ |
| Username + note only | Just the two editable fields; URL link stays in header | |

**Save flow:**

| Option | Description | Selected |
|--------|-------------|----------|
| One Save for both | Single Save persists username + note together, then closes | ✓ |
| Separate per field | Username keeps its own Update, note has its own Save | |
| You decide | Simplest reliable flow given Better Auth | |

**Note storage:**

| Option | Description | Selected |
|--------|-------------|----------|
| Better Auth additionalField on user | `tradeNote` additionalField, saved via authClient.updateUser — mirrors username | ✓ |
| New column + dedicated API route | `tradeNote` column + new PATCH route | |
| You decide | Let planning choose | |

**User's choice:** Modal holds username + note + URL helper; one Save orchestrates both writes; note stored as a Better Auth additionalField on `user`.
**Notes:** additionalField must be declared in both `auth.ts` and `schema.ts` (+ migration); a schema column is required regardless so the public binder query can read it.

---

## Claude's Discretion

- Modal primitive (shadcn `Dialog` / Base UI dialog) and trigger wiring, within the Base UI + shadcn / no-`@radix-ui` constraint.
- Button label wording, icon choice, callout styling, counter placement.
- Note trim/sanitize on save; plain-text escaping on the public page (no HTML rendering).

## Deferred Ideas

- **Combined wants & exclusions list** → Phase 32 (BINDER-18/19/20); `ManageWantsList` untouched here.
- **Dedicated trade-note API route** — deferred in favor of the Better Auth additionalField path; revisit only if additionalFields don't integrate cleanly with the serial-id Drizzle adapter.

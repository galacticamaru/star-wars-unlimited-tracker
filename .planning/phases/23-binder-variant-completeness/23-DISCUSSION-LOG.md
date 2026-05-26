# Phase 23: Binder Variant Completeness - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 23-binder-variant-completeness
**Areas discussed:** Looking For variant identity, Card Detail trade section, Manage Binder owned-card discovery, Cross-page sync semantics

---

## Looking For Variant Identity

**Question 1: How should Looking For variant badges work?**

| Option | Description | Selected |
|--------|-------------|----------|
| Make wants per-variant | Add variant type to tradeManualWants; auto-wants stay card-def level | ✓ |
| Show Normal badge by default | Keep card-def level, remove hardcoded Normal filter, always badge as Normal | |
| No badge on Looking For tiles | Skip variant badge on Looking For entirely | |

**User's choice:** Make wants per-variant
**Notes:** Manual wants become per-printing (per variant); auto-wants stay card-definition level.

---

**Question 2: Should auto-wants (deck-driven) infer variant?**

| Option | Description | Selected |
|--------|-------------|----------|
| Stay card-def level, show Normal badge | Auto-wants mean "any version"; Normal badge is a reasonable default | ✓ |
| Infer variant from owned collection | If you own 0 Foil but deck needs 1, imply Foil want | |

**User's choice:** Stay card-def level, show Normal badge

---

**Question 3: How does a user pick variant when adding a manual want?**

**User's choice (free-text):** After searching for a card at the card definition level, the user can select which variant of that card they want using chips.

---

**Question 4: How should existing manual wants rows be migrated?**

| Option | Description | Selected |
|--------|-------------|----------|
| Default to Normal on migration | Existing rows get variantType = Normal | ✓ |
| Null = any variant (no badge) | Keep null as "any version", new wants get a variant | |
| You decide | Pick the safest migration path | |

**User's choice:** Default to Normal on migration

---

**Question 5: What schema should tradeManualWants align with?**

**User's choice (free-text):** The schema should match user_trade_offerings table (i.e., use cardPrintingId as the key, not cardDefinitionId).

---

**Question 6: Does the public binder show one tile per printing or one tile per card?**

| Option | Description | Selected |
|--------|-------------|----------|
| One tile per printing (per variant) | Two Darth Vader tiles if user wants Normal + Foil | ✓ |
| One tile per card, most-wanted variant | Collapse multiple variant wants to one tile | |
| You decide | Match Available for Trade behavior | |

**User's choice:** One tile per printing (per variant)

---

**Question 7: Should auto-wants + manual wants both remain in Looking For?**

| Option | Description | Selected |
|--------|-------------|----------|
| Keep both auto + manual in Looking For | Auto-wants (Normal badge) + manual wants (specific variant badge) | ✓ |
| Manual wants only in Looking For | Remove auto-wants from public view | |
| You decide | Best serves trade partners visiting the binder | |

**User's choice:** Keep both auto + manual in Looking For

---

## Card Detail Trade Section

**Question 1: Where should the trade section appear on card detail?**

| Option | Description | Selected |
|--------|-------------|----------|
| Below VariantCollectionSection (image column) | Stacks under collection section in left column | ✓ |
| In the metadata column | Right column with card stats and traits | |
| You decide | Most natural for the existing page layout | |

**User's choice:** Below VariantCollectionSection (image column)

---

**Question 2: What interaction pattern for trade quantity controls?**

| Option | Description | Selected |
|--------|-------------|----------|
| Mirror VariantCollectionSection pattern | Same per-printing rows, +/- controls, quantity 0 = not trading | ✓ |
| Checkbox + quantity input | Checkbox to mark as available, then separate quantity input | |
| You decide | Most consistent with existing VariantCollectionSection UX | |

**User's choice:** Mirror VariantCollectionSection pattern

---

**Question 3: Server-side or client-side data fetch?**

| Option | Description | Selected |
|--------|-------------|----------|
| Server-side with page load (like current collection section) | Fetch trade quantities in SSR alongside printings | ✓ |
| Client-side after load | Separate fetch from Client Component after render | |
| You decide | Match how VariantCollectionSection works | |

**User's choice:** Server-side with page load (like current collection section)

---

## Manage Binder Owned-Card Discovery

**Question 1: What counts as "owned" for the browse filter?**

**User's choice (free-text):** Mimic the catalog filtered to owned cards. Show any card where card definition total > 0. Selecting a card then displays which printings are owned, and the user can select printings for trade.

---

**Question 2: How does printing selection appear when clicking a card?**

| Option | Description | Selected |
|--------|-------------|----------|
| Inline expansion / accordion | Expands in place to show printings | |
| Side panel / sheet | Opens a side drawer with per-printing trade controls | ✓ |
| Replaces the card with printing rows | Two-panel layout | |
| You decide | Best fit for the existing Manage Binder layout | |

**User's choice:** Side panel / sheet

---

**Question 3: Card tile art for the browse view?**

| Option | Description | Selected |
|--------|-------------|----------|
| Highest-owned variant art (Showcase > Hyperspace > Foil > Normal) | Same precedence as catalog Phase 18 logic | ✓ |
| Normal printing art always | Always show base Normal variant art | |
| You decide | Most consistent with rest of app | |

**User's choice:** Highest-owned variant art (Showcase > Hyperspace > Foil > Normal)

---

## Cross-Page Sync Semantics

**Question 1: What does "immediately reflected" mean in practice?**

| Option | Description | Selected |
|--------|-------------|----------|
| Fresh on next navigation (no browser refresh needed) | Manage Binder re-fetches on mount after client-side navigation | ✓ |
| Real-time while both are open | Polls or listens; updates without user action | |
| You decide | Most natural for Next.js App Router | |

**User's choice:** Fresh on next navigation (no browser refresh needed)

---

## Claude's Discretion

- Exact visual styling of the variant chip selector in the manual wants add-flow
- Whether to extract the "owned cards" API into a new endpoint or extend existing `/api/binder` GET
- Pagination or virtualization of owned-card browse grid for users with many cards
- Whether side panel in Manage Binder uses shadcn/ui `Sheet` or custom drawer

## Deferred Ideas

None — discussion stayed within phase scope.

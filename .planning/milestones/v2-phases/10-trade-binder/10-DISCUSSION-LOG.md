# Phase 10: Trade Binder - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-11
**Phase:** 10-Trade Binder
**Areas discussed:** Selection Strategy, Management UI, Public Visibility, Want Section Source, Shareable URL Identifier, Want List Implementation, Trade Offer Schema, Want List Scope

---

## Selection Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit Curated Binder | Binder only shows cards you've explicitly flagged for trade with a specific quantity. | ✅ |
| Public Collection View | Your entire collection is public by default; you can hide specific cards if desired. | |

**User's choice:** Explicit Curated Binder (Default)
**Notes:** Users must explicitly choose which cards to offer.

---

## Management UI

| Option | Description | Selected |
|--------|-------------|----------|
| Inline Management | Add 'Trade' buttons to the existing /collection and catalog pages. | |
| Dedicated Management Page | A dedicated /binder/manage page for adding/removing trade items in one place. | ✅ |

**User's choice:** Dedicated Management Page
**Notes:** Keeps binder management separate from inventory tracking.

---

## Public Visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Trade Offer Only | Show only the 'For Trade' quantity (e.g. '2 Available'). | ✅ |
| Full Context | Show total owned vs for trade (e.g. '4 Owned / 2 for Trade'). | |

**User's choice:** Trade Offer Only
**Notes:** Prevents sharing the full size of the user's private collection.

---

## Want Section Source

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-Sync Want List | Automatically show all cards from the user's main Want List. | ✅ |
| Independent Trade Wants | A separate list specifically for cards the user wants to trade FOR. | |

**User's choice:** Auto-Sync Want list from missing cards in a user's deck.
**Notes:** The user specifically requested that it syncs from missing deck cards but allows manual additions and removals (exclusions).

---

## Shareable URL Identifier

| Option | Description | Selected |
|--------|-------------|----------|
| Custom Username Slug | Users must choose a unique public handle (e.g. /binder/vader123). | ✅ |
| UUID (Internal ID) | Use the user's UUID (e.g. /binder/550e8400-e29b...). | |

**User's choice:** Custom Username Slug
**Notes:** Clean, shareable URLs are preferred.

---

## Want List Implementation

| Option | Description | Selected |
|--------|-------------|----------|
| Snapshot + Edits | A persistent 'trade_wants' table. One click to 'Import from Decks', then manual edits. | |
| Live Sync + Exclusions | Always live-sync with Want List; user can 'Hide' specific cards via an exclusion list. | ✅ |

**User's choice:** Live Sync + Exclusions
**Notes:** Includes support for manual additions on top of the live sync.

---

## Trade Offer Schema

| Option | Description | Selected |
|--------|-------------|----------|
| Extend user_collections | Add 'tradeQuantity' column to existing 'user_collections' table. | ✅ |
| New Separate Table | New 'trade_binder' table (userId, printingId, quantity). | |

**User's choice:** Extend user_collections
**Notes:** Simplifies integration with owned counts.

---

## Want List Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Global Want List | Sync cards missing from ALL decks in the user's library. | ✅ |
| Selected Decks Only | User selects specific decks to 'publish' to the trade binder's want section. | |

**User's choice:** Global Want List (All Decks)
**Notes:** Standard behavior for the want list in this app.

---

## Claude's Discretion

- Exact UI layout of the binder pages.
- Username set/validation flow.
- Internal query logic for "Looking For" section.

## Deferred Ideas

- **WANT-03**: Export/share want list as PDF/Text.
- **DECK-06**: Filter deck builder by owned cards.

# Phase 11: New Home Page - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-12
**Phase:** 11-new-home-page
**Areas discussed:** Hero visual style, High-value card grid, Navigation changes

---

## Hero Visual Style

### Hero copy

| Option | Description | Selected |
|--------|-------------|----------|
| SWU Tracker — "Track your cards. Build your decks." | Direct and functional | |
| Custom — I'll specify | User provides own wording | ✓ |

**User's choice:** Custom — specified exact strings:
- Title: "Star Wars Unlimited Card Database and Deck Builder"
- Subtitle: "Track your collection, build your decks, and begin trading with up to date market prices"

---

### Hero visual treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Star Wars dark — dark background, Oxanium heading font, space/gradient feel | Fits the SW theme | |
| Clean minimal — light background, standard typography | Matches existing app look | |
| You decide | Claude picks the treatment | ✓ |

**User's choice:** Claude's discretion.
**Notes:** Recommended approach is dark/SW-themed given Oxanium font is already loaded.

---

### Hero CTAs

| Option | Description | Selected |
|--------|-------------|----------|
| Import → /collection, Build → /decks, Trade → /binder/manage | Maps to existing routes | ✓ |
| Adjust — different routes or labels | Custom destinations | |

**User's choice:** Import → /collection, Build → /decks, Trade → /binder/manage.

---

## High-value Card Grid

### Data source

| Option | Description | Selected |
|--------|-------------|----------|
| System-wide top 10 by market price | Visible to all including guests | ✓ |
| User's top 10 owned cards by value | Personalised, hidden for guests | |

**User's choice:** System-wide top 10 — visible to all users.

---

### Price currency

| Option | Description | Selected |
|--------|-------------|----------|
| USD | Simple, no currency switching needed | ✓ |
| User's selected currency (EUR/USD via CurrencyProvider) | Respects user preference | |

**User's choice:** USD.

---

### Card click destination

| Option | Description | Selected |
|--------|-------------|----------|
| Card detail page — /cards/[set-code]/[card-number] | Existing route | ✓ |
| Catalog filtered to that card — /cards?search=cardname | Opens catalog with search | |

**User's choice:** Card detail page.

---

## Navigation Changes

### Home link

| Option | Description | Selected |
|--------|-------------|----------|
| Brand logo/name links to / — no 'Home' nav item | Clean, no extra nav item | ✓ |
| Add a 'Home' nav link | Explicit Home entry in nav list | |

**User's choice:** Brand name "SWU Tracker" becomes a link to `/`.

---

### Catalog link

| Option | Description | Selected |
|--------|-------------|----------|
| Keep 'Catalog' label, change href to /cards | Minimal change | ✓ |
| Rename to 'Cards' to match route | Consistent route/label | |

**User's choice:** Keep "Catalog" label, update href to `/cards`.

---

## Claude's Discretion

- Hero visual treatment: dark background with gradient or subtle texture, Oxanium font large for title, Nunito Sans for subtitle, shadcn/ui Button for CTAs.
- Card grid component design and layout rhythm.
- Spacing and padding of home page sections.

## Deferred Ideas

None — discussion stayed within phase scope.

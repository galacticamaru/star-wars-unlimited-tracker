# Phase 26: Mobile Deck Builder UX - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-29
**Phase:** 26-mobile-deck-builder-ux
**Areas discussed:** Stats trigger style, Toolbar mobile layout, Touch target scope, Save buttons on mobile

---

## Stats trigger style

**Q1: How should the mobile stats trigger work?**

| Option | Description | Selected |
|--------|-------------|----------|
| Sticky summary bar | Fixed bar at bottom (md:hidden) always shows badge + counts. Tapping opens Sheet. | ✓ |
| Toolbar button only | SheetTrigger in toolbar, no persistent summary. | |
| Floating action button | FAB bottom-right with count badge. Conflicts with hoveredCard bar. | |

**User's choice:** Sticky summary bar

---

**Q2: What content should the sticky summary bar show?**

| Option | Description | Selected |
|--------|-------------|----------|
| Badge + card counts | Legal/Illegal badge + "32/50 main · 2/10 SB". Minimal, scannable. | ✓ |
| Badge + counts + value | Legal/Illegal + "32/50 main" + estimated value. Tighter on small screens. | |
| Badge + counts + active tab | Legal/Illegal + "32/50 main" + current tab label. | |

**User's choice:** Badge + card counts

---

**Q3: Where should the sticky bar sit — conflict with hoveredCard bar?**

| Option | Description | Selected |
|--------|-------------|----------|
| Replace hoveredCard bar | Stats bar at bottom-0 replaces the existing hoveredCard preview bar. | ✓ |
| Stack above hoveredCard bar | Both coexist (stats at bottom-0, hoveredCard above). Uses more space. | |
| Remove hoveredCard on editor view only | Stats bar at bottom-0; hoveredCard removed from deck editor only. | |

**User's choice:** Replace hoveredCard bar — hoveredCard feature removed from mobile.

---

**Q4: Sheet side and expanded height?**

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom, ~80% screen height | side="bottom", max-h-[80dvh], overflow-y-auto. Sliver of builder visible. | ✓ |
| Bottom, full height | side="bottom", h-full / h-[100dvh]. Full screen coverage. | |
| Right, full height | side="right". Less conventional for mobile. | |

**User's choice:** Bottom, ~80% screen height

---

## Toolbar mobile layout

**Q1: How should the toolbar adapt on mobile?**

| Option | Description | Selected |
|--------|-------------|----------|
| Two-row layout | Row 1: name (full width). Row 2: tabs + icon-only Back + icon-only Export. | ✓ |
| Compact single row | Shorten tab labels, hide/collapse Export. Fit in one row. | |
| Name above, full-width tabs | Same two-row but tabs stretch full-width; Back moves to sticky bar. | |

**User's choice:** Two-row layout

---

**Q2: Export dropdown on mobile?**

| Option | Description | Selected |
|--------|-------------|----------|
| Keep as icon-only | Download icon button (no text label). Saves ~60px. | ✓ |
| Remove from toolbar | Export disappears on mobile entirely. | |
| Move into stats Sheet | Export moves inside bottom Sheet. | |

**User's choice:** Keep as icon-only (Download icon, no text)

---

**Q3: Shorten tab labels on mobile?**

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — shorten | "Deck" / "Cards" / "Wants" below md breakpoint. | ✓ |
| No — keep full labels | "Deck List" / "Add Cards" / "Want List" at all sizes. | |

**User's choice:** Shorten on mobile

---

## Touch target scope

**Q1: Which buttons need the 44px upgrade?**

| Option | Description | Selected |
|--------|-------------|----------|
| All deck builder touch buttons | Deck list +/-/Move AND catalog overlay +/- buttons. | ✓ |
| Deck list editor only | Only +/- and "Move to SB" in Deck List tab. | |
| Mobile-only via breakpoint | Responsive: h-8 on desktop, h-11 on mobile. | |

**User's choice:** All deck builder touch buttons

---

**Q2: All screen sizes or mobile only?**

| Option | Description | Selected |
|--------|-------------|----------|
| All screen sizes | h-11 everywhere. Permanent upgrade. Simpler. | ✓ |
| Mobile only (responsive) | Responsive classes. Desktop stays 32px; mobile gets 44px. | |

**User's choice:** All screen sizes — permanent upgrade

---

## Save buttons on mobile

**Q1: Where should Save Draft / Complete Deck live on mobile?**

| Option | Description | Selected |
|--------|-------------|----------|
| Sheet only | Save buttons remain inside the Sheet. User opens Sheet to save. | ✓ |
| Sticky bar + Sheet | Sticky bar has quick "Save" button; full controls in Sheet. | |
| Toolbar on mobile | Save button in toolbar row 2. Always visible. | |

**User's choice:** Sheet only — consistent with sidebar metaphor; toolbar stays clean.

---

## Claude's Discretion

- Exact Tailwind classes for two-row toolbar responsive layout
- Whether to use `ScrollArea` or `overflow-y-auto` inside SheetContent
- Whether sticky bar uses `button` element or `SheetTrigger` render prop
- Sheet animation (existing SheetContent classes are fine as-is)
- Whether `DeckSidebar`'s `h-full` root class needs adjustment inside bottom Sheet

## Deferred Ideas

None — discussion stayed within phase scope.

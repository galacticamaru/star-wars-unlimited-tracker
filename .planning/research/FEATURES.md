# Feature Landscape — v6 Mobile, Performance & Polish

**Domain:** Mobile-responsive TCG deck builder web app
**Researched:** 2026-05-29
**Scope:** Mobile UX patterns for deck builder only (existing catalog, auth, binder are out of scope)

---

## Existing Architecture That Constrains Choices

Before evaluating mobile patterns, the existing implementation defines hard constraints:

| Component | Current Behaviour | Mobile Problem |
|-----------|------------------|----------------|
| `DeckBuilder` root | `flex h-[calc(100svh-56px)] overflow-hidden` — always-on side-by-side layout | Sidebar takes ~320px (w-80) and does not hide on small screens |
| `DeckSidebar` | Fixed `w-80` column, full height, no responsive modifier | Physically occludes card list rows on viewports < 768px |
| Tab switcher (editor/catalog/want-list) | Inline `<div className="flex bg-slate-100">` button group in toolbar | Toolbar packs deck name input + tabs + Export + Back into one row — collapses badly below ~480px |
| "Add Cards" (catalog view) | Full `CatalogClient` rendered inside builder content area | Works on mobile by itself but the sidebar is still visible behind it |
| Card rows (deck list) | `p-4 flex justify-between` with `- / + / Move to SB` buttons per row | Three buttons at 8px gap — total ~120px wide, tight on 320px screens |
| Mobile bottom bar (partial) | `md:hidden fixed bottom-0` — shows hovered card art/name on tap | Currently only shows card preview, not stats; fires on `onTouchStart` of deck list rows |

The desktop layout is: `[main content flex-1] [DeckSidebar w-80]`. Fixing mobile must not alter the desktop rendering.

---

## Table Stakes

Features users expect from a mobile deck builder. Missing = product feels broken on phone.

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Stats sidebar hidden by default on mobile, accessible via persistent bottom sheet | Standard pattern on every touch-first product (Google Maps, Spotify, native apps); a sidebar that overlaps content is universally considered broken on mobile | Medium | `DeckSidebar`, `DeckBuilder` layout |
| Card rows tappable to increment/decrement without accidentally triggering other actions | TCG players browse and tap cards rapidly; 44px minimum touch targets per Apple HIG / WCAG 2.5.8; current `-` and `+` buttons are `h-8 w-8` (32px) — undersized | Low | Card row markup in `DeckBuilder` |
| Tab bar usable on small screens without horizontal overflow | Three-tab pattern is familiar (matches iOS/Android conventions); toolbar is currently a single flex row that clips | Low–Medium | Toolbar markup in `DeckBuilder` |
| Stats visible without leaving the current view | Card count (X/50) and valid/invalid badge are decision-critical; player should not have to navigate away | Low | Bottom bar or sheet header |

---

## Differentiators

Features that lift the experience beyond "not broken." Not expected by default, but appreciated.

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Snap-point bottom sheet (peek to half to full) | Lets player glance at cost curve without fully dismissing card list — Google Maps style. More ergonomic than a modal | Medium | Vaul (already in shadcn stack via Drawer) |
| Inline quantity badge on card row tapping on mobile | Single-tap increments; the quantity badge updates in place — no +/- buttons needed at all on mobile card rows | Medium | `handleDeckUpdate`, card row render |
| Tab bar as bottom navigation on mobile | Thumb-zone access for Deck List / Add Cards / Want List — mirrors native app convention; top tabs require thumb stretch | Medium | Toolbar restructure, must not break desktop |
| Deck name editable in a separate tap/modal on mobile | Avoids toolbar crowding; on desktop the inline input is fine, on mobile it consumes most of the toolbar width | Low | Toolbar markup |

---

## Anti-Features

Features to explicitly NOT build for this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Full drag-and-drop card reordering on mobile | Drag on touch is extremely fragile (conflicts with scroll), requires pointer-events overrides, and leading TCG builders have abandoned it on mobile in favour of +/- tap flows | Keep +/- controls, widen touch targets |
| Stacked/nested bottom sheets | NNGroup guideline: stacked sheets confuse back-navigation hierarchy; users lose orientation after two layers | Single sheet for stats only |
| Swipe-to-dismiss for the stats sheet | Stats are persistent context (card count, valid/invalid badge is always needed); dismissing them entirely leaves player blind | modal={false} + snap points with minimum visible peek state |
| Replace three-tab layout with a single-column accordion | Desktop users depend on the current three-tab switcher; changing the navigation model breaks existing muscle memory | Responsive adaptation only: bottom tabs on mobile, existing top tabs on desktop |
| Custom gesture library (Framer Motion, react-spring drag) | Vaul (the underlying library behind shadcn Drawer) already handles all drag/snap/gesture logic; adding a second gesture library creates conflicts | Use Vaul via shadcn Drawer |

---

## Feature Dependencies

```
MOBILE-01 (sidebar not overlapping) → requires layout restructure in DeckBuilder
  └── Stats bottom sheet → depends on DeckSidebar being extractable as standalone content
      └── Vaul snap points (modal={false}) → already available via shadcn Drawer

MOBILE-02 (desktop three-tab unbroken) → requires responsive tab bar
  └── Tab bar restructure → toolbar must be split: name edit / tabs / actions
      └── Mobile: tabs move to bottom bar OR become scrollable horizontal tabs

Card tap-to-add (touch UX) → depends on touch target size increase in card rows
  └── Min 44x44px per Apple HIG, 48dp per Material; current h-8 w-8 = 32px — needs fix
```

---

## Detailed Pattern Analysis

### (a) Handling the Stats Sidebar on Small Screens

Three viable patterns exist. Only one is recommended.

**Pattern 1 — Persistent Bottom Sheet with Snap Points (RECOMMENDED)**

The sidebar content slides up from the bottom in a non-modal Vaul drawer (`modal={false}`). Two snap points:
- Peek state (~80px): shows card count badge (X/50) and Legal/Illegal badge only. Always visible. Sits above the browser safe area.
- Full state: shows complete sidebar content (cost curve, type breakdown, aspect panel, save buttons).

Why this pattern:
- Non-modal means the card list remains interactive when sheet is at peek height.
- Snap points are native to Vaul (already powering shadcn Drawer); no new library needed.
- Google Maps precedent makes this interaction immediately learnable.
- "Save as Draft" and "Complete Deck" buttons can live in the sheet footer, always reachable at full expansion.
- Avoids the "stacked sheets" anti-pattern because only one sheet exists.

Implementation note: `modal={false}` + `snapPoints={[80, 1]}` (80px peek, full height). The 80px peek strip must not be covered by the browser bottom chrome — use `padding-bottom: env(safe-area-inset-bottom)` on the peek bar.

**Pattern 2 — Collapsed Panel / Toggle Button (NOT RECOMMENDED)**

A button in the toolbar opens/closes the sidebar as an overlay. Simple to implement but:
- Stats are hidden by default — player must take an action to see card count.
- Overlay blocks card list (same UX problem, just opt-in rather than always-on).
- No standard interaction model; users must discover it.

**Pattern 3 — Tab the Stats into the Existing Tab Bar (NOT RECOMMENDED)**

Add a fourth "Stats" tab. Avoids sheet complexity but:
- Requires navigating away from the deck list to check validity — breaks flow.
- Four tabs overflow the toolbar on 320px screens.
- Stats are passive context, not a navigation destination.

---

### (b) Card Tap-to-Add on Touch Screens

**Current problem:** The card rows in the deck list have `onTouchStart={() => setHoveredCard(item.card)}` which previews the card. The `+` and `-` buttons are `h-8 w-8` (32px square) — below the 44px Apple HIG minimum, making them difficult to tap accurately.

**Recommended pattern:**

For the "Add Cards" (catalog) tab: single tap increments quantity by 1. This is the universal TCG deck builder convention confirmed by reference to Yugipedia and other TCG builders — single tap to add, second tap to adjust. The existing `handleDeckUpdate` already handles this; the catalog card's `onDeckUpdate` callback fires on the existing `+` button click. On mobile the button must be a full-width tap target, not a small icon.

For the "Deck List" tab card rows: widen touch targets for `-` and `+` to minimum 44x44px. On very narrow screens (< 360px), consider replacing the three-button cluster (`-`, `+`, `Move to SB`) with a tap-to-open mini-sheet per row, but this is a differentiator, not table stakes.

Key principle: do not use long-press for primary actions. Long-press is appropriate for card detail preview (already used in `onTouchStart` for preview), but not for incrementing quantity. The action must complete on tap-down or tap-up, not after a delay.

Touch target rule: all interactive buttons must have at minimum `min-h-[44px] min-w-[44px]` (or equivalent padding) for the hit area, even if the visual size is smaller.

---

### (c) Tab Navigation on Mobile for a Multi-Tab Builder

**Current problem:** The three tabs (Deck List, Add Cards, Want List) are rendered inside the toolbar row alongside the deck name input, Export button, and Back button. On screens below ~480px this row either clips or wraps awkwardly.

**Recommended pattern — Responsive Split:**

Desktop (md+): keep the current inline tab group in the toolbar. No change.

Mobile (< md): move the three tabs to a fixed bottom tab bar (above the stats sheet peek strip). This mirrors native iOS/Android bottom tab navigation, keeps tabs in the thumb zone, and frees the toolbar to show only the deck name and an action menu (kebab or three dots containing Export/Back).

Tab order on mobile bottom bar: "Deck List" | "Add Cards" | "Want List" — left to right, matching left-to-right reading and the most common task flow (view deck, add card, check wants).

The tab bar must sit above the stats sheet peek strip. Z-index stacking: stats sheet (peek) at z-40, bottom tab bar at z-50. The sheet should not obscure the tab bar.

Why bottom tabs over top tabs on mobile:
- Thumb reach: bottom of screen is reachable with one hand; top requires thumb stretch or hand repositioning.
- Cognitive load: three equally-weighted navigation options map perfectly to the "3-5 destinations" bottom tab bar convention.
- Scroll conflict: top tabs at the same level as the toolbar create ambiguity between scrolling content and switching tabs.

---

## MVP Recommendation for v6

Prioritize in this order:

1. **Stats sheet (peek + full, non-modal)** — unblocks card list, fixes the core MOBILE-01 problem. Without this, the builder is unusable on mobile regardless of other fixes.
2. **Touch target widening on card rows** — pure CSS/Tailwind change, low risk, fixes accidental mis-taps immediately.
3. **Toolbar responsive split (tab bar to bottom on mobile)** — resolves toolbar overflow, delivers the tab UX improvement described in MOBILE-02.

Defer to later phases:
- Per-row tap-to-open mini-sheet: adds complexity, only needed if widened +/- buttons still feel cramped.
- Deck name editing as modal on mobile: acceptable once toolbar is de-cluttered.

---

## Sources

- [Bottom Sheets: Definition and UX Guidelines — NN/Group](https://www.nngroup.com/articles/bottom-sheet/)
- [How to design bottom sheets for optimized user experience — LogRocket](https://blog.logrocket.com/ux-design/bottom-sheets-optimized-ux/)
- [Bottom Sheet UI Design — Mobbin](https://mobbin.com/glossary/bottom-sheet)
- [Vaul Snap Points documentation](https://vaul.emilkowal.ski/snap-points)
- [shadcn Drawer component](https://ui.shadcn.com/docs/components/radix/drawer)
- [Tabs UX Best Practices — Eleken](https://www.eleken.co/blog-posts/tabs-ux)
- [Bottom Tab Bar Navigation Design Best Practices — UX Planet](https://uxplanet.org/bottom-tab-bar-navigation-design-best-practices-48d46a3b0c36)
- [Mobile Navigation Patterns — UXPin](https://www.uxpin.com/studio/blog/mobile-navigation-patterns-pros-and-cons/)
- [Accessible Touch Target Sizes — LogRocket](https://blog.logrocket.com/ux-design/all-accessible-touch-target-sizes/)
- [PWA Sticky Elements — Smashing Magazine](https://www.smashingmagazine.com/2020/01/mobile-pwa-sticky-bars-elements/)
- [Deckbuilder UI Design: Best Practices for Card Games](https://www.gunslingersrevenge.com/posts/development/deckbuilder-ui-design-best-practices.html)

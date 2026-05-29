// @vitest-environment jsdom
/**
 * Wave 0 stub file — Phase 26 Mobile Deck Builder UX
 *
 * Covers: MOBILE-01, MOBILE-02, MOBILE-03, MOBILE-04
 *
 * All tests in this file are `it.todo` pending stubs. They are intentionally
 * non-passing until Wave 1 implementation plans (02/03/04) land.
 *
 * Wave 1 plans will convert each `it.todo(...)` to a full `it(...)` body
 * with render(<DeckBuilder {...} />) and DOM class assertions.
 *
 * Verification map source:
 *   .planning/phases/26-mobile-deck-builder-ux/26-VALIDATION.md
 */

import { describe, it } from 'vitest';

describe('DeckBuilder mobile layout', () => {
  // MOBILE-01 — sticky summary bar (D-01)
  it.todo('MOBILE-01: renders sticky summary bar with class "md:hidden fixed bottom-0 left-0 right-0 h-14 z-50" on mobile');

  // MOBILE-01 — Sheet not rendered initially (D-02)
  it.todo('MOBILE-01: Sheet is not visible initially (SheetContent absent from DOM until trigger tapped)');

  // MOBILE-02 — deck list quantity +/- buttons touch target (D-09, D-10)
  it.todo('MOBILE-02: deck list quantity +/- buttons render with class "h-11 w-11" (NOT h-8 w-8)');

  // MOBILE-03 — toolbar responsive two-row layout (D-06)
  it.todo('MOBILE-03: toolbar root div has class "flex flex-col md:flex-row" (or equivalent two-row mobile layout)');

  // MOBILE-04 — inline DeckSidebar hidden on mobile (D-05)
  it.todo('MOBILE-04: inline DeckSidebar wrapper has class "hidden md:flex" so sidebar is desktop-only inline');
});

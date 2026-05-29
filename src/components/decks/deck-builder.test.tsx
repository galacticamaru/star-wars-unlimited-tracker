// @vitest-environment jsdom
/**
 * Wave 1 test file — Phase 26 Mobile Deck Builder UX
 *
 * Covers: MOBILE-01, MOBILE-02, MOBILE-03, MOBILE-04
 *
 * MOBILE-01 and MOBILE-04 tests are converted to full it() bodies in this plan (26-02).
 * MOBILE-02 and MOBILE-03 stubs remain as it.todo for Plans 03 and 04.
 *
 * Verification map source:
 *   .planning/phases/26-mobile-deck-builder-ux/26-VALIDATION.md
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeckBuilder } from './deck-builder';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

// Mock currency context used by DeckSidebar and WantListTab
vi.mock('@/components/currency-context', () => ({
  useCurrency: () => ({ currency: 'USD' }),
}));

// Mock nuqs used by CatalogClient (rendered in catalog view)
vi.mock('nuqs', () => ({
  useQueryState: () => [null, vi.fn()],
  parseAsString: { withDefault: (d: string) => d },
  parseAsArrayOf: () => ({ withDefault: (d: unknown) => d }),
  parseAsBoolean: { withDefault: (d: boolean) => d },
}));

// Mock CatalogClient to avoid deep dependency chain
vi.mock('@/components/catalog/catalog-client', () => ({
  CatalogClient: () => <div data-testid="catalog-client" />,
}));

// Mock WantListTab to avoid fetch calls
vi.mock('./want-list-tab', () => ({
  WantListTab: () => <div data-testid="want-list-tab" />,
}));

// Minimal fixture matching DeckBuilderProps
const minimalDeckProps = {
  initialDeck: {
    id: 1,
    name: 'Test Deck',
    leaderCardDefinitionId: null,
    baseCardDefinitionId: null,
    isDraft: true,
    cards: [],
  },
  allCards: [],
  filterOptions: { sets: [], types: [] },
};

describe('DeckBuilder mobile layout', () => {
  // MOBILE-01 — sticky summary bar (D-01)
  it('MOBILE-01: renders sticky summary bar with class "md:hidden fixed bottom-0 left-0 right-0 h-14 z-50" on mobile', () => {
    render(<DeckBuilder {...minimalDeckProps} />);
    const triggerButton = screen.getByLabelText('Open deck stats');
    expect(triggerButton).toBeDefined();
    const cls = triggerButton.className;
    expect(cls).toContain('md:hidden');
    expect(cls).toContain('fixed');
    expect(cls).toContain('bottom-0');
    expect(cls).toContain('h-14');
    expect(cls).toContain('z-50');
  });

  // MOBILE-01 — Sheet not rendered initially (D-02)
  it('MOBILE-01: Sheet is not visible initially (SheetContent absent from DOM until trigger tapped)', () => {
    render(<DeckBuilder {...minimalDeckProps} />);
    // The Sheet portal renders SheetContent only when open.
    // Cost Curve heading lives inside DeckSidebar which is only inside SheetContent on mobile.
    // The inline DeckSidebar is wrapped in hidden md:flex — no layout shift in jsdom.
    // We verify no second instance of Cost Curve text is immediately rendered (Sheet is closed).
    const costCurveEls = screen.queryAllByText('Cost Curve');
    // Either 0 (Sheet closed, inline hidden) or 1 (inline sidebar visible due to jsdom not applying Tailwind).
    // In no case should the Sheet have auto-opened, which would produce 2+ instances.
    expect(costCurveEls.length).toBeLessThan(2);
  });

  // MOBILE-02 — deck list quantity +/- buttons touch target (D-09, D-10)
  it('MOBILE-02: deck list quantity +/- buttons render with class "h-11 w-11" (NOT h-8 w-8)', () => {
    const deckWithCard = {
      ...minimalDeckProps,
      initialDeck: {
        ...minimalDeckProps.initialDeck,
        cards: [{ cardDefinitionId: 100, quantity: 2, isSideboard: false }],
      },
      allCards: [{
        id: 100,
        swudbId: 'test-100',
        name: 'Test Card',
        subtitle: null,
        type: 'Unit',
        aspects: [],
        arenas: [],
        traits: [],
        keywords: [],
        cost: 1,
        power: null,
        hp: null,
        setCode: 'SOR',
        collectorNumber: 'SOR-100',
        frontArtUrl: null,
        backArtUrl: null,
        rarity: 'Common',
        frontText: null,
        backText: null,
        epicAction: null,
        doubleSided: false,
        unique: false,
        priceEur: null,
        priceUsd: null,
      }],
    };
    const { container } = render(<DeckBuilder {...deckWithCard} />);
    const h11Buttons = container.querySelectorAll('button.h-11.w-11');
    expect(h11Buttons.length).toBeGreaterThanOrEqual(2);
  });

  // MOBILE-03 — toolbar responsive two-row layout (D-06)
  it('MOBILE-03: toolbar root div has class "flex flex-col md:flex-row" (or equivalent two-row mobile layout)', () => {
    const { container } = render(<DeckBuilder {...minimalDeckProps} />);
    const toolbar = container.querySelector('.border-b.bg-white');
    expect(toolbar?.className).toContain('flex-col');
    expect(toolbar?.className).toContain('md:flex-row');
  });

  // MOBILE-04 — inline DeckSidebar hidden on mobile (D-05)
  it('MOBILE-04: inline DeckSidebar wrapper has class "hidden md:flex" so sidebar is desktop-only inline', () => {
    const { container } = render(<DeckBuilder {...minimalDeckProps} />);
    // Find the hidden md:flex wrapper that contains the DeckSidebar (identified by "Test Deck" text).
    // There may be multiple hidden md:flex elements after Plan 04 adds the desktop tab group —
    // use querySelectorAll and find the one with DeckSidebar content.
    const wrappers = Array.from(container.querySelectorAll('div.hidden.md\\:flex'));
    const sidebarWrapper = wrappers.find(el => el.textContent?.includes('Test Deck'));
    expect(sidebarWrapper).not.toBeUndefined();
  });
});

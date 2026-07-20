// @vitest-environment jsdom
// Covers BINDER-17: the trade-note callout on the public binder page.
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { CardForFilter } from '@/lib/filter-cards';

// Mock nuqs — the callout doesn't depend on query state, but the component
// calls useQueryState at the top level and needs a working stand-in (mirrors
// the pattern in src/components/decks/deck-builder.test.tsx).
vi.mock('nuqs', () => {
  const chain = { withOptions: () => chain };
  return {
    useQueryState: () => ['', vi.fn()],
    parseAsString: { withDefault: () => chain },
    parseAsArrayOf: () => ({ withDefault: () => chain }),
  };
});

// Stub the child catalog components — this test only asserts the callout,
// not filtering/grid rendering behavior.
vi.mock('@/components/catalog/top-bar', () => ({
  TopBar: () => <div data-testid="top-bar" />,
}));
vi.mock('@/components/catalog/sidebar-filters', () => ({
  SidebarFilters: () => <div data-testid="sidebar-filters" />,
}));
vi.mock('@/components/catalog/mobile-filter-sheet', () => ({
  MobileFilterSheet: () => <div data-testid="mobile-filter-sheet" />,
}));
vi.mock('@/components/catalog/card-grid', () => ({
  CardGrid: () => <div data-testid="card-grid" />,
}));
vi.mock('@/components/catalog/empty-state', () => ({
  EmptyState: () => <div data-testid="empty-state" />,
}));

import { PublicBinderClient } from './public-binder-client';

const filterOptions = { sets: [], types: [] };
const offerings: CardForFilter[] = [];
const lookingFor: CardForFilter[] = [];

describe('PublicBinderClient trade-note callout (BINDER-17)', () => {
  it('renders the note text inside a callout when tradeNote is set', () => {
    render(
      <PublicBinderClient
        username="trader"
        offerings={offerings}
        lookingFor={lookingFor}
        filterOptions={filterOptions}
        tradeNote="EU only, will ship"
      />
    );

    expect(screen.getByText('EU only, will ship')).not.toBeNull();
  });

  it('renders no callout element when tradeNote is null', () => {
    const { container } = render(
      <PublicBinderClient
        username="trader"
        offerings={offerings}
        lookingFor={lookingFor}
        filterOptions={filterOptions}
        tradeNote={null}
      />
    );

    // No stray text node and no dedicated callout wrapper.
    expect(container.querySelector('[data-testid="trade-note-callout"]')).toBeNull();
  });

  it('renders no callout element when tradeNote is an empty string', () => {
    const { container } = render(
      <PublicBinderClient
        username="trader"
        offerings={offerings}
        lookingFor={lookingFor}
        filterOptions={filterOptions}
        tradeNote=""
      />
    );

    expect(container.querySelector('[data-testid="trade-note-callout"]')).toBeNull();
  });

  it('renders the note as literal text, not parsed HTML (XSS-safe)', () => {
    const markupLikeNote = '<strong>bold</strong> & "quoted"';
    render(
      <PublicBinderClient
        username="trader"
        offerings={offerings}
        lookingFor={lookingFor}
        filterOptions={filterOptions}
        tradeNote={markupLikeNote}
      />
    );

    // Text is present verbatim (React auto-escaped it into a text node).
    expect(screen.getByText(markupLikeNote)).not.toBeNull();
    // No actual <strong> element was parsed out of the string.
    expect(screen.queryByText('bold')).toBeNull();
  });
});

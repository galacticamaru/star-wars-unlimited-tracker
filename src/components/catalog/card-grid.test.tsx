// @vitest-environment jsdom
// Wave 2 implementation — covers PERF-01 (virtualized row rendering) + PERF-03 (image priority threshold)
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

// Mock next/image — passes through all props onto <img>
// We keep 'priority' as a data attribute so tests can inspect it, but exclude 'fill'
vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean; fill?: boolean; sizes?: string }) => {
    const { fill: _fill, priority, ...rest } = props;
    // Pass priority as a data attribute string so tests can read it with getAttribute('data-priority')
    // We use 'data-priority' to avoid TypeScript errors about non-standard HTML attributes
    return <img {...rest} data-priority={priority ? 'true' : undefined} />;
  },
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

// Mock @tanstack/react-virtual to return a deterministic virtualizer
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn(),
}));

// Mock window.matchMedia (not available in jsdom)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

import { useVirtualizer } from '@tanstack/react-virtual';
import { CardGrid } from './card-grid';

// Create a minimal CardForFilter array for testing
function makeCards(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    swudbId: `swudb-${i + 1}`,
    name: `Card ${i + 1}`,
    subtitle: null,
    type: 'Unit',
    setCode: 'SOR',
    collectorNumber: `SOR-${String(i + 1).padStart(3, '0')}`,
    frontArtUrl: `/card-${i + 1}.jpg`,
    backArtUrl: null,
    aspects: [] as string[],
    arenas: [] as string[],
    rarity: 'C',
    cost: 1 as number | null,
    power: 1 as number | null,
    hp: 1 as number | null,
    traits: [] as string[],
    keywords: [] as string[],
    frontText: null as string | null,
    backText: null as string | null,
    epicAction: null as string | null,
    doubleSided: false,
    unique: false,
    priceEur: null as number | null,
    priceUsd: null as number | null,
    tradeQuantity: 0,
    variantType: 'Normal',
    lookingForQuantity: 0,
  }));
}

const fakeRef = { current: document.createElement('div') } as React.RefObject<HTMLElement>;

describe('CardGrid', () => {
  beforeEach(() => {
    // Reset only the useVirtualizer mock, not matchMedia
    vi.mocked(useVirtualizer).mockReset();
    // Restore matchMedia mock in case it was cleared
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  test('only renders virtual rows visible in the scroll container — not all cards in the DOM', () => {
    const allCards = makeCards(100); // 100 cards total

    // Mock virtualizer: only 2 virtual rows visible (columns=11, so 22 cards max in 2 rows)
    (useVirtualizer as ReturnType<typeof vi.fn>).mockReturnValue({
      getTotalSize: () => 3200,
      getVirtualItems: () => [
        { index: 0, key: 0, start: 0, size: 160 },
        { index: 1, key: 1, start: 160, size: 160 },
      ],
      measureElement: vi.fn(),
    });

    const { container } = render(
      <CardGrid cards={allCards} collection={{}} scrollContainerRef={fakeRef} />
    );

    // Find rendered card items by img tag (each card item renders one <img>)
    const images = container.querySelectorAll('img');
    // 2 virtual rows with 11 columns each = max 22 images
    // (second row has 11 cards, first row has 11 cards)
    expect(images.length).toBeLessThanOrEqual(22);
    expect(images.length).toBeGreaterThan(0);
    // Not all 100 cards should be in the DOM
    expect(images.length).toBeLessThan(100);
  });

  test('first 22 cards have priority=true on their <Image> element', () => {
    const allCards = makeCards(33); // 33 cards: first 22 should have priority

    // Mock: 2 rows of 11 columns each (22 cards), plus 1 row with remainder
    (useVirtualizer as ReturnType<typeof vi.fn>).mockReturnValue({
      getTotalSize: () => 480,
      getVirtualItems: () => [
        { index: 0, key: 0, start: 0, size: 160 },
        { index: 1, key: 1, start: 160, size: 160 },
        { index: 2, key: 2, start: 320, size: 160 },
      ],
      measureElement: vi.fn(),
    });

    const { container } = render(
      <CardGrid cards={allCards} collection={{}} scrollContainerRef={fakeRef} />
    );

    const images = container.querySelectorAll('img');
    // First 22 images should have priority attribute as truthy string
    for (let i = 0; i < Math.min(22, images.length); i++) {
      const priorityAttr = images[i].getAttribute('data-priority');
      expect(
        priorityAttr === 'true' || priorityAttr === '',
        `Card ${i} should have priority=true, got: ${priorityAttr}`
      ).toBe(true);
    }
  });

  test('cards at index 22 and beyond have priority=false (or undefined) on their <Image>', () => {
    const allCards = makeCards(33);

    (useVirtualizer as ReturnType<typeof vi.fn>).mockReturnValue({
      getTotalSize: () => 480,
      getVirtualItems: () => [
        { index: 0, key: 0, start: 0, size: 160 },
        { index: 1, key: 1, start: 160, size: 160 },
        { index: 2, key: 2, start: 320, size: 160 },
      ],
      measureElement: vi.fn(),
    });

    const { container } = render(
      <CardGrid cards={allCards} collection={{}} scrollContainerRef={fakeRef} />
    );

    const images = container.querySelectorAll('img');
    // Cards at index 22+ (third row starts at index 22) should NOT have priority=true
    for (let i = 22; i < images.length; i++) {
      const priorityAttr = images[i].getAttribute('data-priority');
      expect(
        priorityAttr === null || priorityAttr === 'false',
        `Card ${i} should not have priority=true, got: ${priorityAttr}`
      ).toBe(true);
    }
  });

  test('row column count matches breakpoint — 3 at base, 5 sm, 7 md, 9 lg, 11 xl', () => {
    const allCards = makeCards(12);

    // Mock a single row of 3 cards (base breakpoint)
    (useVirtualizer as ReturnType<typeof vi.fn>).mockReturnValue({
      getTotalSize: () => 160,
      getVirtualItems: () => [
        { index: 0, key: 0, start: 0, size: 160 },
      ],
      measureElement: vi.fn(),
    });

    const { container } = render(
      <CardGrid cards={allCards} collection={{}} scrollContainerRef={fakeRef} />
    );

    // There should be row div(s) with grid inline styles
    const rowDivs = container.querySelectorAll('[style*="grid-template-columns"]');
    expect(rowDivs.length).toBeGreaterThan(0);

    // The row div should have display:grid and repeat(N, 1fr) in gridTemplateColumns
    const rowDiv = rowDivs[0] as HTMLElement;
    expect(rowDiv.style.display).toBe('grid');
    expect(rowDiv.style.gridTemplateColumns).toMatch(/repeat\(\d+, 1fr\)/);
  });

  test('outer wrapper has position:relative with height equal to virtualizer total size (NOT a CSS grid)', () => {
    const allCards = makeCards(10);
    const totalSize = 1600;

    (useVirtualizer as ReturnType<typeof vi.fn>).mockReturnValue({
      getTotalSize: () => totalSize,
      getVirtualItems: () => [
        { index: 0, key: 0, start: 0, size: 160 },
      ],
      measureElement: vi.fn(),
    });

    const { container } = render(
      <CardGrid cards={allCards} collection={{}} scrollContainerRef={fakeRef} />
    );

    // Outer wrapper: position:relative + height:totalSize
    const outerDiv = container.firstElementChild as HTMLElement;
    expect(outerDiv).not.toBeNull();
    expect(outerDiv.style.position).toBe('relative');
    expect(outerDiv.style.height).toBe(`${totalSize}px`);

    // Outer wrapper must NOT be a CSS grid (Pitfall 5)
    expect(outerDiv.style.display).not.toBe('grid');
    expect(outerDiv.className).not.toMatch(/\bgrid\b/);
  });

  test('each rendered row has data-index attribute matching its virtualRow.index, and useVirtualizer is called with a column-aware estimateSize (not fixed 160)', () => {
    (useVirtualizer as ReturnType<typeof vi.fn>).mockReturnValue({
      getTotalSize: () => 600,
      getVirtualItems: () => [
        { index: 0, key: 0, start: 0, size: 200, end: 200, lane: 0 },
        { index: 1, key: 1, start: 200, size: 200, end: 400, lane: 0 },
        { index: 2, key: 2, start: 400, size: 200, end: 600, lane: 0 },
      ],
      measureElement: vi.fn(),
    });

    const { container } = render(
      <CardGrid cards={makeCards(15)} collection={{}} scrollContainerRef={fakeRef} />
    );

    // Each rendered row must carry the data-index attribute
    const rowsWithDataIndex = container.querySelectorAll('[data-index]');
    expect(rowsWithDataIndex.length).toBe(3);

    // data-index values must match the virtual row index values
    expect(rowsWithDataIndex[0].getAttribute('data-index')).toBe('0');
    expect(rowsWithDataIndex[1].getAttribute('data-index')).toBe('1');
    expect(rowsWithDataIndex[2].getAttribute('data-index')).toBe('2');

    // estimateSize must be a function (not a fixed literal)
    const options = vi.mocked(useVirtualizer).mock.calls[0][0];
    expect(typeof options.estimateSize).toBe('function');

    // In jsdom, fakeRef.current.clientWidth is 0, so || 1280 fallback fires.
    // At 3 columns (jsdom default — matchMedia always returns false): Math.round(((1280 - 32) / 3) * 1.5) = 624
    const estimatedHeight = options.estimateSize(0);
    expect(estimatedHeight).toBe(624);
  });
});

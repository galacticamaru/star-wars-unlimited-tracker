'use client'

import { useEffect, useState, type RefObject } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CardItem } from './card-item';
import type { CardForFilter } from '@/lib/filter-cards';
import type { CollectionMap } from '@/app/api/collection/collection-shape';
import { selectBestVariantArtUrl, type PrintingArtMap } from '@/lib/catalog/select-best-variant';

// Breakpoint-aware column count hook (D-04):
// Returns 3 at base, 5 ≥640px, 7 ≥768px, 9 ≥1024px, 11 ≥1280px
// Matches the previous flat CSS grid: grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-11
function useColumnCount(): number {
  const [columns, setColumns] = useState(3); // SSR-safe initial value

  useEffect(() => {
    const xlQuery = window.matchMedia('(min-width: 1280px)');
    const lgQuery = window.matchMedia('(min-width: 1024px)');
    const mdQuery = window.matchMedia('(min-width: 768px)');
    const smQuery = window.matchMedia('(min-width: 640px)');

    function computeColumns(): number {
      if (window.matchMedia('(min-width: 1280px)').matches) return 11;
      if (window.matchMedia('(min-width: 1024px)').matches) return 9;
      if (window.matchMedia('(min-width: 768px)').matches) return 7;
      if (window.matchMedia('(min-width: 640px)').matches) return 5;
      return 3;
    }

    // Set the correct value immediately (avoids flash on client hydration)
    setColumns(computeColumns());

    const handler = () => setColumns(computeColumns());
    xlQuery.addEventListener('change', handler);
    lgQuery.addEventListener('change', handler);
    mdQuery.addEventListener('change', handler);
    smQuery.addEventListener('change', handler);

    return () => {
      xlQuery.removeEventListener('change', handler);
      lgQuery.removeEventListener('change', handler);
      mdQuery.removeEventListener('change', handler);
      smQuery.removeEventListener('change', handler);
    };
  }, []);

  return columns;
}

interface CardGridProps {
  scrollContainerRef: RefObject<HTMLElement | null>;
  cards: CardForFilter[];
  collection: CollectionMap;
  printingArtMap?: PrintingArtMap;
  onUpdateCount?: (id: number, count: number) => void;
  mode?: 'catalog' | 'selector' | 'want-list' | 'binder' | 'want';
  deckCounts?: Record<number, number>;
  onDeckUpdate?: (cardDefinitionId: number, count: number) => void;
}

export function CardGrid({
  cards,
  collection,
  printingArtMap,
  onUpdateCount,
  mode = 'catalog',
  deckCounts = {},
  onDeckUpdate,
  scrollContainerRef,
}: CardGridProps) {
  const columns = useColumnCount();
  const rowCount = Math.ceil(cards.length / columns);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => {
      const containerWidth = scrollContainerRef.current?.clientWidth || 1280;
      const safeColumns = columns > 0 ? columns : 3;
      return Math.max(100, Math.round(((containerWidth - 32) / safeColumns) * 1.5));
    },
    overscan: 3,
  });

  return (
    <div
      className="px-4 py-4"
      style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}
    >
      {rowVirtualizer.getVirtualItems().map(virtualRow => {
        const startIndex = virtualRow.index * columns;
        const rowCards = cards.slice(startIndex, startIndex + columns);

        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={rowVirtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              transform: `translateY(${virtualRow.start}px)`,
              width: '100%',
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gap: '0.5rem',
            }}
          >
            {rowCards.map((card, colIndex) => {
              // Compute best variant art URL for this card (D-02, D-04).
              // If the user owns the card (any variant), always show their highest-precedence
              // owned variant art regardless of which variant filter is active.
              // If the user owns nothing, cardVariants is undefined → bestVariantArtUrl is null
              // → falls back to card.frontArtUrl, which is the art for the displayed variant row.
              const cardVariants = collection[card.id]?.variants;
              const bestVariantArtUrl =
                cardVariants && printingArtMap
                  ? selectBestVariantArtUrl(cardVariants, printingArtMap)
                  : null;

              return (
                <CardItem
                  key={`${card.collectorNumber}-${mode}`}
                  id={card.id}
                  name={card.name}
                  type={card.type}
                  setCode={card.setCode}
                  collectorNumber={card.collectorNumber}
                  frontArtUrl={card.frontArtUrl}
                  backArtUrl={card.backArtUrl}
                  bestVariantArtUrl={bestVariantArtUrl}
                  ownedCount={collection[card.id]?.total ?? 0}
                  onUpdateCount={onUpdateCount}
                  mode={mode}
                  deckCount={deckCounts[card.id] || 0}
                  onDeckUpdate={onDeckUpdate}
                  tradeQuantity={card.tradeQuantity}
                  variantType={card.variantType}
                  lookingForQuantity={card.lookingForQuantity}
                  priority={startIndex + colIndex < 22}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

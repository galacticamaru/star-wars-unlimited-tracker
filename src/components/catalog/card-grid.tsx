import { CardItem } from './card-item';
import type { CardForFilter } from '@/lib/filter-cards';
import type { CollectionMap } from '@/app/api/collection/collection-shape';
import { selectBestVariantArtUrl, type PrintingArtMap } from '@/lib/catalog/select-best-variant';

interface CardGridProps {
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
  onDeckUpdate
}: CardGridProps) {
  return (
    <div
      className={[
        'grid gap-2 px-4 py-4',
        // UI-SPEC.md §Card Grid: 3/5/7/9/11 cols at respective breakpoints
        'grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-11',
      ].join(' ')}
    >
      {cards.map(card => {
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
          />
        );
      })}
    </div>
  );
}

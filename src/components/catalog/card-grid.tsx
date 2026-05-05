import { CardItem } from './card-item';
import type { CardForFilter } from '@/lib/filter-cards';

interface CardGridProps {
  cards: CardForFilter[];
  collection: Record<number, number>;
  onUpdateCount: (id: number, count: number) => void;
}

export function CardGrid({ cards, collection, onUpdateCount }: CardGridProps) {
  return (
    <div
      className={[
        'grid gap-2 px-4 py-4',
        // UI-SPEC.md §Card Grid: 3/5/7/9/11 cols at respective breakpoints
        'grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-11',
      ].join(' ')}
    >
      {cards.map(card => (
        <CardItem
          key={card.id}
          id={card.id}
          name={card.name}
          type={card.type}
          setCode={card.setCode}
          collectorNumber={card.collectorNumber}
          frontArtUrl={card.frontArtUrl}
          backArtUrl={card.backArtUrl}
          ownedCount={collection[card.id] || 0}
          onUpdateCount={onUpdateCount}
        />
      ))}
    </div>
  );
}

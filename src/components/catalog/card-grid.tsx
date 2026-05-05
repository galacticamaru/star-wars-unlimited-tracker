import { CardItem } from './card-item';
import type { CardForFilter } from '@/lib/filter-cards';

export function CardGrid({ cards }: { cards: CardForFilter[] }) {
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
          name={card.name}
          type={card.type}
          setCode={card.setCode}
          collectorNumber={card.collectorNumber}
          frontArtUrl={card.frontArtUrl}
          backArtUrl={card.backArtUrl}
        />
      ))}
    </div>
  );
}

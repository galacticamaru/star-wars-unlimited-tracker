'use client'

import { useEffect, useState, useMemo } from 'react';
import type { Card } from '@/lib/deck-validation';
import { CardItem } from '@/components/catalog/card-item';
import { useCurrency } from '@/components/currency-context';
import { DollarSign } from 'lucide-react';

interface WantListTabProps {
  deckCards: { cardDefinitionId: number; quantity: number }[];
  allCards: Card[];
}

const TYPE_ORDER = ['Leader', 'Base', 'Unit', 'Event', 'Upgrade'];

export function WantListTab({ deckCards, allCards }: WantListTabProps) {
  const [collection, setCollection] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/collection')
      .then(res => res.json())
      .then(data => {
        setCollection(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load collection:', err);
        setLoading(false);
      });
  }, []);

  const shortfallCards = useMemo(() => {
    return deckCards
      .map(dc => {
        const card = allCards.find(c => c.id === dc.cardDefinitionId);
        if (!card) return null;
        const owned = collection[dc.cardDefinitionId] ?? 0;
        const shortfall = dc.quantity - owned;
        if (shortfall <= 0) return null;
        return { card, quantity: dc.quantity, owned, shortfall };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [deckCards, collection, allCards]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof shortfallCards>();
    for (const item of shortfallCards) {
      const t = item.card.type;
      if (!map.has(t)) map.set(t, []);
      map.get(t)!.push(item);
    }
    return [...map.entries()].sort(([a], [b]) => {
      const ai = TYPE_ORDER.indexOf(a);
      const bi = TYPE_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [shortfallCards]);

  const { currency } = useCurrency();

  const totalCost = useMemo(() => {
    const cents = shortfallCards.reduce((sum, item) => {
      const price = (currency === 'EUR' ? item.card.priceEur : item.card.priceUsd) || 0;
      return sum + price * item.shortfall;
    }, 0);
    return cents / 100;
  }, [shortfallCards, currency]);

  const formattedCost = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency,
  }).format(totalCost);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading want list...</p>
      </div>
    );
  }

  if (deckCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="font-semibold text-foreground">No cards in this deck yet.</p>
        <p className="text-sm text-muted-foreground">Switch to Add Cards to start building.</p>
      </div>
    );
  }

  if (shortfallCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="font-semibold text-foreground">You own all the cards for this deck.</p>
        <p className="text-sm text-muted-foreground">Nothing to buy — you&apos;re all set.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 pb-20">
      {grouped.map(([typeName, items]) => (
        <div key={typeName} className="mb-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-muted pb-1 mb-2">
            {typeName}
          </h3>
          <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {items.map(({ card, quantity, owned, shortfall }) => (
              <CardItem
                key={card.id}
                id={card.id}
                name={card.name}
                type={card.type}
                setCode={card.setCode}
                collectorNumber={card.collectorNumber}
                frontArtUrl={card.frontArtUrl}
                backArtUrl={card.backArtUrl}
                ownedCount={owned}
                onUpdateCount={() => {}}
                mode="want-list"
                deckQuantity={quantity}
                shortfall={shortfall}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Sticky Summary Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-center pointer-events-none">
        <div className="bg-indigo-600 text-white px-6 py-4 rounded-t-xl shadow-2xl flex items-center gap-4 max-w-lg w-full pointer-events-auto">
          <div className="bg-white/20 p-2 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">Estimated Cost to Complete</span>
            <span className="text-2xl font-bold leading-none">{formattedCost}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

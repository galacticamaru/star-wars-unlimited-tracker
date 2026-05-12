'use client'

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CardPriceTileProps {
  id: number;
  name: string;
  type: string;
  setCode: string;
  collectorNumber: string;
  frontArtUrl: string | null;
  backArtUrl: string | null;
  priceUsd: number | null;
}

function CardPriceTile({
  name,
  type,
  setCode,
  collectorNumber,
  frontArtUrl,
  backArtUrl,
  priceUsd,
}: CardPriceTileProps) {
  const [loaded, setLoaded] = useState(false);

  // Parse "SOR-059" → "059" for the card detail URL
  const dashIdx = collectorNumber.indexOf('-');
  const cardNumber = dashIdx >= 0 ? collectorNumber.slice(dashIdx + 1) : collectorNumber;

  // Leader and Base cards are horizontal; all others are vertical
  const isLeader = type.toLowerCase().includes('leader');
  const isBase = type.toLowerCase().includes('base');
  const isHorizontal = isLeader || isBase;
  // Leaders show front art (which is the leader's face side); fallback to back
  const displayUrl = isLeader ? (frontArtUrl || backArtUrl) : frontArtUrl;

  return (
    <div className="group">
      <Link
        href={`/cards/${setCode}/${cardNumber}`}
        aria-label={`View ${name}`}
        className="block"
      >
        <div
          className={cn(
            'relative rounded-md overflow-hidden bg-muted max-h-48',
            isHorizontal ? 'aspect-[3/2]' : 'aspect-[2/3]',
            !loaded && 'animate-pulse',
          )}
        >
          {displayUrl && (
            <Image
              src={displayUrl}
              alt={name}
              fill
              sizes="(max-width: 640px) 40vw, 20vw"
              className={cn(
                'object-cover transition-opacity duration-300',
                !loaded && 'opacity-0',
              )}
              onLoad={() => setLoaded(true)}
              onError={() => setLoaded(true)}
            />
          )}
        </div>
        <div className="mt-1 px-0.5">
          <p className="text-xs font-medium truncate">{name}</p>
          <p className="text-xs text-muted-foreground font-semibold">
            {priceUsd ? `$${(priceUsd / 100).toFixed(2)}` : '—'}
          </p>
        </div>
      </Link>
    </div>
  );
}

interface HighValueGridProps {
  cards: CardPriceTileProps[];
}

export function HighValueGrid({ cards }: HighValueGridProps) {
  return (
    <section className="px-4 md:px-8 py-12 max-w-3xl mx-auto">
      <h2 className="font-heading text-xl font-semibold mb-6">Highest Value Cards</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {cards.map(card => (
          <CardPriceTile key={card.id} {...card} />
        ))}
      </div>
    </section>
  );
}

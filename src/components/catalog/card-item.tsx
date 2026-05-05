'use client'

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CardItemProps {
  name: string;
  setCode: string;
  collectorNumber: string;  // e.g. "SOR-059"
  frontArtUrl: string | null;
}

export function CardItem({ name, setCode, collectorNumber, frontArtUrl }: CardItemProps) {
  const [loaded, setLoaded] = useState(false);
  // Use indexOf for robustness over edge-case multi-hyphen collector numbers
  const dashIdx = collectorNumber.indexOf('-');
  const cardNumber = dashIdx >= 0 ? collectorNumber.slice(dashIdx + 1) : collectorNumber;

  return (
    <Link
      href={`/cards/${setCode}/${cardNumber}`}
      aria-label={`View card: ${name}`}
    >
      {/* relative + aspect-[2/3] + overflow-hidden ALL required (Pitfall 2) */}
      <div
        className={cn(
          'relative aspect-[2/3] rounded-md overflow-hidden bg-muted',
          !loaded && 'animate-pulse',
        )}
      >
        {frontArtUrl && (
          <Image
            src={frontArtUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, (max-width: 1280px) 15vw, (max-width: 1536px) 12vw, 10vw"
            className={cn(
              'object-cover transition-shadow',
              'hover:ring-2 hover:ring-primary hover:ring-offset-1 cursor-pointer',
              !loaded && 'opacity-0',
            )}
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)}
          />
        )}
      </div>
    </Link>
  );
}

'use client'

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CardItemProps {
  name: string;
  type: string;
  setCode: string;
  collectorNumber: string;  // e.g. "SOR-059"
  frontArtUrl: string | null;
  backArtUrl: string | null;
}

export function CardItem({ name, type, setCode, collectorNumber, frontArtUrl, backArtUrl }: CardItemProps) {
  const [loaded, setLoaded] = useState(false);
  // Use indexOf for robustness over edge-case multi-hyphen collector numbers
  const dashIdx = collectorNumber.indexOf('-');
  const cardNumber = dashIdx >= 0 ? collectorNumber.slice(dashIdx + 1) : collectorNumber;

  const isLeader = type.toLowerCase().includes('leader');
  const isBase = type.toLowerCase().includes('base');

  // If the previous attempt with backArtUrl was "backwards", use frontArtUrl for Leaders in the catalog.
  // Bases usually only have frontArtUrl.
  const displayUrl = isLeader ? (frontArtUrl || backArtUrl) : frontArtUrl;
  
  // Leaders/Bases are horizontal (3:2) in the catalog. Others are vertical (2:3).
  const isHorizontal = isLeader || isBase;

  return (
    <Link
      href={`/cards/${setCode}/${cardNumber}`}
      aria-label={`View card: ${name}`}
      className="group"
    >
      {/* relative + aspect-[X/Y] + overflow-hidden ALL required (Pitfall 2) */}
      <div
        className={cn(
          'relative rounded-md overflow-hidden bg-muted transition-all',
          isHorizontal ? 'aspect-[3/2]' : 'aspect-[2/3]',
          !loaded && 'animate-pulse',
        )}
      >
        {displayUrl && (
          <Image
            src={displayUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, (max-width: 1280px) 15vw, (max-width: 1536px) 12vw, 10vw"
            className={cn(
              'object-cover transition-opacity duration-300',
              !loaded && 'opacity-0',
            )}
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)}
          />
        )}
        {/* Hover overlay — ensures ring is on top of the fill image */}
        <div className="absolute inset-0 pointer-events-none rounded-md group-hover:ring-4 group-hover:ring-primary group-hover:ring-inset transition-all" />
      </div>
    </Link>
  );
}

'use client'

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus, Minus } from 'lucide-react';

interface CardItemProps {
  id: number;
  name: string;
  type: string;
  setCode: string;
  collectorNumber: string;  // e.g. "SOR-059"
  frontArtUrl: string | null;
  backArtUrl: string | null;
  ownedCount: number;
  onUpdateCount: (id: number, count: number) => void;
}

export function CardItem({ 
  id, name, type, setCode, collectorNumber, frontArtUrl, backArtUrl, ownedCount, onUpdateCount 
}: CardItemProps) {
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
    <div className="group relative">
      <Link
        href={`/cards/${setCode}/${cardNumber}`}
        aria-label={`View card: ${name}`}
        className="block"
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
          
          {/* Hover overlay — contains collection controls */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 flex flex-col items-center justify-center gap-2 z-10"
          >
            <div 
              className="flex items-center gap-3 bg-background/90 rounded-full px-3 py-1 shadow-lg"
              onClick={(e) => {
                // Prevent navigation when clicking the control bar itself
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onUpdateCount(id, Math.max(0, ownedCount - 1));
                }}
                className="p-1 hover:bg-muted rounded-full transition-colors"
                aria-label="Decrease owned count"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold min-w-[1ch] text-center text-sm">{ownedCount}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onUpdateCount(id, ownedCount + 1);
                }}
                className="p-1 hover:bg-muted rounded-full transition-colors"
                aria-label="Increase owned count"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Focus/Hover Ring — ensures ring is on top of the fill image */}
          <div className="absolute inset-0 pointer-events-none rounded-md group-hover:ring-4 group-hover:ring-primary group-hover:ring-inset transition-all" />
        </div>
      </Link>
      
      {/* Badge for owned count (visible even when not hovering if count > 0) */}
      {ownedCount > 0 && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md z-20 pointer-events-none">
          {ownedCount}
        </div>
      )}
    </div>
  );
}

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
  onUpdateCount?: (id: number, count: number) => void;
  mode?: 'catalog' | 'selector' | 'want-list' | 'binder' | 'want';
  deckCount?: number;
  deckQuantity?: number;   // quantity needed by deck (used when mode='want-list')
  shortfall?: number;      // deckQuantity - ownedCount (used when mode='want-list')
  onDeckUpdate?: (id: number, count: number) => void;
  tradeQuantity?: number;  // used when mode='binder'
  lookingForQuantity?: number; // used when mode='want'
}

export function CardItem({ 
  id, 
  name, 
  type, 
  setCode, 
  collectorNumber, 
  frontArtUrl, 
  backArtUrl, 
  ownedCount, 
  onUpdateCount,
  mode = 'catalog',
  deckCount = 0,
  deckQuantity = 0,
  shortfall = 0,
  onDeckUpdate,
  tradeQuantity = 0,
  lookingForQuantity = 0
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

  const isSelector = mode === 'selector';
  const isWantList = mode === 'want-list';
  const isBinder = mode === 'binder';
  const isWant = mode === 'want';
  const isReadOnly = isWantList || isBinder || isWant;
  const hasShortfall = (isSelector && deckCount > ownedCount) || isWantList;

  return (
    <div 
      className="group relative"
      aria-label={isWantList ? `${name} — need ${deckQuantity}, own ${ownedCount}, short ${shortfall}` : undefined}
    >
      <Link
        href={`/cards/${setCode}/${cardNumber}`}
        aria-label={`View card: ${name}`}
        className="block"
      >
        {/* relative + aspect-[X/Y] + overflow-hidden ALL required (Pitfall 2) */}
        <div
          className={cn(
            'relative rounded-md overflow-hidden bg-muted transition-all border-2',
            isHorizontal ? 'aspect-[3/2]' : 'aspect-[2/3]',
            !loaded && 'animate-pulse',
            hasShortfall ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'border-transparent'
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
            {isReadOnly ? (
              // Read-only overlay: show card name only (accessibility on small tiles)
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 flex items-center justify-center z-10 px-1 text-center">
                <span className="text-white text-xs font-semibold leading-tight">{name}</span>
              </div>
            ) : isSelector ? (
              <div className="flex flex-col items-center gap-2 w-full px-2">
                <div 
                  className="flex items-center gap-3 bg-background/90 rounded-full px-3 py-1 shadow-lg"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDeckUpdate?.(id, Math.max(0, deckCount - 1));
                    }}
                    className="p-1 hover:bg-muted rounded-full transition-colors"
                    aria-label="Decrease deck count"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="flex flex-col items-center leading-none">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">In Deck</span>
                    <span className="font-bold min-w-[1ch] text-center text-sm">{deckCount}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Max 3 for non-leader/base cards (usually, but reducer handles logic)
                      onDeckUpdate?.(id, deckCount + 1);
                    }}
                    className="p-1 hover:bg-muted rounded-full transition-colors"
                    aria-label="Increase deck count"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {(isLeader || isBase) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDeckUpdate?.(id, 1);
                    }}
                    className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full shadow-lg hover:bg-primary/90 transition-colors uppercase"
                  >
                    Set as {isLeader ? 'Leader' : 'Base'}
                  </button>
                )}
              </div>
            ) : (
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
                    onUpdateCount?.(id, Math.max(0, ownedCount - 1));
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
                    onUpdateCount?.(id, ownedCount + 1);
                  }}
                  className="p-1 hover:bg-muted rounded-full transition-colors"
                  aria-label="Increase owned count"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Focus/Hover Ring — ensures ring is on top of the fill image */}
          <div className="absolute inset-0 pointer-events-none rounded-md group-hover:ring-4 group-hover:ring-primary group-hover:ring-inset transition-all" />
        </div>
      </Link>
      
      {/* Badge for owned count (visible even when not hovering if count > 0) */}
      {ownedCount > 0 && !isSelector && !isBinder && !isWant && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md z-20 pointer-events-none">
          {ownedCount}
        </div>
      )}

      {/* Binder Mode Badge */}
      {isBinder && tradeQuantity > 0 && (
        <div className="absolute -top-2 -right-2 bg-green-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-md z-20 pointer-events-none whitespace-nowrap">
          {tradeQuantity} Available
        </div>
      )}

      {/* Want Mode Badge */}
      {isWant && lookingForQuantity > 0 && (
        <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-md z-20 pointer-events-none whitespace-nowrap">
          {lookingForQuantity} Needed
        </div>
      )}

      {/* Selector Mode Badges */}
      {isSelector && (
        <>
          {/* Owned badge (smaller, secondary) */}
          <div className="absolute -top-2 -left-2 bg-muted-foreground/80 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-bold shadow-sm z-20 pointer-events-none">
            OWNED: {ownedCount}
          </div>
          
          {/* Deck count badge (primary) */}
          {deckCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md z-20 pointer-events-none">
              {deckCount}
            </div>
          )}

          {/* Shortfall badge */}
          {hasShortfall && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-lg z-20 pointer-events-none whitespace-nowrap uppercase tracking-wider">
              Missing {deckCount - ownedCount}
            </div>
          )}
        </>
      )}

      {/* Want List mode: NEED / OWN / SHORT chips — always visible below tile */}
      {isWantList && (
        <div className="flex flex-wrap gap-1 justify-center mt-1.5">
          <span className="bg-muted text-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-sm whitespace-nowrap">
            NEED {deckQuantity}
          </span>
          <span className="bg-muted text-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-sm whitespace-nowrap">
            OWN {ownedCount}
          </span>
          <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-sm whitespace-nowrap">
            SHORT {shortfall}
          </span>
        </div>
      )}
    </div>
  );
}

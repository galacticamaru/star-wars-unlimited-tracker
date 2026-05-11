'use client'

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus, Minus } from 'lucide-react';

interface ManageTradeCardProps {
  id: number;
  name: string;
  type: string;
  frontArtUrl: string | null;
  tradeQuantity: number;
  onUpdateTradeQuantity: (id: number, count: number) => void;
}

export function ManageTradeCard({ 
  id, 
  name, 
  type, 
  frontArtUrl, 
  tradeQuantity, 
  onUpdateTradeQuantity,
}: ManageTradeCardProps) {
  const [loaded, setLoaded] = useState(false);

  const isLeader = type.toLowerCase().includes('leader');
  const isBase = type.toLowerCase().includes('base');
  const isHorizontal = isLeader || isBase;

  return (
    <div className="group relative">
      <div
        className={cn(
          'relative rounded-md overflow-hidden bg-muted transition-all border-2 border-transparent',
          isHorizontal ? 'aspect-[3/2]' : 'aspect-[2/3]',
          !loaded && 'animate-pulse',
        )}
      >
        {frontArtUrl && (
          <Image
            src={frontArtUrl}
            alt={name}
            fill
            sizes="150px"
            className={cn(
              'object-cover transition-opacity duration-300',
              !loaded && 'opacity-0',
            )}
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)}
          />
        )}
        
        {/* Controls Overlay */}
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2 bg-background/90 rounded-full px-2 py-1 shadow-lg">
            <button
              type="button"
              onClick={() => onUpdateTradeQuantity(id, Math.max(0, tradeQuantity - 1))}
              className="p-1 hover:bg-muted rounded-full transition-colors"
              aria-label="Decrease trade quantity"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-bold text-xs min-w-[1.5ch] text-center">{tradeQuantity}</span>
            <button
              type="button"
              onClick={() => onUpdateTradeQuantity(id, tradeQuantity + 1)}
              className="p-1 hover:bg-muted rounded-full transition-colors"
              aria-label="Increase trade quantity"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => onUpdateTradeQuantity(id, 0)}
            className="text-[10px] font-bold text-white uppercase hover:text-red-400 transition-colors"
          >
            Stop Trading
          </button>
        </div>
      </div>
      
      {/* Badge */}
      <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md z-20 pointer-events-none">
        {tradeQuantity}
      </div>
      
      <div className="mt-1 text-[10px] font-medium truncate text-center px-1 text-muted-foreground">
        {name}
      </div>
    </div>
  );
}

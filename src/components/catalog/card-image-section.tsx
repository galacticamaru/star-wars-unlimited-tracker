'use client'

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RotateCw } from 'lucide-react';

interface CardImageSectionProps {
  name: string;
  type: string;
  frontArtUrl: string | null;
  backArtUrl: string | null;
}

export function CardImageSection({ name, type, frontArtUrl, backArtUrl }: CardImageSectionProps) {
  const isLeader = type.toLowerCase().includes('leader');
  const isBase = type.toLowerCase().includes('base');
  
  const [showBack, setShowBack] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Determine display properties based on card type
  let displayUrl = frontArtUrl;
  let currentAspect = '2/3';
  let buttonLabel = '';

  if (isLeader) {
    // Default (showBack=false): Leader Side (Front, 3:2)
    // Toggled (showBack=true): Unit Side (Back, 2:3)
    displayUrl = showBack ? (backArtUrl || frontArtUrl) : frontArtUrl;
    currentAspect = showBack ? '2/3' : '3/2';
    buttonLabel = showBack ? 'Switch to Leader Side' : 'Switch to Unit Side';
  } else if (isBase) {
    displayUrl = frontArtUrl;
    currentAspect = '3/2';
  } else {
    displayUrl = frontArtUrl;
    currentAspect = '2/3';
  }

  if (!displayUrl) {
    return (
      <div className="w-full md:w-[320px] md:flex-shrink-0">
        <div className={cn(
          "w-full bg-muted rounded-lg",
          currentAspect === '3/2' ? 'aspect-[3/2]' : 'aspect-[2/3]'
        )} />
      </div>
    );
  }

  return (
    <div className="w-full md:w-[320px] md:flex-shrink-0 flex flex-col gap-4">
      <div 
        className={cn(
          "relative w-full rounded-lg overflow-hidden bg-muted",
          currentAspect === '3/2' ? 'aspect-[3/2]' : 'aspect-[2/3]',
          !loaded && 'animate-pulse'
        )}
      >
        <Image
          src={displayUrl}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, 320px"
          className={cn(
            "object-cover transition-opacity duration-300",
            !loaded && "opacity-0"
          )}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          // Use key to trigger reload/pulse on toggle
          key={displayUrl}
          // @ts-ignore - custom attribute used in this project's Next.js 16 setup
          preload={true}
        />
      </div>
      
      {isLeader && backArtUrl && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            setShowBack(!showBack);
            setLoaded(false); 
          }}
          className="w-full font-heading"
        >
          <RotateCw className="mr-2 h-4 w-4" />
          {buttonLabel}
        </Button>
      )}
    </div>
  );
}

'use client'

import { useState, useRef } from 'react';
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
  // Track whether the user has triggered at least one toggle. On first paint (isToggling=false)
  // we skip the opacity-fade so the LCP image is immediately opaque and the browser scores it
  // as painted without the ~300 ms transition delay. The fade is preserved for subsequent
  // leader-side / unit-side switches where it improves perceived quality without affecting LCP.
  const isTogglingRef = useRef(false);

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

  // Only apply the opacity-fade during an explicit toggle (not on the initial LCP paint).
  const showFade = isTogglingRef.current;

  return (
    <div className="w-full md:w-[320px] md:flex-shrink-0 flex flex-col gap-4">
      <div
        className={cn(
          "relative w-full rounded-lg overflow-hidden bg-muted",
          currentAspect === '3/2' ? 'aspect-[3/2]' : 'aspect-[2/3]',
          showFade && !loaded && 'animate-pulse'
        )}
      >
        <Image
          src={displayUrl}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, 320px"
          className={cn(
            "object-cover",
            showFade && "transition-opacity duration-300",
            showFade && !loaded && "opacity-0"
          )}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          // Use key to trigger reload/pulse on toggle
          key={displayUrl}
          priority
        />
      </div>

      {isLeader && backArtUrl && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            isTogglingRef.current = true;
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

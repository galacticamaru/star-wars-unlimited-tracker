import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { getCardByPrinting } from '@/db/queries/card-detail';
import { getUserCollection } from '@/db/queries/collection';
import { CollectionControls } from '@/components/catalog/collection-controls';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CardImageSection } from '@/components/catalog/card-image-section';
import { cn } from '@/lib/utils';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// CRITICAL: params is a Promise in Next.js 16 — MUST await before destructuring (Pitfall 1)
// Forgetting await causes: TypeScript error + runtime "Cannot read properties of Promise"
export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ 'set-code': string; 'card-number': string }>;
}) {
  const { 'set-code': setCode, 'card-number': cardNumber } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session ? Number(session.user.id) : null;

  const [card, collection] = await Promise.all([
    getCardByPrinting(setCode, cardNumber),
    userId ? getUserCollection(userId) : Promise.resolve([]),
  ]);

  // Return Next.js 404 page for unknown cards — do NOT throw, use notFound()
  if (!card) notFound();

  const ownedCount = collection.find(c => c.cardDefinitionId === card.id)?.count || 0;

  return (
    // UI-SPEC.md §Card Detail Page: max-w-5xl mx-auto px-md py-2xl
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Back button — top-left, ghost variant, ChevronLeft icon, label "Back to catalog" */}
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'mb-6 -ml-2'
        )}
      >
        <ChevronLeft className="mr-1 size-4" />
        Back to catalog
      </Link>

      {/* Side-by-side layout: stacks vertically on mobile, side-by-side on md+ */}
      <div className="flex flex-col gap-8 md:flex-row md:gap-12">

        {/* Image column — handles toggle for Leaders and correct aspect ratios */}
        <div className="flex flex-col gap-6">
          <CardImageSection 
            name={card.name}
            type={card.type}
            frontArtUrl={card.frontArtUrl}
            backArtUrl={card.backArtUrl}
          />

          <CollectionControls 
            cardDefinitionId={card.id}
            initialCount={ownedCount}
          />
        </div>

        {/* Metadata column — flex-1 */}
        <div className="flex-1 flex flex-col gap-4">

          {/* 1. Name — Heading (20px Oxanium semibold per UI-SPEC.md §Typography) */}
          <div>
            <h1 className="text-xl font-semibold font-heading leading-snug">{card.name}</h1>
            {/* 2. Subtitle — Body italic, muted */}
            {card.subtitle && (
              <p className="text-sm text-muted-foreground italic mt-0.5">{card.subtitle}</p>
            )}
          </div>

          {/* 3. Type / Arenas / Aspects — Label row (12px semibold, flex-wrap) */}
          <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
            <span className="bg-muted rounded px-2 py-0.5">{card.type}</span>
            {card.arenas.map(arena => (
              <span key={arena} className="bg-muted rounded px-2 py-0.5">{arena}</span>
            ))}
            {card.aspects.map(aspect => (
              <span key={aspect} className="bg-primary/10 text-primary rounded px-2 py-0.5">{aspect}</span>
            ))}
          </div>

          {/* 4. Traits / Keywords — Body, comma-separated */}
          {(card.traits.length > 0 || card.keywords.length > 0) && (
            <div className="text-sm text-muted-foreground">
              {card.traits.length > 0 && (
                <p><span className="font-semibold text-foreground">Traits: </span>{card.traits.join(', ')}</p>
              )}
              {card.keywords.length > 0 && (
                <p><span className="font-semibold text-foreground">Keywords: </span>{card.keywords.join(', ')}</p>
              )}
            </div>
          )}

          {/* 5. Cost / Power / HP — three inline stat chips */}
          {(card.cost !== null || card.power !== null || card.hp !== null) && (
            <div className="flex gap-3 text-sm font-semibold">
              {card.cost !== null && (
                <div className="flex flex-col items-center bg-muted rounded-md px-3 py-1.5">
                  <span className="text-xs text-muted-foreground font-medium">Cost</span>
                  <span>{card.cost}</span>
                </div>
              )}
              {card.power !== null && (
                <div className="flex flex-col items-center bg-muted rounded-md px-3 py-1.5">
                  <span className="text-xs text-muted-foreground font-medium">Power</span>
                  <span>{card.power}</span>
                </div>
              )}
              {card.hp !== null && (
                <div className="flex flex-col items-center bg-muted rounded-md px-3 py-1.5">
                  <span className="text-xs text-muted-foreground font-medium">HP</span>
                  <span>{card.hp}</span>
                </div>
              )}
            </div>
          )}

          {/* Price Chips - UI-SPEC.md §2.2 */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="px-2.5 py-1 h-auto text-[11px] font-bold">
              Market (NM): {card.priceEur ? `€${(card.priceEur / 100).toFixed(2)}` : '—'}
            </Badge>
            <Badge variant="secondary" className="px-2.5 py-1 h-auto text-[11px] font-bold">
              Market (NM): {card.priceUsd ? `$${(card.priceUsd / 100).toFixed(2)}` : '—'}
            </Badge>
          </div>

          {/* 6. Front text (abilities) — Body, bg-muted rounded box per UI-SPEC.md */}
          {card.frontText && (
            <div className="bg-muted rounded-md p-4 text-sm whitespace-pre-wrap">
              {card.frontText}
            </div>
          )}

          {/* 7. Back text — only if double-sided */}
          {card.doubleSided && card.backText && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Back</p>
              <div className="bg-muted rounded-md p-4 text-sm whitespace-pre-wrap">
                {card.backText}
              </div>
            </div>
          )}

          {/* 8. Epic Action — only if Leader (card.epicAction non-null) */}
          {card.epicAction && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Epic Action</p>
              <div className="bg-muted rounded-md p-4 text-sm whitespace-pre-wrap">
                {card.epicAction}
              </div>
            </div>
          )}

          {/* 9. Set / Collector Number / Rarity / Artist — Label (12px, muted) */}
          <div className="text-xs text-muted-foreground space-y-0.5 border-t border-border pt-3 mt-auto">
            <p><span className="font-semibold">Set:</span> {card.setCode}</p>
            <p><span className="font-semibold">Collector #:</span> {card.collectorNumber}</p>
            <p><span className="font-semibold">Rarity:</span> {card.rarity}</p>
            {card.artist && (
              <p><span className="font-semibold">Artist:</span> {card.artist}</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

'use client'

import { X, Plus, Minus, Ban } from 'lucide-react';

interface WantItem {
  cardPrintingId: number;
  variantType: string;
  quantity: number;
  name: string;
  subtitle: string | null;
}

interface AutoWantItem {
  cardDefinitionId: number;
  quantity: number;
  name: string;
  subtitle: string | null;
  isExcluded: boolean;
}

interface ManageWantsListProps {
  wants: WantItem[];
  autoWants: AutoWantItem[];
  onUpdateWantQuantity: (id: number, quantity: number) => void;
  onRemoveWant: (id: number) => void;
  onToggleExclusion: (id: number, excluded: boolean) => void;
}

export function ManageWantsList({
  wants,
  autoWants,
  onUpdateWantQuantity,
  onRemoveWant,
  onToggleExclusion,
}: ManageWantsListProps) {
  // Active deck wants render first, excluded ones sink to the bottom (D-03).
  // Sort a shallow copy — never mutate the incoming autoWants array.
  const sortedAutoWants = [...autoWants].sort((a, b) =>
    a.isExcluded === b.isExcluded ? 0 : a.isExcluded ? 1 : -1
  );
  const activeAutoWantCount = autoWants.filter((w) => !w.isExcluded).length;

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          Deck Wants
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full font-normal">
            {activeAutoWantCount}
          </span>
        </h3>
        {autoWants.length === 0 ? (
          <p className="text-xs text-muted-foreground italic bg-muted/30 p-4 rounded-md border border-dashed text-center">
            No deck-driven wants. Add decks to your collection to automatically track missing cards.
          </p>
        ) : (
          <div className="grid gap-2">
            {sortedAutoWants.map((w) =>
              w.isExcluded ? (
                <div
                  key={w.cardDefinitionId}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-md border group opacity-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{w.name}</p>
                    {w.subtitle && (
                      <p className="text-[10px] text-muted-foreground truncate">{w.subtitle}</p>
                    )}
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full font-normal">
                      Excluded
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleExclusion(w.cardDefinitionId, false)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors ml-4"
                    aria-label="Restore to looking for"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div key={w.cardDefinitionId} className="flex items-center justify-between p-2 bg-muted/50 rounded-md border group">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{w.name}</p>
                    {w.subtitle && (
                      <p className="text-[10px] text-muted-foreground truncate">{w.subtitle}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className="text-xs font-bold bg-background rounded-full px-2 py-0.5 border shadow-sm">
                      {w.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleExclusion(w.cardDefinitionId, true)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Exclude from looking for"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          Manual Wants
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full font-normal">
            {wants.length}
          </span>
        </h3>
        {wants.length === 0 ? (
          <p className="text-xs text-muted-foreground italic bg-muted/30 p-4 rounded-md border border-dashed text-center">
            No manual wants added. Use the search to add specific cards you're looking for.
          </p>
        ) : (
          <div className="grid gap-2">
            {wants.map((want) => (
              <div key={want.cardPrintingId} className="flex items-center justify-between p-2 bg-muted/50 rounded-md border group">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-medium truncate">{want.name}</p>
                    {want.variantType !== 'Normal' && (
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-sm font-bold uppercase">
                        {want.variantType}
                      </span>
                    )}
                  </div>
                  {want.subtitle && (
                    <p className="text-[10px] text-muted-foreground truncate">{want.subtitle}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <div className="flex items-center gap-2 bg-background rounded-full px-2 py-0.5 border shadow-sm">
                    <button
                      type="button"
                      onClick={() => onUpdateWantQuantity(want.cardPrintingId, Math.max(0, want.quantity - 1))}
                      className="p-0.5 hover:bg-muted rounded-full transition-colors"
                      aria-label="Decrease want quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold min-w-[1.5ch] text-center">{want.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateWantQuantity(want.cardPrintingId, want.quantity + 1)}
                      className="p-0.5 hover:bg-muted rounded-full transition-colors"
                      aria-label="Increase want quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveWant(want.cardPrintingId)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Remove manual want"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

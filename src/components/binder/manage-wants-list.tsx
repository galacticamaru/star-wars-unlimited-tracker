'use client'

import { X, Plus, Minus, Ban } from 'lucide-react';

interface WantItem {
  cardDefinitionId: number;
  quantity: number;
  name: string;
  subtitle: string | null;
}

interface ExclusionItem {
  cardDefinitionId: number;
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
  exclusions: ExclusionItem[];
  autoWants: AutoWantItem[];
  onUpdateWantQuantity: (id: number, quantity: number) => void;
  onRemoveWant: (id: number) => void;
  onRemoveExclusion: (id: number) => void;
  onToggleExclusion: (id: number, excluded: boolean) => void;
}

export function ManageWantsList({
  wants,
  exclusions,
  autoWants,
  onUpdateWantQuantity,
  onRemoveWant,
  onRemoveExclusion,
  onToggleExclusion,
}: ManageWantsListProps) {
  return (
    <div className="space-y-6">
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
              <div key={want.cardDefinitionId} className="flex items-center justify-between p-2 bg-muted/50 rounded-md border group">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{want.name}</p>
                  {want.subtitle && (
                    <p className="text-[10px] text-muted-foreground truncate">{want.subtitle}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <div className="flex items-center gap-2 bg-background rounded-full px-2 py-0.5 border shadow-sm">
                    <button
                      type="button"
                      onClick={() => onUpdateWantQuantity(want.cardDefinitionId, Math.max(0, want.quantity - 1))}
                      className="p-0.5 hover:bg-muted rounded-full transition-colors"
                      aria-label="Decrease want quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold min-w-[1.5ch] text-center">{want.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateWantQuantity(want.cardDefinitionId, want.quantity + 1)}
                      className="p-0.5 hover:bg-muted rounded-full transition-colors"
                      aria-label="Increase want quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveWant(want.cardDefinitionId)}
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

      <section>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          Exclusions
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full font-normal">
            {exclusions.length}
          </span>
        </h3>
        {exclusions.length === 0 ? (
          <p className="text-xs text-muted-foreground italic bg-muted/30 p-4 rounded-md border border-dashed text-center">
            No exclusions. All cards you own but haven't marked for trade will be hidden from the binder.
          </p>
        ) : (
          <div className="grid gap-2">
            {exclusions.map((exclusion) => (
              <div key={exclusion.cardDefinitionId} className="flex items-center justify-between p-2 bg-muted/50 rounded-md border group">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{exclusion.name}</p>
                  {exclusion.subtitle && (
                    <p className="text-[10px] text-muted-foreground truncate">{exclusion.subtitle}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveExclusion(exclusion.cardDefinitionId)}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors ml-4"
                  aria-label="Remove exclusion"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          Automatic Wants
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full font-normal">
            {autoWants.length}
          </span>
        </h3>
        {autoWants.length === 0 ? (
          <p className="text-xs text-muted-foreground italic bg-muted/30 p-4 rounded-md border border-dashed text-center">
            No deck-driven wants. Add decks to your collection to automatically track missing cards.
          </p>
        ) : (
          <div className="grid gap-2">
            {autoWants.map((w) =>
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
                    aria-label="Remove exclusion"
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
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CardSearchResult {
  cardDefinitionId: number;
  name: string;
  subtitle: string | null;
  printings: Array<{ id: number; variantType: string; ownedCount: number }>;
}

interface ManualWantsAddFlowProps {
  ownedCards: CardSearchResult[];
  onWantAdded: () => void;
}

export function ManualWantsAddFlow({ ownedCards, onWantAdded }: ManualWantsAddFlowProps) {
  const [query, setQuery] = useState('');
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [allPrintingsForCard, setAllPrintingsForCard] = useState<
    Array<{ id: number; variantType: string; ownedCount: number }> | null
  >(null);
  const [isAdding, setIsAdding] = useState(false);

  // Filter owned cards by name or subtitle (case-insensitive)
  const filteredResults =
    query.trim().length >= 2
      ? ownedCards.filter(c => {
          const q = query.toLowerCase();
          return (
            c.name.toLowerCase().includes(q) ||
            (c.subtitle?.toLowerCase().includes(q) ?? false)
          );
        })
      : [];

  const handleSelectCard = (card: CardSearchResult) => {
    setSelectedCardId(card.cardDefinitionId);
    setAllPrintingsForCard(card.printings);
    setSelectedVariant(null);
    setQuery(card.name);
  };

  const handleChipClick = (variantType: string) => {
    // Single-select toggle: clicking a selected chip clears it
    setSelectedVariant(prev => (prev === variantType ? null : variantType));
  };

  const handleAddWant = async () => {
    if (!allPrintingsForCard || selectedVariant === null) return;

    const printing = allPrintingsForCard.find(p => p.variantType === selectedVariant);
    if (!printing) {
      // Defensive: chip should always resolve to a printing
      console.error('Could not resolve cardPrintingId for variant:', selectedVariant);
      return;
    }

    const cardPrintingId = printing.id;
    setIsAdding(true);

    try {
      const res = await fetch('/api/binder/wants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardPrintingId, quantity: 1 }),
      });

      if (res.ok) {
        // Clear local state and notify parent to refresh
        setQuery('');
        setSelectedCardId(null);
        setSelectedVariant(null);
        setAllPrintingsForCard(null);
        onWantAdded();
      } else {
        console.error('Failed to add want:', await res.text());
        // Keep state so user can retry
      }
    } catch (err) {
      console.error('Failed to add want:', err);
      // Keep state so user can retry
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            // Clear selection if user changes the search after picking a card
            if (selectedCardId !== null) {
              setSelectedCardId(null);
              setSelectedVariant(null);
              setAllPrintingsForCard(null);
            }
          }}
          placeholder="Search for a card..."
          className="pl-9"
        />
      </div>

      {/* Search results — only when no card is selected yet */}
      {selectedCardId === null && filteredResults.length > 0 && (
        <div className="border rounded-md divide-y overflow-hidden">
          {filteredResults.slice(0, 10).map(card => (
            <button
              key={card.cardDefinitionId}
              type="button"
              className="w-full flex items-start gap-2 p-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
              onClick={() => handleSelectCard(card)}
            >
              <div>
                <p className="text-sm font-medium">{card.name}</p>
                {card.subtitle && (
                  <p className="text-[10px] text-muted-foreground">{card.subtitle}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Variant chip selector — shown after a card is selected */}
      {selectedCardId !== null && allPrintingsForCard !== null && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Select variant</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {allPrintingsForCard.map(p => {
              const isSelected = selectedVariant === p.variantType;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleChipClick(p.variantType)}
                  className={[
                    'px-2 py-1 rounded-full text-xs font-bold border transition-colors',
                    isSelected
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-background border-input text-foreground hover:bg-muted',
                  ].join(' ')}
                >
                  {p.variantType}
                  {p.ownedCount > 0 && ` (Owned: ${p.ownedCount})`}
                </button>
              );
            })}
          </div>

          {/* Add Want button — visible only when a variant is selected */}
          {selectedVariant !== null && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleAddWant}
              disabled={isAdding}
              className="mt-2"
            >
              {isAdding && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              Add Want
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

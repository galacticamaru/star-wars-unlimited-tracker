'use client';

import { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface SheetPrinting {
  id: number;              // cardPrintingId
  variantType: string;
  ownedCount: number;
  tradeQuantity: number;
}

interface VariantTradeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardName: string;
  cardSubtitle: string | null;
  printings: SheetPrinting[];                          // owned printings only (count > 0) per D-15
  onTradeQuantityChange: (cardPrintingId: number, tradeQuantity: number) => void;
}

export function VariantTradeSheet({
  open,
  onOpenChange,
  cardName,
  cardSubtitle,
  printings,
  onTradeQuantityChange,
}: VariantTradeSheetProps) {
  const [counts, setCounts] = useState<Record<number, number>>(
    Object.fromEntries(printings.map(p => [p.id, p.tradeQuantity]))
  );

  // Reset local counts when a different card is opened (printings list changes)
  const printingsKey = printings.map(p => p.id).join(',');
  useEffect(() => {
    setCounts(Object.fromEntries(printings.map(p => [p.id, p.tradeQuantity])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printingsKey]);

  const updateTradeQuantity = async (cardPrintingId: number, newValue: number) => {
    const val = Math.max(0, newValue);
    const prev = counts[cardPrintingId] ?? 0;

    // Optimistic local update
    setCounts(c => ({ ...c, [cardPrintingId]: val }));

    try {
      const res = await fetch('/api/trade', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardPrintingId, tradeQuantity: val }),
      });

      if (!res.ok) {
        // Rollback on server error
        setCounts(c => ({ ...c, [cardPrintingId]: prev }));
        console.error('Failed to update trade quantity:', await res.text());
        return;
      }

      // Only notify parent after confirmed success
      onTradeQuantityChange(cardPrintingId, val);
    } catch (err) {
      // Rollback on network error
      setCounts(c => ({ ...c, [cardPrintingId]: prev }));
      console.error('Failed to update trade quantity:', err);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold font-heading">{cardName}</SheetTitle>
          {cardSubtitle && (
            <SheetDescription className="text-sm text-muted-foreground italic">
              {cardSubtitle}
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {printings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No owned printings to display.</p>
          ) : (
            printings.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-3 py-2">
                {/* Left cluster: variant label + owned chip */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-normal">{p.variantType}</span>
                  <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-normal">
                    Owned: {p.ownedCount}
                  </span>
                </div>

                {/* Right cluster: controls pill */}
                <div className="flex items-center gap-2 bg-background rounded-full px-2 py-0.5 border shadow-sm">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateTradeQuantity(p.id, (counts[p.id] ?? 0) - 1)}
                    disabled={(counts[p.id] ?? 0) === 0}
                    aria-label={`Decrease ${p.variantType} trade quantity`}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <span className="font-bold text-sm w-8 text-center">{counts[p.id] ?? 0}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateTradeQuantity(p.id, (counts[p.id] ?? 0) + 1)}
                    aria-label={`Increase ${p.variantType} trade quantity`}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

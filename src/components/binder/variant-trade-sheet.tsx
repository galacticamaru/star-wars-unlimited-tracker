'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { VariantCollectionSection } from '@/components/catalog/variant-collection-section';
import { VariantTradeSection } from '@/components/catalog/variant-trade-section';
import { VariantWantSection } from '@/components/catalog/variant-want-section';

interface SheetPrinting {
  id: number;
  variantType: string;
  ownedCount: number;
  tradeQuantity: number;
  quantity: number;
}

interface VariantTradeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardName: string;
  cardSubtitle: string | null;
  printings: SheetPrinting[];
  onTradeQuantityChange: (cardPrintingId: number, tradeQuantity: number) => void;
  onWantQuantityChange: (cardPrintingId: number, quantity: number) => void;
}

export function VariantTradeSheet({
  open,
  onOpenChange,
  cardName,
  cardSubtitle,
  printings,
  onTradeQuantityChange,
  onWantQuantityChange,
}: VariantTradeSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-sm overflow-y-auto flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="text-xl font-bold font-heading">{cardName}</SheetTitle>
          {cardSubtitle && (
            <SheetDescription className="text-sm text-muted-foreground italic">
              {cardSubtitle}
            </SheetDescription>
          )}
        </SheetHeader>

        {printings.length === 0 ? (
          <p className="px-6 py-4 text-sm text-muted-foreground">No printings found for this card.</p>
        ) : (
          <div className="px-6 py-6 flex flex-col gap-6">
            <VariantCollectionSection printings={printings} />
            <VariantTradeSection
              printings={printings}
              onQuantityChange={onTradeQuantityChange}
            />
            <VariantWantSection
              printings={printings}
              onQuantityChange={onWantQuantityChange}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

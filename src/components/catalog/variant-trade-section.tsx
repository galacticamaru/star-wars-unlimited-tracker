'use client'

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

interface Printing {
  id: number;
  variantType: string;
  collectorNumber?: string;
  tradeQuantity: number;
  ownedCount: number;
}

interface VariantTradeSectionProps {
  printings: Printing[];
  onQuantityChange?: (cardPrintingId: number, tradeQuantity: number) => void;
}

export function VariantTradeSection({ printings, onQuantityChange }: VariantTradeSectionProps) {
  // Initialize counts map from RSC-fetched tradeQuantity per printing (D-11 — no client fetch)
  const [counts, setCounts] = useState<Record<number, number>>(
    Object.fromEntries(printings.map(p => [p.id, p.tradeQuantity]))
  );
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const isAuthenticated = !!session;

  const updateVariant = async (cardPrintingId: number, newCount: number) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Floor at 0 (D-10 / UI-SPEC §Interaction Contract; T-23-03-04)
    const val = Math.max(0, newCount);

    // Capture previous value for rollback on server error
    const prev = counts[cardPrintingId] ?? 0;

    // Optimistic UI update
    setCounts(c => ({ ...c, [cardPrintingId]: val }));

    try {
      const res = await fetch('/api/trade', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardPrintingId, tradeQuantity: val }),
      });
      if (!res.ok) {
        setCounts(c => ({ ...c, [cardPrintingId]: prev }));
        console.error('Failed to update trade quantity:', await res.text());
      } else {
        onQuantityChange?.(cardPrintingId, val);
        router.refresh();
      }
    } catch (err) {
      // Roll back on network-level failure as well
      setCounts(c => ({ ...c, [cardPrintingId]: prev }));
      console.error('Failed to update trade quantity:', err);
    }
  };

  return (
    // Container — matches VariantCollectionSection container exactly (UI-SPEC Surface 2)
    <div className="flex flex-col gap-2 p-4 bg-muted/50 rounded-lg border border-border">
      {/* Section label — uppercase via className (UI-SPEC §Copywriting Contract) */}
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Available for Trade
      </p>

      {/* Per-variant rows — one per printing, zero rows remain visible (D-10) */}
      {printings.map(printing => {
        const count = counts[printing.id] ?? 0;
        // Ownership gate — trade stepper only interactive for owned variants (D-06 / BINDER-13)
        const isOwned = printing.ownedCount > 0;
        return (
          <div key={printing.id} className="flex items-center gap-2">
            {/* Variant type label — w-28 ensures alignment across rows */}
            <span className="text-sm text-muted-foreground w-28 min-w-[7rem]">
              {printing.variantType}
            </span>

            {/* Minus button — disabled at 0 or when unowned (UI-SPEC §Surface 2 / D-06) */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateVariant(printing.id, count - 1)}
              disabled={count === 0 || !isOwned}
              aria-label={`Decrease ${printing.variantType} trade quantity`}
            >
              <Minus className="size-4" />
            </Button>

            {/* Trade quantity input */}
            <Input
              type="number"
              value={count}
              onChange={(e) => updateVariant(printing.id, parseInt(e.target.value, 10) || 0)}
              className="w-16 text-center font-bold"
              aria-label={`${printing.variantType} trade quantity`}
              disabled={!isOwned}
            />

            {/* Plus button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateVariant(printing.id, count + 1)}
              aria-label={`Increase ${printing.variantType} trade quantity`}
              disabled={!isOwned}
            >
              <Plus className="size-4" />
            </Button>

            {/* Status indicator — Trading / Not trading (UI-SPEC §Surface 2 / D-10) */}
            {count > 0 ? (
              <span className="text-sm font-bold text-primary">Trading</span>
            ) : (
              <span className="text-sm font-normal text-muted-foreground">Not trading</span>
            )}

            {/* Unowned-variant reason — informational, not destructive (D-06 / UI-SPEC §Copywriting Contract) */}
            {!isOwned && (
              <span className="text-xs text-muted-foreground">You don&apos;t own this variant</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

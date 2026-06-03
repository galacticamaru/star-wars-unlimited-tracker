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
  ownedCount: number;
}

interface VariantCollectionSectionProps {
  printings: Printing[];
}

export function VariantCollectionSection({ printings }: VariantCollectionSectionProps) {
  // Initialize counts map from RSC-fetched ownedCount per printing (Pattern 5 from RESEARCH.md)
  const [counts, setCounts] = useState<Record<number, number>>(
    Object.fromEntries(printings.map(p => [p.id, p.ownedCount]))
  );
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const isAuthenticated = !!session;

  const updateVariant = async (cardPrintingId: number, newCount: number) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Floor at 0 before optimistic update and fetch (T-17-05-02)
    const val = Math.max(0, newCount);

    // Capture previous value for rollback on server error (CR-03 / WR-01)
    const prev = counts[cardPrintingId] ?? 0;

    // Optimistic UI update (fire-and-update pattern: update state immediately, roll back on error)
    setCounts(prev => ({ ...prev, [cardPrintingId]: val }));

    try {
      const res = await fetch('/api/collection/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardPrintingId, count: val }),
      });
      if (!res.ok) {
        // Roll back optimistic update on server error to keep UI in sync with DB
        setCounts(c => ({ ...c, [cardPrintingId]: prev }));
        console.error('Failed to update variant count:', await res.text());
      } else {
        router.refresh();
      }
    } catch (err) {
      // Roll back on network-level failure as well
      setCounts(c => ({ ...c, [cardPrintingId]: prev }));
      console.error('Failed to update variant count:', err);
    }
  };

  // Total derived from client state — recalculates on every count change (UI-SPEC §Interaction Contract)
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    // Container — exact classes from UI-SPEC.md §Layout
    <div className="flex flex-col gap-2 p-4 bg-muted/50 rounded-lg border border-border">
      {/* Section label — uppercase via className (UI-SPEC §Copywriting Contract) */}
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Your Collection
      </p>

      {/* Per-variant rows */}
      {printings.map(printing => {
        const count = counts[printing.id] ?? 0;
        return (
          <div key={printing.id} className="flex items-center gap-2">
            {/* Variant type label — w-28 ensures alignment across rows (UI-SPEC §Variant row anatomy) */}
            <span className="text-sm text-muted-foreground w-28 min-w-[7rem]">
              {printing.variantType}
            </span>

            {/* Minus button — disabled at 0 (UI-SPEC §Interaction Contract) */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateVariant(printing.id, count - 1)}
              disabled={count === 0}
              aria-label={`Decrease ${printing.variantType} owned count`}
            >
              <Minus className="size-4" />
            </Button>

            {/* Count display input (UI-SPEC §Variant row anatomy) */}
            <Input
              type="number"
              value={count}
              onChange={(e) => updateVariant(printing.id, parseInt(e.target.value, 10) || 0)}
              className="w-16 text-center font-bold"
              aria-label={`${printing.variantType} owned count`}
            />

            {/* Plus button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateVariant(printing.id, count + 1)}
              aria-label={`Increase ${printing.variantType} owned count`}
            >
              <Plus className="size-4" />
            </Button>

            {/* Owned status indicator (UI-SPEC §Variant row anatomy) */}
            {count > 0 ? (
              <span className="text-sm font-bold text-primary">Owned</span>
            ) : (
              <span className="text-sm font-medium text-muted-foreground">Not owned</span>
            )}
          </div>
        );
      })}

      {/* Total line — below variant rows (D-12, UI-SPEC §Total line position) */}
      <div className="border-t border-border mt-2 pt-2 flex items-center gap-2">
        <span className="text-xs font-bold text-muted-foreground">Total:</span>
        <span className="text-sm font-bold text-foreground">{total} copies</span>
      </div>
    </div>
  );
}

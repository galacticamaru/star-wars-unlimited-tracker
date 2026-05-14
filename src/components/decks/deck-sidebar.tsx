'use client';

import { useMemo } from 'react';
import { Card, validateDeck, ValidationResult } from '@/lib/deck-validation';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Info, DollarSign } from 'lucide-react';
import { useCurrency } from '@/components/currency-context';
import { filterAndSortAspects } from '@/lib/aspect-panel';

interface DeckSidebarProps {
  name: string;
  leader: Card | null;
  base: Card | null;
  mainDeck: { card: Card; quantity: number }[];
  sideboard: { card: Card; quantity: number }[];
  isSaving?: boolean;
  onSave?: (isDraft: boolean) => void;
  apiErrors?: string[];
}

export function DeckSidebar({
  name,
  leader,
  base,
  mainDeck,
  sideboard,
  isSaving,
  onSave,
  apiErrors = [],
}: DeckSidebarProps) {
  const validation: ValidationResult = useMemo(
    () => validateDeck(leader, base, mainDeck, sideboard),
    [leader, base, mainDeck, sideboard]
  );

  const totalMain = mainDeck.reduce((sum, item) => sum + item.quantity, 0);
  const totalSideboard = sideboard.reduce((sum, item) => sum + item.quantity, 0);
  const { currency } = useCurrency();

  const totalValue = useMemo(() => {
    const getPrice = (card: Card | null) => {
      if (!card) return 0;
      return (currency === 'EUR' ? card.priceEur : card.priceUsd) || 0;
    };

    const leaderPrice = getPrice(leader);
    const basePrice = getPrice(base);
    const mainPrice = mainDeck.reduce((sum, item) => sum + getPrice(item.card) * item.quantity, 0);
    const sideboardPrice = sideboard.reduce((sum, item) => sum + getPrice(item.card) * item.quantity, 0);

    return (leaderPrice + basePrice + mainPrice + sideboardPrice) / 100;
  }, [leader, base, mainDeck, sideboard, currency]);

  const formattedValue = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency,
  }).format(totalValue);

  return (
    <div className="flex flex-col h-full bg-slate-50 border-l p-4 overflow-y-auto w-80">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2 truncate">{name}</h2>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {validation.isValid ? (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Legal
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="w-3 h-3 mr-1" /> Illegal
              </Badge>
            )}
            <span className="text-sm text-slate-500">
              {totalMain} / 50 main • {totalSideboard} / 10 sideboard
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-md border border-indigo-100">
            <DollarSign className="w-4 h-4" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold leading-none text-indigo-400">Estimated Value</span>
              <span className="text-sm font-bold leading-tight">{formattedValue}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* API Errors */}
        {apiErrors.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-red-500">Save Failed</h3>
            {apiErrors.map((error, i) => (
              <div key={i} className="flex gap-2 text-sm text-white bg-red-600 p-2 rounded shadow-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            ))}
          </div>
        )}

        {/* Validation Messages */}
        {(validation.errors.length > 0 || validation.warnings.length > 0) && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-slate-500">Rules</h3>
            {validation.errors.map((error, i) => (
              <div key={i} className="flex gap-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            ))}
            {validation.warnings.map((warning, i) => (
              <div key={i} className="flex gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                <Info className="w-4 h-4 shrink-0" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}

        {/* Stats: Cost Curve */}
        <div>
          <h3 className="text-sm font-semibold uppercase text-slate-500 mb-3">Cost Curve</h3>
          <div className="flex items-end gap-1 h-24 px-2 border-b border-l border-slate-200">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((cost) => {
              const count = validation.stats.costCurve[cost] || 0;
              const sbCount = validation.stats.sideboardCostCurve[cost] || 0;
              const mainHeight = Math.min((count / 12) * 100, 100);
              const sbHeight = Math.min((sbCount / 12) * 100, 100);
              return (
                <div key={cost} className="flex-1 h-full flex flex-col justify-end items-center gap-0 group">
                  {sbCount > 0 && (
                    <div
                      className="w-full bg-amber-400 rounded-t-sm"
                      style={{ height: `${Math.max(sbHeight, 4)}%` }}
                      title={`${sbCount} sideboard cards with cost ${cost}${cost === 9 ? '+' : ''}`}
                    />
                  )}
                  <div
                    className="w-full bg-slate-400 group-hover:bg-indigo-500 transition-all rounded-t-sm"
                    style={{ height: `${count > 0 ? Math.max(mainHeight, 4) : 0}%` }}
                    title={`${count} main deck cards with cost ${cost}${cost === 9 ? '+' : ''}`}
                  />
                  <span className="text-[10px] text-slate-400 leading-none mb-[-20px] pb-1">{cost === 9 ? '9+' : cost}</span>
                </div>
              );
            })}
          </div>
          {/* Legend — sits below the cost number labels (which pull down 20px via mb-[-20px]) */}
          <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-6">
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-slate-400" /> Main</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-400" /> Sideboard</span>
          </div>
        </div>

        {/* Stats: Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold uppercase text-slate-500 mb-2">Types</h3>
            <div className="space-y-1">
              {Object.entries(validation.stats.typeCounts).map(([type, count]) => (
                <div key={type} className="flex justify-between text-sm">
                  <span className="text-slate-600">{type}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase text-slate-500 mb-2">Arenas</h3>
            <div className="space-y-1">
              {Object.entries(validation.stats.arenaCounts).map(([arena, count]) => (
                <div key={arena} className="flex justify-between text-sm">
                  <span className="text-slate-600">{arena}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Aspect Breakdown Panel (D-04, D-05, D-06) */}
        {(() => {
          const aspects = filterAndSortAspects(validation.stats.aspectCounts);
          if (aspects.length === 0) return null;
          return (
            <div>
              <h3 className="text-sm font-semibold uppercase text-slate-500 mb-2">Aspects</h3>
              <div className="space-y-1">
                {aspects.map(([aspect, count]) => (
                  <div key={aspect} className="flex justify-between text-sm">
                    <span className="text-slate-600">{aspect}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      <div className="mt-auto pt-6 space-y-2">
        <button
          onClick={() => onSave?.(true)}
          disabled={isSaving}
          className="w-full py-2 px-4 border border-slate-300 rounded-md text-sm font-medium hover:bg-white transition-colors disabled:opacity-50"
        >
          Save as Draft
        </button>
        <button
          onClick={() => onSave?.(false)}
          disabled={isSaving || !validation.isValid}
          className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600"
        >
          Complete Deck
        </button>
      </div>
    </div>
  );
}

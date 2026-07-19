'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { authClient } from '@/lib/auth-client';
import { ManageTradeCard } from '@/components/binder/manage-trade-card';
import { ManageWantsList } from '@/components/binder/manage-wants-list';
import { VariantTradeSheet } from '@/components/binder/variant-trade-sheet';
import { ManualWantsAddFlow } from '@/components/binder/manual-wants-add-flow';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, Search, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  mergeCatalogWithOwnership,
  filterSearchCards,
  type CatalogRow,
} from '@/lib/binder/merge-search-cards';

interface Offering {
  cardPrintingId: number;
  tradeQuantity: number;
  name: string;
  type: string;
  frontArtUrl: string;
  variantType: string;
}

interface ManualWant {
  cardPrintingId: number;
  variantType: string;
  quantity: number;
  name: string;
  subtitle: string | null;
}

interface Exclusion {
  cardDefinitionId: number;
  name: string;
  subtitle: string | null;
}

interface AutoWant {
  cardDefinitionId: number;
  quantity: number;
  name: string;
  subtitle: string | null;
  isExcluded: boolean;
}

interface TradeData {
  offerings: Offering[];
  manualWants: ManualWant[];
  exclusions: Exclusion[];
  autoWants?: AutoWant[];
}

interface OwnedCardPrinting {
  id: number;            // cardPrintingId
  variantType: string;
  frontArtUrl: string | null;
  ownedCount: number;
  tradeQuantity: number;
}

interface OwnedCard {
  cardDefinitionId: number;
  name: string;
  subtitle: string | null;
  type: string;
  bestArtUrl: string | null;
  bestVariantType: string;
  printings: OwnedCardPrinting[];
}

export default function ManageBinderPage() {
  const { data: session, isPending } = authClient.useSession();
  const [username, setUsername] = useState('');
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [tradeData, setTradeData] = useState<TradeData | null>(null);
  const [ownedCards, setOwnedCards] = useState<OwnedCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Lazy first-keystroke catalog + owned-cards load (D-01/D-02): nothing catalog/collection-related
  // is fetched on mount — only /api/binder (Trade Offerings + ManageWantsList) loads eagerly.
  const [catalogRows, setCatalogRows] = useState<CatalogRow[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState(false);
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const hasFetchedCatalogRef = useRef(false);

  // Sheet state: which card tile was clicked
  const [sheetCard, setSheetCard] = useState<OwnedCard | null>(null);
  const sheetOpen = sheetCard !== null;
  const closeSheet = () => setSheetCard(null);

  useEffect(() => {
    if (session?.user) {
      setUsername(session.user.username || '');
    }
  }, [session?.user?.username]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const binderRes = await fetch('/api/binder');
        const binderData = await binderRes.json();
        setTradeData(binderData);
      } catch (err) {
        console.error('Failed to load binder data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchData();
    } else if (!isPending) {
      setIsLoading(false);
    }
  }, [session, isPending]);

  // 150ms debounce on the search term (matches the catalog page's search feel, PERF-01).
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetches the full catalog + owned cards exactly once, in parallel, on the first
  // keystroke that reaches the 2-char search gate (D-01). Re-callable on error (Retry).
  const fetchCatalogAndOwned = async () => {
    hasFetchedCatalogRef.current = true;
    setCatalogLoading(true);
    setCatalogError(false);
    try {
      const [catalogRes, ownedRes] = await Promise.all([
        fetch('/api/cards/all'),
        fetch('/api/collection/owned-cards'),
      ]);
      if (!catalogRes.ok || !ownedRes.ok) {
        throw new Error('Failed to load catalog or owned cards');
      }
      const [catalogData, ownedData] = await Promise.all([
        catalogRes.json(),
        ownedRes.json(),
      ]);
      setCatalogRows(catalogData);
      setOwnedCards(ownedData);
    } catch (err) {
      console.error('Failed to load catalog:', err);
      hasFetchedCatalogRef.current = false; // allow retry
      setCatalogError(true);
    } finally {
      setCatalogLoading(false);
    }
  };

  // Search input change handler: updates the term immediately (debounced above) and
  // triggers the fetched-once catalog+owned load the first time 2+ chars are reached.
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (value.trim().length >= 2 && !hasFetchedCatalogRef.current) {
      fetchCatalogAndOwned();
    }
  };

  // Merges the full catalog with per-user ownership/trade/want data into one card
  // per definition (D-03) — unowned cards remain searchable.
  const mergedCards = useMemo(
    () => mergeCatalogWithOwnership(catalogRows, ownedCards, tradeData?.manualWants ?? []),
    [catalogRows, ownedCards, tradeData?.manualWants]
  );

  const { results: searchResults, wasTruncated } = useMemo(
    () => filterSearchCards(mergedCards, debouncedTerm),
    [mergedCards, debouncedTerm]
  );

  // Re-fetches only /api/binder; used by ManualWantsAddFlow after adding a want
  const refreshTradeData = async () => {
    try {
      const res = await fetch('/api/binder');
      if (res.ok) {
        setTradeData(await res.json());
      }
    } catch (err) {
      console.error('Failed to refresh binder data:', err);
    }
  };

  const handleUpdateUsername = async () => {
    setIsUpdatingUsername(true);
    await authClient.updateUser({
      username: username.toLowerCase().trim(),
      displayUsername: username.trim()
    });
    setIsUpdatingUsername(false);
  };

  const updateTradeQuantity = async (cardPrintingId: number, tradeQuantity: number) => {
    const res = await fetch('/api/trade', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardPrintingId, tradeQuantity }),
    });
    if (res.ok) {
      // Update the tradeQuantity in ownedCards printings
      setOwnedCards(prev =>
        prev.map(card => ({
          ...card,
          printings: card.printings.map(p =>
            p.id === cardPrintingId ? { ...p, tradeQuantity } : p
          ),
        }))
      );

      // Update tradeData offerings
      setTradeData(prev => {
        if (!prev) return null;
        if (tradeQuantity === 0) {
          return {
            ...prev,
            offerings: prev.offerings.filter(o => o.cardPrintingId !== cardPrintingId),
          };
        } else {
          const existing = prev.offerings.find(o => o.cardPrintingId === cardPrintingId);
          if (existing) {
            return {
              ...prev,
              offerings: prev.offerings.map(o =>
                o.cardPrintingId === cardPrintingId ? { ...o, tradeQuantity } : o
              ),
            };
          } else {
            // Find card info from ownedCards for the new offering entry
            const card = ownedCards.find(c =>
              c.printings.some(p => p.id === cardPrintingId)
            );
            const printing = card?.printings.find(p => p.id === cardPrintingId);
            if (!card || !printing) return prev;
            return {
              ...prev,
              offerings: [
                ...prev.offerings,
                {
                  cardPrintingId,
                  tradeQuantity,
                  name: card.name,
                  type: card.type,
                  frontArtUrl: printing.frontArtUrl ?? '',
                  variantType: printing.variantType,
                },
              ],
            };
          }
        }
      });
    }
  };

  const updateWantQuantity = async (cardPrintingId: number, quantity: number) => {
    const res = await fetch('/api/binder/wants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardPrintingId, quantity }),
    });
    if (res.ok) {
      setTradeData(prev => {
        if (!prev) return null;
        if (quantity <= 0) {
          return {
            ...prev,
            manualWants: prev.manualWants.filter(w => w.cardPrintingId !== cardPrintingId)
          };
        } else {
          const existing = prev.manualWants.find(w => w.cardPrintingId === cardPrintingId);
          if (existing) {
            return {
              ...prev,
              manualWants: prev.manualWants.map(w =>
                w.cardPrintingId === cardPrintingId ? { ...w, quantity } : w
              )
            };
          } else {
            // Find card info from ownedCards first, then fall back to the merged
            // catalog dataset — a not-owned variant being wanted for the first time
            // won't be in ownedCards, but will be in mergedCards once the catalog
            // has loaded (D-01).
            const ownedCard = ownedCards.find(c =>
              c.printings.some(p => p.id === cardPrintingId)
            );
            const ownedPrinting = ownedCard?.printings.find(p => p.id === cardPrintingId);
            const mergedCard = mergedCards.find(c =>
              c.printings.some(p => p.id === cardPrintingId)
            );
            const mergedPrinting = mergedCard?.printings.find(p => p.id === cardPrintingId);

            const card = ownedCard ?? mergedCard;
            const printing = ownedPrinting ?? mergedPrinting;
            if (!card || !printing) return prev;
            return {
              ...prev,
              manualWants: [
                ...prev.manualWants,
                {
                  cardPrintingId,
                  variantType: printing.variantType,
                  quantity,
                  name: card.name,
                  subtitle: card.subtitle,
                },
              ],
            };
          }
        }
      });
    }
  };

  const toggleExclusion = async (cardDefinitionId: number, excluded: boolean) => {
    const res = await fetch('/api/binder/exclusions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardDefinitionId, excluded }),
    });
    if (res.ok) {
      setTradeData(prev => {
        if (!prev) return null;
        if (!excluded) {
          return {
            ...prev,
            exclusions: prev.exclusions.filter(e => e.cardDefinitionId !== cardDefinitionId),
            autoWants: prev.autoWants?.map(w =>
              w.cardDefinitionId === cardDefinitionId ? { ...w, isExcluded: false } : w
            ),
          };
        } else {
          // Source name/subtitle from autoWants (already carries both per cardDefinitionId)
          // instead of ownedCards, so exclusions work before any search has loaded owned
          // cards (D-01 — owned-cards fetch is now deferred to the first keystroke).
          const autoWant = prev.autoWants?.find(w => w.cardDefinitionId === cardDefinitionId);
          if (!autoWant) return prev;
          return {
            ...prev,
            exclusions: [
              ...prev.exclusions,
              { cardDefinitionId, name: autoWant.name, subtitle: autoWant.subtitle },
            ],
            autoWants: prev.autoWants?.map(w =>
              w.cardDefinitionId === cardDefinitionId ? { ...w, isExcluded: true } : w
            ),
          };
        }
      });
    }
  };

  // Filter owned cards by name/subtitle search (no min-length gating — show all when empty)
  const filteredCards = useMemo(() => {
    if (searchTerm.trim().length === 0) return ownedCards;
    const q = searchTerm.toLowerCase();
    return ownedCards.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        (c.subtitle?.toLowerCase().includes(q) ?? false)
    );
  }, [ownedCards, searchTerm]);

  if (isPending || isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
  if (!session) return <div className="p-8 max-w-2xl mx-auto"><Card><CardHeader><CardTitle>Unauthorized</CardTitle></CardHeader><CardContent><p>Please login to manage your trade binder.</p><Link href="/login" className={cn(buttonVariants({ className: "mt-4" }))}>Login</Link></CardContent></Card></div>;

  const publicUrl = session.user.username ? `/binder/${session.user.username}` : null;

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Trade Binder</h1>
          <p className="text-muted-foreground">Curate your public trade offerings and wants.</p>
        </div>
        {publicUrl && (
          <Link href={publicUrl} target="_blank" className={cn(buttonVariants({ variant: "outline" }))}>
            View Public Binder <ExternalLink className="ml-2 w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Trade Profile</CardTitle>
              <CardDescription>Set your public username for your binder URL.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <div className="flex-1">
                <Input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Choose a username..."
                />
                {publicUrl && (
                  <p className="text-[10px] mt-1 text-muted-foreground">
                    Your binder will be at: swu-tracker.com/binder/{session.user.username}
                  </p>
                )}
              </div>
              <Button
                onClick={handleUpdateUsername}
                disabled={isUpdatingUsername || username === (session.user.username || '')}
              >
                {isUpdatingUsername && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Update
              </Button>
            </CardContent>
          </Card>

          {/* Add Cards to Binder — owned-card browse grid (BINDER-09 / D-13) */}
          <Card>
            <CardHeader>
              <CardTitle>Add Cards to Binder</CardTitle>
              <CardDescription>
                Cards from your collection. Click a tile to set trade quantities.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Search your collection..."
                  className="pl-9"
                />
              </div>

              {ownedCards.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed rounded-lg space-y-1">
                  <p className="text-sm font-semibold">No cards found</p>
                  <p className="text-xs text-muted-foreground">
                    Your collection is empty. Add cards to your collection to offer them for trade.
                  </p>
                </div>
              ) : filteredCards.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed rounded-lg space-y-1">
                  <p className="text-sm font-semibold">No cards found</p>
                  <p className="text-xs text-muted-foreground">
                    Try a different search term, or add cards to your collection first.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredCards.map(card => {
                    // Determine the trade quantity to show on the tile badge
                    // For single-printing cards, use that printing's tradeQuantity
                    // For multi-printing cards, show sum of all tradeQuantities
                    const totalTradeQty = card.printings.reduce(
                      (sum, p) => sum + p.tradeQuantity,
                      0
                    );

                    return (
                      <div
                        key={card.cardDefinitionId}
                        className="cursor-pointer"
                        onClick={() => setSheetCard(card)}
                      >
                        <ManageTradeCard
                          id={
                            card.printings.length === 1
                              ? card.printings[0].id
                              : card.cardDefinitionId
                          }
                          name={card.name}
                          type={card.type}
                          frontArtUrl={card.bestArtUrl}
                          tradeQuantity={totalTradeQty}
                          variantType={card.bestVariantType}
                          onUpdateTradeQuantity={
                            card.printings.length === 1
                              ? (_, qty) => updateTradeQuantity(card.printings[0].id, qty)
                              : () => setSheetCard(card)
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trade Offerings grid */}
          <section>
            <h2 className="text-xl font-bold mb-4">
              Trade Offerings ({tradeData?.offerings.length || 0})
            </h2>
            {tradeData?.offerings.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-12 text-center border-2 border-dashed rounded-lg">
                No cards marked for trade yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {tradeData?.offerings.map(card => (
                  <ManageTradeCard
                    key={card.cardPrintingId}
                    id={card.cardPrintingId}
                    {...card}
                    onUpdateTradeQuantity={updateTradeQuantity}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          {/* Manual Wants Add Flow (BINDER-07 / D-07) */}
          <Card>
            <CardHeader>
              <CardTitle>Add Manual Want</CardTitle>
              <CardDescription>
                Search your collection, pick a variant, and add it to your wants list.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ManualWantsAddFlow
                ownedCards={ownedCards}
                onWantAdded={refreshTradeData}
              />
            </CardContent>
          </Card>

          <ManageWantsList
            wants={tradeData?.manualWants || []}
            exclusions={tradeData?.exclusions || []}
            autoWants={tradeData?.autoWants || []}
            onUpdateWantQuantity={updateWantQuantity}
            onRemoveWant={(id) => updateWantQuantity(id, 0)}
            onRemoveExclusion={(id) => toggleExclusion(id, false)}
            onToggleExclusion={toggleExclusion}
          />
        </div>
      </div>

      {/* VariantTradeSheet — controlled by sheetCard state */}
      <VariantTradeSheet
        open={sheetOpen}
        onOpenChange={(o) => { if (!o) closeSheet(); }}
        cardName={sheetCard?.name ?? ''}
        cardSubtitle={sheetCard?.subtitle ?? null}
        printings={
          sheetCard
            ? sheetCard.printings.filter(p => p.ownedCount > 0).map(p => ({
                ...p,
                quantity: tradeData?.manualWants.find(w => w.cardPrintingId === p.id)?.quantity ?? 0,
              }))
            : []
        }
        onTradeQuantityChange={updateTradeQuantity}
        onWantQuantityChange={updateWantQuantity}
      />
    </div>
  );
}

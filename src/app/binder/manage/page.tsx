'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { authClient } from '@/lib/auth-client';
import { ManageTradeCard } from '@/components/binder/manage-trade-card';
import { ManageWantsList } from '@/components/binder/manage-wants-list';
import { VariantTradeSheet } from '@/components/binder/variant-trade-sheet';
import { ProfileModal } from '@/components/binder/profile-modal';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, Search, ExternalLink, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  mergeCatalogWithOwnership,
  filterSearchCards,
  type CatalogRow,
  type MergedCard,
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
  const [profileOpen, setProfileOpen] = useState(false);
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

  // Sheet state: which card tile was clicked (typed as the merged card so the sheet
  // receives every variant — owned and unowned — per D-05)
  const [sheetCard, setSheetCard] = useState<MergedCard | null>(null);
  const sheetOpen = sheetCard !== null;
  const closeSheet = () => setSheetCard(null);

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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <UserCog className="mr-2 w-4 h-4" /> Trade Profile
          </button>
          {publicUrl && (
            <Link href={publicUrl} target="_blank" className={cn(buttonVariants({ variant: "outline" }))}>
              View Public Binder <ExternalLink className="ml-2 w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Add Cards & Wants — unified catalog search (BINDER-10/11/12, D-01 through D-08) */}
          <Card>
            <CardHeader>
              <CardTitle>Add Cards & Wants</CardTitle>
              <CardDescription>
                Search the full card catalog — add owned variants to your trade binder, or want any variant.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Search all cards..."
                  className="pl-9"
                />
              </div>

              {searchTerm.trim().length < 2 ? (
                <p className="text-sm text-muted-foreground">
                  Type at least 2 characters to search the catalog.
                </p>
              ) : catalogLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <p className="text-sm">Loading catalog...</p>
                </div>
              ) : catalogError ? (
                <div className="py-12 text-center border-2 border-dashed rounded-lg space-y-2">
                  <p className="text-sm font-semibold">Couldn&apos;t load the catalog</p>
                  <p className="text-xs text-muted-foreground">
                    Check your connection and try again.
                  </p>
                  <Button variant="outline" size="sm" onClick={fetchCatalogAndOwned}>
                    Retry
                  </Button>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed rounded-lg space-y-1">
                  <p className="text-sm font-semibold">No cards found</p>
                  <p className="text-xs text-muted-foreground">Try a different search term.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {searchResults.map(card => {
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
                  {wasTruncated && (
                    <p className="text-xs text-muted-foreground text-center">
                      Showing top 20 matches — refine your search to narrow results.
                    </p>
                  )}
                </>
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
          <ManageWantsList
            wants={tradeData?.manualWants || []}
            autoWants={tradeData?.autoWants || []}
            onUpdateWantQuantity={updateWantQuantity}
            onRemoveWant={(id) => updateWantQuantity(id, 0)}
            onToggleExclusion={toggleExclusion}
          />
        </div>
      </div>

      {/* VariantTradeSheet — controlled by sheetCard state. Printings are re-looked-up from
          the live mergedCards on every render (falling back to the sheetCard snapshot) so
          ownedCount/tradeQuantity/quantity stay fresh while the sheet is open (D-05: all
          variants — owned and unowned — render, unfiltered). */}
      <VariantTradeSheet
        open={sheetOpen}
        onOpenChange={(o) => { if (!o) closeSheet(); }}
        cardName={sheetCard?.name ?? ''}
        cardSubtitle={sheetCard?.subtitle ?? null}
        printings={
          sheetCard
            ? (mergedCards.find(c => c.cardDefinitionId === sheetCard.cardDefinitionId)?.printings
                ?? sheetCard.printings)
            : []
        }
        onTradeQuantityChange={updateTradeQuantity}
        onWantQuantityChange={updateWantQuantity}
      />

      <ProfileModal
        open={profileOpen}
        onOpenChange={setProfileOpen}
        currentUsername={session.user.username ?? ''}
        currentTradeNote={session.user.tradeNote ?? ''}
      />
    </div>
  );
}

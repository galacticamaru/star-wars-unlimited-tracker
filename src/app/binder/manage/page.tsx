'use client';

import { useState, useEffect, useMemo } from 'react';
import { authClient } from '@/lib/auth-client';
import { ManageTradeCard } from '@/components/binder/manage-trade-card';
import { ManageWantsList } from '@/components/binder/manage-wants-list';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, Search, ExternalLink, Plus, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function ManageBinderPage() {
  const { data: session, isPending } = authClient.useSession();
  const [username, setUsername] = useState('');
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [tradeData, setTradeData] = useState<any>(null);
  const [allCards, setAllCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      const [binderRes, cardsRes] = await Promise.all([
        fetch('/api/binder'),
        fetch('/api/cards/all')
      ]);
      const [binderData, cardsData] = await Promise.all([
        binderRes.json(),
        cardsRes.json()
      ]);
      setTradeData(binderData);
      setAllCards(cardsData);
    } catch (err) {
      console.error('Failed to load binder data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      setUsername(session.user.username || '');
      fetchData();
    } else if (!isPending) {
      setIsLoading(false);
    }
  }, [session, isPending]);

  const handleUpdateUsername = async () => {
    setIsUpdatingUsername(true);
    await authClient.updateUser({
      username: username.toLowerCase().trim(),
      displayUsername: username.trim()
    });
    setIsUpdatingUsername(false);
  };

  const updateTradeQuantity = async (cardDefinitionId: number, tradeQuantity: number) => {
    const res = await fetch('/api/trade', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardDefinitionId, tradeQuantity }),
    });
    if (res.ok) {
      if (tradeQuantity === 0) {
        setTradeData((prev: any) => ({
          ...prev,
          offerings: prev.offerings.filter((o: any) => o.cardDefinitionId !== cardDefinitionId)
        }));
      } else {
        const existing = tradeData.offerings.find((o: any) => o.cardDefinitionId === cardDefinitionId);
        if (existing) {
          setTradeData((prev: any) => ({
            ...prev,
            offerings: prev.offerings.map((o: any) => o.cardDefinitionId === cardDefinitionId ? { ...o, tradeQuantity } : o)
          }));
        } else {
          const card = allCards.find(c => c.id === cardDefinitionId);
          setTradeData((prev: any) => ({
            ...prev,
            offerings: [...prev.offerings, { cardDefinitionId, tradeQuantity, name: card.name, type: card.type, frontArtUrl: card.frontArtUrl }]
          }));
        }
      }
    }
  };

  const updateWantQuantity = async (cardDefinitionId: number, quantity: number) => {
    const res = await fetch('/api/binder/wants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardDefinitionId, quantity }),
    });
    if (res.ok) {
      if (quantity <= 0) {
        setTradeData((prev: any) => ({
          ...prev,
          manualWants: prev.manualWants.filter((w: any) => w.cardDefinitionId !== cardDefinitionId)
        }));
      } else {
        const existing = tradeData.manualWants.find((w: any) => w.cardDefinitionId === cardDefinitionId);
        if (existing) {
          setTradeData((prev: any) => ({
            ...prev,
            manualWants: prev.manualWants.map((w: any) => w.cardDefinitionId === cardDefinitionId ? { ...w, quantity } : w)
          }));
        } else {
          const card = allCards.find(c => c.id === cardDefinitionId);
          setTradeData((prev: any) => ({
            ...prev,
            manualWants: [...prev.manualWants, { cardDefinitionId, quantity, name: card.name, subtitle: card.subtitle ?? null }]
          }));
        }
      }
    }
  };

  const toggleExclusion = async (cardDefinitionId: number, excluded: boolean) => {
    const res = await fetch('/api/binder/exclusions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardDefinitionId, excluded }),
    });
    if (res.ok) {
      if (!excluded) {
        setTradeData((prev: any) => ({
          ...prev,
          exclusions: prev.exclusions.filter((e: any) => e.cardDefinitionId !== cardDefinitionId),
          autoWants: prev.autoWants?.map((w: any) =>
            w.cardDefinitionId === cardDefinitionId ? { ...w, isExcluded: false } : w
          ),
        }));
      } else {
        const card = allCards.find(c => c.id === cardDefinitionId);
        setTradeData((prev: any) => ({
          ...prev,
          exclusions: [...prev.exclusions, { cardDefinitionId, name: card.name, subtitle: card.subtitle ?? null }],
          autoWants: prev.autoWants?.map((w: any) =>
            w.cardDefinitionId === cardDefinitionId ? { ...w, isExcluded: true } : w
          ),
        }));
      }
    }
  };

  const filteredCards = useMemo(() => {
    if (searchTerm.length < 2) return [];
    return allCards.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);
  }, [allCards, searchTerm]);

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
                {publicUrl && <p className="text-[10px] mt-1 text-muted-foreground">Your binder will be at: swu-tracker.com/binder/{session.user.username}</p>}
              </div>
              <Button onClick={handleUpdateUsername} disabled={isUpdatingUsername || username === (session.user.username || '')}>
                {isUpdatingUsername && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Update
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Cards</CardTitle>
              <CardDescription>Search for cards to add to your trade binder or wants.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  placeholder="Search cards by name..." 
                  className="pl-9"
                />
              </div>

              {filteredCards.length > 0 && (
                <div className="border rounded-md divide-y overflow-hidden">
                  {filteredCards.map(card => (
                    <div key={card.id} className="flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{card.name}</p>
                        {card.subtitle && <p className="text-[10px] text-muted-foreground">{card.subtitle}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => updateTradeQuantity(card.id, 1)}>
                          <Plus className="w-3 h-3 mr-1" /> Trade
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => updateWantQuantity(card.id, 1)}>
                          <Plus className="w-3 h-3 mr-1" /> Want
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => toggleExclusion(card.id, true)}>
                          <Ban className="w-3 h-3 mr-1" /> Exclude
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <section>
            <h2 className="text-xl font-bold mb-4">Trade Offerings ({tradeData?.offerings.length || 0})</h2>
            {tradeData?.offerings.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-12 text-center border-2 border-dashed rounded-lg">
                No cards marked for trade yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {tradeData?.offerings.map((card: any) => (
                  <ManageTradeCard 
                    key={card.cardDefinitionId} 
                    id={card.cardDefinitionId}
                    {...card} 
                    onUpdateTradeQuantity={updateTradeQuantity}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <div>
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
    </div>
  );
}

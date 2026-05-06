'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardItem } from '@/components/catalog/card-item';

interface Deck {
  id: number;
  name: string;
  updatedAt: string;
}

interface WantListEntry {
  cardDefinitionId: number;
  name: string;
  type: string;
  setCode: string;
  collectorNumber: string;
  frontArtUrl: string | null;
  backArtUrl: string | null;
  maxQuantity: number;
  owned: number;
  shortfall: number;
}

const TYPE_ORDER = ['Leader', 'Base', 'Unit', 'Event', 'Upgrade'];

export default function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDeckName, setNewDeckName] = useState('');
  const [wantList, setWantList] = useState<WantListEntry[]>([]);
  const [wantListLoading, setWantListLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDecks();
  }, []);

  useEffect(() => {
    fetch('/api/want-list')
      .then(res => res.json())
      .then(data => {
        setWantList(data);
        setWantListLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch want list', err);
        setWantListLoading(false);
      });
  }, []);

  const groupedWantList = useMemo(() => {
    const map = new Map<string, WantListEntry[]>();
    for (const entry of wantList) {
      if (!map.has(entry.type)) map.set(entry.type, []);
      map.get(entry.type)!.push(entry);
    }
    return [...map.entries()].sort(([a], [b]) => {
      const ai = TYPE_ORDER.indexOf(a);
      const bi = TYPE_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [wantList]);

  async function fetchDecks() {
    try {
      const res = await fetch('/api/decks');
      if (res.ok) {
        const data = await res.json();
        setDecks(data);
      }
    } catch (err) {
      console.error('Failed to fetch decks', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDeck(e: React.FormEvent) {
    e.preventDefault();
    if (!newDeckName.trim()) return;

    try {
      const res = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDeckName }),
      });

      if (res.ok) {
        const deck = await res.json();
        router.push(`/decks/${deck.id}`);
      }
    } catch (err) {
      console.error('Failed to create deck', err);
    }
  }

  async function handleDeleteDeck(id: number) {
    if (!confirm('Are you sure you want to delete this deck?')) return;

    try {
      const res = await fetch(`/api/decks/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDecks(decks.filter((d) => d.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete deck', err);
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold font-heading">My Decks</h1>
        <form onSubmit={handleCreateDeck} className="flex w-full sm:w-auto gap-2">
          <Input
            placeholder="New deck name..."
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
            className="flex-1 sm:w-64"
          />
          <Button type="submit">Create New Deck</Button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <p className="text-slate-500">Loading decks...</p>
        </div>
      ) : decks.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-slate-500 mb-4">No decks found. Create your first one above!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {decks.map((deck) => (
            <div
              key={deck.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors bg-white shadow-sm"
            >
              <div>
                <h2 className="text-xl font-semibold">{deck.name}</h2>
                <p className="text-sm text-slate-500">
                  Last updated: {new Date(deck.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/decks/${deck.id}`)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteDeck(deck.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Combined Want List — "What I Need to Buy" (D-05, D-07, D-08) */}
      {decks.length > 0 && (wantListLoading || wantList.length > 0) && (
        <div className="mt-12">
          <h2 className="text-xl font-heading font-semibold mb-2">What I Need to Buy</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {wantListLoading
              ? 'Calculating...'
              : `${wantList.length} cards needed, ${wantList.reduce((s, c) => s + c.shortfall, 0)} total copies short`}
          </p>
          {wantListLoading ? (
            <div className="grid gap-2 grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : (
            groupedWantList.map(([typeName, entries]) => (
              <div key={typeName} className="mb-6">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-muted pb-1 mb-2">
                  {typeName}
                </h3>
                <div className="grid gap-2 grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9">
                  {entries.map(entry => (
                    <CardItem
                      key={entry.cardDefinitionId}
                      id={entry.cardDefinitionId}
                      name={entry.name}
                      type={entry.type}
                      setCode={entry.setCode}
                      collectorNumber={entry.collectorNumber}
                      frontArtUrl={entry.frontArtUrl}
                      backArtUrl={entry.backArtUrl}
                      ownedCount={entry.owned}
                      onUpdateCount={() => {}}
                      mode="want-list"
                      deckQuantity={entry.maxQuantity}
                      shortfall={entry.shortfall}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

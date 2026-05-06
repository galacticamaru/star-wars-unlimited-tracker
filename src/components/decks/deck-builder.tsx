'use client';

import { useReducer, useState, useMemo, useEffect, useRef } from 'react';
import { Card, DeckCard } from '@/lib/deck-validation';
import { DeckSidebar } from './deck-sidebar';
import { Button, buttonVariants } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { CatalogClient } from '@/components/catalog/catalog-client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";

interface DeckState {
  id: number;
  name: string;
  leaderCardDefinitionId: number | null;
  baseCardDefinitionId: number | null;
  isDraft: boolean;
  cards: { cardDefinitionId: number; quantity: number; isSideboard: boolean }[];
}

type DeckAction =
  | { type: 'SET_DECK'; payload: DeckState }
  | { type: 'SET_NAME'; payload: string }
  | { type: 'SET_LEADER'; payload: number | null }
  | { type: 'SET_BASE'; payload: number | null }
  | { type: 'UPDATE_CARD'; payload: { cardDefinitionId: number; quantity: number; isSideboard: boolean } }
  | { type: 'REMOVE_CARD'; payload: { cardDefinitionId: number; isSideboard: boolean } };

function deckReducer(state: DeckState, action: DeckAction): DeckState {
  switch (action.type) {
    case 'SET_DECK':
      return action.payload;
    case 'SET_NAME':
      return { ...state, name: action.payload };
    case 'SET_LEADER':
      return { ...state, leaderCardDefinitionId: action.payload };
    case 'SET_BASE':
      return { ...state, baseCardDefinitionId: action.payload };
    case 'UPDATE_CARD': {
      const existingIndex = state.cards.findIndex(
        (c) => c.cardDefinitionId === action.payload.cardDefinitionId && c.isSideboard === action.payload.isSideboard
      );
      const newCards = [...state.cards];
      if (existingIndex >= 0) {
        if (action.payload.quantity <= 0) {
          newCards.splice(existingIndex, 1);
        } else {
          newCards[existingIndex] = { ...newCards[existingIndex], quantity: action.payload.quantity };
        }
      } else if (action.payload.quantity > 0) {
        newCards.push(action.payload);
      }
      return { ...state, cards: newCards };
    }
    case 'REMOVE_CARD': {
      const newCards = state.cards.filter(
        (c) => !(c.cardDefinitionId === action.payload.cardDefinitionId && c.isSideboard === action.payload.isSideboard)
      );
      return { ...state, cards: newCards };
    }
    default:
      return state;
  }
}

interface DeckBuilderProps {
  initialDeck: DeckState;
  allCards: Card[];
  filterOptions: { sets: string[]; types: string[] };
}

export function DeckBuilder({ initialDeck, allCards, filterOptions }: DeckBuilderProps) {
  const [state, dispatch] = useReducer(deckReducer, initialDeck);
  const [isSaving, setIsSaving] = useState(false);
  const [view, setView] = useState<'editor' | 'catalog'>('catalog');
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const router = useRouter();
  const cleanStateRef = useRef(initialDeck);

  const isDirty = useMemo(
    () => JSON.stringify(state) !== JSON.stringify(cleanStateRef.current),
    [state]
  );

  // Tab/window close — only when dirty
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Browser back/forward — intercept with pushState trick when dirty
  useEffect(() => {
    if (!isDirty) return;
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      if (window.confirm('You have unsaved changes. Leave without saving?')) {
        window.removeEventListener('popstate', handlePopState);
        window.history.back();
      } else {
        window.history.pushState(null, '', window.location.href);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isDirty]);

  const cardMap = useMemo(() => {
    const map = new Map<number, Card>();
    allCards.forEach((c) => map.set(c.id, c));
    return map;
  }, [allCards]);

  const leader = state.leaderCardDefinitionId ? cardMap.get(state.leaderCardDefinitionId) || null : null;
  const base = state.baseCardDefinitionId ? cardMap.get(state.baseCardDefinitionId) || null : null;

  const mainDeck: DeckCard[] = useMemo(() => 
    state.cards
      .filter((c) => !c.isSideboard)
      .map((c) => {
        const card = cardMap.get(c.cardDefinitionId);
        return card ? { card, quantity: c.quantity } : null;
      })
      .filter((c): c is DeckCard => !!c),
    [state.cards, cardMap]
  );

  const sideboard: DeckCard[] = useMemo(() => 
    state.cards
      .filter((c) => c.isSideboard)
      .map((c) => {
        const card = cardMap.get(c.cardDefinitionId);
        return card ? { card, quantity: c.quantity } : null;
      })
      .filter((c): c is DeckCard => !!c),
    [state.cards, cardMap]
  );

  const deckCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    state.cards.forEach(c => {
        if (!c.isSideboard) {
            counts[c.cardDefinitionId] = (counts[c.cardDefinitionId] || 0) + c.quantity;
        }
    });
    return counts;
  }, [state.cards]);

  const handleDeckUpdate = (cardDefinitionId: number, quantity: number) => {
    const card = cardMap.get(cardDefinitionId);
    if (!card) return;

    if (card.type === 'Leader') {
        dispatch({ type: 'SET_LEADER', payload: quantity > 0 ? cardDefinitionId : null });
    } else if (card.type === 'Base') {
        dispatch({ type: 'SET_BASE', payload: quantity > 0 ? cardDefinitionId : null });
    } else {
        dispatch({ type: 'UPDATE_CARD', payload: { cardDefinitionId, quantity, isSideboard: false } });
    }
  };

  const handleSave = async (isDraft: boolean) => {
    setIsSaving(true);
    setApiErrors([]);
    try {
      const res = await fetch(`/api/decks/${state.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.name,
          leaderCardDefinitionId: state.leaderCardDefinitionId,
          baseCardDefinitionId: state.baseCardDefinitionId,
          isDraft,
          cards: state.cards,
        }),
      });

      if (res.ok) {
        cleanStateRef.current = { ...state, isDraft };
        if (!isDraft) {
          router.push('/decks');
        }
      } else if (res.status === 400) {
        const data = await res.json();
        setApiErrors(data.errors || ['Failed to save deck']);
      }
    } catch (err) {
      console.error('Failed to save deck', err);
      setApiErrors(['Network error. Please try again.']);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="border-b bg-white p-4 flex justify-between items-center shadow-sm z-10">
          <div className="flex items-center gap-4 flex-1">
            <input 
              value={state.name} 
              onChange={(e) => dispatch({ type: 'SET_NAME', payload: e.target.value })}
              className="text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-slate-200 rounded px-1 w-full max-w-md"
              placeholder="Deck Name"
            />
            <div className="flex bg-slate-100 rounded-lg p-1">
                <Button 
                    variant={view === 'catalog' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => setView('catalog')}
                    className={view === 'catalog' ? 'bg-white shadow-sm' : ''}
                >
                    Add Cards
                </Button>
                <Button 
                    variant={view === 'editor' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => setView('editor')}
                    className={view === 'editor' ? 'bg-white shadow-sm' : ''}
                >
                    Deck List
                </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger className={buttonVariants({ variant: "outline", size: "sm" })}>
                <Download className="w-4 h-4 mr-2" /> Export
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => window.open(`/api/decks/${state.id}/export?format=melee`, '_blank')}>
                  Melee (.txt)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(`/api/decks/${state.id}/export?format=json`, '_blank')}>
                  JSON (.json)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={() => {
              if (isDirty && !window.confirm('You have unsaved changes. Leave without saving?')) return;
              router.push('/decks');
            }}>Back</Button>
          </div>
        </div>

        {/* Builder Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          {view === 'catalog' ? (
              <CatalogClient 
                cards={allCards} 
                filterOptions={filterOptions} 
                mode="selector" 
                deckCounts={deckCounts}
                onDeckUpdate={handleDeckUpdate}
              />
          ) : (
            <div className="max-w-4xl mx-auto space-y-8 p-6 pb-20">
                {/* Leader & Base Slot */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500">Leader</label>
                    <div className="aspect-[3/4] border-2 border-dashed rounded-lg flex items-center justify-center bg-white shadow-sm overflow-hidden">
                    {leader ? (
                        <div className="text-center p-4">
                        <p className="font-bold text-lg">{leader.name}</p>
                        {leader.subtitle && <p className="text-sm text-slate-500">{leader.subtitle}</p>}
                        <Button variant="ghost" size="sm" className="mt-4 text-red-500 hover:text-red-700" onClick={() => dispatch({ type: 'SET_LEADER', payload: null })}>Remove</Button>
                        </div>
                    ) : (
                        <p className="text-slate-400 text-sm">No Leader Selected</p>
                    )}
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500">Base</label>
                    <div className="aspect-[3/4] md:aspect-[4/3] border-2 border-dashed rounded-lg flex items-center justify-center bg-white shadow-sm overflow-hidden">
                    {base ? (
                        <div className="text-center p-4">
                        <p className="font-bold text-lg">{base.name}</p>
                        <Button variant="ghost" size="sm" className="mt-4 text-red-500 hover:text-red-700" onClick={() => dispatch({ type: 'SET_BASE', payload: null })}>Remove</Button>
                        </div>
                    ) : (
                        <p className="text-slate-400 text-sm">No Base Selected</p>
                    )}
                    </div>
                </div>
                </div>

                {/* Card List */}
                <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold">Main Deck ({mainDeck.reduce((s,i) => s + i.quantity, 0)})</h3>
                </div>
                <div className="bg-white border rounded-lg divide-y shadow-sm">
                    {mainDeck.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <p className="mb-4">Empty deck.</p>
                        <Button onClick={() => setView('catalog')}>Switch to Catalog</Button>
                    </div>
                    ) : (
                    mainDeck.map((item) => (
                        <div key={item.card.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center font-bold text-indigo-600">
                            {item.quantity}x
                            </div>
                            <div>
                            <p className="font-medium">{item.card.name}</p>
                            <p className="text-xs text-slate-500">{item.card.type} • {item.card.cost} Cost</p>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => dispatch({ type: 'UPDATE_CARD', payload: { cardDefinitionId: item.card.id, quantity: item.quantity - 1, isSideboard: false } })}>-</Button>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => dispatch({ type: 'UPDATE_CARD', payload: { cardDefinitionId: item.card.id, quantity: item.quantity + 1, isSideboard: false } })}>+</Button>
                        </div>
                        </div>
                    ))
                    )}
                </div>
                </div>
            </div>
          )}
        </div>
      </div>

      <DeckSidebar 
        name={state.name}
        leader={leader}
        base={base}
        mainDeck={mainDeck}
        sideboard={sideboard}
        isSaving={isSaving}
        onSave={handleSave}
        apiErrors={apiErrors}
      />
    </div>
  );
}



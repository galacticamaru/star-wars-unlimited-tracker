'use client'

import { useMemo, useEffect, useState } from 'react';
import { useQueryState, parseAsString, parseAsArrayOf, parseAsBoolean } from 'nuqs';
import { filterCards, type CardForFilter } from '@/lib/filter-cards';
import type { AutoFilter } from '@/lib/auto-filter';
import { TopBar } from './top-bar';
import { CardGrid } from './card-grid';
import { EmptyState } from './empty-state';
import { authClient } from "@/lib/auth-client";
import { useRouter } from 'next/navigation';
import { SidebarFilters } from './sidebar-filters';
import { MobileFilterSheet } from './mobile-filter-sheet';

interface FilterOptions {
  sets: string[];
  types: string[];
}

interface CatalogClientProps {
  cards: CardForFilter[];
  filterOptions: FilterOptions;
  mode?: 'catalog' | 'selector';
  deckCounts?: Record<number, number>;
  onDeckUpdate?: (cardDefinitionId: number, count: number) => void;
  topOffset?: string;
  autoFilter?: AutoFilter | null;
  isAutoFilterOverridden?: boolean;
  onFilterManualChange?: () => void;
  autoFilterLabel?: string | null;
}

const RARITY_OPTIONS = ['(C) Common', '(U) Uncommon', '(R) Rare', '(L) Legendary'];
const COST_OPTIONS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9+'];
const ARENA_OPTIONS = ['Ground', 'Space'];
const KEYWORD_OPTIONS = [
  'Ambush', 'Bounty', 'Coordinate', 'Exploit', 'Grit', 'Hidden', 
  'Overwhelm', 'Piloting', 'Plot', 'Raid', 'Restore', 'Saboteur', 
  'Sentinel', 'Shielded', 'Smuggle', 'Support'
];
const TRAIT_OPTIONS = [
  'ARMOR', 'BOUNTY', 'BOUNTY HUNTER', 'CAPITAL SHIP', 'CLONE', 'CONDITION',
  'CREATURE', 'DISASTER', 'DROID', 'EWOK', 'FIGHTER', 'FIRST ORDER',
  'FORCE', 'FRINGE', 'GAMBIT', 'GUNGAN', 'HUTT', 'IMPERIAL',
  'INNATE', 'INQUISITOR', 'ITEM', 'JAWA', 'JEDI', 'KAMINOAN',
  'LAW', 'LEARNED', 'LIGHTSABER', 'MANDALORIAN', 'MODIFICATION', 'MUSICIAN',
  'NABOO', 'NEW REPUBLIC', 'NIGHT', 'NIHIL', 'OFFICER', 'OFFICIAL',
  'PILOT', 'PLAN', 'REBEL', 'REPUBLIC', 'RESISTANCE', 'SEPARATIST',
  'SITH', 'SPECTRE', 'SPEEDER', 'SUPPLY', 'TACTIC', 'TANK',
  'TRANSPORT', 'TRICK', 'TROOPER', 'TUSKEN', "TWI'LEK", 'UNDEAD',
  'UNDERWORLD', 'VEHICLE', 'WALKER', 'WEAPON', 'WOOKIEE'
];

export function CatalogClient({
  cards,
  filterOptions,
  mode = 'catalog',
  deckCounts,
  onDeckUpdate,
  autoFilter,
  isAutoFilterOverridden = false,
  onFilterManualChange,
  autoFilterLabel,
}: CatalogClientProps) {
  const [collection, setCollection] = useState<Record<number, number>>({});
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const isAuthenticated = !!session;

  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/collection')
        .then(res => res.json())
        .then(data => setCollection(data))
        .catch(err => console.error('Failed to load collection:', err));
    } else {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      setTimeout(() => setCollection({}), 0);
    }
  }, [isAuthenticated]);

  // Auto-filter injection (Phase 16, D-01/D-02): when the parent passes an autoFilter and the user
  // has not yet manually overridden it, push the auto-filter values into our nuqs state.
  // Deps are intentionally [autoFilter, isAutoFilterOverridden] only — including the nuqs setters
  // or selectedTypes/selectedAspects would create an infinite loop (RESEARCH.md Pitfall 1).
  useEffect(() => {
    if (isAutoFilterOverridden || !autoFilter) return;
    if (autoFilter.types !== undefined) {
      setSelectedTypes(autoFilter.types);
    }
    if (autoFilter.aspects !== undefined) {
      setSelectedAspects(autoFilter.aspects);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFilter, isAutoFilterOverridden]);

  const handleUpdateCount = async (cardDefinitionId: number, newCount: number) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Optimistic update
    setCollection(prev => ({ ...prev, [cardDefinitionId]: newCount }));

    try {
      const res = await fetch('/api/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardDefinitionId, count: newCount }),
      });
      if (!res.ok) throw new Error('Failed to update');
    } catch (err) {
      console.error(err);
    }
  };

  const [search, setSearch] = useQueryState('q', parseAsString.withDefault('').withOptions({ shallow: true }));
  const [selectedSets, setSelectedSets] = useQueryState('sets', parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: true }));
  const [selectedTypes, setSelectedTypes] = useQueryState('types', parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: true }));
  const [selectedAspects, setSelectedAspects] = useQueryState('aspects', parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: true }));
  const [selectedArenas, setSelectedArenas] = useQueryState('arenas', parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: true }));
  const [selectedTraits, setSelectedTraits] = useQueryState('traits', parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: true }));
  const [selectedRarities, setSelectedRarities] = useQueryState('rarities', parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: true }));
  const [selectedKeywords, setSelectedKeywords] = useQueryState('keywords', parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: true }));
  const [selectedCosts, setSelectedCosts] = useQueryState('costs', parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: true }));
  const [selectedVariants, setSelectedVariants] = useQueryState('variants', parseAsArrayOf(parseAsString).withDefault(['Normal']).withOptions({ shallow: true }));
  const [ownedOnly, setOwnedOnly] = useQueryState(
    'owned',
    parseAsBoolean.withDefault(false).withOptions({ shallow: true })
  );

  // Derive distinct options client-side — avoids PostgreSQL unnest complexity
  const aspectOptions = useMemo(() => [...new Set(cards.flatMap(c => c.aspects))].sort(), [cards]);

  const filtered = useMemo(
    () => filterCards(
      cards,
      {
        search,
        selectedSets,
        selectedTypes,
        selectedAspects,
        selectedArenas,
        selectedTraits,
        selectedRarities,
        selectedKeywords,
        selectedCosts,
        selectedVariants,
        ownedOnly,
      },
      collection
    ),
    [
      cards,
      search,
      selectedSets,
      selectedTypes,
      selectedAspects,
      selectedArenas,
      selectedTraits,
      selectedRarities,
      selectedKeywords,
      selectedCosts,
      selectedVariants,
      ownedOnly,
      collection,
    ]
  );

  const handleClearAll = () => {
    setSearch('');
    setSelectedSets([]);
    setSelectedTypes([]);
    setSelectedAspects([]);
    setSelectedArenas([]);
    setSelectedTraits([]);
    setSelectedRarities([]);
    setSelectedKeywords([]);
    setSelectedCosts([]);
    setSelectedVariants(['Normal']);
    setOwnedOnly(false);
  };

  // Override detection (D-03): when the user manually changes a filter that the auto-filter
  // currently controls, signal the parent to set isAutoFilterOverridden=true.
  const handleTypesChange = (v: string[]) => {
    if (!isAutoFilterOverridden && autoFilter?.types !== undefined) {
      onFilterManualChange?.();
    }
    setSelectedTypes(v);
  };

  const handleAspectsChange = (v: string[]) => {
    if (!isAutoFilterOverridden && autoFilter?.aspects !== undefined) {
      onFilterManualChange?.();
    }
    setSelectedAspects(v);
  };

  const sidebarProps = {
    search, onSearchChange: setSearch,
    sets: filterOptions.sets,
    types: filterOptions.types,
    aspects: aspectOptions,
    arenas: ARENA_OPTIONS,
    traits: TRAIT_OPTIONS,
    rarities: RARITY_OPTIONS,
    keywords: KEYWORD_OPTIONS,
    costs: COST_OPTIONS,
    selectedSets, onSetsChange: setSelectedSets,
    selectedTypes, onTypesChange: handleTypesChange,
    selectedAspects, onAspectsChange: handleAspectsChange,
    selectedArenas, onArenasChange: setSelectedArenas,
    selectedTraits, onTraitsChange: setSelectedTraits,
    selectedRarities, onRaritiesChange: setSelectedRarities,
    selectedKeywords, onKeywordsChange: setSelectedKeywords,
    selectedCosts, onCostsChange: setSelectedCosts,
    selectedVariants, onVariantsChange: setSelectedVariants,
    ownedOnly,
    onOwnedOnlyChange: setOwnedOnly,
    isAuthenticated,
    autoFilterLabel,
    onClearAll: handleClearAll,
  };

  return (
    <div className="flex h-[calc(100svh-56px)] overflow-hidden w-full">
      <div className="hidden md:block">
        <SidebarFilters {...sidebarProps} />
      </div>
      
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
        <div className="sticky top-0 z-40 bg-background md:hidden px-4 py-2 border-b border-border flex items-center justify-between">
          <MobileFilterSheet {...sidebarProps} />
        </div>
        
        <TopBar resultCount={filtered.length} />
        
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <CardGrid 
            cards={filtered} 
            collection={collection}
            onUpdateCount={handleUpdateCount}
            mode={mode}
            deckCounts={deckCounts}
            onDeckUpdate={onDeckUpdate}
          />
        )}
      </main>
    </div>
  );
}

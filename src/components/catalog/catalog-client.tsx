'use client'

import { useMemo, useState } from 'react';
import { filterCards, type CardForFilter } from '@/lib/filter-cards';
import { TopBar } from './top-bar';
import { CardGrid } from './card-grid';
import { EmptyState } from './empty-state';

interface FilterOptions {
  sets: string[];
  types: string[];
}

interface CatalogClientProps {
  cards: CardForFilter[];
  filterOptions: FilterOptions;
}

export function CatalogClient({ cards, filterOptions }: CatalogClientProps) {
  const [search, setSearch] = useState('');
  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedAspects, setSelectedAspects] = useState<string[]>([]);

  // Derive distinct aspects client-side — avoids PostgreSQL unnest complexity
  // Safe because all cards are already loaded (getAllCards returns full set)
  const aspectOptions = useMemo(
    () => [...new Set(cards.flatMap(c => c.aspects))].sort(),
    [cards]
  );

  const filtered = useMemo(
    () => filterCards(cards, { search, selectedSets, selectedTypes, selectedAspects }),
    [cards, search, selectedSets, selectedTypes, selectedAspects]
  );

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar
        search={search}
        onSearchChange={setSearch}
        sets={filterOptions.sets}
        types={filterOptions.types}
        aspects={aspectOptions}
        selectedSets={selectedSets}
        selectedTypes={selectedTypes}
        selectedAspects={selectedAspects}
        onSetsChange={setSelectedSets}
        onTypesChange={setSelectedTypes}
        onAspectsChange={setSelectedAspects}
      />
      {/* Result count — right-aligned, above grid per UI-SPEC.md */}
      <div className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">
        {filtered.length.toLocaleString()} cards
      </div>
      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <CardGrid cards={filtered} />
      )}
    </div>
  );
}

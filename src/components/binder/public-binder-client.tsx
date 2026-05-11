'use client'

import { useMemo } from 'react';
import { useQueryState, parseAsString, parseAsArrayOf } from 'nuqs';
import { filterCards, type CardForFilter } from '@/lib/filter-cards';
import { TopBar } from '@/components/catalog/top-bar';
import { CardGrid } from '@/components/catalog/card-grid';
import { EmptyState } from '@/components/catalog/empty-state';

interface FilterOptions {
  sets: string[];
  types: string[];
}

interface PublicBinderClientProps {
  username: string;
  offerings: CardForFilter[];
  lookingFor: CardForFilter[];
  filterOptions: FilterOptions;
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

export function PublicBinderClient({ 
  username, 
  offerings, 
  lookingFor, 
  filterOptions 
}: PublicBinderClientProps) {
  const [search, setSearch] = useQueryState('q', parseAsString.withDefault('').withOptions({ shallow: true }));
  const [selectedSets, setSelectedSets] = useQueryState('sets', parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: true }));
  const [selectedTypes, setSelectedTypes] = useQueryState('types', parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: true }));
  const [selectedAspects, setSelectedAspects] = useQueryState('aspects', parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: true }));
  const [selectedArenas, setSelectedArenas] = useQueryState('arenas', parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: true }));
  const [selectedTraits, setSelectedTraits] = useQueryState('traits', parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: true }));
  const [selectedRarities, setSelectedRarities] = useQueryState('rarities', parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: true }));
  const [selectedKeywords, setSelectedKeywords] = useQueryState('keywords', parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: true }));
  const [selectedCosts, setSelectedCosts] = useQueryState('costs', parseAsArrayOf(parseAsString).withDefault([]).withOptions({ shallow: true }));

  const allCards = useMemo(() => [...offerings, ...lookingFor], [offerings, lookingFor]);
  const aspectOptions = useMemo(() => [...new Set(allCards.flatMap(c => c.aspects))].sort(), [allCards]);

  const filteredOfferings = useMemo(
    () => filterCards(offerings, { 
      search, 
      selectedSets, 
      selectedTypes, 
      selectedAspects,
      selectedArenas,
      selectedTraits,
      selectedRarities,
      selectedKeywords,
      selectedCosts,
    }),
    [offerings, search, selectedSets, selectedTypes, selectedAspects, selectedArenas, selectedTraits, selectedRarities, selectedKeywords, selectedCosts]
  );

  const filteredLookingFor = useMemo(
    () => filterCards(lookingFor, { 
      search, 
      selectedSets, 
      selectedTypes, 
      selectedAspects,
      selectedArenas,
      selectedTraits,
      selectedRarities,
      selectedKeywords,
      selectedCosts,
    }),
    [lookingFor, search, selectedSets, selectedTypes, selectedAspects, selectedArenas, selectedTraits, selectedRarities, selectedKeywords, selectedCosts]
  );

  const totalFiltered = filteredOfferings.length + filteredLookingFor.length;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-4 lg:px-8 py-4 bg-muted/30 border-b border-border">
        <h1 className="text-2xl font-bold font-heading">{username.toUpperCase()}&apos;s Trade Binder</h1>
      </div>

      <TopBar
        search={search}
        onSearchChange={setSearch}
        sets={filterOptions.sets}
        types={filterOptions.types}
        aspects={aspectOptions}
        arenas={ARENA_OPTIONS}
        traits={TRAIT_OPTIONS}
        rarities={RARITY_OPTIONS}
        keywords={KEYWORD_OPTIONS}
        costs={COST_OPTIONS}
        selectedSets={selectedSets}
        selectedTypes={selectedTypes}
        selectedAspects={selectedAspects}
        selectedArenas={selectedArenas}
        selectedTraits={selectedTraits}
        selectedRarities={selectedRarities}
        selectedKeywords={selectedKeywords}
        selectedCosts={selectedCosts}
        onSetsChange={setSelectedSets}
        onTypesChange={setSelectedTypes}
        onAspectsChange={setSelectedAspects}
        onArenasChange={setSelectedArenas}
        onTraitsChange={setSelectedTraits}
        onRaritiesChange={setSelectedRarities}
        onKeywordsChange={setSelectedKeywords}
        onCostsChange={setSelectedCosts}
        topOffset="top-0"
      />

      <div className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">
        {totalFiltered.toLocaleString()} cards matching filters
      </div>

      {totalFiltered === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-8 pb-12">
          {filteredOfferings.length > 0 && (
            <section>
              <div className="px-4 lg:px-8 py-2 bg-muted/10 border-y border-border">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  Available for Trade
                  <span className="text-xs font-normal">{filteredOfferings.length} cards</span>
                </h2>
              </div>
              <CardGrid 
                cards={filteredOfferings} 
                collection={{}}
                mode="binder"
              />
            </section>
          )}

          {filteredLookingFor.length > 0 && (
            <section>
              <div className="px-4 lg:px-8 py-2 bg-muted/10 border-y border-border">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  Looking For
                  <span className="text-xs font-normal">{filteredLookingFor.length} cards</span>
                </h2>
              </div>
              <CardGrid 
                cards={filteredLookingFor} 
                collection={{}}
                mode="want"
              />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

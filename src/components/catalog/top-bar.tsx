'use client'

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FilterDropdown } from './filter-dropdown';
import { X } from 'lucide-react';

interface TopBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  sets: string[];
  types: string[];
  aspects: string[];
  arenas: string[];
  traits: string[];
  rarities: string[];
  keywords: string[];
  costs: string[];
  selectedSets: string[];
  selectedTypes: string[];
  selectedAspects: string[];
  selectedArenas: string[];
  selectedTraits: string[];
  selectedRarities: string[];
  selectedKeywords: string[];
  selectedCosts: string[];
  onSetsChange: (v: string[]) => void;
  onTypesChange: (v: string[]) => void;
  onAspectsChange: (v: string[]) => void;
  onArenasChange: (v: string[]) => void;
  onTraitsChange: (v: string[]) => void;
  onRaritiesChange: (v: string[]) => void;
  onKeywordsChange: (v: string[]) => void;
  onCostsChange: (v: string[]) => void;
  topOffset?: string; // e.g. "top-0" or "top-14"
}

export function TopBar({
  search, onSearchChange,
  sets, types, aspects, arenas, traits, rarities, keywords, costs,
  selectedSets, selectedTypes, selectedAspects, selectedArenas, selectedTraits, selectedRarities, selectedKeywords, selectedCosts,
  onSetsChange, onTypesChange, onAspectsChange, onArenasChange, onTraitsChange, onRaritiesChange, onKeywordsChange, onCostsChange,
  topOffset = 'top-14',
}: TopBarProps) {
  return (
    <div
      className={cn(
        // UI-SPEC.md: sticky top bar, bg-background/80 backdrop-blur-sm, border-b border-border
        // Multi-line layout (D-06)
        'sticky z-40 flex flex-col gap-2',
        'px-4 lg:px-8 py-2',
        'bg-background/80 backdrop-blur-sm border-b border-border',
        topOffset
      )}
    >
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search — flex-1, min 200px, max 480px per UI-SPEC.md */}
        <div className="relative flex-1 min-w-[200px] max-w-[480px]">
          <Input
            type="text"
            placeholder="Search cards..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            className="pr-8"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute right-1 top-1/2 -translate-y-1/2"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
            >
              <X />
            </Button>
          )}
        </div>
        {/* Priority filters on first line */}
        <FilterDropdown label="Set"    options={sets}    selected={selectedSets}    onChange={onSetsChange}    />
        <FilterDropdown label="Aspect" options={aspects} selected={selectedAspects} onChange={onAspectsChange} />
        <FilterDropdown label="Rarity" options={rarities} selected={selectedRarities} onChange={onRaritiesChange} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <FilterDropdown label="Type"    options={types}    selected={selectedTypes}    onChange={onTypesChange}    />
        <FilterDropdown label="Arena"   options={arenas}   selected={selectedArenas}   onChange={onArenasChange} singleSelect />
        <FilterDropdown label="Trait"   options={traits}   selected={selectedTraits}   onChange={onTraitsChange}   />
        <FilterDropdown label="Keyword" options={keywords} selected={selectedKeywords} onChange={onKeywordsChange} />
        
        {/* Cost ButtonGroup (D-08 Refinement) */}
        <div className="flex items-center border border-border rounded-md overflow-hidden h-9 bg-background/50 ml-auto">
          <div className="px-2 text-[10px] font-bold uppercase text-muted-foreground border-r border-border h-full flex items-center bg-muted/20">
            Cost
          </div>
          {costs.map(cost => {
            const isSelected = (selectedCosts || []).includes(cost);
            return (
              <button
                key={cost}
                type="button"
                onClick={() => {
                  const safeCosts = selectedCosts || [];
                  onCostsChange(
                    isSelected
                      ? safeCosts.filter(c => c !== cost)
                      : [...safeCosts, cost]
                  );
                }}
                className={cn(
                  'w-8 h-full text-xs font-bold transition-colors border-r border-border last:border-r-0',
                  isSelected 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted text-muted-foreground'
                )}
              >
                {cost}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

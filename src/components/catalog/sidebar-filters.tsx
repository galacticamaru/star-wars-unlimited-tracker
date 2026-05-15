'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { FilterDropdown } from './filter-dropdown';
import { VariantFilter } from './variant-filter';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipPopup } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface SidebarFiltersProps {
  search?: string;
  onSearchChange?: (v: string) => void;
  sets?: string[];
  types?: string[];
  aspects?: string[];
  arenas?: string[];
  traits?: string[];
  rarities?: string[];
  keywords?: string[];
  costs?: string[];
  selectedSets?: string[];
  selectedTypes?: string[];
  selectedAspects?: string[];
  selectedArenas?: string[];
  selectedTraits?: string[];
  selectedRarities?: string[];
  selectedKeywords?: string[];
  selectedCosts?: string[];
  selectedVariants?: string[];
  onSetsChange?: (v: string[]) => void;
  onTypesChange?: (v: string[]) => void;
  onAspectsChange?: (v: string[]) => void;
  onArenasChange?: (v: string[]) => void;
  onTraitsChange?: (v: string[]) => void;
  onRaritiesChange?: (v: string[]) => void;
  onKeywordsChange?: (v: string[]) => void;
  onCostsChange?: (v: string[]) => void;
  onVariantsChange?: (v: string[]) => void;
  onClearAll?: () => void;
  ownedOnly?: boolean;
  onOwnedOnlyChange?: (v: boolean) => void;
  isAuthenticated?: boolean;
  autoFilterLabel?: string | null;
  }

  export function SidebarFilters({
  search = '',
  onSearchChange = () => {},
  sets = [],
  types = [],
  aspects = [],
  arenas = [],
  traits = [],
  rarities = [],
  keywords = [],
  costs = [],
  selectedSets = [],
  selectedTypes = [],
  selectedAspects = [],
  selectedArenas = [],
  selectedTraits = [],
  selectedRarities = [],
  selectedKeywords = [],
  selectedCosts = [],
  selectedVariants = ['Normal'],
  onSetsChange = () => {},
  onTypesChange = () => {},
  onAspectsChange = () => {},
  onArenasChange = () => {},
  onTraitsChange = () => {},
  onRaritiesChange = () => {},
  onKeywordsChange = () => {},
  onCostsChange = () => {},
  onVariantsChange = () => {},
  onClearAll = () => {},
  ownedOnly = false,
  onOwnedOnlyChange = () => {},
  isAuthenticated = false,
  autoFilterLabel,
  }: SidebarFiltersProps) {
  return (
    <aside className="w-64 border-r p-4 shrink-0 flex flex-col gap-4 overflow-y-auto h-[calc(100vh-3.5rem)] sticky top-14 self-start bg-card">
      <h2 className="text-xl font-bold font-heading mb-2">Filters</h2>

      {autoFilterLabel && (
        <Badge
          variant="outline"
          className="border-primary/40 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/15 dark:text-primary"
          aria-label={`Auto-filter active: ${autoFilterLabel}`}
          role="status"
        >
          {autoFilterLabel}
        </Badge>
      )}

      {/* Search */}
      <div className="relative">
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
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Owned-only toggle (D-03: below search, above other filters) */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            disabled={isAuthenticated}
            render={<span className="w-full" />}
          >
            <div
              className={cn(
                'flex items-center justify-between py-1 px-0.5',
                !isAuthenticated && 'opacity-50 cursor-not-allowed'
              )}
            >
              <label
                htmlFor="owned-only-switch"
                className={cn(
                  'text-sm font-medium',
                  !isAuthenticated ? 'cursor-not-allowed' : 'cursor-pointer'
                )}
              >
                Owned only
              </label>
              <Switch
                id="owned-only-switch"
                checked={ownedOnly}
                onCheckedChange={onOwnedOnlyChange}
                disabled={!isAuthenticated}
                aria-label="Show only owned cards"
              />
            </div>
          </TooltipTrigger>
          {!isAuthenticated && (
            <TooltipPopup>Log in to filter by owned cards</TooltipPopup>
          )}
        </Tooltip>
      </TooltipProvider>

      <VariantFilter value={selectedVariants} onChange={onVariantsChange} />

      {/* Priority Filters */}
      <FilterDropdown label="Set" options={sets} selected={selectedSets} onChange={onSetsChange} />
      <FilterDropdown label="Aspect" options={aspects} selected={selectedAspects} onChange={onAspectsChange} />
      <FilterDropdown label="Rarity" options={rarities} selected={selectedRarities} onChange={onRaritiesChange} />

      {/* Other Filters */}
      <FilterDropdown label="Type" options={types} selected={selectedTypes} onChange={onTypesChange} />
      <FilterDropdown label="Arena" options={arenas} selected={selectedArenas} onChange={onArenasChange} singleSelect />
      <FilterDropdown label="Trait" options={traits} selected={selectedTraits} onChange={onTraitsChange} />
      <FilterDropdown label="Keyword" options={keywords} selected={selectedKeywords} onChange={onKeywordsChange} />

      {/* Cost Group */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Cost</span>
        <div className="flex items-center border border-border rounded-md overflow-hidden h-9 bg-background/50">
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
                  'w-8 h-full text-xs font-bold transition-colors border-r border-border last:border-r-0 flex-1',
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

      <Button variant="outline" className="mt-4 w-full" onClick={onClearAll}>
        Clear All Filters
      </Button>
    </aside>
  );
}

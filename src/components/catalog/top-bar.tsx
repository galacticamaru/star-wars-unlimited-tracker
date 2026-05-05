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
  selectedSets: string[];
  selectedTypes: string[];
  selectedAspects: string[];
  onSetsChange: (v: string[]) => void;
  onTypesChange: (v: string[]) => void;
  onAspectsChange: (v: string[]) => void;
}

export function TopBar({
  search, onSearchChange,
  sets, types, aspects,
  selectedSets, selectedTypes, selectedAspects,
  onSetsChange, onTypesChange, onAspectsChange,
}: TopBarProps) {
  return (
    <div
      className={cn(
        // UI-SPEC.md: sticky top bar, height 56px, bg-background/80 backdrop-blur-sm, border-b border-border
        'sticky top-0 z-10 h-14 flex items-center gap-2',
        'px-4 lg:px-8',
        'bg-background/80 backdrop-blur-sm border-b border-border',
      )}
    >
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
      {/* Filter dropdowns — fixed 120px each per UI-SPEC.md */}
      <FilterDropdown label="Set"    options={sets}    selected={selectedSets}    onChange={onSetsChange}    />
      <FilterDropdown label="Type"   options={types}   selected={selectedTypes}   onChange={onTypesChange}   />
      <FilterDropdown label="Aspect" options={aspects} selected={selectedAspects} onChange={onAspectsChange} />
    </div>
  );
}

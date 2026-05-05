'use client'

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FilterDropdownProps {
  label: string;       // "Set" | "Type" | "Aspect"
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  singleSelect?: boolean;
}

export function FilterDropdown({ label, options, selected, onChange, singleSelect }: FilterDropdownProps) {
  // Ensure selected is an array
  const safeSelected = selected || [];
  
  // UI-SPEC.md §Copywriting: trigger shows "Set" or "Set (2)" when active
  const triggerLabel = safeSelected.length > 0 
    ? (singleSelect ? safeSelected[0] : `${label} (${safeSelected.length})`) 
    : label;

  const toggle = (option: string) => {
    if (singleSelect) {
      onChange(safeSelected.includes(option) ? [] : [option]);
    } else {
      onChange(
        safeSelected.includes(option)
          ? safeSelected.filter(s => s !== option)
          : [...safeSelected, option]
      );
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({
            variant: safeSelected.length > 0 ? 'outline' : 'ghost',
            size: 'default',
          }),
          'w-[120px] justify-between'
        )}
      >
        {triggerLabel}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map(option => (
          <DropdownMenuCheckboxItem
            key={option}
            checked={safeSelected.includes(option)}
            onCheckedChange={() => toggle(option)}
          >
            {option}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
}

export function FilterDropdown({ label, options, selected, onChange }: FilterDropdownProps) {
  // UI-SPEC.md §Copywriting: trigger shows "Set" or "Set (2)" when active
  const triggerLabel = selected.length > 0 ? `${label} (${selected.length})` : label;

  const toggle = (option: string) => {
    onChange(
      selected.includes(option)
        ? selected.filter(s => s !== option)
        : [...selected, option]
    );
  };

  return (
    <DropdownMenu>
      {/* UI-SPEC.md: fixed width 120px. outline variant when active (has selections).
          base-ui Trigger doesn't support asChild — apply button variant classes directly. */}
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({
            variant: selected.length > 0 ? 'outline' : 'ghost',
          }),
          'w-[120px] justify-between',
        )}
      >
        {triggerLabel}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map(option => (
          <DropdownMenuCheckboxItem
            key={option}
            checked={selected.includes(option)}
            onCheckedChange={() => toggle(option)}
          >
            {option}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

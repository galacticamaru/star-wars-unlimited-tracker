'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface VariantFilterProps {
  value?: string[];
  onChange?: (variants: string[]) => void;
}

const VARIANT_OPTIONS = ['Normal', 'Showcase', 'Hyperspace', 'Prestige', 'Serialized'];

export function VariantFilter({ value = ['Normal'], onChange = () => {} }: VariantFilterProps) {
  const toggleVariant = (variant: string) => {
    if (variant === 'All') {
      onChange([]);
      return;
    }

    const current = value || [];
    if (current.includes(variant)) {
      // Remove variant
      onChange(current.filter((v) => v !== variant));
    } else {
      // Add variant
      onChange([...current, variant]);
    }
  };

  const isAllSelected = value.length === 0;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">Variant</span>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => toggleVariant('All')}
          className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted rounded-md transition-colors text-left"
        >
          <div className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0", isAllSelected ? "bg-primary border-primary text-primary-foreground" : "border-input")}>
            {isAllSelected && <Check className="w-3 h-3" />}
          </div>
          <span>All</span>
        </button>
        {VARIANT_OPTIONS.map((variant) => {
          const isSelected = !isAllSelected && value.includes(variant);
          return (
            <button
              key={variant}
              type="button"
              onClick={() => toggleVariant(variant)}
              className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted rounded-md transition-colors text-left"
            >
              <div className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0", isSelected ? "bg-primary border-primary text-primary-foreground" : "border-input")}>
                {isSelected && <Check className="w-3 h-3" />}
              </div>
              <span>{variant}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

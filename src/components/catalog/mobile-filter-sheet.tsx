'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SidebarFilters } from './sidebar-filters';
import { SlidersHorizontal } from 'lucide-react';

// Props will mirror SidebarFilters to pass them down, stubbed for now
export function MobileFilterSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Refine Results
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="p-0 border-l w-[300px] sm:w-[400px]">
        <SheetHeader className="p-4 border-b sr-only">
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Adjust filters to refine the catalog.
          </SheetDescription>
        </SheetHeader>
        {/* We use negative margins or specific overrides if needed, but for now we just render it.
            Since SidebarFilters has sticky/fixed widths, we might need to adjust it later, 
            but for the scaffold we just compose it. */}
        <SidebarFilters />
      </SheetContent>
    </Sheet>
  );
}

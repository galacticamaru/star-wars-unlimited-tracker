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
import React from 'react';

type MobileFilterSheetProps = React.ComponentProps<typeof SidebarFilters>;

export function MobileFilterSheet(props: MobileFilterSheetProps) {
  return (
    <Sheet>
      <SheetTrigger 
        render={<Button variant="outline" className="flex items-center gap-2" />}
      >
        <SlidersHorizontal className="w-4 h-4" />
        Refine Results
      </SheetTrigger>
      <SheetContent side="right" className="p-0 border-l w-[300px] sm:w-[400px]">
        <SheetHeader className="p-4 border-b sr-only">
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Adjust filters to refine the catalog.
          </SheetDescription>
        </SheetHeader>
        {/* We pass all props directly to SidebarFilters */}
        <SidebarFilters {...props} />
      </SheetContent>
    </Sheet>
  );
}

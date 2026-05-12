'use client'

import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrency, type Currency } from '@/components/currency-context';

interface TopBarProps {
  resultCount: number;
}

export function TopBar({ resultCount }: TopBarProps) {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="flex items-center justify-between px-4 lg:px-8 py-4 border-b border-border bg-background">
      <div className="text-sm font-semibold text-muted-foreground">
        {resultCount.toLocaleString()} cards found
      </div>
      <Tabs value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
        <TabsList className="h-9">
          <TabsTrigger value="USD" className="px-3">USD</TabsTrigger>
          <TabsTrigger value="EUR" className="px-3">EUR</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

'use client'

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CollectionControlsProps {
  cardDefinitionId: number;
  initialCount: number;
}

export function CollectionControls({ cardDefinitionId, initialCount }: CollectionControlsProps) {
  const [count, setCount] = useState(initialCount);

  const updateCount = async (newCount: number) => {
    const val = Math.max(0, newCount);
    setCount(val);

    try {
      await fetch('/api/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardDefinitionId, count: val }),
      });
    } catch (err) {
      console.error('Failed to update count:', err);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4 bg-muted/50 rounded-lg border border-border">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your Collection</p>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => updateCount(count - 1)}
          aria-label="Decrease owned count"
        >
          <Minus className="size-4" />
        </Button>
        
        <Input
          type="number"
          value={count}
          onChange={(e) => updateCount(parseInt(e.target.value, 10) || 0)}
          className="w-16 text-center font-bold"
        />

        <Button
          variant="outline"
          size="icon"
          onClick={() => updateCount(count + 1)}
          aria-label="Increase owned count"
        >
          <Plus className="size-4" />
        </Button>
        
        {count > 0 ? (
          <span className="text-sm font-semibold text-primary ml-2">Owned</span>
        ) : (
          <span className="text-sm font-medium text-muted-foreground ml-2">Not owned</span>
        )}
      </div>
    </div>
  );
}

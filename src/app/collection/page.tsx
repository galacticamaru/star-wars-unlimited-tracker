'use client'

import { useState } from 'react';
import Papa from 'papaparse';
import { normalizeRedditCsv } from '@/lib/collection/normalize';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function CollectionPage() {
  const [status, setStatus] = useState<'idle' | 'parsing' | 'uploading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<{ count: number } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('parsing');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const normalized = normalizeRedditCsv(results.data);
        
        setStatus('uploading');
        try {
          const res = await fetch('/api/collection/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(normalized),
          });
          
          if (!res.ok) throw new Error('Upload failed');
          
          const data = await res.json();
          setResult(data);
          setStatus('success');
        } catch (err) {
          console.error(err);
          setStatus('error');
        }
      },
      error: (err) => {
        console.error(err);
        setStatus('error');
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
        <ChevronLeft className="mr-1 size-4" />
        Back to catalog
      </Link>

      <h1 className="text-3xl font-bold font-heading mb-6">Your Collection</h1>
      
      <div className="bg-muted/50 rounded-xl border border-border p-8 flex flex-col items-center text-center gap-6">
        <div className="bg-background p-4 rounded-full shadow-sm">
          <Upload className="size-8 text-primary" />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-2">Bulk Import from CSV</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Upload your community Reddit spreadsheet. We'll automatically sum your Normal, Foil, and Hyperspace variants into a single count per card.
          </p>
        </div>

        <div className="w-full max-w-sm">
          <Input 
            type="file" 
            accept=".csv" 
            onChange={handleFileUpload}
            disabled={status === 'parsing' || status === 'uploading'}
            className="cursor-pointer file:cursor-pointer"
          />
        </div>

        {status === 'parsing' && <p className="text-sm font-medium animate-pulse">Parsing CSV...</p>}
        {status === 'uploading' && <p className="text-sm font-medium animate-pulse">Syncing with database...</p>}
        
        {status === 'success' && (
          <div className="flex items-center gap-2 text-green-600 font-semibold bg-green-50 px-4 py-2 rounded-lg">
            <CheckCircle2 className="size-5" />
            Successfully imported {result?.count} cards!
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 text-destructive font-semibold bg-destructive/10 px-4 py-2 rounded-lg">
            <AlertCircle className="size-5" />
            Something went wrong. Please check your CSV format.
          </div>
        )}
      </div>
    </div>
  );
}

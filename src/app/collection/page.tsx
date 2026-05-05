'use client'

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { normalizeRedditCsv } from '@/lib/collection/normalize';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function CollectionPage() {
  const [status, setStatus] = useState<'idle' | 'parsing' | 'uploading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<{ count: number } | null>(null);
  const [sets, setSets] = useState<string[]>([]);
  const [selectedSet, setSelectedSet] = useState<string>('');

  useEffect(() => {
    // Fetch available sets to populate the selection dropdown
    fetch('/api/collection/sets')
      .then(res => res.json())
      .then(data => {
        setSets(data);
        if (data.length > 0) setSelectedSet(data[0]);
      })
      .catch(err => console.error('Failed to load sets:', err));
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSet) return;

    setStatus('parsing');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      beforeFirstChunk: (chunk) => {
        // The Reddit spreadsheet has a blank/title row before the real header row.
        // Find the first line containing 'Card #' and strip everything before it.
        const lines = chunk.split('\n');
        const idx = lines.findIndex(line => line.includes('Card #'));
        return idx > 0 ? lines.slice(idx).join('\n') : chunk;
      },
      complete: async (results) => {
        const normalized = normalizeRedditCsv(results.data, selectedSet);
        
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
        
        <div className="max-w-md">
          <h2 className="text-xl font-semibold mb-2">Bulk Import from CSV</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Upload a single set tab from your community Reddit spreadsheet. We'll automatically sum your <strong>Non-Foil</strong>, <strong>Foil</strong>, <strong>Hyperspace</strong>, and <strong>F-Hyperspace</strong> variants into a single count per card.
          </p>
          <div className="text-xs bg-muted p-3 rounded text-left border border-border text-muted-foreground">
            <p className="font-bold mb-1 uppercase">Required Columns:</p>
            <ul className="list-disc list-inside">
              <li>Card #</li>
              <li>Non-Foil</li>
              <li>Foil</li>
              <li>Hyperspace</li>
              <li>F-Hyperspace</li>
            </ul>
          </div>
        </div>

        <div className="w-full max-w-sm flex flex-col gap-4">
          <div className="flex flex-col items-start gap-1.5">
            <label htmlFor="set-select" className="text-xs font-bold uppercase text-muted-foreground">Select Set</label>
            <select 
              id="set-select"
              value={selectedSet}
              onChange={(e) => setSelectedSet(e.target.value)}
              className="w-full h-10 px-3 py-2 bg-background border border-input rounded-md text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sets.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col items-start gap-1.5">
            <label className="text-xs font-bold uppercase text-muted-foreground">Choose CSV File</label>
            <Input 
              type="file" 
              accept=".csv" 
              onChange={handleFileUpload}
              disabled={status === 'parsing' || status === 'uploading' || !selectedSet}
              className="cursor-pointer file:cursor-pointer"
            />
          </div>
        </div>

        {status === 'parsing' && <p className="text-sm font-medium animate-pulse">Parsing CSV...</p>}
        {status === 'uploading' && <p className="text-sm font-medium animate-pulse">Syncing with database...</p>}
        
        {status === 'success' && (
          <div className="flex items-center gap-2 text-green-600 font-semibold bg-green-50 px-4 py-2 rounded-lg">
            <CheckCircle2 className="size-5" />
            Successfully imported {result?.count} cards for {selectedSet}!
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 text-destructive font-semibold bg-destructive/10 px-4 py-2 rounded-lg">
            <AlertCircle className="size-5" />
            Something went wrong. Please check your CSV format and columns.
          </div>
        )}
      </div>
    </div>
  );
}

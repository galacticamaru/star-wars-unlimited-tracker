// @vitest-environment jsdom
// Tests for PERF-04 progress text behavior in CollectionPage
// Requirement: PERF-04 (card count in status text for CSV Import and Quick Add)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

// Mock papaparse (not needed for Quick Add tests, but prevents import errors)
vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn(),
  },
}));

// Mock normalizeRedditCsv
vi.mock('@/lib/collection/normalize', () => ({
  normalizeRedditCsv: vi.fn(() => []),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronLeft: () => null,
  Upload: () => null,
  CheckCircle2: () => null,
  AlertCircle: () => null,
  PackagePlus: () => null,
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

import CollectionPage from './page';

describe('CollectionPage progress text (PERF-04)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for sets endpoint (called in useEffect)
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ['SOR', 'SHD'],
    });
  });

  it.todo('CSV Import uploading status renders "Importing {N} cards..." where N is normalized.length set before fetch fires');
  // Reason: requires PapaParse complete callback + File object — covered by manual UAT

  it.todo('CSV Import success status renders "Done! {N} cards imported." with count from API response');
  // Reason: requires PapaParse complete callback + File object — covered by manual UAT

  it('Quick Add button label renders "Adding {N} cards from {deckName}..." during deckStatus loading', async () => {
    // Arrange: set fetch to never resolve so we stay in loading state
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ['SOR'],
      })
      .mockImplementationOnce(() => new Promise(() => {})); // never resolves — keeps loading state

    render(<CollectionPage />);

    // Wait for sets to load (useEffect)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/collection/sets');
    });

    // Find the Add to Collection button
    const addButton = screen.getByText('Add to Collection');
    expect(addButton).toBeDefined();

    // Click the button — handleQuickAdd fires, setDeckCardCount + setDeckStatus('loading') execute
    await act(async () => {
      fireEvent.click(addButton);
    });

    // Button label should now show the card count and deck name from starterDecks[0]
    // The exact text depends on the first starter deck's cards reduce sum
    const loadingButton = screen.getByRole('button', { name: /Adding \d+ cards from .+\.\.\./i });
    expect(loadingButton).toBeDefined();
  });

  it('Quick Add success status renders "Added {N} cards from {deckName} to your collection." after success', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ['SOR'],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cardsAdded: 55, deckName: 'Luke Skywalker (SOR)' }),
      });

    render(<CollectionPage />);

    // Wait for sets to load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/collection/sets');
    });

    const addButton = screen.getByText('Add to Collection');

    await act(async () => {
      fireEvent.click(addButton);
    });

    // Success banner should appear with the API response count
    await waitFor(() => {
      const successText = screen.getByText(/Added \d+ cards from .+ to your collection\./i);
      expect(successText).toBeDefined();
    });
  });

  it.todo('CSV import card count state is set before fetch is invoked (not from response)');
  // Reason: asserting React setState call order requires PapaParse callback control — covered by manual UAT
});

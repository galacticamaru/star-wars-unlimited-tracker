/** @vitest-environment jsdom */
// Wave 0 stub — retargets page.test.tsx from RSC ./page (DATABASE_URL crash) to
// DecksClient component. Asserts router.refresh() is called after delete (PERF-07 RED).
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DecksClient } from '@/components/decks/decks-client';
import { useRouter } from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock CardItem to avoid heavy catalog dependency chain in jsdom
vi.mock('@/components/catalog/card-item', () => ({
  CardItem: () => null,
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('DecksClient', () => {
  const mockRouter = {
    push: vi.fn(),
    refresh: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue(mockRouter);
  });

  it('renders existing decks from initialDecks prop', async () => {
    render(
      <DecksClient
        initialDecks={[{ id: 1, name: 'My Deck', updatedAt: new Date().toISOString() as unknown as Date }]}
        initialWantList={[]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('My Deck')).toBeTruthy();
    });
  });

  it('handles deck creation and calls router.push with new deck id', async () => {
    render(
      <DecksClient
        initialDecks={[]}
        initialWantList={[]}
      />
    );

    const input = screen.getByPlaceholderText(/New deck name.../i);
    const button = screen.getByText(/Create New Deck/i);

    fireEvent.change(input, { target: { value: 'New Deck' } });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 123, name: 'New Deck' }),
    });

    fireEvent.click(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/decks',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'New Deck' }),
        })
      );
      expect(mockRouter.push).toHaveBeenCalledWith('/decks/123');
    });
  });

  it('handles deck deletion and calls router.refresh() after success (PERF-07 RED)', async () => {
    // RED: router.refresh() is not yet called in handleDeleteDeck in Plan 00.
    // This test will turn green in Plan 01 when router.refresh() is wired after DELETE.
    render(
      <DecksClient
        initialDecks={[{ id: 1, name: 'Deck to Delete', updatedAt: new Date().toISOString() as unknown as Date }]}
        initialWantList={[]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Deck to Delete')).toBeTruthy();
    });

    window.confirm = vi.fn(() => true);

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
    });

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/decks/1',
        expect.objectContaining({ method: 'DELETE' })
      );
      // RED: router.refresh() not yet called — will fail until Plan 01
      expect(mockRouter.refresh).toHaveBeenCalled();
    });
  });
});

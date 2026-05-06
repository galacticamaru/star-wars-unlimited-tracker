/** @vitest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DecksPage from './page';
import { useRouter } from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

describe('DecksPage', () => {
  const mockRouter = {
    push: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
  });

  it('renders loading state initially', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<DecksPage />);
    expect(screen.getByText(/Loading decks.../i)).toBeDefined();
  });

  it('renders decks after loading', async () => {
    const mockDecks = [
      { id: 1, name: 'Deck 1', updatedAt: new Date().toISOString() },
      { id: 2, name: 'Deck 2', updatedAt: new Date().toISOString() },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDecks,
    });

    render(<DecksPage />);

    await waitFor(() => {
      expect(screen.getByText('Deck 1')).toBeTruthy();
      expect(screen.getByText('Deck 2')).toBeTruthy();
    });
  });

  it('handles deck creation', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<DecksPage />);

    const input = screen.getByPlaceholderText(/New deck name.../i);
    const button = screen.getByText(/Create New Deck/i);

    fireEvent.change(input, { target: { value: 'New Deck' } });
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 123, name: 'New Deck' }),
    });

    fireEvent.click(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/decks', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'New Deck' }),
      }));
      expect(mockRouter.push).toHaveBeenCalledWith('/decks/123');
    });
  });

  it('handles deck deletion', async () => {
    const mockDecks = [
      { id: 1, name: 'Deck to Delete', updatedAt: new Date().toISOString() },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDecks,
    });

    // Mock window.confirm
    window.confirm = vi.fn().mockReturnValue(true);

    render(<DecksPage />);

    await waitFor(() => {
      expect(screen.getByText('Deck to Delete')).toBeTruthy();
    });

    const deleteButton = screen.getByText('Delete');

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
    });

    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/decks/1', expect.objectContaining({
        method: 'DELETE',
      }));
      expect(screen.queryByText('Deck to Delete')).not.toBeTruthy();
    });
  });
});

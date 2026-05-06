// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CardItem } from './card-item';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon" />,
  Minus: () => <div data-testid="minus-icon" />,
}));

// Mock Next.js Image and Link
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('CardItem Shortfall Logic', () => {
  const defaultProps = {
    id: 1,
    name: 'Luke Skywalker',
    type: 'Unit',
    setCode: 'SOR',
    collectorNumber: 'SOR-001',
    frontArtUrl: '/luke.png',
    backArtUrl: null,
    ownedCount: 2,
    onUpdateCount: vi.fn(),
  };

  it('does not show shortfall in catalog mode', () => {
    render(<CardItem {...defaultProps} mode="catalog" deckCount={3} />);
    expect(screen.queryByText(/Missing/i)).toBeNull();
  });

  it('shows shortfall in selector mode when deckCount > ownedCount', () => {
    render(<CardItem {...defaultProps} mode="selector" deckCount={3} />);
    expect(screen.getByText(/Missing 1/i)).toBeDefined();
    expect(screen.getByText(/OWNED: 2/i)).toBeDefined();
  });

  it('does not show shortfall in selector mode when deckCount <= ownedCount', () => {
    render(<CardItem {...defaultProps} mode="selector" deckCount={2} />);
    expect(screen.queryByText(/Missing/i)).toBeNull();
    expect(screen.getByText(/OWNED: 2/i)).toBeDefined();
  });

  it('highlights border when shortfall exists', () => {
    const { container } = render(<CardItem {...defaultProps} mode="selector" deckCount={3} />);
    const borderDiv = container.querySelector('.border-red-500');
    expect(borderDiv).not.toBeNull();
  });
});

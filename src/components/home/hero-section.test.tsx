/**
 * @vitest-environment jsdom
 */
import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

vi.mock('@/components/ui/button', () => ({
  buttonVariants: ({ variant, size }: { variant?: string; size?: string }) =>
    [variant, size].filter(Boolean).join(' '),
}));

import { HeroSection } from './hero-section';

test('renders h1 with exact locked title', () => {
  render(<HeroSection />);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
    'Star Wars Unlimited Card Database and Deck Builder'
  );
});

test('renders subtitle paragraph', () => {
  render(<HeroSection />);
  expect(
    screen.getByText('Track your collection, build your decks, and begin trading with up to date market prices')
  ).toBeDefined();
});

test('renders Import Collection CTA linking to /collection', () => {
  render(<HeroSection />);
  const link = screen.getByText('Import Collection').closest('a');
  expect(link?.getAttribute('href')).toBe('/collection');
});

test('renders Build a Deck CTA linking to /decks', () => {
  render(<HeroSection />);
  const link = screen.getByText('Build a Deck').closest('a');
  expect(link?.getAttribute('href')).toBe('/decks');
});

test('renders Trade CTA linking to /binder/manage', () => {
  render(<HeroSection />);
  const link = screen.getByText('Trade').closest('a');
  expect(link?.getAttribute('href')).toBe('/binder/manage');
});

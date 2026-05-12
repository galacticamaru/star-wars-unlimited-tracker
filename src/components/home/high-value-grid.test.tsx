/**
 * @vitest-environment jsdom
 */
import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next/image', () => ({
  default: (props: { src: string; alt: string; [key: string]: any }) => (
    <img src={props.src} alt={props.alt} />
  ),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const makeCard = (overrides?: Partial<{
  id: number;
  name: string;
  type: string;
  setCode: string;
  collectorNumber: string;
  frontArtUrl: string | null;
  backArtUrl: string | null;
  priceUsd: number | null;
}>) => ({
  id: 1,
  name: 'Darth Vader',
  type: 'Unit',
  setCode: 'SOR',
  collectorNumber: 'SOR-059',
  frontArtUrl: '/vader.jpg',
  backArtUrl: null,
  priceUsd: 4500,
  ...overrides,
});

import { HighValueGrid } from './high-value-grid';

test('renders one tile per card in the array', () => {
  const cards = Array.from({ length: 10 }, (_, i) =>
    makeCard({ id: i + 1, name: `Card ${i + 1}`, collectorNumber: `SOR-0${String(i + 1).padStart(2, '0')}` })
  );
  render(<HighValueGrid cards={cards} />);
  expect(screen.getAllByRole('link').length).toBe(10);
});

test('displays price as $X.XX when priceUsd is an integer in cents', () => {
  render(<HighValueGrid cards={[makeCard({ priceUsd: 4500 })]} />);
  expect(screen.getByText('$45.00')).toBeDefined();
});

test('displays em dash when priceUsd is null', () => {
  render(<HighValueGrid cards={[makeCard({ priceUsd: null })]} />);
  expect(screen.getByText('—')).toBeDefined();
});

test('card tile link points to /cards/{setCode}/{cardNumber} using parsed collector number', () => {
  render(<HighValueGrid cards={[makeCard({ setCode: 'SOR', collectorNumber: 'SOR-059' })]} />);
  const link = screen.getByRole('link');
  expect(link.getAttribute('href')).toBe('/cards/SOR/059');
});

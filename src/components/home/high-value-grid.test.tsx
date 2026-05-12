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

// Wave 0 stubs — implementations pending Plan 02
test.todo('HighValueGrid renders one CardPriceTile per card in the array (10 tiles for 10 cards)');
test.todo('CardPriceTile displays price as "$X.XX" — e.g. priceUsd=4500 renders "$45.00"');
test.todo('CardPriceTile displays "—" when priceUsd is null');
test.todo('CardPriceTile renders a link to /cards/{setCode}/{cardNumber} — e.g. "/cards/SOR/059" for collectorNumber "SOR-059"');
test.todo('CardPriceTile renders img with alt equal to card name');

/**
 * @vitest-environment jsdom
 */
import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock shadcn Button — render as button element
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, asChild, ...props }: any) => {
    if (asChild) return <>{children}</>;
    return <button {...props}>{children}</button>;
  },
}));

// Wave 0 stubs — implementations pending Plan 02
test.todo('HeroSection renders h1 with exact title: "Star Wars Unlimited Card Database and Deck Builder"');
test.todo('HeroSection renders subtitle: "Track your collection, build your decks, and begin trading with up to date market prices"');
test.todo('HeroSection renders CTA link to /collection with text "Import Collection"');
test.todo('HeroSection renders CTA link to /decks with text "Build a Deck"');
test.todo('HeroSection renders CTA link to /binder/manage with text "Trade"');

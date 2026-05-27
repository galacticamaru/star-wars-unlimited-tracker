// @vitest-environment jsdom
// Tests for PERF-05 loading skeleton — DeckBuilderLoading Server Component
// Structural assertions verify layout mirrors DeckBuilder + DeckSidebar
// Requirement: PERF-05 (deck creation ≤500ms, animate-pulse skeleton)
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { readFileSync } from 'fs';
import { join } from 'path';
import DeckBuilderLoading from './loading';

describe('DeckBuilderLoading (PERF-05)', () => {
  it('DeckBuilderLoading renders without throwing', () => {
    const { container } = render(<DeckBuilderLoading />);
    expect(container).toBeDefined();
    expect(container.firstChild).not.toBeNull();
  });

  it('DeckBuilderLoading default export contains animate-pulse class somewhere in rendered output', () => {
    const { container } = render(<DeckBuilderLoading />);
    const pulsed = container.querySelector('.animate-pulse');
    expect(pulsed).not.toBeNull();
  });

  it('DeckBuilderLoading outer container has h-[calc(100svh-56px)] (mirrors DeckBuilder layout height)', () => {
    const { container } = render(<DeckBuilderLoading />);
    const outerHTML = container.innerHTML;
    // The outer div has this exact class string
    expect(outerHTML).toContain('h-[calc(100svh-56px)]');
  });

  it('DeckBuilderLoading contains a w-80 sidebar placeholder (mirrors DeckSidebar)', () => {
    const { container } = render(<DeckBuilderLoading />);
    const sidebar = container.querySelector('.w-80');
    expect(sidebar).not.toBeNull();
  });

  it('DeckBuilderLoading does not call auth.api.getSession or read cookies/headers (loading.tsx server component constraint)', () => {
    const loadingSource = readFileSync(
      join(process.cwd(), 'src/app/decks/[id]/loading.tsx'),
      'utf-8'
    );
    expect(loadingSource).not.toContain('auth.api.getSession');
    expect(loadingSource).not.toContain("from 'next/headers'");
    expect(loadingSource).not.toContain('cookies(');
    expect(loadingSource).not.toContain('headers(');
  });
});

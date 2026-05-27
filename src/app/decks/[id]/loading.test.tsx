// @vitest-environment jsdom
// Wave 0 stub — covers PERF-05 loading skeleton
// Tests use jsdom rendering of DeckBuilderLoading server component
// Structural assertions verify layout mirrors DeckBuilder + DeckSidebar
// Requirement: PERF-05 (deck creation ≤500ms, animate-pulse skeleton)
import { describe, it } from 'vitest';

describe('DeckBuilderLoading (PERF-05)', () => {
  it.todo('DeckBuilderLoading renders without throwing');
  it.todo('DeckBuilderLoading default export contains animate-pulse class somewhere in rendered output');
  it.todo('DeckBuilderLoading outer container has h-[calc(100svh-56px)] (mirrors DeckBuilder layout height)');
  it.todo('DeckBuilderLoading contains a w-80 sidebar placeholder (mirrors DeckSidebar)');
  it.todo('DeckBuilderLoading does not call auth.api.getSession or read cookies/headers (loading.tsx server component constraint)');
});

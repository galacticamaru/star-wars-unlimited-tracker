// @vitest-environment jsdom
// Wave 0 stub — covers PERF-01 (virtualized row rendering) + PERF-03 (image priority threshold)
// Full implementation: Plan 03 (virtualization) turns these stubs into real tests once CardGrid
// gains scrollContainerRef prop and useVirtualizer rendering.
import { describe, it } from 'vitest';

describe('CardGrid', () => {
  it.todo('only renders virtual rows visible in the scroll container — not all cards in the DOM');
  it.todo('first 22 cards have priority=true on their <Image> element');
  it.todo('cards at index 22 and beyond have priority=false (or undefined) on their <Image>');
  it.todo('row column count matches breakpoint — 3 at base, 5 sm, 7 md, 9 lg, 11 xl');
  it.todo('outer wrapper has position:relative with height equal to virtualizer total size (NOT a CSS grid)');
});

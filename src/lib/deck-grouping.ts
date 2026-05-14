import type { DeckCard } from './deck-validation';

export interface GroupedDeck {
  groundUnits: DeckCard[];
  spaceUnits: DeckCard[];
  upgrades: DeckCard[];
  events: DeckCard[];
  other: DeckCard[];
}

/**
 * Classifies a flat DeckCard[] into 5 named groups.
 * Ground/Space distinction uses card.arenas[], NOT card.type (both are "Unit").
 * Per D-01, D-02, D-03 from Phase 15 context decisions.
 */
export function groupDeckCards(mainDeck: DeckCard[]): GroupedDeck {
  const groups: GroupedDeck = {
    groundUnits: [],
    spaceUnits:  [],
    upgrades:    [],
    events:      [],
    other:       [],
  };
  for (const item of mainDeck) {
    const { card } = item;
    const arenas = card.arenas ?? [];
    if (card.type === 'Unit' && arenas.includes('Ground')) {
      groups.groundUnits.push(item);
    } else if (card.type === 'Unit' && arenas.includes('Space')) {
      groups.spaceUnits.push(item);
    } else if (card.type === 'Upgrade') {
      groups.upgrades.push(item);
    } else if (card.type === 'Event') {
      groups.events.push(item);
    } else {
      groups.other.push(item);
    }
  }
  return groups;
}

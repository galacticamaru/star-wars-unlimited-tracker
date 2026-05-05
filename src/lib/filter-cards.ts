export interface FilterState {
  search: string;
  selectedSets: string[];
  selectedTypes: string[];
  selectedAspects: string[];
}

export interface CardForFilter {
  id: number;
  name: string;
  type: string;
  aspects: string[];
  setCode: string;
  collectorNumber: string;
  frontArtUrl: string | null;
  backArtUrl: string | null;
}

export function filterCards(cards: CardForFilter[], filters: FilterState): CardForFilter[] {
  const { search, selectedSets, selectedTypes, selectedAspects } = filters;

  return cards.filter(card => {
    // Search: case-insensitive substring on name (D-04)
    const matchesSearch = search === '' ||
      card.name.toLowerCase().includes(search.toLowerCase());

    // Set: OR within category (D-05 — AND is across categories)
    const matchesSet = selectedSets.length === 0 ||
      selectedSets.includes(card.setCode);

    // Type: OR within category
    const matchesType = selectedTypes.length === 0 ||
      selectedTypes.includes(card.type);

    // Aspect: subset match — every aspect on the card must be within the selected set.
    // Selecting [Cunning, Heroism] shows cards like [Cunning], [Heroism], [Cunning+Heroism]
    // but hides [Command+Heroism] (Command is outside the selection).
    // Neutral cards (empty aspects array) always pass — every() on [] is true.
    const matchesAspect = selectedAspects.length === 0 ||
      card.aspects.every(a => selectedAspects.includes(a));

    // AND across categories (D-05)
    return matchesSearch && matchesSet && matchesType && matchesAspect;
  });
}

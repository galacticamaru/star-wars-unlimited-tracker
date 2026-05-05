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

    // Aspect: OR within category — card qualifies if it has ANY selected aspect
    // CRITICAL (Pitfall 6): use .some(), NOT .every() — do NOT require all aspects
    const matchesAspect = selectedAspects.length === 0 ||
      card.aspects.some(a => selectedAspects.includes(a));

    // AND across categories (D-05)
    return matchesSearch && matchesSet && matchesType && matchesAspect;
  });
}

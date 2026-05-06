export interface ExportCard {
  name: string;
  quantity: number;
  setCode: string;
  collectorNumber: string;
  isSideboard: boolean;
  type: string;
}

export interface ExportDeck {
  name: string;
  leader: ExportCard | null;
  base: ExportCard | null;
  cards: ExportCard[];
}

function formatMeleeLine(card: ExportCard): string {
  // collectorNumber is "SOR-051", we want "51"
  const number = card.collectorNumber.split('-')[1] || card.collectorNumber;
  return `${card.quantity} ${card.name} [${card.setCode}] [${number}]`;
}

export function toMeleeFormat(deck: ExportDeck): string {
  const lines: string[] = [];

  if (deck.leader) {
    lines.push('Leader');
    lines.push(formatMeleeLine(deck.leader));
    lines.push('');
  }

  if (deck.base) {
    lines.push('Base');
    lines.push(formatMeleeLine(deck.base));
    lines.push('');
  }

  const mainDeck = deck.cards.filter((c) => !c.isSideboard);
  if (mainDeck.length > 0) {
    lines.push('Main Deck');
    mainDeck.forEach((c) => lines.push(formatMeleeLine(c)));
    lines.push('');
  }

  const sideboard = deck.cards.filter((c) => c.isSideboard);
  if (sideboard.length > 0) {
    lines.push('Sideboard');
    sideboard.forEach((c) => lines.push(formatMeleeLine(c)));
  }

  return lines.join('\n').trim();
}

export function toJSONFormat(deck: ExportDeck): string {
  return JSON.stringify(deck, null, 2);
}

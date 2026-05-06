export interface ExportCard {
  name: string;
  subtitle?: string | null;
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
  const fullName = card.subtitle && card.type !== 'Base' ? `${card.name} | ${card.subtitle}` : card.name;
  return `${card.quantity} ${fullName}`;
}

export function toMeleeFormat(deck: ExportDeck): string {
  const lines: string[] = [];

  const mainDeck = deck.cards.filter((c) => !c.isSideboard);
  if (mainDeck.length > 0) {
    lines.push('MainDeck');
    mainDeck.forEach((c) => lines.push(formatMeleeLine(c)));
    lines.push('');
  }

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

import { parseCardTyped } from 'dayflow-shared';
import type { CardGql } from '@/graphql/types';

/** Нормализует карточку с API (type в верхнем регистре, payload строка) в типизированный вид shared */
export function parseCard(card: CardGql) {
  return parseCardTyped({
    ...card,
    type: card.type.toLowerCase() as 'note' | 'link' | 'checklist',
    payload: typeof card.payload === 'string' ? JSON.parse(card.payload || '{}') : card.payload,
  });
}

export type CardParsed = ReturnType<typeof parseCard>;

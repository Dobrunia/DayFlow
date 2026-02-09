// Enum constants to avoid hardcoding strings

export const CARD_TYPES = {
  NOTE: 'note',
  LINK: 'link',
  CHECKLIST: 'checklist',
} as const;

export const LEARNING_STATUSES = {
  WANT_TO_REPEAT: 'want_to_repeat',
  QUESTIONS_REMAIN: 'questions_remain',
  DEEPEN_KNOWLEDGE: 'deepen_knowledge',
} as const;

export type CardTypeKey = keyof typeof CARD_TYPES;
export type LearningStatusKey = keyof typeof LEARNING_STATUSES;

export const LEARNING_STATUS_META = {
  [LEARNING_STATUSES.WANT_TO_REPEAT]: { label: 'Хочу повторить', icon: 'i-lucide-repeat', color: 'text-orange-500' },
  [LEARNING_STATUSES.QUESTIONS_REMAIN]: { label: 'Остались вопросы', icon: 'i-lucide-help-circle', color: 'text-red-500' },
  [LEARNING_STATUSES.DEEPEN_KNOWLEDGE]: { label: 'Хочу углубить знания', icon: 'i-lucide-book-open', color: 'text-blue-500' },
} as const;

export const CARD_TYPE_META = {
  [CARD_TYPES.NOTE]: { label: 'Заметка', icon: 'i-lucide-file-text' },
  [CARD_TYPES.LINK]: { label: 'Ссылка', icon: 'i-lucide-external-link' },
  [CARD_TYPES.CHECKLIST]: { label: 'Чеклист', icon: 'i-lucide-check-square' },
} as const;

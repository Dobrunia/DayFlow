import { ref, computed } from 'vue';
import { CARD_TYPES } from '@/lib/constants';
import type { CardGql, LearningStatus } from '@/graphql/types';
import type { ChecklistItem, NotePayload, LinkPayload, ChecklistPayload } from '@/lib/card-payload';

export function useCardForm() {
  // --- State ---
  const title = ref('');
  const cardType = ref<typeof CARD_TYPES[keyof typeof CARD_TYPES]>(CARD_TYPES.NOTE);
  
  // Type-specific fields
  const noteContent = ref('');
  const noteSummary = ref('');
  const linkUrl = ref('');
  const linkSummary = ref('');
  const checklistItems = ref<ChecklistItem[]>([]);
  const checklistSummary = ref('');
  
  // Meta
  const tagsInput = ref('');
  const learningStatus = ref<LearningStatus | null>(null);

  // --- Computed ---
  // Unified summary access
  const currentSummary = computed({
    get: () => {
      if (cardType.value === CARD_TYPES.NOTE) return noteSummary.value;
      if (cardType.value === CARD_TYPES.LINK) return linkSummary.value;
      return checklistSummary.value;
    },
    set: (val) => {
      if (cardType.value === CARD_TYPES.NOTE) noteSummary.value = val;
      else if (cardType.value === CARD_TYPES.LINK) linkSummary.value = val;
      else checklistSummary.value = val;
    }
  });

  // --- Actions ---

  function reset() {
    title.value = '';
    cardType.value = CARD_TYPES.NOTE;
    noteContent.value = '';
    noteSummary.value = '';
    linkUrl.value = '';
    linkSummary.value = '';
    checklistItems.value = [{ id: crypto.randomUUID(), text: '', done: false, order: 100 }];
    checklistSummary.value = '';
    tagsInput.value = '';
    learningStatus.value = null;
  }

  function setFromCard(card: CardGql) {
    title.value = card.title ?? '';
    cardType.value = card.type as typeof CARD_TYPES[keyof typeof CARD_TYPES];
    learningStatus.value = card.learningStatus ?? null;
    tagsInput.value = Array.isArray(card.tags) ? card.tags.join(', ') : '';

    try {
      const pl = typeof card.payload === 'string' ? JSON.parse(card.payload || '{}') : card.payload;
      
      if (card.type === CARD_TYPES.NOTE) {
        const payload = pl as NotePayload;
        noteContent.value = payload.content ?? '';
        noteSummary.value = payload.summary ?? '';
      } else if (card.type === CARD_TYPES.LINK) {
        const payload = pl as LinkPayload;
        linkUrl.value = payload.url ?? '';
        linkSummary.value = payload.summary ?? '';
      } else if (card.type === CARD_TYPES.CHECKLIST) {
        const payload = pl as ChecklistPayload;
        const items = payload.items ?? [];
        checklistItems.value = items.length
          ? items.map((i) => ({ ...i }))
          : [{ id: crypto.randomUUID(), text: '', done: false, order: 100 }];
        checklistSummary.value = payload.summary ?? '';
      }
    } catch {
      console.error('Failed to parse card payload');
      reset(); // Fallback to defaults
      // Restore basic fields overwritten by reset
      title.value = card.title ?? '';
      cardType.value = card.type as typeof CARD_TYPES[keyof typeof CARD_TYPES];
    }
  }

  function getPayloadString(): string {
    if (cardType.value === CARD_TYPES.NOTE) {
      return JSON.stringify({
        content: noteContent.value.trim() || undefined,
        summary: noteSummary.value.trim() || undefined,
      });
    }
    if (cardType.value === CARD_TYPES.LINK) {
      return JSON.stringify({
        url: linkUrl.value.trim(),
        summary: linkSummary.value.trim() || undefined,
      });
    }
    // Checklist
    const items = checklistItems.value
      .filter((i) => i.text.trim())
      .map((i, idx) => ({ ...i, order: (idx + 1) * 100 }));
    return JSON.stringify({
      items,
      summary: checklistSummary.value.trim() || undefined,
    });
  }

  function getTagsArray(): string[] {
    return tagsInput.value.split(',').map((s) => s.trim()).filter(Boolean);
  }

  // --- Checklist Helpers ---
  function addChecklistItem() {
    const maxOrder = checklistItems.value.length
      ? Math.max(...checklistItems.value.map((i) => i.order))
      : 0;
    checklistItems.value.push({
      id: crypto.randomUUID(),
      text: '',
      done: false,
      order: maxOrder + 100,
    });
  }

  function removeChecklistItem(index: number) {
    if (checklistItems.value.length > 1) {
      checklistItems.value.splice(index, 1);
    }
  }

  return {
    // State
    title,
    cardType,
    noteContent,
    linkUrl,
    checklistItems,
    currentSummary,
    tagsInput,
    learningStatus,
    
    // Actions
    reset,
    setFromCard,
    getPayloadString,
    getTagsArray,
    addChecklistItem,
    removeChecklistItem
  };
}

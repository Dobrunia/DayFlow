import { computed, type Ref, type ComputedRef } from 'vue';
import { useCardsStore } from '@/stores/cards';
import { useWorkspaceStore } from '@/stores/workspace';
import { toast } from 'vue-sonner';
import { getGraphQLErrorMessage } from '@/lib/graphql-error';
import type { CardGql, UpdateCardInput } from '@/graphql/types';
import { CARD_TYPES } from '@/lib/constants';

interface UseCardActionsOptions {
  /** Callback после успешного обновления карточки */
  onUpdated?: (card: CardGql) => void;
  /** Callback после удаления карточки (вызывается сразу, optimistic) */
  onDeleted?: (cardId: string) => void;
}

/**
 * Composable для унифицированной работы с карточками (hub и workspace).
 * Автоматически определяет какой store использовать и показывает toast с undo при удалении.
 */
export function useCardActions(
  card: Ref<CardGql> | ComputedRef<CardGql> | (() => CardGql),
  options: UseCardActionsOptions = {}
) {
  const cardsStore = useCardsStore();
  const workspaceStore = useWorkspaceStore();

  const getCard = () => (typeof card === 'function' ? card() : card.value);

  /** Hub card = карточка без workspaceId */
  const isHubCard = computed(() => getCard().workspaceId == null);

  /**
   * Обновить карточку (optimistic update)
   */
  async function updateCard(input: UpdateCardInput): Promise<CardGql | null> {
    const c = getCard();
    const updatedCard = { ...c, ...input } as CardGql;
    
    // Optimistic: emit immediately
    options.onUpdated?.(updatedCard);
    
    try {
      if (isHubCard.value) {
        await cardsStore.updateCard(c.id, input);
      } else {
        await workspaceStore.updateCard(c.id, input);
      }
      return updatedCard;
    } catch (e) {
      // Revert on error
      options.onUpdated?.(c);
      toast.error(getGraphQLErrorMessage(e));
      return null;
    }
  }

  /**
   * Удалить карточку с toast и undo (optimistic)
   */
  async function deleteCard(): Promise<boolean> {
    const c = getCard();
    const cardId = c.id;
    
    // Optimistic: уведомляем об удалении сразу
    options.onDeleted?.(cardId);
    
    // Показываем toast с undo сразу
    if (isHubCard.value) {
      toast('Карточка удалена', {
        action: {
          label: 'Отменить',
          onClick: () => {
            cardsStore.undoDeleteCard().catch((e) => {
              toast.error(getGraphQLErrorMessage(e));
            });
          },
        },
        duration: 5000,
      });
    } else {
      toast('Карточка удалена', {
        action: {
          label: 'Отменить',
          onClick: () => {
            workspaceStore.undoDeleteCard().catch((e) => {
              toast.error(getGraphQLErrorMessage(e));
            });
          },
        },
        duration: 5000,
      });
    }

    try {
      if (isHubCard.value) {
        await cardsStore.deleteCard(cardId);
      } else {
        await workspaceStore.deleteCard(cardId);
      }
      return true;
    } catch (e) {
      toast.error(getGraphQLErrorMessage(e));
      return false;
    }
  }

  /**
   * Переключить статус done
   */
  async function toggleDone(): Promise<CardGql | null> {
    const c = getCard();
    return updateCard({ done: !c.done });
  }

  /**
   * Обновить payload карточки (например, для чеклиста или summary)
   */
  async function updatePayload(payload: string): Promise<CardGql | null> {
    return updateCard({ payload });
  }

  /**
   * Обновить summary в payload
   */
  async function updateSummary(summary: string): Promise<CardGql | null> {
    const c = getCard();
    const raw = typeof c.payload === 'string' ? JSON.parse(c.payload || '{}') : c.payload;
    const newPayload = JSON.stringify({ ...raw, summary: summary.trim() || undefined });
    return updateCard({ payload: newPayload });
  }

  /**
   * Переключить элемент чеклиста
   */
  async function toggleChecklistItem(index: number): Promise<CardGql | null> {
    const c = getCard();
    if (c.type !== CARD_TYPES.CHECKLIST) return null;

    const raw = typeof c.payload === 'string' ? JSON.parse(c.payload || '{}') : c.payload;
    const items = Array.isArray((raw as { items?: unknown[] }).items)
      ? (raw as { items: { id: string; text: string; done: boolean; order: number }[] }).items
      : [];
    const next = items.map((it, i) => (i === index ? { ...it, done: !it.done } : it));
    const newPayload = JSON.stringify({ items: next });
    return updateCard({ payload: newPayload });
  }

  return {
    isHubCard,
    updateCard,
    deleteCard,
    toggleDone,
    updatePayload,
    updateSummary,
    toggleChecklistItem,
  };
}

import { computed, type Ref } from 'vue';
import type { CardGql } from '@/graphql/types';

/**
 * Группирует плоский список карточек на:
 * 1. Хаб (карточки без workspaceId)
 * 2. Воркспейсы (сгруппированные по workspaceId и отсортированные по названию)
 */
export function useCardGrouping(cards: Ref<CardGql[]>) {
  const hubCards = computed(() => cards.value.filter((c) => !c.workspaceId));

  const workspaceCards = computed(() => {
    const map = new Map<string, { workspace: NonNullable<CardGql['workspace']>; cards: CardGql[] }>();

    cards.value.forEach((c) => {
      if (c.workspaceId && c.workspace) {
        if (!map.has(c.workspaceId)) {
          map.set(c.workspaceId, { workspace: c.workspace, cards: [] });
        }
        map.get(c.workspaceId)!.cards.push(c);
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.workspace.title.localeCompare(b.workspace.title)
    );
  });

  return {
    hubCards,
    workspaceCards,
  };
}

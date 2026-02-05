<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Sortable from 'sortablejs';
import { useWorkspaceStore } from '@/stores/workspace';
import type { Column, CardGql } from '@/graphql/types';
import { useInlineEdit } from '@/composables/useInlineEdit';
import CardItem from '@/components/card/CardItem.vue';
import CreateCardDialog from '@/components/card/CreateCardDialog.vue';
import { toast } from 'vue-sonner';
import { getGraphQLErrorMessage } from '@/lib/graphql-error';

const props = withDefaults(
  defineProps<{
    column: Column;
    workspaceId: string;
    /** Карточки беклога (без колонки) */
    backlogCards?: CardGql[];
    /** Это колонка беклога (показывать всегда, не удалять) */
    isBacklogColumn?: boolean;
    /** Поисковый запрос для фильтрации карточек */
    searchQuery?: string;
  }>(),
  { backlogCards: () => [], isBacklogColumn: false, searchQuery: '' }
);

const workspaceStore = useWorkspaceStore();
const showAddCard = ref(false);
const headerRef = ref<HTMLElement | null>(null);
const cardsListRef = ref<HTMLElement | null>(null);
let sortable: Sortable | null = null;

const isBacklog = computed(() => props.isBacklogColumn);

const { isEditing, editTitle, inputRef, startEdit, saveEdit } = useInlineEdit(
  headerRef,
  () => props.column.title,
  (newTitle) =>
    isBacklog.value ? Promise.resolve() : workspaceStore.updateColumn(props.column.id, newTitle)
);

const cards = computed(() => props.column.cards ?? []);

/** Фильтрация карточек по title/tags */
function matchesSearch(card: CardGql, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  if (card.title?.toLowerCase().includes(q)) return true;
  if (card.tags?.some((tag) => tag.toLowerCase().includes(q))) return true;
  return false;
}

const filteredCards = computed(() =>
  cards.value.filter((c) => matchesSearch(c, props.searchQuery ?? ''))
);

const filteredBacklogCards = computed(() =>
  (props.backlogCards ?? []).filter((c) => matchesSearch(c, props.searchQuery ?? ''))
);

function handleDragEnd(evt: Sortable.SortableEvent) {
  const el = evt.item as HTMLElement;
  const to = evt.to as HTMLElement;
  const cardId = el.dataset.cardId;
  if (!cardId) return;

  // -1 потому что первый элемент в контейнере — кнопка "Добавить карточку"
  const order = Math.max(0, (evt.newIndex ?? 1) - 1);
  const toBacklog = to.dataset.backlog != null;
  const toColumnId = to.dataset.columnId;

  const doMove = (targetColumnId: string | null) => {
    workspaceStore.moveCard(cardId, targetColumnId, order)
      .then(() => {
        toast('Карточка перемещена', {
          action: {
            label: 'Отменить',
            onClick: () => {
              workspaceStore.undoLastMove().catch((e) => {
                toast.error(getGraphQLErrorMessage(e));
              });
            },
          },
          duration: 5000,
        });
      })
      .catch((e) => {
        toast.error(getGraphQLErrorMessage(e));
      });
  };

  if (toBacklog) {
    doMove(null);
    return;
  }

  if (toColumnId) {
    doMove(toColumnId);
  }
}

onMounted(() => {
  if (!cardsListRef.value) return;
  sortable = new Sortable(cardsListRef.value, {
    group: { name: 'cards', pull: true, put: true },
    animation: 150,
    ghostClass: 'opacity-50',
    filter: '.sortable-no-drag',
    onEnd: handleDragEnd,
  });
});

onUnmounted(() => {
  sortable?.destroy();
  sortable = null;
});

async function deleteColumn() {
  if (isBacklog.value) return;
  if (!confirm('Удалить колонку и все карточки в ней?')) return;
  try {
    await workspaceStore.deleteColumn(props.column.id);
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  }
}
</script>

<template>
  <div class="flex-shrink-0 w-72 flex flex-col bg-muted rounded-xl">
    <div ref="headerRef" class="group p-3 flex-between">
      <div v-if="!isBacklog && isEditing" class="flex-1 mr-2 min-w-0">
        <input
          ref="inputRef"
          v-model="editTitle"
          @keyup.enter="saveEdit"
          @keyup.escape="isEditing = false"
          @blur="saveEdit"
          class="input text-sm font-medium py-1"
        />
      </div>
      <h3
        v-else
        :title="column.title"
        class="font-medium text-fg truncate flex-1 min-w-0"
        :class="{ 'cursor-text': !isBacklog }"
        @dblclick="!isBacklog && startEdit()"
      >
        {{ column.title }}
      </h3>

      <div class="flex items-center gap-0.5 shrink-0">
        <span class="text-xs text-fg-muted mr-0.5">
          {{ isBacklog ? filteredBacklogCards.length : filteredCards.length }}
        </span>
        <button
          v-if="!isBacklog"
          type="button"
          @click="deleteColumn"
          class="header-icon-danger"
          title="Удалить колонку"
        >
          <span class="i-lucide-trash-2 text-xs" />
        </button>
      </div>
    </div>

    <div
      ref="cardsListRef"
      class="flex-1 overflow-y-auto px-2 pb-2 flex flex-col gap-2 min-h-[2rem]"
      :data-column-id="isBacklog ? undefined : column.id"
      :data-backlog="isBacklog ? true : undefined"
    >
      <button type="button" @click="showAddCard = true" class="btn-add-dashed sortable-no-drag flex-shrink-0 order-first">
        <span class="i-lucide-plus text-sm" />
        Добавить карточку
      </button>
      <template v-if="isBacklog">
        <CardItem
          v-for="c in filteredBacklogCards"
          :key="c.id"
          :card="c"
          :is-backlog="true"
        />
      </template>
      <template v-else>
        <CardItem
          v-for="card in filteredCards"
          :key="card.id"
          :card="card"
          :column-id="column.id"
        />
      </template>
    </div>

    <CreateCardDialog
      :open="showAddCard"
      :column-id="isBacklog ? undefined : column.id"
      :workspace-id="workspaceId"
      :is-backlog="isBacklog"
      @close="showAddCard = false"
    />
  </div>
</template>

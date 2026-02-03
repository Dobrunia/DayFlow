<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Sortable from 'sortablejs';
import { useWorkspaceStore } from '@/stores/workspace';
import type { Column, Item } from '@/graphql/types';
import { useInlineEdit } from '@/composables/useInlineEdit';
import CardItem from './CardItem.vue';
import AddCardDialog from './AddCardDialog.vue';
import { toast } from 'vue-sonner';

const props = defineProps<{
  column: Column;
  workspaceId: string;
  /** Режим беклога: элементы без колонки. Нельзя удалить/редактировать колонку, нет кнопки «Добавить карточку». */
  backlogItems?: Item[];
}>();

const workspaceStore = useWorkspaceStore();
const showAddCard = ref(false);
const headerRef = ref<HTMLElement | null>(null);
const cardsListRef = ref<HTMLElement | null>(null);
let sortable: Sortable | null = null;

const isBacklog = computed(() => (props.backlogItems?.length ?? 0) > 0);

const { isEditing, editTitle, inputRef, startEdit, saveEdit } = useInlineEdit(
  headerRef,
  () => props.column.title,
  (newTitle) =>
    isBacklog.value ? Promise.resolve() : workspaceStore.updateColumn(props.column.id, newTitle)
);

const cards = computed(() => props.column.cards ?? []);

function handleDragEnd(evt: Sortable.SortableEvent) {
  const el = evt.item as HTMLElement;
  const to = evt.to as HTMLElement;
  const toBacklog = !!to.dataset.backlog;
  const toColumnId = to.dataset.columnId;

  if (toBacklog) {
    const cardId = el.dataset.cardId;
    if (cardId) {
      workspaceStore.deleteCard(cardId).catch(() => {
        toast.error('Ошибка перемещения в беклог');
      });
    }
    return;
  }

  if (!toColumnId) return;

  const itemId = el.dataset.itemId;
  if (itemId) {
    workspaceStore.addItemToColumn(itemId, toColumnId).catch(() => {
      toast.error('Ошибка добавления в колонку');
    });
    return;
  }

  const cardId = el.dataset.cardId;
  if (!cardId) return;
  const order = evt.newIndex ?? 0;
  workspaceStore.moveCard(cardId, toColumnId, order).catch(() => {
    toast.error('Ошибка перемещения');
  });
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
  } catch {
    toast.error('Ошибка удаления');
  }
}
</script>

<template>
  <div class="flex-shrink-0 w-72 flex flex-col bg-muted rounded-xl">
    <!-- Header: в беклоге без редактирования и удаления -->
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
        class="font-medium text-fg truncate flex-1 min-w-0"
        :class="{ 'cursor-text': !isBacklog }"
        @dblclick="!isBacklog && startEdit()"
      >
        {{ column.title }}
      </h3>

      <div class="flex items-center gap-0.5 shrink-0">
        <span class="text-xs text-fg-muted mr-0.5">
          {{ isBacklog ? backlogItems!.length : cards.length }}
        </span>
        <button
          v-if="!isBacklog"
          type="button"
          @click="deleteColumn"
          class="header-icon-hover hover:text-danger"
          title="Удалить колонку"
        >
          <span class="i-lucide-trash-2 text-xs" />
        </button>
      </div>
    </div>

    <!-- Список: карточки колонки или элементы беклога -->
    <div
      ref="cardsListRef"
      class="flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-[2rem]"
      :data-column-id="isBacklog ? undefined : column.id"
      :data-backlog="isBacklog ? true : undefined"
    >
      <template v-if="isBacklog">
        <CardItem v-for="item in backlogItems" :key="item.id" :item="item" />
      </template>
      <template v-else>
        <CardItem v-for="card in cards" :key="card.id" :card="card" :column-id="column.id" />

        <!-- Add Card Button (not draggable) -->
        <button @click="showAddCard = true" class="btn-add-dashed sortable-no-drag">
          <span class="i-lucide-plus text-sm" />
          Добавить карточку
        </button>
      </template>
    </div>

    <!-- Add Card Dialog (только для обычной колонки) -->
    <AddCardDialog
      v-if="!isBacklog"
      :open="showAddCard"
      :column-id="column.id"
      @close="showAddCard = false"
    />
  </div>
</template>

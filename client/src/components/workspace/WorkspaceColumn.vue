<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import Sortable from 'sortablejs';
import { useWorkspaceStore } from '@/stores/workspace';
import type { Column, CardGql } from '@/graphql/types';
import { useInlineEdit } from '@/composables/useInlineEdit';
import CardItem from '@/components/card/CardItem.vue';
import CreateCardDialog from '@/components/card/CreateCardDialog.vue';
import { toast } from 'vue-sonner';
import { getGraphQLErrorMessage } from '@/lib/graphql-error';
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
} from 'radix-vue';

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
    /** Это первая колонка (не беклог) */
    isFirst?: boolean;
    /** Это последняя колонка */
    isLast?: boolean;
    /** Режим только чтение */
    readOnly?: boolean;
  }>(),
  {
    backlogCards: () => [],
    isBacklogColumn: false,
    searchQuery: '',
    isFirst: false,
    isLast: false,
    readOnly: false,
  }
);

const COLUMN_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#78716c',
];

const workspaceStore = useWorkspaceStore();
const showAddCard = ref(false);
const showEditModal = ref(false);
const editColor = ref<string | null>(null);
const backlogHideCompleted = ref(false);
const hideCompleted = computed(() =>
  props.isBacklogColumn ? backlogHideCompleted.value : (props.column.hideCompleted ?? false)
);
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
  cards.value.filter((c) => {
    if (hideCompleted.value && c.done) return false;
    return matchesSearch(c, props.searchQuery ?? '');
  })
);

const filteredBacklogCards = computed(() =>
  (props.backlogCards ?? []).filter((c) => {
    if (hideCompleted.value && c.done) return false;
    return matchesSearch(c, props.searchQuery ?? '');
  })
);

const completedCount = computed(() => {
  const list = isBacklog.value ? (props.backlogCards ?? []) : cards.value;
  return list.filter((c) => c.done).length;
});

function handleDragEnd(evt: Sortable.SortableEvent) {
  const el = evt.item as HTMLElement;
  const from = evt.from as HTMLElement;
  const to = evt.to as HTMLElement;
  const cardId = el.dataset.cardId;
  if (!cardId) return;

  const order = evt.newIndex ?? 0;
  const toBacklog = to.dataset.backlog != null;
  const toColumnId = to.dataset.columnId;

  // Revert SortableJS DOM manipulation — let Vue re-render from reactive state
  // Otherwise SortableJS and Vue fight over the DOM causing off-by-1 glitches
  const oldIndex = evt.oldIndex;
  if (from === to) {
    // Same container: move element back to its original DOM position
    const ref = from.children[oldIndex!] ?? null;
    if (ref) {
      from.insertBefore(el, ref);
    } else {
      from.appendChild(el);
    }
  } else {
    // Different containers: move element back to source container
    const ref = from.children[oldIndex!] ?? null;
    to.removeChild(el);
    if (ref) {
      from.insertBefore(el, ref);
    } else {
      from.appendChild(el);
    }
  }

  const doMove = (targetColumnId: string | null) => {
    workspaceStore.moveCard(cardId, targetColumnId, order).catch((e) => {
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
    disabled: props.readOnly,
    onEnd: handleDragEnd,
  });
});

watch(
  () => props.readOnly,
  (ro) => {
    if (sortable) sortable.option('disabled', ro);
  }
);

onUnmounted(() => {
  sortable?.destroy();
  sortable = null;
});

function openEditModal() {
  editColor.value = props.column.color ?? null;
  showEditModal.value = true;
}

function selectColor(c: string | null) {
  editColor.value = c;
  workspaceStore.updateColumnColor(props.column.id, c).catch((e) => {
    toast.error(getGraphQLErrorMessage(e));
  });
}

async function deleteColumn() {
  if (isBacklog.value) return;
  showEditModal.value = false;

  const colTitle = props.column.title;

  try {
    await workspaceStore.deleteColumn(props.column.id);
    toast(`«${colTitle}» удалена`, {
      action: {
        label: 'Отменить',
        onClick: () => {
          workspaceStore
            .undoDeleteColumn()
            .then(() => {
              toast.success('Колонка восстановлена');
            })
            .catch((e) => {
              toast.error(getGraphQLErrorMessage(e));
            });
        },
      },
    });
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  }
}

async function moveLeft() {
  try {
    await workspaceStore.moveColumnLeft(props.column.id);
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  }
}

async function moveRight() {
  try {
    await workspaceStore.moveColumnRight(props.column.id);
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  }
}
</script>

<template>
  <div
    class="flex-shrink-0 w-72 flex flex-col rounded-xl"
    :style="
      column.color
        ? {
            background: `color-mix(in srgb, ${column.color} 6%, rgb(var(--bg)))`,
            borderTop: `2px solid color-mix(in srgb, ${column.color} 40%, transparent)`,
          }
        : { background: 'rgb(var(--fg) / 0.05)', borderTop: '2px solid transparent' }
    "
  >
    <div ref="headerRef" class="group h-12 px-3 flex-between">
      <div v-if="!isBacklog && !readOnly && isEditing" class="flex-1 mr-2 min-w-0">
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
        class="flex items-baseline min-w-0 leading-none flex-1"
        :class="{ 'cursor-text': !isBacklog && !readOnly }"
      >
        <span
          class="font-medium text-fg truncate"
          :title="column.title"
          @dblclick="!isBacklog && !readOnly && startEdit()"
          >{{ column.title || '!?' }}</span
        >
        <span class="text-xs text-muted font-normal ml-1 tabular-nums shrink-0"
          >{{ isBacklog ? filteredBacklogCards.length : filteredCards.length
          }}<template v-if="hideCompleted || searchQuery"
            >/{{ isBacklog ? (backlogCards ?? []).length : cards.length }}</template
          ></span
        >
      </h3>

      <div v-if="!readOnly" class="flex items-center gap-0.5 shrink-0 leading-none">
        <button
          v-if="completedCount > 0"
          type="button"
          @click="
            isBacklog
              ? (backlogHideCompleted = !backlogHideCompleted)
              : workspaceStore.toggleHideCompleted(column.id)
          "
          class="icon-btn-ghost"
          :class="{ 'text-primary': hideCompleted }"
          :title="hideCompleted ? `Показать выполненные (${completedCount})` : 'Скрыть выполненные'"
        >
          <span :class="hideCompleted ? 'i-lucide-eye-off' : 'i-lucide-eye'" />
        </button>
        <template v-if="!isBacklog">
          <button
            type="button"
            :disabled="isFirst"
            @click="moveLeft"
            class="icon-btn-ghost w-6 h-6 disabled:opacity-30 disabled:pointer-events-none"
            title="Переместить влево"
          >
            <span class="i-lucide-chevron-left" />
          </button>
          <button
            type="button"
            :disabled="isLast"
            @click="moveRight"
            class="icon-btn-ghost w-6 h-6 disabled:opacity-30 disabled:pointer-events-none"
            title="Переместить вправо"
          >
            <span class="i-lucide-chevron-right" />
          </button>
          <button
            type="button"
            @click="openEditModal"
            class="icon-btn-ghost"
            title="Настройки колонки"
          >
            <span class="i-lucide-settings" />
          </button>
        </template>
      </div>
    </div>

    <div v-if="!readOnly" class="px-2 pb-2 shrink-0">
      <button
        type="button"
        @click="showAddCard = true"
        class="w-full h-10 border border-dashed border-border rounded-[var(--r)] text-sm text-muted hover:text-fg hover:border-fg/30 flex-center gap-1.5 leading-none transition-colors"
      >
        <span class="i-lucide-plus" />
        <span>Добавить карточку</span>
      </button>
    </div>

    <div
      ref="cardsListRef"
      class="flex-1 overflow-y-auto scrollbar-hide px-2 py-2 flex flex-col gap-2 min-h-[2rem]"
      :data-column-id="isBacklog ? undefined : column.id"
      :data-backlog="isBacklog ? true : undefined"
    >
      <template v-if="isBacklog">
        <CardItem
          v-for="c in filteredBacklogCards"
          :key="c.id"
          :card="c"
          :is-backlog="true"
          :read-only="readOnly"
        />
      </template>
      <template v-else>
        <CardItem
          v-for="card in filteredCards"
          :key="card.id"
          :card="card"
          :column-id="column.id"
          :read-only="readOnly"
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

    <!-- Edit Column Modal -->
    <DialogRoot v-model:open="showEditModal">
      <DialogPortal>
        <DialogOverlay class="dialog-overlay" @click="showEditModal = false" />
        <DialogContent
          :aria-describedby="undefined"
          class="dialog-content"
          @escape-key-down="showEditModal = false"
        >
          <div class="dialog-header">
            <DialogTitle class="dialog-title">Настройки колонки</DialogTitle>
            <DialogClose class="icon-btn-close">
              <span class="i-lucide-x" />
            </DialogClose>
          </div>

          <div class="space-y-4">
            <!-- Color palette -->
            <div>
              <p class="text-sm font-medium mb-2">Цвет</p>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="w-7 h-7 rounded-full border-2 flex-center transition-all"
                  :class="
                    editColor === null
                      ? 'border-primary scale-110'
                      : 'border-border hover:border-fg/30'
                  "
                  title="Без цвета"
                  @click="selectColor(null)"
                >
                  <span class="i-lucide-x text-xs text-muted" />
                </button>
                <button
                  v-for="c in COLUMN_COLORS"
                  :key="c"
                  type="button"
                  class="w-7 h-7 rounded-full border-2 transition-all"
                  :class="
                    editColor === c
                      ? 'border-primary scale-110'
                      : 'border-transparent hover:scale-110'
                  "
                  :style="{ background: c }"
                  @click="selectColor(c)"
                />
              </div>
            </div>

            <!-- Delete -->
            <div class="pt-2 border-t border-border">
              <button type="button" class="btn-delete w-full" @click="deleteColumn">
                <span class="i-lucide-trash-2" />
                <span>Удалить колонку</span>
              </button>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>

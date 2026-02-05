<script setup lang="ts">
import { ref, watch, computed, nextTick, onUnmounted } from 'vue';
import Sortable from 'sortablejs';
import { useWorkspaceStore } from '@/stores/workspace';
import { useCardsStore } from '@/stores/cards';
import type { CardGql } from '@/graphql/types';
import type { ChecklistItem } from 'dayflow-shared';
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
    open: boolean;
    /** При создании в колонку */
    columnId?: string;
    /** При создании в хаб/беклог */
    workspaceId?: string;
    /** Режим редактирования */
    card?: CardGql | null;
    isBacklog?: boolean;
  }>(),
  { card: null, isBacklog: false }
);

const emit = defineEmits<{
  close: [];
  delete: [];
}>();

const openProxy = computed({
  get: () => props.open,
  set: (v: boolean) => {
    if (!v) emit('close');
  },
});

const workspaceStore = useWorkspaceStore();
const cardsStore = useCardsStore();

/** Добавление из хедера (кнопка «Добавить»), не из колонки/беклога */
const isGlobalAdd = computed(() => !props.card && !props.columnId && props.workspaceId == null);
const isHubEdit = computed(() => !!props.card && props.card.workspaceId == null);

const addDestination = ref<'hub' | 'workspace'>('hub');
const selectedWorkspaceId = ref<string | null>(null);
const workspaces = computed(() => workspaceStore.workspaces);

const title = ref('');
const cardType = ref<'NOTE' | 'LINK' | 'CHECKLIST'>('NOTE');
const noteContent = ref('');
const noteSummary = ref('');
const linkUrl = ref('');
const linkSummary = ref('');
const checklistItems = ref<ChecklistItem[]>([]);
const checklistSummary = ref('');
const tagsInput = ref('');
const loading = ref(false);
const checklistListRef = ref<HTMLElement | null>(null);
let checklistSortable: Sortable | null = null;

const isEditMode = computed(() => !!props.card);

const types = [
  { value: 'NOTE' as const, label: 'Заметка', icon: 'i-lucide-file-text' },
  { value: 'LINK' as const, label: 'Ссылка', icon: 'i-lucide-link' },
  { value: 'CHECKLIST' as const, label: 'Чеклист', icon: 'i-lucide-check-square' },
];

function initChecklistSortable() {
  checklistSortable?.destroy();
  checklistSortable = null;
  if (!checklistListRef.value || cardType.value !== 'CHECKLIST') return;
  checklistSortable = new Sortable(checklistListRef.value, {
    animation: 150,
    handle: '.checklist-grip',
    ghostClass: 'opacity-50',
    onEnd(evt) {
      const from = evt.oldIndex ?? 0;
      const to = evt.newIndex ?? 0;
      if (from === to) return;
      const arr = [...checklistItems.value];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      checklistItems.value = arr;
      nextTick(() => initChecklistSortable());
    },
  });
}

watch(
  () => [props.open, props.card] as const,
  ([isOpen, card]) => {
    if (isOpen) {
      if (card) {
        title.value = card.title ?? '';
        cardType.value = card.type as 'NOTE' | 'LINK' | 'CHECKLIST';
        try {
          const pl = typeof card.payload === 'string' ? JSON.parse(card.payload || '{}') : card.payload;
          if (card.type === 'NOTE') {
            noteContent.value = (pl as { content?: string }).content ?? '';
            noteSummary.value = (pl as { summary?: string }).summary ?? '';
          } else if (card.type === 'LINK') {
            linkUrl.value = (pl as { url?: string }).url ?? '';
            linkSummary.value = (pl as { summary?: string }).summary ?? '';
          } else if (card.type === 'CHECKLIST') {
            const items = (pl as { items?: { id: string; text: string; done: boolean; order: number }[] }).items ?? [];
            checklistItems.value = items.length ? items.map((i) => ({ ...i })) : [{ id: crypto.randomUUID(), text: '', done: false, order: 100 }];
            checklistSummary.value = (pl as { summary?: string }).summary ?? '';
          }
        tagsInput.value = Array.isArray(card.tags) ? card.tags.join(', ') : '';
        } catch {
          noteContent.value = '';
          noteSummary.value = '';
          linkUrl.value = '';
          linkSummary.value = '';
          checklistItems.value = [{ id: crypto.randomUUID(), text: '', done: false, order: 100 }];
          checklistSummary.value = '';
          tagsInput.value = '';
        }
      } else {
        title.value = '';
        cardType.value = 'NOTE';
        noteContent.value = '';
        noteSummary.value = '';
        linkUrl.value = '';
        linkSummary.value = '';
        checklistItems.value = [{ id: crypto.randomUUID(), text: '', done: false, order: 100 }];
        checklistSummary.value = '';
        addDestination.value = 'hub';
        selectedWorkspaceId.value = null;
        tagsInput.value = '';
        if (!props.columnId && props.workspaceId == null) workspaceStore.fetchWorkspaces();
      }
      nextTick(() => initChecklistSortable());
    } else {
      checklistSortable?.destroy();
      checklistSortable = null;
    }
  }
);

watch(cardType, (t) => {
  if (t === 'CHECKLIST') nextTick(() => initChecklistSortable());
  else {
    checklistSortable?.destroy();
    checklistSortable = null;
  }
});

onUnmounted(() => {
  checklistSortable?.destroy();
});

function addChecklistItem() {
  const maxOrder = checklistItems.value.length ? Math.max(...checklistItems.value.map((i) => i.order)) : 0;
  checklistItems.value.push({
    id: crypto.randomUUID(),
    text: '',
    done: false,
    order: maxOrder + 100,
  });
  nextTick(() => initChecklistSortable());
}

function removeChecklistItem(index: number) {
  if (checklistItems.value.length > 1) {
    checklistItems.value.splice(index, 1);
    nextTick(() => initChecklistSortable());
  }
}

function buildTags(): string[] {
  return tagsInput.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildPayload(): string {
  if (cardType.value === 'NOTE') {
    return JSON.stringify({
      content: noteContent.value.trim() || undefined,
      summary: noteSummary.value.trim() || undefined,
    });
  }
  if (cardType.value === 'LINK') {
    return JSON.stringify({
      url: linkUrl.value.trim(),
      summary: linkSummary.value.trim() || undefined,
    });
  }
  const items = checklistItems.value
    .filter((i) => i.text.trim())
    .map((i, idx) => ({ ...i, order: (idx + 1) * 100 }));
  return JSON.stringify({
    items,
    summary: checklistSummary.value.trim() || undefined,
  });
}

async function handleSubmit() {
  if (cardType.value === 'LINK' && !linkUrl.value.trim()) {
    toast.error('Введите URL ссылки');
    return;
  }
  if (isGlobalAdd.value && addDestination.value === 'workspace' && !selectedWorkspaceId.value) {
    toast.error('Выберите воркспейс');
    return;
  }

  try {
    loading.value = true;
    const payload = buildPayload();
    const tags = buildTags();

    if (props.card) {
      const updatePayload = { title: title.value.trim() || undefined, payload, tags };
      if (isHubEdit.value) await cardsStore.updateCard(props.card.id, updatePayload);
      else await workspaceStore.updateCard(props.card.id, updatePayload);
      toast.success('Сохранено!');
    } else if (isGlobalAdd.value && addDestination.value === 'hub') {
      await cardsStore.createCard({
        type: cardType.value,
        title: title.value.trim() || undefined,
        payload,
        tags,
      });
      toast.success('Карточка создана в хабе!');
    } else if (isGlobalAdd.value && addDestination.value === 'workspace') {
      await workspaceStore.createCard({
        type: cardType.value,
        title: title.value.trim() || undefined,
        workspaceId: selectedWorkspaceId.value!,
        columnId: undefined,
        payload,
        tags,
      });
      toast.success('Карточка добавлена в беклог воркспейса');
    } else {
      await workspaceStore.createCard({
        type: cardType.value,
        title: title.value.trim() || undefined,
        workspaceId: props.workspaceId,
        columnId: props.columnId,
        payload,
        tags,
      });
      toast.success('Карточка создана!');
    }
    emit('close');
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <DialogRoot v-model:open="openProxy">
    <DialogPortal>
      <DialogOverlay class="dialog-overlay" @click="openProxy = false" />
      <DialogContent class="dialog-content-scroll" @escape-key-down="openProxy = false">
        <div class="dialog-header">
          <DialogTitle class="dialog-title">
            {{ isEditMode ? 'Редактировать карточку' : 'Новая карточка' }}
          </DialogTitle>
          <DialogClose class="dialog-close">
            <span class="i-lucide-x text-fg-muted" />
          </DialogClose>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div v-if="isGlobalAdd" class="pb-2 border-b border-border">
            <label class="form-label-fg mb-2">Куда добавить</label>
            <div class="flex gap-2 mb-3">
              <button
                type="button"
                class="flex-1 type-selector-btn flex-center"
                :class="addDestination === 'hub' ? 'type-selector-btn-active' : 'type-selector-btn-inactive'"
                @click="addDestination = 'hub'; selectedWorkspaceId = null"
              >
                <span class="i-lucide-inbox" />
                Хаб
              </button>
              <button
                type="button"
                class="flex-1 type-selector-btn flex-center"
                :class="addDestination === 'workspace' ? 'type-selector-btn-active' : 'type-selector-btn-inactive'"
                @click="addDestination = 'workspace'"
              >
                <span class="i-lucide-layout-grid" />
                Воркспейс
              </button>
            </div>
            <div v-if="addDestination === 'workspace'" class="mt-2">
              <label for="card-workspace" class="form-label text-fg-muted mb-1">Воркспейс (карточка попадёт в беклог)</label>
              <select
                id="card-workspace"
                v-model="selectedWorkspaceId"
                class="input py-2"
              >
                <option value="" disabled>Выберите воркспейс</option>
                <option
                  v-for="w in workspaces"
                  :key="w.id"
                  :value="w.id"
                >
                  {{ w.title }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label for="card-title" class="form-label-fg">Название</label>
            <input
              id="card-title"
              v-model="title"
              type="text"
              class="input"
              placeholder="Опционально"
            />
          </div>

          <div>
            <label for="card-tags" class="form-label-fg">Теги</label>
            <input
              id="card-tags"
              v-model="tagsInput"
              type="text"
              class="input"
              placeholder="Через запятую, например: работа, идеи"
            />
          </div>

          <div v-if="!isEditMode">
            <label class="form-label-fg mb-2">Тип</label>
            <div class="flex gap-2">
              <button
                v-for="t in types"
                :key="t.value"
                type="button"
                @click="cardType = t.value"
                class="flex-1 type-selector-btn flex-center"
                :class="cardType === t.value ? 'type-selector-btn-active' : 'type-selector-btn-inactive'"
              >
                <span :class="t.icon" />
                {{ t.label }}
              </button>
            </div>
          </div>

          <template v-if="cardType === 'NOTE'">
            <div>
              <label for="card-note" class="form-label-fg">Текст заметки</label>
              <textarea
                id="card-note"
                v-model="noteContent"
                class="textarea h-24"
                placeholder="Ваши мысли..."
              />
            </div>
            <div>
              <label for="card-summary-note" class="form-label-fg">Конспект</label>
              <input
                id="card-summary-note"
                v-model="noteSummary"
                type="text"
                class="input"
                placeholder="Опционально"
              />
            </div>
          </template>

          <template v-if="cardType === 'LINK'">
            <div>
              <label for="card-url" class="form-label-fg">URL *</label>
              <input
                id="card-url"
                v-model="linkUrl"
                type="url"
                class="input"
                placeholder="https://..."
              />
            </div>
            <div>
              <label for="card-summary-link" class="form-label-fg">Конспект</label>
              <input
                id="card-summary-link"
                v-model="linkSummary"
                type="text"
                class="input"
                placeholder="Опционально"
              />
            </div>
          </template>

          <template v-if="cardType === 'CHECKLIST'">
            <div>
              <label class="form-label-fg mb-2">Пункты</label>
              <div ref="checklistListRef" class="space-y-2">
                <div
                  v-for="(item, index) in checklistItems"
                  :key="item.id"
                  class="flex items-center gap-2"
                >
                  <span class="checklist-grip grip-handle" />
                  <input
                    v-model="item.text"
                    type="text"
                    class="input flex-1"
                    placeholder="Пункт списка"
                  />
                  <button
                    v-if="checklistItems.length > 1"
                    type="button"
                    @click="removeChecklistItem(index)"
                    class="btn-icon-muted-danger"
                  >
                    <span class="i-lucide-x" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                @click="addChecklistItem"
                class="link-add mt-2"
              >
                <span class="i-lucide-plus" />
                Добавить пункт
              </button>
            </div>
            <div>
              <label for="card-summary-checklist" class="form-label-fg">Конспект</label>
              <input
                id="card-summary-checklist"
                v-model="checklistSummary"
                type="text"
                class="input"
                placeholder="Опционально"
              />
            </div>
          </template>

          <div class="flex justify-between items-center gap-3 pt-4">
            <button
              v-if="isEditMode"
              type="button"
              class="btn-danger"
              @click="emit('delete')"
            >
              <span class="i-lucide-trash-2 text-sm" />
              Удалить
            </button>
            <div class="flex gap-3 ml-auto">
              <button type="button" @click="emit('close')" class="btn-secondary">Отмена</button>
              <button type="submit" class="btn-primary" :disabled="loading">
                <span v-if="loading" class="loading-spinner mr-1.5" />
                {{ isEditMode ? 'Сохранить' : 'Создать' }}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

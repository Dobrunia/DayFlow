<script setup lang="ts">
import { ref, watch, computed, nextTick, onUnmounted } from 'vue';
import Sortable from 'sortablejs';
import { useWorkspaceStore } from '@/stores/workspace';
import { useCardsStore } from '@/stores/cards';
import type { CardGql, LearningStatus } from '@/graphql/types';
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
  updated: [card: CardGql];
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
const selectedWorkspaceId = ref('');
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
const learningStatus = ref<LearningStatus | null>(null);
const loading = ref(false);
const showDetails = ref(false);

const learningStatuses: { value: LearningStatus; label: string; icon: string }[] = [
  { value: 'WANT_TO_REPEAT', label: 'Хочу повторить', icon: 'i-lucide-repeat' },
  { value: 'QUESTIONS_REMAIN', label: 'Остались вопросы', icon: 'i-lucide-help-circle' },
  { value: 'DEEPEN_KNOWLEDGE', label: 'Хочу углубить знания', icon: 'i-lucide-book-open' },
];

const submitted = ref(false);
const checklistListRef = ref<HTMLElement | null>(null);
const titleInputRef = ref<HTMLInputElement | null>(null);
let checklistSortable: Sortable | null = null;

const currentSummary = computed({
  get: () => {
    if (cardType.value === 'NOTE') return noteSummary.value;
    if (cardType.value === 'LINK') return linkSummary.value;
    return checklistSummary.value;
  },
  set: (val) => {
    if (cardType.value === 'NOTE') noteSummary.value = val;
    else if (cardType.value === 'LINK') linkSummary.value = val;
    else checklistSummary.value = val;
  }
});

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
          const pl =
            typeof card.payload === 'string' ? JSON.parse(card.payload || '{}') : card.payload;
          if (card.type === 'NOTE') {
            noteContent.value = (pl as { content?: string }).content ?? '';
            noteSummary.value = (pl as { summary?: string }).summary ?? '';
          } else if (card.type === 'LINK') {
            linkUrl.value = (pl as { url?: string }).url ?? '';
            linkSummary.value = (pl as { summary?: string }).summary ?? '';
          } else if (card.type === 'CHECKLIST') {
            const items =
              (pl as { items?: { id: string; text: string; done: boolean; order: number }[] })
                .items ?? [];
            checklistItems.value = items.length
              ? items.map((i) => ({ ...i }))
              : [{ id: crypto.randomUUID(), text: '', done: false, order: 100 }];
            checklistSummary.value = (pl as { summary?: string }).summary ?? '';
          }
          tagsInput.value = Array.isArray(card.tags) ? card.tags.join(', ') : '';
          learningStatus.value = card.learningStatus ?? null;
        } catch {
          noteContent.value = '';
          noteSummary.value = '';
          linkUrl.value = '';
          linkSummary.value = '';
          checklistItems.value = [{ id: crypto.randomUUID(), text: '', done: false, order: 100 }];
          checklistSummary.value = '';
          tagsInput.value = '';
          learningStatus.value = null;
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
        selectedWorkspaceId.value = '';
        tagsInput.value = '';
        learningStatus.value = null;
        if (!props.columnId && props.workspaceId == null && !workspaceStore.workspaces.length) workspaceStore.fetchWorkspaces();
      }
      submitted.value = false;
      nextTick(() => {
        initChecklistSortable();
        titleInputRef.value?.focus();
      });
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
  const maxOrder = checklistItems.value.length
    ? Math.max(...checklistItems.value.map((i) => i.order))
    : 0;
  checklistItems.value.push({
    id: crypto.randomUUID(),
    text: '',
    done: false,
    order: maxOrder + 100,
  });
  nextTick(() => {
    initChecklistSortable();
    // Focus the new input
    const inputs = checklistListRef.value?.querySelectorAll('input');
    if (inputs?.length) {
      (inputs[inputs.length - 1] as HTMLInputElement).focus();
    }
  });
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
  submitted.value = true;

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
      const newTitle = title.value.trim() || null;
      const updatePayload = { title: newTitle ?? undefined, payload, tags, learningStatus: learningStatus.value };
      if (isHubEdit.value) await cardsStore.updateCard(props.card.id, updatePayload);
      else await workspaceStore.updateCard(props.card.id, updatePayload);
      emit('updated', { ...props.card, title: newTitle, payload, tags, learningStatus: learningStatus.value });
      toast.success('Сохранено!');
    } else if (isGlobalAdd.value && addDestination.value === 'hub') {
      await cardsStore.createCard({
        type: cardType.value,
        title: title.value.trim() || undefined,
        payload,
        tags,
        learningStatus: learningStatus.value ?? undefined,
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
        learningStatus: learningStatus.value ?? undefined,
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
        learningStatus: learningStatus.value ?? undefined,
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
      <DialogContent
        :aria-describedby="undefined"
        class="dialog-content max-h-[90vh] overflow-y-auto"
        @escape-key-down="openProxy = false"
      >
        <div class="dialog-header">
          <DialogTitle class="dialog-title">
            {{ isEditMode ? 'Редактировать карточку' : 'Новая карточка' }}
          </DialogTitle>
          <DialogClose class="icon-btn-close">
            <span class="i-lucide-x" />
          </DialogClose>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div v-if="isGlobalAdd" class="pb-2 border-b border-border">
            <label class="block text-sm font-medium mb-2">Куда добавить</label>
            <div class="flex gap-2 mb-3">
              <button
                type="button"
                class="flex-1 h-9 px-3 border border-border text-sm rounded-[var(--r)] flex-center gap-1.5 transition-colors"
                :class="
                  addDestination === 'hub'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface text-muted hover:text-fg'
                "
                @click="
                  addDestination = 'hub';
                  selectedWorkspaceId = '';
                "
              >
                <span class="i-lucide-inbox" />
                Хаб
              </button>
              <button
                type="button"
                class="flex-1 h-9 px-3 border border-border text-sm rounded-[var(--r)] flex-center gap-1.5 transition-colors"
                :class="
                  addDestination === 'workspace'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface text-muted hover:text-fg'
                "
                @click="addDestination = 'workspace'"
              >
                <span class="i-lucide-layout-grid" />
                Воркспейс
              </button>
            </div>
            <div class="mt-2 h-[72px]">
              <template v-if="addDestination === 'hub'">
                <p class="text-sm text-muted text-center h-full flex-center">Карточка попадёт в общий список без привязки к воркспейсу</p>
              </template>
              <template v-else>
                <label for="card-workspace" class="block text-sm text-muted mb-1"
                  >Воркспейс * (карточка попадёт в беклог)</label
                >
                <select
                  id="card-workspace"
                  v-model="selectedWorkspaceId"
                  class="input py-2 max-w-full truncate"
                  :class="submitted && !selectedWorkspaceId && 'border-danger!'"
                >
                  <option value="" disabled hidden>Выберите воркспейс</option>
                  <option v-for="w in workspaces" :key="w.id" :value="w.id">
                    {{ w.title.length > 40 ? w.title.slice(0, 40) + '…' : w.title }}
                  </option>
                </select>
              </template>
            </div>
          </div>

          <div>
            <label for="card-title" class="block text-sm font-medium mb-1">Название</label>
            <input
              ref="titleInputRef"
              id="card-title"
              v-model="title"
              type="text"
              class="input"
              placeholder="Опционально"
            />
          </div>

          <div v-if="!isEditMode">
            <label class="block text-sm font-medium mb-2">Тип</label>
            <div class="flex gap-2">
              <button
                v-for="t in types"
                :key="t.value"
                type="button"
                @click="cardType = t.value"
                class="flex-1 h-9 px-3 border border-border text-sm rounded-[var(--r)] flex-center gap-1.5 transition-colors"
                :class="
                  cardType === t.value
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface text-muted hover:text-fg'
                "
              >
                <span :class="t.icon" />
                {{ t.label }}
              </button>
            </div>
          </div>

          <template v-if="cardType === 'NOTE'">
            <div class="min-h-[152px]">
              <label for="card-note" class="block text-sm font-medium mb-1">Текст заметки</label>
              <textarea
                id="card-note"
                v-model="noteContent"
                class="textarea h-24"
                placeholder="Ваши мысли..."
              />
            </div>
          </template>

          <template v-if="cardType === 'LINK'">
            <div class="min-h-[152px]">
              <label for="card-url" class="block text-sm font-medium mb-1">URL *</label>
              <input
                id="card-url"
                v-model="linkUrl"
                type="url"
                class="input"
                :class="submitted && !linkUrl.trim() && 'border-danger!'"
                placeholder="https://..."
              />
            </div>
          </template>

          <template v-if="cardType === 'CHECKLIST'">
            <div class="min-h-[152px]">
              <label class="block text-sm font-medium mb-2">Пункты</label>
              <div ref="checklistListRef" class="space-y-2">
                <div
                  v-for="(item, index) in checklistItems"
                  :key="item.id"
                  class="flex items-center gap-2"
                >
                  <span
                    class="checklist-grip i-lucide-grip-vertical text-muted cursor-grab active:cursor-grabbing"
                  />
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
                    class="icon-btn-delete"
                  >
                    <span class="i-lucide-x" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                @click="addChecklistItem"
                class="w-full mt-2 py-2 border border-dashed border-border rounded-[var(--r)] text-sm text-muted hover:text-fg hover:border-fg/30 flex-center gap-1.5 transition-colors"
              >
                <span class="i-lucide-plus" />
                Добавить пункт
              </button>
            </div>
          </template>

          <div class="pt-2 border-t border-border">
            <button
              type="button"
              class="flex items-center gap-2 text-sm text-muted font-medium hover:text-fg transition-colors select-none w-full text-left"
              @click="showDetails = !showDetails"
            >
              <span
                class="i-lucide-chevron-right transition-transform duration-200"
                :class="showDetails && 'rotate-90'"
              />
              Дополнительно
            </button>

            <div v-if="showDetails" class="space-y-4 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <!-- Tags -->
              <div>
                <label for="card-tags" class="block text-sm font-medium mb-1">Теги</label>
                <input
                  id="card-tags"
                  v-model="tagsInput"
                  type="text"
                  class="input"
                  placeholder="Через запятую: работа, идеи"
                />
              </div>

              <!-- Summary -->
              <div v-if="!isEditMode">
                <label for="card-summary" class="block text-sm font-medium mb-1">Конспект/Заметка</label>
                <input
                  id="card-summary"
                  v-model="currentSummary"
                  type="text"
                  class="input"
                  placeholder="Опционально"
                />
              </div>

              <!-- Learning Status -->
              <div v-if="isEditMode">
                <label class="block text-sm font-medium mb-2">Статус обучения</label>
                <div class="flex flex-col gap-1 bg-fg/10 rounded-[var(--r)] p-1">
                  <button
                    type="button"
                    class="mode-tab w-full justify-start px-3 py-2"
                    :class="learningStatus === null && 'active'"
                    @click="learningStatus = null"
                  >
                    <span>Нет</span>
                  </button>
                  <button
                    v-for="s in learningStatuses"
                    :key="s.value"
                    type="button"
                    class="mode-tab w-full justify-start px-3 py-2"
                    :class="learningStatus === s.value && 'active'"
                    @click="learningStatus = s.value"
                  >
                    <span :class="s.icon" />
                    <span>{{ s.label }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-between items-center gap-3 pt-4">
            <button v-if="isEditMode" type="button" class="btn-delete" @click="emit('delete')">
              <span class="i-lucide-trash-2" />
              Удалить
            </button>
            <button type="submit" class="btn-primary ml-auto" :disabled="loading">
              <span v-if="loading" class="i-lucide-loader-2 animate-spin" />
              {{ isEditMode ? 'Сохранить' : 'Создать' }}
            </button>
          </div>
        </form>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

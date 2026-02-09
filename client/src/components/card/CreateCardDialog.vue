<script setup lang="ts">
import { ref, watch, computed, nextTick, onUnmounted } from 'vue';
import Sortable from 'sortablejs';
import { useWorkspaceStore } from '@/stores/workspace';
import { useCardsStore } from '@/stores/cards';
import type { CardGql } from '@/graphql/types';
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
import { CARD_TYPES, LEARNING_STATUSES, LEARNING_STATUS_META, CARD_TYPE_META } from '@/lib/constants';
import { useCardForm } from '@/composables/useCardForm';

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
const form = useCardForm();

/** Добавление из хедера (кнопка «Добавить»), не из колонки/беклога */
const isGlobalAdd = computed(() => !props.card && !props.columnId && props.workspaceId == null);
const isHubEdit = computed(() => !!props.card && props.card.workspaceId == null);

const addDestination = ref<'hub' | 'workspace'>('hub');
const selectedWorkspaceId = ref('');
const workspaces = computed(() => workspaceStore.workspaces);

const loading = ref(false);
const showDetails = ref(false);
const submitted = ref(false);
const checklistListRef = ref<HTMLElement | null>(null);
const titleInputRef = ref<HTMLInputElement | null>(null);
let checklistSortable: Sortable | null = null;

const isEditMode = computed(() => !!props.card);

const learningStatuses = Object.values(LEARNING_STATUSES).map((value) => ({
  value,
  ...LEARNING_STATUS_META[value],
}));

const types = Object.values(CARD_TYPES).map((value) => ({
  value,
  ...CARD_TYPE_META[value],
}));

function initChecklistSortable() {
  checklistSortable?.destroy();
  checklistSortable = null;
  if (!checklistListRef.value || form.cardType.value !== CARD_TYPES.CHECKLIST) return;
  checklistSortable = new Sortable(checklistListRef.value, {
    animation: 150,
    handle: '.checklist-grip',
    ghostClass: 'opacity-50',
    onEnd(evt) {
      const from = evt.oldIndex ?? 0;
      const to = evt.newIndex ?? 0;
      if (from === to) return;
      const arr = [...form.checklistItems.value];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      form.checklistItems.value = arr;
      nextTick(() => initChecklistSortable());
    },
  });
}

watch(
  () => [props.open, props.card] as const,
  ([isOpen, card]) => {
    if (isOpen) {
      if (card) {
        form.setFromCard(card);
      } else {
        form.reset();
        addDestination.value = 'hub';
        selectedWorkspaceId.value = '';
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

watch(form.cardType, (t) => {
  if (t === CARD_TYPES.CHECKLIST) nextTick(() => initChecklistSortable());
  else {
    checklistSortable?.destroy();
    checklistSortable = null;
  }
});

onUnmounted(() => {
  checklistSortable?.destroy();
});

function handleAddChecklistItem() {
  form.addChecklistItem();
  nextTick(() => {
    initChecklistSortable();
    const inputs = checklistListRef.value?.querySelectorAll('input');
    if (inputs?.length) {
      (inputs[inputs.length - 1] as HTMLInputElement).focus();
    }
  });
}

function handleRemoveChecklistItem(index: number) {
  form.removeChecklistItem(index);
  nextTick(() => initChecklistSortable());
}

async function handleSubmit() {
  submitted.value = true;

  if (form.cardType.value === CARD_TYPES.LINK && !form.linkUrl.value.trim()) {
    toast.error('Введите URL ссылки');
    return;
  }
  if (isGlobalAdd.value && addDestination.value === 'workspace' && !selectedWorkspaceId.value) {
    toast.error('Выберите воркспейс');
    return;
  }

  try {
    loading.value = true;
    const payload = form.getPayloadString();
    const tags = form.getTagsArray();

    if (props.card) {
      const newTitle = form.title.value.trim() || null;
      const updatePayload = { title: newTitle ?? undefined, payload, tags, learningStatus: form.learningStatus.value };
      if (isHubEdit.value) await cardsStore.updateCard(props.card.id, updatePayload);
      else await workspaceStore.updateCard(props.card.id, updatePayload);
      emit('updated', { ...props.card, title: newTitle, payload, tags, learningStatus: form.learningStatus.value });
      toast.success('Сохранено!');
    } else if (isGlobalAdd.value && addDestination.value === 'hub') {
      await cardsStore.createCard({
        type: form.cardType.value,
        title: form.title.value.trim() || undefined,
        payload,
        tags,
        learningStatus: form.learningStatus.value ?? undefined,
      });
      toast.success('Карточка создана в хабе!');
    } else if (isGlobalAdd.value && addDestination.value === 'workspace') {
      await workspaceStore.createCard({
        type: form.cardType.value,
        title: form.title.value.trim() || undefined,
        workspaceId: selectedWorkspaceId.value!,
        columnId: undefined,
        payload,
        tags,
        learningStatus: form.learningStatus.value ?? undefined,
      });
      toast.success('Карточка добавлена в беклог воркспейса');
    } else {
      await workspaceStore.createCard({
        type: form.cardType.value,
        title: form.title.value.trim() || undefined,
        workspaceId: props.workspaceId,
        columnId: props.columnId,
        payload,
        tags,
        learningStatus: form.learningStatus.value ?? undefined,
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
              v-model="form.title.value"
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
                @click="form.cardType.value = t.value"
                class="flex-1 h-9 px-3 border border-border text-sm rounded-[var(--r)] flex-center gap-1.5 transition-colors"
                :class="
                  form.cardType.value === t.value
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface text-muted hover:text-fg'
                "
              >
                <span :class="t.icon" />
                {{ t.label }}
              </button>
            </div>
          </div>

          <template v-if="form.cardType.value === CARD_TYPES.NOTE">
            <div class="min-h-[152px]">
              <label for="card-note" class="block text-sm font-medium mb-1">Текст заметки</label>
              <textarea
                id="card-note"
                v-model="form.noteContent.value"
                class="textarea h-24"
                placeholder="Ваши мысли..."
              />
            </div>
          </template>

          <template v-if="form.cardType.value === CARD_TYPES.LINK">
            <div class="min-h-[152px]">
              <label for="card-url" class="block text-sm font-medium mb-1">URL *</label>
              <input
                id="card-url"
                v-model="form.linkUrl.value"
                type="url"
                class="input"
                :class="submitted && !form.linkUrl.value.trim() && 'border-danger!'"
                placeholder="https://..."
              />
            </div>
          </template>

          <template v-if="form.cardType.value === CARD_TYPES.CHECKLIST">
            <div class="min-h-[152px]">
              <label class="block text-sm font-medium mb-2">Пункты</label>
              <div ref="checklistListRef" class="space-y-2">
                <div
                  v-for="(item, index) in form.checklistItems.value"
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
                    v-if="form.checklistItems.value.length > 1"
                    type="button"
                    @click="handleRemoveChecklistItem(index)"
                    class="icon-btn-delete"
                  >
                    <span class="i-lucide-x" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                @click="handleAddChecklistItem"
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
                  v-model="form.tagsInput.value"
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
                  v-model="form.currentSummary.value"
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
                    :class="form.learningStatus.value === null && 'active'"
                    @click="form.learningStatus.value = null"
                  >
                    <span>Нет</span>
                  </button>
                  <button
                    v-for="s in learningStatuses"
                    :key="s.value"
                    type="button"
                    class="mode-tab w-full justify-start px-3 py-2"
                    :class="form.learningStatus.value === s.value && 'active'"
                    @click="form.learningStatus.value = s.value"
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

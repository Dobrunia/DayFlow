<script setup lang="ts">
import { ref, watch, computed, nextTick, onUnmounted } from 'vue';
import Sortable from 'sortablejs';
import { useWorkspaceStore } from '@/stores/workspace';
import type { CardType, ChecklistItem } from '@/graphql/types';
import { toast } from 'vue-sonner';
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
} from 'radix-vue';

const props = defineProps<{
  open: boolean;
  columnId: string;
  /** При переданной карточке — режим редактирования */
  card?: import('@/graphql/types').Card | null;
}>();

const emit = defineEmits<{
  close: [];
}>();

const openProxy = computed({
  get: () => props.open,
  set: (v: boolean) => {
    if (!v) emit('close');
  },
});

const workspaceStore = useWorkspaceStore();

const title = ref('');
const cardType = ref<CardType>('NOTE');
const videoUrl = ref('');
const noteContent = ref('');
const checklistItems = ref<ChecklistItem[]>([{ id: '1', text: '', checked: false }]);
const loading = ref(false);
const checklistListRef = ref<HTMLElement | null>(null);
let checklistSortable: Sortable | null = null;

const isEditMode = computed(() => !!props.card);

const types: { value: CardType; label: string; icon: string }[] = [
  { value: 'NOTE', label: 'Заметка', icon: 'i-lucide-file-text' },
  { value: 'VIDEO', label: 'Видео', icon: 'i-lucide-video' },
  { value: 'CHECKLIST', label: 'Чеклист', icon: 'i-lucide-check-square' },
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
        title.value = card.title;
        cardType.value = card.cardType;
        videoUrl.value = card.videoUrl ?? '';
        noteContent.value = card.noteContent ?? '';
        checklistItems.value =
          (card.checklistItems?.length ?? 0) > 0
            ? card.checklistItems!.map((i) => ({ id: i.id, text: i.text, checked: i.checked }))
            : [{ id: '1', text: '', checked: false }];
      } else {
        title.value = '';
        cardType.value = 'NOTE';
        videoUrl.value = '';
        noteContent.value = '';
        checklistItems.value = [{ id: '1', text: '', checked: false }];
      }
      nextTick(() => initChecklistSortable());
    } else {
      checklistSortable?.destroy();
      checklistSortable = null;
    }
  }
);

watch(cardType, (t) => {
  if (t === 'CHECKLIST') {
    nextTick(() => initChecklistSortable());
  } else {
    checklistSortable?.destroy();
    checklistSortable = null;
  }
});

onUnmounted(() => {
  checklistSortable?.destroy();
});

function addChecklistItem() {
  checklistItems.value.push({
    id: String(Date.now()),
    text: '',
    checked: false,
  });
  nextTick(() => initChecklistSortable());
}

function removeChecklistItem(index: number) {
  if (checklistItems.value.length > 1) {
    checklistItems.value.splice(index, 1);
    nextTick(() => initChecklistSortable());
  }
}

async function handleSubmit() {
  if (!title.value.trim()) {
    toast.error('Введите название');
    return;
  }

  try {
    loading.value = true;

    if (props.card) {
      const updatePayload: {
        title?: string;
        videoUrl?: string;
        noteContent?: string;
        checklistItems?: ChecklistItem[];
      } = { title: title.value.trim() };
      if (cardType.value === 'VIDEO') {
        updatePayload.videoUrl = videoUrl.value.trim() || undefined;
      }
      if (cardType.value === 'NOTE') {
        updatePayload.noteContent = noteContent.value.trim() || undefined;
      }
      if (cardType.value === 'CHECKLIST') {
        updatePayload.checklistItems = checklistItems.value.filter((item) => item.text.trim());
      }
      await workspaceStore.updateCard(props.card.id, updatePayload);
      toast.success('Сохранено!');
    } else {
      const createInput = {
        title: title.value.trim(),
        cardType: cardType.value,
        ...(cardType.value === 'VIDEO' &&
          videoUrl.value.trim() && { videoUrl: videoUrl.value.trim() }),
        ...(cardType.value === 'NOTE' &&
          noteContent.value.trim() && { noteContent: noteContent.value.trim() }),
        ...(cardType.value === 'CHECKLIST' && {
          checklistItems: checklistItems.value.filter((item) => item.text.trim()),
        }),
      };
      await workspaceStore.createCard(props.columnId, createInput);
      toast.success('Карточка создана!');
    }
    emit('close');
  } catch {
    toast.error(props.card ? 'Ошибка сохранения' : 'Ошибка создания карточки');
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
          <!-- Title -->
          <div>
            <label for="card-title" class="form-label-fg"> Название * </label>
            <input
              id="card-title"
              v-model="title"
              type="text"
              class="input"
              placeholder="Введите название"
              autofocus
            />
          </div>

          <!-- Type (в режиме редактирования менять нельзя) -->
          <div>
            <label class="form-label-fg mb-2"> Тип </label>
            <div class="flex gap-2">
              <button
                v-for="t in types"
                :key="t.value"
                type="button"
                :disabled="isEditMode"
                @click="!isEditMode && (cardType = t.value)"
                class="flex-1 type-selector-btn flex-center"
                :class="[
                  cardType === t.value ? 'type-selector-btn-active' : 'type-selector-btn-inactive',
                  isEditMode && 'opacity-70 cursor-not-allowed pointer-events-none',
                ]"
              >
                <span :class="t.icon" />
                {{ t.label }}
              </button>
            </div>
          </div>

          <!-- Video URL -->
          <div v-if="cardType === 'VIDEO'">
            <label for="card-video-url" class="form-label-fg"> URL видео </label>
            <input
              id="card-video-url"
              v-model="videoUrl"
              type="url"
              class="input"
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          <!-- Note Content -->
          <div v-if="cardType === 'NOTE'">
            <label for="card-note" class="form-label-fg"> Текст заметки </label>
            <textarea
              id="card-note"
              v-model="noteContent"
              class="textarea h-24"
              placeholder="Ваши мысли..."
            />
          </div>

          <!-- Checklist Items -->
          <div v-if="cardType === 'CHECKLIST'">
            <label class="form-label-fg mb-2"> Пункты чеклиста </label>
            <div ref="checklistListRef" class="space-y-2">
              <div
                v-for="(item, index) in checklistItems"
                :key="item.id"
                class="flex items-center gap-2"
              >
                <span
                  class="checklist-grip i-lucide-grip-vertical text-fg-muted cursor-grab active:cursor-grabbing touch-none"
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
                  class="btn-icon p-1.5 text-fg-muted hover:text-danger"
                >
                  <span class="i-lucide-x" />
                </button>
              </div>
            </div>
            <button
              type="button"
              @click="addChecklistItem"
              class="mt-2 text-sm link-primary flex items-center gap-1"
            >
              <span class="i-lucide-plus" />
              Добавить пункт
            </button>
          </div>

          <!-- Submit -->
          <div class="form-actions">
            <button type="button" @click="emit('close')" class="btn-secondary">Отмена</button>
            <button type="submit" class="btn-primary" :disabled="loading">
              <span v-if="loading" class="i-lucide-loader-2 animate-spin mr-1.5 text-fg-muted" />
              {{ isEditMode ? 'Сохранить' : 'Создать' }}
            </button>
          </div>
        </form>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

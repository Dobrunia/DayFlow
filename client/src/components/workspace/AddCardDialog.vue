<script setup lang="ts">
import { ref, watch, computed } from 'vue';
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

const types: { value: CardType; label: string; icon: string }[] = [
  { value: 'NOTE', label: 'Заметка', icon: 'i-lucide-file-text' },
  { value: 'VIDEO', label: 'Видео', icon: 'i-lucide-video' },
  { value: 'CHECKLIST', label: 'Чеклист', icon: 'i-lucide-check-square' },
];

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      title.value = '';
      cardType.value = 'NOTE';
      videoUrl.value = '';
      noteContent.value = '';
      checklistItems.value = [{ id: '1', text: '', checked: false }];
    }
  }
);

function addChecklistItem() {
  checklistItems.value.push({
    id: String(Date.now()),
    text: '',
    checked: false,
  });
}

function removeChecklistItem(index: number) {
  if (checklistItems.value.length > 1) {
    checklistItems.value.splice(index, 1);
  }
}

async function handleSubmit() {
  if (!title.value.trim()) {
    toast.error('Введите название');
    return;
  }

  try {
    loading.value = true;

    const input: {
      title: string;
      cardType: CardType;
      videoUrl?: string;
      noteContent?: string;
      checklistItems?: ChecklistItem[];
    } = {
      title: title.value.trim(),
      cardType: cardType.value,
    };

    if (cardType.value === 'VIDEO' && videoUrl.value.trim()) {
      input.videoUrl = videoUrl.value.trim();
    }

    if (cardType.value === 'NOTE' && noteContent.value.trim()) {
      input.noteContent = noteContent.value.trim();
    }

    if (cardType.value === 'CHECKLIST') {
      input.checklistItems = checklistItems.value.filter((item) => item.text.trim());
    }

    await workspaceStore.createCard(props.columnId, input);

    toast.success('Карточка создана!');
    emit('close');
  } catch {
    toast.error('Ошибка создания карточки');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <DialogRoot v-model:open="openProxy">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-[100] bg-overlay backdrop-blur-sm"
        @click="openProxy = false"
      />

      <DialogContent
        class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-bg border border-border rounded-xl shadow-xl z-[101] p-6 max-h-[90vh] overflow-y-auto"
        @escape-key-down="openProxy = false"
      >
        <div class="flex-between mb-6">
          <DialogTitle class="text-lg font-semibold text-fg"> Новая карточка </DialogTitle>
          <DialogClose class="btn-icon btn-ghost p-1.5">
            <span class="i-lucide-x text-fg-muted" />
          </DialogClose>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Title -->
          <div>
            <label for="card-title" class="block text-sm font-medium text-fg mb-1">
              Название *
            </label>
            <input
              id="card-title"
              v-model="title"
              type="text"
              class="input"
              placeholder="Введите название"
              autofocus
            />
          </div>

          <!-- Type -->
          <div>
            <label class="block text-sm font-medium text-fg mb-2"> Тип </label>
            <div class="flex gap-2">
              <button
                v-for="t in types"
                :key="t.value"
                type="button"
                @click="cardType = t.value"
                class="flex-1 px-3 py-2 text-sm rounded-lg border transition-colors flex-center gap-1.5"
                :class="
                  cardType === t.value
                    ? 'bg-primary border-primary text-on-primary'
                    : 'bg-bg border-border text-fg-muted hover:border-border-hover'
                "
              >
                <span :class="t.icon" />
                {{ t.label }}
              </button>
            </div>
          </div>

          <!-- Video URL -->
          <div v-if="cardType === 'VIDEO'">
            <label for="card-video-url" class="block text-sm font-medium text-fg mb-1">
              URL видео
            </label>
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
            <label for="card-note" class="block text-sm font-medium text-fg mb-1">
              Текст заметки
            </label>
            <textarea
              id="card-note"
              v-model="noteContent"
              class="textarea h-24"
              placeholder="Ваши мысли..."
            />
          </div>

          <!-- Checklist Items -->
          <div v-if="cardType === 'CHECKLIST'">
            <label class="block text-sm font-medium text-fg mb-2"> Пункты чеклиста </label>
            <div class="space-y-2">
              <div
                v-for="(item, index) in checklistItems"
                :key="item.id"
                class="flex items-center gap-2"
              >
                <span class="i-lucide-grip-vertical text-fg-muted cursor-move" />
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
              class="mt-2 text-sm text-primary hover:opacity-90 flex items-center gap-1"
            >
              <span class="i-lucide-plus" />
              Добавить пункт
            </button>
          </div>

          <!-- Submit -->
          <div class="flex justify-end gap-3 pt-4">
            <button type="button" @click="emit('close')" class="btn-secondary">Отмена</button>
            <button type="submit" class="btn-primary" :disabled="loading">
              <span v-if="loading" class="i-lucide-loader-2 animate-spin mr-1.5 text-fg-muted" />
              Создать
            </button>
          </div>
        </form>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

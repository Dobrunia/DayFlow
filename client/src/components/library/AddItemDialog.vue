<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { useLibraryStore } from '@/stores/library';
import { useWorkspaceStore } from '@/stores/workspace';
import type { ItemType } from '@/graphql/types';
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
}>();

const emit = defineEmits<{
  close: [];
}>();

const libraryStore = useLibraryStore();
const workspaceStore = useWorkspaceStore();

const title = ref('');
const type = ref<ItemType>('LINK');
const url = ref('');
const content = ref('');
const workspaceId = ref<string | undefined>(undefined);
const loading = ref(false);

const types: { value: ItemType; label: string; icon: string }[] = [
  { value: 'LINK', label: 'Ссылка', icon: 'i-lucide-link' },
  { value: 'VIDEO', label: 'Видео', icon: 'i-lucide-video' },
  { value: 'NOTE', label: 'Заметка', icon: 'i-lucide-file-text' },
  { value: 'REPO', label: 'Репозиторий', icon: 'i-lucide-github' },
  { value: 'TASK', label: 'Задача', icon: 'i-lucide-check-square' },
];

const workspaces = computed(() => workspaceStore.workspaces);

const showUrlField = computed(() => ['LINK', 'VIDEO', 'REPO'].includes(type.value));
const showContentField = computed(() => type.value === 'NOTE');

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      // Reset form
      title.value = '';
      type.value = 'LINK';
      url.value = '';
      content.value = '';
      workspaceId.value = undefined;

      // Fetch workspaces if not loaded
      if (workspaces.value.length === 0) {
        workspaceStore.fetchWorkspaces();
      }
    }
  }
);

async function handleSubmit() {
  if (!title.value.trim()) {
    toast.error('Введите название');
    return;
  }

  try {
    loading.value = true;

    await libraryStore.createItem({
      title: title.value.trim(),
      type: type.value,
      url: showUrlField.value ? url.value.trim() || undefined : undefined,
      content: showContentField.value ? content.value.trim() || undefined : undefined,
      workspaceId: workspaceId.value,
    });

    toast.success('Добавлено!');
    emit('close');
  } catch (e) {
    toast.error('Ошибка добавления');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <DialogRoot :open="open" @update:open="(v) => !v && emit('close')">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />

      <DialogContent
        class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 p-6"
      >
        <div class="flex-between mb-6">
          <DialogTitle class="text-lg font-semibold text-gray-900"> Добавить </DialogTitle>
          <DialogClose class="btn-icon btn-ghost p-1.5">
            <span class="i-lucide-x text-gray-400" />
          </DialogClose>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Title -->
          <div>
            <label for="item-title" class="block text-sm font-medium text-gray-700 mb-1">
              Название *
            </label>
            <input
              id="item-title"
              v-model="title"
              type="text"
              class="input"
              placeholder="Введите название"
              autofocus
            />
          </div>

          <!-- Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Тип </label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="t in types"
                :key="t.value"
                type="button"
                @click="type = t.value"
                class="px-3 py-1.5 text-sm rounded-lg border transition-colors flex items-center gap-1.5"
                :class="
                  type === t.value
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                "
              >
                <span :class="t.icon" />
                {{ t.label }}
              </button>
            </div>
          </div>

          <!-- URL (conditional) -->
          <div v-if="showUrlField">
            <label for="item-url" class="block text-sm font-medium text-gray-700 mb-1"> URL </label>
            <input id="item-url" v-model="url" type="url" class="input" placeholder="https://..." />
          </div>

          <!-- Content (conditional) -->
          <div v-if="showContentField">
            <label for="item-content" class="block text-sm font-medium text-gray-700 mb-1">
              Содержимое
            </label>
            <textarea
              id="item-content"
              v-model="content"
              class="textarea h-24"
              placeholder="Текст заметки..."
            />
          </div>

          <!-- Workspace (optional) -->
          <div>
            <label for="item-workspace" class="block text-sm font-medium text-gray-700 mb-1">
              Воркспейс
            </label>
            <select id="item-workspace" v-model="workspaceId" class="input">
              <option :value="undefined">Библиотека (без воркспейса)</option>
              <option v-for="ws in workspaces" :key="ws.id" :value="ws.id">
                {{ ws.title }}
              </option>
            </select>
          </div>

          <!-- Submit -->
          <div class="flex justify-end gap-3 pt-4">
            <button type="button" @click="emit('close')" class="btn-secondary">Отмена</button>
            <button type="submit" class="btn-primary" :disabled="loading">
              <span v-if="loading" class="i-lucide-loader-2 animate-spin mr-1.5" />
              Добавить
            </button>
          </div>
        </form>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

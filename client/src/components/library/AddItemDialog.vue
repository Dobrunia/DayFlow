<script setup lang="ts">
import { ref, watch, computed } from 'vue';
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
  DialogDescription,
  DialogClose,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectPortal,
  SelectContent,
  SelectItem,
} from 'radix-vue';

const props = defineProps<{
  open: boolean;
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

const libraryStore = useLibraryStore();
const workspaceStore = useWorkspaceStore();

const title = ref('');
const type = ref<ItemType>('LINK');
const url = ref('');
const content = ref('');
const NO_WORKSPACE = '__none__';
const workspaceId = ref<string>(NO_WORKSPACE);
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
      workspaceId.value = NO_WORKSPACE;

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
      workspaceId: workspaceId.value === NO_WORKSPACE ? undefined : workspaceId.value,
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
  <DialogRoot v-model:open="openProxy">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-[100] bg-overlay backdrop-blur-sm"
        @click="openProxy = false"
      />

      <DialogContent
        class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-bg border border-border rounded-xl shadow-xl z-[101] p-6"
        aria-describedby="add-item-dialog-description"
        @escape-key-down="openProxy = false"
      >
        <DialogDescription id="add-item-dialog-description" class="sr-only">
          Форма добавления элемента в библиотеку или воркспейс
        </DialogDescription>
        <div class="flex-between mb-6">
          <DialogTitle class="text-lg font-semibold text-fg">Добавить</DialogTitle>
          <DialogClose class="btn-icon btn-ghost p-1.5">
            <span class="i-lucide-x text-fg-muted" />
          </DialogClose>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Title -->
          <div>
            <label for="item-title" class="block text-sm font-medium text-fg-muted mb-1">
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
            <label class="block text-sm font-medium text-fg-muted mb-2">Тип</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="t in types"
                :key="t.value"
                type="button"
                @click="type = t.value"
                class="px-3 py-1.5 text-sm rounded-lg border transition-colors flex items-center gap-1.5"
                :class="
                  type === t.value
                    ? 'bg-primary border-primary text-on-primary'
                    : 'bg-bg border-border text-fg-muted hover:border-border-hover'
                "
              >
                <span :class="t.icon" />
                {{ t.label }}
              </button>
            </div>
          </div>

          <!-- URL / Content: фиксированная высота блока — при смене типа вёрстка не дёргается -->
          <div class="min-h-[7.5rem]">
            <div v-if="showUrlField">
              <label for="item-url" class="block text-sm font-medium text-fg-muted mb-1">URL</label>
              <input
                id="item-url"
                v-model="url"
                type="url"
                class="input"
                placeholder="https://..."
              />
            </div>
            <div v-else-if="showContentField">
              <label for="item-content" class="block text-sm font-medium text-fg-muted mb-1">
                Содержимое
              </label>
              <textarea
                id="item-content"
                v-model="content"
                class="textarea h-24"
                placeholder="Текст заметки..."
              />
            </div>
          </div>

          <!-- Workspace (optional) -->
          <div>
            <label for="item-workspace" class="block text-sm font-medium text-fg-muted mb-1">
              Воркспейс
            </label>
            <SelectRoot v-model="workspaceId">
              <SelectTrigger id="item-workspace" class="input flex-between min-h-[38px]">
                <SelectValue placeholder="Библиотека (без воркспейса)" />
              </SelectTrigger>
              <SelectPortal>
                <SelectContent
                  class="z-[110] max-h-[280px] overflow-auto rounded-lg border border-border bg-bg p-1 shadow-lg"
                  position="popper"
                  :side-offset="4"
                >
                  <SelectItem
                    :value="NO_WORKSPACE"
                    class="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none hover:bg-muted data-[highlighted]:bg-muted"
                  >
                    Библиотека (без воркспейса)
                  </SelectItem>
                  <SelectItem
                    v-for="ws in workspaces"
                    :key="ws.id"
                    :value="ws.id"
                    class="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none hover:bg-muted data-[highlighted]:bg-muted"
                  >
                    {{ ws.title }}
                  </SelectItem>
                </SelectContent>
              </SelectPortal>
            </SelectRoot>
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

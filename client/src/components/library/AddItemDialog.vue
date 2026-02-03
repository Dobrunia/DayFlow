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
  /** При переданном item — режим редактирования (подстановка данных, кнопка "Сохранить") */
  item?: import('@/graphql/types').Item | null;
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

const isEditMode = computed(() => !!props.item);

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
  () => [props.open, props.item] as const,
  ([isOpen, item]) => {
    if (isOpen) {
      if (item) {
        title.value = item.title;
        type.value = item.type;
        url.value = item.url ?? '';
        content.value = item.content ?? '';
        workspaceId.value = item.workspace?.id ?? NO_WORKSPACE;
      } else {
        title.value = '';
        type.value = 'LINK';
        url.value = '';
        content.value = '';
        workspaceId.value = NO_WORKSPACE;
      }

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

    const payload = {
      title: title.value.trim(),
      type: type.value,
      url: showUrlField.value ? url.value.trim() || undefined : undefined,
      content: showContentField.value ? content.value.trim() || undefined : undefined,
      workspaceId: workspaceId.value === NO_WORKSPACE ? undefined : workspaceId.value,
    };

    if (props.item) {
      await libraryStore.updateItem(props.item.id, {
        title: payload.title,
        url: payload.url,
        content: payload.content,
      });
      toast.success('Сохранено!');
    } else {
      await libraryStore.createItem(payload);
      toast.success('Добавлено!');
    }
    emit('close');
  } catch {
    toast.error(props.item ? 'Ошибка сохранения' : 'Ошибка добавления');
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
        class="dialog-content"
        aria-describedby="add-item-dialog-description"
        @escape-key-down="openProxy = false"
      >
        <DialogDescription id="add-item-dialog-description" class="sr-only">
          Форма добавления элемента в библиотеку или воркспейс
        </DialogDescription>
        <div class="dialog-header">
          <DialogTitle class="dialog-title">{{
            isEditMode ? 'Редактировать' : 'Добавить'
          }}</DialogTitle>
          <DialogClose class="dialog-close">
            <span class="i-lucide-x text-fg-muted" />
          </DialogClose>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Title -->
          <div>
            <label for="item-title" class="form-label"> Название * </label>
            <input
              id="item-title"
              v-model="title"
              type="text"
              class="input"
              placeholder="Введите название"
              autofocus
            />
          </div>

          <!-- Type (при редактировании менять нельзя) -->
          <div>
            <label class="form-label mb-2">Тип</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="t in types"
                :key="t.value"
                type="button"
                :disabled="isEditMode"
                @click="!isEditMode && (type = t.value)"
                class="type-selector-btn"
                :class="[
                  type === t.value ? 'type-selector-btn-active' : 'type-selector-btn-inactive',
                  isEditMode && 'opacity-70 cursor-not-allowed pointer-events-none',
                ]"
              >
                <span :class="t.icon" />
                {{ t.label }}
              </button>
            </div>
          </div>

          <!-- URL / Content: фиксированная высота блока — при смене типа вёрстка не дёргается -->
          <div class="min-h-[7.5rem]">
            <div v-if="showUrlField">
              <label for="item-url" class="form-label">URL</label>
              <input
                id="item-url"
                v-model="url"
                type="url"
                class="input"
                placeholder="https://..."
              />
            </div>
            <div v-else-if="showContentField">
              <label for="item-content" class="form-label"> Содержимое </label>
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
            <label for="item-workspace" class="form-label"> Воркспейс </label>
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
                  <SelectItem :value="NO_WORKSPACE" class="select-option">
                    Библиотека (без воркспейса)
                  </SelectItem>
                  <SelectItem
                    v-for="ws in workspaces"
                    :key="ws.id"
                    :value="ws.id"
                    class="select-option"
                  >
                    {{ ws.title }}
                  </SelectItem>
                </SelectContent>
              </SelectPortal>
            </SelectRoot>
          </div>

          <!-- Submit -->
          <div class="form-actions">
            <button type="button" @click="emit('close')" class="btn-secondary">Отмена</button>
            <button type="submit" class="btn-primary" :disabled="loading">
              <span v-if="loading" class="i-lucide-loader-2 animate-spin mr-1.5" />
              {{ isEditMode ? 'Сохранить' : 'Добавить' }}
            </button>
          </div>
        </form>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
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
  created: [id: string];
}>();

const workspaceStore = useWorkspaceStore();

const title = ref('');
const description = ref('');
const loading = ref(false);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      title.value = '';
      description.value = '';
    }
  }
);

async function handleSubmit() {
  if (!title.value.trim()) {
    toast.error('Введите название воркспейса');
    return;
  }

  try {
    loading.value = true;

    const workspace = await workspaceStore.createWorkspace({
      title: title.value.trim(),
      description: description.value.trim() || undefined,
    });

    toast.success('Воркспейс создан!');
    emit('created', workspace.id);
  } catch {
    toast.error('Ошибка создания воркспейса');
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
          <DialogTitle class="text-lg font-semibold text-gray-900"> Новый воркспейс </DialogTitle>
          <DialogClose class="btn-icon btn-ghost p-1.5">
            <span class="i-lucide-x text-gray-400" />
          </DialogClose>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Title -->
          <div>
            <label for="ws-title" class="block text-sm font-medium text-gray-700 mb-1">
              Название *
            </label>
            <input
              id="ws-title"
              v-model="title"
              type="text"
              class="input"
              placeholder="Например: Изучение React"
              autofocus
            />
          </div>

          <!-- Description -->
          <div>
            <label for="ws-description" class="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              id="ws-description"
              v-model="description"
              class="textarea h-20"
              placeholder="Краткое описание темы..."
            />
          </div>

          <!-- Submit -->
          <div class="flex justify-end gap-3 pt-4">
            <button type="button" @click="emit('close')" class="btn-secondary">Отмена</button>
            <button type="submit" class="btn-primary" :disabled="loading">
              <span v-if="loading" class="i-lucide-loader-2 animate-spin mr-1.5" />
              Создать
            </button>
          </div>
        </form>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

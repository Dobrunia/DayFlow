<script setup lang="ts">
import { ref, watch, computed } from 'vue';
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

const openProxy = computed({
  get: () => props.open,
  set: (v: boolean) => {
    if (!v) emit('close');
  },
});

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
  <DialogRoot v-model:open="openProxy">
    <DialogPortal>
      <DialogOverlay class="dialog-overlay" @click="openProxy = false" />

      <DialogContent class="dialog-content" @escape-key-down="openProxy = false">
        <div class="dialog-header">
          <DialogTitle class="dialog-title"> Новый воркспейс </DialogTitle>
          <DialogClose class="dialog-close">
            <span class="i-lucide-x text-fg-muted" />
          </DialogClose>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Title -->
          <div>
            <label for="ws-title" class="form-label-fg"> Название * </label>
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
            <label for="ws-description" class="form-label-fg"> Описание </label>
            <textarea
              id="ws-description"
              v-model="description"
              class="textarea h-20"
              placeholder="Краткое описание темы..."
            />
          </div>

          <!-- Submit -->
          <div class="form-actions">
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

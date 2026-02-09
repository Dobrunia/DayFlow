<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import { toast } from 'vue-sonner';
import { getGraphQLErrorMessage } from '@/lib/graphql-error';
import { WORKSPACE_EMOJIS } from '@/lib/workspace-emojis';
import { LIMITS } from 'dayflow-shared';
import EmojiPickerPopover from '@/components/common/EmojiPickerPopover.vue';
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
const icon = ref<string | undefined>(WORKSPACE_EMOJIS[0]);
const loading = ref(false);
const submitted = ref(false);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      title.value = '';
      description.value = '';
      icon.value = WORKSPACE_EMOJIS[0];
      submitted.value = false;
    }
  }
);

async function handleSubmit() {
  submitted.value = true;

  if (workspaceStore.workspaces.length >= LIMITS.MAX_WORKSPACES_PER_USER) {
    toast.error(`Максимум ${LIMITS.MAX_WORKSPACES_PER_USER} воркспейсов`);
    return;
  }

  if (!title.value.trim()) {
    toast.error('Введите название воркспейса');
    return;
  }

  try {
    loading.value = true;

    const workspace = await workspaceStore.createWorkspace({
      title: title.value.trim(),
      description: description.value.trim() || undefined,
      icon: icon.value ?? undefined,
    });

    toast.success('Воркспейс создан!');
    emit('created', workspace.id);
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

      <DialogContent :aria-describedby="undefined" class="dialog-content" @escape-key-down="openProxy = false">
        <div class="dialog-header">
          <DialogTitle class="dialog-title"> Новый воркспейс </DialogTitle>
          <DialogClose class="icon-btn-close">
            <span class="i-lucide-x" />
          </DialogClose>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Icon -->
          <div>
            <label class="block text-sm font-medium mb-1">Иконка</label>
            <div class="mt-1">
               <EmojiPickerPopover v-model="icon" />
            </div>
          </div>

          <!-- Title -->
          <div>
            <label for="ws-title" class="block text-sm font-medium mb-1">Название *</label>
            <input
              id="ws-title"
              v-model="title"
              type="text"
              class="input"
              :class="submitted && !title.trim() && 'border-danger!'"
              placeholder="Например: Изучение React"
              autofocus
            />
          </div>

          <!-- Description -->
          <div>
            <label for="ws-description" class="block text-sm font-medium mb-1">Описание</label>
            <textarea
              id="ws-description"
              v-model="description"
              class="textarea h-20"
              placeholder="Краткое описание темы..."
            />
          </div>

          <!-- Submit -->
          <div class="flex justify-end pt-4">
            <button type="submit" class="btn-primary" :disabled="loading">
              <span v-if="loading" class="i-lucide-loader-2 animate-spin" />
              <span>Создать</span>
            </button>
          </div>
        </form>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

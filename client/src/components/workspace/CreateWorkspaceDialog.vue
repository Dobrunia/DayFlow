<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import { toast } from 'vue-sonner';
import { getGraphQLErrorMessage } from '@/lib/graphql-error';
import { WORKSPACE_EMOJIS } from '@/lib/workspace-emojis';
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
const icon = ref<string | null>(WORKSPACE_EMOJIS[0]);
const loading = ref(false);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      title.value = '';
      description.value = '';
      icon.value = WORKSPACE_EMOJIS[0];
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

      <DialogContent class="dialog-content" @escape-key-down="openProxy = false">
        <div class="dialog-header">
          <DialogTitle class="dialog-title"> Новый воркспейс </DialogTitle>
          <DialogClose class="dialog-close">
            <span class="i-lucide-x text-fg-muted" />
          </DialogClose>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Icon -->
          <div>
            <label class="form-label-fg">Иконка</label>
            <div class="flex flex-wrap gap-1.5 mt-1 max-h-[200px] overflow-y-auto overflow-x-hidden p-0.5">
              <button
                v-for="emoji in WORKSPACE_EMOJIS"
                :key="emoji"
                type="button"
                class="w-9 h-9 rounded-lg flex-center text-xl transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary shrink-0"
                :class="icon === emoji ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted/50'"
                @click="icon = emoji"
              >
                {{ emoji }}
              </button>
            </div>
          </div>

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

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue';
import { toast } from 'vue-sonner';
import { useWorkspaceStore } from '@/stores/workspace';
import { getGraphQLErrorMessage } from '@/lib/graphql-error';
import type { Tool } from '@/graphql/types';
import ToolItem from './ToolItem.vue';
import { LIMITS } from 'dayflow-shared';
import EmojiPickerPopover from '@/components/common/EmojiPickerPopover.vue';

const props = defineProps<{
  workspaceId?: string; // If undefined, it's Hub toolbox (not implemented in view yet, but supported by backend)
  tools: Tool[];
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const workspaceStore = useWorkspaceStore();

const isCreating = ref(false);
const newToolTitle = ref('');
const newToolLink = ref('');
const newToolIcon = ref(''); // Emoji or string
const newToolDescription = ref('');
const newToolTags = ref('');
const createLoading = ref(false);
const pinned = ref(false);
const panelRef = ref<HTMLElement | null>(null);
const linkInputRef = ref<HTMLInputElement | null>(null);
const submitted = ref(false);

function handleClickOutside(event: MouseEvent) {
  if (!props.isOpen || pinned.value) return;
  
  const target = event.target as HTMLElement;
  const isInsidePortal = target.closest('[data-radix-popper-content-wrapper]');

  if (panelRef.value && !panelRef.value.contains(target) && !isInsidePortal) {
    emit('close');
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});

async function handleCreate() {
  submitted.value = true;
  if (!newToolTitle.value.trim()) {
      toast.error('Введите название инструмента');
      return;
  }

  try {
    createLoading.value = true;
    await workspaceStore.createTool({
      workspaceId: props.workspaceId,
      title: newToolTitle.value.trim(),
      link: newToolLink.value.trim() || undefined,
      icon: newToolIcon.value.trim() || undefined,
      description: newToolDescription.value.trim() || undefined,
      tags: newToolTags.value.split(',').map(t => t.trim()).filter(Boolean),
    });
    newToolTitle.value = '';
    newToolLink.value = '';
    newToolIcon.value = '';
    newToolDescription.value = '';
    newToolTags.value = '';
    isCreating.value = false;
    submitted.value = false;
    toast.success('Инструмент добавлен');
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  } finally {
    createLoading.value = false;
  }
}

async function startCreating() {
  isCreating.value = true;
  submitted.value = false;
  await nextTick();
  linkInputRef.value?.focus();
}
</script>

<template>
  <div
    ref="panelRef"
    class="absolute top-12 bottom-0 right-0 z-30 w-80 bg-surface border-l border-border shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col rounded-tl-[var(--r)]"
    :class="isOpen ? 'translate-x-0' : 'translate-x-full'"
  >
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-border">
      <h3 class="font-medium text-fg flex items-center gap-2">
        <span class="i-lucide-box" />
        Инструменты
      </h3>
      <button 
        @click="pinned = !pinned" 
        class="icon-btn-ghost hover:text-fg transition-colors"
        :class="pinned ? 'text-primary' : 'text-muted'"
        :title="pinned ? 'Открепить' : 'Закрепить'"
      >
        <span class="i-lucide-pin" :class="{ 'fill-current': pinned }" />
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <!-- Create New -->
      <div v-if="isCreating" class="p-3 bg-fg/5 rounded-[var(--r)] border border-border space-y-3">
        
        <!-- Icon & Title Row -->
        <div class="flex gap-2">
          <EmojiPickerPopover v-model="newToolIcon" />

           <input
            v-model="newToolTitle"
            placeholder="Название *"
            class="input flex-1 text-sm min-w-0"
            :class="submitted && !newToolTitle.trim() && 'border-danger!'"
            autoFocus
            @keyup.enter="handleCreate"
          />
        </div>

        <input
          ref="linkInputRef"
          v-model="newToolLink"
          placeholder="Ссылка (https://...)"
          class="input w-full text-sm"
          @keyup.enter="handleCreate"
        />

        <textarea
          v-model="newToolDescription"
          placeholder="Описание"
          class="input w-full text-sm min-h-[60px] resize-y py-2"
        ></textarea>

        <input
          v-model="newToolTags"
          placeholder="Теги (через запятую)"
          class="input w-full text-sm"
          @keyup.enter="handleCreate"
        />
        
        <div class="flex justify-end gap-2">
          <button @click="isCreating = false" class="btn-ghost text-xs py-1">Отмена</button>
          <button @click="handleCreate" class="btn-primary text-xs py-1" :disabled="createLoading">
            Добавить
          </button>
        </div>
      </div>
      <button
        v-else-if="tools.length < LIMITS.MAX_TOOLS_PER_WORKSPACE"
        @click="startCreating"
        class="w-full py-2 border border-dashed border-border rounded-[var(--r)] text-muted text-sm hover:text-fg hover:border-fg/30 transition-colors flex-center gap-2"
      >
        <span class="i-lucide-plus" />
        Добавить инструмент
      </button>
      <div v-else class="text-center text-muted text-sm py-2">
        Достигнут лимит ({{ LIMITS.MAX_TOOLS_PER_WORKSPACE }})
      </div>

      <!-- List -->
      <div class="space-y-2">
        <ToolItem
          v-for="tool in tools"
          :key="tool.id"
          :tool="tool"
          :workspace-id="workspaceId"
        />
        <div v-if="tools.length === 0 && !isCreating" class="text-center text-muted text-sm py-4">
          Список пуст
        </div>
      </div>
    </div>
  </div>
</template>

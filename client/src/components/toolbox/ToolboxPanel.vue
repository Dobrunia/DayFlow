<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue';
import { toast } from 'vue-sonner';
import { useWorkspaceStore } from '@/stores/workspace';
import { getGraphQLErrorMessage } from '@/lib/graphql-error';
import type { Tool } from '@/graphql/types';
import ToolItem from './ToolItem.vue';
import { WORKSPACE_EMOJIS } from '@/lib/workspace-emojis';

const MAX_TOOLS = 30;

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
const showEmojiPicker = ref(false);
const createLoading = ref(false);
const pinned = ref(false);
const panelRef = ref<HTMLElement | null>(null);
const linkInputRef = ref<HTMLInputElement | null>(null);

function handleClickOutside(event: MouseEvent) {
  if (!props.isOpen || pinned.value) return;
  
  const target = event.target as HTMLElement;
  if (panelRef.value && !panelRef.value.contains(target)) {
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
  if (!newToolTitle.value.trim()) return;

  try {
    createLoading.value = true;
    await workspaceStore.createTool({
      workspaceId: props.workspaceId,
      title: newToolTitle.value.trim(),
      link: newToolLink.value.trim() || undefined,
      icon: newToolIcon.value.trim() || undefined,
      tags: [],
    });
    newToolTitle.value = '';
    newToolLink.value = '';
    newToolIcon.value = '';
    isCreating.value = false;
    showEmojiPicker.value = false;
    toast.success('Инструмент добавлен');
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  } finally {
    createLoading.value = false;
  }
}

async function startCreating() {
  isCreating.value = true;
  await nextTick();
  linkInputRef.value?.focus();
}

function selectEmoji(emoji: string) {
  newToolIcon.value = emoji;
  showEmojiPicker.value = false;
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
           <!-- Emoji Picker Trigger -->
           <div class="relative shrink-0">
              <button
                type="button"
                class="w-9 h-9 rounded-[var(--r)] flex-center text-lg bg-surface border border-border hover:bg-fg/5 transition-colors"
                @click="showEmojiPicker = !showEmojiPicker"
              >
                {{ newToolIcon || '🛠️' }}
              </button>
              
              <!-- Emoji Picker Dropdown -->
              <div
                v-if="showEmojiPicker"
                class="absolute top-full left-0 mt-1 p-2 card w-64 grid grid-cols-6 gap-1 max-h-48 overflow-y-auto scrollbar-hide z-50 shadow-lg border border-border"
              >
                 <button
                  v-for="emoji in WORKSPACE_EMOJIS"
                  :key="emoji"
                  type="button"
                  class="w-8 h-8 rounded flex-center text-lg hover:bg-fg/10 transition-colors"
                  @click="selectEmoji(emoji)"
                >
                  {{ emoji }}
                </button>
              </div>
           </div>

           <input
            v-model="newToolTitle"
            placeholder="Название"
            class="input flex-1 text-sm min-w-0"
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
        
        <div class="flex justify-end gap-2">
          <button @click="isCreating = false" class="btn-ghost text-xs py-1">Отмена</button>
          <button @click="handleCreate" class="btn-primary text-xs py-1" :disabled="createLoading">
            Добавить
          </button>
        </div>
      </div>
      <button
        v-else-if="tools.length < MAX_TOOLS"
        @click="startCreating"
        class="w-full py-2 border border-dashed border-border rounded-[var(--r)] text-muted text-sm hover:text-fg hover:border-fg/30 transition-colors flex-center gap-2"
      >
        <span class="i-lucide-plus" />
        Добавить инструмент
      </button>
      <div v-else class="text-center text-muted text-sm py-2">
        Достигнут лимит ({{ MAX_TOOLS }})
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

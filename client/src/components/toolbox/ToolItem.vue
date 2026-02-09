<script setup lang="ts">
import { ref } from 'vue';
import { toast } from 'vue-sonner';
import { useWorkspaceStore } from '@/stores/workspace';
import { getGraphQLErrorMessage } from '@/lib/graphql-error';
import type { Tool } from '@/graphql/types';
import { WORKSPACE_EMOJIS } from '@/lib/workspace-emojis';

const props = defineProps<{
  tool: Tool;
  workspaceId?: string;
}>();

const workspaceStore = useWorkspaceStore();

const isEditing = ref(false);
const editTitle = ref('');
const editLink = ref('');
const editIcon = ref('');
const showEmojiPicker = ref(false);
const updateLoading = ref(false);

function startEdit() {
  editTitle.value = props.tool.title;
  editLink.value = props.tool.link || '';
  editIcon.value = props.tool.icon || '';
  isEditing.value = true;
  showEmojiPicker.value = false;
}

async function handleUpdate() {
  if (!editTitle.value.trim()) return;
  try {
    updateLoading.value = true;
    await workspaceStore.updateTool(props.tool.id, {
        title: editTitle.value.trim(),
        link: editLink.value.trim() || undefined,
        icon: editIcon.value.trim() || undefined,
    });
    isEditing.value = false;
    toast.success('Обновлено');
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  } finally {
    updateLoading.value = false;
  }
}

async function handleDelete() {
  const toolTitle = props.tool.title;
  isEditing.value = false;

  try {
    await workspaceStore.deleteTool(props.tool.id);
    toast(`«${toolTitle}» удалён`, {
      action: {
        label: 'Отменить',
        onClick: () => {
          workspaceStore
            .undoDeleteTool()
            .then(() => {
              toast.success('Инструмент восстановлен');
            })
            .catch((e) => {
              toast.error(getGraphQLErrorMessage(e));
            });
        },
      },
    });
  } catch (e) {
    toast.error(getGraphQLErrorMessage(e));
  }
}

function selectEmoji(emoji: string) {
  editIcon.value = emoji;
  showEmojiPicker.value = false;
}
</script>

<template>
  <div class="relative group">
    <!-- Edit Mode -->
    <div v-if="isEditing" class="p-3 rounded-[var(--r)] bg-surface border border-primary/50 space-y-3 shadow-sm">
      
       <!-- Icon & Title Row -->
       <div class="flex gap-2">
           <!-- Emoji Picker Trigger -->
           <div class="relative shrink-0">
              <button
                type="button"
                class="w-9 h-9 rounded-[var(--r)] flex-center text-lg bg-surface border border-border hover:bg-fg/5 transition-colors"
                @click="showEmojiPicker = !showEmojiPicker"
              >
                {{ editIcon || '🛠️' }}
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
            v-model="editTitle"
            class="input flex-1 text-sm min-w-0"
            placeholder="Название"
            autoFocus
            @keyup.enter="handleUpdate"
          />
        </div>

      <input v-model="editLink" class="input w-full text-sm" placeholder="Ссылка" @keyup.enter="handleUpdate" />
      
      <div class="flex justify-between items-center mt-2">
         <button 
           type="button"
           @click="handleDelete" 
           class="icon-btn-delete"
           title="Удалить"
         >
           <span class="i-lucide-trash-2" />
         </button>

         <div class="flex gap-2">
            <button @click="isEditing = false" class="btn-ghost text-xs px-2 py-1">Отмена</button>
            <button @click="handleUpdate" class="btn-primary text-xs px-2 py-1" :disabled="updateLoading">Сохранить</button>
         </div>
      </div>
    </div>
    
    <!-- View Mode -->
    <component
      :is="tool.link ? 'a' : 'div'"
      v-else
      :href="tool.link"
      :target="tool.link ? '_blank' : undefined"
      :rel="tool.link ? 'noopener noreferrer' : undefined"
      class="block p-2.5 rounded-[var(--r)] hover:bg-fg/5 transition-colors border border-transparent hover:border-border/50 relative"
      :class="{'cursor-pointer': tool.link}"
    >
      <div class="flex items-start gap-3">
        <!-- Icon -->
        <div class="shrink-0 w-8 h-8 rounded-full bg-surface border border-border flex-center text-lg shadow-sm">
          {{ tool.icon || '🛠️' }}
        </div>
        
        <!-- Info -->
        <div class="flex-1 min-w-0">
          <h4 class="font-medium text-sm text-fg truncate leading-8" :title="tool.title">{{ tool.title }}</h4>
        </div>
      </div>

      <!-- Edit Button (Absolute) -->
      <button 
        @click.stop.prevent="startEdit" 
        class="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-surface rounded-full text-muted hover:text-fg transition-all shadow-sm border border-transparent hover:border-border" 
        title="Редактировать"
      >
        <span class="i-lucide-edit-2 text-xs" />
      </button>
    </component>
  </div>
</template>

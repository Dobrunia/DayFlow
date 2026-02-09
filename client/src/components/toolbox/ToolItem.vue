<script setup lang="ts">
import { ref } from 'vue';
import { toast } from 'vue-sonner';
import { useWorkspaceStore } from '@/stores/workspace';
import { getGraphQLErrorMessage } from '@/lib/graphql-error';
import type { Tool } from '@/graphql/types';
import EmojiPickerPopover from '@/components/common/EmojiPickerPopover.vue';

const props = defineProps<{
  tool: Tool;
  workspaceId?: string;
}>();

const workspaceStore = useWorkspaceStore();

const isEditing = ref(false);
const editTitle = ref('');
const editLink = ref('');
const editIcon = ref('');
const editDescription = ref('');
const editTags = ref('');
const updateLoading = ref(false);
const submitted = ref(false);

function startEdit() {
  editTitle.value = props.tool.title;
  editLink.value = props.tool.link || '';
  editIcon.value = props.tool.icon || '';
  editDescription.value = props.tool.description || '';
  editTags.value = props.tool.tags ? props.tool.tags.join(', ') : '';
  isEditing.value = true;
  submitted.value = false;
}

async function handleUpdate() {
  submitted.value = true;
  if (!editTitle.value.trim()) {
    toast.error('Введите название инструмента');
    return;
  }
  try {
    updateLoading.value = true;
    await workspaceStore.updateTool(props.tool.id, {
        title: editTitle.value.trim(),
        link: editLink.value.trim() || undefined,
        icon: editIcon.value.trim() || undefined,
        description: editDescription.value.trim() || undefined,
        tags: editTags.value.split(',').map(t => t.trim()).filter(Boolean),
    });
    isEditing.value = false;
    submitted.value = false;
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
</script>

<template>
  <div class="relative group">
    <!-- Edit Mode -->
    <div v-if="isEditing" class="p-3 rounded-[var(--r)] bg-surface border border-primary/50 space-y-3 shadow-sm">
      
       <!-- Icon & Title Row -->
       <div class="flex gap-2">
           <EmojiPickerPopover v-model="editIcon" />

           <input
            v-model="editTitle"
            class="input flex-1 text-sm min-w-0"
            :class="submitted && !editTitle.trim() && 'border-danger!'"
            placeholder="Название *"
            autoFocus
            @keyup.enter="handleUpdate"
          />
        </div>

      <input v-model="editLink" class="input w-full text-sm" placeholder="Ссылка" @keyup.enter="handleUpdate" />
      
      <textarea
        v-model="editDescription"
        placeholder="Описание"
        class="input w-full text-sm min-h-[60px] resize-y py-2"
      ></textarea>

      <input
        v-model="editTags"
        placeholder="Теги (через запятую)"
        class="input w-full text-sm"
        @keyup.enter="handleUpdate"
      />
      
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
          <p v-if="tool.description" class="text-xs text-muted truncate mt-1">{{ tool.description }}</p>
           <div v-if="tool.tags?.length" class="flex flex-wrap gap-1 mt-2">
             <span v-for="tag in tool.tags" :key="tag" class="text-[10px] px-1.5 py-0.5 rounded-full bg-fg/5 text-muted">
               {{ tag }}
             </span>
           </div>
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

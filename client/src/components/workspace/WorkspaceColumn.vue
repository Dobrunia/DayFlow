<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import type { Column } from '@/graphql/types';
import CardItem from './CardItem.vue';
import AddCardDialog from './AddCardDialog.vue';
import { toast } from 'vue-sonner';

const props = defineProps<{
  column: Column;
  workspaceId: string;
}>();

const workspaceStore = useWorkspaceStore();

const isEditing = ref(false);
const editTitle = ref('');
const showAddCard = ref(false);

const cards = computed(() => props.column.cards ?? []);

function startEdit() {
  editTitle.value = props.column.title;
  isEditing.value = true;
}

async function saveEdit() {
  if (editTitle.value.trim() === props.column.title) {
    isEditing.value = false;
    return;
  }

  try {
    await workspaceStore.updateColumn(props.column.id, editTitle.value.trim());
    isEditing.value = false;
  } catch {
    toast.error('Ошибка сохранения');
  }
}

async function deleteColumn() {
  if (!confirm('Удалить колонку и все карточки в ней?')) return;

  try {
    await workspaceStore.deleteColumn(props.column.id);
  } catch {
    toast.error('Ошибка удаления');
  }
}
</script>

<template>
  <div class="flex-shrink-0 w-72 flex flex-col bg-muted rounded-xl">
    <!-- Header -->
    <div class="p-3 flex-between">
      <div v-if="isEditing" class="flex-1 mr-2">
        <input
          v-model="editTitle"
          @keyup.enter="saveEdit"
          @keyup.escape="isEditing = false"
          @blur="saveEdit"
          class="input text-sm font-medium py-1"
          autofocus
        />
      </div>
      <h3
        v-else
        @dblclick="startEdit"
        class="font-medium text-fg truncate cursor-text flex-1"
      >
        {{ column.title }}
      </h3>

      <div class="flex items-center gap-1">
        <span class="text-xs text-fg-muted mr-1">{{ cards.length }}</span>
        <button
          @click="deleteColumn"
          class="btn-icon p-1 opacity-0 group-hover:opacity-100 hover:bg-muted-hover rounded"
          title="Удалить колонку"
        >
          <span class="i-lucide-trash-2 text-xs text-fg-muted" />
        </button>
      </div>
    </div>

    <!-- Cards -->
    <div class="flex-1 overflow-y-auto px-2 pb-2 space-y-2">
      <CardItem v-for="card in cards" :key="card.id" :card="card" />

      <!-- Add Card Button -->
      <button
        @click="showAddCard = true"
        class="w-full p-3 border border-dashed border-border rounded-lg text-sm text-fg-muted hover:text-fg hover:border-border-hover hover:bg-bg transition-colors flex-center gap-1.5"
      >
        <span class="i-lucide-plus text-sm" />
        Добавить карточку
      </button>
    </div>

    <!-- Add Card Dialog -->
    <AddCardDialog :open="showAddCard" :column-id="column.id" @close="showAddCard = false" />
  </div>
</template>

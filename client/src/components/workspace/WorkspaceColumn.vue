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
  <div class="flex-shrink-0 w-72 flex flex-col bg-gray-50 rounded-xl">
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
        class="font-medium text-gray-700 truncate cursor-text flex-1"
      >
        {{ column.title }}
      </h3>

      <div class="flex items-center gap-1">
        <span class="text-xs text-gray-400 mr-1">{{ cards.length }}</span>
        <button
          @click="deleteColumn"
          class="btn-icon p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded"
          title="Удалить колонку"
        >
          <span class="i-lucide-trash-2 text-xs text-gray-400" />
        </button>
      </div>
    </div>

    <!-- Cards -->
    <div class="flex-1 overflow-y-auto px-2 pb-2 space-y-2">
      <CardItem v-for="card in cards" :key="card.id" :card="card" />

      <!-- Add Card Button -->
      <button
        @click="showAddCard = true"
        class="w-full p-3 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:bg-white transition-colors flex-center gap-1.5"
      >
        <span class="i-lucide-plus text-sm" />
        Добавить карточку
      </button>
    </div>

    <!-- Add Card Dialog -->
    <AddCardDialog :open="showAddCard" :column-id="column.id" @close="showAddCard = false" />
  </div>
</template>

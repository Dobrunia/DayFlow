<script setup lang="ts">
import { ref } from 'vue';
import { useLibraryStore } from '@/stores/library';
import type { Item } from '@/graphql/types';
import { formatRelativeTime } from '@/lib/utils';
import { toast } from 'vue-sonner';

const props = defineProps<{
  item: Item;
}>();

const libraryStore = useLibraryStore();

const isEditing = ref(false);
const editTitle = ref('');

const typeIcons: Record<string, string> = {
  NOTE: 'i-lucide-file-text',
  LINK: 'i-lucide-link',
  VIDEO: 'i-lucide-video',
  REPO: 'i-lucide-github',
  TASK: 'i-lucide-check-square',
};

const typeLabels: Record<string, string> = {
  NOTE: 'Заметка',
  LINK: 'Ссылка',
  VIDEO: 'Видео',
  REPO: 'Репозиторий',
  TASK: 'Задача',
};

function startEdit() {
  editTitle.value = props.item.title;
  isEditing.value = true;
}

async function saveEdit() {
  if (editTitle.value.trim() === props.item.title) {
    isEditing.value = false;
    return;
  }

  try {
    await libraryStore.updateItem(props.item.id, { title: editTitle.value.trim() });
    isEditing.value = false;
  } catch {
    toast.error('Ошибка сохранения');
  }
}

function cancelEdit() {
  isEditing.value = false;
}

async function toggleDone() {
  try {
    await libraryStore.toggleDone(props.item.id);
  } catch {
    toast.error('Ошибка обновления');
  }
}

async function deleteItem() {
  if (!confirm('Удалить элемент?')) return;

  try {
    await libraryStore.deleteItem(props.item.id);
    toast.success('Удалено');
  } catch {
    toast.error('Ошибка удаления');
  }
}

function openUrl() {
  if (props.item.url) {
    window.open(props.item.url, '_blank');
  }
}
</script>

<template>
  <div class="card-hover group" :class="{ 'opacity-60': item.done }">
    <div class="flex items-start gap-4">
      <!-- Checkbox -->
      <button @click="toggleDone" class="mt-0.5 flex-shrink-0">
        <span v-if="item.done" class="w-5 h-5 flex-center rounded-full bg-green-500 text-white">
          <span class="i-lucide-check text-xs" />
        </span>
        <span
          v-else
          class="w-5 h-5 rounded-full border-2 border-gray-300 hover:border-green-500 transition-colors"
        />
      </button>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <!-- Title (editable) -->
        <div v-if="isEditing" class="flex items-center gap-2">
          <input
            v-model="editTitle"
            @keyup.enter="saveEdit"
            @keyup.escape="cancelEdit"
            @blur="saveEdit"
            class="input flex-1"
            autofocus
          />
        </div>

        <div v-else>
          <h3
            @dblclick="startEdit"
            class="font-medium text-gray-900 truncate cursor-text"
            :class="{ 'line-through': item.done }"
          >
            {{ item.title }}
          </h3>

          <!-- URL -->
          <button
            v-if="item.url"
            @click="openUrl"
            class="text-sm text-blue-600 hover:text-blue-700 truncate max-w-full flex items-center gap-1 mt-1"
          >
            <span class="i-lucide-external-link text-xs" />
            {{ item.url }}
          </button>

          <!-- Content preview -->
          <p v-if="item.content" class="text-sm text-gray-500 mt-1 line-clamp-2">
            {{ item.content }}
          </p>
        </div>

        <!-- Meta -->
        <div class="flex items-center gap-3 mt-2 text-xs text-gray-400">
          <span class="flex items-center gap-1">
            <span :class="typeIcons[item.type]" />
            {{ typeLabels[item.type] }}
          </span>
          <span>{{ formatRelativeTime(item.createdAt) }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button @click="startEdit" class="btn-icon btn-ghost p-1.5" title="Редактировать">
          <span class="i-lucide-edit-2 text-gray-400" />
        </button>
        <button @click="deleteItem" class="btn-icon btn-ghost p-1.5" title="Удалить">
          <span class="i-lucide-trash-2 text-gray-400 hover:text-red-500" />
        </button>
      </div>
    </div>
  </div>
</template>

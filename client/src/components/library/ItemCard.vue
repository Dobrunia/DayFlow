<script setup lang="ts">
import { ref } from 'vue';
import { useLibraryStore } from '@/stores/library';
import type { Item } from '@/graphql/types';
import AddItemDialog from '@/components/library/AddItemDialog.vue';
import { formatRelativeTime } from '@/lib/utils';
import { toast } from 'vue-sonner';

const props = defineProps<{
  item: Item;
}>();

const libraryStore = useLibraryStore();
const showEditDialog = ref(false);

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

function openEdit() {
  showEditDialog.value = true;
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
      <button
        type="button"
        @click="toggleDone"
        class="mt-0.5 checkbox-btn"
        :class="item.done ? 'checkbox-btn-checked' : 'checkbox-btn-unchecked'"
      >
        <span v-if="item.done" class="i-lucide-check text-xs" />
      </button>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <h3
          @dblclick="openEdit"
          class="font-medium text-fg truncate cursor-text"
          :class="{ 'line-through': item.done }"
        >
          {{ item.title }}
        </h3>

        <!-- URL -->
        <button
          v-if="item.url"
          @click="openUrl"
          class="text-sm link-primary truncate max-w-full flex items-center gap-1 mt-1"
        >
          <span class="i-lucide-external-link text-xs" />
          {{ item.url }}
        </button>

        <!-- Content preview -->
        <p v-if="item.content" class="text-sm text-fg-muted mt-1 line-clamp-2">
          {{ item.content }}
        </p>

        <!-- Meta -->
        <div class="flex items-center gap-3 mt-2 text-xs text-fg-muted">
          <span class="flex items-center gap-1">
            <span :class="typeIcons[item.type]" />
            {{ typeLabels[item.type] }}
          </span>
          <span>{{ formatRelativeTime(item.createdAt) }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-1 card-actions-hover">
        <button @click="openEdit" class="btn-icon btn-ghost p-1.5" title="Редактировать">
          <span class="i-lucide-edit-2 text-fg-muted" />
        </button>
        <button @click="deleteItem" class="btn-icon btn-ghost p-1.5" title="Удалить">
          <span class="i-lucide-trash-2 text-fg-muted hover:text-danger" />
        </button>
      </div>
    </div>

    <AddItemDialog :open="showEditDialog" :item="item" @close="showEditDialog = false" />
  </div>
</template>

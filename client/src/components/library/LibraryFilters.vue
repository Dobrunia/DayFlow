<script setup lang="ts">
import { computed } from 'vue';
import { useLibraryStore } from '@/stores/library';
import type { ItemType } from '@/graphql/types';

const libraryStore = useLibraryStore();

const currentType = computed(() => libraryStore.filter.type);
const showDone = computed(() => libraryStore.filter.done);

const types: { value: ItemType | undefined; label: string; icon: string }[] = [
  { value: undefined, label: 'Все', icon: 'i-lucide-layers' },
  { value: 'NOTE', label: 'Заметки', icon: 'i-lucide-file-text' },
  { value: 'LINK', label: 'Ссылки', icon: 'i-lucide-link' },
  { value: 'VIDEO', label: 'Видео', icon: 'i-lucide-video' },
  { value: 'REPO', label: 'Репозитории', icon: 'i-lucide-github' },
  { value: 'TASK', label: 'Задачи', icon: 'i-lucide-check-square' },
];

function setType(type: ItemType | undefined) {
  libraryStore.setFilter({ type });
}

function toggleShowDone() {
  libraryStore.setFilter({ done: showDone.value ? undefined : false });
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-4">
    <!-- Type Filter -->
    <div class="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
      <button
        v-for="type in types"
        :key="type.label"
        @click="setType(type.value)"
        class="px-3 py-1.5 text-sm rounded-md transition-colors"
        :class="
          currentType === type.value
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        "
      >
        <span :class="type.icon" class="mr-1.5" />
        {{ type.label }}
      </button>
    </div>

    <!-- Show/Hide Completed -->
    <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
      <input
        type="checkbox"
        :checked="showDone === undefined"
        @change="toggleShowDone"
        class="checkbox"
      />
      Показывать выполненные
    </label>
  </div>
</template>

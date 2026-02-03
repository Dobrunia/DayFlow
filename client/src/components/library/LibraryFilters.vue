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
  // Сейчас показываем только невыполненные (done === false) → включить все. Иначе — скрыть выполненные.
  libraryStore.setFilter({ done: showDone.value === false ? undefined : false });
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-4">
    <!-- Type Filter -->
    <div class="flex items-center gap-1 p-1 bg-muted rounded-lg">
      <button
        v-for="type in types"
        :key="type.label"
        @click="setType(type.value)"
        class="inline-flex items-center px-3 py-1.5 text-sm rounded-md transition-colors min-w-0 shadow-[0_0_transparent]"
        :class="
          currentType === type.value ? 'bg-bg text-fg shadow-sm' : 'text-fg-muted hover:text-fg'
        "
      >
        <span :class="type.icon" class="mr-1.5 shrink-0 inline-block align-middle" />
        {{ type.label }}
      </button>
    </div>

    <!-- Show/Hide Completed -->
    <label class="flex items-center gap-2 text-sm text-fg-muted cursor-pointer">
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

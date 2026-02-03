<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useLibraryStore } from '@/stores/library';
import { debounce } from '@/lib/utils';
import type { Item } from '@/graphql/types';

const router = useRouter();
const libraryStore = useLibraryStore();

const query = ref('');
const results = ref<Item[]>([]);
const isOpen = ref(false);
const loading = ref(false);

const debouncedSearch = debounce(async (searchQuery: string) => {
  if (!searchQuery.trim()) {
    results.value = [];
    return;
  }

  loading.value = true;
  results.value = await libraryStore.searchItems(searchQuery);
  loading.value = false;
}, 300);

watch(query, (newQuery) => {
  if (newQuery.trim()) {
    isOpen.value = true;
    debouncedSearch(newQuery);
  } else {
    results.value = [];
    isOpen.value = false;
  }
});

function selectResult(item: Item) {
  if (item.workspace) {
    router.push(`/workspace/${item.workspace.id}`);
  } else {
    router.push('/library');
  }
  query.value = '';
  isOpen.value = false;
}

function handleBlur() {
  // Delay to allow click on result
  setTimeout(() => {
    isOpen.value = false;
  }, 200);
}

function getItemIcon(type: string) {
  const icons: Record<string, string> = {
    NOTE: 'i-lucide-file-text',
    LINK: 'i-lucide-link',
    VIDEO: 'i-lucide-video',
    REPO: 'i-lucide-github',
    TASK: 'i-lucide-check-square',
  };
  return icons[type] || 'i-lucide-file';
}
</script>

<template>
  <div class="relative">
    <div class="relative">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 i-lucide-search text-fg-muted" />
      <input
        v-model="query"
        type="text"
        placeholder="Поиск..."
        class="input pl-10"
        @focus="isOpen = query.trim().length > 0"
        @blur="handleBlur"
      />
    </div>

    <!-- Results Dropdown -->
    <div
      v-if="isOpen && (results.length > 0 || loading)"
      class="absolute top-full left-0 right-0 mt-1 bg-bg border border-border rounded-lg shadow-lg overflow-hidden z-50"
    >
      <div v-if="loading" class="p-4 text-center text-sm text-fg-muted">Поиск...</div>

      <template v-else>
        <button
          v-for="item in results"
          :key="item.id"
          @click="selectResult(item)"
          class="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left"
        >
          <span :class="getItemIcon(item.type)" class="text-fg-muted" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-fg truncate">{{ item.title }}</p>
            <p v-if="item.workspace" class="text-xs text-fg-muted truncate">
              {{ item.workspace.title }}
            </p>
          </div>
          <span v-if="item.done" class="i-lucide-check text-success" />
        </button>

        <div v-if="results.length === 0" class="p-4 text-center text-sm text-fg-muted">
          Ничего не найдено
        </div>
      </template>
    </div>
  </div>
</template>

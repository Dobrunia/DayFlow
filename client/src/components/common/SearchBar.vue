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
      <span class="absolute left-3 top-1/2 -translate-y-1/2 i-lucide-search text-gray-400" />
      <input
        v-model="query"
        type="text"
        placeholder="Поиск..."
        class="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
        @focus="isOpen = query.trim().length > 0"
        @blur="handleBlur"
      />
    </div>

    <!-- Results Dropdown -->
    <div
      v-if="isOpen && (results.length > 0 || loading)"
      class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50"
    >
      <div v-if="loading" class="p-4 text-center text-sm text-gray-500">Поиск...</div>

      <template v-else>
        <button
          v-for="item in results"
          :key="item.id"
          @click="selectResult(item)"
          class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
        >
          <span :class="getItemIcon(item.type)" class="text-gray-400" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ item.title }}</p>
            <p v-if="item.workspace" class="text-xs text-gray-500 truncate">
              {{ item.workspace.title }}
            </p>
          </div>
          <span v-if="item.done" class="i-lucide-check text-green-500" />
        </button>

        <div v-if="results.length === 0" class="p-4 text-center text-sm text-gray-500">
          Ничего не найдено
        </div>
      </template>
    </div>
  </div>
</template>

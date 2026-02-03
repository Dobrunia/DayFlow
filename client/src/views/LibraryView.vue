<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useLibraryStore } from '@/stores/library';
import ItemCard from '@/components/library/ItemCard.vue';
import LibraryFilters from '@/components/library/LibraryFilters.vue';

const libraryStore = useLibraryStore();

onMounted(() => {
  libraryStore.fetchLibrary();
});

const items = computed(() => libraryStore.items);
const loading = computed(() => libraryStore.loading);
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="flex-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Библиотека</h1>
        <p class="text-sm text-gray-500 mt-1">Сохранённые ссылки и идеи</p>
      </div>
    </div>

    <!-- Filters -->
    <LibraryFilters class="mb-6" />

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin i-lucide-loader-2 text-2xl text-gray-400 mx-auto" />
    </div>

    <!-- Items List -->
    <div v-else-if="items.length > 0" class="space-y-3">
      <ItemCard v-for="item in items" :key="item.id" :item="item" />
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-16">
      <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex-center">
        <span class="i-lucide-inbox text-2xl text-gray-400" />
      </div>
      <h2 class="text-lg font-medium text-gray-900 mb-2">Библиотека пуста</h2>
      <p class="text-sm text-gray-500 mb-6">
        Добавьте первую ссылку или заметку с помощью кнопки "Добавить"
      </p>
    </div>
  </div>
</template>

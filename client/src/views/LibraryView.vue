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
        <h1 class="page-title">Библиотека</h1>
        <p class="text-sm text-fg-muted mt-1">Сохранённые ссылки и идеи</p>
      </div>
    </div>

    <!-- Filters -->
    <LibraryFilters class="mb-6" />

    <!-- Контент с фиксированной минимальной высотой — ререндерится только этот блок, вёрстка не дёргается -->
    <div class="min-h-[320px]">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="loading-spinner mx-auto" />
      </div>

      <!-- Items List -->
      <template v-else-if="items.length > 0">
        <div class="space-y-3">
          <ItemCard v-for="item in items" :key="item.id" :item="item" />
        </div>
      </template>

      <!-- Empty State -->
      <div v-else class="text-center py-16">
        <div class="empty-state-icon">
          <span class="i-lucide-inbox text-2xl text-fg-muted" />
        </div>
        <h2 class="empty-state-title">Библиотека пуста</h2>
        <p class="empty-state-desc">
          Добавьте первую ссылку или заметку с помощью кнопки "Добавить"
        </p>
      </div>
    </div>
  </div>
</template>

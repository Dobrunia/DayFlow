<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useCardsStore } from '@/stores/cards';
import CardItem from '@/components/card/CardItem.vue';

const cardsStore = useCardsStore();

onMounted(() => {
  cardsStore.setFilter({ workspaceId: null });
});

const cards = computed(() => cardsStore.filteredCards);
const loading = computed(() => cardsStore.loading);
</script>

<template>
  <div class="max-w-4xl mx-auto px-5 py-10">
    <div class="flex-between mb-8">
      <div>
        <h1 class="page-title mb-1">Хаб</h1>
        <p class="text-sm text-fg-muted">Карточки без воркспейса</p>
      </div>
    </div>

    <div class="min-h-[320px]">
      <div v-if="loading" class="text-center py-12">
        <div class="loading-spinner mx-auto" />
      </div>

      <template v-else-if="cards.length > 0">
        <div class="space-y-3">
          <CardItem
            v-for="card in cards"
            :key="card.id"
            :card="card"
            :is-backlog="true"
          />
        </div>
      </template>

      <div v-else class="text-center py-16">
        <div class="empty-state-icon">
          <span class="i-lucide-inbox text-2xl text-fg-muted" />
        </div>
        <h2 class="empty-state-title">Пока пусто</h2>
        <p class="empty-state-desc">
          Добавьте карточку с помощью кнопки «Добавить»
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQuery } from '@vue/apollo-composable';
import { CARDS_QUERY } from '@/graphql/queries';
import type { CardGql, LearningStatus } from '@/graphql/types';
import { LEARNING_STATUS_META } from '@/lib/constants';
import CardItem from '@/components/card/CardItem.vue';
import { useCardGrouping } from '@/composables/useCardGrouping';

const route = useRoute();
const status = computed(() => route.meta.status as LearningStatus);
const initialLoaded = ref(false);

const currentMeta = computed(() => LEARNING_STATUS_META[status.value]);
const pageTitle = computed(() => currentMeta.value?.label ?? 'Обучение');

const { result, loading, refetch } = useQuery(CARDS_QUERY, () => ({
  filter: { learningStatus: status.value },
  limit: 1000,
  sortOrder: 'createdAt_DESC',
}));

watch(() => route.fullPath, () => {
  initialLoaded.value = false;
  refetch();
});

const cards = computed(() => (result.value?.cards ?? []) as CardGql[]);

watch([cards, loading], ([c, l]) => {
  if (c.length || !l) initialLoaded.value = true;
});

const { hubCards, workspaceCards } = useCardGrouping(cards);

function onCardUpdated() {
  // If learning status changed, the card might disappear from this list.
  // Refetching ensures consistency.
  refetch();
}

function onCardDeleted() {
  refetch();
}
</script>

<template>
  <div class="page-container max-w-5xl mx-auto py-8 px-4">
    <h1 class="text-2xl font-bold mb-6 flex items-center gap-2">
      <span v-if="currentMeta" :class="[currentMeta.icon, currentMeta.color]" />
      {{ pageTitle }}
    </h1>

    <div v-if="loading && !initialLoaded" class="flex-center py-12">
      <span class="i-lucide-loader-2 animate-spin text-2xl text-muted" />
    </div>

    <div v-else-if="cards.length === 0" class="text-center py-12 text-muted">
      Карточек с таким статусом нет
    </div>

    <div v-else class="space-y-8">
      <!-- Hub -->
      <section v-if="hubCards.length > 0">
        <h2 class="text-lg font-semibold mb-3 flex items-center gap-2">
          <span class="i-lucide-inbox text-muted" />
          Хаб
        </h2>
        <div class="grid gap-2">
          <CardItem
            v-for="card in hubCards"
            :key="card.id"
            :card="card"
            @updated="onCardUpdated"
            @deleted="onCardDeleted"
          />
        </div>
      </section>

      <!-- Workspaces -->
      <section v-for="wsGroup in workspaceCards" :key="wsGroup.workspace.id">
        <h2 class="text-lg font-semibold mb-3 flex items-center gap-2">
           <span v-if="wsGroup.workspace.icon" class="text-xl">{{ wsGroup.workspace.icon }}</span>
           <span v-else class="i-lucide-layout-grid text-muted" />
           {{ wsGroup.workspace.title }}
        </h2>
        <div class="grid gap-2">
           <CardItem
            v-for="card in wsGroup.cards"
            :key="card.id"
            :card="card"
            @updated="onCardUpdated"
            @deleted="onCardDeleted"
          />
        </div>
      </section>
    </div>
  </div>
</template>

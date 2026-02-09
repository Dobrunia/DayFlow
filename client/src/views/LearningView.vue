<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQuery } from '@vue/apollo-composable';
import { CARDS_QUERY } from '@/graphql/queries';
import type { CardGql, LearningStatus } from '@/graphql/types';
import CardItem from '@/components/card/CardItem.vue';

const route = useRoute();
const status = computed(() => route.meta.status as LearningStatus);
const initialLoaded = ref(false);

const titles: Record<string, string> = {
  WANT_TO_REPEAT: 'Хочу повторить',
  QUESTIONS_REMAIN: 'Остались вопросы',
  DEEPEN_KNOWLEDGE: 'Хочу углубить знания',
};

const pageTitle = computed(() => titles[status.value] ?? 'Обучение');

const { result, loading, refetch } = useQuery(CARDS_QUERY, () => ({
  filter: { learningStatus: status.value },
  limit: 1000,
  sortOrder: 'createdAt_DESC',
}));

watch(() => route.fullPath, () => {
  initialLoaded.value = false;
  refetch();
});

const cards = computed(() => {
  const c = result.value?.cards ?? [];
  if (c.length || !loading.value) initialLoaded.value = true;
  return c;
});

const hubCards = computed(() => cards.value.filter((c: CardGql) => !c.workspaceId));

const workspaceCards = computed(() => {
  const map = new Map<string, { workspace: NonNullable<CardGql['workspace']>, cards: CardGql[] }>();
  
  cards.value.forEach((c: CardGql) => {
    if (c.workspaceId && c.workspace) {
      if (!map.has(c.workspaceId)) {
        map.set(c.workspaceId, { workspace: c.workspace, cards: [] });
      }
      map.get(c.workspaceId)!.cards.push(c);
    }
  });
  
  return Array.from(map.values()).sort((a, b) => a.workspace.title.localeCompare(b.workspace.title));
});

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
      <span v-if="status === 'WANT_TO_REPEAT'" class="i-lucide-repeat text-orange-500" />
      <span v-else-if="status === 'QUESTIONS_REMAIN'" class="i-lucide-help-circle text-red-500" />
      <span v-else-if="status === 'DEEPEN_KNOWLEDGE'" class="i-lucide-book-open text-blue-500" />
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

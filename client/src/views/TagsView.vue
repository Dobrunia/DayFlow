<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCardsStore } from '@/stores/cards';
import { useWorkspaceStore } from '@/stores/workspace';
import CardItem from '@/components/card/CardItem.vue';
import type { CardGql } from '@/graphql/types';

const route = useRoute();
const router = useRouter();
const cardsStore = useCardsStore();
const workspaceStore = useWorkspaceStore();

const selectedTag = computed(() => (route.query.tag as string) || null);

const loading = ref(true);
const workspaceCardsCache = ref<Map<string, CardGql>>(new Map());

// Computed: combine hub cards + workspace cards, with reactive updates
const allCards = computed(() => {
  const map = new Map<string, CardGql>();
  
  // Hub cards from store (reactive)
  for (const c of cardsStore.cards) {
    map.set(c.id, c);
  }
  
  // Cached workspace cards
  for (const [id, card] of workspaceCardsCache.value) {
    map.set(id, card);
  }
  
  // Override with current workspace data (reactive - updates on card edit)
  const ws = workspaceStore.currentWorkspace;
  if (ws) {
    for (const col of ws.columns ?? []) {
      for (const c of col.cards ?? []) {
        map.set(c.id, c);
      }
    }
    for (const c of ws.backlog ?? []) {
      map.set(c.id, c);
    }
  }
  
  return Array.from(map.values());
});

async function fetchAllCards() {
  loading.value = true;
  
  // Fetch hub cards
  await cardsStore.fetchCards({});
  
  // Fetch all workspaces and their cards
  await workspaceStore.fetchWorkspaces();
  
  const cache = new Map<string, CardGql>();
  for (const ws of workspaceStore.workspaces) {
    const workspace = await workspaceStore.fetchWorkspace(ws.id);
    if (workspace) {
      for (const col of workspace.columns ?? []) {
        for (const c of col.cards ?? []) {
          cache.set(c.id, c);
        }
      }
      for (const c of workspace.backlog ?? []) {
        cache.set(c.id, c);
      }
    }
  }
  workspaceCardsCache.value = cache;
  
  loading.value = false;
}

onMounted(fetchAllCards);

function handleCardUpdated(card: CardGql) {
  // Update in workspace cache (для workspace карточек)
  workspaceCardsCache.value.set(card.id, card);
  // Триггерим реактивность для computed
  workspaceCardsCache.value = new Map(workspaceCardsCache.value);
}

function handleCardDeleted(cardId: string) {
  // Remove from workspace cache
  workspaceCardsCache.value.delete(cardId);
  // Триггерим реактивность для computed
  workspaceCardsCache.value = new Map(workspaceCardsCache.value);
}

// Group cards by tags
const tagGroups = computed(() => {
  const groups = new Map<string, typeof allCards.value>();
  
  for (const card of allCards.value) {
    for (const tag of card.tags ?? []) {
      if (!groups.has(tag)) {
        groups.set(tag, []);
      }
      groups.get(tag)!.push(card);
    }
  }
  
  // Sort by count desc
  return Array.from(groups.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .map(([tag, cards]) => ({ tag, cards, count: cards.length }));
});

const cardsForSelectedTag = computed(() => {
  if (!selectedTag.value) return [];
  return tagGroups.value.find((g) => g.tag === selectedTag.value)?.cards ?? [];
});

function selectTag(tag: string | null) {
  router.push({ query: tag ? { tag } : {} });
}
</script>

<template>
  <div class="page-container">
    <div class="flex flex-wrap items-end justify-between gap-4 mb-8 cursor-default">
      <div>
        <h1 class="page-title">Теги</h1>
        <p class="page-desc">Карточки, сгруппированные по тегам</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-center py-16">
      <span class="i-lucide-loader-2 animate-spin text-2xl text-muted" />
    </div>

    <template v-else>
      <!-- Tag selected - show cards -->
      <template v-if="selectedTag">
        <div class="mb-6">
          <button
            type="button"
            class="inline-flex items-center gap-1 text-link hover:underline underline-offset-3"
            @click="selectTag(null)"
          >
            <span class="i-lucide-arrow-left" />
            <span>Все теги</span>
          </button>
        </div>

        <div class="flex items-center gap-3 mb-6">
          <span class="text-2xl font-bold text-fg">#{{ selectedTag }}</span>
          <span class="text-sm text-muted">{{ cardsForSelectedTag.length }} карточек</span>
        </div>

        <div v-if="cardsForSelectedTag.length === 0" class="text-center py-12 text-muted">
          Нет карточек с этим тегом
        </div>
        <div v-else class="space-y-3">
          <CardItem
            v-for="card in cardsForSelectedTag"
            :key="card.id"
            :card="card"
            :is-backlog="true"
            :static="true"
            @updated="handleCardUpdated"
            @deleted="handleCardDeleted"
          />
        </div>
      </template>

      <!-- No tag selected - show tag grid -->
      <template v-else>
        <div v-if="tagGroups.length === 0" class="text-center py-16 flex flex-col items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-fg/5 flex-center">
            <span class="i-lucide-hash text-2xl text-muted" />
          </div>
          <h2 class="text-lg font-semibold text-fg">Нет тегов</h2>
          <p class="text-sm text-muted">Добавьте теги к карточкам, чтобы группировать их</p>
        </div>

        <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          <button
            v-for="group in tagGroups"
            :key="group.tag"
            @click="selectTag(group.tag)"
            class="card-hover text-left p-5 group"
          >
            <div
              class="w-10 h-10 rounded-xl flex-center mb-3 text-xl font-bold transition-colors bg-primary/10 text-primary group-hover:bg-primary/15"
            >
              #
            </div>
            <h3 class="font-semibold text-fg mb-1.5 truncate text-base">
              {{ group.tag }}
            </h3>
            <p class="text-sm text-muted">
              {{ group.count }} {{ group.count === 1 ? 'карточка' : group.count < 5 ? 'карточки' : 'карточек' }}
            </p>
          </button>
        </div>
      </template>
    </template>
  </div>
</template>

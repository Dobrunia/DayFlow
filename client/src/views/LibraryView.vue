<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCardsStore } from '@/stores/cards';
import CardItem from '@/components/card/CardItem.vue';
import type { CardGql } from '@/graphql/types';

const PAGE_SIZE = 10;

const route = useRoute();
const router = useRouter();
const cardsStore = useCardsStore();

const singleCard = ref<CardGql | null>(null);
const singleCardLoading = ref(false);

const page = computed({
  get: () => {
    const p = Number(route.query.page);
    return Number.isFinite(p) && p >= 1 ? p : 1;
  },
  set: (v: number) => updateUrl({ page: v === 1 ? undefined : v }),
});

const cardIdFromUrl = computed(() => (route.query.card as string) || null);

const cards = computed(() => cardsStore.filteredCards);
const loading = computed(() => cardsStore.loading);
const totalCount = computed(() => cardsStore.totalCount);
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / PAGE_SIZE)));
const hasPagination = computed(() => totalPages.value > 1);

function updateUrl(updates: { page?: number; card?: string }) {
  const current = { ...route.query } as Record<string, string>;
  if (updates.page !== undefined) {
    if (updates.page === 1) delete current.page;
    else current.page = String(updates.page);
  }
  if (updates.card !== undefined) {
    if (!updates.card) delete current.card;
    else current.card = updates.card;
  }
  const query = Object.fromEntries(Object.entries(current).filter(([, v]) => v != null && v !== ''));
  router.replace({ path: route.path, query });
}

function goToList() {
  updateUrl({ card: '' });
  singleCard.value = null;
}

async function loadList() {
  cardsStore.setFilter({ workspaceId: null }, { skipFetch: true });
  await cardsStore.fetchCards({
    workspaceId: null,
    limit: PAGE_SIZE,
    offset: (page.value - 1) * PAGE_SIZE,
  });
}

async function loadSingleCard(id: string) {
  singleCardLoading.value = true;
  singleCard.value = null;
  try {
    const card = await cardsStore.fetchCardById(id);
    if (!card) {
      goToList();
      return;
    }
    if (card.workspaceId) {
      router.replace(`/workspace/${card.workspaceId}`);
      return;
    }
    singleCard.value = card;
  } finally {
    singleCardLoading.value = false;
  }
}

watch(
  cardIdFromUrl,
  (id) => {
    if (id) loadSingleCard(id);
    else {
      singleCard.value = null;
      loadList();
    }
  },
  { immediate: true }
);

watch(
  () => route.query.page,
  () => {
    if (!cardIdFromUrl.value) loadList();
  },
  { immediate: false }
);

onMounted(() => {
  cardsStore.setFilter({ workspaceId: null }, { skipFetch: true });
  if (cardIdFromUrl.value) loadSingleCard(cardIdFromUrl.value);
  else loadList();
});

function goToPage(p: number) {
  if (p >= 1 && p <= totalPages.value) updateUrl({ page: p });
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-5 py-10">
    <div class="flex-between mb-8 cursor-default">
      <div>
        <h1 class="page-title mb-1">
          Хаб
        </h1>
        <p class="text-sm text-fg-muted">
          Карточки без воркспейса
        </p>
      </div>
    </div>

    <!-- Single card view (from URL ?card=id) -->
    <template v-if="cardIdFromUrl">
      <div
        v-if="singleCardLoading"
        class="flex justify-center py-12"
      >
        <div class="loading-spinner" />
      </div>
      <template v-else-if="singleCard">
        <div class="mb-4">
          <RouterLink
            :to="{ path: '/library', query: { ...($route.query as Record<string, string>), card: undefined } }"
            class="btn-ghost text-sm text-fg-muted hover:text-fg"
          >
            <span class="i-lucide-arrow-left mr-1" />
            Назад к хабу
          </RouterLink>
        </div>
        <CardItem
          :card="singleCard"
          :is-backlog="true"
        />
      </template>
    </template>

    <!-- List view -->
    <template v-else>
      <div class="min-h-[320px]">
        <div
          v-if="loading"
          class="text-center py-12"
        >
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

          <div
            v-if="hasPagination"
            class="mt-8 flex items-center justify-center gap-2"
          >
            <button
              type="button"
              class="btn-ghost btn-sm"
              :disabled="page <= 1"
              @click="goToPage(page - 1)"
            >
              Назад
            </button>
            <span class="text-sm text-fg-muted px-2">
              {{ page }} / {{ totalPages }}
            </span>
            <button
              type="button"
              class="btn-ghost btn-sm"
              :disabled="page >= totalPages"
              @click="goToPage(page + 1)"
            >
              Вперёд
            </button>
          </div>
        </template>

        <div
          v-else
          class="text-center py-16"
        >
          <div class="empty-state-icon">
            <span class="i-lucide-inbox text-2xl text-fg-muted" />
          </div>
          <h2 class="empty-state-title">
            Пока пусто
          </h2>
          <p class="empty-state-desc">
            Добавьте карточку с помощью кнопки «Добавить»
          </p>
        </div>
      </div>
    </template>
  </div>
</template>

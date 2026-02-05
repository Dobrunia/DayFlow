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
const hideDone = computed({
  get: () => route.query.hideDone === '1',
  set: (v) => updateUrl({ hideDone: v ? '1' : undefined, page: 1 }),
});
const sortOldestFirst = computed({
  get: () => route.query.sort === 'oldest',
  set: (v) => updateUrl({ sort: v ? 'oldest' : undefined, page: 1 }),
});

const cards = computed(() => cardsStore.filteredCards);
const loading = computed(() => cardsStore.loading);
const totalCount = computed(() => cardsStore.totalCount);
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / PAGE_SIZE)));
const hasPagination = computed(() => totalPages.value > 1);

function updateUrl(updates: {
  page?: number;
  card?: string;
  hideDone?: string;
  sort?: string;
}) {
  const current = { ...route.query } as Record<string, string>;
  if ('page' in updates) {
    if (updates.page === 1) delete current.page;
    else current.page = String(updates.page!);
  }
  if ('card' in updates) {
    if (!updates.card) delete current.card;
    else current.card = updates.card;
  }
  if ('hideDone' in updates) {
    if (updates.hideDone) current.hideDone = updates.hideDone;
    else delete current.hideDone;
  }
  if ('sort' in updates) {
    if (updates.sort) current.sort = updates.sort;
    else delete current.sort;
  }
  const query = Object.fromEntries(Object.entries(current).filter(([, v]) => v != null && v !== ''));
  router.replace({ path: route.path, query });
}

function goToList() {
  updateUrl({ card: '' });
  singleCard.value = null;
}

async function loadList() {
  const hideDoneVal = route.query.hideDone === '1';
  const sortOrder = route.query.sort === 'oldest' ? 'createdAt_ASC' : 'createdAt_DESC';
  cardsStore.setFilter(
    { workspaceId: null, ...(hideDoneVal && { done: false }) },
    { skipFetch: true }
  );
  await cardsStore.fetchCards({
    workspaceId: null,
    ...(hideDoneVal && { done: false }),
    limit: PAGE_SIZE,
    offset: (page.value - 1) * PAGE_SIZE,
    sortOrder,
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
  () => [route.query.page, route.query.hideDone, route.query.sort],
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
  <div class="page-container">
    <div class="page-header-row">
      <div class="page-header-text">
        <h1 class="page-title">
          Хаб
        </h1>
        <p class="page-desc">
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
            class="btn-link"
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
      <div class="mb-6 flex flex-wrap items-center gap-4 cursor-default">
        <label class="flex items-center gap-2 text-sm text-fg-muted hover:text-fg cursor-pointer">
          <button
            type="button"
            role="checkbox"
            :aria-checked="hideDone"
            class="checkbox-btn-card"
            :class="hideDone ? 'checkbox-btn-checked' : 'checkbox-btn-unchecked'"
            @click.prevent="hideDone = !hideDone"
          >
            <span v-if="hideDone" class="i-lucide-check text-xs" />
          </button>
          Отключить выполненные
        </label>
        <button type="button" class="btn-link" @click="sortOldestFirst = !sortOldestFirst">
          {{ sortOldestFirst ? 'Сначала старые' : 'Сначала новые' }}
          <span class="i-lucide-arrow-up-down ml-1" />
        </button>
      </div>

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
            <button type="button" class="btn-ghost-sm" :disabled="page <= 1" @click="goToPage(page - 1)">
              Назад
            </button>
            <span class="text-sm text-fg-muted px-2">{{ page }} / {{ totalPages }}</span>
            <button type="button" class="btn-ghost-sm" :disabled="page >= totalPages" @click="goToPage(page + 1)">
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

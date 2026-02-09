<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useCardsStore } from '@/stores/cards';
import { debounce, getCardIcon } from '@/lib/utils';
import type { CardGql } from '@/graphql/types';

const router = useRouter();
const cardsStore = useCardsStore();

const query = ref('');
const results = ref<CardGql[]>([]);
const isOpen = ref(false);
const loading = ref(false);

const debouncedSearch = debounce(async (searchQuery: string) => {
  if (!searchQuery.trim()) {
    results.value = [];
    return;
  }
  loading.value = true;
  results.value = await cardsStore.searchCards(searchQuery);
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

function selectResult(card: CardGql) {
  if (card.workspaceId) {
    router.push(`/workspace/${card.workspaceId}`);
  } else {
    router.push({ path: '/library', query: { card: card.id } });
  }
  query.value = '';
  isOpen.value = false;
}

function handleBlur() {
  setTimeout(() => {
    isOpen.value = false;
  }, 200);
}

</script>

<template>
  <div class="relative">
    <div class="relative">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 i-lucide-search text-muted" />
      <input
        v-model="query"
        type="text"
        placeholder="Поиск карточек..."
        class="input pl-9"
        @focus="isOpen = query.trim().length > 0"
        @blur="handleBlur"
      />
    </div>

    <div v-if="isOpen && (results.length > 0 || loading)" class="dropdown-panel absolute w-full">
      <div v-if="loading" class="p-4 text-center text-sm text-muted">Поиск...</div>

      <template v-else>
        <button
          v-for="card in results"
          :key="card.id"
          type="button"
          @click="selectResult(card)"
          class="dropdown-item"
        >
          <span :class="getCardIcon(card.type)" class="text-muted" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-fg truncate">{{ card.title || '(без названия)' }}</p>
            <p class="text-xs text-muted truncate">
              <span v-if="card.workspace" class="inline-flex items-center gap-0.5">
                <span v-if="card.workspace.icon">{{ card.workspace.icon }}</span>
                <span>{{ card.workspace.title }}</span>
              </span>
              <span v-else>Хаб</span>
              <template v-if="(card.tags ?? []).length">
                · {{ (card.tags as string[]).join(', ') }}
              </template>
            </p>
          </div>
          <span v-if="card.done" class="i-lucide-check text-success" />
        </button>

        <div v-if="results.length === 0" class="p-4 text-center text-sm text-muted">
          Ничего не найдено
        </div>
      </template>
    </div>
  </div>
</template>

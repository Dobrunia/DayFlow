import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apolloClient } from '@/lib/apollo';
import { getGraphQLErrorMessage } from '@/lib/graphql-error';
import { CARDS_QUERY, CARDS_COUNT_QUERY, CARD_QUERY } from '@/graphql/queries';
import { CREATE_CARD_MUTATION, UPDATE_CARD_MUTATION, DELETE_CARD_MUTATION } from '@/graphql/mutations';
import type { CardGql, CardFilter, CreateCardInput, UpdateCardInput } from '@/graphql/types';

const FILTER_KEYS = ['type', 'done', 'workspaceId', 'columnId', 'search'] as const;

function toFilterVars(f: Partial<CardFilter>) {
  return Object.fromEntries(
    Object.entries(f).filter(
      ([k, v]) => FILTER_KEYS.includes(k as (typeof FILTER_KEYS)[number]) && v !== undefined
    )
  );
}

export const useCardsStore = defineStore('cards', () => {
  const cards = ref<CardGql[]>([]);
  const totalCount = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const filter = ref<CardFilter>({
    type: undefined,
    done: undefined,
    workspaceId: undefined,
    search: undefined,
  });

  const filteredCards = computed(() => cards.value);

  async function fetchCards(
    opts?: Partial<CardFilter> & { limit?: number; offset?: number; sortOrder?: string }
  ) {
    try {
      loading.value = true;
      error.value = null;
      const f = opts ?? filter.value;
      const filterVars = toFilterVars(f);
      const limit = opts?.limit;
      const offset = opts?.offset ?? 0;
      const sortOrder = opts?.sortOrder;
      const variables = {
        filter: Object.keys(filterVars).length ? filterVars : undefined,
        ...(limit != null && { limit, offset }),
        ...(sortOrder != null && { sortOrder }),
      };
      const cardsRes = await apolloClient.query({
        query: CARDS_QUERY,
        variables: { ...variables, filter: variables.filter ?? {} },
        fetchPolicy: 'network-only',
      });
      cards.value = (cardsRes.data as { cards?: CardGql[] }).cards ?? [];

      if (limit != null) {
        const countRes = await apolloClient.query({
          query: CARDS_COUNT_QUERY,
          variables: { filter: filterVars },
          fetchPolicy: 'network-only',
        });
        totalCount.value = (countRes.data as { cardsCount: number }).cardsCount ?? 0;
      }
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
    } finally {
      loading.value = false;
    }
  }

  async function fetchCardById(id: string): Promise<CardGql | null> {
    try {
      const { data } = await apolloClient.query({
        query: CARD_QUERY,
        variables: { id },
        fetchPolicy: 'network-only',
      });
      return (data?.card as CardGql) ?? null;
    } catch {
      return null;
    }
  }

  async function searchCards(searchQuery: string) {
    if (!searchQuery.trim()) return [];
    try {
      const { data } = await apolloClient.query({
        query: CARDS_QUERY,
        variables: { filter: { search: searchQuery.trim() } },
        fetchPolicy: 'network-only',
      });
      return (data.cards ?? []) as CardGql[];
    } catch {
      return [];
    }
  }

  async function createCard(input: CreateCardInput) {
    try {
      loading.value = true;
      error.value = null;
      const { data } = await apolloClient.mutate({
        mutation: CREATE_CARD_MUTATION,
        variables: { input },
      });
      const card = data.createCard as CardGql;
      if (!input.workspaceId && !input.columnId) {
        cards.value = [card, ...cards.value];
      }
      return card;
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function updateCard(id: string, input: UpdateCardInput) {
    try {
      error.value = null;
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_CARD_MUTATION,
        variables: { id, input },
      });
      const updated = data.updateCard as CardGql;
      const index = cards.value.findIndex((c) => c.id === id);
      if (index !== -1) {
        const next = [...cards.value];
        next[index] = { ...next[index], ...updated };
        cards.value = next;
      }
      return updated;
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
      throw e;
    }
  }

  async function deleteCard(id: string) {
    try {
      error.value = null;
      await apolloClient.mutate({
        mutation: DELETE_CARD_MUTATION,
        variables: { id },
      });
      cards.value = cards.value.filter((c) => c.id !== id);
      await fetchCards();
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
      throw e;
    }
  }

  function setFilter(newFilter: Partial<CardFilter>, options?: { skipFetch?: boolean }) {
    filter.value = { ...filter.value, ...newFilter };
    if (!options?.skipFetch) fetchCards();
  }

  function clearFilter() {
    filter.value = {};
    fetchCards();
  }

  return {
    cards,
    filteredCards,
    totalCount,
    loading,
    error,
    filter,
    fetchCards,
    fetchCardById,
    searchCards,
    createCard,
    updateCard,
    deleteCard,
    setFilter,
    clearFilter,
  };
});

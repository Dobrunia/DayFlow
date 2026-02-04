import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apolloClient } from '@/lib/apollo';
import { getGraphQLErrorMessage } from '@/lib/graphql-error';
import { CARDS_QUERY } from '@/graphql/queries';
import { CREATE_CARD_MUTATION, UPDATE_CARD_MUTATION, DELETE_CARD_MUTATION } from '@/graphql/mutations';
import type { CardGql, CardFilter, CreateCardInput, UpdateCardInput } from '@/graphql/types';

export const useCardsStore = defineStore('cards', () => {
  const cards = ref<CardGql[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const filter = ref<CardFilter>({
    type: undefined,
    done: undefined,
    workspaceId: undefined,
    search: undefined,
  });

  const filteredCards = computed(() => cards.value);

  async function fetchCards(customFilter?: Partial<CardFilter>) {
    try {
      loading.value = true;
      error.value = null;
      const f = customFilter ?? filter.value;
      const { data } = await apolloClient.query({
        query: CARDS_QUERY,
        variables: { filter: Object.fromEntries(Object.entries(f).filter(([, v]) => v != null)) },
        fetchPolicy: 'network-only',
      });
      cards.value = data.cards ?? [];
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
    } finally {
      loading.value = false;
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
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
      throw e;
    }
  }

  function setFilter(newFilter: Partial<CardFilter>) {
    filter.value = { ...filter.value, ...newFilter };
    fetchCards();
  }

  function clearFilter() {
    filter.value = {};
    fetchCards();
  }

  return {
    cards,
    filteredCards,
    loading,
    error,
    filter,
    fetchCards,
    searchCards,
    createCard,
    updateCard,
    deleteCard,
    setFilter,
    clearFilter,
  };
});

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apolloClient } from '@/lib/apollo';
import { LIBRARY_QUERY, SEARCH_ITEMS_QUERY } from '@/graphql/queries';
import {
  CREATE_ITEM_MUTATION,
  UPDATE_ITEM_MUTATION,
  DELETE_ITEM_MUTATION,
} from '@/graphql/mutations';
import type { Item, CreateItemInput, UpdateItemInput, LibraryFilter } from '@/graphql/types';

export const useLibraryStore = defineStore('library', () => {
  const items = ref<Item[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const filter = ref<LibraryFilter>({
    type: undefined,
    done: undefined,
    search: undefined,
  });

  const filteredItems = computed(() => {
    return items.value;
  });

  async function fetchLibrary() {
    try {
      loading.value = true;
      error.value = null;

      const { data } = await apolloClient.query({
        query: LIBRARY_QUERY,
        variables: { filter: filter.value },
        fetchPolicy: 'network-only',
      });

      items.value = data.library;
    } catch (e: unknown) {
      const err = e as Error;
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function createItem(input: CreateItemInput) {
    try {
      loading.value = true;
      error.value = null;

      const { data } = await apolloClient.mutate({
        mutation: CREATE_ITEM_MUTATION,
        variables: { input },
      });

      // Add to list if it belongs to library (no workspace)
      if (!input.workspaceId) {
        items.value = [data.createItem, ...items.value];
      }

      return data.createItem;
    } catch (e: unknown) {
      const err = e as Error;
      error.value = err.message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function updateItem(id: string, input: UpdateItemInput) {
    try {
      error.value = null;

      const { data } = await apolloClient.mutate({
        mutation: UPDATE_ITEM_MUTATION,
        variables: { id, input },
      });

      if (!data?.updateItem) {
        throw new Error('Нет ответа от сервера');
      }

      const updated = data.updateItem as Item;
      const index = items.value.findIndex((item) => item.id === id);
      if (index === -1) return updated;

      // Если включён фильтр "только невыполненные" и элемент стал выполненным — убираем из списка
      if (filter.value.done === false && updated.done) {
        items.value = items.value.filter((item) => item.id !== id);
        return updated;
      }

      // Замена по индексу через новый массив — иначе Vue 3 может не обновить UI
      const next = [...items.value];
      next[index] = { ...next[index], ...updated };
      items.value = next;
      return updated;
    } catch (e: unknown) {
      const err = e as Error;
      error.value = err.message;
      throw e;
    }
  }

  async function deleteItem(id: string) {
    try {
      error.value = null;

      await apolloClient.mutate({
        mutation: DELETE_ITEM_MUTATION,
        variables: { id },
      });

      // Remove from list
      items.value = items.value.filter((item) => item.id !== id);
    } catch (e: unknown) {
      const err = e as Error;
      error.value = err.message;
      throw e;
    }
  }

  async function toggleDone(id: string) {
    const item = items.value.find((i) => i.id === id);
    if (item) {
      await updateItem(id, { done: !item.done });
    }
  }

  async function searchItems(query: string) {
    try {
      const { data } = await apolloClient.query({
        query: SEARCH_ITEMS_QUERY,
        variables: { query },
        fetchPolicy: 'network-only',
      });

      return data.searchItems as Item[];
    } catch {
      return [];
    }
  }

  function setFilter(newFilter: Partial<LibraryFilter>) {
    filter.value = { ...filter.value, ...newFilter };
    fetchLibrary();
  }

  function clearFilter() {
    filter.value = {
      type: undefined,
      done: undefined,
      search: undefined,
    };
    fetchLibrary();
  }

  return {
    items,
    filteredItems,
    loading,
    error,
    filter,
    fetchLibrary,
    createItem,
    updateItem,
    deleteItem,
    toggleDone,
    searchItems,
    setFilter,
    clearFilter,
  };
});

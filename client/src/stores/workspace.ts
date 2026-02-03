import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apolloClient } from '@/lib/apollo';
import { MY_WORKSPACES_QUERY, WORKSPACE_QUERY } from '@/graphql/queries';
import {
  CREATE_WORKSPACE_MUTATION,
  UPDATE_WORKSPACE_MUTATION,
  DELETE_WORKSPACE_MUTATION,
  CREATE_COLUMN_MUTATION,
  UPDATE_COLUMN_MUTATION,
  DELETE_COLUMN_MUTATION,
  REORDER_COLUMNS_MUTATION,
  CREATE_CARD_MUTATION,
  UPDATE_CARD_MUTATION,
  DELETE_CARD_MUTATION,
  TOGGLE_CARD_CHECKED_MUTATION,
  MOVE_CARD_MUTATION,
} from '@/graphql/mutations';
import type {
  Workspace,
  Column,
  Card,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  CreateCardInput,
  UpdateCardInput,
} from '@/graphql/types';

export const useWorkspaceStore = defineStore('workspace', () => {
  const workspaces = ref<Workspace[]>([]);
  const currentWorkspace = ref<Workspace | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchWorkspaces() {
    try {
      loading.value = true;
      error.value = null;

      const { data } = await apolloClient.query({
        query: MY_WORKSPACES_QUERY,
        fetchPolicy: 'network-only',
      });

      workspaces.value = data.myWorkspaces;
    } catch (e: unknown) {
      const err = e as Error;
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function fetchWorkspace(id: string) {
    try {
      loading.value = true;
      error.value = null;

      const { data } = await apolloClient.query({
        query: WORKSPACE_QUERY,
        variables: { id },
        fetchPolicy: 'network-only',
      });

      currentWorkspace.value = data.workspace;
      return data.workspace;
    } catch (e: unknown) {
      const err = e as Error;
      error.value = err.message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function createWorkspace(input: CreateWorkspaceInput) {
    try {
      loading.value = true;
      error.value = null;

      const { data } = await apolloClient.mutate({
        mutation: CREATE_WORKSPACE_MUTATION,
        variables: { input },
      });

      workspaces.value = [data.createWorkspace, ...workspaces.value];
      return data.createWorkspace;
    } catch (e: unknown) {
      const err = e as Error;
      error.value = err.message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function updateWorkspace(id: string, input: UpdateWorkspaceInput) {
    try {
      error.value = null;

      const { data } = await apolloClient.mutate({
        mutation: UPDATE_WORKSPACE_MUTATION,
        variables: { id, input },
      });

      // Update in list
      const index = workspaces.value.findIndex((w) => w.id === id);
      if (index !== -1) {
        workspaces.value[index] = { ...workspaces.value[index], ...data.updateWorkspace };
      }

      // Update current if it's the same
      if (currentWorkspace.value?.id === id) {
        currentWorkspace.value = { ...currentWorkspace.value, ...data.updateWorkspace };
      }

      return data.updateWorkspace;
    } catch (e: unknown) {
      const err = e as Error;
      error.value = err.message;
      throw e;
    }
  }

  async function deleteWorkspace(id: string) {
    try {
      error.value = null;

      await apolloClient.mutate({
        mutation: DELETE_WORKSPACE_MUTATION,
        variables: { id },
      });

      workspaces.value = workspaces.value.filter((w) => w.id !== id);

      if (currentWorkspace.value?.id === id) {
        currentWorkspace.value = null;
      }
    } catch (e: unknown) {
      const err = e as Error;
      error.value = err.message;
      throw e;
    }
  }

  // Column operations
  async function createColumn(workspaceId: string, title: string) {
    try {
      error.value = null;

      const { data } = await apolloClient.mutate({
        mutation: CREATE_COLUMN_MUTATION,
        variables: { workspaceId, title },
      });

      if (currentWorkspace.value?.id === workspaceId && currentWorkspace.value.columns) {
        currentWorkspace.value.columns = [
          ...currentWorkspace.value.columns,
          { ...data.createColumn, cards: [] },
        ];
      }

      return data.createColumn;
    } catch (e: unknown) {
      const err = e as Error;
      error.value = err.message;
      throw e;
    }
  }

  async function updateColumn(id: string, title: string) {
    try {
      error.value = null;

      const { data } = await apolloClient.mutate({
        mutation: UPDATE_COLUMN_MUTATION,
        variables: { id, title },
      });

      if (currentWorkspace.value?.columns) {
        const index = currentWorkspace.value.columns.findIndex((c) => c.id === id);
        if (index !== -1) {
          currentWorkspace.value.columns[index] = {
            ...currentWorkspace.value.columns[index],
            ...data.updateColumn,
          };
        }
      }

      return data.updateColumn;
    } catch (e: unknown) {
      const err = e as Error;
      error.value = err.message;
      throw e;
    }
  }

  async function deleteColumn(id: string) {
    try {
      error.value = null;

      await apolloClient.mutate({
        mutation: DELETE_COLUMN_MUTATION,
        variables: { id },
      });

      if (currentWorkspace.value?.columns) {
        currentWorkspace.value.columns = currentWorkspace.value.columns.filter((c) => c.id !== id);
      }
    } catch (e: unknown) {
      const err = e as Error;
      error.value = err.message;
      throw e;
    }
  }

  async function reorderColumns(workspaceId: string, columnIds: string[]) {
    try {
      error.value = null;

      await apolloClient.mutate({
        mutation: REORDER_COLUMNS_MUTATION,
        variables: { workspaceId, columnIds },
      });

      // Reorder locally
      if (currentWorkspace.value?.columns) {
        const columnMap = new Map(currentWorkspace.value.columns.map((c) => [c.id, c]));
        currentWorkspace.value.columns = columnIds
          .map((id) => columnMap.get(id))
          .filter(Boolean) as Column[];
      }
    } catch (e: unknown) {
      const err = e as Error;
      error.value = err.message;
      throw e;
    }
  }

  // Card operations
  async function createCard(columnId: string, input: CreateCardInput) {
    try {
      error.value = null;

      const { data } = await apolloClient.mutate({
        mutation: CREATE_CARD_MUTATION,
        variables: { columnId, input },
      });

      if (currentWorkspace.value?.columns) {
        const column = currentWorkspace.value.columns.find((c) => c.id === columnId);
        if (column) {
          column.cards = [...(column.cards || []), data.createCard];
        }
      }

      return data.createCard;
    } catch (e: unknown) {
      const err = e as Error;
      error.value = err.message;
      throw e;
    }
  }

  async function updateCard(id: string, input: UpdateCardInput) {
    try {
      error.value = null;

      const { data } = await apolloClient.mutate({
        mutation: UPDATE_CARD_MUTATION,
        variables: { id, input },
      });

      if (currentWorkspace.value?.columns) {
        for (const column of currentWorkspace.value.columns) {
          if (column.cards) {
            const index = column.cards.findIndex((c) => c.id === id);
            if (index !== -1) {
              column.cards[index] = { ...column.cards[index], ...data.updateCard };
              break;
            }
          }
        }
      }

      return data.updateCard;
    } catch (e: unknown) {
      const err = e as Error;
      error.value = err.message;
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

      if (currentWorkspace.value?.columns) {
        for (const column of currentWorkspace.value.columns) {
          if (column.cards) {
            column.cards = column.cards.filter((c) => c.id !== id);
          }
        }
      }
    } catch (e: unknown) {
      const err = e as Error;
      error.value = err.message;
      throw e;
    }
  }

  async function toggleCardChecked(id: string) {
    try {
      error.value = null;

      const { data } = await apolloClient.mutate({
        mutation: TOGGLE_CARD_CHECKED_MUTATION,
        variables: { id },
      });

      if (currentWorkspace.value?.columns) {
        for (const column of currentWorkspace.value.columns) {
          if (column.cards) {
            const card = column.cards.find((c) => c.id === id);
            if (card) {
              card.checked = data.toggleCardChecked.checked;
              break;
            }
          }
        }
      }

      return data.toggleCardChecked;
    } catch (e: unknown) {
      const err = e as Error;
      error.value = err.message;
      throw e;
    }
  }

  async function moveCard(id: string, columnId: string, order: number) {
    try {
      error.value = null;

      await apolloClient.mutate({
        mutation: MOVE_CARD_MUTATION,
        variables: { id, columnId, order },
      });

      // Refetch workspace to get updated card positions
      if (currentWorkspace.value) {
        await fetchWorkspace(currentWorkspace.value.id);
      }
    } catch (e: unknown) {
      const err = e as Error;
      error.value = err.message;
      throw e;
    }
  }

  function clearCurrentWorkspace() {
    currentWorkspace.value = null;
  }

  return {
    workspaces,
    currentWorkspace,
    loading,
    error,
    fetchWorkspaces,
    fetchWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    createCard,
    updateCard,
    deleteCard,
    toggleCardChecked,
    moveCard,
    clearCurrentWorkspace,
  };
});

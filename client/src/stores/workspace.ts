import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apolloClient } from '@/lib/apollo';
import { getGraphQLErrorMessage } from '@/lib/graphql-error';
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
  MOVE_CARD_MUTATION,
} from '@/graphql/mutations';
import type {
  Workspace,
  Column,
  CardGql,
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
      error.value = getGraphQLErrorMessage(e);
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
      error.value = getGraphQLErrorMessage(e);
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
      error.value = getGraphQLErrorMessage(e);
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
      const index = workspaces.value.findIndex((w) => w.id === id);
      if (index !== -1) {
        const next = [...workspaces.value];
        next[index] = { ...next[index], ...data.updateWorkspace };
        workspaces.value = next;
      }
      if (currentWorkspace.value?.id === id) {
        currentWorkspace.value = { ...currentWorkspace.value, ...data.updateWorkspace };
      }
      return data.updateWorkspace;
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
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
      if (currentWorkspace.value?.id === id) currentWorkspace.value = null;
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
      throw e;
    }
  }

  async function createColumn(workspaceId: string, title: string) {
    try {
      error.value = null;
      const { data } = await apolloClient.mutate({
        mutation: CREATE_COLUMN_MUTATION,
        variables: { workspaceId, title },
      });
      if (currentWorkspace.value?.id === workspaceId && currentWorkspace.value.columns) {
        const next = [...currentWorkspace.value.columns, { ...data.createColumn, cards: [] }];
        currentWorkspace.value = { ...currentWorkspace.value, columns: next };
      }
      return data.createColumn;
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
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
          const next = [...currentWorkspace.value.columns];
          next[index] = { ...next[index], ...data.updateColumn };
          currentWorkspace.value = { ...currentWorkspace.value, columns: next };
        }
      }
      return data.updateColumn;
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
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
        currentWorkspace.value = {
          ...currentWorkspace.value,
          columns: currentWorkspace.value.columns.filter((c) => c.id !== id),
        };
      }
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
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
      if (currentWorkspace.value?.columns) {
        const columnMap = new Map(currentWorkspace.value.columns.map((c) => [c.id, c]));
        const next = columnIds.map((id) => columnMap.get(id)).filter(Boolean) as Column[];
        currentWorkspace.value = { ...currentWorkspace.value, columns: next };
      }
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
      throw e;
    }
  }

  async function createCard(input: CreateCardInput) {
    try {
      error.value = null;
      const { data } = await apolloClient.mutate({
        mutation: CREATE_CARD_MUTATION,
        variables: { input },
      });
      const card = data.createCard as CardGql;
      const columnId = input.columnId;
      if (columnId && currentWorkspace.value?.columns) {
        const columns = currentWorkspace.value.columns.map((c) =>
          c.id === columnId ? { ...c, cards: [...(c.cards || []), card] } : c
        );
        currentWorkspace.value = { ...currentWorkspace.value, columns };
      }
      if (currentWorkspace.value?.backlog && !columnId) {
        currentWorkspace.value = {
          ...currentWorkspace.value,
          backlog: [card, ...currentWorkspace.value.backlog],
        };
      }
      return card;
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
      if (currentWorkspace.value?.id) await fetchWorkspace(currentWorkspace.value.id);
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
      const updated = data.updateCard as Partial<CardGql>;
      const updateInList = (list: CardGql[] | undefined) => {
        if (!list) return list;
        const index = list.findIndex((c) => c.id === id);
        if (index === -1) return list;
        const next = [...list];
        next[index] = { ...next[index], ...updated };
        return next;
      };
      if (currentWorkspace.value?.columns) {
        currentWorkspace.value = {
          ...currentWorkspace.value,
          columns: currentWorkspace.value.columns.map((col) => ({
            ...col,
            cards: updateInList(col.cards) ?? col.cards,
          })),
        };
      }
      if (currentWorkspace.value?.backlog) {
        currentWorkspace.value = {
          ...currentWorkspace.value,
          backlog: updateInList(currentWorkspace.value.backlog) ?? currentWorkspace.value.backlog,
        };
      }
      return data.updateCard;
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
      if (currentWorkspace.value) await fetchWorkspace(currentWorkspace.value.id);
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
      throw e;
    }
  }

  async function moveCard(id: string, columnId: string | null, order: number) {
    try {
      error.value = null;
      await apolloClient.mutate({
        mutation: MOVE_CARD_MUTATION,
        variables: { id, columnId, order },
      });
      if (currentWorkspace.value) await fetchWorkspace(currentWorkspace.value.id);
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
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
    moveCard,
    clearCurrentWorkspace,
  };
});

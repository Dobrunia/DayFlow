import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apolloClient } from '@/lib/apollo';
import { getGraphQLErrorMessage } from '@/lib/graphql-error';
import { MY_WORKSPACES_QUERY, WORKSPACE_QUERY } from '@/graphql/queries';
import {
  CREATE_WORKSPACE_MUTATION,
  UPDATE_WORKSPACE_MUTATION,
  DELETE_WORKSPACE_MUTATION,
  TOGGLE_WORKSPACE_PINNED_MUTATION,
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

/** Последнее перемещение карточки (для undo) */
interface LastMoveAction {
  cardId: string;
  fromColumnId: string | null;
  fromOrder: number;
  toColumnId: string | null;
  toOrder: number;
}

/** Удалённая карточка (для undo) */
interface DeletedCard {
  card: CardGql;
  workspaceId: string;
}

/** Удалённый воркспейс (для undo) */
interface DeletedWorkspace {
  workspace: Workspace;
  columns: Column[];
  cards: CardGql[];
}

/** Удалённая колонка (для undo) */
interface DeletedColumn {
  column: Column;
  workspaceId: string;
  cards: CardGql[];
  originalIndex: number;
}

export const useWorkspaceStore = defineStore('workspace', () => {
  const workspaces = ref<Workspace[]>([]);
  const currentWorkspace = ref<Workspace | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastMoveAction = ref<LastMoveAction | null>(null);
  const lastDeletedCard = ref<DeletedCard | null>(null);
  const lastDeletedWorkspace = ref<DeletedWorkspace | null>(null);
  const lastDeletedColumn = ref<DeletedColumn | null>(null);

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
    const index = workspaces.value.findIndex((w) => w.id === id);
    const oldWorkspace = index !== -1 ? { ...workspaces.value[index] } : null;
    const oldCurrentWorkspace = currentWorkspace.value ? { ...currentWorkspace.value } : null;

    // Optimistic update
    if (index !== -1) {
      const next = [...workspaces.value];
      next[index] = { ...next[index], ...input };
      workspaces.value = next;
    }
    if (currentWorkspace.value?.id === id) {
      currentWorkspace.value = { ...currentWorkspace.value, ...input };
    }

    try {
      error.value = null;
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_WORKSPACE_MUTATION,
        variables: { id, input },
      });
      // Sync with server
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
      // Revert on error
      if (oldWorkspace && index !== -1) {
        const next = [...workspaces.value];
        next[index] = oldWorkspace;
        workspaces.value = next;
      }
      if (oldCurrentWorkspace && currentWorkspace.value?.id === id) {
        currentWorkspace.value = oldCurrentWorkspace;
      }
      throw e;
    }
  }

  async function deleteWorkspace(id: string) {
    // Сохраняем воркспейс для undo
    const ws = currentWorkspace.value?.id === id ? currentWorkspace.value : workspaces.value.find((w) => w.id === id);
    const oldWorkspaces = [...workspaces.value];
    const oldCurrentWorkspace = currentWorkspace.value;
    
    if (ws) {
      const allCards: CardGql[] = [];
      for (const col of ws.columns ?? []) {
        allCards.push(...(col.cards ?? []));
      }
      allCards.push(...(ws.backlog ?? []));
      
      lastDeletedWorkspace.value = {
        workspace: { ...ws },
        columns: (ws.columns ?? []).map((c) => ({ ...c, cards: [] })),
        cards: allCards.map((c) => ({ ...c })),
      };
    }

    // Optimistic delete
    workspaces.value = workspaces.value.filter((w) => w.id !== id);
    if (currentWorkspace.value?.id === id) currentWorkspace.value = null;

    try {
      error.value = null;
      await apolloClient.mutate({
        mutation: DELETE_WORKSPACE_MUTATION,
        variables: { id },
      });
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
      // Revert on error
      workspaces.value = oldWorkspaces;
      currentWorkspace.value = oldCurrentWorkspace;
      lastDeletedWorkspace.value = null;
      throw e;
    }
  }

  async function toggleWorkspacePinned(id: string) {
    const index = workspaces.value.findIndex((w) => w.id === id);
    const oldPinned = index !== -1 ? workspaces.value[index].pinned : undefined;
    
    // Optimistic toggle
    if (index !== -1) {
      const next = [...workspaces.value];
      next[index] = { ...next[index], pinned: !next[index].pinned };
      workspaces.value = next;
    }

    try {
      error.value = null;
      const { data } = await apolloClient.mutate({
        mutation: TOGGLE_WORKSPACE_PINNED_MUTATION,
        variables: { id },
      });
      // Sync with server
      if (index !== -1) {
        const next = [...workspaces.value];
        next[index] = { ...next[index], pinned: data.toggleWorkspacePinned.pinned };
        workspaces.value = next;
      }
      return data.toggleWorkspacePinned;
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
      // Revert on error
      if (index !== -1 && oldPinned !== undefined) {
        const next = [...workspaces.value];
        next[index] = { ...next[index], pinned: oldPinned };
        workspaces.value = next;
      }
      throw e;
    }
  }

  async function undoDeleteWorkspace() {
    const deleted = lastDeletedWorkspace.value;
    if (!deleted) return;
    lastDeletedWorkspace.value = null;

    const { workspace: ws, columns, cards } = deleted;

    try {
      error.value = null;

      // 1. Создаём воркспейс
      const { data: wsData } = await apolloClient.mutate({
        mutation: CREATE_WORKSPACE_MUTATION,
        variables: {
          input: {
            title: ws.title,
            description: ws.description ?? undefined,
            icon: ws.icon ?? undefined,
          } as CreateWorkspaceInput,
        },
      });
      const newWsId = wsData.createWorkspace.id;

      // 2. Создаём колонки и запоминаем маппинг старых id -> новых id
      const columnIdMap = new Map<string, string>();
      const sortedColumns = [...columns].sort((a, b) => a.order - b.order);
      for (const col of sortedColumns) {
        const { data: colData } = await apolloClient.mutate({
          mutation: CREATE_COLUMN_MUTATION,
          variables: { workspaceId: newWsId, title: col.title },
        });
        columnIdMap.set(col.id, colData.createColumn.id);
      }

      // 3. Создаём карточки
      for (const card of cards) {
        const newColumnId = card.columnId ? columnIdMap.get(card.columnId) : undefined;
        const input: CreateCardInput = {
          type: card.type,
          title: card.title ?? undefined,
          workspaceId: newWsId,
          columnId: newColumnId,
          payload: card.payload,
          tags: card.tags,
        };
        await apolloClient.mutate({
          mutation: CREATE_CARD_MUTATION,
          variables: { input },
        });
      }

      // 4. Обновляем список воркспейсов
      await fetchWorkspaces();

      return newWsId;
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
    const oldWorkspace = currentWorkspace.value ? { ...currentWorkspace.value } : null;
    
    // Optimistic update
    if (currentWorkspace.value?.columns) {
      const index = currentWorkspace.value.columns.findIndex((c) => c.id === id);
      if (index !== -1) {
        const next = [...currentWorkspace.value.columns];
        next[index] = { ...next[index], title };
        currentWorkspace.value = { ...currentWorkspace.value, columns: next };
      }
    }

    try {
      error.value = null;
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_COLUMN_MUTATION,
        variables: { id, title },
      });
      // Sync with server
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
      // Revert on error
      if (oldWorkspace) {
        currentWorkspace.value = oldWorkspace;
      }
      throw e;
    }
  }

  async function deleteColumn(id: string) {
    // Сохраняем колонку для undo
    const ws = currentWorkspace.value;
    const oldWorkspace = ws ? { ...ws } : null;
    
    if (ws) {
      const colIndex = ws.columns?.findIndex((c) => c.id === id) ?? -1;
      const col = ws.columns?.[colIndex];
      if (col) {
        lastDeletedColumn.value = {
          column: { ...col, cards: [] },
          workspaceId: ws.id,
          cards: (col.cards ?? []).map((c) => ({ ...c })),
          originalIndex: colIndex,
        };
      }
    }

    // Optimistic delete
    if (currentWorkspace.value?.columns) {
      currentWorkspace.value = {
        ...currentWorkspace.value,
        columns: currentWorkspace.value.columns.filter((c) => c.id !== id),
      };
    }

    try {
      error.value = null;
      await apolloClient.mutate({
        mutation: DELETE_COLUMN_MUTATION,
        variables: { id },
      });
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
      // Revert on error
      if (oldWorkspace) {
        currentWorkspace.value = oldWorkspace;
      }
      lastDeletedColumn.value = null;
      throw e;
    }
  }

  async function undoDeleteColumn() {
    const deleted = lastDeletedColumn.value;
    if (!deleted) return;
    lastDeletedColumn.value = null;

    const { column, workspaceId, cards, originalIndex } = deleted;

    try {
      error.value = null;

      // 1. Создаём колонку
      const { data: colData } = await apolloClient.mutate({
        mutation: CREATE_COLUMN_MUTATION,
        variables: { workspaceId, title: column.title },
      });
      const newColumnId = colData.createColumn.id;

      // 2. Восстанавливаем карточки
      for (const card of cards) {
        const input: CreateCardInput = {
          type: card.type,
          title: card.title ?? undefined,
          workspaceId,
          columnId: newColumnId,
          payload: card.payload,
          tags: card.tags,
        };
        await apolloClient.mutate({
          mutation: CREATE_CARD_MUTATION,
          variables: { input },
        });
      }

      // 3. Обновляем воркспейс
      if (currentWorkspace.value?.id === workspaceId) {
        await fetchWorkspace(workspaceId);
      }

      // 4. Восстанавливаем порядок колонки
      const ws = currentWorkspace.value;
      if (ws?.columns) {
        const currentIds = ws.columns.map((c) => c.id);
        // Убираем новую колонку с конца и вставляем на оригинальную позицию
        const newColCurrentIndex = currentIds.indexOf(newColumnId);
        if (newColCurrentIndex !== -1) {
          currentIds.splice(newColCurrentIndex, 1);
          currentIds.splice(originalIndex, 0, newColumnId);
          await reorderColumns(workspaceId, currentIds);
        }
      }
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
      throw e;
    }
  }

  async function reorderColumns(workspaceId: string, columnIds: string[]) {
    const oldWorkspace = currentWorkspace.value ? { ...currentWorkspace.value } : null;

    // Optimistic reorder
    if (currentWorkspace.value?.columns) {
      const columnMap = new Map(currentWorkspace.value.columns.map((c) => [c.id, c]));
      const next = columnIds.map((id) => columnMap.get(id)).filter(Boolean) as Column[];
      currentWorkspace.value = { ...currentWorkspace.value, columns: next };
    }

    try {
      error.value = null;
      await apolloClient.mutate({
        mutation: REORDER_COLUMNS_MUTATION,
        variables: { workspaceId, columnIds },
      });
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
      // Revert on error
      if (oldWorkspace) {
        currentWorkspace.value = oldWorkspace;
      }
      throw e;
    }
  }

  async function moveColumnLeft(columnId: string) {
    const ws = currentWorkspace.value;
    if (!ws?.columns) return;
    
    const idx = ws.columns.findIndex((c) => c.id === columnId);
    if (idx <= 0) return; // already first or not found
    
    const ids = ws.columns.map((c) => c.id);
    [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
    await reorderColumns(ws.id, ids);
  }

  async function moveColumnRight(columnId: string) {
    const ws = currentWorkspace.value;
    if (!ws?.columns) return;
    
    const idx = ws.columns.findIndex((c) => c.id === columnId);
    if (idx === -1 || idx >= ws.columns.length - 1) return; // already last or not found
    
    const ids = ws.columns.map((c) => c.id);
    [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
    await reorderColumns(ws.id, ids);
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
    // Save old state for rollback
    const oldWorkspace = currentWorkspace.value ? { ...currentWorkspace.value } : null;

    // Optimistic update helper
    const updateInList = (list: CardGql[] | undefined, changes: Partial<CardGql>) => {
      if (!list) return list;
      const index = list.findIndex((c) => c.id === id);
      if (index === -1) return list;
      const next = [...list];
      next[index] = { ...next[index], ...changes };
      return next;
    };

    // Optimistic update
    if (currentWorkspace.value?.columns) {
      currentWorkspace.value = {
        ...currentWorkspace.value,
        columns: currentWorkspace.value.columns.map((col) => ({
          ...col,
          cards: updateInList(col.cards, input) ?? col.cards,
        })),
      };
    }
    if (currentWorkspace.value?.backlog) {
      currentWorkspace.value = {
        ...currentWorkspace.value,
        backlog: updateInList(currentWorkspace.value.backlog, input) ?? currentWorkspace.value.backlog,
      };
    }

    try {
      error.value = null;
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_CARD_MUTATION,
        variables: { id, input },
      });
      const updated = data.updateCard as Partial<CardGql>;
      // Sync with server response
      if (currentWorkspace.value?.columns) {
        currentWorkspace.value = {
          ...currentWorkspace.value,
          columns: currentWorkspace.value.columns.map((col) => ({
            ...col,
            cards: updateInList(col.cards, updated) ?? col.cards,
          })),
        };
      }
      if (currentWorkspace.value?.backlog) {
        currentWorkspace.value = {
          ...currentWorkspace.value,
          backlog: updateInList(currentWorkspace.value.backlog, updated) ?? currentWorkspace.value.backlog,
        };
      }
      return data.updateCard;
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
      // Revert on error
      if (oldWorkspace) {
        currentWorkspace.value = oldWorkspace;
      }
      throw e;
    }
  }

  async function deleteCard(id: string) {
    const ws = currentWorkspace.value;
    const oldWorkspace = ws ? { ...ws } : null;
    
    // Сохраняем карточку для undo
    if (ws) {
      let card: CardGql | undefined;
      for (const col of ws.columns ?? []) {
        card = (col.cards ?? []).find((c) => c.id === id);
        if (card) break;
      }
      if (!card) card = (ws.backlog ?? []).find((c) => c.id === id);
      if (card) {
        lastDeletedCard.value = { card: { ...card }, workspaceId: ws.id };
      }
    }

    // Optimistic delete
    if (currentWorkspace.value) {
      const ws = currentWorkspace.value;
      const updatedColumns = ws.columns?.map((col) => ({
        ...col,
        cards: (col.cards ?? []).filter((c) => c.id !== id),
      }));
      const updatedBacklog = (ws.backlog ?? []).filter((c) => c.id !== id);
      currentWorkspace.value = {
        ...ws,
        columns: updatedColumns,
        backlog: updatedBacklog,
      };
    }

    try {
      error.value = null;
      await apolloClient.mutate({
        mutation: DELETE_CARD_MUTATION,
        variables: { id },
      });
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
      // Revert on error
      if (oldWorkspace) {
        currentWorkspace.value = oldWorkspace;
      }
      lastDeletedCard.value = null;
      throw e;
    }
  }

  async function undoDeleteCard() {
    const deleted = lastDeletedCard.value;
    if (!deleted) return;
    lastDeletedCard.value = null;

    const { card } = deleted;
    const input: CreateCardInput = {
      type: card.type,
      title: card.title ?? undefined,
      workspaceId: card.workspaceId ?? undefined,
      columnId: card.columnId ?? undefined,
      payload: card.payload,
      tags: card.tags,
    };

    try {
      error.value = null;
      const { data } = await apolloClient.mutate({
        mutation: CREATE_CARD_MUTATION,
        variables: { input },
      });
      const newCard = data.createCard as CardGql;
      
      // Обновляем локально
      if (currentWorkspace.value) {
        const ws = currentWorkspace.value;
        if (newCard.columnId) {
          // Добавляем в колонку
          const updatedColumns = ws.columns?.map((col) =>
            col.id === newCard.columnId
              ? { ...col, cards: [newCard, ...(col.cards ?? [])] }
              : col
          );
          currentWorkspace.value = { ...ws, columns: updatedColumns };
        } else {
          // Добавляем в беклог
          currentWorkspace.value = {
            ...ws,
            backlog: [newCard, ...(ws.backlog ?? [])],
          };
        }
      }
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
      throw e;
    }
  }

  async function moveCard(id: string, columnId: string | null, order: number, skipUndo = false) {
    const ws = currentWorkspace.value;
    if (!ws) return;
    let card: CardGql | undefined;
    let fromColumnId: string | null = null;
    let fromOrder = 0;
    for (const col of ws.columns ?? []) {
      const idx = (col.cards ?? []).findIndex((c) => c.id === id);
      if (idx !== -1) {
        card = (col.cards ?? [])[idx];
        fromColumnId = col.id;
        fromOrder = card.order ?? idx;
        break;
      }
    }
    if (!card && ws.backlog) {
      const idx = ws.backlog.findIndex((c) => c.id === id);
      if (idx !== -1) {
        card = ws.backlog[idx];
        fromColumnId = null; // backlog = null columnId
        fromOrder = card.order ?? idx;
      }
    }

    // Сохраняем для undo (если не сам undo)
    if (!skipUndo && card) {
      lastMoveAction.value = {
        cardId: id,
        fromColumnId,
        fromOrder,
        toColumnId: columnId,
        toOrder: order,
      };
    }

    if (card) {
      const payload = { ...card, columnId, workspaceId: columnId ? ws.id : null, order };
      const realFromColumnId = fromColumnId; // null для backlog
      const newColumns = (ws.columns ?? []).map((col) => {
        const isSource = realFromColumnId === col.id;
        const isTarget = columnId != null && col.id === columnId;

        if (isSource && isTarget) {
          // Reorder внутри той же колонки
          const filtered = (col.cards ?? []).filter((c) => c.id !== id);
          filtered.splice(Math.min(order, filtered.length), 0, payload);
          return { ...col, cards: filtered.map((c, i) => ({ ...c, order: i })) };
        }
        if (isSource) {
          return { ...col, cards: (col.cards ?? []).filter((c) => c.id !== id) };
        }
        if (isTarget) {
          const list = [...(col.cards ?? [])];
          list.splice(Math.min(order, list.length), 0, payload);
          return { ...col, cards: list.map((c, i) => ({ ...c, order: i })) };
        }
        return col;
      });

      const isBacklogSource = realFromColumnId === null;
      const isBacklogTarget = columnId === null;
      let newBacklog = ws.backlog ?? [];

      if (isBacklogSource && isBacklogTarget) {
        // Reorder внутри бэклога
        const filtered = newBacklog.filter((c) => c.id !== id);
        filtered.splice(Math.min(order, filtered.length), 0, payload);
        newBacklog = filtered.map((c, i) => ({ ...c, order: i }));
      } else if (isBacklogSource) {
        newBacklog = newBacklog.filter((c) => c.id !== id);
      } else if (isBacklogTarget) {
        const list = [...newBacklog];
        list.splice(Math.min(order, list.length), 0, payload);
        newBacklog = list.map((c, i) => ({ ...c, order: i }));
      }

      currentWorkspace.value = { ...ws, columns: newColumns, backlog: newBacklog };
    }
    try {
      error.value = null;
      await apolloClient.mutate({
        mutation: MOVE_CARD_MUTATION,
        variables: { id, columnId, order },
      });
      // Оптимистичное обновление уже сделано выше — не перезагружаем
    } catch (e: unknown) {
      error.value = getGraphQLErrorMessage(e);
      lastMoveAction.value = null;
      // При ошибке синхронизируем с сервером
      if (currentWorkspace.value) await fetchWorkspace(currentWorkspace.value.id);
      throw e;
    }
  }

  async function undoLastMove() {
    const action = lastMoveAction.value;
    if (!action) return;
    lastMoveAction.value = null; // сбрасываем сразу, чтобы не зациклить
    await moveCard(action.cardId, action.fromColumnId, action.fromOrder, true);
  }

  function clearCurrentWorkspace() {
    currentWorkspace.value = null;
  }

  return {
    workspaces,
    currentWorkspace,
    loading,
    error,
    lastMoveAction,
    lastDeletedCard,
    lastDeletedWorkspace,
    lastDeletedColumn,
    fetchWorkspaces,
    fetchWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    undoDeleteWorkspace,
    toggleWorkspacePinned,
    createColumn,
    updateColumn,
    deleteColumn,
    undoDeleteColumn,
    reorderColumns,
    moveColumnLeft,
    moveColumnRight,
    createCard,
    updateCard,
    deleteCard,
    undoDeleteCard,
    moveCard,
    undoLastMove,
    clearCurrentWorkspace,
  };
});

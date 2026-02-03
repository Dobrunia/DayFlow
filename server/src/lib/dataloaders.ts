import DataLoader from 'dataloader';
import { prisma } from './prisma.js';
import type { Column, Card, Item, User, Workspace } from '@prisma/client';

export interface DataLoaders {
  userById: DataLoader<string, User | null>;
  workspaceById: DataLoader<string, Workspace | null>;
  columnsByWorkspaceId: DataLoader<string, Column[]>;
  cardsByColumnId: DataLoader<string, Card[]>;
  itemById: DataLoader<string, Item | null>;
  itemsByWorkspaceId: DataLoader<string, Item[]>;
}

export function createDataLoaders(): DataLoaders {
  return {
    userById: new DataLoader(async (ids) => {
      const users = await prisma.user.findMany({
        where: { id: { in: [...ids] } },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));
      return ids.map((id) => userMap.get(id) ?? null);
    }),

    workspaceById: new DataLoader(async (ids) => {
      const workspaces = await prisma.workspace.findMany({
        where: { id: { in: [...ids] } },
      });
      const map = new Map(workspaces.map((w) => [w.id, w]));
      return ids.map((id) => map.get(id) ?? null);
    }),

    columnsByWorkspaceId: new DataLoader(async (workspaceIds) => {
      const columns = await prisma.column.findMany({
        where: { workspaceId: { in: [...workspaceIds] } },
        orderBy: { order: 'asc' },
      });
      const map = new Map<string, Column[]>();
      for (const col of columns) {
        const arr = map.get(col.workspaceId) ?? [];
        arr.push(col);
        map.set(col.workspaceId, arr);
      }
      return workspaceIds.map((id) => map.get(id) ?? []);
    }),

    cardsByColumnId: new DataLoader(async (columnIds) => {
      const cards = await prisma.card.findMany({
        where: { columnId: { in: [...columnIds] } },
        orderBy: { order: 'asc' },
      });
      const map = new Map<string, Card[]>();
      for (const card of cards) {
        const arr = map.get(card.columnId) ?? [];
        arr.push(card);
        map.set(card.columnId, arr);
      }
      return columnIds.map((id) => map.get(id) ?? []);
    }),

    itemById: new DataLoader(async (ids) => {
      const items = await prisma.item.findMany({
        where: { id: { in: [...ids] } },
      });
      const map = new Map(items.map((i) => [i.id, i]));
      return ids.map((id) => map.get(id) ?? null);
    }),

    itemsByWorkspaceId: new DataLoader(async (workspaceIds) => {
      const items = await prisma.item.findMany({
        where: { workspaceId: { in: [...workspaceIds] } },
        orderBy: { createdAt: 'desc' },
      });
      const map = new Map<string, Item[]>();
      for (const item of items) {
        if (item.workspaceId) {
          const arr = map.get(item.workspaceId) ?? [];
          arr.push(item);
          map.set(item.workspaceId, arr);
        }
      }
      return workspaceIds.map((id) => map.get(id) ?? []);
    }),
  };
}

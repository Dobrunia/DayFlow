import DataLoader from 'dataloader';
import { prisma } from './prisma.js';
import type { User, Workspace, Column, Card } from '@prisma/client';
import type { DataLoaders } from './types.js';

export function createDataLoaders(): DataLoaders {
  return {
    userById: new DataLoader<string, User | null>(async (ids) => {
      const users = await prisma.user.findMany({
        where: { id: { in: [...ids] } },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));
      return ids.map((id) => userMap.get(id) ?? null);
    }),

    workspaceById: new DataLoader<string, Workspace | null>(async (ids) => {
      const workspaces = await prisma.workspace.findMany({
        where: { id: { in: [...ids] } },
      });
      const map = new Map(workspaces.map((w) => [w.id, w]));
      return ids.map((id) => map.get(id) ?? null);
    }),

    columnsByWorkspaceId: new DataLoader<string, Column[]>(async (workspaceIds) => {
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

    cardsByColumnId: new DataLoader<string, Card[]>(async (columnIds) => {
      const cards = await prisma.card.findMany({
        where: { columnId: { in: [...columnIds] } },
        orderBy: [{ columnId: 'asc' }, { order: 'asc' }],
      });
      const map = new Map<string, Card[]>();
      for (const card of cards) {
        if (card.columnId) {
          const arr = map.get(card.columnId) ?? [];
          arr.push(card);
          map.set(card.columnId, arr);
        }
      }
      return columnIds.map((id) => map.get(id) ?? []);
    }),

    cardsByWorkspaceId: new DataLoader<string, Card[]>(async (workspaceIds) => {
      const cards = await prisma.card.findMany({
        where: { workspaceId: { in: [...workspaceIds] } },
        orderBy: { createdAt: 'desc' },
      });
      const map = new Map<string, Card[]>();
      for (const card of cards) {
        if (card.workspaceId) {
          const arr = map.get(card.workspaceId) ?? [];
          arr.push(card);
          map.set(card.workspaceId, arr);
        }
      }
      return workspaceIds.map((id) => map.get(id) ?? []);
    }),
  };
}

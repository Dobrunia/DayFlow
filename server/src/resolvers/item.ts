import type { Context } from '../lib/context.js';
import type { ItemType } from '@prisma/client';

export interface CreateItemInput {
  title: string;
  type: string;
  url?: string;
  content?: string;
  workspaceId?: string;
}

export interface UpdateItemInput {
  title?: string;
  url?: string;
  content?: string;
  status?: string;
  done?: boolean;
}

export interface LibraryFilter {
  type?: string;
  done?: boolean;
  search?: string;
}

// Map GraphQL enum to Prisma enum
function mapItemType(type: string): ItemType {
  const typeMap: Record<string, ItemType> = {
    NOTE: 'note',
    LINK: 'link',
    VIDEO: 'video',
    REPO: 'repo',
    TASK: 'task',
  };
  return typeMap[type] ?? 'note';
}

export const itemResolvers = {
  Query: {
    library: async (_: unknown, { filter }: { filter?: LibraryFilter }, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const where: Record<string, unknown> = {
        userId: context.user.id,
        workspaceId: null, // Library items have no workspace
      };

      if (filter?.type) {
        where.type = mapItemType(filter.type);
      }

      if (filter?.done !== undefined) {
        where.done = filter.done;
      }

      if (filter?.search) {
        where.OR = [
          { title: { contains: filter.search } },
          { url: { contains: filter.search } },
          { content: { contains: filter.search } },
        ];
      }

      return context.prisma.item.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    },

    searchItems: async (_: unknown, { query }: { query: string }, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      return context.prisma.item.findMany({
        where: {
          userId: context.user.id,
          OR: [
            { title: { contains: query } },
            { url: { contains: query } },
            { content: { contains: query } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    },
  },

  Mutation: {
    createItem: async (_: unknown, { input }: { input: CreateItemInput }, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      // If workspaceId provided, verify ownership
      if (input.workspaceId) {
        const workspace = await context.prisma.workspace.findUnique({
          where: { id: input.workspaceId },
        });

        if (!workspace || workspace.ownerId !== context.user.id) {
          throw new Error('Workspace not found');
        }
      }

      return context.prisma.item.create({
        data: {
          title: input.title,
          type: mapItemType(input.type),
          url: input.url,
          content: input.content,
          workspaceId: input.workspaceId,
          userId: context.user.id,
        },
      });
    },

    updateItem: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateItemInput },
      context: Context
    ) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const item = await context.prisma.item.findUnique({
        where: { id },
      });

      if (!item || item.userId !== context.user.id) {
        throw new Error('Item not found');
      }

      const data: Record<string, unknown> = {};
      if (input.title !== undefined) data.title = input.title;
      if (input.url !== undefined) data.url = input.url;
      if (input.content !== undefined) data.content = input.content;
      if (input.status !== undefined) data.status = input.status;
      if (input.done !== undefined) data.done = input.done;

      return context.prisma.item.update({
        where: { id },
        data,
      });
    },

    deleteItem: async (_: unknown, { id }: { id: string }, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const item = await context.prisma.item.findUnique({
        where: { id },
      });

      if (!item || item.userId !== context.user.id) {
        throw new Error('Item not found');
      }

      await context.prisma.item.delete({
        where: { id },
      });

      return true;
    },
  },

  Item: {
    type: (parent: { type: ItemType }) => {
      return parent.type.toUpperCase();
    },

    workspace: async (parent: { workspaceId: string | null }, _: unknown, context: Context) => {
      if (!parent.workspaceId) return null;
      return context.loaders.workspaceById.load(parent.workspaceId);
    },

    meta: (parent: { meta: unknown }) => {
      if (!parent.meta) return null;
      return JSON.stringify(parent.meta);
    },
  },
};

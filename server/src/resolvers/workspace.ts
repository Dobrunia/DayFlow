import type { Context } from '../lib/context.js';

export interface CreateWorkspaceInput {
  title: string;
  description?: string;
}

export interface UpdateWorkspaceInput {
  title?: string;
  description?: string;
}

export const workspaceResolvers = {
  Query: {
    workspace: async (_: unknown, { id }: { id: string }, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const workspace = await context.prisma.workspace.findUnique({
        where: { id },
      });

      if (!workspace || workspace.ownerId !== context.user.id) {
        throw new Error('Workspace not found');
      }

      return workspace;
    },

    myWorkspaces: async (_: unknown, __: unknown, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      return context.prisma.workspace.findMany({
        where: { ownerId: context.user.id },
        orderBy: { createdAt: 'desc' },
      });
    },
  },

  Mutation: {
    createWorkspace: async (
      _: unknown,
      { input }: { input: CreateWorkspaceInput },
      context: Context
    ) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      // Create workspace with default column
      const workspace = await context.prisma.workspace.create({
        data: {
          title: input.title,
          description: input.description,
          ownerId: context.user.id,
          columns: {
            create: {
              title: 'To Do',
              order: 0,
            },
          },
        },
        include: {
          columns: true,
        },
      });

      return workspace;
    },

    updateWorkspace: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateWorkspaceInput },
      context: Context
    ) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const workspace = await context.prisma.workspace.findUnique({
        where: { id },
      });

      if (!workspace || workspace.ownerId !== context.user.id) {
        throw new Error('Workspace not found');
      }

      return context.prisma.workspace.update({
        where: { id },
        data: {
          title: input.title ?? undefined,
          description: input.description,
        },
      });
    },

    deleteWorkspace: async (_: unknown, { id }: { id: string }, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const workspace = await context.prisma.workspace.findUnique({
        where: { id },
      });

      if (!workspace || workspace.ownerId !== context.user.id) {
        throw new Error('Workspace not found');
      }

      await context.prisma.workspace.delete({
        where: { id },
      });

      return true;
    },
  },

  Workspace: {
    owner: async (parent: { ownerId: string }, _: unknown, context: Context) => {
      return context.loaders.userById.load(parent.ownerId);
    },

    columns: async (parent: { id: string }, _: unknown, context: Context) => {
      return context.loaders.columnsByWorkspaceId.load(parent.id);
    },

    items: async (parent: { id: string }, _: unknown, context: Context) => {
      return context.loaders.itemsByWorkspaceId.load(parent.id);
    },
  },
};

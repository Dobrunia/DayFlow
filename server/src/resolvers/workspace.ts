import type { CreateWorkspaceInput, UpdateWorkspaceInput } from 'dayflow-shared';
import type { Context } from '../lib/context.js';
import { UnauthenticatedError, NotFoundError, BadRequestError } from '../lib/errors.js';

const MAX_TITLE_LENGTH = 191; // MySQL VARCHAR limit

export const workspaceResolvers = {
  Query: {
    workspace: async (_: unknown, { id }: { id: string }, context: Context) => {
      if (!context.user) throw UnauthenticatedError();
      const workspace = await context.prisma.workspace.findUnique({ where: { id } });
      if (!workspace || workspace.ownerId !== context.user.id) return null;
      return workspace;
    },

    myWorkspaces: async (_: unknown, __: unknown, context: Context) => {
      if (!context.user) throw UnauthenticatedError();
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
      if (!context.user) throw UnauthenticatedError();
      if (input.title && input.title.length > MAX_TITLE_LENGTH) {
        throw BadRequestError(`Название слишком длинное (макс. ${MAX_TITLE_LENGTH} символов)`);
      }
      return context.prisma.workspace.create({
        data: {
          title: input.title,
          description: input.description,
          icon: input.icon ?? null,
          ownerId: context.user.id,
          columns: {
            create: { title: 'To Do', order: 0 },
          },
        },
        include: { columns: true },
      });
    },

    updateWorkspace: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateWorkspaceInput },
      context: Context
    ) => {
      if (!context.user) throw UnauthenticatedError();
      if (input.title && input.title.length > MAX_TITLE_LENGTH) {
        throw BadRequestError(`Название слишком длинное (макс. ${MAX_TITLE_LENGTH} символов)`);
      }
      const workspace = await context.prisma.workspace.findUnique({ where: { id } });
      if (!workspace || workspace.ownerId !== context.user.id) throw NotFoundError('Workspace not found');
      const data: { title?: string; description?: string | null; icon?: string | null } = {};
      if (input.title !== undefined) data.title = input.title;
      if (input.description !== undefined) data.description = input.description;
      if (input.icon !== undefined) data.icon = input.icon;
      return context.prisma.workspace.update({ where: { id }, data });
    },

    deleteWorkspace: async (_: unknown, { id }: { id: string }, context: Context) => {
      if (!context.user) throw UnauthenticatedError();
      const workspace = await context.prisma.workspace.findUnique({ where: { id } });
      if (!workspace || workspace.ownerId !== context.user.id) throw NotFoundError('Workspace not found');
      await context.prisma.workspace.delete({ where: { id } });
      return true;
    },
  },

  Workspace: {
    owner: (parent: { ownerId: string }, _: unknown, context: Context) =>
      context.loaders.userById.load(parent.ownerId),
    columns: (parent: { id: string }, _: unknown, context: Context) =>
      context.loaders.columnsByWorkspaceId.load(parent.id),
    cards: (parent: { id: string }, _: unknown, context: Context) =>
      context.loaders.cardsByWorkspaceId.load(parent.id),
    backlog: async (parent: { id: string }, _: unknown, context: Context) => {
      if (!context.user) return [];
      return context.prisma.card.findMany({
        where: {
          workspaceId: parent.id,
          columnId: null,
          ownerId: context.user.id,
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      });
    },
  },
};

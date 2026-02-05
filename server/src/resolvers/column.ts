import type { Context } from '../lib/context.js';
import { UnauthenticatedError, NotFoundError, BadRequestError } from '../lib/errors.js';

const MAX_TITLE_LENGTH = 191;

export const columnResolvers = {
  Mutation: {
    createColumn: async (
      _: unknown,
      { workspaceId, title }: { workspaceId: string; title: string },
      context: Context
    ) => {
      if (!context.user) {
        throw UnauthenticatedError();
      }
      if (title && title.length > MAX_TITLE_LENGTH) {
        throw BadRequestError(`Название слишком длинное (макс. ${MAX_TITLE_LENGTH} символов)`);
      }

      // Verify workspace ownership
      const workspace = await context.prisma.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (!workspace || workspace.ownerId !== context.user.id) {
        throw NotFoundError('Workspace not found');
      }

      // Get max order
      const maxOrder = await context.prisma.column.aggregate({
        where: { workspaceId },
        _max: { order: true },
      });

      const newOrder = (maxOrder._max.order ?? -1) + 1;

      return context.prisma.column.create({
        data: {
          title,
          order: newOrder,
          workspaceId,
        },
      });
    },

    updateColumn: async (
      _: unknown,
      { id, title }: { id: string; title: string },
      context: Context
    ) => {
      if (!context.user) {
        throw UnauthenticatedError();
      }
      if (title && title.length > MAX_TITLE_LENGTH) {
        throw BadRequestError(`Название слишком длинное (макс. ${MAX_TITLE_LENGTH} символов)`);
      }

      const column = await context.prisma.column.findUnique({
        where: { id },
        include: { workspace: true },
      });

      if (!column || column.workspace.ownerId !== context.user.id) {
        throw NotFoundError('Column not found');
      }

      return context.prisma.column.update({
        where: { id },
        data: { title },
      });
    },

    deleteColumn: async (_: unknown, { id }: { id: string }, context: Context) => {
      if (!context.user) {
        throw UnauthenticatedError();
      }

      const column = await context.prisma.column.findUnique({
        where: { id },
        include: { workspace: true },
      });

      if (!column || column.workspace.ownerId !== context.user.id) {
        throw NotFoundError('Column not found');
      }

      await context.prisma.column.delete({
        where: { id },
      });

      return true;
    },

    reorderColumns: async (
      _: unknown,
      { workspaceId, columnIds }: { workspaceId: string; columnIds: string[] },
      context: Context
    ) => {
      if (!context.user) {
        throw UnauthenticatedError();
      }

      // Verify workspace ownership
      const workspace = await context.prisma.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (!workspace || workspace.ownerId !== context.user.id) {
        throw NotFoundError('Workspace not found');
      }

      // Update order for each column
      await context.prisma.$transaction(
        columnIds.map((id, index) =>
          context.prisma.column.update({
            where: { id },
            data: { order: index },
          })
        )
      );

      return context.prisma.column.findMany({
        where: { workspaceId },
        orderBy: { order: 'asc' },
      });
    },
  },

  Column: {
    workspace: async (parent: { workspaceId: string }, _: unknown, context: Context) => {
      return context.loaders.workspaceById.load(parent.workspaceId);
    },

    cards: async (parent: { id: string }, _: unknown, context: Context) => {
      return context.loaders.cardsByColumnId.load(parent.id);
    },
  },
};

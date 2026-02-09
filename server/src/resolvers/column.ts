import type { Context } from '../lib/types.js';
import type {
  MutationCreateColumnArgs,
  MutationUpdateColumnArgs,
  MutationDeleteColumnArgs,
  MutationReorderColumnsArgs,
} from '../generated/types.js';
import { UnauthenticatedError, NotFoundError, BadRequestError } from '../lib/errors.js';
import { MAX_TITLE_LENGTH, MAX_COLUMNS_PER_WORKSPACE } from '../lib/constants.js';

export const columnResolvers = {
  Mutation: {
    createColumn: async (
      _: unknown,
      { workspaceId, title }: MutationCreateColumnArgs,
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
        throw NotFoundError('Рабочее пространство не найдено');
      }

      // Check column limit
      const columnCount = await context.prisma.column.count({
        where: { workspaceId },
      });
      if (columnCount >= MAX_COLUMNS_PER_WORKSPACE) {
        throw BadRequestError(`Максимум ${MAX_COLUMNS_PER_WORKSPACE} колонок в воркспейсе`);
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
      { id, title, hideCompleted }: MutationUpdateColumnArgs,
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
        throw NotFoundError('Колонка не найдена');
      }

      const data: { title?: string; hideCompleted?: boolean } = {};
      if (title !== undefined && title !== null) data.title = title;
      if (hideCompleted !== undefined && hideCompleted !== null) data.hideCompleted = hideCompleted;

      return context.prisma.column.update({
        where: { id },
        data,
      });
    },

    deleteColumn: async (_: unknown, { id }: MutationDeleteColumnArgs, context: Context) => {
      if (!context.user) {
        throw UnauthenticatedError();
      }

      const column = await context.prisma.column.findUnique({
        where: { id },
        include: { workspace: true },
      });

      if (!column || column.workspace.ownerId !== context.user.id) {
        throw NotFoundError('Колонка не найдена');
      }

      await context.prisma.column.delete({
        where: { id },
      });

      return true;
    },

    reorderColumns: async (
      _: unknown,
      { workspaceId, columnIds }: MutationReorderColumnsArgs,
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
        throw NotFoundError('Рабочее пространство не найдено');
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

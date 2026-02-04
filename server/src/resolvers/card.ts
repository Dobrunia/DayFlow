import type { Context } from '../lib/context.js';
import type { CardType, Prisma } from '@prisma/client';
import type { CreateCardInput, UpdateCardInput, CardFilter } from 'dayflow-shared';
import {
  NotePayloadSchema,
  LinkPayloadSchema,
  ChecklistPayloadSchema,
} from 'dayflow-shared';
import { UnauthenticatedError, NotFoundError } from '../lib/errors.js';

function mapCardType(type: string): CardType {
  const typeMap: Record<string, CardType> = {
    NOTE: 'note',
    LINK: 'link',
    CHECKLIST: 'checklist',
  };
  return typeMap[type] ?? 'note';
}

function parseTags(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags.filter((t): t is string => typeof t === 'string');
  return [];
}

export const cardResolvers = {
  Query: {
    cards: async (_: unknown, { filter }: { filter?: CardFilter }, context: Context) => {
      if (!context.user) throw UnauthenticatedError();

      const where: Prisma.CardWhereInput = { ownerId: context.user.id };

      if (filter?.type) where.type = mapCardType(filter.type);
      if (filter?.done !== undefined) where.done = filter.done;
      if (filter?.workspaceId !== undefined) where.workspaceId = filter.workspaceId || null;
      if (filter?.columnId !== undefined) where.columnId = filter.columnId || null;
      if (filter?.search) {
        where.OR = [{ title: { contains: filter.search } }];
      }

      return context.prisma.card.findMany({
        where,
        orderBy: [{ columnId: 'asc' }, { order: 'asc' }, { createdAt: 'desc' }],
      });
    },

    card: async (_: unknown, { id }: { id: string }, context: Context) => {
      if (!context.user) throw UnauthenticatedError();
      const card = await context.prisma.card.findUnique({ where: { id } });
      if (!card || card.ownerId !== context.user.id) return null;
      return card;
    },
  },

  Mutation: {
    createCard: async (
      _: unknown,
      { input }: { input: CreateCardInput },
      context: Context
    ) => {
      if (!context.user) throw UnauthenticatedError();

      let workspaceId: string | null = input.workspaceId ?? null;
      let columnId: string | null = input.columnId ?? null;

      if (input.workspaceId) {
        const ws = await context.prisma.workspace.findUnique({
          where: { id: input.workspaceId },
        });
        if (!ws || ws.ownerId !== context.user.id) throw NotFoundError('Workspace not found');
      }
      if (input.columnId) {
        const col = await context.prisma.column.findUnique({
          where: { id: input.columnId },
          include: { workspace: true },
        });
        if (!col || col.workspace.ownerId !== context.user.id) throw NotFoundError('Column not found');
        workspaceId = col.workspaceId;
      }

      const rawPayload =
        input.payload != null && input.payload !== '' ? JSON.parse(input.payload) : {};
      const type = mapCardType(input.type);
      if (type === 'note') NotePayloadSchema.parse(rawPayload);
      else if (type === 'link') LinkPayloadSchema.parse(rawPayload);
      else ChecklistPayloadSchema.parse(rawPayload);
      const payload: Prisma.InputJsonValue = rawPayload as object;
      const tagsJson: Prisma.InputJsonValue = Array.isArray(input.tags) ? input.tags : [];

      let order: number | null = null;
      if (columnId) {
        const max = await context.prisma.card.aggregate({
          where: { columnId },
          _max: { order: true },
        });
        order = (max._max.order ?? -1) + 1;
      }

      return context.prisma.card.create({
        data: {
          ownerId: context.user.id,
          workspaceId,
          columnId,
          order,
          type: mapCardType(input.type),
          title: input.title ?? null,
          payload,
          tags: tagsJson,
        },
      });
    },

    updateCard: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateCardInput },
      context: Context
    ) => {
      if (!context.user) throw UnauthenticatedError();
      const card = await context.prisma.card.findUnique({ where: { id } });
      if (!card || card.ownerId !== context.user.id) throw NotFoundError('Card not found');

      const data: Prisma.CardUpdateInput = {};
      if (input.title !== undefined) data.title = input.title;
      if (input.done !== undefined) data.done = input.done;
      if (input.columnId !== undefined) {
        data.column =
          input.columnId == null ? { disconnect: true } : { connect: { id: input.columnId } };
      }
      if (input.order !== undefined) data.order = input.order;
      if (input.payload !== undefined) {
        const raw =
          input.payload === '' ? {} : JSON.parse(input.payload) as Record<string, unknown>;
        if (Object.keys(raw).length > 0) {
          if (card.type === 'note') NotePayloadSchema.parse(raw);
          else if (card.type === 'link') LinkPayloadSchema.parse(raw);
          else ChecklistPayloadSchema.parse(raw);
        }
        data.payload = (input.payload === '' ? {} : raw) as Prisma.InputJsonValue;
      }
      if (input.tags !== undefined) data.tags = input.tags as Prisma.InputJsonValue;

      return context.prisma.card.update({ where: { id }, data });
    },

    deleteCard: async (_: unknown, { id }: { id: string }, context: Context) => {
      if (!context.user) throw UnauthenticatedError();
      const card = await context.prisma.card.findUnique({ where: { id } });
      if (!card || card.ownerId !== context.user.id) throw NotFoundError('Card not found');
      await context.prisma.card.delete({ where: { id } });
      return true;
    },

    moveCard: async (
      _: unknown,
      { id, columnId, order }: { id: string; columnId: string | null; order: number },
      context: Context
    ) => {
      if (!context.user) throw UnauthenticatedError();
      const card = await context.prisma.card.findUnique({ where: { id } });
      if (!card || card.ownerId !== context.user.id) throw NotFoundError('Card not found');

      let workspaceId: string | null = null;
      if (columnId) {
        const col = await context.prisma.column.findUnique({
          where: { id: columnId },
          include: { workspace: true },
        });
        if (!col || col.workspace.ownerId !== context.user.id) throw NotFoundError('Column not found');
        workspaceId = col.workspaceId;
      }

      return context.prisma.card.update({
        where: { id },
        data: { columnId, workspaceId, order },
      });
    },
  },

  Card: {
    type: (parent: { type: CardType }) => parent.type.toUpperCase(),
    payload: (parent: { payload: unknown }) =>
      typeof parent.payload === 'object' && parent.payload !== null
        ? JSON.stringify(parent.payload)
        : '{}',
    tags: (parent: { tags: unknown }) => parseTags(parent.tags),
    owner: (parent: { ownerId: string }, _: unknown, context: Context) =>
      context.loaders.userById.load(parent.ownerId),
    workspace: (parent: { workspaceId: string | null }, _: unknown, context: Context) =>
      parent.workspaceId ? context.loaders.workspaceById.load(parent.workspaceId) : null,
    column: (parent: { columnId: string | null }, _: unknown, context: Context) =>
      parent.columnId
        ? context.prisma.column.findUnique({ where: { id: parent.columnId } })
        : null,
  },
};

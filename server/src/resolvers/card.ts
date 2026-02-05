import type { Context } from '../lib/context.js';
import { Prisma } from '@prisma/client';
import type { CardType } from '@prisma/client';
import type { CreateCardInput, UpdateCardInput, CardFilter } from 'dayflow-shared';
import {
  NotePayloadSchema,
  LinkPayloadSchema,
  ChecklistPayloadSchema,
} from 'dayflow-shared';
import { UnauthenticatedError, NotFoundError, BadRequestError } from '../lib/errors.js';

const MAX_TITLE_LENGTH = 191;

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

function buildCardsWhere(filter: CardFilter | undefined, userId: string): Prisma.CardWhereInput {
  const where: Prisma.CardWhereInput = { ownerId: userId };
  if (filter?.type) where.type = mapCardType(filter.type);
  if (filter?.done !== undefined) where.done = filter.done;
  if (filter?.workspaceId !== undefined) where.workspaceId = filter.workspaceId ?? null;
  if (filter?.columnId !== undefined) where.columnId = filter.columnId ?? null;
  if (filter?.search) {
    const term = filter.search.trim();
    where.OR = [{ title: { contains: term } }];
  }
  return where;
}

function buildSearchRawConditions(
  userId: string,
  term: string,
  filter: CardFilter | undefined
): ReturnType<typeof Prisma.sql>[] {
  const likePattern = '%' + term.replace(/[%_\\]/g, '\\$&') + '%';
  const conditions: ReturnType<typeof Prisma.sql>[] = [
    Prisma.sql`c.ownerId = ${userId}`,
    Prisma.sql`(c.title LIKE ${likePattern} OR JSON_SEARCH(c.tags, 'one', ${likePattern}) IS NOT NULL)`,
  ];
  if (filter?.type) conditions.push(Prisma.sql`c.type = ${mapCardType(filter.type)}`);
  if (filter?.done !== undefined) conditions.push(Prisma.sql`c.done = ${filter.done}`);
  if (filter?.workspaceId !== undefined)
    conditions.push(Prisma.sql`c.workspaceId <=> ${filter.workspaceId ?? null}`);
  if (filter?.columnId !== undefined)
    conditions.push(Prisma.sql`c.columnId <=> ${filter.columnId ?? null}`);
  return conditions;
}

/** Поиск по title ИЛИ по тегам (MySQL JSON_CONTAINS). Используется когда передан filter.search. */
async function cardsSearchRaw(
  prisma: Context['prisma'],
  userId: string,
  term: string,
  filter: CardFilter | undefined,
  orderDir: 'asc' | 'desc',
  take: number,
  skip: number
): Promise<unknown[]> {
  const conditions = buildSearchRawConditions(userId, term, filter);
  const order = orderDir === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`;
  return prisma.$queryRaw`
    SELECT c.* FROM Card c
    WHERE ${Prisma.join(conditions, ' AND ')}
    ORDER BY c.createdAt ${order}
    LIMIT ${take} OFFSET ${skip}
  `;
}

async function cardsCountSearchRaw(
  prisma: Context['prisma'],
  userId: string,
  term: string,
  filter: CardFilter | undefined
): Promise<number> {
  const conditions = buildSearchRawConditions(userId, term, filter);
  const rows = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM Card c
    WHERE ${Prisma.join(conditions, ' AND ')}
  `;
  return Number(rows[0]?.count ?? 0);
}

export const cardResolvers = {
  Query: {
    cards: async (
      _: unknown,
      {
        filter,
        limit,
        offset,
        sortOrder,
      }: {
        filter?: CardFilter;
        limit?: number;
        offset?: number;
        sortOrder?: string;
      },
      context: Context
    ) => {
      if (!context.user) throw UnauthenticatedError();
      const term = filter?.search?.trim();
      if (term) {
        const orderDir = sortOrder === 'createdAt_ASC' ? 'asc' : 'desc';
        const take = Math.min(Math.max(0, limit ?? 10000), 10000);
        const skip = Math.max(0, offset ?? 0);
        return cardsSearchRaw(
          context.prisma,
          context.user.id,
          term,
          filter,
          orderDir,
          take,
          skip
        ) as Promise<Awaited<ReturnType<Context['prisma']['card']['findMany']>>>;
      }
      const where = buildCardsWhere(filter, context.user.id);
      const createdAtOrder = sortOrder === 'createdAt_ASC' ? 'asc' : 'desc';
      const orderBy =
        limit != null
          ? [{ createdAt: createdAtOrder }]
          : [{ columnId: 'asc' }, { order: 'asc' }, { createdAt: 'desc' }];
      const take = limit != null ? Math.min(Math.max(0, limit), 100) : undefined;
      const skip = offset != null ? Math.max(0, offset) : undefined;
      return context.prisma.card.findMany({
        where,
        orderBy,
        ...(take != null && { take }),
        ...(skip != null && { skip }),
      });
    },

    cardsCount: async (_: unknown, { filter }: { filter?: CardFilter }, context: Context) => {
      if (!context.user) throw UnauthenticatedError();
      const term = filter?.search?.trim();
      if (term)
        return cardsCountSearchRaw(context.prisma, context.user.id, term, filter);
      const where = buildCardsWhere(filter, context.user.id);
      return context.prisma.card.count({ where });
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
      if (input.title && input.title.length > MAX_TITLE_LENGTH) {
        throw BadRequestError(`Название слишком длинное (макс. ${MAX_TITLE_LENGTH} символов)`);
      }

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
      if (input.title && input.title.length > MAX_TITLE_LENGTH) {
        throw BadRequestError(`Название слишком длинное (макс. ${MAX_TITLE_LENGTH} символов)`);
      }
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
      { id, columnId, order: newOrder }: { id: string; columnId: string | null; order: number },
      context: Context
    ) => {
      if (!context.user) throw UnauthenticatedError();
      const card = await context.prisma.card.findUnique({ where: { id } });
      if (!card || card.ownerId !== context.user.id) throw NotFoundError('Card not found');

      let workspaceId: string | null;
      if (columnId) {
        const col = await context.prisma.column.findUnique({
          where: { id: columnId },
          include: { workspace: true },
        });
        if (!col || col.workspace.ownerId !== context.user.id) throw NotFoundError('Column not found');
        workspaceId = col.workspaceId;
      } else {
        // Перемещение в беклог: оставляем карточку в том же воркспейсе (workspaceId не трогаем)
        workspaceId = card.workspaceId;
      }

      await context.prisma.card.update({
        where: { id },
        data: { columnId, workspaceId, order: newOrder },
      });

      if (columnId) {
        const inColumn = await context.prisma.card.findMany({
          where: { columnId },
          orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        });
        const fromIdx = inColumn.findIndex((c: { id: string }) => c.id === id);
        const ordered: typeof inColumn =
          fromIdx === -1
            ? inColumn
            : (() => {
                const list = inColumn.slice();
                const [moved] = list.splice(fromIdx, 1);
                list.splice(Math.min(newOrder, list.length), 0, moved);
                return list;
              })();
        await Promise.all(
          ordered.map((c: { id: string }, index: number) =>
            context.prisma.card.update({ where: { id: c.id }, data: { order: index } })
          )
        );
      } else if (workspaceId) {
        const inBacklog = await context.prisma.card.findMany({
          where: { workspaceId, columnId: null },
          orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        });
        const fromIdx = inBacklog.findIndex((c: { id: string }) => c.id === id);
        const ordered: typeof inBacklog =
          fromIdx === -1
            ? inBacklog
            : (() => {
                const list = inBacklog.slice();
                const [moved] = list.splice(fromIdx, 1);
                list.splice(Math.min(newOrder, list.length), 0, moved);
                return list;
              })();
        await Promise.all(
          ordered.map((c: { id: string }, index: number) =>
            context.prisma.card.update({ where: { id: c.id }, data: { order: index } })
          )
        );
      }

      return context.prisma.card.findUniqueOrThrow({ where: { id } });
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

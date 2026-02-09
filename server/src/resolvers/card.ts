import { Prisma, $Enums } from '@prisma/client';
import { 
  UnauthenticatedError, 
  NotFoundError, 
  BadRequestError 
} from '../lib/errors.js';
import { 
  MAX_TITLE_LENGTH, 
  MAX_CARDS_PER_USER 
} from '../lib/constants.js';
import type { 
  QueryCardsArgs, 
  QueryCardsCountArgs,
  QueryCardArgs,
  MutationCreateCardArgs, 
  MutationUpdateCardArgs, 
  MutationDeleteCardArgs,
  MutationMoveCardArgs,
  CardFilter,
  LearningStatus
} from '../generated/types.js';
import type { Context } from '../lib/types.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildCardsWhere(filter: CardFilter | null | undefined, userId: string): Prisma.CardWhereInput {
  const where: Prisma.CardWhereInput = { ownerId: userId };
  
  if (filter?.type) {
    where.type = filter.type as $Enums.CardType;
  }
  
  if (filter?.done != null) {
    where.done = filter.done;
  }
  
  if (filter?.workspaceId !== undefined) {
    where.workspaceId = filter.workspaceId ?? null;
  }
  
  if (filter?.columnId !== undefined) {
    where.columnId = filter.columnId ?? null;
  }
  
  if (filter?.learningStatus != null) {
    where.learningStatus = filter.learningStatus as $Enums.LearningStatus;
  } else if (filter?.learningStatus === null) {
    where.learningStatus = null;
  }

  if (filter?.search) {
    const term = filter.search.trim();
    where.OR = [{ title: { contains: term } }];
  }
  
  return where;
}

function buildSearchRawConditions(filter: CardFilter | null | undefined, userId: string): Prisma.Sql[] {
  const likePattern = filter?.search ? `%${filter.search.trim()}%` : '%';
  const conditions = [
    Prisma.sql`c.ownerId = ${userId}`,
    Prisma.sql`(c.title LIKE ${likePattern} OR JSON_SEARCH(c.tags, 'one', ${likePattern}) IS NOT NULL)`,
  ];
  
  if (filter?.type) {
    conditions.push(Prisma.sql`c.type = ${filter.type}`);
  }
  
  if (filter?.done !== undefined && filter?.done !== null) {
    conditions.push(Prisma.sql`c.done = ${filter.done}`);
  }
  
  if (filter?.workspaceId !== undefined) {
    conditions.push(Prisma.sql`c.workspaceId <=> ${filter.workspaceId ?? null}`);
  }
  
  if (filter?.columnId !== undefined) {
    conditions.push(Prisma.sql`c.columnId <=> ${filter.columnId ?? null}`);
  }
  
  if (filter?.learningStatus) {
    conditions.push(Prisma.sql`c.learning_status = ${filter.learningStatus}`);
  }
  
  return conditions;
}

export const cardResolvers = {
  Query: {
    cards: async (
      _: unknown,
      { filter, limit, offset, sortOrder }: QueryCardsArgs,
      context: Context
    ) => {
      if (!context.user) throw UnauthenticatedError();
      const userId = context.user.id;

      if (filter?.search) {
        const conditions = buildSearchRawConditions(filter, userId);
        const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;
        
        let orderByClause = Prisma.sql`ORDER BY c.createdAt DESC`;
        if (sortOrder === 'createdAt_ASC') orderByClause = Prisma.sql`ORDER BY c.createdAt ASC`;

        const limitClause = limit ? Prisma.sql`LIMIT ${limit}` : Prisma.empty;
        const offsetClause = offset ? Prisma.sql`OFFSET ${offset}` : Prisma.empty;

        return context.prisma.$queryRaw<any[]>`
          SELECT c.* FROM Card c
          ${whereClause}
          ${orderByClause}
          ${limitClause}
          ${offsetClause}
        `;
      }

      return context.prisma.card.findMany({
        where: buildCardsWhere(filter, userId),
        take: limit ?? undefined,
        skip: offset ?? undefined,
        orderBy: sortOrder === 'createdAt_ASC' ? { createdAt: 'asc' } : { createdAt: 'desc' },
      });
    },

    cardsCount: async (
      _: unknown,
      { filter }: QueryCardsCountArgs,
      context: Context
    ) => {
      if (!context.user) throw UnauthenticatedError();
      const userId = context.user.id;

      if (filter?.search) {
        const conditions = buildSearchRawConditions(filter, userId);
        const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;
        
        const result = await context.prisma.$queryRaw<{ count: bigint }[]>`
          SELECT COUNT(*) as count FROM Card c
          ${whereClause}
        `;
        return Number(result[0].count);
      }

      return context.prisma.card.count({
        where: buildCardsWhere(filter, userId),
      });
    },

    card: async (_: unknown, { id }: QueryCardArgs, context: Context) => {
      if (!context.user) throw UnauthenticatedError();
      const card = await context.prisma.card.findUnique({ where: { id } });
      if (!card || card.ownerId !== context.user.id) throw NotFoundError('Card not found');
      return card;
    },
  },

  Mutation: {
    createCard: async (
      _: unknown,
      { input }: MutationCreateCardArgs,
      context: Context
    ) => {
      if (!context.user) throw UnauthenticatedError();
      if (input.title && input.title.length > MAX_TITLE_LENGTH) {
        throw BadRequestError(`Название слишком длинное (макс. ${MAX_TITLE_LENGTH} символов)`);
      }

      // Check card limit per user
      const cardCount = await context.prisma.card.count({
        where: { ownerId: context.user.id },
      });
      if (cardCount >= MAX_CARDS_PER_USER) {
        throw BadRequestError(`Максимум ${MAX_CARDS_PER_USER} карточек на аккаунт`);
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
        columnId = input.columnId;
      }

      const { title, tags, type, learningStatus } = input;
      const payload = input.payload ?? '{}';
      const tagsJson = tags ? (tags as Prisma.InputJsonValue) : [];

      // Calculate next order: append at the end of the target container
      const siblingCount = await context.prisma.card.count({
        where: columnId
          ? { columnId }
          : workspaceId
            ? { workspaceId, columnId: null }
            : { ownerId: context.user.id, workspaceId: null, columnId: null },
      });

      const data: Prisma.CardUncheckedCreateInput = {
        ownerId: context.user.id,
        type: type as $Enums.CardType,
        title,
        workspaceId,
        columnId,
        order: siblingCount,
        payload,
        tags: tagsJson,
        learningStatus: learningStatus as $Enums.LearningStatus | null,
      };

      return context.prisma.card.create({ data });
    },

    updateCard: async (
      _: unknown,
      { id, input }: MutationUpdateCardArgs,
      context: Context
    ) => {
      if (!context.user) throw UnauthenticatedError();
      if (input.title && input.title.length > MAX_TITLE_LENGTH) {
        throw BadRequestError(`Название слишком длинное (макс. ${MAX_TITLE_LENGTH} символов)`);
      }

      const card = await context.prisma.card.findUnique({ where: { id } });
      if (!card || card.ownerId !== context.user.id) throw NotFoundError('Card not found');

      const data: Prisma.CardUncheckedUpdateInput = {};
      if (input.title !== undefined) data.title = input.title;
      if (input.done != null) data.done = input.done;
      if (input.payload !== undefined) data.payload = input.payload ?? '{}';
      if (input.columnId !== undefined) {
        if (input.columnId) {
          const col = await context.prisma.column.findUnique({
            where: { id: input.columnId },
            include: { workspace: true },
          });
          if (!col || col.workspace.ownerId !== context.user.id) throw NotFoundError('Column not found');
          data.columnId = input.columnId;
          data.workspaceId = col.workspaceId;
        } else {
          data.columnId = null;
        }
      }
      if (input.order !== undefined) data.order = input.order;
      if (input.tags !== undefined) data.tags = input.tags as Prisma.InputJsonValue;
      if (input.learningStatus !== undefined) {
        data.learningStatus = input.learningStatus as $Enums.LearningStatus | null;
      }

      return context.prisma.card.update({ where: { id }, data });
    },

    deleteCard: async (_: unknown, { id }: MutationDeleteCardArgs, context: Context) => {
      if (!context.user) throw UnauthenticatedError();
      const card = await context.prisma.card.findUnique({ where: { id } });
      if (!card || card.ownerId !== context.user.id) throw NotFoundError('Card not found');
      await context.prisma.card.delete({ where: { id } });

      // Reorder remaining siblings to fill the gap
      const siblings = await context.prisma.card.findMany({
        where: card.columnId
          ? { columnId: card.columnId }
          : { workspaceId: card.workspaceId, columnId: null },
        orderBy: { order: 'asc' },
      });
      for (let i = 0; i < siblings.length; i++) {
        if (siblings[i].order !== i) {
          await context.prisma.card.update({
            where: { id: siblings[i].id },
            data: { order: i },
          });
        }
      }

      return true;
    },

    moveCard: async (_: unknown, { id, columnId, order }: MutationMoveCardArgs, context: Context) => {
      if (!context.user) throw UnauthenticatedError();
      const card = await context.prisma.card.findUnique({ where: { id } });
      if (!card || card.ownerId !== context.user.id) throw NotFoundError('Card not found');

      // Determine target columnId and workspaceId
      let targetColumnId: string | null = card.columnId;
      let targetWorkspaceId: string | null = card.workspaceId;
      if (columnId !== undefined) {
        if (columnId) {
          const col = await context.prisma.column.findUnique({
            where: { id: columnId },
            include: { workspace: true },
          });
          if (!col || col.workspace.ownerId !== context.user.id) throw NotFoundError('Column not found');
          targetColumnId = columnId;
          targetWorkspaceId = col.workspaceId;
        } else {
          targetColumnId = null;
        }
      }

      const oldColumnId = card.columnId;
      const oldWorkspaceId = card.workspaceId;

      // Reorder siblings in source container (if moving to a different container)
      const movingContainers = oldColumnId !== targetColumnId;
      if (movingContainers) {
        // Remove from old container — shift siblings down
        const oldSiblings = await context.prisma.card.findMany({
          where: oldColumnId
            ? { columnId: oldColumnId, id: { not: id } }
            : { workspaceId: oldWorkspaceId, columnId: null, id: { not: id } },
          orderBy: { order: 'asc' },
        });
        for (let i = 0; i < oldSiblings.length; i++) {
          if (oldSiblings[i].order !== i) {
            await context.prisma.card.update({
              where: { id: oldSiblings[i].id },
              data: { order: i },
            });
          }
        }
      }

      // Get siblings in target container (excluding the moved card)
      const targetSiblings = await context.prisma.card.findMany({
        where: targetColumnId
          ? { columnId: targetColumnId, id: { not: id } }
          : { workspaceId: targetWorkspaceId, columnId: null, id: { not: id } },
        orderBy: { order: 'asc' },
      });

      // Clamp order
      const clampedOrder = Math.min(order, targetSiblings.length);

      // Insert card at new position and reorder all siblings
      const reordered = [...targetSiblings];
      // We'll insert a placeholder; update all orders after
      reordered.splice(clampedOrder, 0, card); // card as placeholder for position

      for (let i = 0; i < reordered.length; i++) {
        if (reordered[i].id === id) continue; // skip the moved card itself
        if (reordered[i].order !== i) {
          await context.prisma.card.update({
            where: { id: reordered[i].id },
            data: { order: i },
          });
        }
      }

      // Update the moved card with final order and column
      return context.prisma.card.update({
        where: { id },
        data: {
          order: clampedOrder,
          columnId: targetColumnId,
          ...(targetColumnId ? { workspaceId: targetWorkspaceId } : {}),
        },
      });
    },
  },

  Card: {
    owner: async (parent: any, _: unknown, context: Context) => {
      return context.loaders.userById.load(parent.ownerId);
    },
    workspace: async (parent: any, _: unknown, context: Context) => {
      if (!parent.workspaceId) return null;
      return context.loaders.workspaceById.load(parent.workspaceId);
    },
    column: async (parent: any, _: unknown, context: Context) => {
      if (!parent.columnId) return null;
      const columns = await context.loaders.columnsByWorkspaceId.load(parent.workspaceId);
      return columns.find((c) => c.id === parent.columnId) || null;
    },
    learningStatus: (parent: any) => {
      return (parent.learningStatus as LearningStatus) || null;
    },
    payload: (parent: any) => {
      return typeof parent.payload === 'string'
        ? parent.payload
        : JSON.stringify(parent.payload);
    },
  },
};

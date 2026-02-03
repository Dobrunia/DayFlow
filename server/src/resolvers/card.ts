import type { Context } from '../lib/context.js';
import type { CardType, ItemType, Prisma } from '@prisma/client';

export interface ChecklistItemInput {
  id: string;
  text: string;
  checked: boolean;
}

export interface CreateCardInput {
  title: string;
  cardType: string;
  videoUrl?: string;
  noteContent?: string;
  checklistItems?: ChecklistItemInput[];
}

export interface UpdateCardInput {
  title?: string;
  checked?: boolean;
  videoUrl?: string;
  videoPreview?: string;
  videoDuration?: number;
  videoSource?: string;
  noteContent?: string;
  checklistItems?: ChecklistItemInput[];
}

// Map GraphQL enum to Prisma enum
function mapCardType(type: string): CardType {
  const typeMap: Record<string, CardType> = {
    VIDEO: 'video',
    NOTE: 'note',
    CHECKLIST: 'checklist',
  };
  return typeMap[type] ?? 'note';
}

function cardTypeToItemType(cardType: CardType): ItemType {
  const map: Record<CardType, ItemType> = {
    video: 'video',
    note: 'note',
    checklist: 'task',
  };
  return map[cardType];
}

function itemTypeToCardType(itemType: ItemType): CardType {
  const map: Record<ItemType, CardType> = {
    note: 'note',
    link: 'note',
    video: 'video',
    repo: 'note',
    task: 'checklist',
  };
  return map[itemType] ?? 'note';
}

export const cardResolvers = {
  Mutation: {
    createCard: async (
      _: unknown,
      { columnId, input }: { columnId: string; input: CreateCardInput },
      context: Context
    ) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      // Get column and verify ownership
      const column = await context.prisma.column.findUnique({
        where: { id: columnId },
        include: { workspace: true },
      });

      if (!column || column.workspace.ownerId !== context.user.id) {
        throw new Error('Column not found');
      }

      const cardType = mapCardType(input.cardType);

      // Get max order for cards in this column
      const maxOrder = await context.prisma.card.aggregate({
        where: { columnId },
        _max: { order: true },
      });

      const newOrder = (maxOrder._max.order ?? -1) + 1;

      // Create Item and Card in a transaction
      const result = await context.prisma.$transaction(async (tx) => {
        // Create associated Item
        const item = await tx.item.create({
          data: {
            title: input.title,
            type: cardTypeToItemType(cardType),
            url: input.videoUrl,
            content: input.noteContent,
            workspaceId: column.workspaceId,
            userId: context.user!.id,
          },
        });

        // Create Card
        const card = await tx.card.create({
          data: {
            title: input.title,
            cardType,
            order: newOrder,
            columnId,
            itemId: item.id,
            videoUrl: input.videoUrl,
            noteContent: input.noteContent,
            checklistItems: (input.checklistItems ?? []) as unknown as Prisma.InputJsonValue,
          },
        });

        return card;
      });

      return result;
    },

    updateCard: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateCardInput },
      context: Context
    ) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const card = await context.prisma.card.findUnique({
        where: { id },
        include: { column: { include: { workspace: true } } },
      });

      if (!card || card.column.workspace.ownerId !== context.user.id) {
        throw new Error('Card not found');
      }

      return context.prisma.card.update({
        where: { id },
        data: {
          title: input.title ?? undefined,
          checked: input.checked ?? undefined,
          videoUrl: input.videoUrl,
          videoPreview: input.videoPreview,
          videoDuration: input.videoDuration,
          videoSource: input.videoSource,
          noteContent: input.noteContent,
          checklistItems: (input.checklistItems ?? undefined) as unknown as
            | Prisma.InputJsonValue
            | undefined,
        },
      });
    },

    deleteCard: async (_: unknown, { id }: { id: string }, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const card = await context.prisma.card.findUnique({
        where: { id },
        include: { column: { include: { workspace: true } } },
      });

      if (!card || card.column.workspace.ownerId !== context.user.id) {
        throw new Error('Card not found');
      }

      // Delete card (Item will be deleted via cascade or kept for Library)
      await context.prisma.card.delete({
        where: { id },
      });

      return true;
    },

    addItemToColumn: async (
      _: unknown,
      { itemId, columnId }: { itemId: string; columnId: string },
      context: Context
    ) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const item = await context.prisma.item.findUnique({
        where: { id: itemId },
        include: { card: true },
      });

      if (!item || item.userId !== context.user.id || !item.workspaceId || item.card !== null) {
        throw new Error('Item not found or already in a column');
      }

      const column = await context.prisma.column.findUnique({
        where: { id: columnId },
        include: { workspace: true },
      });

      if (
        !column ||
        column.workspace.ownerId !== context.user.id ||
        column.workspaceId !== item.workspaceId
      ) {
        throw new Error('Column not found');
      }

      const maxOrder = await context.prisma.card.aggregate({
        where: { columnId },
        _max: { order: true },
      });
      const newOrder = (maxOrder._max.order ?? -1) + 1;

      const cardType = itemTypeToCardType(item.type);
      const meta = item.meta as {
        checklistItems?: { id: string; text: string; checked: boolean }[];
      } | null;
      const checklistItems = (item.type === 'task' && meta?.checklistItems) || [];

      return context.prisma.card.create({
        data: {
          title: item.title,
          cardType,
          order: newOrder,
          columnId,
          itemId: item.id,
          videoUrl: item.type === 'video' ? item.url : null,
          noteContent: item.type === 'note' ? item.content : null,
          checklistItems: checklistItems as unknown as Prisma.InputJsonValue,
        },
      });
    },

    toggleCardChecked: async (_: unknown, { id }: { id: string }, context: Context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const card = await context.prisma.card.findUnique({
        where: { id },
        include: { column: { include: { workspace: true } } },
      });

      if (!card || card.column.workspace.ownerId !== context.user.id) {
        throw new Error('Card not found');
      }

      return context.prisma.card.update({
        where: { id },
        data: { checked: !card.checked },
      });
    },

    moveCard: async (
      _: unknown,
      { id, columnId, order }: { id: string; columnId: string; order: number },
      context: Context
    ) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const card = await context.prisma.card.findUnique({
        where: { id },
        include: { column: { include: { workspace: true } } },
      });

      if (!card || card.column.workspace.ownerId !== context.user.id) {
        throw new Error('Card not found');
      }

      // Verify target column belongs to same workspace
      const targetColumn = await context.prisma.column.findUnique({
        where: { id: columnId },
      });

      if (!targetColumn || targetColumn.workspaceId !== card.column.workspaceId) {
        throw new Error('Invalid target column');
      }

      // Update card position
      return context.prisma.card.update({
        where: { id },
        data: {
          columnId,
          order,
        },
      });
    },
  },

  Card: {
    cardType: (parent: { cardType: CardType }) => {
      return parent.cardType.toUpperCase();
    },

    column: async (parent: { columnId: string }, _: unknown, context: Context) => {
      return context.prisma.column.findUnique({
        where: { id: parent.columnId },
      });
    },

    item: async (parent: { itemId: string }, _: unknown, context: Context) => {
      return context.loaders.itemById.load(parent.itemId);
    },

    checklistItems: (parent: { checklistItems: unknown }) => {
      if (!parent.checklistItems) return null;
      if (Array.isArray(parent.checklistItems)) {
        return parent.checklistItems;
      }
      return [];
    },
  },
};

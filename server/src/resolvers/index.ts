import { authResolvers } from './auth.js';
import { workspaceResolvers } from './workspace.js';
import { columnResolvers } from './column.js';
import { itemResolvers } from './item.js';
import { cardResolvers } from './card.js';
import { DateTimeResolver } from 'graphql-scalars';

export type { CreateCardInput, UpdateCardInput, ChecklistItemInput } from './card.js';
export type { CreateItemInput, UpdateItemInput, LibraryFilter } from './item.js';
export type { CreateWorkspaceInput, UpdateWorkspaceInput } from './workspace.js';

export const resolvers = {
  DateTime: DateTimeResolver,

  Query: {
    ...authResolvers.Query,
    ...workspaceResolvers.Query,
    ...itemResolvers.Query,
  },

  Mutation: {
    ...authResolvers.Mutation,
    ...workspaceResolvers.Mutation,
    ...columnResolvers.Mutation,
    ...itemResolvers.Mutation,
    ...cardResolvers.Mutation,
  },

  User: {
    workspaces: async (
      parent: { id: string },
      _: unknown,
      context: {
        prisma: {
          workspace: {
            findMany: (arg0: {
              where: { ownerId: string };
              orderBy: { createdAt: string };
            }) => unknown;
          };
        };
      }
    ) => {
      return context.prisma.workspace.findMany({
        where: { ownerId: parent.id },
        orderBy: { createdAt: 'desc' },
      });
    },
  },

  Workspace: workspaceResolvers.Workspace,
  Column: columnResolvers.Column,
  Item: itemResolvers.Item,
  Card: cardResolvers.Card,
};

import { authResolvers } from './auth.js';
import { workspaceResolvers } from './workspace.js';
import { columnResolvers } from './column.js';
import { cardResolvers } from './card.js';
import { toolResolvers } from './tool.js';
import { userStatsResolvers } from './user-stats.js';
import { DateTimeResolver } from 'graphql-scalars';

export type { CreateCardInput, UpdateCardInput, CardFilter, CreateWorkspaceInput, UpdateWorkspaceInput } from 'dayflow-shared';

export const resolvers = {
  DateTime: DateTimeResolver,

  Query: {
    ...authResolvers.Query,
    ...workspaceResolvers.Query,
    ...cardResolvers.Query,
    ...userStatsResolvers.Query,
    ...toolResolvers.Query,
  },

  Mutation: {
    ...authResolvers.Mutation,
    ...workspaceResolvers.Mutation,
    ...columnResolvers.Mutation,
    ...cardResolvers.Mutation,
    ...toolResolvers.Mutation,
  },

  User: {
    workspaces: (
      parent: { id: string },
      _: unknown,
      context: { prisma: { workspace: { findMany: (arg: object) => unknown } } }
    ) =>
      context.prisma.workspace.findMany({
        where: { ownerId: parent.id },
        orderBy: { createdAt: 'desc' },
      }),
  },

  Workspace: workspaceResolvers.Workspace,
  Column: columnResolvers.Column,
  Card: cardResolvers.Card,
  Tool: toolResolvers.Tool,
};

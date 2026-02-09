import { Prisma } from '@prisma/client';
import type { Context } from '../lib/types.js';
import type {
  MutationCreateToolArgs,
  MutationUpdateToolArgs,
  MutationDeleteToolArgs,
  QueryToolsArgs,
} from '../generated/types.js';
import { UnauthenticatedError, NotFoundError, ForbiddenError, BadRequestError } from '../lib/errors.js';
import { MAX_TOOLS_PER_WORKSPACE } from '../lib/constants.js';

export const toolResolvers = {
  Query: {
    tools: async (_: unknown, { workspaceId }: QueryToolsArgs, context: Context) => {
      if (!context.user) throw UnauthenticatedError();

      return context.prisma.tool.findMany({
        where: {
          ownerId: context.user.id,
          workspaceId: workspaceId || null,
        },
        orderBy: { createdAt: 'desc' },
      });
    },
  },

  Mutation: {
    createTool: async (_: unknown, { input }: MutationCreateToolArgs, context: Context) => {
      if (!context.user) throw UnauthenticatedError();

      if (input.workspaceId) {
        const workspace = await context.prisma.workspace.findUnique({
          where: { id: input.workspaceId },
        });
        if (!workspace) throw NotFoundError('Workspace not found');
        if (workspace.ownerId !== context.user.id) throw ForbiddenError('Not authorized');
      }

      // Check tool limit
      const toolCount = await context.prisma.tool.count({
        where: {
          ownerId: context.user.id,
          workspaceId: input.workspaceId || null,
        },
      });

      if (toolCount >= MAX_TOOLS_PER_WORKSPACE) {
        throw BadRequestError(`Максимум ${MAX_TOOLS_PER_WORKSPACE} инструментов в этом пространстве`);
      }

      return context.prisma.tool.create({
        data: {
          title: input.title,
          link: input.link,
          description: input.description,
          icon: input.icon,
          tags: input.tags || [],
          ownerId: context.user.id,
          workspaceId: input.workspaceId || null,
        },
      });
    },

    updateTool: async (_: unknown, { id, input }: MutationUpdateToolArgs, context: Context) => {
      if (!context.user) throw UnauthenticatedError();

      const tool = await context.prisma.tool.findUnique({ where: { id } });
      if (!tool) throw NotFoundError('Tool not found');
      if (tool.ownerId !== context.user.id) throw ForbiddenError('Not authorized');

      const data: Prisma.ToolUpdateInput = {};
      if (input.title !== undefined) data.title = input.title ?? undefined;
      if (input.link !== undefined) data.link = input.link;
      if (input.description !== undefined) data.description = input.description;
      if (input.icon !== undefined) data.icon = input.icon;
      if (input.tags !== undefined) data.tags = input.tags ?? undefined;

      return context.prisma.tool.update({
        where: { id },
        data,
      });
    },

    deleteTool: async (_: unknown, { id }: MutationDeleteToolArgs, context: Context) => {
      if (!context.user) throw UnauthenticatedError();

      const tool = await context.prisma.tool.findUnique({ where: { id } });
      if (!tool) throw NotFoundError('Tool not found');
      if (tool.ownerId !== context.user.id) throw ForbiddenError('Not authorized');

      await context.prisma.tool.delete({ where: { id } });
      return true;
    },
  },

  Tool: {
    owner: (parent: { ownerId: string }, _: unknown, context: Context) =>
      context.prisma.user.findUnique({ where: { id: parent.ownerId } }),
    workspace: (parent: { workspaceId: string | null }, _: unknown, context: Context) =>
      parent.workspaceId
        ? context.prisma.workspace.findUnique({ where: { id: parent.workspaceId } })
        : null,
  }
};

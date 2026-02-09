import type { Context } from '../lib/context.js';
import { UnauthenticatedError, NotFoundError, ForbiddenError, BadRequestError } from '../lib/errors.js';
import { MAX_TOOLS_PER_WORKSPACE } from '../lib/constants.js';

export interface CreateToolInput {
  workspaceId?: string;
  title: string;
  link?: string;
  description?: string;
  icon?: string;
  tags?: string[];
}

export interface UpdateToolInput {
  title?: string;
  link?: string;
  description?: string;
  icon?: string;
  tags?: string[];
}

export const toolResolvers = {
  Query: {
    tools: async (_: any, { workspaceId }: { workspaceId?: string | null }, context: Context) => {
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
    createTool: async (_: any, { input }: { input: CreateToolInput }, context: Context) => {
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

    updateTool: async (_: any, { id, input }: { id: string; input: UpdateToolInput }, context: Context) => {
      if (!context.user) throw UnauthenticatedError();

      const tool = await context.prisma.tool.findUnique({ where: { id } });
      if (!tool) throw NotFoundError('Tool not found');
      if (tool.ownerId !== context.user.id) throw ForbiddenError('Not authorized');

      return context.prisma.tool.update({
        where: { id },
        data: {
          ...input,
        },
      });
    },

    deleteTool: async (_: any, { id }: { id: string }, context: Context) => {
      if (!context.user) throw UnauthenticatedError();

      const tool = await context.prisma.tool.findUnique({ where: { id } });
      if (!tool) throw NotFoundError('Tool not found');
      if (tool.ownerId !== context.user.id) throw ForbiddenError('Not authorized');

      await context.prisma.tool.delete({ where: { id } });
      return true;
    },
  },

  Tool: {
    owner: (parent: any, _: any, context: Context) => {
      return context.prisma.user.findUnique({ where: { id: parent.ownerId } });
    },
    workspace: (parent: any, _: any, context: Context) => {
      if (!parent.workspaceId) return null;
      return context.prisma.workspace.findUnique({ where: { id: parent.workspaceId } });
    },
  }
};

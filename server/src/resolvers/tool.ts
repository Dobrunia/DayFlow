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
import { hasWorkspaceAccess } from '../lib/workspace-access.js';

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

    allTools: async (_: unknown, __: unknown, context: Context) => {
      if (!context.user) throw UnauthenticatedError();

      return context.prisma.tool.findMany({
        where: { ownerId: context.user.id },
        orderBy: { createdAt: 'desc' },
        include: { workspace: { select: { id: true, title: true, icon: true } } },
      });
    },
  },

  Mutation: {
    createTool: async (_: unknown, { input }: MutationCreateToolArgs, context: Context) => {
      if (!context.user) throw UnauthenticatedError();

      if (input.workspaceId) {
        if (!(await hasWorkspaceAccess(context.prisma, input.workspaceId, context.user.id))) {
          throw NotFoundError('Рабочее пространство не найдено');
        }
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
      if (!tool) throw NotFoundError('Инструмент не найден');
      if (tool.ownerId !== context.user.id) {
        if (!tool.workspaceId || !(await hasWorkspaceAccess(context.prisma, tool.workspaceId, context.user.id))) {
          throw ForbiddenError('Нет доступа');
        }
      }
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
      if (!tool) throw NotFoundError('Инструмент не найден');
      if (tool.ownerId !== context.user.id) {
        if (!tool.workspaceId || !(await hasWorkspaceAccess(context.prisma, tool.workspaceId, context.user.id))) {
          throw ForbiddenError('Нет доступа');
        }
      }
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

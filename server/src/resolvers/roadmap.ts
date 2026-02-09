import type { Context } from '../lib/types.js';
import type {
  QueryRoadmapArgs,
  MutationCreateRoadmapArgs,
  MutationDeleteRoadmapArgs,
  MutationCreateRoadmapNodeArgs,
  MutationUpdateRoadmapNodeArgs,
  MutationDeleteRoadmapNodeArgs,
  MutationReorderRoadmapNodesArgs,
} from '../generated/types.js';
import { UnauthenticatedError, NotFoundError, BadRequestError } from '../lib/errors.js';
import { LIMITS } from 'dayflow-shared';

export const roadmapResolvers = {
  Query: {
    roadmap: async (_: unknown, { workspaceId }: QueryRoadmapArgs, context: Context) => {
      if (!context.user) throw UnauthenticatedError();
      const workspace = await context.prisma.workspace.findUnique({ where: { id: workspaceId } });
      if (workspace?.ownerId !== context.user.id) throw NotFoundError('Рабочее пространство не найдено');
      return context.prisma.roadmap.findUnique({ where: { workspaceId } });
    },
  },

  Mutation: {
    createRoadmap: async (
      _: unknown,
      { workspaceId, title, sourceText }: MutationCreateRoadmapArgs,
      context: Context,
    ) => {
      if (!context.user) throw UnauthenticatedError();
      const workspace = await context.prisma.workspace.findUnique({ where: { id: workspaceId } });
      if (workspace?.ownerId !== context.user.id) throw NotFoundError('Рабочее пространство не найдено');

      const existing = await context.prisma.roadmap.findUnique({ where: { workspaceId } });
      if (existing) throw BadRequestError('Роадмап для этого воркспейса уже существует');

      return context.prisma.roadmap.create({
        data: {
          title,
          sourceText: sourceText ?? null,
          ownerId: context.user.id,
          workspaceId,
        },
      });
    },

    deleteRoadmap: async (_: unknown, { id }: MutationDeleteRoadmapArgs, context: Context) => {
      if (!context.user) throw UnauthenticatedError();
      const roadmap = await context.prisma.roadmap.findUnique({ where: { id } });
      if (roadmap?.ownerId !== context.user.id) throw NotFoundError('Роадмап не найден');
      await context.prisma.roadmap.delete({ where: { id } });
      return true;
    },

    createRoadmapNode: async (
      _: unknown,
      { roadmapId, parentId, title }: MutationCreateRoadmapNodeArgs,
      context: Context,
    ) => {
      if (!context.user) throw UnauthenticatedError();
      const roadmap = await context.prisma.roadmap.findUnique({ where: { id: roadmapId } });
      if (roadmap?.ownerId !== context.user.id) throw NotFoundError('Роадмап не найден');

      const totalNodes = await context.prisma.roadmapNode.count({ where: { roadmapId } });
      if (totalNodes >= LIMITS.MAX_ROADMAP_NODES) {
        throw BadRequestError(`Максимум ${LIMITS.MAX_ROADMAP_NODES} узлов в роадмапе`);
      }

      const siblingCount = await context.prisma.roadmapNode.count({
        where: { roadmapId, parentId: parentId ?? null },
      });

      return context.prisma.roadmapNode.create({
        data: {
          roadmapId,
          parentId: parentId ?? null,
          title,
          order: siblingCount,
        },
      });
    },

    updateRoadmapNode: async (
      _: unknown,
      { id, title, done }: MutationUpdateRoadmapNodeArgs,
      context: Context,
    ) => {
      if (!context.user) throw UnauthenticatedError();
      const node = await context.prisma.roadmapNode.findUnique({
        where: { id },
        include: { roadmap: true },
      });
      if (!node || node.roadmap.ownerId !== context.user.id) throw NotFoundError('Узел не найден');

      const data: { title?: string; done?: boolean } = {};
      if (title !== undefined && title !== null) data.title = title;
      if (done !== undefined && done !== null) data.done = done;

      return context.prisma.roadmapNode.update({ where: { id }, data });
    },

    deleteRoadmapNode: async (
      _: unknown,
      { id }: MutationDeleteRoadmapNodeArgs,
      context: Context,
    ) => {
      if (!context.user) throw UnauthenticatedError();
      const node = await context.prisma.roadmapNode.findUnique({
        where: { id },
        include: { roadmap: true },
      });
      if (!node || node.roadmap.ownerId !== context.user.id) throw NotFoundError('Узел не найден');

      await context.prisma.roadmapNode.delete({ where: { id } });

      await context.prisma.roadmapNode.updateMany({
        where: {
          roadmapId: node.roadmapId,
          parentId: node.parentId,
          order: { gt: node.order },
        },
        data: { order: { decrement: 1 } },
      });

      return true;
    },

    reorderRoadmapNodes: async (
      _: unknown,
      { roadmapId, parentId, nodeIds }: MutationReorderRoadmapNodesArgs,
      context: Context,
    ) => {
      if (!context.user) throw UnauthenticatedError();
      const roadmap = await context.prisma.roadmap.findUnique({ where: { id: roadmapId } });
      if (roadmap?.ownerId !== context.user.id) throw NotFoundError('Роадмап не найден');

      await context.prisma.$transaction(
        nodeIds.map((nodeId, index) =>
          context.prisma.roadmapNode.update({
            where: { id: nodeId },
            data: { order: index },
          }),
        ),
      );

      return context.prisma.roadmapNode.findMany({
        where: { roadmapId, parentId: parentId ?? null },
        orderBy: { order: 'asc' },
      });
    },
  },

  Roadmap: {
    nodes: (parent: { id: string }, _: unknown, context: Context) =>
      context.prisma.roadmapNode.findMany({
        where: { roadmapId: parent.id, parentId: null },
        orderBy: { order: 'asc' },
      }),
  },

  RoadmapNode: {
    children: (parent: { id: string; roadmapId: string }, _: unknown, context: Context) =>
      context.prisma.roadmapNode.findMany({
        where: { roadmapId: parent.roadmapId, parentId: parent.id },
        orderBy: { order: 'asc' },
      }),
  },
};

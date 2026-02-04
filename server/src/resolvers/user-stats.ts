import type { Context } from '../lib/context.js';
import { UnauthenticatedError } from '../lib/errors.js';

export const userStatsResolvers = {
  Query: {
    userStats: async (
      _: unknown,
      { userId }: { userId: string },
      context: Context
    ) => {
      if (!context.user) throw UnauthenticatedError();

      const user = await context.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, avatarUrl: true },
      });
      if (!user) return null;

      const [totalCompleted, workspaces] = await Promise.all([
        context.prisma.card.count({
          where: { ownerId: userId, done: true },
        }),
        context.prisma.workspace.findMany({
          where: { ownerId: userId },
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, description: true, icon: true },
        }),
      ]);

      type WorkspaceRow = { id: string; title: string; description: string | null; icon: string | null };
      type GroupRow = { workspaceId: string | null; _count: { id: number } };

      const workspaceIds = workspaces.map((w: WorkspaceRow) => w.id);
      const counts: GroupRow[] =
        workspaceIds.length === 0
          ? []
          : await context.prisma.card.groupBy({
              by: ['workspaceId'],
              where: {
                ownerId: userId,
                workspaceId: { in: workspaceIds },
              },
              _count: { id: true },
            });
      const completedCounts: GroupRow[] =
        workspaceIds.length === 0
          ? []
          : await context.prisma.card.groupBy({
              by: ['workspaceId'],
              where: {
                ownerId: userId,
                workspaceId: { in: workspaceIds },
                done: true,
              },
              _count: { id: true },
            });

      const totalByWs = new Map(counts.map((c: GroupRow) => [c.workspaceId, c._count.id]));
      const completedByWs = new Map(
        completedCounts.map((c: GroupRow) => [c.workspaceId, c._count.id])
      );

      const workspaceStats = workspaces.map((w: WorkspaceRow) => ({
        id: w.id,
        title: w.title,
        description: w.description,
        icon: w.icon,
        totalCards: totalByWs.get(w.id) ?? 0,
        completedCards: completedByWs.get(w.id) ?? 0,
      }));

      return {
        id: user.id,
        avatarUrl: user.avatarUrl,
        totalCompletedCards: totalCompleted,
        workspaceStats,
      };
    },
  },
};

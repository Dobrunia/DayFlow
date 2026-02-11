import { randomBytes } from 'crypto';
import type { Workspace } from '@prisma/client';
import type { Context } from '../lib/types.js';
import type {
  MutationCreateWorkspaceArgs,
  MutationUpdateWorkspaceArgs,
  MutationDeleteWorkspaceArgs,
  MutationToggleWorkspacePinnedArgs,
  QueryWorkspaceArgs,
} from '../generated/types.js';
import { UnauthenticatedError, NotFoundError, BadRequestError } from '../lib/errors.js';
import { MAX_TITLE_LENGTH, MAX_WORKSPACES_PER_USER, WORKSPACE_LOCK_TIMEOUT_MS } from '../lib/constants.js';

/** Check if user is owner or member of workspace */
async function canAccess(
  prisma: Context['prisma'],
  workspaceId: string,
  userId: string,
): Promise<Workspace | null> {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) return null;
  if (workspace.ownerId === userId) return workspace;
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  return membership ? workspace : null;
}

function generateToken(): string {
  return randomBytes(24).toString('base64url');
}

export const workspaceResolvers = {
  Query: {
    workspace: async (_: unknown, { id }: QueryWorkspaceArgs, context: Context) => {
      if (!context.user) throw UnauthenticatedError();
      return canAccess(context.prisma, id, context.user.id);
    },

    myWorkspaces: async (_: unknown, __: unknown, context: Context) => {
      if (!context.user) throw UnauthenticatedError();
      const userId = context.user.id;

      // Own workspaces + workspaces where user is a member + per-user pins
      const [owned, memberships, pins] = await Promise.all([
        context.prisma.workspace.findMany({
          where: { ownerId: userId },
          orderBy: { createdAt: 'desc' },
        }),
        context.prisma.workspaceMember.findMany({
          where: { userId },
          include: { workspace: true },
        }),
        context.prisma.userWorkspacePin.findMany({
          where: { userId },
          select: { workspaceId: true },
        }),
      ]);

      const pinnedIds = new Set(pins.map((p) => p.workspaceId));
      const memberWorkspaces = memberships.map((m) => m.workspace);
      const ownedIds = new Set(owned.map((w) => w.id));
      const all = [...owned, ...memberWorkspaces.filter((w) => !ownedIds.has(w.id))];
      // Annotate _pinnedByUser so the field resolver can skip a DB query
      return all.map((w) => ({ ...w, _pinnedByUser: pinnedIds.has(w.id) }));
    },
  },

  Mutation: {
    createWorkspace: async (
      _: unknown,
      { input }: MutationCreateWorkspaceArgs,
      context: Context,
    ) => {
      if (!context.user) throw UnauthenticatedError();
      if (input.title && input.title.length > MAX_TITLE_LENGTH) {
        throw BadRequestError(`Название слишком длинное (макс. ${MAX_TITLE_LENGTH} символов)`);
      }

      const workspaceCount = await context.prisma.workspace.count({
        where: { ownerId: context.user.id },
      });
      if (workspaceCount >= MAX_WORKSPACES_PER_USER) {
        throw BadRequestError(`Максимум ${MAX_WORKSPACES_PER_USER} воркспейсов на аккаунт`);
      }

      return context.prisma.workspace.create({
        data: {
          title: input.title,
          description: input.description,
          icon: input.icon ?? null,
          ownerId: context.user.id,
          columns: {
            create: { title: 'To Do', order: 0 },
          },
        },
        include: { columns: true },
      });
    },

    updateWorkspace: async (
      _: unknown,
      { id, input }: MutationUpdateWorkspaceArgs,
      context: Context,
    ) => {
      if (!context.user) throw UnauthenticatedError();
      if (input.title && input.title.length > MAX_TITLE_LENGTH) {
        throw BadRequestError(`Название слишком длинное (макс. ${MAX_TITLE_LENGTH} символов)`);
      }
      const workspace = await context.prisma.workspace.findUnique({ where: { id } });
      if (!workspace || workspace.ownerId !== context.user.id)
        throw NotFoundError('Рабочее пространство не найдено');
      const data: { title?: string; description?: string | null; icon?: string | null } = {};
      if (input.title != null) data.title = input.title;
      if (input.description !== undefined) data.description = input.description ?? null;
      if (input.icon !== undefined) data.icon = input.icon ?? null;
      return context.prisma.workspace.update({ where: { id }, data });
    },

    deleteWorkspace: async (
      _: unknown,
      { id }: MutationDeleteWorkspaceArgs,
      context: Context,
    ) => {
      if (!context.user) throw UnauthenticatedError();
      const workspace = await context.prisma.workspace.findUnique({ where: { id } });
      if (!workspace || workspace.ownerId !== context.user.id)
        throw NotFoundError('Рабочее пространство не найдено');
      await context.prisma.workspace.delete({ where: { id } });
      return true;
    },

    toggleWorkspacePinned: async (
      _: unknown,
      { id }: MutationToggleWorkspacePinnedArgs,
      context: Context,
    ) => {
      if (!context.user) throw UnauthenticatedError();
      const ws = await canAccess(context.prisma, id, context.user.id);
      if (!ws) throw NotFoundError('Рабочее пространство не найдено');

      const userId = context.user.id;
      const existing = await context.prisma.userWorkspacePin.findUnique({
        where: { userId_workspaceId: { userId, workspaceId: id } },
      });

      if (existing) {
        await context.prisma.userWorkspacePin.delete({
          where: { id: existing.id },
        });
      } else {
        await context.prisma.userWorkspacePin.create({
          data: { userId, workspaceId: id },
        });
      }

      // Return workspace — pinned will be resolved per-user by the field resolver
      return ws;
    },

    // ── Sharing ────────────────────────────────────────────────────────────────

    generateInviteToken: async (
      _: unknown,
      { workspaceId }: { workspaceId: string },
      context: Context,
    ) => {
      if (!context.user) throw UnauthenticatedError();
      const workspace = await context.prisma.workspace.findUnique({
        where: { id: workspaceId },
      });
      if (!workspace || workspace.ownerId !== context.user.id)
        throw NotFoundError('Рабочее пространство не найдено');

      return context.prisma.workspace.update({
        where: { id: workspaceId },
        data: { inviteToken: generateToken() },
      });
    },

    acceptInvite: async (
      _: unknown,
      { token }: { token: string },
      context: Context,
    ) => {
      if (!context.user) throw UnauthenticatedError();

      const workspace = await context.prisma.workspace.findUnique({
        where: { inviteToken: token },
      });
      if (!workspace) throw NotFoundError('Ссылка недействительна');

      // Owner doesn't need to join
      if (workspace.ownerId === context.user.id) return workspace;

      // Upsert membership (idempotent)
      await context.prisma.workspaceMember.upsert({
        where: {
          workspaceId_userId: {
            workspaceId: workspace.id,
            userId: context.user.id,
          },
        },
        create: { workspaceId: workspace.id, userId: context.user.id },
        update: {},
      });

      return workspace;
    },

    removeWorkspaceMember: async (
      _: unknown,
      { workspaceId, userId }: { workspaceId: string; userId: string },
      context: Context,
    ) => {
      if (!context.user) throw UnauthenticatedError();
      const workspace = await context.prisma.workspace.findUnique({
        where: { id: workspaceId },
      });
      if (!workspace || workspace.ownerId !== context.user.id)
        throw NotFoundError('Рабочее пространство не найдено');

      await context.prisma.workspaceMember.deleteMany({
        where: { workspaceId, userId },
      });
      return true;
    },

    // ── Editing lock ──────────────────────────────────────────────────────────

    acquireWorkspaceLock: async (
      _: unknown,
      { workspaceId }: { workspaceId: string },
      context: Context,
    ) => {
      if (!context.user) throw UnauthenticatedError();
      const ws = await canAccess(context.prisma, workspaceId, context.user.id);
      if (!ws) throw NotFoundError('Рабочее пространство не найдено');

      const userId = context.user.id;
      const now = new Date();
      const expiredBefore = new Date(Date.now() - WORKSPACE_LOCK_TIMEOUT_MS);

      // Atomic conditional update: succeed only if lock is free, expired, or already ours
      const result = await context.prisma.workspace.updateMany({
        where: {
          id: workspaceId,
          OR: [
            { editingBy: null },                         // no lock
            { editingBy: userId },                       // already ours
            { editingAt: { lt: expiredBefore } },        // expired lock
          ],
        },
        data: { editingBy: userId, editingAt: now },
      });

      if (result.count === 0) {
        throw BadRequestError('Воркспейс сейчас редактирует другой пользователь');
      }

      return context.prisma.workspace.findUnique({ where: { id: workspaceId } });
    },

    releaseWorkspaceLock: async (
      _: unknown,
      { workspaceId }: { workspaceId: string },
      context: Context,
    ) => {
      if (!context.user) throw UnauthenticatedError();
      const ws = await canAccess(context.prisma, workspaceId, context.user.id);
      if (!ws) throw NotFoundError('Рабочее пространство не найдено');

      // Only the lock holder can release
      if (ws.editingBy !== context.user.id) return ws;

      return context.prisma.workspace.update({
        where: { id: workspaceId },
        data: { editingBy: null, editingAt: null },
      });
    },

    transferWorkspaceLock: async (
      _: unknown,
      { workspaceId, toUserId }: { workspaceId: string; toUserId: string },
      context: Context,
    ) => {
      if (!context.user) throw UnauthenticatedError();
      const ws = await canAccess(context.prisma, workspaceId, context.user.id);
      if (!ws) throw NotFoundError('Рабочее пространство не найдено');

      // Only the current lock holder can transfer
      if (ws.editingBy !== context.user.id) {
        throw BadRequestError('Вы не удерживаете блокировку');
      }

      // Verify target user has access
      const targetAccess = await canAccess(context.prisma, workspaceId, toUserId);
      if (!targetAccess) {
        throw NotFoundError('Целевой пользователь не имеет доступа к воркспейсу');
      }

      return context.prisma.workspace.update({
        where: { id: workspaceId },
        data: { editingBy: toUserId, editingAt: new Date() },
      });
    },

    heartbeatWorkspaceLock: async (
      _: unknown,
      { workspaceId }: { workspaceId: string },
      context: Context,
    ) => {
      if (!context.user) throw UnauthenticatedError();
      const ws = await canAccess(context.prisma, workspaceId, context.user.id);
      if (!ws) throw NotFoundError('Рабочее пространство не найдено');

      // Only extend if we hold the lock
      if (ws.editingBy !== context.user.id) return ws;

      return context.prisma.workspace.update({
        where: { id: workspaceId },
        data: { editingAt: new Date() },
      });
    },
  },

  Workspace: {
    // Per-user pinned: use annotation from myWorkspaces, or query DB for single fetch
    pinned: async (parent: Workspace & { _pinnedByUser?: boolean }, _: unknown, context: Context) => {
      if (typeof parent._pinnedByUser === 'boolean') return parent._pinnedByUser;
      if (!context.user) return false;
      const pin = await context.prisma.userWorkspacePin.findUnique({
        where: { userId_workspaceId: { userId: context.user.id, workspaceId: parent.id } },
      });
      return !!pin;
    },
    owner: (parent: Workspace, _: unknown, context: Context) =>
      context.loaders.userById.load(parent.ownerId),
    // inviteToken: only visible to owner
    inviteToken: (parent: Workspace, _: unknown, context: Context) => {
      if (!context.user || parent.ownerId !== context.user.id) return null;
      return parent.inviteToken;
    },
    // Resolve editingBy: clear expired locks transparently
    editingBy: (parent: Workspace) => {
      if (
        parent.editingBy &&
        parent.editingAt &&
        Date.now() - parent.editingAt.getTime() < WORKSPACE_LOCK_TIMEOUT_MS
      ) {
        return parent.editingBy;
      }
      return null;
    },
    editingUser: async (parent: Workspace, _: unknown, context: Context) => {
      if (
        !parent.editingBy ||
        !parent.editingAt ||
        Date.now() - parent.editingAt.getTime() >= WORKSPACE_LOCK_TIMEOUT_MS
      ) {
        return null;
      }
      return context.loaders.userById.load(parent.editingBy);
    },
    members: (parent: Workspace, _: unknown, context: Context) =>
      context.prisma.workspaceMember.findMany({
        where: { workspaceId: parent.id },
        include: { user: true },
      }),
    columns: (parent: Workspace, _: unknown, context: Context) =>
      context.loaders.columnsByWorkspaceId.load(parent.id),
    cards: (parent: Workspace, _: unknown, context: Context) =>
      context.loaders.cardsByWorkspaceId.load(parent.id),
    backlog: async (parent: Workspace, _: unknown, context: Context) => {
      if (!context.user) return [];
      return context.prisma.card.findMany({
        where: {
          workspaceId: parent.id,
          columnId: null,
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      });
    },
    tools: async (parent: Workspace, _: unknown, context: Context) => {
      if (!context.user) return [];
      return context.prisma.tool.findMany({
        where: { workspaceId: parent.id },
        orderBy: { createdAt: 'desc' },
      });
    },
    roadmap: async (parent: Workspace, _: unknown, context: Context) => {
      if (!context.user) return null;
      return context.prisma.roadmap.findUnique({
        where: { workspaceId: parent.id },
      });
    },
  },
};

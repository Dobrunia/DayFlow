/**
 * Workspace lock middleware.
 *
 * Wraps every Mutation resolver: before calling the original resolver,
 * resolves workspaceId from the mutation arguments and asserts that the
 * calling user holds a valid editing lock on that workspace.
 *
 * Hub-only entities (cards/tools without workspaceId) are NOT checked —
 * they belong to a single user and don't need locking.
 */

import type { PrismaClient } from '@prisma/client';
import { assertWorkspaceLock } from './workspace-access.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResolverFn = (...args: any[]) => any;
type ResolverMap = Record<string, ResolverFn>;

interface MutationContext {
  user?: { id: string } | null;
  prisma: PrismaClient;
}

/** Mutations that should NEVER be lock-checked. */
const SKIP_LOCK_CHECK = new Set([
  // Auth
  'signUp',
  'signIn',
  'signOut',
  'updateProfile',
  // Workspace lifecycle (not content editing)
  'createWorkspace',
  'deleteWorkspace',
  'toggleWorkspacePinned',
  // Sharing
  'generateInviteToken',
  'acceptInvite',
  'removeWorkspaceMember',
  // Lock management itself
  'acquireWorkspaceLock',
  'releaseWorkspaceLock',
  'heartbeatWorkspaceLock',
  'transferWorkspaceLock',
]);

/**
 * Resolve workspaceId from mutation arguments.
 *
 * Strategy:
 * 1. Direct arg: `workspaceId` or `input.workspaceId`
 * 2. Column lookup: `id` → column.workspaceId
 * 3. Card lookup: `id` / `input` → card.workspaceId
 * 4. Tool lookup: `id` → tool.workspaceId
 * 5. Roadmap/node lookup: `id` / `roadmapId` → roadmap.workspaceId
 *
 * Returns null if the entity is hub-only (no workspace) → skip lock check.
 */
async function resolveWorkspaceId(
  mutationName: string,
  args: Record<string, unknown>,
  prisma: PrismaClient,
): Promise<string | null> {
  // Direct workspaceId arg (createColumn, reorderColumns, createRoadmap, etc.)
  if (typeof args.workspaceId === 'string') return args.workspaceId;

  // Input object with workspaceId (createCard, createTool)
  const input = args.input as Record<string, unknown> | undefined;
  if (input?.workspaceId && typeof input.workspaceId === 'string') return input.workspaceId;

  // createCard may have columnId without explicit workspaceId — resolve via column
  if (input?.columnId && typeof input.columnId === 'string' && !input.workspaceId) {
    const col = await prisma.column.findUnique({
      where: { id: input.columnId as string },
      select: { workspaceId: true },
    });
    return col?.workspaceId ?? null;
  }

  // updateWorkspace uses `id` which IS the workspaceId
  if (mutationName === 'updateWorkspace' && typeof args.id === 'string') return args.id;

  const id = (args.id ?? input?.id) as string | undefined;

  // Roadmap mutations — check early because some have roadmapId but no id
  if (mutationName.toLowerCase().includes('roadmap')) {
    return resolveRoadmapWorkspaceId(mutationName, args, id, prisma);
  }

  if (!id) return null;

  // Column mutations (updateColumn, deleteColumn)
  if (mutationName.toLowerCase().includes('column')) {
    const col = await prisma.column.findUnique({
      where: { id },
      select: { workspaceId: true },
    });
    return col?.workspaceId ?? null;
  }

  // Card mutations (updateCard, deleteCard, moveCard)
  if (mutationName.toLowerCase().includes('card')) {
    const card = await prisma.card.findUnique({
      where: { id },
      select: { workspaceId: true },
    });
    return card?.workspaceId ?? null; // null = hub card, skip lock
  }

  // Tool mutations (updateTool, deleteTool)
  if (mutationName.toLowerCase().includes('tool')) {
    const tool = await prisma.tool.findUnique({
      where: { id },
      select: { workspaceId: true },
    });
    return tool?.workspaceId ?? null; // null = hub tool, skip lock
  }

  return null;
}

/** Resolve workspaceId for roadmap-related mutations. */
async function resolveRoadmapWorkspaceId(
  mutationName: string,
  args: Record<string, unknown>,
  id: string | undefined,
  prisma: PrismaClient,
): Promise<string | null> {
  // Node mutations (updateRoadmapNode, deleteRoadmapNode) — `id` is node id
  if ((mutationName === 'updateRoadmapNode' || mutationName === 'deleteRoadmapNode') && id) {
    const node = await prisma.roadmapNode.findUnique({
      where: { id },
      select: { roadmap: { select: { workspaceId: true } } },
    });
    return node?.roadmap?.workspaceId ?? null;
  }

  // deleteRoadmap — `id` is roadmap id
  if (mutationName === 'deleteRoadmap' && id) {
    const rm = await prisma.roadmap.findUnique({
      where: { id },
      select: { workspaceId: true },
    });
    return rm?.workspaceId ?? null;
  }

  // Mutations with direct roadmapId arg: createRoadmapNode, reorderRoadmapNodes
  const roadmapId = args.roadmapId as string | undefined;
  if (roadmapId) {
    const rm = await prisma.roadmap.findUnique({
      where: { id: roadmapId },
      select: { workspaceId: true },
    });
    return rm?.workspaceId ?? null;
  }

  return null;
}

/**
 * Wrap all Mutation resolvers with workspace lock checking.
 */
export function withLockMiddleware(mutations: ResolverMap): ResolverMap {
  const wrapped: ResolverMap = {};

  for (const [name, resolver] of Object.entries(mutations)) {
    if (SKIP_LOCK_CHECK.has(name)) {
      wrapped[name] = resolver;
      continue;
    }

    wrapped[name] = async (
      parent: unknown,
      args: Record<string, unknown>,
      context: MutationContext,
      info: unknown,
    ) => {
      if (context.user) {
        const workspaceId = await resolveWorkspaceId(name, args, context.prisma);
        if (workspaceId) {
          await assertWorkspaceLock(context.prisma, workspaceId, context.user.id);
        }
      }
      return resolver(parent, args, context, info);
    };
  }

  return wrapped;
}

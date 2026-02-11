import type { PrismaClient } from '@prisma/client';
import { ForbiddenError } from './errors.js';
import { WORKSPACE_LOCK_TIMEOUT_MS } from './constants.js';

/**
 * Check if a user can access a workspace (is owner or member).
 * Returns true if the user has access, false otherwise.
 */
export async function hasWorkspaceAccess(
  prisma: PrismaClient,
  workspaceId: string,
  userId: string,
): Promise<boolean> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { ownerId: true },
  });
  if (!workspace) return false;
  if (workspace.ownerId === userId) return true;

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { id: true },
  });
  return !!member;
}

/**
 * Assert that the user currently holds a valid (non-expired) editing lock
 * on the given workspace. Throws ForbiddenError otherwise.
 *
 * Call this before any workspace-mutating operation (card/column/tool/roadmap CRUD).
 */
export async function assertWorkspaceLock(
  prisma: PrismaClient,
  workspaceId: string,
  userId: string,
): Promise<void> {
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { editingBy: true, editingAt: true },
  });
  if (!ws) return; // workspace not found — downstream resolver will throw NotFoundError

  // No lock at all — nobody can edit
  if (!ws.editingBy || !ws.editingAt) {
    throw ForbiddenError('Никто не удерживает блокировку — редактирование невозможно');
  }

  // Lock expired
  if (Date.now() - ws.editingAt.getTime() >= WORKSPACE_LOCK_TIMEOUT_MS) {
    throw ForbiddenError('Блокировка истекла — обновите страницу');
  }

  // Lock held by someone else
  if (ws.editingBy !== userId) {
    throw ForbiddenError('Воркспейс редактирует другой пользователь');
  }
}

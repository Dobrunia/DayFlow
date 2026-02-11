import type { PrismaClient } from '@prisma/client';

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

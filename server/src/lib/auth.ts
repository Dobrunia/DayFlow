import { randomBytes, createHash } from 'crypto';
import { prisma } from './prisma.js';
import { SESSION_EXPIRY_DAYS } from './constants.js';

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const hashedToken = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      id: hashedToken,
      userId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function validateSession(token: string): Promise<{
  user: { id: string; email: string } | null;
  session: { id: string; expiresAt: Date } | null;
}> {
  if (!token) return { user: null, session: null };

  const hashedToken = hashSessionToken(token);
  const session = await prisma.session.findUnique({
    where: { id: hashedToken },
    include: { user: true },
  });

  if (!session) return { user: null, session: null };

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: hashedToken } });
    return { user: null, session: null };
  }

  // Extend session if more than half expired
  const halfLife = SESSION_EXPIRY_DAYS * 12 * 60 * 60 * 1000;
  if (session.expiresAt.getTime() - Date.now() < halfLife) {
    const newExpiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    await prisma.session.update({
      where: { id: hashedToken },
      data: { expiresAt: newExpiresAt },
    });
  }

  return {
    user: { id: session.user.id, email: session.user.email },
    session: { id: session.id, expiresAt: session.expiresAt },
  };
}

export async function invalidateSession(token: string): Promise<void> {
  const hashedToken = hashSessionToken(token);
  await prisma.session.deleteMany({ where: { id: hashedToken } });
}

import { randomBytes, createHash } from 'crypto';
import { prisma } from './prisma.js';

const SESSION_EXPIRY_DAYS = 30;

// Generate secure session token
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

// Hash session token for storage (prevents timing attacks)
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Create new session
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

// Validate session and return user
export async function validateSession(token: string): Promise<{
  user: { id: string; email: string } | null;
  session: { id: string; expiresAt: Date } | null;
}> {
  if (!token) {
    return { user: null, session: null };
  }

  const hashedToken = hashSessionToken(token);

  const session = await prisma.session.findUnique({
    where: { id: hashedToken },
    include: { user: true },
  });

  if (!session) {
    return { user: null, session: null };
  }

  // Check if expired
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

// Invalidate session
export async function invalidateSession(token: string): Promise<void> {
  const hashedToken = hashSessionToken(token);
  await prisma.session.deleteMany({ where: { id: hashedToken } });
}

// Cookie helpers
export const SESSION_COOKIE_NAME = 'dayflow_session';

const isProd = process.env.NODE_ENV === 'production';

export function createSessionCookie(
  token: string,
  expiresAt: Date
): {
  name: string;
  value: string;
  attributes: Record<string, unknown>;
} {
  return {
    name: SESSION_COOKIE_NAME,
    value: token,
    attributes: {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'None' : 'Lax',
      path: '/',
      expires: expiresAt,
    },
  };
}

export function createBlankSessionCookie(): {
  name: string;
  value: string;
  attributes: Record<string, unknown>;
} {
  return {
    name: SESSION_COOKIE_NAME,
    value: '',
    attributes: {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'None' : 'Lax',
      path: '/',
      maxAge: 0,
    },
  };
}

// Parse session token from cookie header
export function parseSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies[SESSION_COOKIE_NAME] || null;
}

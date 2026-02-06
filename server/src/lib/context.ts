import type { YogaInitialContext } from 'graphql-yoga';
import { validateSession, parseSessionCookie } from './auth.js';
import { prisma } from './prisma.js';
import { createDataLoaders } from './dataloaders.js';
import type { Context, SessionUser } from 'dayflow-shared/backend';

export type { Context, SessionUser } from 'dayflow-shared/backend';

export async function createContext(initialContext: YogaInitialContext): Promise<Context> {
  const { request } = initialContext;

  const cookieHeader = request.headers.get('cookie');
  const sessionToken = parseSessionCookie(cookieHeader);

  // Get client IP from headers (for proxied requests) or connection
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0]?.trim() ?? realIp ?? 'unknown';

  let user: SessionUser | null = null;

  if (sessionToken) {
    const result = await validateSession(sessionToken);
    user = result.user;
  }

  // Cookie storage for response
  const cookies = new Map<string, { value: string; attributes: Record<string, unknown> } | null>();

  return {
    prisma,
    user,
    sessionToken,
    ip,
    loaders: createDataLoaders(),
    setCookie: (name: string, value: string, attributes: Record<string, unknown>) => {
      cookies.set(name, { value, attributes });
    },
    deleteCookie: (name: string) => {
      cookies.set(name, null);
    },
  };
}

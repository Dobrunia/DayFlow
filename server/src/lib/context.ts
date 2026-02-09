import type { YogaInitialContext } from 'graphql-yoga';
import { validateSession } from './auth.js';
import { prisma } from './prisma.js';
import { createDataLoaders } from './dataloaders.js';
import type { Context, SessionUser } from './types.js';

export async function createContext(initialContext: YogaInitialContext): Promise<Context> {
  const { request } = initialContext;

  const authHeader = request.headers.get('authorization');
  const sessionToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0]?.trim() ?? realIp ?? 'unknown';

  let user: SessionUser | null = null;

  if (sessionToken) {
    try {
      const result = await validateSession(sessionToken);
      user = result.user;
    } catch {
      user = null;
    }
  }

  return {
    prisma,
    user,
    sessionToken,
    ip,
    loaders: createDataLoaders(),
  };
}

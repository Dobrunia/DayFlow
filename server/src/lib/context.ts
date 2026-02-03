import type { YogaInitialContext } from 'graphql-yoga';
import { validateSession, parseSessionCookie } from './auth.js';
import { prisma } from './prisma.js';
import { createDataLoaders, type DataLoaders } from './dataloaders.js';

export interface SessionUser {
  id: string;
  email: string;
}

export interface Context {
  prisma: typeof prisma;
  user: SessionUser | null;
  sessionToken: string | null;
  loaders: DataLoaders;
  setCookie: (name: string, value: string, attributes: Record<string, unknown>) => void;
  deleteCookie: (name: string) => void;
}

export async function createContext(initialContext: YogaInitialContext): Promise<Context> {
  const { request } = initialContext;

  // Get session token from cookie
  const cookieHeader = request.headers.get('cookie');
  const sessionToken = parseSessionCookie(cookieHeader);

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
    loaders: createDataLoaders(),
    setCookie: (name: string, value: string, attributes: Record<string, unknown>) => {
      cookies.set(name, { value, attributes });
    },
    deleteCookie: (name: string) => {
      cookies.set(name, null);
    },
  };
}

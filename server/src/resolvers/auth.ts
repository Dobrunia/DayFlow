import { hash, verify } from 'argon2';
import {
  createSession,
  invalidateSession,
  createSessionCookie,
  createBlankSessionCookie,
} from '../lib/auth.js';
import type { Context } from '../lib/context.js';

export const authResolvers = {
  Mutation: {
    signUp: async (
      _: unknown,
      { email, password }: { email: string; password: string },
      context: Context
    ) => {
      // Validate email
      if (!email || !email.includes('@')) {
        throw new Error('Invalid email address');
      }

      // Validate password
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Check if user exists
      const existing = await context.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existing) {
        throw new Error('User with this email already exists');
      }

      // Create user
      const passwordHash = await hash(password);
      const user = await context.prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
        },
      });

      // Create session
      const { token, expiresAt } = await createSession(user.id);
      const sessionCookie = createSessionCookie(token, expiresAt);

      context.setCookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

      return { user };
    },

    signIn: async (
      _: unknown,
      { email, password }: { email: string; password: string },
      context: Context
    ) => {
      const user = await context.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        throw new Error('Invalid email or password');
      }

      const validPassword = await verify(user.passwordHash, password);

      if (!validPassword) {
        throw new Error('Invalid email or password');
      }

      // Create session
      const { token, expiresAt } = await createSession(user.id);
      const sessionCookie = createSessionCookie(token, expiresAt);

      context.setCookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

      return { user };
    },

    signOut: async (_: unknown, __: unknown, context: Context) => {
      if (context.sessionToken) {
        await invalidateSession(context.sessionToken);
      }

      const blankCookie = createBlankSessionCookie();
      context.setCookie(blankCookie.name, blankCookie.value, blankCookie.attributes);

      return true;
    },
  },

  Query: {
    me: async (_: unknown, __: unknown, context: Context) => {
      if (!context.user) {
        return null;
      }

      return context.prisma.user.findUnique({
        where: { id: context.user.id },
      });
    },
  },
};

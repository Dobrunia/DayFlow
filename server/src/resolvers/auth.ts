import { hash, verify } from 'argon2';
import {
  createSession,
  invalidateSession,
  // createSessionCookie,
  // createBlankSessionCookie,
} from '../lib/auth.js';
import type { Context } from '../lib/context.js';
import { BadRequestError, UnauthenticatedError } from '../lib/errors.js';

export const authResolvers = {
  Mutation: {
    signUp: async (
      _: unknown,
      { email, password }: { email: string; password: string },
      context: Context
    ) => {
      // Validate email
      if (!email || !email.includes('@')) {
        throw BadRequestError('Invalid email address');
      }
      if (!password || password.length < 6) {
        throw BadRequestError('Password must be at least 6 characters');
      }

      // Check if user exists
      const existing = await context.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existing) {
        throw BadRequestError('User with this email already exists');
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
      const { token } = await createSession(user.id);

      return { user, token };
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
        throw BadRequestError('Invalid email or password');
      }
      const validPassword = await verify(user.passwordHash, password);
      if (!validPassword) {
        throw BadRequestError('Invalid email or password');
      }

      // Create session
      const { token } = await createSession(user.id);

      return { user, token };
    },

    signOut: async (_: unknown, __: unknown, context: Context) => {
      if (context.sessionToken) {
        await invalidateSession(context.sessionToken);
      }

      return true;
    },

    updateProfile: async (
      _: unknown,
      { avatarUrl }: { avatarUrl?: string | null },
      context: Context
    ) => {
      if (!context.user) throw UnauthenticatedError();
      const url = avatarUrl?.trim() || null;
      return context.prisma.user.update({
        where: { id: context.user.id },
        data: { avatarUrl: url },
      });
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

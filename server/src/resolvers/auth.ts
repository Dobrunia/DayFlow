import { hash, verify } from 'argon2';
import {
  createSession,
  invalidateSession,
} from '../lib/auth.js';
import type { Context } from '../lib/types.js';
import type {
  MutationSignUpArgs,
  MutationSignInArgs,
  MutationUpdateProfileArgs,
} from '../generated/types.js';
import { BadRequestError, UnauthenticatedError } from '../lib/errors.js';

export const authResolvers = {
  Mutation: {
    signUp: async (
      _: unknown,
      { email, password }: MutationSignUpArgs,
      context: Context
    ) => {
      // Validate email
      if (!email || !email.includes('@')) {
        throw BadRequestError('Неверный адрес электронной почты');
      }
      if (!password || password.length < 6) {
        throw BadRequestError('Пароль должен содержать минимум 6 символов');
      }

      // Check if user exists
      const existing = await context.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existing) {
        throw BadRequestError('Этот email уже используется');
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
      { email, password }: MutationSignInArgs,
      context: Context
    ) => {
      const user = await context.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        throw BadRequestError('Неверный email или пароль');
      }
      const validPassword = await verify(user.passwordHash, password);
      if (!validPassword) {
        throw BadRequestError('Неверный email или пароль');
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
      { avatarUrl }: MutationUpdateProfileArgs,
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

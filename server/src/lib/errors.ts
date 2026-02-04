import { GraphQLError } from 'graphql';

export const ErrorCodes = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  INTERNAL: 'INTERNAL',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

function createError(code: ErrorCode, message: string, extensions?: Record<string, unknown>): GraphQLError {
  return new GraphQLError(message, {
    extensions: { code, ...extensions },
  });
}

export function UnauthenticatedError(message = 'Not authenticated'): GraphQLError {
  return createError(ErrorCodes.UNAUTHENTICATED, message);
}

export function ForbiddenError(message: string): GraphQLError {
  return createError(ErrorCodes.FORBIDDEN, message);
}

export function NotFoundError(message: string): GraphQLError {
  return createError(ErrorCodes.NOT_FOUND, message);
}

export function BadRequestError(message: string): GraphQLError {
  return createError(ErrorCodes.BAD_REQUEST, message);
}

export function InternalError(message = 'Something went wrong'): GraphQLError {
  return createError(ErrorCodes.INTERNAL, message);
}

/** Преобразует любую ошибку в GraphQLError; для неожиданных — INTERNAL, в prod без утечки деталей. */
export function toGraphQLError(err: unknown): GraphQLError {
  if (err instanceof GraphQLError) return err;
  const isProd = process.env.NODE_ENV === 'production';
  const message =
    isProd ? 'Something went wrong' : (err instanceof Error ? err.message : 'Unknown error');
  return createError(ErrorCodes.INTERNAL, message);
}

/** Оборачивает execute: ловит любую ошибку и возвращает { errors: [GraphQLError] }, бэк не падает. */
export function wrapExecuteWithErrorHandler(executeFn: (args: unknown) => Promise<unknown>) {
  return async (args: unknown) => {
    try {
      return await executeFn(args);
    } catch (err) {
      return { errors: [toGraphQLError(err)] };
    }
  };
}

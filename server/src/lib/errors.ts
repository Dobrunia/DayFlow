import { GraphQLError } from 'graphql';
import { ErrorCodes, type ErrorCode } from 'dayflow-shared';

function createError(code: ErrorCode, message: string, extensions?: Record<string, unknown>): GraphQLError {
  return new GraphQLError(message, {
    extensions: { code, ...extensions },
  });
}

export function UnauthenticatedError(message = 'Нужно войти в аккаунт'): GraphQLError {
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

export function InternalError(message = 'Ошибка сервера'): GraphQLError {
  return createError(ErrorCodes.INTERNAL, message);
}

export function RateLimitExceededError(message = 'Слишком много запросов. Подождите немного.'): GraphQLError {
  return createError(ErrorCodes.RATE_LIMIT_EXCEEDED, message);
}

/** Преобразует любую ошибку в GraphQLError; для неожиданных — INTERNAL, в prod без утечки деталей. */
export function toGraphQLError(err: unknown): GraphQLError {
  if (err instanceof GraphQLError) return err;
  // Handle RateLimitError from rate-limiter
  if (err instanceof Error && (err as { code?: string }).code === 'RATE_LIMIT_EXCEEDED') {
    return RateLimitExceededError(err.message);
  }
  const isProd = process.env.NODE_ENV === 'production';
  const message =
    isProd ? 'Ошибка сервера' : (err instanceof Error ? err.message : 'Unknown error');
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

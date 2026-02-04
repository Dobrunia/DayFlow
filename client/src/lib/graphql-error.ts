/**
 * Ошибки бэка приходят в GraphQL response: extensions.code + message.
 * Apollo при throw даёт ApolloError с graphQLErrors[].message и .extensions.
 */

export const ErrorCodes = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  INTERNAL: 'INTERNAL',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

const FALLBACK_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCodes.UNAUTHENTICATED]: 'Нужно войти в аккаунт',
  [ErrorCodes.FORBIDDEN]: 'Нет доступа',
  [ErrorCodes.NOT_FOUND]: 'Не найдено',
  [ErrorCodes.BAD_REQUEST]: 'Неверные данные',
  [ErrorCodes.INTERNAL]: 'Ошибка сервера. Попробуйте позже.',
};

interface GraphQLErrorLike {
  message?: string;
  extensions?: Record<string, unknown>;
}

function isApolloError(e: unknown): e is { graphQLErrors?: GraphQLErrorLike[]; message?: string } {
  return typeof e === 'object' && e !== null && 'graphQLErrors' in e;
}

/**
 * Достаёт из ошибки Apollo (или любой) код и сообщение бэка.
 * Для отображения в UI: message уже подходит (бэк шлёт осмысленный текст для BAD_REQUEST/NOT_FOUND).
 */
export function getGraphQLErrorInfo(e: unknown): { code: ErrorCode | null; message: string } {
  const fallback = { code: null as ErrorCode | null, message: (e as Error)?.message ?? 'Ошибка' };

  if (!isApolloError(e)) return fallback;

  const first = e.graphQLErrors?.[0];
  if (!first) return fallback;

  const code = (first.extensions?.code as ErrorCode | undefined) ?? null;
  const rawMessage = first.message;
  const message =
    rawMessage && rawMessage.length > 0
      ? rawMessage
      : code
        ? FALLBACK_MESSAGES[code]
        : fallback.message;

  return { code, message };
}

/**
 * Одно сообщение для тоста/error ref: либо с бэка, либо fallback по коду.
 */
export function getGraphQLErrorMessage(e: unknown): string {
  return getGraphQLErrorInfo(e).message;
}

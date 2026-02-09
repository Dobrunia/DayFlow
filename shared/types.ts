// ── Error codes (shared: server + client) ─────────────────────────────────────

export const ErrorCodes = {
  UNAUTHENTICATED: "UNAUTHENTICATED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  BAD_REQUEST: "BAD_REQUEST",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  INTERNAL: "INTERNAL",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// ── Limits ────────────────────────────────────────────────────────────────────

export const LIMITS = {
  MAX_TOOLS_PER_WORKSPACE: 30,
  MAX_CARDS_PER_USER: 500,
  MAX_WORKSPACES_PER_USER: 20,
  MAX_COLUMNS_PER_WORKSPACE: 20,
  MAX_TITLE_LENGTH: 191,
} as const;

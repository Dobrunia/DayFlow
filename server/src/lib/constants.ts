/**
 * Server-wide constants and limits
 */

// Session
export const SESSION_EXPIRY_DAYS = 30;

// Field length limits
export const MAX_TITLE_LENGTH = 191; // MySQL VARCHAR limit

// Entity limits
export const MAX_WORKSPACES_PER_USER = 20;
export const MAX_COLUMNS_PER_WORKSPACE = 20;
export const MAX_CARDS_PER_USER = 500;
export const MAX_TOOLS_PER_WORKSPACE = 30;

// Rate limiting
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
export const RATE_LIMIT_MAX_REQUESTS = 100; // requests per window
